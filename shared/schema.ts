import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const clipboards = pgTable("clipboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tag: varchar("tag", { length: 4 }).notNull().unique(),
  content: text("content").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertClipboardSchema = createInsertSchema(clipboards).pick({
  tag: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertClipboard = z.infer<typeof insertClipboardSchema>;
export type Clipboard = typeof clipboards.$inferSelect;
