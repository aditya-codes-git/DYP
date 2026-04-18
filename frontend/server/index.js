import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { runGeminiAnalysis } from './lib/geminiClient.js';
import { runGroqAnalysis } from './lib/groqClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.send('ForensIQ Analysis Engine Backend is Online.');
});

const WORD_COUNT_THRESHOLD = 2500;

app.post('/api/analyze', async (req, res) => {
  try {
    const { paragraphs, modelPreference } = req.body;
    
    if (!paragraphs || !Array.isArray(paragraphs)) {
      return res.status(400).json({ success: false, error: "Invalid paragraph data provided." });
    }

    const totalWords = paragraphs.reduce((count, p) => count + p.text.split(/\s+/).length, 0);
    const userMessage = JSON.stringify(paragraphs);
    
    // Choose model based on preference or size logic
    const useGroq = modelPreference === 'groq' || (!modelPreference && totalWords < WORD_COUNT_THRESHOLD);
    const routingModel = useGroq ? 'groq' : 'gemini';

    console.log(`[API /analyze] Incoming request. Words: ${totalWords}, Routed to: ${routingModel}`);

    let data;
    if (useGroq) {
      if (!process.env.VITE_GROQ_API_KEY) {
         throw new Error("Groq API Key is missing in environment.");
      }
      data = await runGroqAnalysis(process.env.VITE_GROQ_API_KEY, userMessage);
    } else {
      const resolvedApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!resolvedApiKey) {
         throw new Error("Gemini API Key is missing in environment.");
      }
      data = await runGeminiAnalysis(
        resolvedApiKey, 
        userMessage
      );
    }

    res.json({ success: true, data, routingModel });
  } catch (error) {
    console.error("[API /analyze] Fatal Error:", error.message);
    
    let userMessage = "Connection issue. Please try again.";
    
    if (error.message === "All AI models failed") {
       userMessage = "All AI models failed";
    } else if (error.message.includes('not found') || error.status === 404) {
       userMessage = "AI model temporarily unavailable. Retrying failed.";
    } else if (error.message.includes('API key not valid') || error.status === 401 || error.status === 403) {
       userMessage = "AI authentication failed. Please check system configuration.";
    } else if (error.status === 429) {
       userMessage = "AI rate limit exceeded. Please wait a moment and try again.";
    }

    res.status(500).json({ 
      success: false, 
      error: userMessage,
      details: error.bodyText || null,
      statusCode: error.status || 500
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[Express] Backend Engine running on http://localhost:${PORT}`);
});
