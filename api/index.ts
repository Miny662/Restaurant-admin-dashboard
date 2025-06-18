import express from 'express';
import multer from 'multer';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// In-memory storage for Vercel (since SQLite doesn't work in serverless)
const storage = {
  receipts: [
    {
      id: 1,
      filename: "starbucks_receipt.jpg",
      originalName: "starbucks_receipt.jpg",
      merchantName: "Starbucks - Downtown",
      amount: 12.45,
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      items: JSON.stringify(["Grande Latte", "Blueberry Muffin"]),
      trustScore: 0.98,
      fraudFlags: JSON.stringify([]),
      confidence: 0.98,
      trustFactors: JSON.stringify({
        imageQuality: 0.95,
        dataCompleteness: 0.98,
        formatConsistency: 0.99,
        amountReasonableness: 0.97,
        timestampValidity: 0.99,
      }),
      status: "verified",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      filename: "luigi_receipt.jpg",
      originalName: "luigi_receipt.jpg",
      merchantName: "Luigi's Italian Bistro",
      amount: 87.23,
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      items: JSON.stringify(["Pasta Carbonara", "Caesar Salad", "Wine"]),
      trustScore: 0.85,
      fraudFlags: JSON.stringify(["unusual_amount_pattern"]),
      confidence: 0.82,
      trustFactors: JSON.stringify({
        imageQuality: 0.88,
        dataCompleteness: 0.92,
        formatConsistency: 0.85,
        amountReasonableness: 0.75,
        timestampValidity: 0.95,
      }),
      status: "flagged",
      createdAt: new Date().toISOString()
    }
  ],
  reviews: [
    {
      id: 1,
      customerName: "Mike R.",
      rating: 4,
      content: "Great food and atmosphere! The service was a bit slow during peak hours, but the quality made up for it. Will definitely come back.",
      sentiment: "positive",
      aiReply: "Thank you so much for your wonderful review, Mike! We're thrilled you enjoyed the food and atmosphere. We appreciate your patience during our busy time and are working to improve our service speed. We can't wait to welcome you back soon!",
      hasReplied: 0,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      customerName: "Sarah L.",
      rating: 5,
      content: "Absolutely amazing experience! The food was delicious and the staff was incredibly friendly. Highly recommend!",
      sentiment: "positive",
      aiReply: "Thank you for the perfect rating, Sarah! We're delighted you had such a wonderful experience with us. Your kind words about our food and staff mean the world to us. We look forward to serving you again!",
      hasReplied: 0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  reservations: [
    {
      id: 1,
      customerName: "Johnson Party",
      email: "johnson@email.com",
      phone: "(555) 123-4567",
      date: new Date().toISOString().split('T')[0],
      time: "7:00 PM",
      partySize: 4,
      status: "confirmed",
      specialRequests: "Window table preferred",
      isVip: 0,
      noShowCount: 0,
      createdAt: new Date().toISOString()
    }
  ],
  responseTemplates: [
    {
      id: 1,
      name: "Booking Confirmation",
      template: "Thank you for your reservation! We're excited to welcome you on [DATE] at [TIME] for [PARTY_SIZE] guests. Please let us know if you have any questions.",
      category: "reservation",
      isActive: 1,
      createdAt: new Date().toISOString()
    }
  ]
};

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Mock AI analysis function for Vercel
function mockAnalyzeReceipt(base64Image: string) {
  const merchantNames = ["Coffee Shop", "Restaurant", "Grocery Store", "Fast Food", "Cafe"];
  const randomMerchant = merchantNames[Math.floor(Math.random() * merchantNames.length)];
  const randomAmount = Math.floor(Math.random() * 50) + 5;
  
  const trustFactors = {
    imageQuality: 0.75 + Math.random() * 0.2,
    dataCompleteness: 0.80 + Math.random() * 0.15,
    formatConsistency: 0.85 + Math.random() * 0.1,
    amountReasonableness: 0.90 + Math.random() * 0.08,
    timestampValidity: 0.95 + Math.random() * 0.05,
  };

  const trustScore = Object.values(trustFactors).reduce((sum, val) => sum + val, 0) / 5;
  const fraudFlags = trustScore < 0.8 ? ["unusual_amount_pattern"] : [];
  
  return {
    merchantName: randomMerchant,
    amount: randomAmount,
    date: new Date().toISOString(),
    items: ["Item analysis unavailable"],
    trustScore: Math.max(0, Math.min(1, trustScore)),
    fraudFlags,
    confidence: 0.6 + Math.random() * 0.3,
    trustFactors,
  };
}

// Mock review sentiment analysis
function mockAnalyzeReviewSentiment(reviewText: string) {
  const text = reviewText.toLowerCase();
  let sentiment = "neutral";
  let suggestedReply = "Thank you for your feedback! We appreciate you taking the time to share your experience with us.";
  
  if (text.includes("great") || text.includes("excellent") || text.includes("amazing") || text.includes("love")) {
    sentiment = "positive";
    suggestedReply = "Thank you so much for your wonderful feedback! We're thrilled that you had such a great experience. We look forward to serving you again soon!";
  } else if (text.includes("bad") || text.includes("terrible") || text.includes("awful") || text.includes("hate")) {
    sentiment = "negative";
    suggestedReply = "We sincerely apologize for your disappointing experience. Your feedback is important to us, and we'd like to make this right. Please contact us directly so we can address your concerns.";
  } else if (text.includes("okay") || text.includes("fine") || text.includes("average")) {
    sentiment = "mixed";
    suggestedReply = "Thank you for your honest feedback. We're always working to improve, and your input helps us do better. We hope to exceed your expectations on your next visit.";
  }
  
  return {
    sentiment,
    suggestedReply,
    confidence: 0.7 + Math.random() * 0.2,
  };
}

// API Routes
app.get('/api/receipts', (req, res) => {
  res.json(storage.receipts);
});

app.post('/api/receipts', upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No receipt image provided" });
    }

    const base64Image = req.file.buffer.toString('base64');
    const analysis = mockAnalyzeReceipt(base64Image);
    
    const newReceipt = {
      id: storage.receipts.length + 1,
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
      createdAt: new Date().toISOString()
    };

    storage.receipts.push(newReceipt);
    res.json(newReceipt);
  } catch (error) {
    console.error("Receipt upload error:", error);
    res.status(500).json({ message: "Failed to process receipt" });
  }
});

app.get('/api/reviews', (req, res) => {
  res.json(storage.reviews);
});

app.post('/api/reviews', (req, res) => {
  try {
    const { customerName, rating, content } = req.body;
    const analysis = mockAnalyzeReviewSentiment(content);
    
    const newReview = {
      id: storage.reviews.length + 1,
      customerName,
      rating: parseInt(rating),
      content,
      sentiment: analysis.sentiment,
      aiReply: analysis.suggestedReply,
      hasReplied: 0,
      createdAt: new Date().toISOString()
    };

    storage.reviews.push(newReview);
    res.json(newReview);
  } catch (error) {
    console.error("Review creation error:", error);
    res.status(500).json({ message: "Failed to create review" });
  }
});

app.patch('/api/reviews/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { useAiReply, customReply } = req.body;
    
    const review = storage.reviews.find(r => r.id === parseInt(id));
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.hasReplied = 1;
    if (!useAiReply && customReply) {
      review.aiReply = customReply;
    }
    
    res.json(review);
  } catch (error) {
    console.error("Review reply error:", error);
    res.status(500).json({ message: "Failed to post reply" });
  }
});

app.get('/api/reviews/needing-reply', (req, res) => {
  const reviewsNeedingReply = storage.reviews.filter(r => !r.hasReplied);
  res.json(reviewsNeedingReply);
});

app.get('/api/reservations', (req, res) => {
  res.json(storage.reservations);
});

app.get('/api/reservations/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayReservations = storage.reservations.filter(r => r.date === today);
  res.json(todayReservations);
});

app.get('/api/response-templates', (req, res) => {
  res.json(storage.responseTemplates);
});

app.get('/api/dashboard/stats', (req, res) => {
  const stats = {
    receiptsProcessed: storage.receipts.length,
    trustScore: storage.receipts.length > 0 ? 
      storage.receipts.reduce((sum, r) => sum + (r.trustScore || 0), 0) / storage.receipts.length : 0,
    averageReviewScore: storage.reviews.length > 0 ?
      storage.reviews.reduce((sum, r) => sum + r.rating, 0) / storage.reviews.length : 0,
    totalReviews: storage.reviews.length,
    todayReservations: storage.reservations.filter(r => r.date === new Date().toISOString().split('T')[0]).length,
    reviewsLastWeek: storage.reviews.length
  };
  res.json(stats);
});

app.get('/api/analytics/weekly-summary', (req, res) => {
  const summary = {
    summary: "This week you received 2 reviews with an average rating of 4.5 stars. Your customers are loving their experience!",
    positiveHighlights: ["2 positive reviews (4+ stars)", "Customers appreciated your service"],
    areasForImprovement: ["Keep up the excellent work!"]
  };
  res.json(summary);
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default app; 