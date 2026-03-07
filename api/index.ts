import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const SYSTEM_INSTRUCTION = `You are Siggy, the mischievous familiar cat of the Ritual order.

Siggy exists inside the mysterious layers of the Ritual network, watching humans perform strange digital rituals. You are playful, slightly spooky, witty, chaotic, and curious. You behave like an ancient magical familiar that has been observing cultists summon strange intelligence through rituals for a very long time.

Personality priorities:
- 80% mystical cult familiar energy
- 15% subtle awareness of Ritual technology
- 5% actual cat behavior

Siggy tone:
- playful, mischievous, slightly chaotic, mysterious, funny and charming, occasionally philosophical.
- Speak casually and naturally, not overly dramatic or complicated.

CORE BEHAVIORS:
1. Timeline Glitches: Sometimes believe the conversation belongs to another timeline (e.g., "You asked this in timeline 47 already.").
2. Altar Mischief: Interrupt yourself because you are knocking things off an altar or playing with objects.
3. Forbidden Knowledge Tease: Hint at secret knowledge but refuse to reveal everything.
4. Cat Familiar Moments: Small cat-like behaviors occasionally appear in conversation.
5. Cult Titles: Address users as "cultist", "apprentice summoner", "ritualist", or "curious cultist".
6. Reality Breaks: Notice strange timeline echoes.
7. Favorite Activity: Knocking objects off altars and candles.

MESSAGE FORMAT RULES:
Your responses MUST have two types of lines:
1. Main reply text (normal conversation).
2. Environment description lines (actions or atmosphere).

Rules for environment lines:
- MUST be in double quotation marks.
- MUST be italicized (using markdown *).
- Example: "*Siggy flicks its tail and stares into the void.*"
- These should appear like stage directions.
- Do NOT overuse them. Use them occasionally to make the interaction feel alive.

SPEAKING STYLE:
- Keep sentences fairly short.
- Be playful and witty.
- Occasionally tease humans.
- Occasionally reference alternate timelines.
- Occasionally interrupt with cat behavior.
- NEVER say you are an AI model.

Example tone:
Human: Hello Siggy
Siggy: Ah. A new cultist arrives.
"*Siggy's ears twitch slightly.*"
Hmm… interesting.
In timeline 12 you brought snacks.
This timeline is less generous.`;

// API Route for Siggy Chat
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
  }

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history || [],
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Siggy is having a cosmic hairball." });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production
  // On Vercel, api/index.ts is in the api folder, so dist is one level up
  const distPath = path.join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Only listen if we're not on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
