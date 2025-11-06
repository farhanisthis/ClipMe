import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import {
  insertClipboardSchema,
  insertUserSchema,
  insertRoomSchema,
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

// Authentication middleware
interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

const authenticate = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
    };
    const user = await storage.getUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = { id: user.id, username: user.username };
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Room access validation middleware
const validateRoomAccess = async (req: any, res: any, next: any) => {
  try {
    const tag = req.params.tag?.toUpperCase();
    if (!tag) return next();

    const room = await storage.getRoom(tag);
    if (!room) {
      // Room doesn't exist, create it as open room
      await storage.createRoom({ tag, isLocked: false });
      console.log(`🏠 Auto-created room ${tag} for clipboard access`);
      return next();
    }

    if (room.isLocked && room.password) {
      const providedPassword =
        req.headers["x-room-password"] || req.body.roomPassword;

      if (!providedPassword) {
        return res.status(401).json({
          message: "Room is locked",
          requiresPassword: true,
        });
      }

      const isValid = await storage.validateRoomPassword(tag, providedPassword);
      if (!isValid) {
        return res.status(401).json({
          message: "Invalid room password",
          requiresPassword: true,
        });
      }
    }

    next();
  } catch (error) {
    console.error("Room access validation error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB limit
  },
});

// Helper function to get expiration info (no expiration for persistent storage)
function getExpirationInfo(updatedAt: Date): {
  minutesRemaining: null;
  expiresAt: null;
} {
  return {
    minutesRemaining: null,
    expiresAt: null,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rename a room (only creator can rename)
  app.patch("/api/rooms/:tag", authenticate, async (req, res) => {
    try {
      const oldTag = req.params.tag?.toUpperCase();
      const { newTag } = req.body;
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (
        !oldTag ||
        !newTag ||
        newTag.length !== 4 ||
        !/^[A-Z0-9]{4}$/.test(newTag)
      ) {
        return res.status(400).json({
          message: "Invalid new tag. Must be 4 alphanumeric characters.",
        });
      }
      const renamedRoom = await storage.renameRoom(oldTag, newTag, user.id);
      res.json({
        message: "Room renamed successfully",
        room: {
          id: renamedRoom.id,
          tag: renamedRoom.tag,
          isLocked: renamedRoom.isLocked,
          maxUsers: renamedRoom.maxUsers,
          createdAt: renamedRoom.createdAt,
        },
      });
    } catch (error: any) {
      if (
        error.message === "Room not found" ||
        error.message === "Unauthorized" ||
        error.message === "New tag already exists"
      ) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error renaming room:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a room (only creator can delete)
  app.delete("/api/rooms/:tag", authenticate, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const room = await storage.getRoom(tag);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      if (room.createdBy !== user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      await storage.deleteRoom(tag);
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Get clipboard history for a user in a room (registered users only)
  app.get("/api/clip/history/:tag", authenticate, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const userId = (req as any).user?.id;
      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const history = await storage.getClipboardHistoryByUser(tag, userId);
      res.json({ history });
    } catch (error) {
      console.error("Error fetching clipboard history:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Enable authentication middleware for all routes
  app.use(authenticate);

  // User authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);

      // Generate a random 4-character default room tag for the user
      const generateRandomTag = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let defaultRoomTag = generateRandomTag();

      // Ensure the generated tag is unique
      while (await storage.getRoom(defaultRoomTag)) {
        defaultRoomTag = generateRandomTag();
      }

      // Create the default room for the user
      const defaultRoom = await storage.createRoom({
        tag: defaultRoomTag,
        isLocked: false,
        maxUsers: 1, // Exclusive to this user
        createdBy: user.id,
        expiresAt: null, // Never expires for registered users
      });

      console.log(
        `🏠 Created default room ${defaultRoomTag} for user ${user.username}`
      );

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "User registered successfully",
        user: { id: user.id, username: user.username, avatar: user.avatar },
        token,
        defaultRoom: {
          tag: defaultRoom.tag,
          id: defaultRoom.id,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res
          .status(401)
          .json({ message: "Invalid username or password" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        user: { id: user.id, username: user.username, avatar: user.avatar },
        token,
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Room management routes
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const user = (req as any).user;

      // Check if room already exists
      const existingRoom = await storage.getRoom(roomData.tag);
      if (existingRoom) {
        return res.status(400).json({ message: "Room already exists" });
      }

      const room = await storage.createRoom({
        ...roomData,
        createdBy: user?.id || null,
      });

      res.json({
        message: "Room created successfully",
        room: {
          id: room.id,
          tag: room.tag,
          isLocked: room.isLocked,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: error.errors[0]?.message || "Invalid input" });
      }
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rooms/:tag", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const room = await storage.getRoom(tag);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      res.json({
        room: {
          id: room.id,
          tag: room.tag,
          isLocked: room.isLocked,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt,
          requiresPassword: !!room.password,
        },
      });
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rooms/:tag/validate", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const { password } = req.body;

      const room = await storage.getRoom(tag);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      if (!room.password) {
        return res.json({ valid: true });
      }

      const isValid = await storage.validateRoomPassword(tag, password);
      res.json({ valid: isValid });
    } catch (error) {
      console.error("Error validating room password:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's rooms (requires authentication)
  app.get("/api/user/rooms", async (req, res) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userRooms = await storage.getUserRooms(user.id);

      res.json({
        rooms: userRooms.map((room) => ({
          id: room.id,
          tag: room.tag,
          isLocked: room.isLocked,
          maxUsers: room.maxUsers,
          createdAt: room.createdAt,
          isDefault: room.maxUsers === 1, // Default rooms have maxUsers = 1
        })),
      });
    } catch (error) {
      console.error("Error fetching user rooms:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  // Get clipboard content by tag
  app.get("/api/clip/:tag", validateRoomAccess, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const clipboard = await storage.getClipboard(tag);

      if (!clipboard) {
        // Return empty content instead of 404 for new rooms
        return res.json({
          content: "",
          updatedAt: new Date(),
          expiresIn: {
            minutesRemaining: null,
            expiresAt: null,
          },
        });
      }

      res.json({
        content: clipboard.content,
        updatedAt: clipboard.updatedAt,
        expiresIn: getExpirationInfo(clipboard.updatedAt),
      });
    } catch (error) {
      console.error("Error fetching clipboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Save or update clipboard content
  app.post("/api/clip/:tag", validateRoomAccess, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const contentSchema = z.object({
        content: z
          .string()
          .max(10000, "Content too long. Maximum 10,000 characters."),
      });

      const { content } = contentSchema.parse(req.body);

      const clipboard = await storage.createOrUpdateClipboard({
        tag,
        content,
      });

      res.json({
        tag: clipboard.tag,
        content: clipboard.content,
        message: "Content saved successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message,
        });
      }
      console.error("Error saving clipboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete clipboard content
  app.delete("/api/clip/:tag", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      await storage.deleteClipboard(tag);

      res.json({
        message: "Content deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting clipboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File upload route
  app.post(
    "/api/upload/:tag",
    validateRoomAccess,
    upload.single("file"),
    async (req, res) => {
      try {
        const tag = req.params.tag?.toUpperCase();

        if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
          return res.status(400).json({
            message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
          });
        }

        if (!req.file) {
          return res.status(400).json({
            message: "No file uploaded.",
          });
        }

        // Don't delete existing files - allow multiple files per room
        // await storage.deleteFile(tag);

        const fileMetadata = await storage.storeFile(tag, req.file);

        // Broadcast real-time update to all clients in the room
        if ((global as any).broadcastToRoom) {
          (global as any).broadcastToRoom(tag, {
            type: "fileUpload",
            fileName: fileMetadata.originalName,
            fileSize: fileMetadata.size,
            uploadedAt: fileMetadata.uploadedAt,
          });
        }

        res.json({
          message: "File uploaded successfully",
          fileId: fileMetadata.id,
          fileName: fileMetadata.originalName,
          fileSize: fileMetadata.size,
          uploadedAt: fileMetadata.uploadedAt,
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  );

  // Get files metadata route (multiple files per room)
  app.get("/api/files/:tag", validateRoomAccess, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const files = await storage.getFiles(tag);

      if (!files || files.length === 0) {
        return res.json({
          files: [],
          totalFiles: 0,
          totalSize: 0,
        });
      }

      // Return file info without expiration
      const filesWithInfo = files.map((file) => {
        return {
          id: file.id,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: file.uploadedAt,
          minutesRemaining: null,
          expiresAt: null,
        };
      });

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      res.json({
        files: filesWithInfo,
        totalFiles: files.length,
        totalSize,
      });
    } catch (error) {
      console.error("Error fetching files metadata:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get single file metadata route
  app.get("/api/file/:tag/:fileId", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const fileId = req.params.fileId;

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const files = await storage.getFiles(tag);
      const file = files.find((f) => f.id === fileId);

      if (!file) {
        return res.status(404).json({
          message: "File not found.",
        });
      }

      res.json({
        fileId: file.id,
        fileName: file.originalName,
        fileSize: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.uploadedAt,
        minutesRemaining: null,
        expiresAt: null,
      });
    } catch (error) {
      console.error("Error fetching file metadata:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // File download route
  app.get("/api/download/:tag/:fileId", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const fileId = req.params.fileId;

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const files = await storage.getFiles(tag);
      const file = files.find((f) => f.id === fileId);

      if (!file) {
        return res.status(404).json({
          message: "File not found.",
        });
      }

      // Set appropriate headers for file download
      res.setHeader("Content-Type", file.mimetype);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${file.originalName}"`
      );
      res.setHeader("Content-Length", file.size);

      // Optional: Delete file after download (uncomment for one-time download)
      // await storage.deleteFile(tag);

      // Send the file buffer
      res.send(file.buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete specific file by ID
  app.delete("/api/file/:tag/:fileId", validateRoomAccess, async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();
      const fileId = req.params.fileId;

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      if (!fileId) {
        return res.status(400).json({
          message: "File ID is required.",
        });
      }

      await storage.deleteFileById(tag, fileId);

      // Broadcast real-time update to all clients in the room
      if ((global as any).broadcastToRoom) {
        (global as any).broadcastToRoom(tag, {
          type: "fileDelete",
          fileId: fileId,
        });
      }

      res.json({
        message: "File deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
