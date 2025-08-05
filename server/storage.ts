import {
  type User,
  type InsertUser,
  type Clipboard,
  type InsertClipboard,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClipboard(tag: string): Promise<Clipboard | undefined>;
  createOrUpdateClipboard(clipboard: InsertClipboard): Promise<Clipboard>;
  deleteClipboard(tag: string): Promise<void>;
  startCleanupScheduler(): void;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clipboards: Map<string, Clipboard>;
  private cleanupInterval: NodeJS.Timeout | null;
  private readonly AUTO_DELETE_MINUTES = 15; // Auto-delete after 15 minutes

  constructor() {
    this.users = new Map();
    this.clipboards = new Map();
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

    // Check each clipboard for expiration
    this.clipboards.forEach((clipboard, tag) => {
      const ageInMinutes =
        (now.getTime() - clipboard.updatedAt.getTime()) / (1000 * 60);

      if (ageInMinutes >= this.AUTO_DELETE_MINUTES) {
        expiredTags.push(tag);
      }
    });

    // Delete expired content
    for (const tag of expiredTags) {
      this.deleteClipboard(tag);
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
