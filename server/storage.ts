import { 
  users, receipts, reviews, reservations, responseTemplates,
  type User, type InsertUser,
  type Receipt, type InsertReceipt,
  type Review, type InsertReview,
  type Reservation, type InsertReservation,
  type ResponseTemplate, type InsertResponseTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Receipt methods
  getReceipts(): Promise<Receipt[]>;
  getReceipt(id: number): Promise<Receipt | undefined>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined>;

  // Review methods
  getReviews(): Promise<Review[]>;
  getReview(id: number): Promise<Review | undefined>;
  createReview(review: InsertReview): Promise<Review>;
  updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined>;
  getReviewsNeedingReply(): Promise<Review[]>;

  // Reservation methods
  getReservations(): Promise<Reservation[]>;
  getReservation(id: number): Promise<Reservation | undefined>;
  getTodayReservations(): Promise<Reservation[]>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: number, updates: Partial<Reservation>): Promise<Reservation | undefined>;

  // Response template methods
  getResponseTemplates(): Promise<ResponseTemplate[]>;
  getResponseTemplate(id: number): Promise<ResponseTemplate | undefined>;
  createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate>;
  updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with demo data on first run
    this.initializeDemoData().catch(console.error);
  }

  private async initializeDemoData() {
    try {
      // Check if data already exists
      const existingReceipts = await db.select().from(receipts).limit(1);
      if (existingReceipts.length > 0) return; // Data already initialized

      // Create demo receipts
      const demoReceipts = [
        {
          filename: "starbucks_receipt.jpg",
          originalName: "starbucks_receipt.jpg",
          merchantName: "Starbucks - Downtown",
          amount: 12.45,
          date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          items: ["Grande Latte", "Blueberry Muffin"],
          trustScore: 0.98,
          fraudFlags: [],
          confidence: 0.98,
          status: "verified",
        },
        {
          filename: "luigi_receipt.jpg",
          originalName: "luigi_receipt.jpg",
          merchantName: "Luigi's Italian Bistro",
          amount: 87.23,
          date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          items: ["Pasta Carbonara", "Caesar Salad", "Wine"],
          trustScore: 0.85,
          fraudFlags: ["unusual_amount_pattern"],
          confidence: 0.82,
          status: "flagged",
        },
        {
          filename: "mcdonalds_receipt.jpg",
          originalName: "mcdonalds_receipt.jpg",
          merchantName: "McDonald's",
          amount: 8.99,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          items: ["Big Mac Meal", "Apple Pie"],
          trustScore: 0.92,
          fraudFlags: [],
          confidence: 0.95,
          status: "verified",
        }
      ];

      await db.insert(receipts).values(demoReceipts);

      // Create demo reviews
      const demoReviews = [
        {
          customerName: "Mike R.",
          rating: 4,
          content: "Great food and atmosphere! The service was a bit slow during peak hours, but the quality made up for it. Will definitely come back.",
          sentiment: "positive",
          aiReply: "Thank you so much for your wonderful review, Mike! We're thrilled you enjoyed the food and atmosphere. We appreciate your patience during our busy time and are working to improve our service speed. We can't wait to welcome you back soon!",
          confidence: 0.95,
          hasReplied: false,
        },
        {
          customerName: "Sarah L.",
          rating: 2,
          content: "Food was cold when it arrived and the waiter seemed disinterested. Expected much better for the price point.",
          sentiment: "negative",
          aiReply: "Thank you for bringing this to our attention, Sarah. We sincerely apologize for the cold food and service experience that didn't meet your expectations. We take food quality and service seriously and would love the opportunity to make this right. Please reach out to us directly so we can address your concerns properly.",
          confidence: 0.88,
          hasReplied: true,
        }
      ];

      await db.insert(reviews).values(demoReviews);

      // Create demo reservations
      const demoReservations = [
        {
          customerName: "Johnson Party",
          email: "johnson@email.com",
          phone: "(555) 123-4567",
          date: new Date(),
          time: "7:00 PM",
          partySize: 4,
          status: "confirmed",
          specialRequests: "Window table preferred",
          isVip: false,
          noShowCount: null,
        },
        {
          customerName: "Smith Anniversary",
          email: "smith@email.com",
          phone: "(555) 987-6543",
          date: new Date(),
          time: "8:30 PM",
          partySize: 2,
          status: "confirmed",
          specialRequests: "Celebrating 25th anniversary",
          isVip: true,
          noShowCount: null,
        }
      ];

      await db.insert(reservations).values(demoReservations);

      // Create demo response templates
      const demoTemplates = [
        {
          name: "Booking Confirmation",
          content: "Thank you for your reservation! We're excited to welcome you on [DATE] at [TIME] for [PARTY_SIZE] guests. Please let us know if you have any questions.",
          category: "reservation",
          isActive: true,
        },
        {
          name: "Positive Review Response",
          content: "Thank you so much for your wonderful review! We're thrilled you had a great experience with us. We can't wait to welcome you back soon!",
          category: "review",
          isActive: true,
        }
      ];

      await db.insert(responseTemplates).values(demoTemplates);
    } catch (error) {
      console.error("Failed to initialize demo data:", error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Receipt methods
  async getReceipts(): Promise<Receipt[]> {
    return await db.select().from(receipts).orderBy(receipts.createdAt);
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    const [receipt] = await db.select().from(receipts).where(eq(receipts.id, id));
    return receipt || undefined;
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const [receipt] = await db
      .insert(receipts)
      .values(insertReceipt)
      .returning();
    return receipt;
  }

  async updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined> {
    const [receipt] = await db
      .update(receipts)
      .set(updates)
      .where(eq(receipts.id, id))
      .returning();
    return receipt || undefined;
  }

  // Review methods
  async getReviews(): Promise<Review[]> {
    return await db.select().from(reviews).orderBy(reviews.createdAt);
  }

  async getReview(id: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(eq(reviews.id, id));
    return review || undefined;
  }

  async getReviewsNeedingReply(): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.hasReplied, false));
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const [review] = await db
      .insert(reviews)
      .values(insertReview)
      .returning();
    return review;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db
      .update(reviews)
      .set(updates)
      .where(eq(reviews.id, id))
      .returning();
    return review || undefined;
  }

  // Reservation methods
  async getReservations(): Promise<Reservation[]> {
    return await db.select().from(reservations).orderBy(reservations.createdAt);
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getTodayReservations(): Promise<Reservation[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db.select().from(reservations).where(eq(reservations.date, today));
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const [reservation] = await db
      .insert(reservations)
      .values(insertReservation)
      .returning();
    return reservation;
  }

  async updateReservation(id: number, updates: Partial<Reservation>): Promise<Reservation | undefined> {
    const [reservation] = await db
      .update(reservations)
      .set(updates)
      .where(eq(reservations.id, id))
      .returning();
    return reservation || undefined;
  }

  // Response template methods
  async getResponseTemplates(): Promise<ResponseTemplate[]> {
    return await db.select().from(responseTemplates).orderBy(responseTemplates.createdAt);
  }

  async getResponseTemplate(id: number): Promise<ResponseTemplate | undefined> {
    const [template] = await db.select().from(responseTemplates).where(eq(responseTemplates.id, id));
    return template || undefined;
  }

  async createResponseTemplate(insertTemplate: InsertResponseTemplate): Promise<ResponseTemplate> {
    const [template] = await db
      .insert(responseTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined> {
    const [template] = await db
      .update(responseTemplates)
      .set(updates)
      .where(eq(responseTemplates.id, id))
      .returning();
    return template || undefined;
  }
}

export const storage = new DatabaseStorage();