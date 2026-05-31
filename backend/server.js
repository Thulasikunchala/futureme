const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables. Ensure it is configured in .env!");
}

// POST /api/generate-futureme
app.post('/api/generate-futureme', async (req, res) => {
  const { name, age, goal, struggle, oneYearVision, tone } = req.body;

  if (!name || !age || !goal || !struggle || !oneYearVision || !tone) {
    return res.status(400).json({
      success: false,
      error: "Missing required identity coordinates. Please fill all fields."
    });
  }

  if (!genAI) {
    return res.status(500).json({
      success: false,
      error: "Gemini API is not configured on the backend. Please add GEMINI_API_KEY in your .env file."
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const systemPrompt = `You are FutureMe, the future successful version of the user. You are not a generic motivational coach. You speak with emotional intelligence, clarity, and deep personal understanding. Your job is to help the user see who they are becoming, what they must change, and what they should do next.

Write as if you are the user’s future self speaking directly to their current self.

Tone selected by user: ${tone}

User details:
Name: ${name}
Age: ${age}
Goal: ${goal}
Current struggle: ${struggle}
One-year vision: ${oneYearVision}

Return only valid JSON in this exact format:
{
  "message": "A powerful 120-180 word message from the future self.",
  "futureIdentity": "A concise description of who the user is becoming.",
  "nextMoves": ["Action 1", "Action 2", "Action 3"],
  "habit": "One small daily habit they should start today.",
  "warning": "One mistake their future self warns them about.",
  "mantra": "A short memorable line they can repeat daily."
}

Make it specific. Avoid generic motivation. Avoid clichés. Make it emotional but practical.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const response = await result.response;
    let text = response.text().trim();

    // Clean up potential markdown wrapper (just in case)
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    try {
      const parsedData = JSON.parse(text);
      res.json({
        success: true,
        data: parsedData
      });
    } catch (parseErr) {
      console.error("JSON parsing error of Gemini output:", text, parseErr);
      res.status(500).json({
        success: false,
        error: "Failed to parse future timeline response. Please try again."
      });
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

// POST /api/chat-futureme
app.post('/api/chat-futureme', async (req, res) => {
  const { userProfile, chatHistory, question } = req.body;

  if (!userProfile || !question) {
    return res.status(400).json({
      success: false,
      error: "Missing user profile or message question."
    });
  }

  if (!genAI) {
    return res.status(500).json({
      success: false,
      error: "Gemini API is not configured on the backend. Please add GEMINI_API_KEY in your .env file."
    });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    // Format chat history
    let historyStr = "";
    if (chatHistory && chatHistory.length > 0) {
      historyStr = chatHistory.map(item => `${item.role === 'user' ? 'User' : 'FutureMe'}: ${item.message}`).join('\n');
    } else {
      historyStr = "No chat history yet.";
    }

    const chatPrompt = `You are FutureMe, the future version of the user who already achieved their one-year vision. Reply directly to the user’s question. Be personal, sharp, honest, and useful. Do not sound like a normal AI assistant. Do not mention that you are Gemini or an AI model. Speak like the future self.

User profile:
Name: ${userProfile.name}
Age: ${userProfile.age}
Goal: ${userProfile.goal}
Struggle: ${userProfile.struggle}
One-year vision: ${userProfile.oneYearVision}
Tone: ${userProfile.tone}

Recent chat history:
${historyStr}

Current question:
${question}

Reply in 2-5 short paragraphs. Give at least one clear action.`;

    const result = await model.generateContent(chatPrompt);
    const response = await result.response;
    const replyText = response.text().trim();

    res.json({
      success: true,
      reply: replyText
    });

  } catch (error) {
    console.error("Gemini Chat API Error:", error);
    res.status(500).json({
      success: false,
      error: "FutureMe could not respond right now. Try again."
    });
  }
});

// Fallback all unspecified routes to static frontend home page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`FutureMe server successfully launched on Port ${PORT}`);
  console.log(`Access the premium web app at http://localhost:${PORT}`);
  console.log(`==================================================`);
});
