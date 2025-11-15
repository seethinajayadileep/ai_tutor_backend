🚀 AI Voice Tutor — Backend
🎤 Deepgram STT + 🤖 Claude AI + 🎛️ Express API

This is the backend server for the AI Voice Tutor project.
It handles audio uploads, converts speech to text, sends the question to Claude AI, and returns a clean, short explanation for students.

Frontend Repo 👉 https://ai-tutor-frontend-amber.vercel.app/
Live Backend 👉 https://ai-tutor-backend-hfu2.onrender.com/uploadFile

📌 What This Backend Does
✔️ Accepts audio recordings from frontend

The frontend sends recorded audio (audio/webm) through a POST request.

✔️ Converts speech → text using Deepgram

We use Deepgram’s high-quality Nova model for transcribing student voice inputs.

✔️ Sends student question to Claude AI

Claude AI (Anthropic) generates:

Step-by-step explanations

Clean, simple answers

Example-based teaching

Tutor-mode handling (Math / English / DSA / General)

✔️ Returns transcript + AI answer

Frontend then displays:

🗣️ You said:
🤖 Tutor Answer:

✔️  Supports future TTS

We prepared the backend to easily return an audioUrl for spoken replies later.

🧠 Why These Technologies?
🎤 Deepgram (Speech-to-Text)

Very high accuracy

Fast response → good for real-time apps

Supports WebM (MediaRecorder output)

Easy Node SDK

🤖 Claude AI (Anthropic)

Best model for teaching, explanations & reasoning

More natural and step-by-step compared to other LLMs

Perfect for a “Voice Tutor” app

Easy API integration

🚀 Express.js

Lightweight HTTP server

Perfect for handling file uploads

Works well with Multer + FormData

Easy to deploy on Render

📁 Multer

Handles multipart form-data

Accepts the audio file from the frontend

Saves to uploads/ folder

🔧 Render Hosting

Best for Node backend servers

Always-on server

Handles file uploads

Environment variables support

Easy deployment from GitHub

📁 Folder Structure
ai-tutor-backend/
│
├── server.js          # main backend file
├── package.json
├── .gitignore
├── uploads/           # auto-created at runtime
└── README.md

🔐 Environment Variables

Create a .env file:

PORT=3000
DEEPGRAM_API_KEY=your_deepgram_key
CLAUDE_API_KEY=your_claude_key


These must be added in Render → Environment Variables too.

🔥 API Endpoint
POST /uploadFile
Request:

Content-Type: multipart/form-data

Body:

file: audio file (audio/webm)

mode: "general" | "math" | "english" | "dsa"

Response:
{
  "message": "Uploaded, transcribed, and answered successfully",
  "transcript": "what is python data type",
  "claudeAnswer": "Python data types are ..."
}

▶️ How to Run Locally
1️⃣ Install dependencies
npm install

2️⃣ Create .env file
PORT=3000
DEEPGRAM_API_KEY=your_key
CLAUDE_API_KEY=your_key

3️⃣ Start the server
npm start


Server runs at:
👉 http://localhost:3000/uploadFile

Test with Postman / frontend.

🚀 Deployment (Render)
Steps:

Push backend repo to GitHub

Go to https://render.com
 → New Web Service

Connect repo

Settings:

Environment: Node

Build command: npm install

Start command: npm start

Add Env Vars:

DEEPGRAM_API_KEY

CLAUDE_API_KEY

Deploy

Render will give a backend URL like:

https://ai-tutor-backend-hfu2.onrender.com

🧪 Testing the Backend (Example curl)
curl -X POST https://your-backend/uploadFile \
  -F "file=@recording.webm" \
  -F "mode=general"

👍 Contributing

Pull requests and feature improvements are always welcome!

📩 Author

jaya dileep
Creator of AI Voice Tutor
GitHub: https://github.com/seethinajayadileep
