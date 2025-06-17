import { 
  users, receipts, reviews, reservations, responseTemplates,
  type User, type InsertUser,
  type Receipt, type InsertReceipt,
  type Review, type InsertReview,
  type Reservation, type InsertReservation,
  type ResponseTemplate, type InsertResponseTemplate
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private receipts: Map<number, Receipt>;
  private reviews: Map<number, Review>;
  private reservations: Map<number, Reservation>;
  private responseTemplates: Map<number, ResponseTemplate>;
  private currentUserId: number;
  private currentReceiptId: number;
  private currentReviewId: number;
  private currentReservationId: number;
  private currentTemplateId: number;

  constructor() {
    this.users = new Map();
    this.receipts = new Map();
    this.reviews = new Map();
    this.reservations = new Map();
    this.responseTemplates = new Map();
    this.currentUserId = 1;
    this.currentReceiptId = 1;
    this.currentReviewId = 1;
    this.currentReservationId = 1;
    this.currentTemplateId = 1;

    // Initialize with demo data
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo receipts
    const demoReceipts: Receipt[] = [
      {
        id: this.currentReceiptId++,
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
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: this.currentReceiptId++,
        filename: "luigi_receipt.jpg",
        originalName: "luigi_receipt.jpg",
        merchantName: "Luigi's Italian Bistro",
        amount: 87.23,
        date: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        items: ["Pasta Carbonara", "Caesar Salad", "Wine"],
        trustScore: 0.72,
        fraudFlags: ["unusual_amount_pattern"],
        confidence: 0.72,
        status: "flagged",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
      {
        id: this.currentReceiptId++,
        filename: "blue_bottle_receipt.jpg",
        originalName: "blue_bottle_receipt.jpg",
        merchantName: "Blue Bottle Coffee",
        amount: 8.75,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        items: ["Cappuccino", "Croissant"],
        trustScore: 0.95,
        fraudFlags: [],
        confidence: 0.95,
        status: "verified",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    demoReceipts.forEach(receipt => this.receipts.set(receipt.id, receipt));

    // Create demo reviews
    const demoReviews: Review[] = [
      {
        id: this.currentReviewId++,
        customerName: "Mike R.",
        rating: 4,
        content: "The food was great, but we waited too long for service.",
        sentiment: "mixed",
        aiReply: "Thank you for the feedback, Mike! We're thrilled you enjoyed the food. We sincerely apologize for the wait time and are working to improve our service speed. We'd love to welcome you back for a better experience!",
        hasReplied: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: this.currentReviewId++,
        customerName: "Jennifer L.",
        rating: 5,
        content: "Amazing cocktails and the staff was incredibly helpful! Will definitely be back.",
        sentiment: "positive",
        aiReply: "Thank you so much, Jennifer! We're delighted you loved our cocktails and experienced our team's dedication. Can't wait to serve you again soon!",
        hasReplied: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ];

    demoReviews.forEach(review => this.reviews.set(review.id, review));

    // Create demo reservations
    const today = new Date();
    const demoReservations: Reservation[] = [
      {
        id: this.currentReservationId++,
        customerName: "Johnson Party",
        email: "johnson@email.com",
        phone: "555-0123",
        partySize: 4,
        date: today,
        time: "6:30 PM",
        status: "confirmed",
        specialRequests: null,
        isVip: false,
        noShowCount: 0,
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        id: this.currentReservationId++,
        customerName: "Davis Couple",
        email: "davis@email.com",
        phone: "555-0124",
        partySize: 2,
        date: today,
        time: "7:00 PM",
        status: "confirmed",
        specialRequests: null,
        isVip: false,
        noShowCount: 1,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: this.currentReservationId++,
        customerName: "Miller Group",
        email: "miller@email.com",
        phone: "555-0125",
        partySize: 6,
        date: today,
        time: "8:00 PM",
        status: "confirmed",
        specialRequests: "Birthday celebration",
        isVip: true,
        noShowCount: 0,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ];

    demoReservations.forEach(reservation => this.reservations.set(reservation.id, reservation));

    // Create demo response templates
    const demoTemplates: ResponseTemplate[] = [
      {
        id: this.currentTemplateId++,
        name: "Booking Confirmation",
        category: "booking",
        template: "Thanks so much for booking with us! We've reserved a table for {partySize} at {time}. We look forward to hosting you for a wonderful experience!",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentTemplateId++,
        name: "No-Show Follow-up",
        category: "no-show",
        template: "Guest missed reservation on {date} without cancellation. Consider this when accepting future bookings. Maintain professional courtesy.",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: this.currentTemplateId++,
        name: "Positive Review Reply",
        category: "review",
        template: "Thank you so much for your wonderful review! We're thrilled you had a great experience with us. We can't wait to welcome you back soon!",
        isActive: true,
        createdAt: new Date(),
      },
    ];

    demoTemplates.forEach(template => this.responseTemplates.set(template.id, template));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Receipt methods
  async getReceipts(): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReceipt(id: number): Promise<Receipt | undefined> {
    return this.receipts.get(id);
  }

  async createReceipt(insertReceipt: InsertReceipt): Promise<Receipt> {
    const id = this.currentReceiptId++;
    const receipt: Receipt = { 
      ...insertReceipt,
      id,
      date: insertReceipt.date ?? null,
      merchantName: insertReceipt.merchantName ?? null,
      amount: insertReceipt.amount ?? null,
      items: insertReceipt.items ? [...insertReceipt.items] : null,
      trustScore: insertReceipt.trustScore ?? null,
      fraudFlags: insertReceipt.fraudFlags ? [...insertReceipt.fraudFlags] : null,
      confidence: insertReceipt.confidence ?? null,
      status: insertReceipt.status ?? "pending",
      createdAt: new Date() 
    };
    this.receipts.set(id, receipt);
    return receipt;
  }

  async updateReceipt(id: number, updates: Partial<Receipt>): Promise<Receipt | undefined> {
    const existing = this.receipts.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.receipts.set(id, updated);
    return updated;
  }

  // Review methods
  async getReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getReview(id: number): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsNeedingReply(): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(review => !review.hasReplied);
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = this.currentReviewId++;
    const review: Review = { 
      ...insertReview,
      id,
      sentiment: insertReview.sentiment ?? null,
      aiReply: insertReview.aiReply ?? null,
      hasReplied: insertReview.hasReplied ?? false,
      createdAt: new Date() 
    };
    this.reviews.set(id, review);
    return review;
  }

  async updateReview(id: number, updates: Partial<Review>): Promise<Review | undefined> {
    const existing = this.reviews.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.reviews.set(id, updated);
    return updated;
  }

  // Reservation methods
  async getReservations(): Promise<Reservation[]> {
    return Array.from(this.reservations.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    return this.reservations.get(id);
  }

  async getTodayReservations(): Promise<Reservation[]> {
    const today = new Date();
    const todayStr = today.toDateString();
    return Array.from(this.reservations.values())
      .filter(reservation => new Date(reservation.date).toDateString() === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  async createReservation(insertReservation: InsertReservation): Promise<Reservation> {
    const id = this.currentReservationId++;
    const reservation: Reservation = { 
      ...insertReservation,
      id,
      status: insertReservation.status ?? "confirmed",
      email: insertReservation.email ?? null,
      phone: insertReservation.phone ?? null,
      specialRequests: insertReservation.specialRequests ?? null,
      isVip: insertReservation.isVip ?? false,
      noShowCount: insertReservation.noShowCount ?? 0,
      createdAt: new Date() 
    };
    this.reservations.set(id, reservation);
    return reservation;
  }

  async updateReservation(id: number, updates: Partial<Reservation>): Promise<Reservation | undefined> {
    const existing = this.reservations.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.reservations.set(id, updated);
    return updated;
  }

  // Response template methods
  async getResponseTemplates(): Promise<ResponseTemplate[]> {
    return Array.from(this.responseTemplates.values());
  }

  async getResponseTemplate(id: number): Promise<ResponseTemplate | undefined> {
    return this.responseTemplates.get(id);
  }

  async createResponseTemplate(insertTemplate: InsertResponseTemplate): Promise<ResponseTemplate> {
    const id = this.currentTemplateId++;
    const template: ResponseTemplate = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date() 
    };
    this.responseTemplates.set(id, template);
    return template;
  }

  async updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined> {
    const existing = this.responseTemplates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.responseTemplates.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
