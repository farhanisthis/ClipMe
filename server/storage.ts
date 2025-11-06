import {
  type User,
  type InsertUser,
  type Clipboard,
  type InsertClipboard,
  type Room,
  type InsertRoom,
  type Notification,
  type InsertNotification,
  type Presence,
  type InsertPresence,
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { Request } from "express";
import bcrypt from "bcryptjs";

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

// Multiple files metadata interface
export interface RoomFiles {
  tag: string;
  files: FileMetadata[];
  totalSize: number;
  fileCount: number;
  lastUpdated: Date;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClipboard(tag: string): Promise<Clipboard | undefined>;
  createOrUpdateClipboard(clipboard: InsertClipboard): Promise<Clipboard>;
  deleteClipboard(tag: string): Promise<void>;
  // Room management methods
  getRoom(tag: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  deleteRoom(tag: string): Promise<void>;
  validateRoomPassword(tag: string, password: string): Promise<boolean>;
  getUserRooms(userId: string): Promise<Room[]>;
  renameRoom(oldTag: string, newTag: string, userId: string): Promise<Room>;
  // File storage methods
  storeFile(tag: string, file: any): Promise<FileMetadata>;
  getFile(tag: string): Promise<FileMetadata | undefined>;
  getFiles(tag: string): Promise<FileMetadata[]>;
  deleteFile(tag: string): Promise<void>;
  deleteFileById(tag: string, fileId: string): Promise<void>;
  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(tag: string, userId?: string): Promise<Notification[]>;
  // Presence methods
  updatePresence(presence: InsertPresence): Promise<Presence>;
  getPresence(tag: string): Promise<Presence[]>;
}

export class MemStorage implements IStorage {
  async renameRoom(
    oldTag: string,
    newTag: string,
    userId: string
  ): Promise<Room> {
    const oldRoomTag = oldTag.toUpperCase();
    const newRoomTag = newTag.toUpperCase();
    const room = this.rooms.get(oldRoomTag);
    if (!room) throw new Error("Room not found");
    if (room.createdBy !== userId) throw new Error("Unauthorized");
    if (this.rooms.has(newRoomTag)) throw new Error("New tag already exists");
    // Remove old room, create new with same data but new tag
    this.rooms.delete(oldRoomTag);
    const renamedRoom = { ...room, tag: newRoomTag };
    this.rooms.set(newRoomTag, renamedRoom);
    return renamedRoom;
  }
  private users: Map<string, User>;
  private clipboards: Map<string, Clipboard>;
  private files: Map<string, FileMetadata[]>; // Changed to store arrays of files
  private rooms: Map<string, Room>;
  private notifications: Map<string, Notification[]>;
  private presence: Map<string, Presence[]>;

  constructor() {
    this.users = new Map();
    this.clipboards = new Map();
    this.files = new Map();
    this.rooms = new Map();
    this.notifications = new Map();
    this.presence = new Map();
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
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      username: insertUser.username,
      password: hashedPassword,
      avatar: insertUser.avatar || null,
      createdAt: new Date(),
      lastActive: null,
    };
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
      userId: insertClipboard.userId || null,
      expiresAt: null, // Content persists indefinitely
    };
    this.clipboards.set(insertClipboard.tag, clipboard);
    console.log(`📋 Content saved for room ${insertClipboard.tag}`);
    return clipboard;
  }

  async deleteClipboard(tag: string): Promise<void> {
    const deleted = this.clipboards.delete(tag);
    if (deleted) {
      console.log(`🗑️  Deleted content for room ${tag}`);
    }
  }

  // Room management methods
  async getRoom(tag: string): Promise<Room | undefined> {
    return this.rooms.get(tag.toUpperCase());
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const roomTag = insertRoom.tag.toUpperCase();
    const hashedPassword = insertRoom.password
      ? await bcrypt.hash(insertRoom.password, 10)
      : null;

    const room: Room = {
      id: randomUUID(),
      tag: roomTag,
      password: hashedPassword,
      expiresAt:
        insertRoom.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      isLocked: insertRoom.isLocked || false,
      maxUsers: insertRoom.maxUsers || 10,
      createdBy: insertRoom.createdBy || null,
      createdAt: new Date(),
    };

    this.rooms.set(roomTag, room);
    console.log(
      `🏠 Room ${roomTag} created with ${
        room.isLocked ? "password protection" : "open access"
      }`
    );
    return room;
  }

  async deleteRoom(tag: string): Promise<void> {
    const roomTag = tag.toUpperCase();
    const deleted = this.rooms.delete(roomTag);
    if (deleted) {
      console.log(`🗑️  Room ${roomTag} deleted`);
    }
  }

  async validateRoomPassword(tag: string, password: string): Promise<boolean> {
    const room = await this.getRoom(tag);
    if (!room || !room.password) {
      return true; // No password required
    }
    return bcrypt.compare(password, room.password);
  }

  async getUserRooms(userId: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(
      (room) => room.createdBy === userId
    );
  }

  // Get clipboard history for a user in a room
  async getClipboardHistoryByUser(
    tag: string,
    userId: string
  ): Promise<Clipboard[]> {
    // In-memory: just return the current clipboard if userId matches
    // For production: query DB for all clipboard entries for this user and tag
    const result: Clipboard[] = [];
    const clipboard = this.clipboards.get(tag);
    if (clipboard && clipboard.userId === userId) {
      result.push(clipboard);
    }
    return result;
  }

  // Notification methods
  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const notification: Notification = {
      id: randomUUID(),
      tag: insertNotification.tag || null,
      userId: insertNotification.userId || null,
      type: insertNotification.type || null,
      message: insertNotification.message || null,
      createdAt: new Date(),
      read: false,
    };

    const roomTag = insertNotification.tag?.toUpperCase() || "global";
    const notifications = this.notifications.get(roomTag) || [];
    notifications.push(notification);
    this.notifications.set(roomTag, notifications);

    return notification;
  }

  async getNotifications(
    tag: string,
    userId?: string
  ): Promise<Notification[]> {
    const roomTag = tag.toUpperCase();
    const notifications = this.notifications.get(roomTag) || [];

    if (userId) {
      return notifications.filter((n) => n.userId === userId);
    }
    return notifications;
  }

  // Presence methods
  async updatePresence(insertPresence: InsertPresence): Promise<Presence> {
    const presence: Presence = {
      id: randomUUID(),
      tag: insertPresence.tag || null,
      userId: insertPresence.userId || null,
      online: insertPresence.online || true,
      lastActive: new Date(),
    };

    const roomTag = insertPresence.tag?.toUpperCase() || "global";
    const presenceList = this.presence.get(roomTag) || [];

    // Update existing presence or add new one
    const existingIndex = presenceList.findIndex(
      (p) => p.userId === presence.userId
    );
    if (existingIndex >= 0) {
      presenceList[existingIndex] = presence;
    } else {
      presenceList.push(presence);
    }

    this.presence.set(roomTag, presenceList);
    return presence;
  }

  async getPresence(tag: string): Promise<Presence[]> {
    const roomTag = tag.toUpperCase();
    return this.presence.get(roomTag) || [];
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

    const roomTag = tag.toUpperCase();
    const existingFiles = this.files.get(roomTag) || [];
    existingFiles.push(fileMetadata);
    this.files.set(roomTag, existingFiles);

    console.log(
      `📁 File "${file.originalname}" uploaded for room ${roomTag} (${existingFiles.length} total files)`
    );
    return fileMetadata;
  }

  async getFile(tag: string): Promise<FileMetadata | undefined> {
    const files = this.files.get(tag.toUpperCase());
    return files && files.length > 0 ? files[files.length - 1] : undefined; // Return latest file
  }

  async getFiles(tag: string): Promise<FileMetadata[]> {
    return this.files.get(tag.toUpperCase()) || [];
  }

  async deleteFile(tag: string): Promise<void> {
    const deleted = this.files.delete(tag.toUpperCase());
    if (deleted) {
      console.log(`🗑️  Deleted files for room ${tag.toUpperCase()}`);
    }
  }

  async deleteFileById(tag: string, fileId: string): Promise<void> {
    const roomTag = tag.toUpperCase();
    const files = this.files.get(roomTag);
    if (files) {
      const filteredFiles = files.filter((file) => file.id !== fileId);
      if (filteredFiles.length !== files.length) {
        this.files.set(roomTag, filteredFiles);
        console.log(`🗑️  Deleted file ${fileId} from room ${roomTag}`);
      }
    }
  }
}

export const storage = new MemStorage();
