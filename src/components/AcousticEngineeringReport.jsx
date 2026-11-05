import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES, CHILLER_PLACEMENTS } from "../simulation/datacenterSites.js";

const OCTAVE_BANDS = [
  { freq: 63, label: "63 Hz", aWeight: -26.2, cWeight: -0.8, airAbsPer100m: 0.05, sourceRel: -3 },
  { freq: 125, label: "125 Hz", aWeight: -16.1, cWeight: -0.2, airAbsPer100m: 0.15, sourceRel: 2 },
  { freq: 250, label: "250 Hz", aWeight: -8.6, cWeight: 0.0, airAbsPer100m: 0.35, sourceRel: 0 },
  { freq: 500, label: "500 Hz", aWeight: -3.2, cWeight: 0.0, airAbsPer100m: 0.70, sourceRel: -2 },
  { freq: 1000, label: "1 kHz", aWeight: 0.0, cWeight: 0.0, airAbsPer100m: 1.50, sourceRel: -4 },
  { freq: 2000, label: "2 kHz", aWeight: 1.2, cWeight: -0.2, airAbsPer100m: 3.20, sourceRel: -8 },
  { freq: 4000, label: "4 kHz", aWeight: 1.0, cWeight: -0.8, airAbsPer100m: 8.50, sourceRel: -14 },
  { freq: 8000, label: "8 kHz", aWeight: -1.1, cWeight: -3.0, airAbsPer100m: 24.0, sourceRel: -22 },
];

export default function AcousticEngineeringReport({
  site: propSite,
  config: propConfig,
  results: propResults,
  fanSpeedPercent = 75,
  itPowerKw = 500,
  timeOfDay = "night",
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "formulas" | "octave" | "thermo"
  const [copied, setCopied] = useState(false);

  const site = propSite || {
    name: "Loudoun County, VA",
    city: "Ashburn",
    country: "United States",
    coordinates: "39.0274° N, 77.4586° W",
    defaultDistanceToHomesMeters: 320,
    municipalNoiseLimitDba: 45,
  };
  const config = propConfig || {};
  const results = propResults || {
    sourceLw: 108.0,
    unmitigatedLp: 55.0,
    netReceivedLp: 29.2,
    netReceivedLpC: 38.7,
    lowFreqExcess: 9.5,
    marginDb: 15.8,
    isCompliant: true,
    complianceStatus: "Compliant",
    statusColor: "#059669",
    activeLegalLimit: 45,
    backgroundNoiseFloor: 32,
    breakdown: {
      geometricDecay: 61.1,
      terrainEchoDb: 0,
      inversionEffect: 1.8,
      placementAttenuation: 18.0,
      wallAttenuation: 10.8,
      treeAttenuation: 6.5,
      directivityAttenuation: 4.5,
      totalMitigationDb: 39.8,
    },
    economics: {
      wallCostEstimate: 104400,
      wallEmbodiedCarbonKg: 27360,
      treeAnnualMaintenanceCost: 300,
      treeAnnualWaterGallons: 15000,
      treeAnnualCo2Kg: 5984,
    },
  };

  const currentWall = WALL_MATERIALS[config.wallMaterial] || WALL_MATERIALS.absorptive_metal;
  const currentTree = REGIONAL_TREE_SPECIES[config.treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const currentPlacement = CHILLER_PLACEMENTS[config.placement] || CHILLER_PLACEMENTS.side_exposed;

  const distanceM = site.defaultDistanceToHomesMeters || 320;
  const wallDistSourceM = 15;
  const wallDistRecM = Math.max(10, distanceM - wallDistSourceM);

  // Fresnel number calculation
  const sourceHeight = 3.5;
  const earHeight = 1.8;
  const effWallHeight = config.wallEnabled ? (config.wallHeightMeters || 8) : 0;
  const h1 = Math.max(0.1, effWallHeight - sourceHeight);
  const h2 = Math.max(0.1, effWallHeight - earHeight);
  const directDist = Math.hypot(distanceM, Math.abs(sourceHeight - earHeight));
  const diffPath = config.wallEnabled
    ? Math.hypot(wallDistSourceM, h1) + Math.hypot(wallDistRecM, h2)
    : directDist;
  const deltaPath = Math.max(0, diffPath - directDist);
  const lambda = 2.86;
  const fresnelN = (2 * deltaPath) / lambda;

  // Expenditures & Ecology
  const wallPerimeter = config.wallEnclosure === "full_4side" ? 180 : config.wallEnclosure === "u_shape" ? 135 : 90;
  const wallArea = config.wallEnabled ? wallPerimeter * (config.wallHeightMeters || 8) : 0;
  const wallCost = Math.round(wallArea * (currentWall?.costPerSqMeter || 145));
  const wallCarbon = Math.round(wallArea * (currentWall?.embodiedCarbonKgPerSqMeter || 38));

  const treeBufferWidth = 80;
  const treeBufferDepth = config.treeEnabled ? (config.treeBufferDepthMeters || 25) : 0;
  const treeAreaSqM = treeBufferWidth * treeBufferDepth;
  const treeCount = Math.round(treeAreaSqM / 9);
  const treeMaintCost = Math.round(treeBufferDepth * (currentTree?.annualMaintenanceCostPerMeter || 12) * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));
  const treeWaterGal = Math.round((treeAreaSqM / 4046) * (currentTree?.annualWaterGallonsPerAcre || 15000) * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));
  const treeCo2Seq = Math.round(treeCount * (currentTree?.co2AbsorptionKgPerTreePerYear || 22) * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));

  const municipalDailyFine = 25000;
  const annualAvoidedFines = results.isCompliant ? municipalDailyFine * 365 : 0;

  // Octave band table
  const octaveData = OCTAVE_BANDS.map((band) => {
    const bandSourceLw = Math.round(((results.sourceLw || 108.0) + band.sourceRel) * 10) / 10;
    const geomLoss = Math.round((20 * Math.log10(distanceM) + 11) * 10) / 10;
    const airLoss = Math.round(((band.airAbsPer100m * distanceM) / 100) * 10) / 10;
    const placementLoss = Math.round((results.breakdown?.placementAttenuation || 0) * 10) / 10;
    const wallLoss = config.wallEnabled
      ? Math.round(Math.min(currentWall?.transmissionLossDb || 34, (results.breakdown?.wallAttenuation || 10) * (band.freq <= 125 ? 0.8 : 1.1)) * 10) / 10
      : 0;
    const vegLoss = config.treeEnabled
      ? Math.round((results.breakdown?.treeAttenuation || 6) * (band.freq <= 125 ? 0.6 : 1.2) * 10) / 10
      : 0;

    const unweightedLp = Math.round(Math.max(15, bandSourceLw - geomLoss - airLoss - placementLoss - wallLoss - vegLoss) * 10) / 10;
    const aWeightedLp = Math.round((unweightedLp + band.aWeight) * 10) / 10;
    const cWeightedLp = Math.round((unweightedLp + band.cWeight) * 10) / 10;

    return {
      ...band,
      sourceLw: bandSourceLw,
      geomLoss,
      airLoss,
      placementLoss,
      wallLoss,
      vegLoss,
      unweightedLp,
      aWeightedLp,
      cWeightedLp,
    };
  });

  // Print & Copy
  const handlePrint = () => window.print();

  const handleCopySummary = () => {
    const text = `HushGrid ISO 9613-2 Audit: ${site.name}
Distance: ${distanceM}m | Night Limit: ${site.municipalNoiseLimitDba} dBA
Net Received: ${results.netReceivedLp?.toFixed(1)} dBA (${results.isCompliant ? "COMPLIANT" : "VIOLATION"})
Total Attenuation: -${results.breakdown?.totalMitigationDb} dB (Wall: -${results.breakdown?.wallAttenuation}dB, Trees: -${results.breakdown?.treeAttenuation}dB)
Expenditure: Wall CAPEX $${wallCost.toLocaleString()} | Trees OPEX $${treeMaintCost.toLocaleString()}/yr | Fines Avoided $${(annualAvoidedFines / 1000000).toFixed(2)}M/yr`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div className="report-modal-overlay animated-fadeIn" onClick={onClose} role="dialog" aria-modal="true">
      <div className="report-modal-dialog minimal-dialog animated-pop" onClick={(e) => e.stopPropagation()} tabIndex="-1">
        <div className="minimal-report-canvas">

          {/* Minimalist Top Header */}
          <header className="min-header">
            <div className="min-header-info">
              <div className="min-header-title-row">
                <h3>Acoustic Compliance & Budget Summary</h3>
                <span className={`min-status-badge ${results.isCompliant ? "pass" : "fail"}`}>
                  {results.isCompliant ? "✓ COMPLIANT" : "⚠️ VIOLATION"}
                </span>
              </div>
              <span className="min-header-meta">
                {site.name} · {site.coordinates || "39.0274° N, 77.4586° W"} · Receptor {distanceM}m · ISO 9613-2 Certified
              </span>
            </div>

            <div className="min-header-actions">
              <button className="min-btn" onClick={handlePrint} title="Print or save as PDF">🖨️ PDF</button>
              <button className="min-btn" onClick={handleCopySummary} title="Copy summary">
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
              {onClose && (
                <button className="min-close-btn" onClick={onClose} title="Close popup">✕</button>
              )}
            </div>
          </header>

          {/* Minimal Clean Tabs */}
          <nav className="min-nav-tabs">
            <button
              className={`min-tab ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Executive Dashboard
            </button>
            <button
              className={`min-tab ${activeTab === "formulas" ? "active" : ""}`}
              onClick={() => setActiveTab("formulas")}
            >
              📐 Physics & Formulas
            </button>
            <button
              className={`min-tab ${activeTab === "octave" ? "active" : ""}`}
              onClick={() => setActiveTab("octave")}
            >
              📈 Octave Spectrum (63Hz - 8kHz)
            </button>
            <button
              className={`min-tab ${activeTab === "thermo" ? "active" : ""}`}
              onClick={() => setActiveTab("thermo")}
            >
              🔬 Thermodynamic Cycle
            </button>
          </nav>

          {/* TAB 1: EXECUTIVE DASHBOARD (TWO BALANCED HALVES, MINIMAL SCROLLING) */}
          {activeTab === "dashboard" && (
            <div className="min-two-halves-grid animated-fadeIn">

              {/* ─── LEFT HALF: SHORTENED SECTION 1 (KPI) + SECTION 3 (WATERFALL) ─── */}
              <div className="dashboard-half left-half">
                
                {/* Shortened Section 1: Top Metric Banner */}
                <div className="min-metric-banner">
                  <div className="banner-primary">
                    <span className="banner-sublabel">NET SOUND AT RESIDENTIAL PROPERTY LINE</span>
                    <div className="banner-number-row">
                      <strong className="banner-big-val">{results.netReceivedLp?.toFixed(1)}</strong>
                      <span className="banner-unit">dBA</span>
                      <span className={`banner-margin-tag ${results.isCompliant ? "margin-pass" : "margin-fail"}`}>
                        {results.marginDb >= 0 ? `+${results.marginDb?.toFixed(1)} dB Margin` : `${results.marginDb?.toFixed(1)} dB Violation`}
                      </span>
                    </div>
                  </div>
                  <div className="banner-stats-inline">
                    <span>Curfew Limit: <b>{results.activeLegalLimit} dBA</b></span>
                    <span>Source Lw: <b>{results.sourceLw} dBA</b></span>
                    <span>Tonal Hum: <b>{results.netReceivedLpC?.toFixed(1)} dBC</b></span>
                  </div>
                </div>

                {/* Shortened Section 3: Link Budget Waterfall */}
                <div className="min-card">
                  <div className="min-card-header">
                    <h4>ISO 9613-2 Link Budget Waterfall</h4>
                    <span className="min-tag">Silicon → Porch</span>
                  </div>

                  <table className="min-waterfall-table">
                    <tbody>
                      <tr>
                        <td>Chiller Sound Power (Lw)</td>
                        <td className="desc-cell">{fanSpeedPercent}% fan speed, {itPowerKw} kW load</td>
                        <td className="val-cell"><b>{results.sourceLw} dBA</b></td>
                      </tr>
                      <tr>
                        <td>Geometric Spreading Decay</td>
                        <td className="desc-cell">−20 log₁₀({distanceM}m) − 11 dB</td>
                        <td className="val-cell minus">−{results.breakdown?.geometricDecay} dB</td>
                      </tr>
                      <tr>
                        <td>Nocturnal Inversion Lens</td>
                        <td className="desc-cell">Ground cooling thermal boundary</td>
                        <td className="val-cell plus">+{results.breakdown?.inversionEffect} dB</td>
                      </tr>
                      <tr>
                        <td>Building Placement Shield</td>
                        <td className="desc-cell">{currentPlacement.name}</td>
                        <td className="val-cell minus">−{results.breakdown?.placementAttenuation} dB</td>
                      </tr>
                      <tr>
                        <td>Acoustic Barrier Wall</td>
                        <td className="desc-cell">{config.wallEnabled ? `${config.wallHeightMeters}m ${currentWall.name}` : "None"}</td>
                        <td className="val-cell minus">−{results.breakdown?.wallAttenuation} dB</td>
                      </tr>
                      <tr>
                        <td>Bio-Acoustic Tree Buffer</td>
                        <td className="desc-cell">{config.treeEnabled ? `${treeBufferDepth}m ${currentTree.name}` : "None"}</td>
                        <td className="val-cell minus">−{results.breakdown?.treeAttenuation} dB</td>
                      </tr>
                      <tr>
                        <td>Directivity & Louver Angle</td>
                        <td className="desc-cell">Turned {config.chillerOrientationAngle || 90}° from homes</td>
                        <td className="val-cell minus">−{results.breakdown?.directivityAttenuation} dB</td>
                      </tr>
                      <tr>
                        <td>Suburban Ambient Floor</td>
                        <td className="desc-cell">Nocturnal calm background addition</td>
                        <td className="val-cell">+{results.backgroundNoiseFloor} dBA</td>
                      </tr>
                      <tr className="waterfall-total-row">
                        <td><strong>Net Sound at Boundary</strong></td>
                        <td className="desc-cell"><strong>{results.complianceStatus}</strong></td>
                        <td className="val-cell total"><strong>{results.netReceivedLp?.toFixed(1)} dBA</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ─── RIGHT HALF: SECTION 4 (EXPENDITURES) + ATTENUATION ANALYSIS CHART ─── */}
              <div className="dashboard-half right-half">

                {/* Section 4: Capital & Operating Expenditures Grid */}
                <div className="min-card">
                  <div className="min-card-header">
                    <h4>Capital & Operating Expenditures</h4>
                    <span className="min-tag">Budget & Risk</span>
                  </div>

                  <div className="min-cost-grid">
                    <div className="min-cost-box">
                      <span className="cost-label">WALL CAPEX</span>
                      <strong className="cost-val">${wallCost.toLocaleString()}</strong>
                      <span className="cost-sub">{wallArea} m² ({config.wallHeightMeters || 8}m high {currentWall.name})</span>
                    </div>

                    <div className="min-cost-box">
                      <span className="cost-label">TREE BUFFER OPEX</span>
                      <strong className="cost-val">${treeMaintCost.toLocaleString()}<small>/yr</small></strong>
                      <span className="cost-sub">{treeCount} trees ({treeBufferDepth}m depth, {treeWaterGal.toLocaleString()} gal/yr)</span>
                    </div>

                    <div className="min-cost-box">
                      <span className="cost-label">CARBON BALANCE</span>
                      <strong className="cost-val">{wallCarbon.toLocaleString()} <small>kg CO₂</small></strong>
                      <span className="cost-sub">−{treeCo2Seq.toLocaleString()} kg/yr tree sequestration</span>
                    </div>

                    <div className="min-cost-box highlight-cost">
                      <span className="cost-label">FINES AVOIDED</span>
                      <strong className="cost-val">${(annualAvoidedFines / 1000000).toFixed(2)}M<small>/yr</small></strong>
                      <span className="cost-sub">$25k/day Loudoun moratorium fine</span>
                    </div>
                  </div>
                </div>

                {/* Visual Attenuation Analysis Bar */}
                <div className="min-card">
                  <div className="min-card-header">
                    <h4>Cumulative Sound Reduction Breakdown</h4>
                    <span className="min-tag">−{results.breakdown?.totalMitigationDb} dB Total</span>
                  </div>

                  <div className="min-atten-bars">
                    <div className="atten-bar-item">
                      <div className="atten-bar-labels">
                        <span>Distance Decay ({distanceM}m)</span>
                        <b>−{results.breakdown?.geometricDecay} dB</b>
                      </div>
                      <div className="atten-track">
                        <div className="atten-fill fill-slate" style={{ width: `${Math.min(100, (results.breakdown?.geometricDecay / 80) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="atten-bar-item">
                      <div className="atten-bar-labels">
                        <span>Building Placement Shield</span>
                        <b>−{results.breakdown?.placementAttenuation} dB</b>
                      </div>
                      <div className="atten-track">
                        <div className="atten-fill fill-blue" style={{ width: `${Math.min(100, (results.breakdown?.placementAttenuation / 28) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="atten-bar-item">
                      <div className="atten-bar-labels">
                        <span>Acoustic Barrier Wall</span>
                        <b>−{results.breakdown?.wallAttenuation} dB</b>
                      </div>
                      <div className="atten-track">
                        <div className="atten-fill fill-indigo" style={{ width: `${Math.min(100, (results.breakdown?.wallAttenuation / 26) * 100)}%` }} />
                      </div>
                    </div>

                    <div className="atten-bar-item">
                      <div className="atten-bar-labels">
                        <span>Bio-Acoustic Vegetation</span>
                        <b>−{results.breakdown?.treeAttenuation} dB</b>
                      </div>
                      <div className="atten-track">
                        <div className="atten-fill fill-emerald" style={{ width: `${Math.min(100, (results.breakdown?.treeAttenuation / 14) * 100)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Compact Thermal Callout */}
                  <div className="min-thermal-callout">
                    <span>⚡ <b>Thermodynamic Heat Rejection:</b> {itPowerKw} kW server load produces {(itPowerKw * 1.15).toFixed(0)} kW heat continuously rejected outdoors by 2-meter condenser fan arrays.</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: GOVERNING PHYSICS & FORMULAS (ONLY FORMULAS, ZERO DUPLICATE CONTENT) */}
          {activeTab === "formulas" && (
            <div className="min-tab-content-scroll animated-fadeIn">
              <div className="formulas-two-column-grid">
                
                <div className="formula-white-card">
                  <div className="formula-card-header">
                    <span className="formula-badge">FORMULA 1</span>
                    <h4>Maekawa Knife-Edge Barrier Diffraction</h4>
                  </div>
                  <div className="math-equation-block">
                    <div className="equation-line">
                      <span className="math-lhs">A<sub>barrier</sub></span> = 10 log<sub>10</sub>(3 + 20 · <span className="math-param">N</span>) + <span className="math-param">NRC<sub>bonus</sub></span>
                    </div>
                    <div className="equation-subline">
                      Fresnel Number: N = 2δ / λ = 2 · ({diffPath.toFixed(2)}m − {directDist.toFixed(2)}m) / 2.86m = <strong>{fresnelN.toFixed(4)}</strong>
                    </div>
                  </div>
                  <div className="formula-live-calculation">
                    <div className="step-row">
                      <span>Wavelength (120 Hz compressor tone):</span>
                      <strong>2.86 meters</strong>
                    </div>
                    <div className="step-row">
                      <span>Material NRC ({currentWall.name}):</span>
                      <strong>NRC {currentWall.nrcRating} (+{currentWall.nrcRating >= 0.8 ? "2.5" : "1.0"} dB)</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>Barrier Insertion Loss:</span>
                      <strong className="text-emerald">−{results.breakdown?.wallAttenuation.toFixed(1)} dB</strong>
                    </div>
                  </div>
                </div>

                <div className="formula-white-card">
                  <div className="formula-card-header">
                    <span className="formula-badge">FORMULA 2</span>
                    <h4>ISO 9613-2 Geometric Distance Decay</h4>
                  </div>
                  <div className="math-equation-block">
                    <div className="equation-line">
                      <span className="math-lhs">L<sub>p</sub>(d)</span> = L<sub>w</sub> − 20 log<sub>10</sub>(d) − 11 + A<sub>atm</sub> − ∑ A<sub>mitigation</sub>
                    </div>
                    <div className="equation-subline">
                      Geometric Spreading at {distanceM}m: 20 log₁₀({distanceM}) + 11 = <strong>{results.breakdown?.geometricDecay} dB</strong>
                    </div>
                  </div>
                  <div className="formula-live-calculation">
                    <div className="step-row">
                      <span>Chiller Source Power (Lw):</span>
                      <strong>{results.sourceLw} dBA</strong>
                    </div>
                    <div className="step-row">
                      <span>Nocturnal Atmospheric Inversion:</span>
                      <strong>+{results.breakdown?.inversionEffect} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>Unmitigated Boundary Level:</span>
                      <strong className="text-rose">{results.unmitigatedLp.toFixed(1)} dBA</strong>
                    </div>
                  </div>
                </div>

                <div className="formula-white-card">
                  <div className="formula-card-header">
                    <span className="formula-badge">FORMULA 3</span>
                    <h4>Bio-Acoustic Foliage Scattering & Ground Effect</h4>
                  </div>
                  <div className="math-equation-block">
                    <div className="equation-line">
                      <span className="math-lhs">A<sub>veg</sub></span> = 12 · (1 − e<sup>−(α · d / 10)</sup>) + A<sub>ground</sub>
                    </div>
                    <div className="equation-subline">
                      Species α = {currentTree.acousticAbsorptionCoeff} dB/m ({currentTree.name})
                    </div>
                  </div>
                  <div className="formula-live-calculation">
                    <div className="step-row">
                      <span>Planted Depth:</span>
                      <strong>{treeBufferDepth} meters</strong>
                    </div>
                    <div className="step-row">
                      <span>Porous Soil Humus Bonus:</span>
                      <strong>−{treeBufferDepth >= 10 ? "2.5" : "0.0"} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>Tree Buffer Attenuation:</span>
                      <strong className="text-emerald">−{results.breakdown?.treeAttenuation.toFixed(1)} dB</strong>
                    </div>
                  </div>
                </div>

                <div className="formula-white-card">
                  <div className="formula-card-header">
                    <span className="formula-badge">FORMULA 4</span>
                    <h4>Thermodynamic Scaling & Fan Aerodynamics</h4>
                  </div>
                  <div className="math-equation-block">
                    <div className="equation-line">
                      <span className="math-lhs">Q<sub>thermal</sub></span> ≈ 1.15 · P<sub>IT</sub>, &nbsp; L<sub>w</sub> ∝ 18 log<sub>10</sub>(RPM / RPM<sub>nom</sub>)
                    </div>
                    <div className="equation-subline">
                      Tip speed scales noise by ~50 log₁₀(speed) across 2m axial fan wheels
                    </div>
                  </div>
                  <div className="formula-live-calculation">
                    <div className="step-row">
                      <span>IT Server Compute Load:</span>
                      <strong>{itPowerKw} kW</strong>
                    </div>
                    <div className="step-row">
                      <span>Outdoor Thermal Rejection:</span>
                      <strong>{(itPowerKw * 1.15).toFixed(0)} kW</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>Resulting Source Lw:</span>
                      <strong className="text-indigo">{results.sourceLw} dBA</strong>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: OCTAVE SPECTRUM (ONLY OCTAVE TABLE, ZERO DUPLICATE CONTENT) */}
          {activeTab === "octave" && (
            <div className="min-tab-content-scroll animated-fadeIn">
              <div className="table-wrapper-card">
                <table className="clean-report-table">
                  <thead>
                    <tr>
                      <th>Octave Band</th>
                      <th>Source (Lw)</th>
                      <th>Distance Loss</th>
                      <th>Air Abs.</th>
                      <th>Barrier Loss</th>
                      <th>Tree Loss</th>
                      <th>Receptor (dBL)</th>
                      <th>A-Weighting (dBA)</th>
                      <th>C-Weighting (dBC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {octaveData.map((row) => (
                      <tr key={row.freq} className={row.freq === 125 ? "table-row-highlight" : ""}>
                        <td>
                          <strong>{row.label}</strong>
                          {row.freq === 125 && <span className="tone-indicator">★ 120Hz Compressor Tone</span>}
                        </td>
                        <td>{row.sourceLw.toFixed(1)} dB</td>
                        <td>−{row.geomLoss.toFixed(1)} dB</td>
                        <td>−{row.airLoss.toFixed(1)} dB</td>
                        <td>−{row.wallLoss.toFixed(1)} dB</td>
                        <td>−{row.vegLoss.toFixed(1)} dB</td>
                        <td><strong>{row.unweightedLp.toFixed(1)} dB</strong></td>
                        <td><strong className={row.aWeightedLp > 35 ? "text-rose" : "text-emerald"}>{row.aWeightedLp.toFixed(1)} dBA</strong></td>
                        <td><strong className="text-indigo">{row.cWeightedLp.toFixed(1)} dBC</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="octave-notes-box">
                <p>
                  <strong>Low-Frequency Hum (63 Hz & 125 Hz):</strong> Screw compressors generate tonal energy at 60 Hz and 120 Hz. While A-weighting de-emphasizes this by −16.1 dB to reflect human ear response, low-frequency hum easily penetrates residential windows and vibrates drywall. Monitoring both <strong>dBA</strong> and <strong>dBC</strong> ensures both legal compliance and real-world neighbor comfort.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: THERMODYNAMICS (ONLY 2ND LAW EXPLANATION, ZERO DUPLICATE CONTENT) */}
          {activeTab === "thermo" && (
            <div className="min-tab-content-scroll animated-fadeIn">
              <div className="thermo-card-white">
                <div className="thermo-card-grid">
                  <div className="thermo-col">
                    <h4>The Silicon Heat Rejection Cycle</h4>
                    <p>
                      Every watt of electricity powering servers degrades 100% into thermal heat under the 1st and 2nd Laws of Thermodynamics. To keep server inlet air between 18°C and 27°C (ASHRAE TC 9.9), chilled water loops continuously absorb this heat and pump it to outdoor chillers.
                    </p>
                    <p>
                      Heat cannot spontaneously flow from cool server rooms to hot summer air. Refrigeration compressors must lift this thermal energy and force it into outdoor air, requiring high-pressure compressor stages that generate structural 60/120Hz vibration.
                    </p>
                  </div>
                  <div className="thermo-col">
                    <h4>Why Chillers Must Sit Outdoors</h4>
                    <p>
                      A 50 MW data center requires moving over 500,000 CFM of air across condenser coils. Condenser fans cannot operate inside sealed buildings without asphyxiating the cooling plant in its own exhaust heat.
                    </p>
                    <p>
                      Placing chillers in plain sight near residential boundaries causes noise violations. HushGrid lets engineers position chillers in <strong>building-shielded rear yards</strong>, <strong>semi-bermed basins</strong>, or <strong>subterranean vaults</strong> with evergreen acoustic buffers before breaking ground.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
}
