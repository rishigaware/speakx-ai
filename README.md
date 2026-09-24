# AuraSpeak: Multi-Engine AI Text-To-Speech Studio

AuraSpeak is a premium, single-column widescreen Text-to-Speech (TTS) workspace integrating four industry-leading synthesis engines: **ElevenLabs**, **OpenAI TTS**, **Microsoft Azure AI Speech**, and **Sarvam AI**.

Designed with modern aesthetics (glassmorphism, soft gradients, responsive cards), it offers complete slider parameters, native cloud audio generation, and client-side playback controls.

---

## 🚀 Features

### 1. Sarvam AI Studio (Indic Focus)
* **Indic-Optimized Models**: Native integration with the state-of-the-art `bulbul:v3` model.
* **11 Indic Languages**: Full dialect support for Hindi (`hi-IN`), Indian English (`en-IN`), Bengali (`bn-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Marathi (`mr-IN`), Gujarati (`gu-IN`), Punjabi (`pa-IN`), Odia (`or-IN`), Kannada (`kn-IN`), and Malayalam (`ml-IN`).
* **Expressive Regional Speakers**: Access to optimized speakers like **Shubh** & **Shreya** (for Hindi) and **Ratan** & **Ishita** (for English).
* **Native Pace Settings**: Adjust playback speed directly via the API parameters (0.5x - 2.0x).

### 2. ElevenLabs Studio (Free-Tier Aligned)
* **Safe-List Premade Selector**: Standardized to pre-made voices (*Sarah, Roger, Laura, Charlie, George, Callum, River*) to bypass billing validation errors.
* **Auto-Sync Options**: Dynamic syncing buttons for voices and models in the background.
* **Advanced Settings Block**: Compact sliders for *Stability* and *Clarity / Similarity Boost*.
* **Codecs**: Internally locked to the standard free-tier compliant format (`mp3_44100_128`).

### 3. OpenAI TTS Studio
* **Native API Speed Control**: Speed settings (0.25x - 4.00x) are passed directly to the OpenAI API for realistic, natural speech tempo adjustments instead of electronic pitch shifts.
* **Granular Format Support**: Synthesize audio into six different output codecs: **MP3, Opus, AAC, FLAC, WAV, or PCM**.
* **Dynamic Input Bounds**: Enforces OpenAI's strict `4096` character limit in the UI text box.
* **Visual Sync Action buttons**: Direct matching buttons for preset synchronization.

### 4. Microsoft Azure TTS Studio
* **Neural Voices**: Out-of-the-box support for Azure's high-fidelity characters (*Jenny, Guy, Aria, Sonia, Ryan*).
* **Region Configurator**: Set your regional datacenter endpoint directly (e.g. `eastus`, `westus2`).

### 5. Interactive Utilities
* **Direct Downloads**: Download synthesized files with matching file extensions (`.mp3`, `.wav`, `.aac`, `.flac`, etc.).
* **Custom Audio Visualizer**: Animation wave indicator during active speech playbacks.
* **Local Storage Cache**: Your custom API keys are saved securely in your browser's local cache.

---

## 🛠️ Project Architecture

AuraSpeak uses a modular, standardized directory layout separating client-side components, styling, API services, and server-side routes/controllers.

```
text-to-audio/
├── frontend/                     # React + Vite Frontend App
│   ├── src/
│   │   ├── assets/               # SVGs, logos, react/vite assets
│   │   ├── components/           # Reusable UI components
│   │   │   └── controls/         # Voice engine parameter components
│   │   │       ├── AzureControls.jsx
│   │   │       ├── ElevenLabsControls.jsx
│   │   │       ├── OpenAIControls.jsx
│   │   │       └── SarvamControls.jsx
│   │   ├── services/             # Clean API Caller Service
│   │   │   └── ttsService.js
│   │   ├── styles/               # CSS Stylesheets
│   │   │   └── App.css
│   │   ├── App.jsx               # Main Studio Layout component
│   │   ├── index.css             # Root variables & browser resets
│   │   └── main.jsx              # DOM Mounting Entry
│   ├── .env                      # Private frontend credentials (Gitignored)
│   └── package.json              # Frontend scripts & configurations
├── backend/                      # Node + Express API Proxy Gateway
│   ├── controllers/              # Route controller logic
│   │   └── ttsController.js      # Business logic to talk to Sarvam SDK
│   ├── routes/                   # Routing configuration middleware
│   │   └── ttsRoutes.js          # /tts/sarvam endpoint mapping
│   ├── index.js                  # Express entry point
│   ├── .env                      # Private backend keys (Gitignored)
│   └── package.json              # Backend scripts & dependency lock
├── package.json                  # Root workspace script launcher
└── README.md                     # Studio Documentation
```

---

## ⚙️ Setup & Installation

### 1. Configure Credentials

#### Frontend Credentials
Create a `.env` file inside the `frontend` folder to keep your client-side API keys private:

```bash
# Path: frontend/.env
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

#### Backend Credentials
Create or edit the `.env` file inside the `backend` folder to configure Sarvam AI securely:

```env
# Path: backend/.env
PORT=5001
SARVAM_API_KEY=your_sarvam_api_key_here
```

*Note: Environment files (`.env*`) are automatically ignored in git commits to protect credentials.*

### 2. Run the Studio
From the root workspace directory, install dependencies and start both the frontend and backend simultaneously:

```bash
# Install root, frontend, and backend packages
npm install

# Start both services concurrently
npm run dev
```

* **Frontend Studio**: Running on [http://localhost:5173](http://localhost:5173)
* **Backend Gateway**: Running on [http://localhost:5001](http://localhost:5001)

---

## ⚡ Pay-As-You-Go Pricing Side-by-Side

| Provider | Pricing (Per 1 Million Characters) | Billing Style |
| :--- | :--- | :--- |
| **OpenAI TTS** | **$15.00** (Standard) / **$30.00** (HD) | Usage-based pay-as-you-go |
| **Azure AI Speech** | **$16.00** (Standard Neural) | Usage-based after 500,000 free chars/month |
| **Sarvam AI** | **Pay-As-You-Go** | Regional Indic-focused billing |
| **ElevenLabs** | **$110.00 - $300.00** (Starts at $0.11/1k) | Credit tier top-ups |
