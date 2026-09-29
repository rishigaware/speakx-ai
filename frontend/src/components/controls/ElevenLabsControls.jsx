import React from 'react'

export default function ElevenLabsControls({
  part,
  elevenKey,
  setElevenKey,
  elevenMode = 'tts',
  setElevenMode,
  elevenVoiceId,
  setElevenVoiceId,
  elevenVoices,
  isFetchingVoices,
  fetchElevenVoices,
  elevenModel,
  setElevenModel,
  elevenModels,
  isFetchingModels,
  fetchElevenModels,
  elevenLanguage,
  setElevenLanguage,
  elevenStability,
  setElevenStability,
  elevenSimilarity,
  setElevenSimilarity,
  elevenStyle = 0,
  setElevenStyle,
  elevenSpeakerBoost = true,
  setElevenSpeakerBoost,
  elevenOutputFormat = 'mp3_44100_128',
  setElevenOutputFormat,
  elevenSfxDuration = 2.5,
  setElevenSfxDuration,
  elevenUserInfo
}) {
  const charRemaining = elevenUserInfo?.subscription 
    ? Math.max(0, elevenUserInfo.subscription.character_limit - elevenUserInfo.subscription.character_count)
    : null;

  // Voice Persona Section (Placed on Left with Input Text)
  const renderVoiceSection = () => (
    <div className="engine-controls">
      {/* ElevenLabs Mode Toggle: TTS vs Sound Effects */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setElevenMode && setElevenMode('tts')}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: elevenMode === 'tts' ? 'var(--accent)' : 'transparent',
              color: elevenMode === 'tts' ? 'white' : 'var(--text)',
              transition: 'all 0.15s ease'
            }}
          >
            🎙️ Speech (TTS)
          </button>
          <button
            type="button"
            onClick={() => setElevenMode && setElevenMode('sfx')}
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: elevenMode === 'sfx' ? 'var(--accent)' : 'transparent',
              color: elevenMode === 'sfx' ? 'white' : 'var(--text)',
              transition: 'all 0.15s ease'
            }}
          >
            🔊 Sound Effects
          </button>
        </div>

        {charRemaining !== null && (
          <span 
            title={`Used: ${elevenUserInfo.subscription.character_count.toLocaleString()} / Limit: ${elevenUserInfo.subscription.character_limit.toLocaleString()} chars`}
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--accent)',
              background: 'var(--accent-bg)',
              border: '1px solid var(--accent-border)',
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            ⚡ {charRemaining.toLocaleString()} chars left
          </span>
        )}
      </div>

      {elevenMode === 'tts' ? (
        <div className="controls-row-2col">
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="control-label" style={{ marginBottom: 0 }}>Voice Profile</label>
              {isFetchingVoices ? (
                <span style={{ fontSize: '10px', color: 'var(--accent)' }}>🔄</span>
              ) : (
                <button 
                  onClick={fetchElevenVoices} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
                >
                  Sync
                </button>
              )}
            </div>
            <div className="select-wrapper">
              <select 
                className="custom-select"
                value={elevenVoiceId}
                onChange={(e) => setElevenVoiceId(e.target.value)}
              >
                {elevenVoices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="control-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="control-label" style={{ marginBottom: 0 }}>Model (v2.5 Flash/Turbo)</label>
              {isFetchingModels ? (
                <span style={{ fontSize: '10px', color: 'var(--accent)' }}>🔄</span>
              ) : (
                <button 
                  onClick={fetchElevenModels} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '10.5px', cursor: 'pointer', padding: 0 }}
                >
                  Sync
                </button>
              )}
            </div>
            <div className="select-wrapper">
              <select 
                className="custom-select"
                value={elevenModel}
                onChange={(e) => setElevenModel(e.target.value)}
              >
                {elevenModels.map((m) => (
                  <option key={m.model_id} value={m.model_id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '6px 10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', fontSize: '11.5px', color: 'var(--text-h)', marginBottom: '4px' }}>
          🔊 <strong>Sound Effects Generator:</strong> Enter your sound description below to generate realistic cinematic audio effects.
        </div>
      )}
    </div>
  );

  // Technical & Acoustic Parameters Section (Placed on Right)
  const renderParamsSection = () => (
    <div className="engine-controls">
      <div className="control-group">
        <label className="control-label">ElevenLabs API Key</label>
        <input 
          type="password"
          className="text-input-field"
          placeholder="sk_..."
          value={elevenKey}
          onChange={(e) => setElevenKey(e.target.value)}
        />
      </div>

      {elevenMode === 'tts' ? (
        <>
          <div className="controls-row-2col">
            <div className="control-group">
              <label className="control-label">Target Language</label>
              <div className="select-wrapper">
                <select 
                  className="custom-select"
                  value={elevenLanguage}
                  onChange={(e) => setElevenLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="es">Spanish</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="pt">Portuguese</option>
                  <option value="it">Italian</option>
                  <option value="ru">Russian</option>
                </select>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Audio Output Quality</label>
              <div className="select-wrapper">
                <select 
                  className="custom-select"
                  value={elevenOutputFormat}
                  onChange={(e) => setElevenOutputFormat && setElevenOutputFormat(e.target.value)}
                >
                  <option value="mp3_44100_128">MP3 (128 kbps)</option>
                  <option value="mp3_44100_192">High-Res MP3 (192 kbps)</option>
                  <option value="pcm_44100">WAV / PCM (44.1 kHz)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advanced parameters sliders */}
          <div className="advanced-settings-block">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 className="settings-section-subtitle" style={{ margin: 0 }}>Advanced Voice Settings</h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: 'var(--text-h)', cursor: 'pointer' }}>
                <input 
                  type="checkbox"
                  checked={elevenSpeakerBoost}
                  onChange={(e) => setElevenSpeakerBoost && setElevenSpeakerBoost(e.target.checked)}
                />
                Speaker Boost
              </label>
            </div>
            
            <div className="controls-row-2col">
              <div className="control-group slider-row-compact">
                <div className="slider-header">
                  <span className="control-label-compact">Stability</span>
                  <span className="slider-value-badge badge-stability">{elevenStability}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={elevenStability} 
                  onChange={(e) => setElevenStability(parseInt(e.target.value))}
                  className="custom-slider slider-stability"
                />
                <span className="slider-hint">Consistent vs Expressive</span>
              </div>

              <div className="control-group slider-row-compact">
                <div className="slider-header">
                  <span className="control-label-compact">Clarity / Sim</span>
                  <span className="slider-value-badge badge-similarity">{elevenSimilarity}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={elevenSimilarity} 
                  onChange={(e) => setElevenSimilarity(parseInt(e.target.value))}
                  className="custom-slider slider-similarity"
                />
                <span className="slider-hint">Closer to original profile</span>
              </div>
            </div>

            <div className="controls-row-2col" style={{ marginTop: '4px' }}>
              <div className="control-group slider-row-compact">
                <div className="slider-header">
                  <span className="control-label-compact">Style Exaggeration</span>
                  <span className="slider-value-badge badge-style">{elevenStyle}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={elevenStyle} 
                  onChange={(e) => setElevenStyle && setElevenStyle(parseInt(e.target.value))}
                  className="custom-slider"
                />
                <span className="slider-hint">Dramatizes voice emotion</span>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Sound Effects Mode */
        <div className="advanced-settings-block" style={{ marginTop: '4px' }}>
          <h4 className="settings-section-subtitle">Sound Effect Settings</h4>
          <div className="control-group slider-row-compact">
            <div className="slider-header">
              <span className="control-label-compact">Duration</span>
              <span className="slider-value-badge badge-speed">{elevenSfxDuration}s</span>
            </div>
            <input 
              type="range" min="0.5" max="15.0" step="0.5"
              value={elevenSfxDuration} 
              onChange={(e) => setElevenSfxDuration && setElevenSfxDuration(parseFloat(e.target.value))}
              className="custom-slider slider-speed"
            />
            <span className="slider-hint">Length of synthesized sound effect (0.5s - 15s)</span>
          </div>

          <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', fontSize: '11px', color: 'var(--text)' }}>
            💡 <strong>Sound Effect Tip:</strong> Describe what you want to hear in the prompt box (e.g. <em>"Sci-fi spaceship hyperspace jump"</em> or <em>"Rain on a tin roof with soft thunder"</em>).
          </div>
        </div>
      )}
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
