import { type User, type InsertUser, type Clipboard, type InsertClipboard } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClipboard(tag: string): Promise<Clipboard | undefined>;
  createOrUpdateClipboard(clipboard: InsertClipboard): Promise<Clipboard>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clipboards: Map<string, Clipboard>;

  constructor() {
    this.users = new Map();
    this.clipboards = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
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

  async createOrUpdateClipboard(insertClipboard: InsertClipboard): Promise<Clipboard> {
    const existing = this.clipboards.get(insertClipboard.tag);
    const clipboard: Clipboard = {
      id: existing?.id || randomUUID(),
      tag: insertClipboard.tag,
      content: insertClipboard.content,
      updatedAt: new Date(),
    };
    this.clipboards.set(insertClipboard.tag, clipboard);
    return clipboard;
  }
}

export const storage = new MemStorage();
