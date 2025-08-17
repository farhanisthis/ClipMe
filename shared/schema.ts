import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User management
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActive: timestamp("last_active"),
});

// Room configuration
export const rooms = pgTable("rooms", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }).notNull().unique(),
  password: text("password"),
  expiresAt: timestamp("expires_at"),
  isLocked: boolean("is_locked").default(false),
  maxUsers: integer("max_users").default(10),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clipboard history
export const clipboards = pgTable("clipboards", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }).notNull(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userId: varchar("user_id"),
  expiresAt: timestamp("expires_at"),
});

// File metadata (multiple files per room)
export const files = pgTable("files", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }).notNull(),
  userId: varchar("user_id"),
  originalName: text("original_name").notNull(),
  mimetype: text("mimetype").notNull(),
  size: integer("size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

// Notifications (for push/browser notifications)
export const notifications = pgTable("notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }),
  userId: varchar("user_id"),
  type: text("type"),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  read: boolean("read").default(false),
});

// Presence (for real-time user tracking)
export const presence = pgTable("presence", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }),
  userId: varchar("user_id"),
  online: boolean("online").default(true),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  avatar: true,
});

export const insertRoomSchema = createInsertSchema(rooms).pick({
  tag: true,
  password: true,
  isLocked: true,
  maxUsers: true,
  createdBy: true,
  expiresAt: true,
});

export const insertClipboardSchema = createInsertSchema(clipboards).pick({
  tag: true,
  content: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  tag: true,
  userId: true,
  originalName: true,
  mimetype: true,
  size: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  tag: true,
  userId: true,
  type: true,
  message: true,
});

export const insertPresenceSchema = createInsertSchema(presence).pick({
  tag: true,
  userId: true,
  online: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertClipboard = z.infer<typeof insertClipboardSchema>;
export type Clipboard = typeof clipboards.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertPresence = z.infer<typeof insertPresenceSchema>;
export type Presence = typeof presence.$inferSelect;
