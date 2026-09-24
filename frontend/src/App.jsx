import {
  synthesizeOpenAISpeech,
  fetchOpenAIModels,
  synthesizeElevenLabsSpeech,
  fetchElevenLabsVoices,
  fetchElevenLabsModels,
  fetchElevenLabsUserInfo,
  generateElevenLabsSoundEffect,
  synthesizeAzureSpeech,
  synthesizeSarvamSpeech,
} from "./services/ttsService";
import {
  saveAudioToStorage,
  getAllStoredAudios,
  findCachedAudio,
  deleteStoredAudio,
  clearAllStoredAudios,
} from "./services/audioStorage";
import { useState, useEffect, useRef, useMemo } from "react";

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
    const envKey = import.meta.env.VITE_ELEVENLABS_API_KEY || "sk_d5a3f7910e6e94fc7370edc50d362795749903082873cc7c";
    const cached = localStorage.getItem("voxflow_eleven_key");
    if (!cached || cached.includes("DEMO_ELEVENLABS") || cached.trim() === "" || !cached.startsWith("sk_")) {
      return envKey;
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
  const [elevenMode, setElevenMode] = useState("tts"); // "tts" or "sfx"
  const [elevenStyle, setElevenStyle] = useState(0);
  const [elevenSpeakerBoost, setElevenSpeakerBoost] = useState(true);
  const [elevenOutputFormat, setElevenOutputFormat] = useState("mp3_44100_128");
  const [elevenSfxDuration, setElevenSfxDuration] = useState(2.5);
  const [elevenUserInfo, setElevenUserInfo] = useState(null);

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
  const [currentTime, setCurrentTime] = useState(0);

  // Local Storage & Audio Cache states
  const [savedAudios, setSavedAudios] = useState([]);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState(() => {
    return localStorage.getItem("voxflow_auto_save") !== "false";
  });
  const [isCurrentAudioSaved, setIsCurrentAudioSaved] = useState(false);
  const [cachedMatch, setCachedMatch] = useState(null);
  const [showSavedLibrary, setShowSavedLibrary] = useState(true);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyVoiceFilter, setHistoryVoiceFilter] = useState("all");
  const [historyEngineFilter, setHistoryEngineFilter] = useState("all");
  const [historyGroupByVoice, setHistoryGroupByVoice] = useState(true);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 4000);
  };

  const loadStoredAudios = async () => {
    const list = await getAllStoredAudios();
    setSavedAudios(list);
  };

  // Load stored audios on initial mount
  useEffect(() => {
    loadStoredAudios();
  }, []);

  // Save auto-save preference
  useEffect(() => {
    localStorage.setItem("voxflow_auto_save", isAutoSaveEnabled ? "true" : "false");
  }, [isAutoSaveEnabled]);

  // Check if current text + voice combination is already cached locally
  useEffect(() => {
    let active = true;
    const checkCache = async () => {
      if (!text || text.trim().length === 0) {
        setCachedMatch(null);
        return;
      }
      const activeVoice =
        engine === "openai" ? openaiVoice :
        engine === "elevenlabs" ? elevenVoiceId :
        engine === "azure" ? azureVoice :
        sarvamSpeaker;

      const activeModel =
        engine === "openai" ? openaiModel :
        engine === "elevenlabs" ? elevenModel :
        engine === "sarvam" ? sarvamModel : "";

      const found = await findCachedAudio({
        text,
        engine,
        voice: activeVoice,
        model: activeModel,
      });

      if (active) {
        setCachedMatch(found);
      }
    };

    checkCache();
    return () => {
      active = false;
    };
  }, [text, engine, openaiVoice, elevenVoiceId, azureVoice, sarvamSpeaker, openaiModel, elevenModel, sarvamModel, savedAudios]);

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
      fetchElevenLabsUserInfo(elevenKey).then((info) => {
        if (info) setElevenUserInfo(info);
      }).catch(() => {});
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
        if (elevenMode === "sfx") {
          responseBlob = await generateElevenLabsSoundEffect({
            key: elevenKey,
            text: text,
            durationSeconds: elevenSfxDuration,
          });
        } else {
          responseBlob = await synthesizeElevenLabsSpeech({
            key: elevenKey,
            voiceId: elevenVoiceId,
            model: elevenModel,
            text: text,
            stability: elevenStability,
            similarity: elevenSimilarity,
            style: elevenStyle,
            useSpeakerBoost: elevenSpeakerBoost,
            outputFormat: elevenOutputFormat,
          });
        }
        url = URL.createObjectURL(responseBlob);

        // Refresh user character balance in background
        if (elevenKey.startsWith("sk_")) {
          fetchElevenLabsUserInfo(elevenKey).then((info) => {
            if (info) setElevenUserInfo(info);
          }).catch(() => {});
        }
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

        audio.ontimeupdate = () => {
          setCurrentTime(audio.currentTime);
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
          setCurrentTime(0);
        };

        // Automatically store in local storage if auto-save is enabled
        if (isAutoSaveEnabled && responseBlob) {
          const activeVoice =
            engine === "openai" ? openaiVoice :
            engine === "elevenlabs" ? elevenVoiceId :
            engine === "azure" ? azureVoice :
            sarvamSpeaker;

          const activeVoiceName =
            engine === "openai" ? (openaiVoices.find(v => v.voice_id === openaiVoice)?.name || openaiVoice) :
            engine === "elevenlabs" ? (elevenVoices.find(v => v.voice_id === elevenVoiceId)?.name || elevenVoiceId) :
            engine === "azure" ? azureVoice :
            sarvamSpeaker;

          const activeModel =
            engine === "openai" ? openaiModel :
            engine === "elevenlabs" ? elevenModel :
            engine === "sarvam" ? sarvamModel : "";

          saveAudioToStorage({
            text,
            engine,
            voice: activeVoice,
            voiceName: activeVoiceName,
            model: activeModel,
            blob: responseBlob,
            duration: null,
          }).then(() => {
            setIsCurrentAudioSaved(true);
            loadStoredAudios();
            showToast("✨ Audio generated & saved to local storage! No need to generate again.");
          }).catch(console.error);
        } else {
          setIsCurrentAudioSaved(false);
        }
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

  // Save current audio to local storage manually
  const handleSaveCurrentAudio = async () => {
    if (!audioBlob || !text) return;
    try {
      const activeVoice =
        engine === "openai" ? openaiVoice :
        engine === "elevenlabs" ? elevenVoiceId :
        engine === "azure" ? azureVoice :
        sarvamSpeaker;

      const activeVoiceName =
        engine === "openai" ? (openaiVoices.find(v => v.voice_id === openaiVoice)?.name || openaiVoice) :
        engine === "elevenlabs" ? (elevenVoices.find(v => v.voice_id === elevenVoiceId)?.name || elevenVoiceId) :
        engine === "azure" ? azureVoice :
        sarvamSpeaker;

      const activeModel =
        engine === "openai" ? openaiModel :
        engine === "elevenlabs" ? elevenModel :
        engine === "sarvam" ? sarvamModel : "";

      await saveAudioToStorage({
        text,
        engine,
        voice: activeVoice,
        voiceName: activeVoiceName,
        model: activeModel,
        blob: audioBlob,
        duration: audioDuration,
      });

      setIsCurrentAudioSaved(true);
      await loadStoredAudios();
      showToast("💾 Audio saved to local storage! Play it anytime without regenerating.");
    } catch (err) {
      console.error(err);
      alert("Failed to save audio to local storage.");
    }
  };

  // Play an audio item from local storage directly without calling any API
  const handlePlayStoredAudio = (item) => {
    if (!item || !item.blob) return;

    if (playingAudioId === item.id) {
      if (isPlaying) {
        handlePause();
        return;
      } else if (isPaused && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        setIsPaused(false);
        return;
      }
    }

    handleStop();

    if (item.text) setText(item.text);
    if (item.engine) setEngine(item.engine);

    const url = URL.createObjectURL(item.blob);
    setAudioUrl(url);
    setAudioBlob(item.blob);
    setAudioDuration(item.duration || null);
    setPlayingAudioId(item.id);

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (item.duration) {
        setAudioDuration(item.duration);
      } else {
        setAudioDuration(audio.duration);
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    if (item.engine !== "openai") {
      audio.playbackRate = playbackSpeed;
    }

    audio.play();
    setIsPlaying(true);
    setIsPaused(false);
    setIsCurrentAudioSaved(true);

    audio.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setPlayingAudioId(null);
      setCurrentTime(0);
    };

    showToast(`⚡ Loaded "${item.voiceName || item.voice}" from local storage (0 API credits used).`);
  };

  // Delete a specific stored audio
  const handleDeleteStoredAudio = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteStoredAudio(id);
      await loadStoredAudios();
      showToast("🗑 Stored audio removed.");
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all stored audios
  const handleClearAllStoredAudios = async () => {
    if (window.confirm("Remove all saved audios from local storage?")) {
      await clearAllStoredAudios();
      await loadStoredAudios();
      setIsCurrentAudioSaved(false);
      showToast("Cleared all stored audios from local storage.");
    }
  };

  // Derived unique engines and voice profiles for history filtering
  const uniqueVoiceProfiles = useMemo(() => {
    const voices = new Set();
    savedAudios.forEach((item) => {
      const v = item.voiceName || item.voice;
      if (v) voices.add(v);
    });
    return Array.from(voices).sort((a, b) => a.localeCompare(b));
  }, [savedAudios]);

  const uniqueEngines = useMemo(() => {
    const engines = new Set();
    savedAudios.forEach((item) => {
      if (item.engine) engines.add(item.engine);
    });
    return Array.from(engines).sort();
  }, [savedAudios]);

  // Filtered audios based on voice profile, engine, and search text
  const filteredAudios = useMemo(() => {
    return savedAudios.filter((item) => {
      // Voice filter
      if (historyVoiceFilter !== "all") {
        const itemVoice = item.voiceName || item.voice || "";
        if (itemVoice !== historyVoiceFilter) return false;
      }
      // Engine filter
      if (historyEngineFilter !== "all") {
        if ((item.engine || "").toLowerCase() !== historyEngineFilter.toLowerCase()) return false;
      }
      // Search filter
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchesText = (item.text || "").toLowerCase().includes(q);
        const matchesVoice = (item.voiceName || item.voice || "").toLowerCase().includes(q);
        const matchesEngine = (item.engine || "").toLowerCase().includes(q);
        if (!matchesText && !matchesVoice && !matchesEngine) return false;
      }
      return true;
    });
  }, [savedAudios, historyVoiceFilter, historyEngineFilter, historySearch]);

  // Group filtered audios by Voice Profile
  const audiosByVoiceProfile = useMemo(() => {
    const map = new Map();
    filteredAudios.forEach((item) => {
      const voiceKey = item.voiceName || item.voice || "Unknown Voice";
      if (!map.has(voiceKey)) {
        map.set(voiceKey, {
          voiceName: voiceKey,
          engine: item.engine,
          items: [],
        });
      }
      map.get(voiceKey).items.push(item);
    });
    return Array.from(map.values());
  }, [filteredAudios]);

  const renderStoredAudioItem = (item) => {
    const isItemPlaying = playingAudioId === item.id && isPlaying;
    return (
      <div key={item.id} className={`stored-item ${isItemPlaying ? "is-playing" : ""}`}>
        <div className="stored-meta">
          <div className="stored-text-preview" title={item.text}>
            "{item.text}"
          </div>
          <div className="stored-tags">
            <span className={`stored-engine-tag tag-${(item.engine || "azure").toLowerCase()}`}>
              {item.engine}
            </span>
            <span>•</span>
            <span style={{ fontWeight: "600", color: "var(--text-h)" }}>{item.voiceName || item.voice}</span>
            <span>•</span>
            <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(item.createdAt).toLocaleDateString()})</span>
            {item.duration && (
              <>
                <span>•</span>
                <span>{Math.round(item.duration)}s</span>
              </>
            )}
          </div>
        </div>
        <div className="stored-actions">
          <button
            type="button"
            className={`stored-act-btn ${isItemPlaying ? "is-active" : ""}`}
            onClick={() => handlePlayStoredAudio(item)}
            title={isItemPlaying ? "Pause audio" : "Play directly without calling API"}
          >
            {isItemPlaying ? (
              <>
                <svg viewBox="0 0 24 24" style={{ width: "13px", height: "13px", fill: "currentColor" }}>
                  <path d="M14,19H18V5H14M6,19H10V5H6V19Z"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" style={{ width: "13px", height: "13px", fill: "currentColor" }}>
                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z"/>
                </svg>
                Play
              </>
            )}
          </button>
          <button
            type="button"
            className="stored-act-btn"
            onClick={() => {
              if (item.text) setText(item.text);
              if (item.engine) setEngine(item.engine);
              showToast(`Loaded text and ${item.engine} settings into studio.`);
            }}
            title="Load text and engine into editor"
          >
            Use
          </button>
          <button
            type="button"
            className="stored-act-btn"
            onClick={() => {
              const link = document.createElement("a");
              link.href = URL.createObjectURL(item.blob);
              link.download = `${item.engine}_${(item.voiceName || item.voice).replace(/\s+/g, '_')}.mp3`;
              link.click();
            }}
            title="Download audio file"
          >
            <svg viewBox="0 0 24 24" style={{ width: "13px", height: "13px", fill: "currentColor" }}>
              <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
            </svg>
            Download
          </button>
          <button
            type="button"
            className="stored-act-btn delete-btn"
            onClick={(e) => handleDeleteStoredAudio(e, item.id)}
            title="Delete from local storage"
          >
            <svg viewBox="0 0 24 24" style={{ width: "13px", height: "13px", fill: "currentColor" }}>
              <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
            </svg>
          </button>
        </div>
      </div>
    );
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
    setPlayingAudioId(null);
    setCurrentTime(0);
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

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const handleCycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.findIndex((s) => Math.abs(s - playbackSpeed) < 0.05);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current && engine !== "openai") {
      audioRef.current.playbackRate = nextSpeed;
    }
    showToast(`Playback speed: ${nextSpeed}x`);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activeVoiceName = useMemo(() => {
    if (engine === "openai") {
      return openaiVoices.find((v) => v.voice_id === openaiVoice)?.name || openaiVoice;
    }
    if (engine === "elevenlabs") {
      if (elevenMode === "sfx") return "Sound Effects Generator";
      return elevenVoices.find((v) => v.voice_id === elevenVoiceId)?.name || elevenVoiceId;
    }
    if (engine === "azure") {
      return azureVoice.replace("Neural", "").replace("en-US-", "");
    }
    if (engine === "sarvam") {
      return sarvamSpeaker;
    }
    return "Default Voice";
  }, [engine, openaiVoice, openaiVoices, elevenMode, elevenVoiceId, elevenVoices, azureVoice, sarvamSpeaker]);

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
              {/* Input text & Voice Persona panel (Left) */}
              <div className="input-panel">
                {/* Voice Persona Controls for selected engine */}
                {engine === "elevenlabs" && (
                  <ElevenLabsControls
                    part="voice"
                    elevenMode={elevenMode}
                    setElevenMode={setElevenMode}
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
                    elevenUserInfo={elevenUserInfo}
                  />
                )}

                {engine === "openai" && (
                  <OpenAIControls
                    part="voice"
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
                  />
                )}

                {engine === "azure" && (
                  <AzureControls
                    part="voice"
                    azureVoice={azureVoice}
                    setAzureVoice={setAzureVoice}
                  />
                )}

                {engine === "sarvam" && (
                  <SarvamControls
                    part="voice"
                    sarvamLanguage={sarvamLanguage}
                    setSarvamLanguage={setSarvamLanguage}
                    sarvamSpeaker={sarvamSpeaker}
                    setSarvamSpeaker={setSarvamSpeaker}
                  />
                )}

                {/* Input Text Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                  <label htmlFor="tts-text" className="panel-label" style={{ marginBottom: 0 }}>
                    {engine === "elevenlabs" && elevenMode === "sfx" ? "Sound Effect Prompt" : "Input Text & Script"}
                  </label>
                  <span className="char-count" style={{ margin: 0 }}>
                    {text.length}/{engine === "openai" ? 4096 : 5000} characters
                  </span>
                </div>

                <textarea
                  id="tts-text"
                  className="text-input"
                  placeholder={
                    engine === "elevenlabs" && elevenMode === "sfx"
                      ? "Describe the sound effect to generate (e.g., Deep cinematic space explosion with low frequency rumble and lingering echo)..."
                      : "Type or paste your text here..."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  maxLength={engine === "openai" ? 4096 : 5000}
                />

                {/* Quick Presets Toolbar */}
                <div className="input-toolbar-bottom">
                  <div className="quick-presets">
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--text)" }}>Presets:</span>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setText("Welcome! Experience ultra-realistic voice synthesis across multiple world-class engines.")}
                      title="Load welcome prompt"
                    >
                      👋 Greeting
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setText("Hello everyone, and welcome back to today's episode. Today we explore groundbreaking breakthroughs in artificial intelligence.")}
                      title="Load podcast intro"
                    >
                      🎙️ Podcast
                    </button>
                    <button
                      type="button"
                      className="preset-chip"
                      onClick={() => setText("Deep within the ancient cedar forest, a silent mystery was waiting to be discovered beneath the starlit sky.")}
                      title="Load storytelling sample"
                    >
                      📖 Story
                    </button>
                    {text.length > 0 && (
                      <button
                        type="button"
                        className="preset-chip clear"
                        onClick={() => setText("")}
                        title="Clear text"
                      >
                        🧹 Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Configurations panel (Right: Parameters & Fine Tuning) */}
              <div className="controls-panel">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <h3 className="panel-subtitle">Parameters & Fine-Tuning</h3>
                  <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: "500" }}>Acoustic Tuning</span>
                </div>

                {engine === "openai" && (
                  <OpenAIControls
                    part="params"
                    openaiKey={openaiKey}
                    setOpenaiKey={setOpenaiKey}
                    openaiFormat={openaiFormat}
                    setOpenaiFormat={setOpenaiFormat}
                  />
                )}

                {engine === "elevenlabs" && (
                  <ElevenLabsControls
                    part="params"
                    elevenKey={elevenKey}
                    setElevenKey={setElevenKey}
                    elevenMode={elevenMode}
                    elevenLanguage={elevenLanguage}
                    setElevenLanguage={setElevenLanguage}
                    elevenOutputFormat={elevenOutputFormat}
                    setElevenOutputFormat={setElevenOutputFormat}
                    elevenStability={elevenStability}
                    setElevenStability={setElevenStability}
                    elevenSimilarity={elevenSimilarity}
                    setElevenSimilarity={setElevenSimilarity}
                    elevenStyle={elevenStyle}
                    setElevenStyle={setElevenStyle}
                    elevenSpeakerBoost={elevenSpeakerBoost}
                    setElevenSpeakerBoost={setElevenSpeakerBoost}
                    elevenSfxDuration={elevenSfxDuration}
                    setElevenSfxDuration={setElevenSfxDuration}
                  />
                )}

                {engine === "azure" && (
                  <AzureControls
                    part="params"
                    azureKey={azureKey}
                    setAzureKey={setAzureKey}
                    azureRegion={azureRegion}
                    setAzureRegion={setAzureRegion}
                  />
                )}

                {engine === "sarvam" && (
                  <SarvamControls
                    part="params"
                    sarvamModel={sarvamModel}
                    setSarvamModel={setSarvamModel}
                    sarvamPace={sarvamPace}
                    setSarvamPace={setSarvamPace}
                  />
                )}

                {/* Client Side Playback Speed (Applies to all engines, compact design) */}
                {engine !== "sarvam" && (
                  <div
                    className="control-group slider-row-compact"
                    style={{
                      marginTop: "6px",
                      borderTop: "1px solid var(--border)",
                      paddingTop: "6px",
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

                {/* Stored Audio Cache Hit Banner */}
                {cachedMatch && (
                  <div className="cache-banner">
                    <span>⚡ Stored in local storage ({cachedMatch.voiceName || cachedMatch.voice})</span>
                    <button
                      type="button"
                      onClick={() => handlePlayStoredAudio(cachedMatch)}
                      className="cache-banner-btn"
                    >
                      Play Stored (0 API Cost)
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Movie Play Bottom Bar: Full-Width Across Input Text & Parameters */}
            <div className="movie-player-bottom-bar">
              {/* Timeline Scrubber Bar */}
              <div className="movie-player-timeline">
                <span className="movie-time-display">{formatTime(currentTime)}</span>
                <div className="movie-scrubber-track">
                  <input
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    step="0.1"
                    value={audioDuration ? Math.min(currentTime, audioDuration) : 0}
                    onChange={handleSeek}
                    disabled={!audioDuration}
                    className="movie-scrubber-slider"
                    style={{
                      background: audioDuration
                        ? `linear-gradient(to right, var(--accent) 0%, var(--accent) ${(currentTime / (audioDuration || 1)) * 100}%, var(--border) ${(currentTime / (audioDuration || 1)) * 100}%, var(--border) 100%)`
                        : "var(--border)",
                    }}
                    title={audioDuration ? `Seek: ${formatTime(currentTime)} / ${formatTime(audioDuration)}` : "Generate audio to scrub"}
                  />
                </div>
                <span className="movie-time-display">
                  {audioDuration ? formatTime(audioDuration) : "--:--"}
                </span>
              </div>

              {/* Main Controls Deck: Transport, Waveform, Tools */}
              <div className="movie-player-deck">
                {/* Left: Transport Playback Controls */}
                <div className="movie-transport-controls">
                  {isPlaying ? (
                    <button
                      onClick={handlePause}
                      className="movie-btn-play is-playing"
                      aria-label="Pause Audio"
                      title="Pause playback"
                    >
                      <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px", fill: "currentColor" }}>
                        <path d="M14,19H18V5H14M6,19H10V5H6V19Z" />
                      </svg>
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePlay}
                      className="movie-btn-play"
                      disabled={isLoading}
                      aria-label="Play Audio"
                      title={isPaused ? "Resume playback" : "Synthesize speech & play"}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner"></span>
                          <span>Synthesizing...</span>
                        </>
                      ) : (
                        <>
                          <svg viewBox="0 0 24 24" style={{ width: "16px", height: "16px", fill: "currentColor" }}>
                            <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                          </svg>
                          <span>{isPaused ? "Resume" : "Generate & Play"}</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    onClick={handleStop}
                    className="movie-btn-stop"
                    disabled={!isPlaying && !isPaused}
                    aria-label="Stop Audio"
                    title="Stop playback and reset"
                  >
                    <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", fill: "currentColor" }}>
                      <path d="M18,18H6V6H18V18Z" />
                    </svg>
                    <span>Stop</span>
                  </button>
                </div>

                {/* Center: Movie Audio Waveform & Status Info */}
                <div className="movie-center-deck">
                  <div className={`movie-waveform ${isPlaying ? "animating" : ""}`}>
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="movie-wave-bar"></div>
                    ))}
                  </div>
                  <div className="movie-meta-tag">
                    <span style={{ fontWeight: "700", color: "var(--text-h)" }}>{activeVoiceName}</span>
                    <span>•</span>
                    <span className={`stored-engine-tag tag-${engine.toLowerCase()}`}>{engine}</span>
                    {cachedMatch && (
                      <>
                        <span>•</span>
                        <span style={{ color: "#059669", fontWeight: "600" }}>⚡ Cached</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Tools & Utilities (Speed, Save Locally, Download) */}
                <div className="movie-tools-deck">
                  {/* Playback speed toggle */}
                  {engine !== "sarvam" && (
                    <button
                      type="button"
                      onClick={handleCycleSpeed}
                      className="movie-btn-speed"
                      title="Click to cycle playback speed (0.75x, 1x, 1.25x, 1.5x, 2x)"
                    >
                      {playbackSpeed.toFixed(2)}x
                    </button>
                  )}

                  {/* Save to Local Storage button */}
                  <button
                    type="button"
                    onClick={handleSaveCurrentAudio}
                    className={`movie-btn-tool ${isCurrentAudioSaved ? "saved" : ""}`}
                    disabled={!audioBlob || isCurrentAudioSaved}
                    title="Save current audio to Local Storage (no need to generate again)"
                  >
                    <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", fill: "currentColor" }}>
                      <path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" />
                    </svg>
                    <span>{isCurrentAudioSaved ? "Saved Locally" : "Save Audio"}</span>
                  </button>

                  {/* Download MP3 button */}
                  <button
                    onClick={handleDownload}
                    className="movie-btn-tool"
                    disabled={!audioUrl}
                    title="Download audio file"
                  >
                    <svg viewBox="0 0 24 24" style={{ width: "14px", height: "14px", fill: "currentColor" }}>
                      <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stored Audio Library & History in Local Storage */}
          <div className="stored-audios-container" id="audio-history">
            <div className="stored-header" onClick={() => setShowSavedLibrary(!showSavedLibrary)}>
              <div className="stored-title">
                <svg viewBox="0 0 24 24" style={{ width: "17px", height: "17px", fill: "var(--accent)" }}>
                  <path d="M19,20H4C2.89,20 2,19.1 2,18V6C2,4.89 2.89,4 4,4H10L12,6H19A2,2 0 0,1 21,8H21L4,8V18L6.14,10H23.21L20.93,18.5C20.7,19.37 19.92,20 19,20Z"/>
                </svg>
                <span>History of Saved Audios (Local Storage)</span>
                <span className="stored-badge">
                  {savedAudios.length} saved
                  {filteredAudios.length !== savedAudios.length && ` • ${filteredAudios.length} filtered`}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <label 
                  onClick={(e) => e.stopPropagation()} 
                  style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--text-h)", cursor: "pointer" }}
                >
                  <input 
                    type="checkbox" 
                    checked={isAutoSaveEnabled} 
                    onChange={(e) => setIsAutoSaveEnabled(e.target.checked)} 
                  />
                  Auto-save new audios
                </label>
                {savedAudios.length > 0 && (
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleClearAllStoredAudios(); }} 
                    style={{ background: "none", border: "none", color: "var(--text)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Clear All
                  </button>
                )}
                <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: "600" }}>
                  {showSavedLibrary ? "▲ Hide" : "▼ Show"}
                </span>
              </div>
            </div>

            {showSavedLibrary && (
              <>
                {/* History Filter Bar */}
                {savedAudios.length > 0 && (
                  <div className="history-filter-bar">
                    <div className="history-filter-controls">
                      {/* Filter by Voice Profile */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="history-filter-label">Voice:</span>
                        <select
                          className="history-select"
                          value={historyVoiceFilter}
                          onChange={(e) => setHistoryVoiceFilter(e.target.value)}
                          title="Filter by Voice Profile"
                        >
                          <option value="all">All Voices ({uniqueVoiceProfiles.length})</option>
                          {uniqueVoiceProfiles.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter by Engine */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span className="history-filter-label">Engine:</span>
                        <select
                          className="history-select"
                          value={historyEngineFilter}
                          onChange={(e) => setHistoryEngineFilter(e.target.value)}
                          title="Filter by TTS Engine"
                        >
                          <option value="all">All Engines</option>
                          {uniqueEngines.map((eng) => (
                            <option key={eng} value={eng}>
                              {eng}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Search speech text / voice */}
                      <input
                        type="text"
                        placeholder="Search text or voice..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="stored-search-input"
                        style={{ minWidth: "150px" }}
                      />

                      {(historyVoiceFilter !== "all" || historyEngineFilter !== "all" || historySearch.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryVoiceFilter("all");
                            setHistoryEngineFilter("all");
                            setHistorySearch("");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--accent)",
                            fontSize: "11px",
                            cursor: "pointer",
                            fontWeight: "600",
                            textDecoration: "underline"
                          }}
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>

                    {/* Group by Voice Profile vs Chronological view */}
                    <div className="history-view-toggle">
                      <button
                        type="button"
                        className={`history-view-btn ${historyGroupByVoice ? "active" : ""}`}
                        onClick={() => setHistoryGroupByVoice(true)}
                        title="Divide history based on Voice Profiles"
                      >
                        👥 Group by Voice
                      </button>
                      <button
                        type="button"
                        className={`history-view-btn ${!historyGroupByVoice ? "active" : ""}`}
                        onClick={() => setHistoryGroupByVoice(false)}
                        title="Show chronological flat timeline"
                      >
                        ⏱️ Timeline
                      </button>
                    </div>
                  </div>
                )}

                <div className="stored-list">
                  {savedAudios.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text)", fontSize: "13px" }}>
                      <div style={{ fontSize: "24px", marginBottom: "6px" }}>🎧</div>
                      <strong>No audios saved yet.</strong>
                      <p style={{ margin: "6px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
                        Generate any speech with ElevenLabs, OpenAI, Azure, or Sarvam AI — it will automatically be stored here in your history so you can replay it anytime without spending API credits!
                      </p>
                    </div>
                  ) : filteredAudios.length === 0 ? (
                    <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text)", fontSize: "13px" }}>
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>🔍</div>
                      <strong>No saved audios match your filter.</strong>
                      <p style={{ margin: "6px 0 0 0", fontSize: "12px", opacity: 0.8 }}>
                        Try clearing or changing your Voice Profile or Engine filter.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setHistoryVoiceFilter("all");
                          setHistoryEngineFilter("all");
                          setHistorySearch("");
                        }}
                        style={{
                          marginTop: "10px",
                          padding: "5px 12px",
                          fontSize: "12px",
                          borderRadius: "6px",
                          background: "var(--accent-bg)",
                          border: "1px solid var(--accent-border)",
                          color: "var(--accent)",
                          cursor: "pointer",
                          fontWeight: "600",
                        }}
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : historyGroupByVoice ? (
                    audiosByVoiceProfile.map((group) => (
                      <div key={group.voiceName} className="voice-profile-group">
                        <div className="voice-profile-header">
                          <div className="voice-profile-title">
                            <span style={{ fontSize: "14px" }}>🎙️</span>
                            <span>{group.voiceName}</span>
                            <span className={`stored-engine-tag tag-${(group.engine || "azure").toLowerCase()}`}>
                              {group.engine || "TTS"}
                            </span>
                          </div>
                          <span className="voice-profile-count">
                            {group.items.length} {group.items.length === 1 ? "take" : "takes"}
                          </span>
                        </div>
                        {group.items.map((item) => renderStoredAudioItem(item))}
                      </div>
                    ))
                  ) : (
                    filteredAudios.map((item) => renderStoredAudioItem(item))
                  )}
                </div>
              </>
            )}
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
