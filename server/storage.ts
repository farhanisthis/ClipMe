import {
  type User,
  type InsertUser,
  type Clipboard,
  type InsertClipboard,
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { Request } from "express";

// File metadata interface
export interface FileMetadata {
  id: string;
  tag: string;
  originalName: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  uploadedAt: Date;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClipboard(tag: string): Promise<Clipboard | undefined>;
  createOrUpdateClipboard(clipboard: InsertClipboard): Promise<Clipboard>;
  deleteClipboard(tag: string): Promise<void>;
  // File storage methods
  storeFile(tag: string, file: any): Promise<FileMetadata>;
  getFile(tag: string): Promise<FileMetadata | undefined>;
  deleteFile(tag: string): Promise<void>;
  startCleanupScheduler(): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clipboards: Map<string, Clipboard>;
  private files: Map<string, FileMetadata>;
  private cleanupInterval: NodeJS.Timeout | null;
  private readonly AUTO_DELETE_MINUTES = 10; // Auto-delete files after 10 minutes

  constructor() {
    this.users = new Map();
    this.clipboards = new Map();
    this.files = new Map();
    this.cleanupInterval = null;
    this.startCleanupScheduler();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getClipboard(tag: string): Promise<Clipboard | undefined> {
    return this.clipboards.get(tag);
  }

  async createOrUpdateClipboard(
    insertClipboard: InsertClipboard
  ): Promise<Clipboard> {
    const existing = this.clipboards.get(insertClipboard.tag);
    const clipboard: Clipboard = {
      id: existing?.id || randomUUID(),
      tag: insertClipboard.tag,
      content: insertClipboard.content,
      updatedAt: new Date(),
    };
    this.clipboards.set(insertClipboard.tag, clipboard);
    console.log(
      `📋 Content saved for room ${insertClipboard.tag} - will auto-delete in ${this.AUTO_DELETE_MINUTES} minutes`
    );
    return clipboard;
  }

  async deleteClipboard(tag: string): Promise<void> {
    const deleted = this.clipboards.delete(tag);
    if (deleted) {
      console.log(
        `🗑️  Auto-deleted expired content for room ${tag} (${this.AUTO_DELETE_MINUTES} min privacy policy)`
      );
    }
  }

  // File storage methods
  async storeFile(tag: string, file: any): Promise<FileMetadata> {
    const fileMetadata: FileMetadata = {
      id: randomUUID(),
      tag: tag.toUpperCase(),
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
      uploadedAt: new Date(),
    };
    
    this.files.set(tag.toUpperCase(), fileMetadata);
    console.log(
      `📁 File "${file.originalname}" uploaded for room ${tag.toUpperCase()} - will auto-delete in ${this.AUTO_DELETE_MINUTES} minutes`
    );
    return fileMetadata;
  }

  async getFile(tag: string): Promise<FileMetadata | undefined> {
    return this.files.get(tag.toUpperCase());
  }

  async deleteFile(tag: string): Promise<void> {
    const deleted = this.files.delete(tag.toUpperCase());
    if (deleted) {
      console.log(
        `🗑️  Auto-deleted expired file for room ${tag.toUpperCase()} (${this.AUTO_DELETE_MINUTES} min privacy policy)`
      );
    }
  }

  startCleanupScheduler(): void {
    // Run cleanup every minute to check for expired content
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredContent();
    }, 60 * 1000); // Check every minute

    console.log(
      `🛡️  Privacy protection: Content auto-deletion enabled (${this.AUTO_DELETE_MINUTES} minutes)`
    );
  }

  private cleanupExpiredContent(): void {
    const now = new Date();
    const expiredTags: string[] = [];
    const expiredFileTags: string[] = [];

    // Check each clipboard for expiration (15 minutes for text)
    this.clipboards.forEach((clipboard, tag) => {
      const ageInMinutes =
        (now.getTime() - clipboard.updatedAt.getTime()) / (1000 * 60);

      if (ageInMinutes >= 15) { // Keep 15 minutes for clipboard content
        expiredTags.push(tag);
      }
    });

    // Check each file for expiration (10 minutes for files)
    this.files.forEach((file, tag) => {
      const ageInMinutes =
        (now.getTime() - file.uploadedAt.getTime()) / (1000 * 60);

      if (ageInMinutes >= this.AUTO_DELETE_MINUTES) {
        expiredFileTags.push(tag);
      }
    });

    // Delete expired content
    for (const tag of expiredTags) {
      this.deleteClipboard(tag);
    }

    // Delete expired files
    for (const tag of expiredFileTags) {
      this.deleteFile(tag);
    }
  }

  // Graceful shutdown cleanup
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log("🛡️  Privacy cleanup scheduler stopped");
    }
  }
}

export const storage = new MemStorage();
