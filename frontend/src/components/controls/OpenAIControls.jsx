import React from 'react'

export default function OpenAIControls({
  part,
  openaiKey,
  setOpenaiKey,
  openaiVoice,
  setOpenaiVoice,
  openaiVoices,
  isSyncingOpenaiVoices,
  syncOpenaiVoices,
  openaiModel,
  setOpenaiModel,
  openaiModels,
  isFetchingOpenaiModels,
  syncOpenaiModels,
  openaiFormat,
  setOpenaiFormat
}) {
  const renderVoiceSection = () => (
    <div className="engine-controls">
      <div className="controls-row-2col">
        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>Voice Tone</label>
            {isSyncingOpenaiVoices ? (
              <span style={{ fontSize: '10px', color: 'var(--accent)' }}>🔄</span>
            ) : (
              <button 
                onClick={syncOpenaiVoices} 
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
              >
                Sync
              </button>
            )}
          </div>
          <div className="select-wrapper">
            <select 
              className="custom-select"
              value={openaiVoice}
              onChange={(e) => setOpenaiVoice(e.target.value)}
            >
              {openaiVoices.map((v) => (
                <option key={v.voice_id} value={v.voice_id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="control-label" style={{ marginBottom: 0 }}>Quality Mode</label>
            {isFetchingOpenaiModels ? (
              <span style={{ fontSize: '10px', color: 'var(--accent)' }}>🔄</span>
            ) : (
              <button 
                onClick={syncOpenaiModels} 
                style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
              >
                Sync
              </button>
            )}
          </div>
          <div className="select-wrapper">
            <select 
              className="custom-select"
              value={openaiModel}
              onChange={(e) => setOpenaiModel(e.target.value)}
            >
              {openaiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderParamsSection = () => (
    <div className="engine-controls">
      <div className="control-group">
        <label className="control-label">OpenAI API Key</label>
        <input 
          type="password"
          className="text-input-field"
          placeholder="Paste sk-... API Key"
          value={openaiKey}
          onChange={(e) => setOpenaiKey(e.target.value)}
        />
      </div>
      
      <div className="control-group">
        <label className="control-label">Audio Output Format</label>
        <div className="select-wrapper">
          <select 
            className="custom-select"
            value={openaiFormat}
            onChange={(e) => setOpenaiFormat(e.target.value)}
          >
            <option value="mp3">MP3 (Universal, Standard)</option>
            <option value="opus">Opus (Low Latency, Streaming)</option>
            <option value="aac">AAC (Digital Audio, Mobile)</option>
            <option value="flac">FLAC (Lossless Studio Quality)</option>
            <option value="wav">WAV (Uncompressed Audio)</option>
            <option value="pcm">PCM (Raw Audio Stream)</option>
          </select>
        </div>
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
