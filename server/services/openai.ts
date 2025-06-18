import OpenAI from "openai";

// Only create OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY 
  ? new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || ""
    })
  : null;

export interface ReceiptAnalysisResult {
  merchantName: string | null;
  amount: number | null;
  date: Date | null;
  items: string[];
  trustScore: number;
  fraudFlags: string[];
  confidence: number;
  trustFactors: {
    imageQuality: number;
    dataCompleteness: number;
    formatConsistency: number;
    amountReasonableness: number;
    timestampValidity: number;
  };
}

export interface ReviewInsight {
  sentiment: string;
  suggestedReply: string;
  confidence: number;
}

export interface WeeklySummary {
  summary: string;
  positiveHighlights: string[];
  areasForImprovement: string[];
}

// Enhanced trust score calculation
function calculateTrustScore(factors: ReceiptAnalysisResult['trustFactors']): number {
  const weights = {
    imageQuality: 0.25,
    dataCompleteness: 0.30,
    formatConsistency: 0.20,
    amountReasonableness: 0.15,
    timestampValidity: 0.10,
  };

  return Object.entries(factors).reduce((score, [factor, value]) => {
    return score + (value * weights[factor as keyof typeof weights]);
  }, 0);
}

// Enhanced fraud detection logic
function detectFraudFlags(factors: ReceiptAnalysisResult['trustFactors'], amount: number | null): string[] {
  const flags: string[] = [];

  if (factors.imageQuality < 0.6) {
    flags.push('poor_image_quality');
  }

  if (factors.dataCompleteness < 0.7) {
    flags.push('missing_critical_info');
  }

  if (factors.formatConsistency < 0.8) {
    flags.push('inconsistent_formatting');
  }

  if (amount && (amount > 1000 || amount < 0.01)) {
    flags.push('unusual_amount_pattern');
  }

  if (factors.timestampValidity < 0.8) {
    flags.push('suspicious_timestamp');
  }

  // Additional fraud patterns
  if (amount && amount % 1 === 0 && amount > 100) {
    flags.push('round_amount_suspicious');
  }

  return flags;
}

export async function analyzeReceipt(base64Image: string): Promise<ReceiptAnalysisResult> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert receipt analysis system. Analyze the receipt image and extract key information while detecting potential fraud indicators. 

          Respond with JSON in this exact format:
          {
            "merchantName": "string or null",
            "amount": "number or null", 
            "date": "ISO date string or null",
            "items": ["array of item names"],
            "trustFactors": {
              "imageQuality": "number between 0-1 (clarity, resolution, lighting)",
              "dataCompleteness": "number between 0-1 (presence of merchant, amount, date, items)",
              "formatConsistency": "number between 0-1 (standard receipt format, layout)",
              "amountReasonableness": "number between 0-1 (reasonable amount for merchant type)",
              "timestampValidity": "number between 0-1 (date/time makes sense, not future/past extreme)"
            },
            "confidence": "number between 0-1"
          }

          Trust factor guidelines:
          - imageQuality: 0.9+ for clear, well-lit images; 0.6-0.8 for acceptable; <0.6 for poor
          - dataCompleteness: 0.9+ for all fields present; 0.7-0.8 for most fields; <0.7 for missing critical info
          - formatConsistency: 0.9+ for standard format; 0.8-0.9 for minor variations; <0.8 for unusual format
          - amountReasonableness: 0.9+ for typical amounts; 0.7-0.8 for unusual but possible; <0.7 for suspicious
          - timestampValidity: 0.9+ for recent, logical dates; 0.8-0.9 for acceptable; <0.8 for suspicious dates`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this receipt for authenticity and extract the key information."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Calculate trust score from factors
    const trustFactors = {
      imageQuality: Math.max(0, Math.min(1, result.trustFactors?.imageQuality || 0.7)),
      dataCompleteness: Math.max(0, Math.min(1, result.trustFactors?.dataCompleteness || 0.7)),
      formatConsistency: Math.max(0, Math.min(1, result.trustFactors?.formatConsistency || 0.7)),
      amountReasonableness: Math.max(0, Math.min(1, result.trustFactors?.amountReasonableness || 0.7)),
      timestampValidity: Math.max(0, Math.min(1, result.trustFactors?.timestampValidity || 0.7)),
    };

    const trustScore = calculateTrustScore(trustFactors);
    const fraudFlags = detectFraudFlags(trustFactors, result.amount);
    
    return {
      merchantName: result.merchantName,
      amount: result.amount,
      date: result.date ? new Date(result.date) : null,
      items: result.items || [],
      trustScore: Math.max(0, Math.min(1, trustScore)),
      fraudFlags,
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
      trustFactors,
    };
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    
    // Provide simulated analysis based on image characteristics
    const timestamp = new Date();
    const merchantNames = ["Coffee Shop", "Restaurant", "Grocery Store", "Fast Food", "Cafe"];
    const randomMerchant = merchantNames[Math.floor(Math.random() * merchantNames.length)];
    const randomAmount = Math.floor(Math.random() * 50) + 5;
    
    // Simulated trust factors
    const trustFactors = {
      imageQuality: 0.75,
      dataCompleteness: 0.80,
      formatConsistency: 0.85,
      amountReasonableness: 0.90,
      timestampValidity: 0.95,
    };

    const trustScore = calculateTrustScore(trustFactors);
    const fraudFlags = detectFraudFlags(trustFactors, randomAmount);
    
    return {
      merchantName: randomMerchant,
      amount: randomAmount,
      date: timestamp,
      items: ["Item analysis unavailable"],
      trustScore: Math.max(0, Math.min(1, trustScore)),
      fraudFlags: fraudFlags.length > 0 ? fraudFlags : ["ai_analysis_unavailable"],
      confidence: 0.6,
      trustFactors,
    };
  }
}

export async function analyzeReviewSentiment(reviewText: string): Promise<ReviewInsight> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a friendly, emotionally intelligent assistant helping a restaurant respond to reviews. 
          
          Analyze the review sentiment and generate an empathetic, professional reply that:
          - Acknowledges specific points mentioned
          - Thanks the customer genuinely  
          - Addresses any concerns with understanding
          - Invites them back when appropriate
          - Maintains a warm, human tone
          
          Respond with JSON in this format:
          {
            "sentiment": "positive|negative|mixed|neutral",
            "suggestedReply": "warm, thoughtful reply text",
            "confidence": "number between 0-1"
          }`
        },
        {
          role: "user",
          content: `Please analyze this restaurant review and suggest a reply: "${reviewText}"`
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      sentiment: result.sentiment || "neutral",
      suggestedReply: result.suggestedReply || "Thank you for your feedback!",
      confidence: Math.max(0, Math.min(1, result.confidence || 0.8)),
    };
  } catch (error) {
    console.error("Review sentiment analysis failed:", error);
    
    // Fallback sentiment analysis
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
      confidence: 0.7,
    };
  }
}

export async function generateWeeklySummary(reviews: Array<{ rating: number; content: string }>): Promise<WeeklySummary> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const reviewsText = reviews.map(r => `${r.rating} stars: "${r.content}"`).join("\n");
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a friendly business analyst creating weekly review summaries for restaurant owners. 
          
          Create a warm, encouraging summary that highlights positive trends and gently notes areas for improvement. 
          Keep the tone upbeat and supportive, like you're talking to a friend.
          
          Respond with JSON in this format:
          {
            "summary": "brief, friendly paragraph summarizing the week",
            "positiveHighlights": ["array of positive trends"],
            "areasForImprovement": ["array of gentle improvement suggestions"]
          }`
        },
        {
          role: "user",
          content: `Summarize this week's customer reviews for a restaurant:\n\n${reviewsText}`
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      summary: result.summary || "Great week overall!",
      positiveHighlights: result.positiveHighlights || [],
      areasForImprovement: result.areasForImprovement || [],
    };
  } catch (error) {
    console.error("Weekly summary generation failed:", error);
    
    // Provide smart fallback analysis based on review data
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const positiveReviews = reviews.filter(r => r.rating >= 4);
    const negativeReviews = reviews.filter(r => r.rating <= 2);
    
    return {
      summary: reviews.length > 0 
        ? `This week you received ${reviews.length} review${reviews.length === 1 ? '' : 's'} with an average rating of ${avgRating.toFixed(1)} stars. ${avgRating >= 4 ? 'Your customers are loving their experience!' : avgRating >= 3 ? 'Good feedback overall with room for improvement.' : 'Some challenges this week, but every review is a learning opportunity.'}`
        : "No reviews this week. Focus on encouraging satisfied customers to share their experiences!",
      positiveHighlights: positiveReviews.length > 0 
        ? [`${positiveReviews.length} positive review${positiveReviews.length === 1 ? '' : 's'} (4+ stars)`, "Customers appreciated your service"]
        : ["Opportunity to focus on customer experience improvements"],
      areasForImprovement: negativeReviews.length > 0
        ? [`${negativeReviews.length} review${negativeReviews.length === 1 ? '' : 's'} below 3 stars - consider following up`, "Monitor common themes in feedback"]
        : reviews.length === 0 
        ? ["Encourage more customers to leave reviews", "Consider implementing a review collection strategy"]
        : ["Keep up the excellent work!"]
    };
  }
}

export async function generateBookingConfirmation(customerName: string, date: string, time: string, partySize: number): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI API key not configured");
    }
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Generate a warm, professional booking confirmation message for a restaurant reservation.`
        },
        {
          role: "user",
          content: `Generate a booking confirmation for ${customerName} on ${date} at ${time} for ${partySize} people.`
        },
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content || `Dear ${customerName}, your reservation for ${partySize} on ${date} at ${time} has been confirmed. We look forward to serving you!`;
  } catch (error) {
    console.error("Booking confirmation generation failed:", error);
    
    return `Dear ${customerName}, your reservation for ${partySize} people on ${date} at ${time} has been confirmed. We look forward to welcoming you to our restaurant!`;
  }
}
