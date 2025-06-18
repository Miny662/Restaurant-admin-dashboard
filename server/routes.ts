import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertReceiptSchema, insertReviewSchema, insertReservationSchema, insertResponseTemplateSchema } from "@shared/schema";
import { analyzeReceipt, analyzeReviewSentiment, generateWeeklySummary, generateBookingConfirmation } from "./services/openai";
import multer from "multer";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Receipt routes
  app.get("/api/receipts", async (req, res) => {
    try {
      const receipts = await storage.getReceipts();
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.post("/api/receipts", upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No receipt image provided" });
      }

      const base64Image = req.file.buffer.toString('base64');
      
      // Analyze receipt with AI
      const analysis = await analyzeReceipt(base64Image);

      // Create receipt record
      const receiptData = {
        filename: `receipt_${Date.now()}.jpg`,
        originalName: req.file.originalname,
        merchantName: analysis.merchantName,
        amount: analysis.amount,
        date: analysis.date,
        items: analysis.items,
        trustScore: analysis.trustScore,
        fraudFlags: analysis.fraudFlags,
        confidence: analysis.confidence,
        trustFactors: analysis.trustFactors,
        status: analysis.trustScore > 0.8 ? "verified" : analysis.fraudFlags.length > 0 ? "flagged" : "pending",
      };

      const validatedData = insertReceiptSchema.parse(receiptData);
      const receipt = await storage.createReceipt(validatedData);

      res.json(receipt);
    } catch (error) {
      console.error("Receipt upload error:", error);
      res.status(500).json({ message: "Failed to process receipt: " + (error as Error).message });
    }
  });

  // Review routes
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/needing-reply", async (req, res) => {
    try {
      const reviews = await storage.getReviewsNeedingReply();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews needing reply" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const validatedData = insertReviewSchema.parse(req.body);
      
      // Analyze sentiment and generate AI reply
      const insight = await analyzeReviewSentiment(validatedData.content);
      
      const reviewData = {
        ...validatedData,
        sentiment: insight.sentiment,
        aiReply: insight.suggestedReply,
      };

      const review = await storage.createReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Review creation error:", error);
      res.status(500).json({ message: "Failed to create review: " + (error as Error).message });
    }
  });

  app.patch("/api/reviews/:id/reply", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { useAiReply, customReply } = req.body;

      const review = await storage.getReview(id);
      if (!review) {
        return res.status(404).json({ message: "Review not found" });
      }

      const updates = {
        hasReplied: true,
        ...(customReply && { aiReply: customReply }),
      };

      const updatedReview = await storage.updateReview(id, updates);
      res.json(updatedReview);
    } catch (error) {
      res.status(500).json({ message: "Failed to update review reply" });
    }
  });

  // Analytics route for weekly summary
  app.get("/api/analytics/weekly-summary", async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentReviews = reviews.filter(r => new Date(r.createdAt!) > weekAgo);
      
      const summary = await generateWeeklySummary(
        recentReviews.map(r => ({ rating: r.rating, content: r.content }))
      );
      
      res.json(summary);
    } catch (error) {
      console.error("Weekly summary error:", error);
      res.status(500).json({ message: "Failed to generate weekly summary: " + (error as Error).message });
    }
  });

  // Reservation routes
  app.get("/api/reservations", async (req, res) => {
    try {
      const reservations = await storage.getReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  app.get("/api/reservations/today", async (req, res) => {
    try {
      const reservations = await storage.getTodayReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's reservations" });
    }
  });

  app.post("/api/reservations", async (req, res) => {
    try {
      const validatedData = insertReservationSchema.parse(req.body);
      const reservation = await storage.createReservation(validatedData);

      // Generate confirmation message
      const confirmationMessage = await generateBookingConfirmation(
        reservation.partySize,
        reservation.time
      );

      res.json({ ...reservation, confirmationMessage });
    } catch (error) {
      console.error("Reservation creation error:", error);
      res.status(500).json({ message: "Failed to create reservation: " + (error as Error).message });
    }
  });

  app.patch("/api/reservations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const updatedReservation = await storage.updateReservation(id, updates);
      if (!updatedReservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      res.json(updatedReservation);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });

  // Response template routes
  app.get("/api/response-templates", async (req, res) => {
    try {
      const templates = await storage.getResponseTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch response templates" });
    }
  });

  app.post("/api/response-templates", async (req, res) => {
    try {
      const validatedData = insertResponseTemplateSchema.parse(req.body);
      const template = await storage.createResponseTemplate(validatedData);
      res.json(template);
    } catch (error) {
      console.error("Template creation error:", error);
      res.status(500).json({ message: "Failed to create response template: " + (error as Error).message });
    }
  });

  app.patch("/api/response-templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      const updatedTemplate = await storage.updateResponseTemplate(id, updates);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update response template" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const receipts = await storage.getReceipts();
      const reviews = await storage.getReviews();
      const todayReservations = await storage.getTodayReservations();

      const stats = {
        receiptsProcessed: receipts.length,
        trustScore: receipts.length > 0 ? 
          receipts.reduce((sum, r) => sum + (r.trustScore || 0), 0) / receipts.length : 0,
        averageReviewScore: reviews.length > 0 ?
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        totalReviews: reviews.length,
        todayReservations: todayReservations.length,
        reviewsLastWeek: reviews.filter(r => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(r.createdAt!) > weekAgo;
        }).length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
