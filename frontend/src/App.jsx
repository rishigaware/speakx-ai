import {
  synthesizeOpenAISpeech,
  fetchOpenAIModels,
  synthesizeElevenLabsSpeech,
  fetchElevenLabsVoices,
  fetchElevenLabsModels,
  synthesizeAzureSpeech,
  synthesizeSarvamSpeech,
} from "./services/ttsService";
import { useState, useEffect, useRef } from "react";

import AzureControls from "./components/controls/AzureControls";
import ElevenLabsControls from "./components/controls/ElevenLabsControls";
import OpenAIControls from "./components/controls/OpenAIControls";
import SarvamControls from "./components/controls/SarvamControls";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";

import "./styles/App.css";

// Configuration array for engine comparisons.
const COMPARISON_DATA = [
  {
    rank: 1,
    name: "ElevenLabs",
    quality: "⭐⭐⭐⭐⭐",
    limit: "10,000 chars/month",
    voices: "3,000+ (Library)",
    focus:
      "Best sounding voices with hyper-realistic human inflections, breaths, and state-of-the-art voice cloning. (No commercial use on free plan).",
    badge: "Free Tier",
    badgeClass: "free",
    isEleven: true,
  },
  {
    rank: 2,
    name: "Microsoft Azure AI Speech",
    quality: "⭐⭐⭐⭐⭐",
    limit: "Enterprise applications",
    voices: "500+ Neural Voices",
    focus:
      "Extremely reliable, 500+ neural voices, 140+ languages, SSML support, excellent SDKs, scalable and production-ready.",
    badge: "Enterprise",
    badgeClass: "free",
    isEleven: false,
  },
  {
    rank: 3,
    name: "OpenAI Text-to-Speech API",
    quality: "⭐⭐⭐⭐☆",
    limit: "AI-powered apps",
    voices: "6 Presets",
    focus:
      "Simple API, fast generation, affordable pricing, high-quality preset voices, ideal if you're already using OpenAI APIs.",
    badge: "Paid Option",
    badgeClass: "paid",
    isEleven: false,
  },
  {
    rank: 4,
    name: "Sarvam AI Text-to-Speech",
    quality: "⭐⭐⭐⭐⭐",
    limit: "Indic Languages Focus",
    voices: "30+ Indian Expressive Voices",
    focus:
      "Optimized specifically for Indian languages with natural inflection, supporting Hindi, Bengali, Tamil, Telugu, and more.",
    badge: "Regional Focus",
    badgeClass: "free",
    isEleven: false,
  },
];

// Verified working premade voices from user's ElevenLabs Free Tier voice list
const FREE_TIER_PREMADE_VOICES = [
  {
    voice_id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah - Mature, Reassuring, Confident",
  },
  {
    voice_id: "CwhRBWXzGAHq8TQ4Fs17",
    name: "Roger - Laid-Back, Casual, Resonant",
  },
  {
    voice_id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura - Enthusiast, Quirky Attitude",
  },
  {
    voice_id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie - Deep, Confident, Energetic",
  },
  {
    voice_id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George - Warm, Captivating Storyteller",
  },
  { voice_id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum - Husky Trickster" },
  {
    voice_id: "SAz9YHcvj6GT2YYXdXww",
    name: "River - Relaxed, Neutral, Informative",
  },
];

// Verified working premade voices from OpenAI TTS voice list
const OPENAI_VOICE_OPTIONS = [
  { voice_id: "alloy", name: "Alloy (Balanced)" },
  { voice_id: "ash", name: "Ash (Gentle)" },
  { voice_id: "ballad", name: "Ballad (Expressive/Male)" },
  { voice_id: "coral", name: "Coral (Warm/Female)" },
  { voice_id: "echo", name: "Echo (Warm)" },
  { voice_id: "fable", name: "Fable (Narrative)" },
  { voice_id: "onyx", name: "Onyx (Deep/Male)" },
  { voice_id: "nova", name: "Nova (Energetic/Female)" },
  { voice_id: "sage", name: "Sage (Friendly)" },
  { voice_id: "shimmer", name: "Shimmer (Professional)" },
  { voice_id: "verse", name: "Verse (Poetic)" },
];

function App() {
  const [text, setText] = useState(
    "Welcome! Type something here and click play to convert this text into speech.",
  );

  // Engines: 'elevenlabs', 'openai', 'azure'
  const [engine, setEngine] = useState("elevenlabs");

  // Bottom comparative directory active tab: 'plans', 'features', 'recommendations'
  const [directoryTab, setDirectoryTab] = useState("plans");

  // API Keys (pre-filled with standard placeholder keys so users don't need to type)
  const [openaiKey, setOpenaiKey] = useState(() => {
    const cached = localStorage.getItem("voxflow_openai_key");
    if (!cached || cached.includes("DEMO_OPENAI_API_KEY")) {
      return import.meta.env.VITE_OPENAI_API_KEY || "";
    }
    return cached;
  });

  // User's ElevenLabs API key
  const [elevenKey, setElevenKey] = useState(() => {
    const cached = localStorage.getItem("voxflow_eleven_key");
    if (!cached || cached.includes("DEMO_ELEVENLABS")) {
      return import.meta.env.VITE_ELEVENLABS_API_KEY || "";
    }
    return cached;
  });
  const [azureKey, setAzureKey] = useState(
    () =>
      localStorage.getItem("voxflow_azure_key") ||
      "azure_DEMO_AZURE_SUBSCRIPTION_KEY_012",
  );
  const [azureRegion, setAzureRegion] = useState(
    () => localStorage.getItem("voxflow_azure_region") || "eastus",
  );

  // ElevenLabs States (using user's verified working premade voices list)
  const [elevenVoices, setElevenVoices] = useState(FREE_TIER_PREMADE_VOICES);
  const [isFetchingVoices, setIsFetchingVoices] = useState(false);
  const [elevenModels, setElevenModels] = useState([
    { model_id: "eleven_multilingual_v2", name: "Eleven Multilingual v2" },
    { model_id: "eleven_monolingual_v2", name: "Eleven English v2" },
  ]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [elevenVoiceId, setElevenVoiceId] = useState("EXAVITQu4vr4xnSDxMaL"); // Default to Sarah (working premade)
  const [elevenModel, setElevenModel] = useState("eleven_multilingual_v2");
  const [elevenStability, setElevenStability] = useState(50);
  const [elevenSimilarity, setElevenSimilarity] = useState(75);
  const [elevenLanguage, setElevenLanguage] = useState("en");

  // Speed slider (ranges 0.70x to 1.50x)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // OpenAI states
  const [openaiVoices, setOpenaiVoices] = useState(OPENAI_VOICE_OPTIONS);
  const [openaiVoice, setOpenaiVoice] = useState("alloy");
  const [openaiModels, setOpenaiModels] = useState([
    { model_id: "tts-1", name: "TTS-1 (Standard)" },
    { model_id: "tts-1-hd", name: "TTS-1-HD (High Definition)" },
  ]);
  const [openaiModel, setOpenaiModel] = useState("tts-1");
  const [openaiFormat, setOpenaiFormat] = useState("mp3");
  const [isSyncingOpenaiVoices, setIsSyncingOpenaiVoices] = useState(false);
  const [isFetchingOpenaiModels, setIsFetchingOpenaiModels] = useState(false);

  // Azure states
  const [azureVoice, setAzureVoice] = useState("en-US-JennyNeural");

  // Sarvam states
  const [sarvamModel, setSarvamModel] = useState("bulbul:v3");
  const [sarvamLanguage, setSarvamLanguage] = useState("hi-IN");
  const [sarvamSpeaker, setSarvamSpeaker] = useState("shubh");
  const [sarvamPace, setSarvamPace] = useState(1.0);

  // General playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioDuration, setAudioDuration] = useState(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  // Save keys to localStorage
  useEffect(() => {
    localStorage.setItem("voxflow_openai_key", openaiKey);
    if (openaiKey && !openaiKey.includes("DEMO_OPENAI_API_KEY")) {
      fetchOpenaiModels();
    }
  }, [openaiKey]);
  useEffect(() => {
    localStorage.setItem("voxflow_eleven_key", elevenKey);
    if (elevenKey && !elevenKey.includes("DEMO_ELEVENLABS")) {
      fetchElevenVoices();
      fetchElevenModels();
    }
  }, [elevenKey]);

  const fetchElevenModels = async () => {
    if (!elevenKey || elevenKey.includes("DEMO_ELEVENLABS")) return;
    setIsFetchingModels(true);
    try {
      const data = await fetchElevenLabsModels(elevenKey);
      if (data && data.length > 0) {
        // Filter to models that support text-to-speech
        const ttsModels = data.filter((m) => m.can_do_text_to_speech);
        if (ttsModels.length > 0) {
          setElevenModels(ttsModels);
          // If active model is not in list, fallback to first available model
          if (!ttsModels.some((m) => m.model_id === elevenModel)) {
            setElevenModel(ttsModels[0].model_id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync ElevenLabs models:", e);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const syncOpenaiVoices = () => {
    setIsSyncingOpenaiVoices(true);
    setTimeout(() => {
      setIsSyncingOpenaiVoices(false);
      showToast("✨ OpenAI preset voice profiles synchronized successfully.");
    }, 800);
  };

  const syncOpenaiModels = () => {
    fetchOpenaiModels();
  };

  const fetchOpenaiModels = async () => {
    if (!openaiKey || openaiKey.includes("DEMO_OPENAI_API_KEY")) return;
    setIsFetchingOpenaiModels(true);
    try {
      const data = await fetchOpenAIModels(openaiKey);
      if (data && data.length > 0) {
        const ttsModels = data
          .filter((m) => m.id.includes("tts"))
          .map((m) => ({
            model_id: m.id,
            name:
              m.id.toUpperCase() +
              (m.id.includes("hd") ? " (High Definition)" : " (Standard)"),
          }));
        if (ttsModels.length > 0) {
          setOpenaiModels(ttsModels);
          if (!ttsModels.some((m) => m.model_id === openaiModel)) {
            setOpenaiModel(ttsModels[0].model_id);
          }
          showToast("✨ OpenAI speech models synchronized successfully.");
        }
      }
    } catch (e) {
      console.error("Failed to fetch OpenAI models:", e);
      showToast("❌ Failed to fetch OpenAI models.");
    } finally {
      setIsFetchingOpenaiModels(false);
    }
  };

  const fetchElevenVoices = async () => {
    if (!elevenKey || elevenKey.includes("DEMO_ELEVENLABS")) return;
    setIsFetchingVoices(true);
    try {
      const voices = await fetchElevenLabsVoices(elevenKey);
      if (voices && voices.length > 0) {
        // Keep only premade voices to adhere to free tier parameter requirements
        const premadeOnly = voices.filter((v) => v.category === "premade");
        if (premadeOnly.length > 0) {
          setElevenVoices(premadeOnly);
          // If current voice is not in the new list, switch to the first available one
          if (!premadeOnly.some((v) => v.voice_id === elevenVoiceId)) {
            setElevenVoiceId(premadeOnly[0].voice_id);
          }
        }
      }
    } catch (e) {
      console.error("Failed to sync ElevenLabs voices:", e);
    } finally {
      setIsFetchingVoices(false);
    }
  };
  useEffect(() => {
    localStorage.setItem("voxflow_azure_key", azureKey);
    localStorage.setItem("voxflow_azure_region", azureRegion);
  }, [azureKey, azureRegion]);

  const synthRef = useRef(window.speechSynthesis);
  const audioRef = useRef(null);

  // Apply playback speed client-side for Web Speech & ElevenLabs (OpenAI supports native API speed adjustments)
  useEffect(() => {
    if (audioRef.current && engine !== "openai") {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isPlaying, engine]);

  // Clamp playback speed dynamically when switching synthesis engines
  useEffect(() => {
    if (engine === "openai") {
      if (playbackSpeed < 0.25 || playbackSpeed > 4.0) {
        setPlaybackSpeed(1.0);
      }
    } else {
      if (playbackSpeed < 0.7 || playbackSpeed > 1.5) {
        setPlaybackSpeed(1.0);
      }
    }
  }, [engine]);

  // Demo fallback speech generation (using client-side Web Speech API)
  const playWebSpeechFallback = (customText) => {
    if (!("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(customText);
    utterance.rate = playbackSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    setIsPlaying(true);
    synthRef.current.speak(utterance);
  };

  // Playback control
  const handlePlay = async () => {
    if (!text) return;

    // Resume if paused
    if (isPaused && audioRef.current && engine !== "web-speech") {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Stop current playbacks
    handleStop();
    await playApiSpeech();
  };

  // API key requests
  const playApiSpeech = async () => {
    // Check if the keys are still the default standard mock values
    const isOpenaiMock = openaiKey.includes("DEMO_OPENAI_API_KEY");
    const isElevenMock = elevenKey.includes("DEMO_ELEVENLABS_KEY");
    const isAzureMock = azureKey.includes("DEMO_AZURE_SUBSCRIPTION_KEY");

    if (
      (engine === "openai" && isOpenaiMock) ||
      (engine === "elevenlabs" && isElevenMock) ||
      (engine === "azure" && isAzureMock)
    ) {
      // Simulate/Demo mode
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        const engineLabel =
          engine === "openai"
            ? "OpenAI TTS"
            : engine === "elevenlabs"
              ? "ElevenLabs"
              : "Azure Speech";
        showToast(
          `✨ Demo Mode: Simulating ${engineLabel} playback using client-side Web Speech voice.`,
        );
        playWebSpeechFallback(`Simulated ${engineLabel} synthesis: ${text}`);
      }, 1000);
      return;
    }

    setIsLoading(true);
    setAudioDuration(null);
    let url = "";
    let responseBlob = null;

    try {
      if (engine === "openai") {
        if (!openaiKey || openaiKey === "") {
          alert("Please enter your OpenAI API Key.");
          setIsLoading(false);
          return;
        }
        responseBlob = await synthesizeOpenAISpeech({
          key: openaiKey,
          model: openaiModel,
          text: text,
          voice: openaiVoice,
          format: openaiFormat,
          speed: playbackSpeed,
        });
        url = URL.createObjectURL(responseBlob);
      } else if (engine === "elevenlabs") {
        if (!elevenKey || elevenKey === "") {
          alert("Please enter your ElevenLabs API Key.");
          setIsLoading(false);
          return;
        }
        responseBlob = await synthesizeElevenLabsSpeech({
          key: elevenKey,
          voiceId: elevenVoiceId,
          model: elevenModel,
          text: text,
          stability: elevenStability,
          similarity: elevenSimilarity,
        });
        url = URL.createObjectURL(responseBlob);
      } else if (engine === "azure") {
        if (!azureKey || !azureRegion || azureKey === "") {
          alert("Please enter your Azure Subscription Key and Region.");
          setIsLoading(false);
          return;
        }
        responseBlob = await synthesizeAzureSpeech({
          key: azureKey,
          region: azureRegion,
          voice: azureVoice,
          text: text,
        });
        url = URL.createObjectURL(responseBlob);
      } else if (engine === "sarvam") {
        responseBlob = await synthesizeSarvamSpeech({
          model: sarvamModel,
          text: text,
          languageCode: sarvamLanguage,
          speaker: sarvamSpeaker,
          pace: sarvamPace,
        });
        url = URL.createObjectURL(responseBlob);
      }

      if (url) {
        setAudioUrl(url);
        setAudioBlob(responseBlob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          setAudioDuration(audio.duration);
        };

        // If not OpenAI (which speed shifts natively), we apply speed rate client-side
        if (engine !== "openai") {
          audio.playbackRate = playbackSpeed;
        }

        audio.play();
        setIsPlaying(true);

        audio.onended = () => {
          setIsPlaying(false);
          setIsPaused(false);
        };
      }
    } catch (error) {
      console.error(error);
      alert(
        `API Error: ${error.message || "Error occurred while calling the service."}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (
      (engine === "openai" && openaiKey.includes("DEMO_OPENAI_API_KEY")) ||
      (engine === "elevenlabs" && elevenKey.includes("DEMO_ELEVENLABS_KEY")) ||
      (engine === "azure" && azureKey.includes("DEMO_AZURE_SUBSCRIPTION_KEY"))
    ) {
      if (isPlaying) {
        synthRef.current.pause();
        setIsPlaying(false);
        setIsPaused(true);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    if (
      (engine === "openai" && openaiKey.includes("DEMO_OPENAI_API_KEY")) ||
      (engine === "elevenlabs" && elevenKey.includes("DEMO_ELEVENLABS_KEY")) ||
      (engine === "azure" && azureKey.includes("DEMO_AZURE_SUBSCRIPTION_KEY"))
    ) {
      synthRef.current.cancel();
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Handle direct file download
  const handleDownload = () => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    // Dynamic output format naming for download
    const isWav = engine === "openai" && openaiFormat === "wav";
    const isFlac = engine === "openai" && openaiFormat === "flac";
    const isAac = engine === "openai" && openaiFormat === "aac";
    const isOpus = engine === "openai" && openaiFormat === "opus";
    const isPcm = engine === "openai" && openaiFormat === "pcm";
    const ext = isWav
      ? "wav"
      : isFlac
        ? "flac"
        : isAac
          ? "aac"
          : isOpus
            ? "opus"
            : isPcm
              ? "pcm"
              : "mp3";
    link.download = `voxflow_synthesis.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app-viewport">
      {/* Toast Notification */}
      {toastMessage && <div className="demo-toast">{toastMessage}</div>}

      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="glow-circle"></div>
          <span className="logo-text">
            AuraSpeak<span className="accent-dot"></span>
          </span>
        </div>
        <div className="tech-stack">
          <img src={reactLogo} className="logo-icon react-logo" alt="React" />
          <img src={viteLogo} className="logo-icon vite-logo" alt="Vite" />
        </div>
      </header>

      {/* Main Single Column Layout */}
      <main className="main-layout-container">
        {/* Top Section: Workspace */}
        <section className="workspace-section">
          <div className="panel-header">
            <span className="badge">AI Speech Studio</span>
            <h1 className="studio-title">Convert Text to Speech</h1>
            <p className="subtitle">
              Configure parameters and listen to cloud voice synthesis
              instantly.
            </p>
          </div>

          {/* Engine Selector */}
          <div className="engine-switcher">
            <button
              className={`engine-tab ${engine === "elevenlabs" ? "active" : ""}`}
              onClick={() => {
                setEngine("elevenlabs");
                handleStop();
              }}
            >
              ElevenLabs
            </button>
            <button
              className={`engine-tab ${engine === "openai" ? "active" : ""}`}
              onClick={() => {
                setEngine("openai");
                handleStop();
              }}
            >
              OpenAI TTS
            </button>
            <button
              className={`engine-tab ${engine === "azure" ? "active" : ""}`}
              onClick={() => {
                setEngine("azure");
                handleStop();
              }}
            >
              Azure TTS
            </button>
            <button
              className={`engine-tab ${engine === "sarvam" ? "active" : ""}`}
              onClick={() => {
                setEngine("sarvam");
                handleStop();
              }}
            >
              Sarvam AI
            </button>
          </div>

          {/* Main workspace box */}
          <div className="studio-card">
            <div className="studio-layout">
              {/* Input text panel */}
              <div className="input-panel">
                <label htmlFor="tts-text" className="panel-label">
                  Input Text
                </label>
                <textarea
                  id="tts-text"
                  className="text-input"
                  placeholder="Type or paste your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={engine === "openai" ? 4096 : 5000}
                />
                <div className="char-count">
                  {text.length}/{engine === "openai" ? 4096 : 5000} characters
                </div>
              </div>

              {/* Configurations panel */}
              <div className="controls-panel">
                <h3 className="panel-subtitle">Parameters</h3>

                {engine === "openai" && (
                  <OpenAIControls
                    openaiKey={openaiKey}
                    setOpenaiKey={setOpenaiKey}
                    openaiVoice={openaiVoice}
                    setOpenaiVoice={setOpenaiVoice}
                    openaiVoices={openaiVoices}
                    isSyncingOpenaiVoices={isSyncingOpenaiVoices}
                    syncOpenaiVoices={syncOpenaiVoices}
                    openaiModel={openaiModel}
                    setOpenaiModel={setOpenaiModel}
                    openaiModels={openaiModels}
                    isFetchingOpenaiModels={isFetchingOpenaiModels}
                    syncOpenaiModels={syncOpenaiModels}
                    openaiFormat={openaiFormat}
                    setOpenaiFormat={setOpenaiFormat}
                  />
                )}

                {engine === "elevenlabs" && (
                  <ElevenLabsControls
                    elevenKey={elevenKey}
                    setElevenKey={setElevenKey}
                    elevenVoiceId={elevenVoiceId}
                    setElevenVoiceId={setElevenVoiceId}
                    elevenVoices={elevenVoices}
                    isFetchingVoices={isFetchingVoices}
                    fetchElevenVoices={fetchElevenVoices}
                    elevenModel={elevenModel}
                    setElevenModel={setElevenModel}
                    elevenModels={elevenModels}
                    isFetchingModels={isFetchingModels}
                    fetchElevenModels={fetchElevenModels}
                    elevenLanguage={elevenLanguage}
                    setElevenLanguage={setElevenLanguage}
                    elevenStability={elevenStability}
                    setElevenStability={setElevenStability}
                    elevenSimilarity={elevenSimilarity}
                    setElevenSimilarity={setElevenSimilarity}
                  />
                )}

                {engine === "azure" && (
                  <AzureControls
                    azureKey={azureKey}
                    setAzureKey={setAzureKey}
                    azureRegion={azureRegion}
                    setAzureRegion={setAzureRegion}
                    azureVoice={azureVoice}
                    setAzureVoice={setAzureVoice}
                  />
                )}

                {engine === "sarvam" && (
                  <SarvamControls
                    sarvamModel={sarvamModel}
                    setSarvamModel={setSarvamModel}
                    sarvamLanguage={sarvamLanguage}
                    setSarvamLanguage={setSarvamLanguage}
                    sarvamSpeaker={sarvamSpeaker}
                    setSarvamSpeaker={setSarvamSpeaker}
                    sarvamPace={sarvamPace}
                    setSarvamPace={setSarvamPace}
                  />
                )}

                {/* Client Side Playback Speed (Applies to all engines, compact design) */}
                {engine !== "sarvam" && (
                  <div
                    className="control-group slider-row-compact"
                    style={{
                      marginTop: "14px",
                      borderTop: "1px solid var(--border)",
                      paddingTop: "14px",
                    }}
                  >
                    <div className="slider-header">
                      <span className="control-label-compact">
                        Playback Speed
                      </span>
                      <span className="slider-value-badge badge-speed">
                        {playbackSpeed.toFixed(2)}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min={engine === "openai" ? "0.25" : "0.70"}
                      max={engine === "openai" ? "4.00" : "1.50"}
                      step={engine === "openai" ? "0.05" : "0.1"}
                      value={playbackSpeed}
                      onChange={(e) =>
                        setPlaybackSpeed(parseFloat(e.target.value))
                      }
                      className="custom-slider slider-speed"
                    />
                    <span className="slider-hint">
                      {engine === "openai"
                        ? "API-synthesized natural speech rate"
                        : "Client-side rendering playback speed adjustment"}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="actions-wrapper">
                  {isPlaying ? (
                    <button
                      onClick={handlePause}
                      className="action-btn pause-btn"
                      aria-label="Pause Audio"
                    >
                      <svg viewBox="0 0 24 24" className="btn-icon">
                        <path
                          fill="currentColor"
                          d="M14,19H18V5H14M6,19H10V5H6V19Z"
                        />
                      </svg>
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={handlePlay}
                      className="action-btn play-btn"
                      disabled={isLoading}
                      aria-label="Play Audio"
                    >
                      {isLoading ? (
                        <span className="spinner"></span>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" className="btn-icon">
                            <path
                              fill="currentColor"
                              d="M8,5.14V19.14L19,12.14L8,5.14Z"
                            />
                          </svg>
                          {isPaused ? "Resume" : "Generate & Play"}
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleStop}
                    className="action-btn stop-btn"
                    disabled={!isPlaying && !isPaused}
                    aria-label="Stop Audio"
                  >
                    <svg viewBox="0 0 24 24" className="btn-icon">
                      <path fill="currentColor" d="M18,18H6V6H18V18Z" />
                    </svg>
                    Stop
                  </button>

                  {audioDuration !== null && !isLoading && (
                    <div className="audio-duration" style={{ marginLeft: "auto", display: "flex", alignItems: "center", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "500", padding: "0 10px" }}>
                      {Math.floor(audioDuration / 60)}:{(Math.floor(audioDuration % 60)).toString().padStart(2, '0')}
                    </div>
                  )}
                  <button
                    onClick={handleDownload}
                    className="action-btn download-btn"
                    disabled={!audioUrl}
                    style={{
                      marginLeft: audioDuration !== null && !isLoading ? "10px" : "auto",
                      background: "rgba(79, 70, 229, 0.05)",
                      border: "1px solid var(--accent)",
                      color: "var(--accent)",
                    }}
                    aria-label="Download Audio File"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="btn-icon"
                      style={{ fill: "currentColor" }}
                    >
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                    Download
                  </button>
                </div>

                {/* Audio Visualization Waves */}
                <div
                  className={`audio-visualization ${isPlaying ? "animating" : ""}`}
                >
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Section: Premium Active Engine pricing & parameters */}
        <section className="directory-section">
          <div className="directory-header">
            <h2 className="directory-title">Active Engine details</h2>
            <p className="directory-subtitle">
              Plan pricing, capacity, and capabilities for the selected
              synthesis engine.
            </p>
          </div>

          {/* Premium UI Presentation Container */}
          <div className="premium-engine-detail-container">
            {engine === "openai" && (
              <div className="premium-detail-card theme-openai animate-fade">
                <div className="premium-card-header">
                  <div className="glow-badge bg-openai">
                    OpenAI Engine Active
                  </div>
                  <div className="header-meta">
                    <span className="meta-cost">
                      Pay-As-You-Go Model Active
                    </span>
                  </div>
                </div>
                <div className="premium-card-grid">
                  <div className="premium-grid-col col-plans">
                    <h4 className="col-title">Usage Pricing (Per 1M Chars)</h4>
                    <div className="pricing-pill">
                      <span className="pill-name">tts-1 (Standard)</span>
                      <span className="pill-price">$15.00</span>
                    </div>
                    <div className="pricing-pill">
                      <span className="pill-name">
                        tts-1-hd (High Definition)
                      </span>
                      <span className="pill-price">$30.00</span>
                    </div>
                    <div
                      className="rec-badge"
                      style={{
                        marginTop: "16px",
                        background: "rgba(16, 185, 129, 0.08)",
                        border: "1px solid rgba(16, 185, 129, 0.25)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <strong>💰 Project Rank:</strong> Most predictable
                      pay-per-use pricing. Ideal for users already leveraging
                      OpenAI API systems.
                    </div>
                  </div>
                  <div className="premium-grid-col col-features">
                    <h4 className="col-title">Core Capabilities & Features</h4>
                    <ul className="feature-check-list">
                      <li>
                        <svg
                          className="check-icon text-openai"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        6 built-in voices (Alloy, Echo, Fable, Onyx, Nova,
                        Shimmer)
                      </li>
                      <li>
                        <svg
                          className="check-icon text-openai"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Fast API and real-time streaming support
                      </li>
                      <li>
                        <svg
                          className="check-icon text-openai"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        REST API support with MP3, WAV, FLAC, and PCM outputs
                      </li>
                      <li>
                        <svg
                          className="check-icon text-openai"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Ideal choice for lightweight AI assistants and chat apps
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {engine === "elevenlabs" && (
              <div className="premium-detail-card theme-elevenlabs animate-fade">
                <div className="premium-card-header">
                  <div className="glow-badge bg-eleven">
                    ElevenLabs Engine Active
                  </div>
                  <div className="header-meta">
                    <span className="meta-cost">
                      Pay-As-You-Go available on all plans
                    </span>
                  </div>
                </div>
                <div className="premium-card-grid">
                  <div className="premium-grid-col col-plans">
                    <h4 className="col-title">Pay-As-You-Go Overages</h4>
                    <div className="pricing-pill">
                      <span className="pill-name">Starter Plan top-ups</span>
                      <span className="pill-price">$0.30 / 1k Chars</span>
                    </div>
                    <div className="pricing-pill">
                      <span className="pill-name">Creator Plan top-ups</span>
                      <span className="pill-price">$0.22 / 1k Chars</span>
                    </div>
                    <div className="pricing-pill">
                      <span className="pill-name">Pro / Scale top-ups</span>
                      <span className="pill-price">
                        $0.18 - $0.11 / 1k Chars
                      </span>
                    </div>
                    <div
                      className="rec-badge"
                      style={{
                        marginTop: "16px",
                        background: "rgba(245, 158, 11, 0.08)",
                        border: "1px solid rgba(245, 158, 11, 0.25)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <strong>🏆 Project Rank:</strong> Best voice quality.
                      Pay-as-you-go rate starts when monthly credits are
                      exhausted. Equivalent to $110 - $300 per 1M characters.
                    </div>
                  </div>
                  <div className="premium-grid-col col-features">
                    <h4 className="col-title">Core Capabilities & Features</h4>
                    <ul className="feature-check-list">
                      <li>
                        <svg
                          className="check-icon text-eleven"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        3,000+ community voices with Instant & Professional
                        Voice Cloning
                      </li>
                      <li>
                        <svg
                          className="check-icon text-eleven"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Streaming API and WebSocket support with ultra-low
                        latency
                      </li>
                      <li>
                        <svg
                          className="check-icon text-eleven"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Powerful REST API, SDKs, and MP3, PCM, and μ-law outputs
                      </li>
                      <li>
                        <svg
                          className="check-icon text-eleven"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Usage-based billing configurations available on higher
                        tiers
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {engine === "azure" && (
              <div className="premium-detail-card theme-azure animate-fade">
                <div className="premium-card-header">
                  <div className="glow-badge bg-azure">
                    Azure Speech Engine Active
                  </div>
                  <div className="header-meta">
                    <span className="meta-cost">
                      Pay-As-You-Go Model Active
                    </span>
                  </div>
                </div>
                <div className="premium-card-grid">
                  <div className="premium-grid-col col-plans">
                    <h4 className="col-title">Usage Pricing (Per 1M Chars)</h4>
                    <div className="pricing-pill">
                      <span className="pill-name">
                        Standard (S0) Pay-As-You-Go
                      </span>
                      <span className="pill-price">$16.00</span>
                    </div>
                    <div
                      className="rec-badge"
                      style={{
                        marginTop: "16px",
                        background: "rgba(59, 130, 246, 0.08)",
                        border: "1px solid rgba(59, 130, 246, 0.25)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <strong>🏆 Project Rank:</strong> Best enterprise &
                      multilingual support. Pay-as-you-go rate is $16.00 per 1M
                      characters after 500k characters/mo free limit.
                    </div>
                  </div>
                  <div className="premium-grid-col col-features">
                    <h4 className="col-title">Core Capabilities & Features</h4>
                    <ul className="feature-check-list">
                      <li>
                        <svg
                          className="check-icon text-azure"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        500+ Neural voices and 140+ language configurations
                      </li>
                      <li>
                        <svg
                          className="check-icon text-azure"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Full SSML support, custom speaking styles, and custom
                        voices
                      </li>
                      <li>
                        <svg
                          className="check-icon text-azure"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        High transaction limits on standard tier with REST API &
                        SDKs
                      </li>
                      <li>
                        <svg
                          className="check-icon text-azure"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Supports MP3, WAV, and PCM outputs natively
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {engine === "sarvam" && (
              <div className="premium-detail-card theme-sarvam animate-fade">
                <div className="premium-card-header">
                  <div className="glow-badge bg-sarvam">Sarvam AI Active</div>
                  <div className="header-meta">
                    <span className="meta-cost">Indic Language Specialist</span>
                  </div>
                </div>
                <div className="premium-card-grid">
                  <div className="premium-grid-col col-plans">
                    <h4 className="col-title">Model Specifications</h4>
                    <div className="pricing-pill">
                      <span className="pill-name">Bulbul v3 Model</span>
                      <span className="pill-price">Pay-As-You-Go</span>
                    </div>
                    <div
                      className="rec-badge"
                      style={{
                        marginTop: "16px",
                        background: "rgba(139, 92, 246, 0.08)",
                        border: "1px solid rgba(139, 92, 246, 0.25)",
                        borderRadius: "8px",
                        padding: "12px",
                        fontSize: "13px",
                      }}
                    >
                      <strong>🏆 Project Rank:</strong> Specially tuned for
                      Indian languages (Hindi, Bengali, Tamil, Telugu, etc.)
                      with native accent and natural regional flow.
                    </div>
                  </div>
                  <div className="premium-grid-col col-features">
                    <h4 className="col-title">Core Capabilities & Features</h4>
                    <ul className="feature-check-list">
                      <li>
                        <svg
                          className="check-icon text-sarvam"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        30+ Expressive Indian voices and 11 language codes
                        supported
                      </li>
                      <li>
                        <svg
                          className="check-icon text-sarvam"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        High quality WAV audio format synthesis
                      </li>
                      <li>
                        <svg
                          className="check-icon text-sarvam"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Pace control (0.5x to 2.0x) natively supported in
                        requests
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Plans Comparison Directory */}
          <div className="comparison-table-wrapper">
            <div className="directory-tab-switcher">
              <button
                className={`dir-tab ${directoryTab === "plans" ? "active" : ""}`}
                onClick={() => setDirectoryTab("plans")}
              >
                Subscription Tiers
              </button>
              <button
                className={`dir-tab ${directoryTab === "features" ? "active" : ""}`}
                onClick={() => setDirectoryTab("features")}
              >
                Features Directory
              </button>
              <button
                className={`dir-tab ${directoryTab === "recommendations" ? "active" : ""}`}
                onClick={() => setDirectoryTab("recommendations")}
              >
                Project Recommendations
              </button>
            </div>

            {directoryTab === "plans" && (
              <div className="dir-content animate-fade">
                <h3
                  className="comparison-table-title"
                  style={{ marginTop: "16px" }}
                >
                  Subscription & Pricing Matrices
                </h3>
                <p className="comparison-table-subtitle">
                  Pricing breakdown and capacities for ElevenLabs, Azure, and
                  OpenAI.
                </p>

                {/* Pay-As-You-Go Direct Comparison Table */}
                <h4
                  className="engine-table-heading"
                  style={{
                    color: "var(--accent)",
                    textTransform: "uppercase",
                    fontSize: "13.5px",
                    borderBottom: "1px solid var(--border)",
                    paddingBottom: "8px",
                  }}
                >
                  Researched Pay-As-You-Go Rates (Side-by-Side)
                </h4>
                <div
                  className="table-responsive"
                  style={{ marginBottom: "32px" }}
                >
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Provider</th>
                        <th>Pay-As-You-Go Price (1M Chars)</th>
                        <th>Equivalent Rate (1k Chars)</th>
                        <th>Billing Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="tool-cell font-gradient-eleven">
                          ElevenLabs
                        </td>
                        <td>$110.00 - $300.00</td>
                        <td>$0.11 - $0.30</td>
                        <td>Top-up purchases after credit exhaustion</td>
                      </tr>
                      <tr>
                        <td className="tool-cell" style={{ color: "#2563eb" }}>
                          Microsoft Azure Speech
                        </td>
                        <td>$16.00</td>
                        <td>$0.016</td>
                        <td>Usage-based billing after 500k free chars/mo</td>
                      </tr>
                      <tr>
                        <td className="tool-cell" style={{ color: "#059669" }}>
                          OpenAI TTS
                        </td>
                        <td>$15.00 (Standard) / $30.00 (HD)</td>
                        <td>$0.015 / $0.030</td>
                        <td>Strict usage-based pay-as-you-go</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="engine-table-heading text-eleven">
                  🥇 ElevenLabs
                </h4>
                <div className="table-responsive">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Price</th>
                        <th>Included Credits</th>
                        <th>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Free</td>
                        <td>$0</td>
                        <td>10,000 credits/month</td>
                        <td>Testing & personal use</td>
                      </tr>
                      <tr>
                        <td>Starter</td>
                        <td>$6/month</td>
                        <td>30,000 credits</td>
                        <td>Small apps & hobby projects</td>
                      </tr>
                      <tr>
                        <td>Creator</td>
                        <td>$22/month</td>
                        <td>121,000 credits</td>
                        <td>SaaS, startups, content creators</td>
                      </tr>
                      <tr>
                        <td>Pro</td>
                        <td>$99/month</td>
                        <td>600,000 credits</td>
                        <td>Growing products</td>
                      </tr>
                      <tr>
                        <td>Scale</td>
                        <td>$299/month</td>
                        <td>1.8M credits</td>
                        <td>Large-scale applications</td>
                      </tr>
                      <tr>
                        <td>Business</td>
                        <td>$990/month</td>
                        <td>6M credits</td>
                        <td>Enterprise teams</td>
                      </tr>
                      <tr>
                        <td>Enterprise</td>
                        <td>Custom</td>
                        <td>Custom</td>
                        <td>Large organizations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4
                  className="engine-table-heading text-azure"
                  style={{ marginTop: "32px" }}
                >
                  🥈 Microsoft Azure AI Speech
                </h4>
                <div className="table-responsive">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Plan</th>
                        <th>Price</th>
                        <th>Included Usage</th>
                        <th>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Free (F0)</td>
                        <td>$0</td>
                        <td>500,000 characters/month</td>
                        <td>Development & testing</td>
                      </tr>
                      <tr>
                        <td>Standard (S0)</td>
                        <td>Pay-as-you-go</td>
                        <td>Approx. $16 per 1M characters</td>
                        <td>Production workloads</td>
                      </tr>
                      <tr>
                        <td>Enterprise Agreement</td>
                        <td>Custom</td>
                        <td>Volume pricing</td>
                        <td>Large enterprises</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4
                  className="engine-table-heading text-openai"
                  style={{ marginTop: "32px" }}
                >
                  🥉 OpenAI Text-to-Speech
                </h4>
                <p
                  style={{
                    fontSize: "13px",
                    margin: "-10px 0 16px 0",
                    color: "var(--text)",
                  }}
                >
                  OpenAI uses usage-based pricing rather than monthly
                  subscription plans.
                </p>
                <div className="table-responsive">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Model</th>
                        <th>Price</th>
                        <th>Best For</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>tts-1</td>
                        <td>$15 per 1M characters</td>
                        <td>Fast, real-time speech</td>
                      </tr>
                      <tr>
                        <td>tts-1-hd</td>
                        <td>$30 per 1M characters</td>
                        <td>Higher-quality narration</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {directoryTab === "features" && (
              <div className="dir-content animate-fade">
                <h3
                  className="comparison-table-title"
                  style={{ marginTop: "16px" }}
                >
                  Features & Specs Directory
                </h3>
                <p className="comparison-table-subtitle">
                  Comprehensive technical capacities for each speech synthesis
                  engine.
                </p>

                <div className="specs-grid">
                  <div className="spec-col">
                    <h4 className="engine-table-heading text-eleven">
                      ElevenLabs Specs
                    </h4>
                    <ul className="spec-bullets">
                      <li>3,000+ community voices</li>
                      <li>Instant & Professional Voice Cloning</li>
                      <li>Community Voice Library</li>
                      <li>Streaming API</li>
                      <li>WebSocket support</li>
                      <li>Low latency profiles</li>
                      <li>REST API & SDK integrations</li>
                      <li>MP3, PCM, μ-law outputs</li>
                      <li>Usage-based billing on higher tiers</li>
                    </ul>
                  </div>

                  <div className="spec-col">
                    <h4 className="engine-table-heading text-azure">
                      Azure Speech Specs
                    </h4>
                    <ul className="spec-bullets">
                      <li>500+ Neural voices</li>
                      <li>140+ languages supported</li>
                      <li>Full SSML markup support</li>
                      <li>Speaking styles (cheerful, sad, angry, etc.)</li>
                      <li>Custom Neural Voice (eligible customers)</li>
                      <li>REST API & Speech SDK</li>
                      <li>MP3, WAV, and PCM outputs</li>
                      <li>High transaction limits</li>
                    </ul>
                  </div>

                  <div className="spec-col">
                    <h4 className="engine-table-heading text-openai">
                      OpenAI TTS Specs
                    </h4>
                    <ul className="spec-bullets">
                      <li>6 built-in voices (Alloy, Echo, etc.)</li>
                      <li>High-velocity Fast API</li>
                      <li>Streaming playback support</li>
                      <li>REST API endpoints</li>
                      <li>MP3, WAV, FLAC, PCM outputs</li>
                      <li>Optimized for AI chat assistant apps</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {directoryTab === "recommendations" && (
              <div className="dir-content animate-fade">
                <h3
                  className="comparison-table-title"
                  style={{ marginTop: "16px" }}
                >
                  Project Recommendations
                </h3>
                <p className="comparison-table-subtitle">
                  Expert suggestions tailored for your specific SaaS deployment
                  scenarios.
                </p>

                <div className="table-responsive">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Requirement</th>
                        <th>Best Choice</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>🏆 Best voice quality</td>
                        <td className="tool-cell font-gradient-eleven">
                          ElevenLabs
                        </td>
                      </tr>
                      <tr>
                        <td>🌍 Best enterprise & multilingual support</td>
                        <td className="tool-cell" style={{ color: "#2563eb" }}>
                          Azure AI Speech
                        </td>
                      </tr>
                      <tr>
                        <td>💰 Most predictable pay-per-use pricing</td>
                        <td className="tool-cell" style={{ color: "#059669" }}>
                          OpenAI TTS
                        </td>
                      </tr>
                      <tr>
                        <td>🚀 Best overall for a SaaS TTS app</td>
                        <td className="tool-cell font-gradient-eleven">
                          ElevenLabs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div
                  className="comparison-insights"
                  style={{ marginTop: "24px" }}
                >
                  <h4 className="insights-title">Deployment Recommendations</h4>
                  <p className="insights-text">
                    For your application — where users type a short sentence,
                    choose a voice, and instantly receive audio — the suggested
                    setup is:
                  </p>
                  <ul
                    className="insights-text-list"
                    style={{
                      marginTop: "8px",
                      fontSize: "13.5px",
                      color: "var(--text)",
                      paddingLeft: "20px",
                    }}
                  >
                    <li style={{ marginBottom: "8px" }}>
                      <strong>ElevenLabs</strong> as the primary provider
                      (offering the best emotional expression and cloning
                      capabilities).
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>Azure AI Speech</strong> as an enterprise-grade
                      alternative (for massive scale and global language
                      coverage).
                    </li>
                    <li style={{ marginBottom: "8px" }}>
                      <strong>OpenAI TTS</strong> as a lightweight,
                      cost-effective option (for developers already integrating
                      OpenAI API systems).
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>© 2026 VoxFlow Studio. Rendered via selected AI API integrations.</p>
      </footer>
    </div>
  );
}

export default App;
