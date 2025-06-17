import { pgTable, text, serial, integer, boolean, timestamp, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const receipts = pgTable("receipts", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  merchantName: text("merchant_name"),
  amount: real("amount"),
  date: timestamp("date"),
  items: jsonb("items").$type<string[]>(),
  trustScore: real("trust_score"),
  fraudFlags: jsonb("fraud_flags").$type<string[]>(),
  confidence: real("confidence"),
  status: text("status").notNull().default("pending"), // pending, verified, flagged
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  rating: integer("rating").notNull(),
  content: text("content").notNull(),
  sentiment: text("sentiment"), // positive, negative, neutral
  aiReply: text("ai_reply"),
  hasReplied: boolean("has_replied").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  partySize: integer("party_size").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, cancelled, no-show, completed
  specialRequests: text("special_requests"),
  isVip: boolean("is_vip").default(false),
  noShowCount: integer("no_show_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const responseTemplates = pgTable("response_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // booking, review, no-show
  template: text("template").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});
