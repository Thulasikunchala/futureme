# FutureMe — AI-Powered Personal Reflection Mirror

**FutureMe** is an immersive, AI-powered personal reflection web application. Instead of acting like a standard chatbot, it creates a psychological mirror by simulating a transmission from the user's future self who has already successfully navigated their struggles and achieved their grandest goals.

Developed with Nitish's Founder Labs design guidelines, the application features an elegant, premium Apple-style dark layout with interactive glassmorphism components, rich typography, smooth transitions, and a personalized realtime chat terminal.

---

## Folder Structure

```text
futureme/
├── frontend/
│   ├── index.html   # Apple-style layout & structure
│   ├── style.css    # Decoupled responsive layout styles
│   └── script.js    # Fetch operations, states, clipboard, and chat console
├── backend/
│   ├── server.js    # Express & Node.js API server
│   ├── package.json # NPM dependency index
│   └── .env.example # Environment variable setup templates
└── README.md        # Setup & execution manual
```

---

## Quick Start & Installation

### 1. Configure the Environment Key

To start safely executing calls, navigate into the backend directory and set up your local environment file:

```bash
cd backend
copy .env.example .env
```

Open the newly created `.env` file in your text editor and supply your Google Gemini API key:

```env
GEMINI_API_KEY=AIzaSy... (Your Gemini Key here)
PORT=5000
```

### 2. Install Dependencies

Install the backend Express server dependencies and the Google Gen AI SDK package:

```bash
npm install
```

### 3. Run the Server

Launch the development server. The server automatically serving backend endpoints and statically hosting the frontend page under a single command:

```bash
npm start
```

*Access the web app by visiting: **[http://localhost:5000](http://localhost:5000)***

---

## API Specs

### `POST /api/generate-futureme`
Analyzes your current age, dream, struggle, and tone coordinates to assemble a structured profile and powerful transmission from your future self.

- **Request Body Format**:
  ```json
  {
    "name": "Nitish",
    "age": "23",
    "goal": "Build a successful AI startup",
    "struggle": "Lack of consistency",
    "oneYearVision": "Running a profitable AI company",
    "tone": "Brutally Honest"
  }
  ```

- **Response Body Format**:
  ```json
  {
    "success": true,
    "data": {
      "message": "Look at me, Nitish...",
      "futureIdentity": "An unyielding executor who...",
      "nextMoves": ["Ruthlessly isolate specific time...", "Publish progress...", "..."],
      "habit": "Perform a zero-mercy review every evening...",
      "warning": "Do not trade structural execution for easy planning comfort.",
      "mantra": "Ship before you feel ready."
    }
  }
  ```

---

### `POST /api/chat-futureme`
Opens a direct, context-aware communication line with your future self to answer questions based on your profile and existing chat history.

- **Request Body Format**:
  ```json
  {
    "userProfile": {
      "name": "Nitish",
      "age": "23",
      "goal": "Build a successful AI startup",
      "struggle": "Lack of consistency",
      "oneYearVision": "Running a profitable AI company",
      "tone": "Brutally Honest"
    },
    "chatHistory": [
      { "role": "futureme", "message": "Look at me, Nitish..." }
    ],
    "question": "What should I focus on this week?"
  }
  ```

- **Response Body Format**:
  ```json
  {
    "success": true,
    "reply": "Focus on shipping the minimal usable prototype. Stop checking vanity stats..."
  }
  ```

---

## Premium UI Elements
- **Adaptive Tone Modules**: The system prompt actively instructs Gemini to transform its answers based on selected tones (`Motivational`, `Brutally Honest`, `Calm Mentor`, `CEO Mode`).
- **Realtime Chat Terminal**: Supports smooth scrolling, dynamic typing indicators, and immediate, interactive connection lines.
- **Copy/Share Integrations**: Users can copy a beautifully compiled transcript containing their entire timeline with one click.
