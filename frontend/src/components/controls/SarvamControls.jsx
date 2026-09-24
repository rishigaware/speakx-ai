import React from 'react'

const SARVAM_VOICES = [
  { voice_id: 'shubh', name: 'Shubh (Male - Recommended for Hindi/Conversational)' },
  { voice_id: 'ratan', name: 'Ratan (Male - Recommended for English)' },
  { voice_id: 'ishita', name: 'Ishita (Female - Recommended for English)' },
  { voice_id: 'shreya', name: 'Shreya (Female - Recommended for Hindi/Authoritative)' },
  { voice_id: 'arjun', name: 'Arjun (Male - Formal)' },
  { voice_id: 'arvind', name: 'Arvind (Male - Conversational)' },
  { voice_id: 'manan', name: 'Manan (Male - Consistent)' },
  { voice_id: 'maitreyee', name: 'Maitreyee (Female - Informative)' },
  { voice_id: 'pavitra', name: 'Pavitra (Female - Dramatic)' },
  { voice_id: 'aditya', name: 'Aditya (Male)' },
  { voice_id: 'ritu', name: 'Ritu (Female)' },
  { voice_id: 'priya', name: 'Priya (Female)' },
  { voice_id: 'neha', name: 'Neha (Female)' },
  { voice_id: 'rahul', name: 'Rahul (Male)' },
  { voice_id: 'pooja', name: 'Pooja (Female)' },
  { voice_id: 'rohan', name: 'Rohan (Male)' },
  { voice_id: 'simran', name: 'Simran (Female)' },
  { voice_id: 'kavya', name: 'Kavya (Female)' }
];

const SARVAM_LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi (hi-IN)' },
  { code: 'en-IN', name: 'Indian English (en-IN)' },
  { code: 'bn-IN', name: 'Bengali (bn-IN)' },
  { code: 'ta-IN', name: 'Tamil (ta-IN)' },
  { code: 'te-IN', name: 'Telugu (te-IN)' },
  { code: 'kn-IN', name: 'Kannada (kn-IN)' },
  { code: 'ml-IN', name: 'Malayalam (ml-IN)' },
  { code: 'mr-IN', name: 'Marathi (mr-IN)' },
  { code: 'gu-IN', name: 'Gujarati (gu-IN)' },
  { code: 'pa-IN', name: 'Punjabi (pa-IN)' },
  { code: 'or-IN', name: 'Odia (or-IN)' }
];

export default function SarvamControls({
  part,
  sarvamModel,
  setSarvamModel,
  sarvamLanguage,
  setSarvamLanguage,
  sarvamSpeaker,
  setSarvamSpeaker,
  sarvamPace,
  setSarvamPace
}) {
  const renderVoiceSection = () => (
    <div className="engine-controls animate-fade">
      <div className="controls-row-2col">
        <div className="control-group">
          <label className="control-label">Voice Speaker</label>
          <div className="select-wrapper">
            <select 
              className="custom-select"
              value={sarvamSpeaker}
              onChange={(e) => setSarvamSpeaker(e.target.value)}
            >
              {SARVAM_VOICES.map((s) => (
                <option key={s.voice_id} value={s.voice_id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">Target Language</label>
          <div className="select-wrapper">
            <select 
              className="custom-select"
              value={sarvamLanguage}
              onChange={(e) => setSarvamLanguage(e.target.value)}
            >
              {SARVAM_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParamsSection = () => (
    <div className="engine-controls animate-fade">
      <div className="control-group">
        <label className="control-label">Sarvam AI Model</label>
        <div className="select-wrapper">
          <select 
            className="custom-select"
            value={sarvamModel}
            onChange={(e) => setSarvamModel(e.target.value)}
          >
            <option value="bulbul:v3">Bulbul v3 (Expressive)</option>
          </select>
        </div>
      </div>

      <div className="control-group slider-row-compact">
        <div className="slider-header">
          <span className="control-label-compact">Speaking Pace</span>
          <span className="slider-value-badge badge-speed">{sarvamPace.toFixed(2)}x</span>
        </div>
        <input 
          type="range" 
          min="0.5" 
          max="2.0" 
          step="0.05" 
          value={sarvamPace} 
          onChange={(e) => setSarvamPace(parseFloat(e.target.value))}
          className="custom-slider slider-speed"
        />
        <span className="slider-hint">Natural speech rate (0.5x to 2.0x)</span>
      </div>
    </div>
  );

  if (part === 'voice') return renderVoiceSection();
  if (part === 'params') return renderParamsSection();

  return (
    <>
      {renderVoiceSection()}
      {renderParamsSection()}
    </>
  );
}
