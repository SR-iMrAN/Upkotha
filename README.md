# UPKOTHA (উপকথা) - AI-Powered Voice-First MFS Assistant

> An intelligent, voice-first Mobile Financial Service (MFS) layer empowering millions across Bangladesh with natural conversational Bengali, voice biometric security, and proactive financial well-being.

---

## 1. Project Overview

### The Problem Addressed
In Bangladesh, Mobile Financial Services (MFS) such as bKash, Nagad, and Rocket process billions of transactions monthly. However, a vast portion of the population—including semi-literate individuals, rural citizens, elderly users, and visually impaired people—face steep digital barriers:
- **Complex UI & Cognitive Overload:** Navigating multi-level menus and alphanumeric forms is intimidating and prone to costly errors (e.g., sending money to the wrong recipient).
- **Language Exclusion:** Most financial interfaces rely on English or formal written text, whereas users think and speak in natural conversational Bengali.
- **Vulnerability to Impersonation & Social Engineering:** Financial fraud and unauthorized phone access target vulnerable users who struggle with PIN secrecy.
- **Reactive Financial Habits:** Users lack actionable, understandable guidance to prevent impulse spending or track recurring utility bill deadlines.

### Proposed Solution
**UPKOTHA (উপকথা)** introduces an inclusive, multimodal AI layer on top of digital wallets:
- **Conversational Bengali Voice Control:** Users can simply speak in authentic colloquial Bangla (e.g., *"রাকিবকে ৫০০ টাকা পাঠাও"* or *"আমার ব্যালেন্স কত?"*) across mobile and desktop browsers.
- **Hardware-Grounded Voice Biometric Guard:** Real-time speaker verification analyzes vocal fundamental frequency (pitch F0 tracking) and anti-spoofing acoustics to ensure only the authorized account owner can execute financial commands.
- **Multimodal Spoken Guidance:** Natural Bangla text-to-speech provides audible confirmations, step-by-step registration guidance, and friendly transaction breakdowns.
- **Proactive Protection:** Strict spending locks, automated bill reminder alerts, and AI-driven spending insights protect household finances.

### Purpose of the Project
The primary purpose of UPKOTHA is financial inclusion and autonomous digital security—enabling any citizen, regardless of literacy level or technical background, to safely and confidently conduct digital financial transactions using their own voice.

---

## 2. Features

### Implemented Features
1. **Conversational Bangla Voice Commands (Omnipresent Mic):**
   - Seamless voice recognition supporting Bengali (bn-BD).
   - Real-time live transcript bubble and one-tap process action.
   - Dual-mode interface: Floating assistant button on mobile/desktop and dedicated in-page voice command panel.
2. **Acoustic Voice Biometric Verification & Anti-Spoofing:**
   - Client-side Web Audio fundamental frequency (F0 pitch tracking in Hz) using autocorrelation algorithms.
   - Biometric voiceprint matching against the account owner's physiological acoustic baseline.
   - Anti-spoofing engine rejecting synthetic AI clones, pre-recorded audio replays, and third-party imposters.
3. **Natural Bengali Text-to-Speech (TTS) Engine:**
   - High-fidelity spoken Bengali audio with cross-platform resilience.
   - Web Audio API streaming fallback for mobile Chrome/Brave browsers that lack native Bengali synthesis voices.
   - Accessible screen-reader support and audio guidance for every page and balance toggle.
4. **Natural Intent & Entity Extraction:**
   - Translates unstructured Bengali speech into structured financial actions (Send Money, Cash Out, Balance Inquiry, Reminders, Emergency Locks, Strict Mode).
5. **Strict Spending Mode & Emergency Balance Locks:**
   - Lock designated funds for medical emergencies, savings goals, or child education.
   - Strict Mode enforces extra biometric verification checks and blocks impulsive transfers.
6. **Smart Bill Reminders & AI Spending Insights:**
   - Proactive tracking of utility bills (electricity, water, internet) with spoken urgency notifications.
   - Categorized monthly expense analysis (Groceries, Utilities, Healthcare, Transportation) with trend indicators.
7. **Inclusive Step-by-Step Voice Onboarding & Multi-Account Registry:**
   - Interactive spoken voice guide assisting users through registration step-by-step.
   - Bengali/English numeral auto-normalization (`০-৯` and `0-9`) preventing validation failures on mobile keyboards.
   - Resilient multi-account fast-fill switcher for demonstration.

### How the AI Components are Used
- **Google Gemini 3.5 Flash-Lite (`@google/genai`):**
  - **Intent & Entity Parsing:** Interprets natural Bengali phrases, handling regional variations, colloquial slang, and mixed Banglish expressions. It accurately extracts the financial intent (e.g., `send_money`, `cash_out`), transaction amount in BDT, recipient name/phone, and user purpose.
  - **Conversational Bangla Explanations:** Formulates empathetic, human-like Bengali spoken explanations for complex transactions, risk notifications, and spending digests.
  - **Step-by-Step Onboarding Greetings:** Dynamically personalizes welcoming voice prompts during user registration based on input stage and progress.
- **Voice Biometrics & Acoustic Engine:**
  - Analyzes fundamental frequency vectors (Hz), pitch deviation tolerances, formant coherence, and spectral centroid.
  - Evaluates liveness score (room acoustics vs. flat digital playback) to block deepfakes and unauthorized third parties before passing requests to transaction handlers.

---

## 3. Technology Stack

### Languages
- **JavaScript (ES Modules / Node.js 20+)**
- **HTML5 & Modern CSS3**

### Frontend
- **Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8.3
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS v3, DaisyUI v4
- **Icons:** Lucide React
- **Modals & Alerts:** SweetAlert2
- **Audio & Speech APIs:** Web Audio API (`AudioContext`, `AnalyserNode`), Web Speech API (`webkitSpeechRecognition`, `speechSynthesis`)

### Backend
- **Runtime:** Node.js (v20+ LTS)
- **Framework:** Express 4.21
- **CORS:** `cors`
- **Environment Management:** `dotenv`

### AI Models & SDKs
- **Primary LLM:** Google Gemini 3.5 Flash-Lite (`gemini-3.5-flash-lite`)
- **Official SDK:** Google Gen AI SDK (`@google/genai` v2.26.0)
- **Speech Synthesis:** Google TTS Streamer with Web Audio ArrayBuffer decoding

### Hosting & Deployment Services
- **Frontend Hosting:** Netlify (Continuous Deployment from GitHub `main`)
- **Backend Hosting:** Vercel Serverless Functions (`@vercel/node`)

---

## 4. Requirements

### Software Prerequisites
- **Node.js:** Version `20.0.0` or higher (Node 22 LTS recommended)
- **npm:** Version `10.0.0` or higher
- **Git:** Version `2.30.0` or higher

### Hardware & Client Requirements
- **Microphone:** Built-in device microphone or external headset for voice recognition and live pitch tracking.
- **Audio Output:** Device speakers or headphones for natural Bengali speech responses.
- **Browser Compatibility:**
  - Google Chrome (Desktop & Android, v110+)
  - Microsoft Edge (Desktop & Android, v110+)
  - Apple Safari (iOS 16+ & macOS)
  - Brave Browser (Shields configured or using built-in Web Audio TTS fallback)

---

## 5. Installation and Setup

Follow these step-by-step instructions to set up the project locally from scratch:

### Step 1: Clone the Repository
```bash
git clone https://github.com/Sifatur1/upkotha.git
cd upkotha
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Configure Backend Environment
Create a `.env` file inside the `backend` folder:
```bash
cp .env.example .env
```
Open `backend/.env` and insert your Gemini API Key:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.5-flash-lite
```

### Step 4: Install Frontend Dependencies
Open a second terminal window and navigate to the `frontend` folder:
```bash
cd ../frontend
npm install
```

### Step 5: Configure Frontend Environment
Create a `.env` file inside the `frontend` folder:
```bash
cp .env.example .env
```
Ensure `frontend/.env` points to your local backend (or leave default):
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Environment Variables

### Backend (`backend/.env`)
| Variable Name | Required | Purpose | Example / Placeholder |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | Port on which the Express server listens (default: 5000) | `5000` |
| `NODE_ENV` | Required | Application runtime environment (`development` or `production`) | `development` |
| `CLIENT_URL` | Required | Allowed CORS origin for frontend requests | `http://localhost:5173` |
| `GEMINI_API_KEY` | **Required** | Google Gemini API Key for NLU, intent extraction, and voice generation | `AIzaSyD...` (Obtain from Google AI Studio) |
| `GEMINI_MODEL` | Required | Gemini model identifier to invoke | `gemini-3.5-flash-lite` |

### Frontend (`frontend/.env`)
| Variable Name | Required | Purpose | Example / Placeholder |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Required** | Base URL pointing to the Express/Vercel backend API endpoint | `http://localhost:5000/api` (Local) or `https://upkotha.vercel.app/api` (Production) |

> **Security Note:** Never commit actual API keys to version control. Both `.env` files are ignored by git in `.gitignore`.

---

## 7. Run and Build Commands

### Running Locally (Development Mode)

1. **Start the Backend Server:**
   ```bash
   cd backend
   npm run dev
   # Server runs at http://localhost:5000
   # Health check at http://localhost:5000/api/health
   ```

2. **Start the Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   # Vite development server launches at http://localhost:5173
   ```

### Building for Production

1. **Build Frontend Bundle:**
   ```bash
   cd frontend
   npm run build
   # Outputs optimized, minified production assets to frontend/dist/
   ```

2. **Preview Frontend Production Build:**
   ```bash
   cd frontend
   npm run preview
   # Serves frontend/dist at a local static port
   ```

3. **Verify Backend Syntax:**
   ```bash
   cd backend
   node -c server.js
   ```

---

## 8. Live Deployment URL

The application is deployed live and fully functional for judges to evaluate:

| Component | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Web Application** | Netlify | [https://upkotha.netlify.app](https://upkotha.netlify.app) |
| **Backend REST API** | Vercel | [https://upkotha.vercel.app](https://upkotha.vercel.app) |
| **API Health Check** | Vercel | [https://upkotha.vercel.app/api/health](https://upkotha.vercel.app/api/health) |

### Demo Credentials for Judges
The system comes pre-loaded with an enrolled biometric account as well as seamless new user registration:
- **Default Account Owner (ইমরান হোসেন):**
  - **Mobile:** `01712-345678`
  - **Secret PIN:** `1234`
  - **Voiceprint:** Enrolled (110 Hz - 155 Hz pitch band)
- **New Account Registration:**
  - Navigate to [https://upkotha.netlify.app/register](https://upkotha.netlify.app/register)
  - You can register any name, 11-digit mobile number, and 4-digit PIN.
  - The voice assistant will guide you step-by-step in spoken Bengali.

---

## 9. Testing Instructions

### Running Backend Automated Verification Suites
The project includes a comprehensive suite of automated verification scripts testing all business logic and resilience mechanisms:

```bash
cd backend

# 1. Test Gemini AI NLU Intent Extraction
node test_gemini_service.js

# 2. Test Voice Biometric Verification & Imposter/Spoof Rejection
node test_voice_biometrics.js

# 3. Test Transaction Engine (Send Money, Cash Out, Limits)
node test_transaction_engine.js

# 4. Test Lock Engine (Emergency Balance Protection)
node test_lock_engine.js

# 5. Test Strict Spending Mode Guardrails
node test_strict_mode.js

# 6. Test Utility Bill Reminders Engine
node test_reminders_engine.js

# 7. Test AI Spending Insights
node test_insights_engine.js

# 8. Test Offline Resilience & Fallbacks
node test_resilience_engine.js

# 9. Test Accessibility, ARIA & Responsive Viewports
node test_a11y_responsive.js

# 10. Complete Judge Walkthrough Suite
node test_judge_walkthrough.js
```

### Manual Feature Verification Checklist for Judges

1. **Voice Command Testing:**
   - Tap the **Mic button** (bottom-right floating icon or in-page panel).
   - Allow microphone permissions in your browser.
   - Speak in Bengali: *"আমার ব্যালেন্স কত?"* (What is my balance?) or *"রাকিবকে ৫০০ টাকা পাঠাও"* (Send 500 Taka to Rakib).
   - Observe live speech-to-text transcript updating in real-time.
   - Tap **"✓ বলা শেষ? প্রসেস করুন"** or pause for auto-finalization.
   - Listen to the natural Bengali audio response confirming your command and watch auto-navigation route you to the pre-filled Send Money confirmation screen.
2. **Biometric Imposter Defense:**
   - Navigate to `/voice-security`.
   - Test "মালিকের কণ্ঠস্বর (স্বাভাবিক)" -> Verification passes with high confidence.
   - Test "অপরিচিত ব্যক্তির কণ্ঠস্বর (Imposter)" -> Blocked with biometric mismatch alert.
   - Test "ডিপফেক বা রেকর্ডকৃত অডিও (Replay Spoof)" -> Blocked with synthetic spoof alert.
3. **Emergency Fund Lock:**
   - Go to `/lock-money`.
   - Lock ৳২,০০০ for "মেডিকেল ইমার্জেন্সি". Notice available balance reduces immediately to prevent impulsive spending.
4. **Strict Mode Enforcement:**
   - Toggle "স্ট্রিক্ট মোড" from the navbar or dashboard.
   - Notice heightened security badges on all financial flows.
5. **New User Registration & Login Persistence:**
   - Log out and click "নতুন অ্যাকাউন্ট নিবন্ধন করুন".
   - Enter your name, mobile, and 4-digit PIN (supports both Bangla numerals `০-৯` and English `0-9`).
   - Listen to the audio onboarding prompts.
   - Log out and log back in; your account details persist seamlessly across sessions.

---

## 10. Other Configuration

### Deployment Configuration Files
- **`netlify.toml` (Frontend):**
  Configures the build output directory (`frontend/dist`), build command (`npm run build`), and SPA single-page redirect rules (`/* -> /index.html 200`) so direct page refreshes resolve cleanly without 404 errors.
- **`vercel.json` (Backend):**
  Defines serverless API routing (`/api/(.*) -> backend/server.js`) and environment handling on Vercel's serverless edge infrastructure.
- **`backend/dataStore.js` Serverless Storage:**
  Automatically detects serverless environments (`process.env.VERCEL`) and initializes writable cache storage under `/tmp/upkotha_data`, eliminating read-only filesystem errors (`EROFS`).

### Browser Microphone Permissions
- When launching for the first time, browsers will prompt: *"Allow upkotha.netlify.app to use your microphone?"*. Select **Allow**.
- In privacy browsers like Brave, ensure shields allow microphone access or utilize the quick manual text input fallback available directly in the voice modal.

---

## License & Team
Developed for Google AI & Financial Inclusion Hackathons by **Team UPKOTHA**. Built with empathy, modern web technologies, and Google Gemini AI.
