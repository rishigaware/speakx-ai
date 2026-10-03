/**
 * Service to handle Text-to-Speech API calls for OpenAI, ElevenLabs, Azure, and Sarvam AI.
 */

// 1. OpenAI Service Calls
export const synthesizeOpenAISpeech = async ({ key, model, text, voice, format, speed }) => {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      input: text,
      voice: voice,
      response_format: format,
      speed: speed
    })
  });
  
  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error && errJson.error.message) errMsg = errJson.error.message;
    } catch (e) {}
    throw new Error(errMsg);
  }
  return await response.blob();
};

export const fetchOpenAIModels = async (key) => {
  const response = await fetch('https://api.openai.com/v1/models', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${key}`
    }
  });
  if (!response.ok) throw new Error(`OpenAI Models API error: status ${response.status}`);
  const data = await response.json();
  return data.data || [];
};

// 2. ElevenLabs Service Calls
export const synthesizeElevenLabsSpeech = async ({ 
  key, 
  voiceId, 
  model, 
  text, 
  stability, 
  similarity, 
  style = 0, 
  useSpeakerBoost = true,
  outputFormat = 'mp3_44100_128' 
}) => {
  const format = outputFormat || 'mp3_44100_128';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=${format}`, {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model_id: model || 'eleven_multilingual_v2',
      voice_settings: {
        stability: (stability ?? 50) / 100,
        similarity_boost: (similarity ?? 75) / 100,
        style: (style ?? 0) / 100,
        use_speaker_boost: Boolean(useSpeakerBoost)
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.detail && errJson.detail.message) errMsg = errJson.detail.message;
      else if (errJson.message) errMsg = errJson.message;
    } catch {}
    throw new Error(errMsg);
  }
  return await response.blob();
};

export const fetchElevenLabsVoices = async (key) => {
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    method: 'GET',
    headers: {
      'xi-api-key': key
    }
  });
  if (!response.ok) throw new Error(`ElevenLabs Voices API error: status ${response.status}`);
  const data = await response.json();
  return data.voices || [];
};

export const fetchElevenLabsModels = async (key) => {
  const response = await fetch('https://api.elevenlabs.io/v1/models', {
    method: 'GET',
    headers: {
      'xi-api-key': key
    }
  });
  if (!response.ok) throw new Error(`ElevenLabs Models API error: status ${response.status}`);
  return await response.json();
};

/**
 * Fetch ElevenLabs user profile & remaining character quota
 */
export const fetchElevenLabsUserInfo = async (key) => {
  const response = await fetch('https://api.elevenlabs.io/v1/user', {
    method: 'GET',
    headers: {
      'xi-api-key': key
    }
  });
  if (!response.ok) return null;
  return await response.json();
};

/**
 * ElevenLabs Sound Effects Generation API
 */
export const generateElevenLabsSoundEffect = async ({ key, text, durationSeconds }) => {
  const payload = {
    text: text,
    prompt_influence: 0.3
  };
  if (durationSeconds) {
    payload.duration_seconds = Number(durationSeconds);
  }

  const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: {
      'xi-api-key': key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = errText;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.detail && errJson.detail.message) errMsg = errJson.detail.message;
      else if (errJson.message) errMsg = errJson.message;
    } catch {}
    throw new Error(errMsg || 'Sound generation failed.');
  }
  return await response.blob();
};

// 3. Microsoft Azure Service Calls
export const synthesizeAzureSpeech = async ({ key, region, voice, text }) => {
  const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': key,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
    },
    body: `<speak version='1.0' xml:lang='en-US'><voice xml:lang='en-US' name='${voice}'>${text}</voice></speak>`
  });

  if (!response.ok) throw new Error('Azure TTS Service returned an error.');
  return await response.blob();
};

// 4. Sarvam AI Service Calls (Proxied through backend)
export const synthesizeSarvamSpeech = async ({ model, text, languageCode, speaker, pace, apiKey }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
  const sarvamKey = apiKey || import.meta.env.VITE_SARVAM_API_KEY || '';

  const headers = {
    'Content-Type': 'application/json'
  };
  if (sarvamKey) {
    headers['x-sarvam-api-key'] = sarvamKey;
  }

  const response = await fetch(`${backendUrl}/api/tts/sarvam`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      text: text,
      model: model || 'bulbul:v3',
      target_language_code: languageCode || 'hi-IN',
      speaker: speaker || 'shubh',
      pace: pace || 1.0,
      speech_sample_rate: 22050
    })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error || 'Sarvam AI TTS returned an error.');
  }
  return await response.blob();
};
