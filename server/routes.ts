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

// Helper function to calculate expiration info
function getExpirationInfo(updatedAt: Date): {
  minutesRemaining: number;
  expiresAt: Date;
} {
  const AUTO_DELETE_MINUTES = 15;
  const now = new Date();
  const ageInMinutes = (now.getTime() - updatedAt.getTime()) / (1000 * 60);
  const minutesRemaining = Math.max(0, AUTO_DELETE_MINUTES - ageInMinutes);
  const expiresAt = new Date(
    updatedAt.getTime() + AUTO_DELETE_MINUTES * 60 * 1000
  );

  return {
    minutesRemaining: Math.round(minutesRemaining),
    expiresAt,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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
      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "User registered successfully",
        user: { id: user.id, username: user.username, avatar: user.avatar },
        token,
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
            minutesRemaining: 15,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
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

      // Broadcast real-time update to all clients in the room
      if ((global as any).broadcastToRoom) {
        (global as any).broadcastToRoom(tag, {
          type: "clipboardUpdate",
          content: clipboard.content,
          updatedAt: clipboard.updatedAt,
        });
      }

      res.json({
        message: "Clipboard updated successfully",
        content: clipboard.content,
        updatedAt: clipboard.updatedAt,
        expiresInMinutes: 15,
        privacyNotice:
          "Content will be automatically deleted after 15 minutes for privacy protection",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.errors[0]?.message || "Invalid input",
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
          expiresInMinutes: 10,
          privacyNotice:
            "File will be automatically deleted after 10 minutes for privacy protection",
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

      // Calculate expiration info for each file
      const now = new Date();
      const filesWithExpiration = files.map((file) => {
        const ageInMinutes =
          (now.getTime() - file.uploadedAt.getTime()) / (1000 * 60);
        const minutesRemaining = Math.max(0, 10 - ageInMinutes);

        return {
          fileId: file.id,
          fileName: file.originalName,
          fileSize: file.size,
          mimetype: file.mimetype,
          uploadedAt: file.uploadedAt,
          minutesRemaining: Math.round(minutesRemaining),
          expiresAt: new Date(file.uploadedAt.getTime() + 10 * 60 * 1000),
        };
      });

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      res.json({
        files: filesWithExpiration,
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

      // Calculate expiration info
      const now = new Date();
      const ageInMinutes =
        (now.getTime() - file.uploadedAt.getTime()) / (1000 * 60);
      const minutesRemaining = Math.max(0, 10 - ageInMinutes);

      res.json({
        fileId: file.id,
        fileName: file.originalName,
        fileSize: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.uploadedAt,
        minutesRemaining: Math.round(minutesRemaining),
        expiresAt: new Date(file.uploadedAt.getTime() + 10 * 60 * 1000),
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
