import { SarvamAIClient } from 'sarvamai';

let cachedClient = null;
let cachedKey = null;

const getSarvamClient = (apiKey) => {
  const key = apiKey || process.env.SARVAM_API_KEY || 'sk_abpbsw2s_orLRsdusScZFRz1CS9u8TqfP';
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new SarvamAIClient({
      apiSubscriptionKey: key
    });
    cachedKey = key;
  }
  return cachedClient;
};

/**
 * Controller to handle Sarvam AI Text to Speech conversion
 */
export const generateSarvamSpeech = async (req, res) => {
  const { text, model, target_language_code, speaker, pace, speech_sample_rate } = req.body;
  const customApiKey = req.headers['x-sarvam-api-key'] || req.body?.apiKey;
  const apiKey = customApiKey || process.env.SARVAM_API_KEY || 'sk_abpbsw2s_orLRsdusScZFRz1CS9u8TqfP';

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text prompt is required for speech synthesis.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'Sarvam AI API key is not configured on the backend.' });
  }

  try {
    const client = getSarvamClient(apiKey);
    if (!client) {
      throw new Error('Failed to initialize Sarvam AI client. Key might be invalid or missing.');
    }

    // Attempt streaming conversion (MP3 output via convertStream)
    try {
      const streamResponse = await client.textToSpeech.convertStream({
        text: text,
        target_language_code: target_language_code || 'hi-IN',
        speaker: speaker || 'shubh',
        model: model || 'bulbul:v3',
        pace: pace !== undefined ? Number(pace) : 1.0,
        speech_sample_rate: speech_sample_rate ? Number(speech_sample_rate) : 22050
      });

      if (streamResponse && typeof streamResponse.arrayBuffer === 'function') {
        const arrayBuf = await streamResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuf);
        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length
        });
        return res.send(audioBuffer);
      }
    } catch (streamErr) {
      console.warn('Sarvam convertStream fallback triggered:', streamErr?.message || streamErr);

      // Fallback to standard convert endpoint
      const convertResponse = await client.textToSpeech.convert({
        text: text,
        target_language_code: target_language_code || 'hi-IN',
        speaker: speaker || 'shubh',
        model: model || 'bulbul:v3',
        pace: pace !== undefined ? Number(pace) : 1.0
      });

      if (convertResponse && convertResponse.audios && convertResponse.audios.length > 0) {
        const audioBuffer = Buffer.from(convertResponse.audios[0], 'base64');
        res.set({
          'Content-Type': 'audio/wav',
          'Content-Length': audioBuffer.length
        });
        return res.send(audioBuffer);
      }

      throw streamErr;
    }
  } catch (error) {
    console.error('Sarvam AI synthesis error:', error);
    const statusCode = error.statusCode || error.status || 500;
    const errorMessage =
      error.body?.error?.message ||
      error.message ||
      'Error occurred while calling Sarvam AI service.';
    res.status(statusCode).json({ error: errorMessage });
  }
};
