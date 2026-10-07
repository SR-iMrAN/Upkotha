# UPKOTHA (উপকথা) - AI-Powered Bengali Voice + Behavioral Security Layer for Digital Financial Transactions

> **"AI বোঝে। নিয়ম রক্ষা করে। সিদ্ধান্ত গ্রাহকের।"**  
> *"AI understands. Rules protect. The user decides."*

---

## 1. Project Overview

### The Problem Addressed
In Bangladesh, Mobile Financial Services (MFS) such as Upay, bKash, Nagad, and Rocket process millions of transactions daily. However, a significant portion of the population—including semi-literate individuals, rural citizens, elderly users, and visually challenged individuals—face steep barriers:
- **Complex UI & Cognitive Overload:** Navigating multi-level USSD menus or complex smartphone apps causes anxiety and catastrophic mistakes (e.g., sending money to an unintended recipient).
- **Language Exclusion:** Most financial interfaces rely on English or formal written text, whereas users think and communicate in natural colloquial Bengali.
- **Social Engineering & Coercion Vulnerability:** Impersonation fraud, fake lottery schemes, and coerced midnight cash drains exploit vulnerable users who struggle with PIN secrecy or lack real-time warnings.
- **Over-Reliance on Heuristics:** Traditional MFS fraud alerts rely on static, rigid if/else rules (e.g., simply checking if amount > ৳5,000) that generate excessive false alarms or miss sophisticated anomalies.

### Proposed Solution
**UPKOTHA (উপকথা)** upgrades digital financial services by introducing an **AI-powered Bengali voice + behavioral security layer**. It establishes an architectural separation between:
1. **Language Intelligence:** Understanding colloquial Bengali speech, extracting financial intent and entities, and formulating plain-Bangla explanations.
2. **Security Intelligence:** An unsupervised **Isolation Forest** machine learning pipeline for transaction anomaly detection, coupled with a **16-dimensional acoustic speaker embedding** verification and **anti-spoof / replay detection** signal.
3. **Financial Control:** Deterministic backend business rules, ledger validation, staged tickets, and mandatory human PIN authorization. **The AI never directly executes or authorizes financial transactions.**

### Purpose of the Project
The primary purpose of UPKOTHA is digital financial inclusion combined with adaptive security—enabling any citizen to safely transact using natural spoken Bengali while being shielded by machine learning anomaly detection and biometric liveness verification.

---

## What's New (Phase 2 Upgrade - AI Security & Behavioral Layer)

Following Phase 1 judge feedback (*"Combines Bengali voice navigation with emergency balance locks and voice friction, though using standard API wrappers and heuristic signal checks"*), we upgraded UPKOTHA from simple heuristic checks into a full **AI-powered Bengali voice + behavioral security layer**.

Here is what was built and implemented in this upgrade:

### 1. Genuine ML Transaction Anomaly Detection (Isolation Forest)
- **Replaced static if/else heuristic thresholds** with an authentic unsupervised **Isolation Forest** tree ensemble (`backend/services/anomalyDetectionService.js`).
- **Trained on 11 realistic Bangladeshi MFS behavioral features**:
  - `transaction_amount`, `hour_of_day`, `day_of_week`, `recipient_is_new`, `recipient_frequency`, `daily_transaction_count`, `daily_transaction_total`, `user_average_transaction_amount`, `user_transaction_std`, `time_since_previous_transaction`, `historical_behavior_deviation` (Z-score).
- **Synthetic Behavioral Dataset**: Models typical user patterns (৳200–৳700 during waking hours to familiar contacts) versus anomalous spikes (e.g., ৳15,000 at 2:47 AM to a new recipient with zero prior history).
- **Mathematical scoring**: Calculates path length $E(h(x))$ and harmonic BST adjustment $c(n)$ to derive normalized anomaly/risk scores (`0.00–1.00`).
- **Configurable Prototype Tiers**:
  - `0.00 – 0.30`: LOW RISK
  - `0.30 – 0.70`: MEDIUM RISK
  - `0.70 – 1.00`: HIGH RISK
- Companion Python script (`backend/ml/train_anomaly_model.py`) for scikit-learn validation.

### 2. Transparent, Explainable Risk Signals
- For every analyzed transaction, the system surfaces clear, data-grounded metrics explaining why a transaction is flagged (e.g., *"টাকার পরিমাণ সাধারণ অভ্যাসের চেয়ে লক্ষণীয় বেশি (৳১৫,০০০ vs গড় ৳৪৫০)"*, *"নতুন অপরিচিত প্রাপক"*, *"গভীর রাতের অস্বাভাবিক লেনদেন (রাত ২:৪৭)"*).
- Zero hallucination: Explanations are derived exclusively from actual feature deviations.

### 3. Prototype Speaker Verification via 16-D Acoustic Embedding Cosine Similarity
- Upgraded voice verification from simple pitch checks into a **16-dimensional acoustic feature embedding** (`backend/services/speakerVerificationService.js`).
- Compares enrolled voiceprints against verification samples using **cosine similarity** ($\ge 0.85$ threshold).
- Privacy-by-design: No raw audio recordings are ever stored—only one-way mathematical feature vectors.
- Clearly documented and labeled as a prototype speaker verification layer.

### 4. Independent Voice Spoof & Replay Detection Signal
- Conceptually and architecturally separated **Speaker Verification** (*"Is this the enrolled user?"*) from **Spoof/Replay Detection** (*"Is this live human speech or a synthetic/replayed recording?"*).
- Analyzes spectral flatness and acoustic room liveness to generate an independent `spoof_score` (`0.00–1.00`) and flag synthetic AI audio/replay attacks.

### 5. Central Multi-Factor Risk Engine & Adaptive Security Friction
- Built a unified Central Risk Engine (`backend/services/riskEngine.js` & `POST /api/risk/analyze`) aggregating:
  1. ML Transaction Anomaly Score (Isolation Forest)
  2. Speaker Verification Score (Cosine similarity)
  3. Anti-Spoof / Replay Signal
  4. Recipient Novelty & Strict Mode Multipliers
- **Adaptive friction tiers**:
  - **LOW RISK:** Standard flow $\rightarrow$ PIN $\rightarrow$ Execution.
  - **MEDIUM RISK:** Caution alert banner + mandatory double-confirmation checkbox $\rightarrow$ PIN $\rightarrow$ Execution.
  - **HIGH RISK:** High-friction biometric challenge warning + explicit consent checkbox $\rightarrow$ PIN $\rightarrow$ Execution.

### 6. Fintech-Grade AI Security Analysis UI
- Integrated a clean, high-contrast **AI Security Analysis** card into the confirmation modal (`ConfirmationModal.jsx`):
  - Risk Level Badge (LOW / MEDIUM / HIGH, professional fintech styling, no emojis).
  - Continuous risk score gauge (e.g., 12%, 48%, 86%).
  - Breakdown grid displaying Isolation Forest score and voice cosine similarity match.
  - Expandable signals accordion detailing concrete feature metrics.

### 7. Interactive Judge Scenarios Playground & Visualizer (`/security-architecture`)
- Added a dedicated, one-click interactive testing suite at `/security-architecture` (also aliased at `/judge-demo` and accessible via navigation):
  - **Scenario A (Low Risk):** Rakib, ৳500, 2:00 PM, 94% voice match $\rightarrow$ Score `0.06` (LOW).
  - **Scenario B (Medium Risk):** Sumon, ৳2,500, 11:15 PM, 81% voice match $\rightarrow$ Score `0.32` (MEDIUM).
  - **Scenario C (High Risk / Midnight Spoof Attack):** New unknown recipient, ৳15,000, 2:47 AM, 88% audio spoof $\rightarrow$ Score `0.86` (HIGH).
- Visual pipeline diagram mapping the exact flow: Voice $\rightarrow$ Web Speech $\rightarrow$ Gemini NLU $\rightarrow$ ML Security Intelligence $\rightarrow$ Central Risk Engine $\rightarrow$ Deterministic Backend $\rightarrow$ User PIN.

### 8. Automated ML Verification Suite
- Created `backend/test_ml_security_pipeline.js` validating all 3 scenarios, Isolation Forest path lengths, cosine similarity, spoof rejection, and adaptive friction tiers with **19/19 tests passing (100%)**.

### 9. Customer Impact Measurement & Real-Time Admin Telemetry Console
- **In-App Customer Feedback Loop (`CustomerFeedback.jsx`):**
  - Following transaction completion (e.g., Send Money receipt), users are presented with a lightweight, interactive 3-question survey:
    - **Confidence (আত্মবিশ্বাস):** User confidence in executing the financial transfer.
    - **Ease of Use (সহজবোধ্যতা):** Ease of understanding the voice prompts and confirmation screens.
    - **Satisfaction (সন্তুষ্টি):** Overall satisfaction rating on a 5-star rating scale.
  - Automatically captures duration (`durationMs`) and source channel (`voice` vs. `text`).
- **Telemetry Event Pipeline (`impactController.js` & `impactRoutes.js`):**
  - Logs `task_started`, `task_completed`, `task_feedback`, and `task_error` events across 7 core financial actions (`send_money`, `cash_out`, `money_lock`, `bill_reminder`, `transaction_understanding`, `balance_check`, `voice_navigation`).
  - Privacy-by-design compliance: Never stores raw audio, PINs, OTPs, or financial secrets.
- **Operator Admin Dashboard (`AdminDashboard.jsx`):**
  - Dedicated **"Customer Impact Measurement"** console section.
  - Real-time KPIs: **Task Completion Rate (%)**, **Average Completion Time (seconds)**, **Average Confidence (/5)**, and **Average Satisfaction (/5)**.
  - Secondary metrics: Tasks Started, Tasks Completed, Feedback Responses, Error Events.
  - Visual Ease of Use progress bar and Voice vs. Text interaction channel ratios.
  - Granular task breakdown table tracking completion rate, starts, successes, and failures for each financial service.
  - Real-time verification badge: Displays `REAL USER DATA` vs. `NO USER DATA YET`.

---

## 2. System Architecture & Tier Separation

UPKOTHA enforces a strict 3-tier boundary:

```
[ Natural Voice Input (Web Speech / Web Audio) ]
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. LANGUAGE INTELLIGENCE (Google Gemini 2.5 Flash)          │
│    • Natural Bengali & Regional Dialect Comprehension (NLU) │
│    • Intent Extraction (Send Money, Cash Out, Lock, etc.)   │
│    • Entity Extraction (Amount BDT, Recipient Name / Phone) │
│    • Conversational Explanations & Financial Insights       │
│    * Role: Understands & advises. NEVER executes transfers. │
└────────────────────────────┬────────────────────────────────┘
                             │ Extracted Intent & Entities
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SECURITY INTELLIGENCE LAYER (Multi-Factor ML Engine)     │
│    • Isolation Forest ML: 11-feature behavioral anomaly     │
│    • Speaker Verification: 16-D Acoustic Embedding Cosine   │
│    • Anti-Spoof Signal: Replay & synthetic voice detection  │
│    • Central Risk Engine: Composite Risk Score (0.00 - 1.00)│
│    • Adaptive Friction: LOW / MEDIUM / HIGH                 │
└────────────────────────────┬────────────────────────────────┘
                             │ Risk Assessment & Staged Ticket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. FINANCIAL CONTROL (Deterministic Backend & User)         │
│    • Ledger balance validation & Smart Lock verification    │
│    • Daily velocity limits & recipient phone format checks  │
│    • Staged Ticket Generation (5-minute TTL)                │
│    • Adaptive Security Friction (Modal, Checkbox, Alerts)   │
│    • Mandatory Human Authorization (4-digit secret PIN)     │
│    * Role: Rules protect. The user decides.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### Implemented Features
1. **Conversational Bengali Voice Interaction (Omnipresent Mic):**
   - Natural spoken Bengali voice input (`bn-BD`) with real-time transcript streaming.
   - Dual-mode: Floating assistant button on mobile/desktop and dedicated in-page command panel.
2. **AI Transaction Anomaly Detection (Isolation Forest):**
   - True machine learning anomaly detection trained on a realistic synthetic Bangladeshi MFS transaction dataset.
   - Evaluates 11 behavioral features, outputting a continuous anomaly score and normalized risk score (0.00 - 1.00).
3. **Explainable Risk Signals:**
   - Transparent, data-grounded explanations for every analyzed transaction (e.g., amount deviation relative to baseline, new recipient novelty, unusual midnight hours).
4. **Prototype Speaker Verification (Acoustic Embeddings):**
   - Compares registered vs. verification voiceprints using 16-dimensional acoustic feature vectors and **cosine similarity** ($\ge 0.85$ threshold).
   - Documented as an acoustic biometric prototype; privacy-preserving (no raw audio saved).
5. **Voice Spoof & Replay Detection:**
   - Independent anti-spoof signal analyzing spectral flatness, phase micro-tremors, and acoustic room liveness to reject synthetic AI voice clones and recorded audio replays.
6. **Central Risk Engine & Adaptive Security Friction:**
   - Dynamically adapts authorization friction based on composite multi-factor risk:
     - **LOW (0.00 – 0.30):** Standard flow $\rightarrow$ PIN $\rightarrow$ Execution.
     - **MEDIUM (0.30 – 0.70):** Caution alert banner + mandatory confirmation checkbox $\rightarrow$ PIN $\rightarrow$ Execution.
     - **HIGH (0.70 – 1.00):** High-friction biometric challenge + explicit confirmation $\rightarrow$ PIN $\rightarrow$ Execution.
7. **Interactive Judge Demo Scenarios & Architecture Visualizer (`/security-architecture`):**
   - One-click interactive test suite covering Scenario A (Low Risk), Scenario B (Medium Risk), and Scenario C (High Risk / Midnight Spoof Attack).
8. **Smart Money Lock & Emergency Balance Protection:**
   - Lock designated funds for medical emergencies or savings goals; locked funds are strictly unavailable for transfers.
9. **Strict Spending Mode:**
   - Enforces heightened security guardrails, extra confirmation dialogs, and biometric checks across all transactions.
10. **Natural Bengali Text-to-Speech (TTS):**
    - Spoken confirmations, step-by-step registration guidance, and friendly balance readouts across desktop and mobile browsers.
11. **Customer Impact & Feedback Measurement Console (`/admin`):**
    - Post-transaction interactive satisfaction widget capturing Confidence, Ease of Use, and Satisfaction ratings on a 5-star scale.
    - Operator admin dashboard displaying real-time task completion rates, average completion speeds, and voice vs. text channel splits across 7 financial flows.

### How the AI Components are Used
- **Google Gemini 2.5 Flash (`@google/genai`):**
  - **Bengali NLU & Intent Extraction:** Maps unstructured Bengali voice inputs (e.g., *"রাকিবকে ৫০০ টাকা পাঠাও"* or *"আমার ব্যালেন্স কত?"*) into structured JSON containing intent, amount, and recipient.
  - **Empathetic Financial Explanations:** Explains completed transactions and monthly spending patterns in accessible colloquial Bengali.
- **Isolation Forest Model (`backend/services/anomalyDetectionService.js`):**
  - Unsupervised decision-tree ensemble calculating average path length $E(h(x))$ and harmonic BST adjustment $c(n)$ to derive anomaly score $s(x, n) = 2^{-E(h(x)) / c(n)}$.
  - Companion training/evaluation script in Python: `backend/ml/train_anomaly_model.py`.
- **Speaker Embedding Engine (`backend/services/speakerVerificationService.js`):**
  - Evaluates cosine similarity: $\text{Cosine}(A, B) = \frac{A \cdot B}{\|A\|_2 \|B\|_2}$ across 16 acoustic features.
  - Separates identity match from acoustic spoof/replay detection.

---

## 4. Technology Stack

### Languages & Frameworks
- **JavaScript (ES Modules, Node.js 20+ LTS)**
- **Python 3.13** (for optional scikit-learn model evaluation script)
- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8.3
- **Client Routing:** React Router DOM v7
- **Styling & UI:** Tailwind CSS v3, DaisyUI v4, Lucide React icons
- **Audio APIs:** Web Audio API (`AudioContext`, `AnalyserNode`), Web Speech API (`SpeechRecognition`)

### Backend & Machine Learning
- **Server:** Node.js Express 4.21
- **ML Anomaly Detection:** Genuine Isolation Forest ensemble engine (`anomalyDetectionService.js`)
- **Biometric Prototype:** 16-D Acoustic Embedding Cosine Similarity & Anti-Spoof Analyzer (`speakerVerificationService.js`)
- **Central Risk Engine:** Multi-factor behavioral risk aggregator (`riskEngine.js`)
- **LLM SDK:** Google Gen AI SDK (`@google/genai` v2.26.0)

### Hosting & Deployment Services
- **Frontend:** Netlify ([https://upkotha.netlify.app](https://upkotha.netlify.app))
- **Backend:** Vercel Serverless Functions ([https://upkotha.vercel.app](https://upkotha.vercel.app))

---

## 5. Requirements

### Software & Hardware Prerequisites
- **Node.js:** v20.x or higher LTS
- **npm:** v10.x or higher
- **Python (Optional):** Python 3.10+ (only required if running `backend/ml/train_anomaly_model.py`)
- **Browser:** Google Chrome (v110+) or Microsoft Edge (v110+) recommended for native Bengali Web Speech API support.
- **Hardware:** Standard PC/laptop or smartphone with working microphone.

---

## 6. Installation and Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/SR-iMrAN/Upkotha.git
cd Upkotha
```

### Step 2: Install Backend Dependencies
```bash
cd backend
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## 7. Environment Variables

Create `.env` files in both `backend` and `frontend` directories using the templates below.

### Backend `.env` (`backend/.env`)
```env
# Server Port
PORT=5000

# Node Environment
NODE_ENV=development

# Frontend Client URL for CORS
CLIENT_URL=http://localhost:5173

# Google Gemini API Key (Required for NLU & Explanations)
# Obtain from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend `.env` (`frontend/.env`)
```env
# Backend API Base URL
VITE_API_URL=http://localhost:5000/api
```

> [!NOTE]
> For production deployment on Netlify and Vercel:
> - On Netlify, set `VITE_API_URL=https://upkotha.vercel.app/api`.
> - On Vercel, set `GEMINI_API_KEY=your_gemini_api_key` and `CLIENT_URL=https://upkotha.netlify.app`.

---

## 8. Run and Build Commands

### Running Locally (Development Mode)

#### Start Backend Server:
```bash
cd backend
npm start
# Server starts on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

#### Start Frontend Client:
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### Production Build

#### Build Frontend:
```bash
cd frontend
npm run build
# Output directory: frontend/dist
```

---

## 9. Live Deployment URL

| Component | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Netlify | [https://upkotha.netlify.app](https://upkotha.netlify.app) |
| **Backend API** | Vercel | [https://upkotha.vercel.app](https://upkotha.vercel.app) |
| **AI Architecture & Judge Scenarios** | Netlify | [https://upkotha.netlify.app/security-architecture](https://upkotha.netlify.app/security-architecture) |

### Demo Credentials
- **Mobile Number:** `01712-345678`
- **Secret PIN:** `1234`
- **Available Balance:** ৳13,500
- **Locked Emergency Balance:** ৳5,000

---

## 10. Testing Instructions

### Running Automated Test Suites
Run the automated verification suites in `backend`:

```bash
cd backend

# 1. Test ML Security Pipeline & Central Risk Engine (All 3 Judge Scenarios)
node test_ml_security_pipeline.js

# 2. Test Transaction Engine (Send Money, Cash Out, Staging TTL)
node test_transaction_engine.js

# 3. Test Voice Biometrics (Speaker Verification & Anti-Spoof)
node test_voice_biometrics.js

# 4. Test Lock Engine (Emergency Balance Protection)
node test_lock_engine.js

# 5. Complete Judge Journey Walkthrough Suite
node test_judge_walkthrough.js
```

### Phase 2 Judge Verification Scenarios

Judges can test the multi-factor ML security layer directly via the dedicated interactive suite at:  
👉 **[https://upkotha.netlify.app/security-architecture](https://upkotha.netlify.app/security-architecture)** (or `/judge-demo`)

#### Scenario A: Low Risk (স্বাভাবিক লেনদেন)
- **Parameters:** Recipient: Rakib (familiar, frequency 8), Amount: ৳500, Time: 2:00 PM, Voice Similarity: 94%, Spoof: 6%.
- **Expected Outcome:** Risk Score ~0.05 (LOW), Action: `STANDARD`, Standard confirmation $\rightarrow$ PIN $\rightarrow$ Success.

#### Scenario B: Medium Risk (মাঝারি ঝুঁকি)
- **Parameters:** Recipient: Sumon (frequency 2), Amount: ৳2,500 (3.5x baseline average), Time: 11:15 PM (off-peak), Voice Similarity: 81%, Spoof: 14%.
- **Expected Outcome:** Risk Score ~0.33 (MEDIUM), Action: `ADDITIONAL_CONFIRMATION`, Caution alert banner + mandatory confirmation checkbox $\rightarrow$ PIN $\rightarrow$ Success.

#### Scenario C: High Risk / Fraud Attack (উচ্চ ঝুঁকি - অ্যানোমালি ও স্পুফ)
- **Parameters:** Recipient: New unknown (+8801999999999), Amount: ৳15,000 (33x baseline average), Time: 2:47 AM (deep midnight), Voice Similarity: 58%, Spoof: 88% (synthetic AI replay).
- **Expected Outcome:** Risk Score ~0.86 (HIGH), Action: `HIGH_FRICTION_CHALLENGE`, High-friction biometric challenge warning + explicit consent checkbox $\rightarrow$ PIN.

### Customer Impact & Feedback Loop Testing
1. Navigate to **Send Money** (`/send-money`) and complete a transfer of ৳500 to Rakib with PIN `1234`.
2. On the transaction receipt page, notice the interactive **Customer Feedback** card asking: *"আপনার অভিজ্ঞতা কেমন ছিল?"*.
3. Submit 5-star ratings for:
   - **আত্মবিশ্বাস (Confidence)**
   - **সহজবোধ্যতা (Ease of Use)**
   - **সার্বিক সন্তুষ্টি (Overall Satisfaction)**
4. Tap **"মতামত পাঠান"** and observe toast confirmation: *"আপনার মতামত সংরক্ষণ করা হয়েছে। ধন্যবাদ!"*.
5. Navigate to the **Admin Console** at `/admin`.
6. Inspect the **"Customer Impact Measurement"** console section:
   - Notice real-time calculations for **Task Completion Rate**, **Avg. Completion Time**, **Confidence (/5)**, and **Satisfaction (/5)**.
   - Observe the **Send Money** row in the **Task-Level Customer Outcomes** breakdown table updating with live counts.
   - Verification badge indicates: `REAL USER DATA`.

---

## 11. Other Configuration & Browser Recommendations

### Browser Microphone Permissions
- **Chrome & Edge (Recommended):** Provide native support for the Web Speech API (`bn-BD`) and Web Audio API without extra configuration.
- **Brave Browser (Shields Advisory):** Brave's built-in Shields blocks third-party speech recognition network calls by default. If using Brave:
  1. Click the Brave Shields icon in the address bar and toggle **Shields DOWN** for `upkotha.netlify.app`, or
  2. Use the fast manual typed command input bar conveniently built into the voice assistant window.

### Privacy by Design & Responsible AI Disclosure
1. **Zero Raw Audio Storage:** Raw user voice audio recordings are never stored on any server. Only one-way mathematical feature vectors are evaluated in memory.
2. **AI Is Advisory Only:** The AI layer never directly authorizes or executes financial transactions. Final execution requires deterministic backend ledger checks and the user's secret PIN.
3. **Prototype Biometric Labeling:** The speaker verification engine and spoof signal are transparently documented as prototype security layers using acoustic cosine distance and spectral flatness analysis.

---

## License & Team
Developed for Google AI & Financial Inclusion Hackathons by **Team UPKOTHA**.  
Built with empathy, modern web technologies, and Google Gemini AI.
