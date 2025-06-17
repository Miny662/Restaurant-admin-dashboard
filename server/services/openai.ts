import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface ReceiptAnalysisResult {
  merchantName: string | null;
  amount: number | null;
  date: Date | null;
  items: string[];
  trustScore: number;
  fraudFlags: string[];
  confidence: number;
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

export async function analyzeReceipt(base64Image: string): Promise<ReceiptAnalysisResult> {
  try {
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
            "trustScore": "number between 0-1",
            "fraudFlags": ["array of fraud indicators"],
            "confidence": "number between 0-1"
          }

          Fraud indicators to look for:
          - duplicate_receipt: Signs of duplication or tampering
          - unusual_amount_pattern: Amounts that seem manipulated
          - poor_image_quality: Blurry or suspicious image quality
          - missing_critical_info: Missing merchant info, dates, or amounts
          - inconsistent_formatting: Receipt format doesn't match typical patterns`
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
    
    return {
      merchantName: result.merchantName,
      amount: result.amount,
      date: result.date ? new Date(result.date) : null,
      items: result.items || [],
      trustScore: Math.max(0, Math.min(1, result.trustScore || 0)),
      fraudFlags: result.fraudFlags || [],
      confidence: Math.max(0, Math.min(1, result.confidence || 0)),
    };
  } catch (error) {
    console.error("Receipt analysis failed:", error);
    throw new Error("Failed to analyze receipt: " + (error as Error).message);
  }
}

export async function analyzeReviewSentiment(reviewText: string): Promise<ReviewInsight> {
  try {
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
    console.error("Review analysis failed:", error);
    throw new Error("Failed to analyze review: " + (error as Error).message);
  }
}

export async function generateWeeklySummary(reviews: Array<{ rating: number; content: string }>): Promise<WeeklySummary> {
  try {
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
    throw new Error("Failed to generate weekly summary: " + (error as Error).message);
  }
}

export async function generateBookingConfirmation(partySize: number, time: string): Promise<string> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are helping generate warm, classy booking confirmation messages for a restaurant. Keep them professional yet friendly."
        },
        {
          role: "user",
          content: `Write a warm, classy message confirming a booking for ${partySize} guests at ${time}, and thank them for choosing us.`
        },
      ],
      max_tokens: 200,
    });

    return response.choices[0].message.content || `Thanks so much for booking with us! We've reserved a table for ${partySize} at ${time}. We look forward to hosting you for a wonderful experience!`;
  } catch (error) {
    console.error("Booking confirmation generation failed:", error);
    return `Thanks so much for booking with us! We've reserved a table for ${partySize} at ${time}. We look forward to hosting you for a wonderful experience!`;
  }
}
