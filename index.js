const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { createClient } = require("@deepgram/sdk");
const axios = require("axios");
const { pipeline } = require("stream/promises");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// =======================================================
// 🔑 Deepgram API Key
// =======================================================
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const deepgram = createClient(DEEPGRAM_API_KEY);

// =======================================================
// 🔑 Claude API Key
// =======================================================
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// =======================================================
// Express Middleware
// =======================================================
app.use(cors());
app.use(express.json());

app.use("/audio", express.static("audio"));

// =======================================================
// Multer Config
// =======================================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

// =======================================================
// Deepgram: Transcribe Function (STT)
// =======================================================
async function transcribeFile(filePath) {
  const audioStream = fs.createReadStream(filePath);

  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioStream,
    {
      model: "nova-3",
      smart_format: true,
      language: "en",
    }
  );

  if (error) throw error;

  return result;
}

// =======================================================
// Deepgram: Speak Function (TTS)
// =======================================================
async function generateTtsAudio(text) {
  // Make sure audio directory exists
  const outputDir = "audio";
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const fileName = `reply-${Date.now()}.mp3`;
  const outputPath = `${outputDir}/${fileName}`;

  // 🔊 Call Deepgram TTS
  const response = await deepgram.speak.request(
    { text },
    {
      model: "aura-2-thalia-en",
    }
  );

  const stream = await response.getStream();

  if (!stream) {
    throw new Error("No TTS stream returned from Deepgram");
  }

  const file = fs.createWriteStream(outputPath);

  try {
    await pipeline(stream, file);
    console.log(`🎧 Audio file written to ${outputPath}`);
    // This is the URL the frontend can use
    return `/audio/${fileName}`;
  } catch (e) {
    console.error("Error writing audio to file:", e);
    throw e;
  }
}

// =======================================================
// Claude: Tutor Function
// =======================================================
async function askClaude(questionText, mode = "general") {
  if (!CLAUDE_API_KEY) throw new Error("Claude API key missing");

  const modeDescription =
    mode === "math"
      ? "You are a Math Tutor. Explain formulas and show 1–2 simple examples."
      : mode === "english"
      ? "You are an English Tutor. Fix grammar and improve sentences."
      : mode === "dsa"
      ? "You are a DSA Tutor. Explain algorithms with small examples."
      : "You are a friendly tutor.";

  const systemPrompt = `
You are an AI Voice Tutor.
${modeDescription}

Rules:
- Explain step-by-step in simple language.
- Keep responses short enough to speak (4–8 sentences).
- End with: "Do you want another question?"
`.trim();

  const payload = {
    model: "claude-3-5-haiku-latest",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Student question: "${questionText}"`,
          },
        ],
      },
    ],
  };

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    payload,
    {
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const answer = response.data?.content?.[0]?.text || "";
  return answer;
}

// =======================================================
// 🎤 Upload File → Transcribe → Ask Claude → TTS
// =======================================================
app.post("/uploadFile", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "File not uploaded" });

    const filePath = req.file.path;

    // 1️⃣ Deepgram Transcription
    const dgResult = await transcribeFile(filePath);
    const transcript =
      dgResult.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    if (!transcript) {
      return res.json({
        message: "No speech detected",
        transcript: "",
        claudeAnswer: "",
        audioUrl: "",
      });
    }

    console.log("🎤 Transcript:", transcript);

    // 2️⃣ Tutor Mode
    const mode = req.body.mode || "general";

    // 3️⃣ Claude Answer
    const claudeAnswer = await askClaude(transcript, mode);

    console.log("🤖 Claude:", claudeAnswer);

    // 4️⃣ Deepgram TTS for Claude reply
    const audioUrl = await generateTtsAudio(claudeAnswer);

    // 5️⃣ Send back everything to frontend
    res.json({
      message: "Success",
      transcript,
      claudeAnswer,
      audioUrl, // e.g. "/audio/reply-1731672345.mp3"
    });
  } catch (err) {
    console.error("❌ Error:", err?.response?.data || err);
    res.status(500).json({ error: "Server Error" });
  }
});

// =======================================================
// Start Server
// =======================================================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
