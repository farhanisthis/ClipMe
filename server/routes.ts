import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClipboardSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
