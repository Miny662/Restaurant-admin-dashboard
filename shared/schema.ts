import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const receipts = sqliteTable("receipts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  merchantName: text("merchant_name"),
  amount: real("amount"),
  date: text("date"),
  items: text("items"), // JSON string
  trustScore: real("trust_score"),
  fraudFlags: text("fraud_flags"), // JSON string
  confidence: real("confidence"),
  status: text("status").notNull().default("pending"), // pending, verified, flagged
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment"), // positive, negative, neutral
  aiReply: text("ai_reply"),
  hasReplied: integer("has_replied").default(0), // 0 = false, 1 = true
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const reservations = sqliteTable("reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  partySize: integer("party_size").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled, no-show, completed
  specialRequests: text("special_requests"),
  isVip: integer("is_vip").default(0), // 0 = false, 1 = true
  noShowCount: integer("no_show_count").default(0),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const responseTemplates = sqliteTable("response_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(), // booking, review, no-show
  template: text("template").notNull(),
  isActive: integer("is_active").default(1), // 0 = false, 1 = true
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// Insert schemas
export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  createdAt: true,
});

export const insertResponseTemplateSchema = createInsertSchema(responseTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;

export type InsertResponseTemplate = z.infer<typeof insertResponseTemplateSchema>;
export type ResponseTemplate = typeof responseTemplates.$inferSelect;
