import { useState, useEffect } from "react";
import {
  WALL_MATERIALS,
  REGIONAL_TREE_SPECIES,
  CHILLER_PLACEMENTS,
} from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";

/**
 * Animated Frequency Equalizer Bars for Audio Simulation
 */
function AudioVisualizerBars({ isPlaying, dba }) {
  const bars = [
    { freq: "60Hz", base: 0.8 },
    { freq: "90Hz", base: 0.5 },
    { freq: "120Hz", base: 0.9 },
    { freq: "180Hz", base: 0.7 },
    { freq: "240Hz", base: 0.4 },
    { freq: "350Hz", base: 0.6 },
    { freq: "500Hz", base: 0.75 },
    { freq: "800Hz", base: 0.5 },
    { freq: "1.2k", base: 0.4 },
    { freq: "2k", base: 0.3 },
    { freq: "3.5k", base: 0.25 },
    { freq: "5k", base: 0.2 },
  ];

  // Scale height by decibels
  const levelFactor = Math.max(0.2, Math.min(1.2, (dba - 25) / 50));

  return (
    <div className={`audio-visualizer ${isPlaying ? "active" : "idle"}`}>
      <div className="visualizer-header">
        <span className="visualizer-title">
          {isPlaying ? "🔊 LIVE ACOUSTIC SPECTRUM" : "⏸ SPECTRUM IDLE"}
        </span>
        <span className="visualizer-sub">
          {isPlaying
            ? `Synthesizing ${dba.toFixed(1)} dBA at receptor`
            : "Click to hear neighborhood noise"}
        </span>
      </div>
      <div className="equalizer-bars-row">
        {bars.map((bar, i) => {
          const heightPercent = isPlaying
            ? Math.min(100, Math.round(bar.base * levelFactor * 100))
            : 8;
          return (
            <div key={bar.freq} className="equalizer-col">
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    height: `${heightPercent}%`,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: `${0.4 + (i % 4) * 0.15}s`,
                  }}
                />
              </div>
              <span className="freq-label">{bar.freq}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Animated Circular / Radial Decibel Gauge
 */
function DecibelComplianceGauge({ netDba, limitDba, statusColor, isCompliant }) {
  // Gauge spans 20 dBA to 80 dBA (range = 60 dBA)
  const minVal = 25;
  const maxVal = 75;
  const clampedDba = Math.max(minVal, Math.min(maxVal, netDba));
  const percent = (clampedDba - minVal) / (maxVal - minVal);
  const limitPercent = (limitDba - minVal) / (maxVal - minVal);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degree arc
  const strokeDashoffset = arcLength - arcLength * percent;

  const margin = limitDba - netDba;

  return (
    <div className="decibel-radial-gauge">
      <div className="gauge-svg-wrap">
        <svg viewBox="0 0 140 140" className="gauge-svg">
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="gauge-bg-arc"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset="0"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            className="gauge-progress-arc"
            style={{
              stroke: statusColor,
              strokeDasharray: `${arcLength} ${circumference}`,
              strokeDashoffset,
            }}
          />
        </svg>
        <div className="gauge-center-content">
          <span className="gauge-val" style={{ color: statusColor }}>
            {netDba.toFixed(1)}
          </span>
          <span className="gauge-unit">dBA</span>
        </div>
      </div>

      <div className="gauge-info-col">
        <div className="gauge-status-tag" style={{ background: `${statusColor}22`, color: statusColor, borderColor: `${statusColor}66` }}>
          {isCompliant ? "✓ COMPLIANT" : "⚠️ EXCEEDS LIMIT"}
        </div>
        <div className="gauge-margin-text">
          {margin >= 0 ? (
            <span className="margin-safe"><strong>-{margin.toFixed(1)} dBA</strong> below municipal limit</span>
          ) : (
            <span className="margin-danger"><strong>+{Math.abs(margin).toFixed(1)} dBA</strong> over municipal limit</span>
          )}
        </div>
        <div className="gauge-limit-ref">
          Municipal Limit: <strong>{limitDba} dBA</strong>
        </div>
      </div>
    </div>
  );
}

export default function AcousticControls({
  site,
  config,
  onChangeConfig,
  results,
  fanSpeedPercent,
  onChangeFanSpeed,
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [showThermoNote, setShowThermoNote] = useState(false);
  const [activeTab, setActiveTab] = useState("mitigations"); // "mitigations" | "presets" | "budget"

  const toggleAudio = () => {
    const isNowPlaying = acousticSimulator.toggle();
    setAudioPlaying(isNowPlaying);
    if (isNowPlaying) {
      acousticSimulator.setDecibels(results.netReceivedLp);
    }
  };

  useEffect(() => {
    if (audioPlaying) {
      acousticSimulator.setDecibels(results.netReceivedLp);
    }
  }, [results.netReceivedLp, audioPlaying]);

  const update = (patch) => {
    onChangeConfig({ ...config, ...patch });
  };

  // 1-Click Engineering Mitigation Presets
  const applyPreset = (presetKey) => {
    switch (presetKey) {
      case "violation":
        onChangeFanSpeed(90);
        onChangeConfig({
          ...config,
          placement: "side_exposed",
          wallEnabled: false,
          wallHeightMeters: 4,
          treeEnabled: false,
          chillerOrientationAngle: 0,
        });
        break;
      case "compliant":
        onChangeFanSpeed(75);
        onChangeConfig({
          ...config,
          placement: "rear_shielded",
          wallEnabled: true,
          wallHeightMeters: 8,
          wallMaterial: "absorptive_metal",
          treeEnabled: false,
          chillerOrientationAngle: 90,
        });
        break;
      case "eco_forest":
        onChangeFanSpeed(65);
        onChangeConfig({
          ...config,
          placement: "semi_berm",
          wallEnabled: true,
          wallHeightMeters: 8,
          wallMaterial: "absorptive_metal",
          treeEnabled: true,
          treeBufferDepthMeters: 30,
          chillerOrientationAngle: 135,
        });
        break;
      case "vault_bunker":
        onChangeFanSpeed(60);
        onChangeConfig({
          ...config,
          placement: "underground",
          wallEnabled: true,
          wallHeightMeters: 12,
          wallMaterial: "aerated_concrete",
          treeEnabled: true,
          treeBufferDepthMeters: 40,
          chillerOrientationAngle: 180,
        });
        break;
      default:
        break;
    }
  };

  const currentWall = WALL_MATERIALS[config.wallMaterial] || WALL_MATERIALS.absorptive_metal;
  const currentTree = REGIONAL_TREE_SPECIES[config.treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;

  const placements = [
    {
      id: "rear_shielded",
      name: "Rear Shielded",
      icon: "🏢",
      badge: "-18.0 dB",
      desc: "Building blocks line of sight",
    },
    {
      id: "side_exposed",
      name: "Side Exposed",
      icon: "⚠️",
      badge: "0.0 dB",
      desc: "Direct radiation to homes",
    },
    {
      id: "rooftop",
      name: "Rooftop Penthouse",
      icon: "🏙️",
      badge: "+3.5 dB",
      desc: "Elevated line of sight",
    },
    {
      id: "underground",
      name: "Subterranean Bunker",
      icon: "🛡️",
      badge: "-28.0 dB",
      desc: "Excavated below grade",
    },
    {
      id: "semi_berm",
      name: "Semi-Bermed Basin",
      icon: "⛰️",
      badge: "-11.5 dB",
      desc: "Natural earthen mounds",
    },
  ];

  return (
    <div className="acoustic-controls-panel">
      {/* 1. Hero Compliance Bar with Radial Gauge & Audio Visualizer */}
      <section className="compliance-banner-elevated" style={{ borderColor: results.statusColor }}>
        <div className="compliance-main-grid">
          {/* Left: Decibel Radial Gauge */}
          <DecibelComplianceGauge
            netDba={results.netReceivedLp}
            limitDba={site.municipalNoiseLimitDba}
            statusColor={results.statusColor}
            isCompliant={results.isCompliant}
          />

          {/* Center: Live Audio Ear Simulator & Visualizer */}
          <div className="audio-control-center">
            <button
              className={`audio-btn-elevated ${audioPlaying ? "playing" : ""}`}
              onClick={toggleAudio}
              title="Listen to synthesized noise level at neighbor's property line"
            >
              <div className="audio-btn-icon-wrap">
                <span className="audio-icon">{audioPlaying ? "🔊" : "🎧"}</span>
                {audioPlaying && <span className="audio-pulse-ring"></span>}
              </div>
              <div className="audio-btn-text">
                <strong>{audioPlaying ? "Stop Audio Simulation" : "Listen at Neighbor's Porch"}</strong>
                <small>60Hz / 120Hz Hum + Fan Airflow Roar</small>
              </div>
            </button>

            <AudioVisualizerBars isPlaying={audioPlaying} dba={results.netReceivedLp} />
          </div>

          {/* Right: Quick Stats & Receptors */}
          <div className="receptor-stats-box">
            <span className="eyebrow">RECEPTOR TELEMETRY</span>
            <div className="receptor-stat-row">
              <span>Distance to Homes:</span>
              <strong>{site.defaultDistanceToHomesMeters}m</strong>
            </div>
            <div className="receptor-stat-row">
              <span>Low-Freq Hum:</span>
              <strong>{results.netReceivedLpC.toFixed(1)} dBC</strong>
            </div>
            <div className="receptor-stat-row">
              <span>Unmitigated Source:</span>
              <strong style={{ color: "#f87171" }}>{results.unmitigatedLp.toFixed(1)} dBA</strong>
            </div>
            <div className="receptor-stat-row">
              <span>Net Attenuation:</span>
              <strong style={{ color: "#34d399" }}>-{results.noiseReductionDb.toFixed(1)} dBA</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Presets Toolbar */}
      <section className="presets-bar">
        <div className="presets-title-row">
          <span className="eyebrow">⚡ 1-CLICK ENGINEERING PRESETS:</span>
          <span className="presets-hint">Instant scenario modeling</span>
        </div>
        <div className="presets-grid">
          <button
            className="preset-btn danger"
            onClick={() => applyPreset("violation")}
            title="Exposed side yard with no barrier walls or trees (severe violation)"
          >
            <span className="preset-icon">🚨</span>
            <div className="preset-meta">
              <strong>Unmitigated Violation</strong>
              <small>Side Yard · 90% Fan · No Wall</small>
            </div>
          </button>

          <button
            className="preset-btn standard"
            onClick={() => applyPreset("compliant")}
            title="Building-shielded rear yard with 8m absorptive barrier wall"
          >
            <span className="preset-icon">🏢</span>
            <div className="preset-meta">
              <strong>Code Compliant Standard</strong>
              <small>Rear Shielded · 8m Wall</small>
            </div>
          </button>

          <button
            className="preset-btn eco"
            onClick={() => applyPreset("eco_forest")}
            title="Semi-bermed chiller yard with 8m wall and 30m native evergreen forest"
          >
            <span className="preset-icon">🌲</span>
            <div className="preset-meta">
              <strong>Bio-Acoustic Buffer</strong>
              <small>Semi-Berm · Wall + 30m Trees</small>
            </div>
          </button>

          <button
            className="preset-btn silent"
            onClick={() => applyPreset("vault_bunker")}
            title="Subterranean bunker vault with 12m wall and 40m forest"
          >
            <span className="preset-icon">🛡️</span>
            <div className="preset-meta">
              <strong>Ultra-Silent Vault</strong>
              <small>Subterranean · 12m Wall · -28dB</small>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Navigation Tabs for Detailed Controls */}
      <div className="controls-nav-tabs">
        <button
          className={`control-tab-btn ${activeTab === "mitigations" ? "active" : ""}`}
          onClick={() => setActiveTab("mitigations")}
        >
          <span className="tab-icon">🎛️</span>
          <span>Mitigation Controls</span>
        </button>
        <button
          className={`control-tab-btn ${activeTab === "budget" ? "active" : ""}`}
          onClick={() => setActiveTab("budget")}
        >
          <span className="tab-icon">📊</span>
          <span>ISO 9613-2 Link Budget</span>
        </button>
        <button
          className={`control-tab-btn ${activeTab === "insights" ? "active" : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          <span className="tab-icon">🔬</span>
          <span>Engineering Insights</span>
        </button>
      </div>

      {/* Tab 1: Detailed Mitigation Controls */}
      {activeTab === "mitigations" && (
        <div className="controls-columns">
          {/* Pillar 1: Chiller Placement & Mechanical Operation */}
          <section className="control-card animated-card">
            <div className="card-header">
              <span className="eyebrow">STEP 1: ARCHITECTURAL SITE PLACEMENT</span>
              <h4>Chiller Yard Location</h4>
            </div>

            <div className="placement-grid-compact">
              {placements.map((p) => {
                const isActive = config.placement === p.id;
                return (
                  <button
                    key={p.id}
                    className={`placement-card-btn ${isActive ? "active" : ""}`}
                    onClick={() => update({ placement: p.id })}
                  >
                    <div className="p-header">
                      <span className="p-icon">{p.icon}</span>
                      <span className={`p-badge ${p.badge.startsWith("+") ? "penalty" : "bonus"}`}>
                        {p.badge}
                      </span>
                    </div>
                    <strong>{p.name}</strong>
                    <small>{p.desc}</small>
                  </button>
                );
              })}
            </div>

            <div className="slider-group">
              <label className="slider-label">
                <span>Condenser Fan Duty Cycle</span>
                <b className="highlight-val">{fanSpeedPercent}%</b>
              </label>
              <input
                type="range"
                min="30"
                max="100"
                value={fanSpeedPercent}
                onChange={(e) => onChangeFanSpeed(Number(e.target.value))}
                className="interactive-slider"
              />
              <div className="slider-sub-readout">
                <span>Directly affects source sound power</span>
                <strong>Lw: {results.sourceLw} dBA</strong>
              </div>
            </div>

            <div className="slider-group">
              <label className="slider-label">
                <span>Exhaust Directivity Angle</span>
                <b className="highlight-val">{config.chillerOrientationAngle}° away</b>
              </label>
              <input
                type="range"
                min="0"
                max="180"
                step="15"
                value={config.chillerOrientationAngle}
                onChange={(e) => update({ chillerOrientationAngle: Number(e.target.value) })}
                className="interactive-slider"
              />
              <div className="slider-sub-readout">
                <span>Points exhaust away from homes</span>
                <strong>-{results.breakdown.directivityAttenuation} dB</strong>
              </div>
            </div>
          </section>

          {/* Pillar 2: Acoustic Barrier Walls */}
          <section className="control-card animated-card">
            <div className="card-header">
              <span className="eyebrow">STEP 2: PERIMETER SOUND BARRIER</span>
              <div className="header-toggle">
                <h4>Acoustic Screen Wall</h4>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={config.wallEnabled}
                    onChange={(e) => update({ wallEnabled: e.target.checked })}
                  />
                  <span className="slider-toggle"></span>
                </label>
              </div>
            </div>

            <div className={config.wallEnabled ? "card-body" : "card-body disabled"}>
              <div className="slider-group">
                <label className="slider-label">
                  <span>Wall Height</span>
                  <b className="highlight-val">{config.wallHeightMeters} meters</b>
                </label>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  disabled={!config.wallEnabled}
                  value={config.wallHeightMeters}
                  onChange={(e) => update({ wallHeightMeters: Number(e.target.value) })}
                  className="interactive-slider"
                />
                <div className="slider-sub-readout">
                  <span>Maekawa diffraction insertion loss</span>
                  <strong style={{ color: "#34d399" }}>-{results.breakdown.wallAttenuation} dB</strong>
                </div>
              </div>

              <div className="field-group">
                <label>Acoustic Wall Material & NRC Rating</label>
                <select
                  disabled={!config.wallEnabled}
                  value={config.wallMaterial}
                  onChange={(e) => update({ wallMaterial: e.target.value })}
                  className="material-select"
                >
                  {Object.values(WALL_MATERIALS).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.name} (NRC: {mat.nrcRating})
                    </option>
                  ))}
                </select>
              </div>

              <div className="eco-metric-strip">
                <div>
                  <span>Wall Cost Est.</span>
                  <strong>${results.economics.wallCostEstimate.toLocaleString()}</strong>
                </div>
                <div>
                  <span>Embodied CO₂</span>
                  <strong>{results.economics.wallEmbodiedCarbonKg.toLocaleString()} kg</strong>
                </div>
              </div>
              <p className="material-desc">{currentWall.description}</p>
            </div>
          </section>

          {/* Pillar 3: Regional Bio-Acoustic Vegetation Buffer */}
          <section className="control-card animated-card">
            <div className="card-header">
              <span className="eyebrow">STEP 3: BIO-ACOUSTIC BUFFER</span>
              <div className="header-toggle">
                <h4>Native Tree Buffer Zone</h4>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={config.treeEnabled}
                    onChange={(e) => update({ treeEnabled: e.target.checked })}
                  />
                  <span className="slider-toggle"></span>
                </label>
              </div>
            </div>

            <div className={config.treeEnabled ? "card-body" : "card-body disabled"}>
              <div className="field-group">
                <label>Regional Low-Maintenance Tree Species</label>
                <select
                  disabled={!config.treeEnabled}
                  value={config.treeSpeciesId}
                  onChange={(e) => update({ treeSpeciesId: e.target.value })}
                  className="material-select"
                >
                  {Object.values(REGIONAL_TREE_SPECIES).map((tree) => (
                    <option key={tree.id} value={tree.id}>
                      {tree.name} ({tree.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="slider-group">
                <label className="slider-label">
                  <span>Buffer Depth</span>
                  <b className="highlight-val">{config.treeBufferDepthMeters} meters</b>
                </label>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  disabled={!config.treeEnabled}
                  value={config.treeBufferDepthMeters}
                  onChange={(e) => update({ treeBufferDepthMeters: Number(e.target.value) })}
                  className="interactive-slider"
                />
                <div className="slider-sub-readout">
                  <span>ISO 9613-2 foliage scattering</span>
                  <strong style={{ color: "#34d399" }}>-{results.breakdown.treeAttenuation} dB</strong>
                </div>
              </div>

              <div className="eco-metric-strip">
                <div>
                  <span>Annual Maint.</span>
                  <strong>${results.economics.treeAnnualMaintenanceCost}/yr</strong>
                </div>
                <div>
                  <span>Water Use</span>
                  <strong>{results.economics.treeAnnualWaterGallons.toLocaleString()} gal</strong>
                </div>
                <div>
                  <span>CO₂ Offset</span>
                  <strong>{results.economics.treeAnnualCo2Kg.toLocaleString()} kg</strong>
                </div>
              </div>
              <p className="material-desc">{currentTree.description}</p>
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: ISO 9613-2 Link Budget */}
      {activeTab === "budget" && (
        <section className="acoustic-budget-card animated-card">
          <div className="budget-header-row">
            <div>
              <span className="eyebrow">ISO 9613-2 ACOUSTIC LINK BUDGET BREAKDOWN</span>
              <h4>End-to-End Sound Attenuation Calculation</h4>
            </div>
            <span className="budget-tag">ISO 9613-2 / Maekawa Standard</span>
          </div>

          <div className="budget-flow">
            <div className="budget-item">
              <span>Chiller Source (Lw)</span>
              <strong>{results.sourceLw} dBA</strong>
            </div>
            <div className="budget-operator">−</div>
            <div className="budget-item">
              <span>Distance Decay ({site.defaultDistanceToHomesMeters}m)</span>
              <strong>{results.breakdown.geometricDecay} dB</strong>
            </div>
            <div className="budget-operator">−</div>
            <div className="budget-item">
              <span>Placement Shield</span>
              <strong>{results.breakdown.placementAttenuation} dB</strong>
            </div>
            <div className="budget-operator">−</div>
            <div className="budget-item">
              <span>Wall Diffraction</span>
              <strong>{results.breakdown.wallAttenuation} dB</strong>
            </div>
            <div className="budget-operator">−</div>
            <div className="budget-item">
              <span>Tree Buffer</span>
              <strong>{results.breakdown.treeAttenuation} dB</strong>
            </div>
            <div className="budget-operator">+</div>
            <div className="budget-item">
              <span>Terrain Echo</span>
              <strong>{results.breakdown.terrainEchoDb} dB</strong>
            </div>
            <div className="budget-operator">=</div>
            <div className="budget-item total">
              <span>Community Noise (Lp)</span>
              <strong style={{ color: results.statusColor }}>{results.netReceivedLp.toFixed(1)} dBA</strong>
            </div>
          </div>
        </section>
      )}

      {/* Tab 3: Thermodynamic & Engineering Insights */}
      {activeTab === "insights" && (
        <section className="thermo-note-card animated-card expanded">
          <div className="thermo-note-header">
            <span>🔬 <strong>Engineering Reality:</strong> Why are chillers placed outdoors?</span>
          </div>
          <div className="thermo-note-body">
            <p>
              <strong>The 2nd Law of Thermodynamics:</strong> A 50-megawatt data center converts 100% of its electrical power directly into heat.
              To maintain server inlet temperatures at 20°C to 25°C, that thermal energy must be continuously extracted via chilled water loops
              and <em>rejected into the outdoor atmosphere</em>.
            </p>
            <p>
              In real hyperscale builds (AWS, Microsoft, Google, Equinix), <strong>air-cooled chillers and cooling towers MUST sit outside</strong> with massive 2-meter axial fans blasting hot air upward.
              In <strong>Loudoun County, VA ("Data Center Alley")</strong>, placing chillers on the side of the building creates severe community lawsuits, leading planning commissions to mandate
              <strong> Building-Shielded Rear Yards</strong>, heavy acoustic barrier walls, or subterranean vaults.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}