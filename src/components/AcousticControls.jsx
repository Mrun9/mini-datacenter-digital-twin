import { useState } from "react";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES, CHILLER_PLACEMENTS } from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";

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

  const toggleAudio = () => {
    const isNowPlaying = acousticSimulator.toggle();
    setAudioPlaying(isNowPlaying);
    if (isNowPlaying) {
      acousticSimulator.setDecibels(results.netReceivedLp);
    }
  };

  if (audioPlaying) {
    acousticSimulator.setDecibels(results.netReceivedLp);
  }

  const update = (patch) => {
    onChangeConfig({ ...config, ...patch });
  };

  const currentWall = WALL_MATERIALS[config.wallMaterial] || WALL_MATERIALS.absorptive_metal;
  const currentTree = REGIONAL_TREE_SPECIES[config.treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;

  return (
    <div className="acoustic-controls-panel">
      {/* Real-time Decibel Compliance Bar & Audio Ear Simulator */}
      <section className="compliance-banner" style={{ borderColor: results.statusColor }}>
        <div className="compliance-readout">
          <span className="eyebrow">RESIDENTIAL COMMUNITY RECEPTOR ({site.defaultDistanceToHomesMeters}m AWAY)</span>
          <div className="decibel-hero">
            <div className="decibel-dual-metric">
              <span className="hero-number" style={{ color: results.statusColor }}>
                {results.netReceivedLp.toFixed(1)}
                <small> dBA</small>
              </span>
              <span className="hero-subnumber">
                {results.netReceivedLpC.toFixed(1)} <small>dBC (Low-Freq Hum)</small>
              </span>
            </div>
            <div
              className="compliance-tag"
              style={{
                background: `${results.statusColor}22`,
                color: results.statusColor,
                border: `1px solid ${results.statusColor}66`,
              }}
            >
              {results.complianceStatus}
            </div>
          </div>
          <p className="compliance-detail">
            Municipal Night Limit: <strong>{site.municipalNoiseLimitDba} dBA</strong> · Net Noise Attenuation:{" "}
            <strong>-{results.noiseReductionDb.toFixed(1)} dBA</strong> (Unmitigated Source at Boundary:{" "}
            {results.unmitigatedLp.toFixed(1)} dBA)
          </p>
        </div>

        {/* Live Audio Ear Simulator Button */}
        <div className="audio-simulator-cta">
          <button
            className={`audio-btn ${audioPlaying ? "playing" : ""}`}
            onClick={toggleAudio}
            title="Listen to the actual noise level at the residential property line"
          >
            <span className="audio-icon">{audioPlaying ? "🔊" : "🎧"}</span>
            <div className="audio-btn-text">
              <strong>{audioPlaying ? "Stop Audio Simulation" : "Listen at Neighbor's Porch"}</strong>
              <small>
                {audioPlaying
                  ? `Synthesizing ${results.netReceivedLp.toFixed(1)} dBA`
                  : "Web Audio Synthesizer (60Hz hum + fan roar)"}
              </small>
            </div>
          </button>
        </div>
      </section>

      {/* Engineering Insight Bar: Why Chillers are Outside */}
      <section className="thermo-note-card">
        <div className="thermo-note-header" onClick={() => setShowThermoNote(!showThermoNote)}>
          <span>🔬 <strong>Engineering Reality:</strong> Why are chillers placed outdoors?</span>
          <button className="link-toggle">{showThermoNote ? "Hide Engineering Insight ▲" : "Read Heat Rejection Physics ▼"}</button>
        </div>
        {showThermoNote && (
          <div className="thermo-note-body">
            <p>
              <strong>The 2nd Law of Thermodynamics:</strong> A 50-megawatt data center converts 100% of its electrical power directly into heat.
              To maintain server inlet temperatures at 20°C to 25°C, that thermal energy must be continuously extracted via chilled water loops
              and <em>rejected into the outdoor atmosphere</em>.
            </p>
            <p>
              In real hyperscale builds (AWS, Microsoft, Equinix), <strong>air-cooled chillers and cooling towers MUST sit outside</strong> with massive 2-meter axial fans blasting hot air upward.
              In <strong>Loudoun County, VA ("Data Center Alley")</strong>, placing chillers on the side of the building creates severe community lawsuits, leading planning commissions to mandate
              <strong> Building-Shielded Rear Yards</strong>, heavy acoustic barrier walls, or subterranean vaults.
            </p>
          </div>
        )}
      </section>

      <div className="controls-columns">
        {/* Pillar 1: Chiller Placement & Mechanical Operation */}
        <section className="control-card">
          <div className="card-header">
            <span className="eyebrow">STEP 1: ARCHITECTURAL SITE PLACEMENT</span>
            <h4>Chiller Yard Location</h4>
          </div>

          <div className="placement-buttons">
            <button
              className={config.placement === "rear_shielded" ? "active" : ""}
              onClick={() => update({ placement: "rear_shielded" })}
            >
              🏢 Rear Yard (Building-Shielded)
              <small>-18.0 dB (Loudoun SPEX Best Practice)</small>
            </button>
            <button
              className={config.placement === "side_exposed" || config.placement === "surface" ? "active" : ""}
              onClick={() => update({ placement: "side_exposed" })}
            >
              ⚠️ Side Yard (Exposed to Homes)
              <small>0.0 dB (Direct line-of-sight radiation)</small>
            </button>
            <button
              className={config.placement === "rooftop" ? "active" : ""}
              onClick={() => update({ placement: "rooftop" })}
            >
              🏙️ Rooftop Chiller Penthouse
              <small>+3.5 dB penalty (Elevated line-of-sight)</small>
            </button>
            <button
              className={config.placement === "underground" ? "active" : ""}
              onClick={() => update({ placement: "underground" })}
            >
              🛡️ Subterranean Bunker Vault
              <small>-28.0 dB (Excavated 6m below grade)</small>
            </button>
            <button
              className={config.placement === "semi_berm" ? "active" : ""}
              onClick={() => update({ placement: "semi_berm" })}
            >
              ⛰️ Semi-Bermed Basin
              <small>-11.5 dB (Earthen acoustic berms)</small>
            </button>
          </div>

          <label className="slider-label">
            Condenser Fan Duty Cycle <b>{fanSpeedPercent}%</b>
            <input
              type="range"
              min="30"
              max="100"
              value={fanSpeedPercent}
              onChange={(e) => onChangeFanSpeed(Number(e.target.value))}
            />
            <small className="slider-hint">Directly affects chiller sound power (Lw: {results.sourceLw} dBA)</small>
          </label>

          <label className="slider-label">
            Exhaust Directivity Angle <b>{config.chillerOrientationAngle}° away</b>
            <input
              type="range"
              min="0"
              max="180"
              step="15"
              value={config.chillerOrientationAngle}
              onChange={(e) => update({ chillerOrientationAngle: Number(e.target.value) })}
            />
            <small className="slider-hint">
              Points exhaust fans away from residential homes (-{results.breakdown.directivityAttenuation} dB)
            </small>
          </label>
        </section>

        {/* Pillar 2: Acoustic Barrier Walls */}
        <section className="control-card">
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
            <label className="slider-label">
              Wall Height <b>{config.wallHeightMeters} meters</b>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                disabled={!config.wallEnabled}
                value={config.wallHeightMeters}
                onChange={(e) => update({ wallHeightMeters: Number(e.target.value) })}
              />
              <small className="slider-hint">Maekawa diffraction loss: -{results.breakdown.wallAttenuation} dB</small>
            </label>

            <div className="field-group">
              <label>Acoustic Wall Material</label>
              <select
                disabled={!config.wallEnabled}
                value={config.wallMaterial}
                onChange={(e) => update({ wallMaterial: e.target.value })}
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
                <span>Wall Cost Estimate</span>
                <strong>${results.economics.wallCostEstimate.toLocaleString()}</strong>
              </div>
              <div>
                <span>Embodied Carbon</span>
                <strong>{results.economics.wallEmbodiedCarbonKg.toLocaleString()} kg CO₂</strong>
              </div>
            </div>
            <p className="material-desc">{currentWall.description}</p>
          </div>
        </section>

        {/* Pillar 3: Regional Bio-Acoustic Vegetation Buffer */}
        <section className="control-card">
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
              >
                {Object.values(REGIONAL_TREE_SPECIES).map((tree) => (
                  <option key={tree.id} value={tree.id}>
                    {tree.name} ({tree.region})
                  </option>
                ))}
              </select>
            </div>

            <label className="slider-label">
              Buffer Depth <b>{config.treeBufferDepthMeters} meters</b>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                disabled={!config.treeEnabled}
                value={config.treeBufferDepthMeters}
                onChange={(e) => update({ treeBufferDepthMeters: Number(e.target.value) })}
              />
              <small className="slider-hint">
                ISO 9613-2 foliage scattering: -{results.breakdown.treeAttenuation} dB
              </small>
            </label>

            <div className="eco-metric-strip">
              <div>
                <span>Annual Maintenance</span>
                <strong>${results.economics.treeAnnualMaintenanceCost} / yr</strong>
              </div>
              <div>
                <span>Water Footprint</span>
                <strong>{results.economics.treeAnnualWaterGallons.toLocaleString()} gal/yr</strong>
              </div>
              <div>
                <span>Carbon Offset</span>
                <strong>{results.economics.treeAnnualCo2Kg.toLocaleString()} kg/yr</strong>
              </div>
            </div>
            <p className="material-desc">{currentTree.description}</p>
          </div>
        </section>
      </div>

      {/* Acoustic Engineering Budget Breakdown */}
      <section className="acoustic-budget-card">
        <span className="eyebrow">ISO 9613-2 ACOUSTIC LINK BUDGET BREAKDOWN</span>
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
            <span>Placement / Building Shield</span>
            <strong>{results.breakdown.placementAttenuation} dB</strong>
          </div>
          <div className="budget-operator">−</div>
          <div className="budget-item">
            <span>Wall Diffraction</span>
            <strong>{results.breakdown.wallAttenuation} dB</strong>
          </div>
          <div className="budget-operator">−</div>
          <div className="budget-item">
            <span>Tree & Ground Buffer</span>
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
    </div>
  );
}
