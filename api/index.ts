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
      status: "verified",
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

// API Routes
app.get('/api/receipts', (req, res) => {
  res.json(storage.receipts);
});

app.get('/api/reviews', (req, res) => {
  res.json(storage.reviews);
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
    summary: "This week you received 1 review with an average rating of 4.0 stars. Your customers are loving their experience!",
    positiveHighlights: ["1 positive review (4+ stars)", "Customers appreciated your service"],
    areasForImprovement: ["Keep up the excellent work!"]
  };
  res.json(summary);
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default app; 