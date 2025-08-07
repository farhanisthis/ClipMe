import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertClipboardSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
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
  // Get clipboard content by tag
  app.get("/api/clip/:tag", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const clipboard = await storage.getClipboard(tag);

      if (!clipboard) {
        return res.status(404).json({
          message: "No content found for this ClipTag.",
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
  app.post("/api/clip/:tag", async (req, res) => {
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
        message: "Content saved successfully",
        updatedAt: clipboard.updatedAt,
        expiresIn: getExpirationInfo(clipboard.updatedAt),
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
  app.post("/api/upload/:tag", upload.single("file"), async (req, res) => {
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

      // Delete any existing file for this tag first
      await storage.deleteFile(tag);

      const fileMetadata = await storage.storeFile(tag, req.file);

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
  });

  // Get file metadata route
  app.get("/api/file/:tag", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const file = await storage.getFile(tag);

      if (!file) {
        return res.status(404).json({
          message: "No file found for this ClipTag.",
        });
      }

      // Calculate expiration info
      const now = new Date();
      const ageInMinutes = (now.getTime() - file.uploadedAt.getTime()) / (1000 * 60);
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
  app.get("/api/download/:tag", async (req, res) => {
    try {
      const tag = req.params.tag?.toUpperCase();

      if (!tag || tag.length !== 4 || !/^[A-Z0-9]{4}$/.test(tag)) {
        return res.status(400).json({
          message: "Invalid ClipTag. Must be 4 alphanumeric characters.",
        });
      }

      const file = await storage.getFile(tag);

      if (!file) {
        return res.status(404).json({
          message: "No file found for this ClipTag.",
        });
      }

      // Set appropriate headers for file download
      res.setHeader('Content-Type', file.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.setHeader('Content-Length', file.size);

      // Optional: Delete file after download (uncomment for one-time download)
      // await storage.deleteFile(tag);

      // Send the file buffer
      res.send(file.buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
