import { useState, useEffect } from "react";
import {
  WALL_MATERIALS,
  REGIONAL_TREE_SPECIES,
} from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";

/**
 * Animated Frequency Equalizer Bars for Audio Simulation
 */
function AudioVisualizerBars({ isPlaying, dba, timeOfDay }) {
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

  const levelFactor = Math.max(0.2, Math.min(1.2, (dba - 25) / 50));

  return (
    <div className={`audio-visualizer ${isPlaying ? "active" : "idle"}`}>
      <div className="visualizer-header">
        <span className="visualizer-title">
          {isPlaying ? (timeOfDay === "day" ? "☀️ DAYTIME AUDIO SPECTRUM" : "🌙 NIGHTTIME AUDIO SPECTRUM") : "⏸ AUDIO SIMULATOR IDLE"}
        </span>
        <span className="visualizer-sub">
          {isPlaying
            ? `Synthesizing ${dba.toFixed(1)} dBA (${timeOfDay === "day" ? "Traffic Masked" : "Nocturnal Silence"})`
            : "Click button to hear neighbor's porch"}
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

export default function AcousticControls({
  site,
  config,
  onChangeConfig,
  results,
  fanSpeedPercent,
  onChangeFanSpeed,
  timeOfDay = "night",
  onChangeTimeOfDay,
}) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [uiMode, setUiMode] = useState("simple"); // "simple" | "pro"
  const [proTab, setProTab] = useState("architecture"); // "architecture" | "walls" | "budget" | "insights"

  const toggleAudio = () => {
    const isNowPlaying = acousticSimulator.toggle();
    setAudioPlaying(isNowPlaying);
    if (isNowPlaying) {
      acousticSimulator.setDecibels(results.netReceivedLp);
      acousticSimulator.setTimeOfDay(timeOfDay);
    }
  };

  useEffect(() => {
    if (audioPlaying) {
      acousticSimulator.setDecibels(results.netReceivedLp);
      acousticSimulator.setTimeOfDay(timeOfDay);
    }
  }, [results.netReceivedLp, audioPlaying, timeOfDay]);

  const update = (patch) => {
    onChangeConfig({ ...config, ...patch });
  };

  // Presets
  const applyPreset = (presetKey) => {
    switch (presetKey) {
      case "violation":
        onChangeFanSpeed(90);
        onChangeConfig({
          ...config,
          placement: "side_exposed",
          wallEnabled: false,
          wallHeightMeters: 4,
          wallEnclosure: "single_east",
          treeEnabled: false,
          acousticSilencers: false,
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
          wallEnclosure: "u_shape",
          treeEnabled: false,
          acousticSilencers: true,
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
          wallEnclosure: "u_shape",
          treeEnabled: true,
          treeBufferDepthMeters: 30,
          treeArrangement: "perimeter_ring",
          acousticSilencers: true,
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
          wallMaterial: "dense_concrete",
          wallEnclosure: "full_4side",
          treeEnabled: true,
          treeBufferDepthMeters: 40,
          treeArrangement: "perimeter_ring",
          acousticSilencers: true,
          chillerOrientationAngle: 180,
        });
        break;
      default:
        break;
    }
  };

  const currentWall = WALL_MATERIALS[config.wallMaterial] || WALL_MATERIALS.absorptive_metal;
  const currentTree = REGIONAL_TREE_SPECIES[config.treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;

  return (
    <div className="acoustic-controls-panel">
      {/* Top Bar: Mode Switcher (Simple vs Pro) & 1-Click Presets */}
      <div className="panel-mode-bar">
        <div className="ui-mode-toggle">
          <button
            className={`mode-btn ${uiMode === "simple" ? "active" : ""}`}
            onClick={() => setUiMode("simple")}
          >
            ✨ Simple Mode (Executive)
          </button>
          <button
            className={`mode-btn ${uiMode === "pro" ? "active" : ""}`}
            onClick={() => setUiMode("pro")}
          >
            📊 Pro Mode (Acoustic Engineering)
          </button>
        </div>

        <div className="quick-presets-strip">
          <span className="strip-label">PRESETS:</span>
          <button className="preset-pill danger" onClick={() => applyPreset("violation")}>
            🚨 Violation
          </button>
          <button className="preset-pill standard" onClick={() => applyPreset("compliant")}>
            🏢 Code Compliant
          </button>
          <button className="preset-pill eco" onClick={() => applyPreset("eco_forest")}>
            🌲 Bio-Buffer
          </button>
          <button className="preset-pill silent" onClick={() => applyPreset("vault_bunker")}>
            🛡️ Silent Bunker
          </button>
        </div>
      </div>

      {/* Hero Community Health & Compliance Card */}
      <section className="clean-hero-card" style={{ borderColor: results.statusColor }}>
        <div className="hero-status-left">
          <div className="status-pill-large" style={{ background: `${results.statusColor}20`, color: results.statusColor, borderColor: `${results.statusColor}60` }}>
            {results.isCompliant ? "✓ PEACEFUL & COMPLIANT" : "⚠️ NOISE VIOLATION DETECTED"}
          </div>
          <div className="status-decibel-row">
            <span className="big-dba" style={{ color: results.statusColor }}>
              {results.netReceivedLp.toFixed(1)} <small>dBA</small>
            </span>
            <div className="status-sub-info">
              <span>{timeOfDay === "day" ? "Daytime Limit:" : "Night Curfew Limit:"} <strong>{results.municipalNoiseLimitDba} dBA</strong></span>
              <span className="margin-note" style={{ color: results.isCompliant ? "#34d399" : "#ef4444" }}>
                {results.marginDb >= 0 ? `✓ -${results.marginDb.toFixed(1)} dBA below limit` : `⚠️ +${Math.abs(results.marginDb).toFixed(1)} dBA over limit`}
              </span>
            </div>
          </div>
          <p className="status-plain-text">
            {results.isCompliant
              ? `Sound levels at the residential boundary (${site.defaultDistanceToHomesMeters}m away) are quiet enough for peaceful sleep without community lawsuits.`
              : `Chiller noise exceeds local municipal noise limits. High risk of stop-work injunctions from residential neighbors.`}
          </p>
        </div>

        <div className="hero-audio-right">
          <button
            className={`clean-audio-btn ${audioPlaying ? "playing" : ""}`}
            onClick={toggleAudio}
          >
            <span className="audio-btn-icon">{audioPlaying ? "🔊" : "🎧"}</span>
            <div className="audio-btn-desc">
              <strong>{audioPlaying ? "Stop Audio Simulation" : "Listen at Neighbor's Porch"}</strong>
              <small>{timeOfDay === "day" ? "Daytime Traffic Masked" : "Night Curfew (60Hz Hum Exposed)"}</small>
            </div>
          </button>

          <AudioVisualizerBars isPlaying={audioPlaying} dba={results.netReceivedLp} timeOfDay={timeOfDay} />
        </div>
      </section>

      {/* =========================================================================
          VIEW A: SIMPLE MODE (Clean, intuitive, zero-jargon for a naive person)
          ========================================================================= */}
      {uiMode === "simple" && (
        <div className="simple-controls-grid animated-fadeIn">
          {/* Card 1: Chiller Placement */}
          <div className="simple-card">
            <span className="card-step-tag">STEP 1</span>
            <h3>Where are the chillers placed?</h3>
            <p className="card-subtext">Positioning cooling equipment behind the building blocks direct line-of-sight sound.</p>

            <div className="simple-choice-list">
              <button
                className={`simple-choice-btn ${config.placement === "rear_shielded" ? "active" : ""}`}
                onClick={() => update({ placement: "rear_shielded" })}
              >
                <span className="choice-icon">🏢</span>
                <div className="choice-text">
                  <strong>Behind Building (Shielded)</strong>
                  <small>Building core blocks noise (-18 dB)</small>
                </div>
              </button>

              <button
                className={`simple-choice-btn ${config.placement === "side_exposed" || config.placement === "surface" ? "active" : ""}`}
                onClick={() => update({ placement: "side_exposed" })}
              >
                <span className="choice-icon">⚠️</span>
                <div className="choice-text">
                  <strong>Side / Front Yard (Exposed)</strong>
                  <small>Direct line of sight to homes (0 dB)</small>
                </div>
              </button>

              <button
                className={`simple-choice-btn ${config.placement === "underground" ? "active" : ""}`}
                onClick={() => update({ placement: "underground" })}
              >
                <span className="choice-icon">🛡️</span>
                <div className="choice-text">
                  <strong>Underground Bunker Vault</strong>
                  <small>Excavated 6m below grade (-28 dB)</small>
                </div>
              </button>
            </div>
          </div>

          {/* Card 2: Sound Barrier Wall */}
          <div className="simple-card">
            <span className="card-step-tag">STEP 2</span>
            <h3>How tall is the sound barrier wall?</h3>
            <p className="card-subtext">Acoustic walls bend sound upward and absorb reflections before reaching homes.</p>

            <div className="simple-slider-block">
              <div className="slider-header-row">
                <span>Wall Height</span>
                <strong className="slider-big-val">{config.wallEnabled ? `${config.wallHeightMeters} meters` : "None (Off)"}</strong>
              </div>

              <input
                type="range"
                min="0"
                max="16"
                step="2"
                value={config.wallEnabled ? config.wallHeightMeters : 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 0) update({ wallEnabled: false, wallHeightMeters: 4 });
                  else update({ wallEnabled: true, wallHeightMeters: val });
                }}
                className="clean-slider"
              />

              <div className="quick-btn-row">
                <button
                  className={!config.wallEnabled ? "active" : ""}
                  onClick={() => update({ wallEnabled: false })}
                >
                  No Wall
                </button>
                <button
                  className={config.wallEnabled && config.wallHeightMeters === 8 ? "active" : ""}
                  onClick={() => update({ wallEnabled: true, wallHeightMeters: 8, wallMaterial: "absorptive_metal" })}
                >
                  8m Standard
                </button>
                <button
                  className={config.wallEnabled && config.wallHeightMeters >= 12 ? "active" : ""}
                  onClick={() => update({ wallEnabled: true, wallHeightMeters: 14, wallMaterial: "absorptive_metal" })}
                >
                  14m Tall Shield
                </button>
              </div>

              {config.wallEnabled && (
                <div className="simple-wall-type-select-block">
                  <label className="simple-field-label">Wall Material & Construction:</label>
                  <select
                    value={config.wallMaterial}
                    onChange={(e) => update({ wallMaterial: e.target.value })}
                    className="material-select simple-mat-select"
                  >
                    {Object.values(WALL_MATERIALS).map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.icon} {mat.shortName} ({mat.soundDropLabel})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="simple-readout-pill">
                <span>Sound Reduction: </span>
                <strong style={{ color: "#34d399" }}>-{results.breakdown.wallAttenuation} dBA</strong>
              </div>
            </div>
          </div>

          {/* Card 3: Evergreen Tree Screen */}
          <div className="simple-card">
            <span className="card-step-tag">STEP 3</span>
            <h3>Do you want an evergreen tree screen?</h3>
            <p className="card-subtext">Dense pine and cedar needles scatter high-frequency fan whine naturally.</p>

            <div className="simple-slider-block">
              <div className="slider-header-row">
                <span>Tree Belt Depth</span>
                <strong className="slider-big-val">{config.treeEnabled ? `${config.treeBufferDepthMeters} meters` : "None (Off)"}</strong>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="10"
                value={config.treeEnabled ? config.treeBufferDepthMeters : 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === 0) update({ treeEnabled: false, treeBufferDepthMeters: 15 });
                  else update({ treeEnabled: true, treeBufferDepthMeters: val });
                }}
                className="clean-slider"
              />

              <div className="quick-btn-row">
                <button
                  className={!config.treeEnabled ? "active" : ""}
                  onClick={() => update({ treeEnabled: false })}
                >
                  No Trees
                </button>
                <button
                  className={config.treeEnabled && config.treeBufferDepthMeters === 20 ? "active" : ""}
                  onClick={() => update({ treeEnabled: true, treeBufferDepthMeters: 20 })}
                >
                  20m Screen
                </button>
                <button
                  className={config.treeEnabled && config.treeBufferDepthMeters >= 40 ? "active" : ""}
                  onClick={() => update({ treeEnabled: true, treeBufferDepthMeters: 40, treeArrangement: "perimeter_ring" })}
                >
                  40m Forest Belt
                </button>
              </div>

              <div className="simple-readout-pill">
                <span>Sound Reduction: </span>
                <strong style={{ color: "#34d399" }}>-{results.breakdown.treeAttenuation} dBA</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: PRO ENGINEERING MODE (Full telemetry for acoustic engineers)
          ========================================================================= */}
      {uiMode === "pro" && (
        <div className="pro-controls-wrapper animated-fadeIn">
          {/* Pro Sub-Navigation Tabs */}
          <div className="pro-nav-tabs">
            <button
              className={`pro-tab-btn ${proTab === "architecture" ? "active" : ""}`}
              onClick={() => setProTab("architecture")}
            >
              🏛️ Architectural Layout
            </button>
            <button
              className={`pro-tab-btn ${proTab === "walls" ? "active" : ""}`}
              onClick={() => setProTab("walls")}
            >
              🧱 Barrier Materials & Trees
            </button>
            <button
              className={`pro-tab-btn ${proTab === "budget" ? "active" : ""}`}
              onClick={() => setProTab("budget")}
            >
              📊 ISO 9613-2 Link Budget
            </button>
            <button
              className={`pro-tab-btn ${proTab === "insights" ? "active" : ""}`}
              onClick={() => setProTab("insights")}
            >
              🔬 Thermodynamics
            </button>
          </div>

          {proTab === "architecture" && (
            <div className="controls-columns">
              <section className="control-card animated-card">
                <div className="card-header">
                  <span className="eyebrow">CHILLER MECHANICAL COMPOUND</span>
                  <h4>Equipment Placement & Silencers</h4>
                </div>

                <div className="field-group">
                  <label>Chiller Yard Location</label>
                  <div className="button-group-row">
                    <button
                      className={config.placement === "rear_shielded" ? "active" : ""}
                      onClick={() => update({ placement: "rear_shielded" })}
                    >
                      🏢 Rear Shielded (-18 dB)
                    </button>
                    <button
                      className={config.placement === "side_exposed" || config.placement === "surface" ? "active" : ""}
                      onClick={() => update({ placement: "side_exposed" })}
                    >
                      ⚠️ Side Exposed (0 dB)
                    </button>
                    <button
                      className={config.placement === "underground" ? "active" : ""}
                      onClick={() => update({ placement: "underground" })}
                    >
                      🛡️ Bunker Vault (-28 dB)
                    </button>
                  </div>
                </div>

                <div className="slider-group">
                  <label className="slider-label">
                    <span>Condenser Fan Speed</span>
                    <b className="highlight-val">{fanSpeedPercent}%</b>
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={fanSpeedPercent}
                    onChange={(e) => onChangeFanSpeed(Number(e.target.value))}
                    className="clean-slider"
                  />
                  <div className="slider-sub-readout">
                    <span>Source Sound Power</span>
                    <strong>Lw: {results.sourceLw} dBA</strong>
                  </div>
                </div>

                <div className="field-group">
                  <div className="toggle-label-row">
                    <label>Acoustic Silencers & Blankets (-5.5 dB)</label>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={!!config.acousticSilencers}
                        onChange={(e) => update({ acousticSilencers: e.target.checked })}
                      />
                      <span className="slider-toggle"></span>
                    </label>
                  </div>
                </div>
              </section>

              <section className="control-card animated-card">
                <div className="card-header">
                  <span className="eyebrow">REGULATORY & ATMOSPHERIC CONDITIONS</span>
                  <h4>Time of Day & Inversion</h4>
                </div>

                <div className="field-group">
                  <label>Acoustic Time of Day</label>
                  <div className="button-group-row">
                    <button
                      className={timeOfDay === "day" ? "active" : ""}
                      onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("day")}
                    >
                      ☀️ Daytime (55 dBA Limit · 52 dBA Ambient)
                    </button>
                    <button
                      className={timeOfDay === "night" ? "active" : ""}
                      onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("night")}
                    >
                      🌙 Night Curfew (45 dBA Limit · 32 dBA Ambient)
                    </button>
                  </div>
                </div>

                <div className="eco-metric-strip" style={{ marginTop: "14px" }}>
                  <div>
                    <span>Atmospheric Inversion</span>
                    <strong>{timeOfDay === "night" ? "+1.8 dB" : "-1.2 dB"}</strong>
                  </div>
                  <div>
                    <span>Receptor SNR</span>
                    <strong>+{results.snrAboveAmbient} dB</strong>
                  </div>
                </div>
              </section>
            </div>
          )}

          {proTab === "walls" && (
            <div className="controls-columns">
              <section className="control-card animated-card">
                <div className="card-header">
                  <span className="eyebrow">PERIMETER BARRIER WALL</span>
                  <div className="header-toggle">
                    <h4>Sound Screen Wall</h4>
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
                  <div className="field-group">
                    <label>Enclosure Configuration</label>
                    <div className="button-group-row">
                      <button
                        className={(!config.wallEnclosure || config.wallEnclosure === "single_east") ? "active" : ""}
                        onClick={() => update({ wallEnclosure: "single_east" })}
                      >
                        East Wall Only
                      </button>
                      <button
                        className={config.wallEnclosure === "u_shape" ? "active" : ""}
                        onClick={() => update({ wallEnclosure: "u_shape" })}
                      >
                        U-Shaped Cowl
                      </button>
                      <button
                        className={config.wallEnclosure === "full_4side" ? "active" : ""}
                        onClick={() => update({ wallEnclosure: "full_4side" })}
                      >
                        4-Sided Shroud
                      </button>
                    </div>
                  </div>

                  <div className="slider-group">
                    <label className="slider-label">
                      <span>Wall Height</span>
                      <b className="highlight-val">{config.wallHeightMeters}m</b>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      step="1"
                      disabled={!config.wallEnabled}
                      value={config.wallHeightMeters}
                      onChange={(e) => update({ wallHeightMeters: Number(e.target.value) })}
                      className="clean-slider"
                    />
                  </div>

                  <div className="field-group">
                    <label>Acoustic Barrier Wall Material & Type</label>
                    <select
                      disabled={!config.wallEnabled}
                      value={config.wallMaterial}
                      onChange={(e) => update({ wallMaterial: e.target.value })}
                      className="material-select"
                    >
                      <optgroup label="Metal Absorptive & Structural Barriers">
                        <option value="absorptive_metal">
                          🔲 Perforated Metal Absorptive (10 – 15 dB drop · 4")
                        </option>
                        <option value="steel_aluminum">
                          🛡️ Modular Steel / Aluminum Panel (15 – 25 dB drop · 4")
                        </option>
                      </optgroup>
                      <optgroup label="Concrete & Masonry Mass Barriers">
                        <option value="dense_concrete">
                          🧱 Precast Concrete Wall (6 – 10 dB drop · 4" Standard)
                        </option>
                        <option value="concrete_thick">
                          🏗️ Reinforced Concrete (9 – 14 dB drop · 4.5"+ Low-Freq)
                        </option>
                        <option value="masonry_brick">
                          🧱 Masonry / Brick Wall (~50 dB reduction · 4.5" Thick)
                        </option>
                      </optgroup>
                      <optgroup label="Biophilic Living Green Walls">
                        <option value="green_wall_concrete">
                          🌿 Green Living Wall + Concrete (45 – 55 dB reduction)
                        </option>
                        <option value="green_wall_masonry">
                          🌱 Green Living Wall + Masonry (40 – 48 dB reduction)
                        </option>
                        <option value="green_wall_steel">
                          🍃 Green Living Wall + Steel (35 – 42 dB reduction)
                        </option>
                      </optgroup>
                      <optgroup label="Special Architectural Barriers">
                        <option value="mass_timber">
                          🪵 Acoustic Mass Timber (12 – 18 dB drop)
                        </option>
                        <option value="transparent_acrylic">
                          🔍 Clear Acoustic Polycarbonate (14 – 20 dB drop)
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Wall Specification Callout Card */}
                  {config.wallEnabled && (
                    <div className="wall-spec-detail-box animated-fadeIn">
                      <div className="wall-spec-top-row">
                        <span className="wall-spec-icon">{currentWall.icon}</span>
                        <div className="wall-spec-headline">
                          <strong>{currentWall.name}</strong>
                          <span className="wall-spec-sub">{currentWall.category} · {currentWall.typicalThickness}</span>
                        </div>
                        <span className="wall-spec-drop-badge">{currentWall.soundDropLabel}</span>
                      </div>
                      <p className="wall-spec-desc">{currentWall.description}</p>
                      <div className="wall-spec-meta-row">
                        <span><strong>NRC:</strong> {currentWall.nrcRating}</span>
                        <span><strong>TL:</strong> {currentWall.transmissionLossDb} dB</span>
                        <span><strong>Unit Cost:</strong> ${currentWall.costPerSqMeter}/m²</span>
                        <span><strong>Durability:</strong> {currentWall.durabilityYears} yrs</span>
                      </div>
                      <div className="wall-spec-freq-tip">
                        <small>💡 <em>Frequency Response:</em> {currentWall.frequencyNote}</small>
                      </div>
                      <div className="wall-spec-source-tip">
                        <small>
                          📚 Source:{" "}
                          <a
                            href="https://www.lsars.com/data-center-noise"
                            target="_blank"
                            rel="noreferrer"
                            className="source-link"
                          >
                            LSARS Data Center Noise Guide (lsars.com/data-center-noise)
                          </a>
                        </small>
                      </div>
                    </div>
                  )}

                  <div className="eco-metric-strip">
                    <div>
                      <span>Estimated CAPEX</span>
                      <strong>${results.economics.wallCostEstimate.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span>Embodied CO₂</span>
                      <strong>{results.economics.wallEmbodiedCarbonKg.toLocaleString()} kg</strong>
                    </div>
                  </div>
                </div>
              </section>

              <section className="control-card animated-card">
                <div className="card-header">
                  <span className="eyebrow">BIO-ACOUSTIC BUFFER</span>
                  <div className="header-toggle">
                    <h4>Vegetation Screen</h4>
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
                    <label>Tree Species</label>
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
                      <b className="highlight-val">{config.treeBufferDepthMeters}m</b>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="80"
                      step="5"
                      disabled={!config.treeEnabled}
                      value={config.treeBufferDepthMeters}
                      onChange={(e) => update({ treeBufferDepthMeters: Number(e.target.value) })}
                      className="clean-slider"
                    />
                  </div>

                  <div className="eco-metric-strip">
                    <div>
                      <span>Annual Maint.</span>
                      <strong>${results.economics.treeAnnualMaintenanceCost}/yr</strong>
                    </div>
                    <div>
                      <span>Water Footprint</span>
                      <strong>{results.economics.treeAnnualWaterGallons.toLocaleString()} gal</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {proTab === "budget" && (
            <section className="acoustic-budget-card animated-card">
              <span className="eyebrow">ISO 9613-2 ACOUSTIC LINK BUDGET BREAKDOWN</span>
              <h4>Attenuation Steps from Silicon to Porch</h4>
              <div className="budget-flow" style={{ marginTop: "16px" }}>
                <div className="budget-item">
                  <span>Chiller Source (Lw)</span>
                  <strong>{results.sourceLw} dBA</strong>
                </div>
                <div className="budget-operator">−</div>
                <div className="budget-item">
                  <span>Distance ({site.defaultDistanceToHomesMeters}m)</span>
                  <strong>{results.breakdown.geometricDecay} dB</strong>
                </div>
                <div className="budget-operator">−</div>
                <div className="budget-item">
                  <span>Placement Shield</span>
                  <strong>{results.breakdown.placementAttenuation} dB</strong>
                </div>
                <div className="budget-operator">−</div>
                <div className="budget-item">
                  <span>Barrier Wall</span>
                  <strong>{results.breakdown.wallAttenuation} dB</strong>
                </div>
                <div className="budget-operator">−</div>
                <div className="budget-item">
                  <span>Tree Buffer</span>
                  <strong>{results.breakdown.treeAttenuation} dB</strong>
                </div>
                <div className="budget-operator">=</div>
                <div className="budget-item total">
                  <span>Net Community Noise</span>
                  <strong style={{ color: results.statusColor }}>{results.netReceivedLp.toFixed(1)} dBA</strong>
                </div>
              </div>
            </section>
          )}

          {proTab === "insights" && (
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
                  In real hyperscale builds (AWS, Microsoft, Google, Equinix), <strong>air-cooled chillers MUST sit outside</strong> with massive 2-meter axial fans blasting hot air upward.
                  In <strong>Loudoun County, VA ("Data Center Alley")</strong>, placing chillers on the side of the building creates severe community lawsuits, leading planning commissions to mandate
                  <strong> Building-Shielded Rear Yards</strong>, heavy acoustic barrier walls, or subterranean vaults.
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}