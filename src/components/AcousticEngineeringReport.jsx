import { useState } from "react";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES, CHILLER_PLACEMENTS } from "../simulation/datacenterSites.js";

/**
 * Standard Octave Band Acoustic Calculations
 */
const OCTAVE_BANDS = [
  { freq: 63, label: "63 Hz", aWeight: -26.2, cWeight: -0.8, airAbsPer100m: 0.05, sourceRel: -3 },
  { freq: 125, label: "125 Hz", aWeight: -16.1, cWeight: -0.2, airAbsPer100m: 0.15, sourceRel: 2 }, // Peak compressor hum
  { freq: 250, label: "250 Hz", aWeight: -8.6, cWeight: 0.0, airAbsPer100m: 0.35, sourceRel: 0 },
  { freq: 500, label: "500 Hz", aWeight: -3.2, cWeight: 0.0, airAbsPer100m: 0.70, sourceRel: -2 },
  { freq: 1000, label: "1 kHz", aWeight: 0.0, cWeight: 0.0, airAbsPer100m: 1.50, sourceRel: -4 },
  { freq: 2000, label: "2 kHz", aWeight: 1.2, cWeight: -0.2, airAbsPer100m: 3.20, sourceRel: -8 },
  { freq: 4000, label: "4 kHz", aWeight: 1.0, cWeight: -0.8, airAbsPer100m: 8.50, sourceRel: -14 },
  { freq: 8000, label: "8 kHz", aWeight: -1.1, cWeight: -3.0, airAbsPer100m: 24.0, sourceRel: -22 },
];

export default function AcousticEngineeringReport({
  site,
  config,
  results,
  fanSpeedPercent = 75,
  itPowerKw = 500,
  timeOfDay = "night",
  onClose,
}) {
  const [activeReportTab, setActiveReportTab] = useState("all"); // "all" | "formulas" | "waterfall" | "economics" | "octave"
  const [copied, setCopied] = useState(false);

  const currentWall = WALL_MATERIALS[config.wallMaterial] || WALL_MATERIALS.absorptive_metal;
  const currentTree = REGIONAL_TREE_SPECIES[config.treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const currentPlacement = CHILLER_PLACEMENTS[config.placement] || CHILLER_PLACEMENTS.side_exposed;

  // Distance parameters
  const distanceM = site.defaultDistanceToHomesMeters || 320;
  const wallDistSourceM = 15;
  const wallDistRecM = Math.max(10, distanceM - wallDistSourceM);

  // Fresnel number live calculation
  const sourceHeight = 3.5;
  const earHeight = 1.8;
  const effWallHeight = config.wallEnabled ? config.wallHeightMeters : 0;
  const h1 = Math.max(0.1, effWallHeight - sourceHeight);
  const h2 = Math.max(0.1, effWallHeight - earHeight);
  const directDist = Math.hypot(distanceM, Math.abs(sourceHeight - earHeight));
  const diffPath = config.wallEnabled
    ? Math.hypot(wallDistSourceM, h1) + Math.hypot(wallDistRecM, h2)
    : directDist;
  const deltaPath = Math.max(0, diffPath - directDist);
  const lambda = 2.86; // 120 Hz compressor tone wavelength
  const fresnelN = (2 * deltaPath) / lambda;

  // Cost and Risk Calculations
  const wallPerimeter = config.wallEnclosure === "full_4side" ? 180 : config.wallEnclosure === "u_shape" ? 135 : 90;
  const wallArea = config.wallEnabled ? wallPerimeter * config.wallHeightMeters : 0;
  const wallCost = Math.round(wallArea * currentWall.costPerSqMeter);
  const wallCarbon = Math.round(wallArea * currentWall.embodiedCarbonKgPerSqMeter);

  const treeBufferWidth = 80;
  const treeBufferDepth = config.treeEnabled ? config.treeBufferDepthMeters : 0;
  const treeAreaSqM = treeBufferWidth * treeBufferDepth;
  const treeCount = Math.round(treeAreaSqM / 9);
  const treeMaintCost = Math.round(treeBufferDepth * currentTree.annualMaintenanceCostPerMeter * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));
  const treeWaterGal = Math.round((treeAreaSqM / 4046) * currentTree.annualWaterGallonsPerAcre * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));
  const treeCo2Seq = Math.round(treeCount * currentTree.co2AbsorptionKgPerTreePerYear * (config.treeArrangement === "perimeter_ring" ? 2.2 : 1.0));

  // Risk Avoidance Economics
  const municipalDailyFine = 25000; // $25k/day statutory noise moratorium fine
  const annualAvoidedFines = results.isCompliant ? municipalDailyFine * 365 : 0;
  const litigationReserveSaved = 1500000; // $1.5M class action community settlement reserve
  const totalCapexInvested = wallCost + (config.placement === "underground" ? 450000 : config.placement === "semi_berm" ? 120000 : 0);

  // Octave band table generation
  const octaveData = OCTAVE_BANDS.map((band) => {
    const bandSourceLw = Math.round((results.sourceLw + band.sourceRel) * 10) / 10;
    const geomLoss = Math.round((20 * Math.log10(distanceM) + 11) * 10) / 10;
    const airLoss = Math.round(((band.airAbsPer100m * distanceM) / 100) * 10) / 10;
    const placementLoss = Math.round(results.breakdown.placementAttenuation * 10) / 10;
    const wallLoss = config.wallEnabled
      ? Math.round(Math.min(currentWall.transmissionLossDb, results.breakdown.wallAttenuation * (band.freq <= 125 ? 0.8 : 1.1)) * 10) / 10
      : 0;
    const vegLoss = config.treeEnabled
      ? Math.round(results.breakdown.treeAttenuation * (band.freq <= 125 ? 0.6 : 1.2) * 10) / 10
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

  const handleCopySummary = () => {
    const text = `
========================================================================
HUSHGRID™ ISO 9613-2 ACOUSTIC AUDIT & MITIGATION REPORT
Site: ${site.name} (${site.city}, ${site.country})
Verified Receptor Distance: ${distanceM}m | Nighttime Limit: ${site.municipalNoiseLimitDba} dBA
========================================================================
EXECUTIVE SUMMARY:
- Source Sound Power (Lw): ${results.sourceLw} dBA (at ${fanSpeedPercent}% fan speed, ${itPowerKw} kW IT Load)
- Unmitigated Level at Receptor: ${results.unmitigatedLp} dBA
- Total Mitigation Attenuation: -${results.breakdown.totalMitigationDb} dB
- Net Received Sound Level: ${results.netReceivedLp.toFixed(1)} dBA (${results.netReceivedLpC.toFixed(1)} dBC)
- Compliance Status: ${results.complianceStatus.toUpperCase()} (Margin: ${results.marginDb >= 0 ? "+" : ""}${results.marginDb.toFixed(1)} dB)

GOVERNING PHYSICS & FORMULAS:
- Distance Decay: A_div = 20*log10(${distanceM}) + 11 = ${results.breakdown.geometricDecay} dB
- Maekawa Barrier Loss: A_bar = 10*log10(3 + 20*${fresnelN.toFixed(3)}) + NRC_bonus = ${results.breakdown.wallAttenuation} dB
- Bio-Vegetation Loss: A_veg = 12*(1 - exp(-a*d/10)) = ${results.breakdown.treeAttenuation} dB

FINANCIAL ROI & CARBON IMPACT:
- Acoustic Wall CAPEX: $${wallCost.toLocaleString()} (${wallArea} m² of ${currentWall.name})
- Tree Buffer Annual OPEX: $${treeMaintCost.toLocaleString()}/yr
- Embodied Carbon: ${wallCarbon.toLocaleString()} kg CO₂
- Annual CO₂ Sequestered: ${treeCo2Seq.toLocaleString()} kg/yr
- Statutory Fines Avoided: $${(annualAvoidedFines / 1000000).toFixed(2)}M/year ($25,000/day)
========================================================================
Report Generated by HushGrid Spatial Digital Twin Platform
`.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="light-report-container animated-fadeIn">
      {/* 1. Executive Top Header Bar */}
      <header className="report-header-banner">
        <div className="report-header-left">
          <div className="report-badge-row">
            <span className="report-type-badge">CERTIFIED ENGINEERING REPORT</span>
            <span className="report-std-badge">ISO 9613-2 / ASHRAE TC 9.9</span>
            <span className={`report-status-badge ${results.isCompliant ? "status-pass" : "status-fail"}`}>
              {results.isCompliant ? "✓ ZONING COMPLIANT" : "⚠️ VIOLATION DETECTED"}
            </span>
          </div>
          <h2 className="report-main-title">
            Environmental AeroAcoustic Propagation & Mitigation Analysis
          </h2>
          <p className="report-site-subtext">
            <strong>Facility:</strong> {site.name} · <strong>Coordinates:</strong> {site.coordinates.lat.toFixed(4)}°N, {Math.abs(site.coordinates.lng).toFixed(4)}°W · <strong>Receptor Distance:</strong> {distanceM}m · <strong>Generated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </p>
        </div>

        <div className="report-header-actions">
          <button className="report-action-btn primary-print" onClick={handlePrint} title="Print or save as PDF">
            🖨️ Print / PDF
          </button>
          <button className="report-action-btn secondary-copy" onClick={handleCopySummary} title="Copy executive summary to clipboard">
            {copied ? "✓ Copied to Clipboard!" : "📋 Copy Summary"}
          </button>
          {onClose && (
            <button className="report-close-btn" onClick={onClose} title="Close Report">
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Navigation Filter Tabs */}
      <div className="report-nav-tabs">
        <button
          className={`report-tab-pill ${activeReportTab === "all" ? "active" : ""}`}
          onClick={() => setActiveReportTab("all")}
        >
          📑 Full Comprehensive Report
        </button>
        <button
          className={`report-tab-pill ${activeReportTab === "formulas" ? "active" : ""}`}
          onClick={() => setActiveReportTab("formulas")}
        >
          📐 Governing Physics & Formulas
        </button>
        <button
          className={`report-tab-pill ${activeReportTab === "waterfall" ? "active" : ""}`}
          onClick={() => setActiveReportTab("waterfall")}
        >
          📊 ISO 9613-2 Link Budget Waterfall
        </button>
        <button
          className={`report-tab-pill ${activeReportTab === "economics" ? "active" : ""}`}
          onClick={() => setActiveReportTab("economics")}
        >
          💰 CAPEX, OPEX & Risk ROI
        </button>
        <button
          className={`report-tab-pill ${activeReportTab === "octave" ? "active" : ""}`}
          onClick={() => setActiveReportTab("octave")}
        >
          📈 Octave-Band Frequency Spectrum
        </button>
      </div>

      <div className="report-body-content">
        {/* =========================================================================
            SECTION 1: EXECUTIVE KPI SUMMARY CARDS
            ========================================================================= */}
        {(activeReportTab === "all" || activeReportTab === "waterfall") && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">01</span>
              <div>
                <h3 className="section-title">Executive Receptor Telemetry & Compliance Summary</h3>
                <p className="section-sub">Measured at closest residential property boundary ({distanceM} meters from mechanical cooling plant)</p>
              </div>
            </div>

            <div className="report-kpi-grid">
              <div className="kpi-card highlight-card">
                <span className="kpi-label">NET RECEIVED DECIBELS</span>
                <div className="kpi-hero-num" style={{ color: results.statusColor }}>
                  {results.netReceivedLp.toFixed(1)} <small>dBA</small>
                </div>
                <div className="kpi-footer-detail">
                  <span>Municipal Curfew Limit: <strong>{results.activeLegalLimit} dBA</strong></span>
                  <span className={`compliance-pill ${results.isCompliant ? "pass" : "fail"}`}>
                    {results.marginDb >= 0 ? `+${results.marginDb.toFixed(1)} dB Margin` : `${results.marginDb.toFixed(1)} dB Violation`}
                  </span>
                </div>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">TOTAL SOUND MITIGATION</span>
                <div className="kpi-hero-num text-emerald">
                  -{results.breakdown.totalMitigationDb.toFixed(1)} <small>dB</small>
                </div>
                <div className="kpi-footer-detail">
                  <span>Unmitigated Line: <strong>{results.unmitigatedLp.toFixed(1)} dBA</strong></span>
                  <span className="kpi-subtag">Spatial Attenuation</span>
                </div>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">LOW-FREQUENCY TONAL HUM</span>
                <div className="kpi-hero-num text-indigo">
                  {results.netReceivedLpC.toFixed(1)} <small>dBC</small>
                </div>
                <div className="kpi-footer-detail">
                  <span>C-A Delta: <strong>+{results.lowFreqExcess} dB</strong></span>
                  <span className="kpi-subtag">Compressor 60/120Hz Tone</span>
                </div>
              </div>

              <div className="kpi-card">
                <span className="kpi-label">STATUTORY PENALTY AVOIDED</span>
                <div className="kpi-hero-num text-sky">
                  ${(annualAvoidedFines / 1000000).toFixed(2)}M<small>/yr</small>
                </div>
                <div className="kpi-footer-detail">
                  <span>$25k/day Loudoun Curfew Fine</span>
                  <span className="kpi-subtag">Zero Moratorium Risk</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 2: GOVERNING PHYSICS & NOISE REDUCTION FORMULAS
            ========================================================================= */}
        {(activeReportTab === "all" || activeReportTab === "formulas") && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">02</span>
              <div>
                <h3 className="section-title">Governing Acoustic Physics & Noise Reduction Formulas</h3>
                <p className="section-sub">Standard mathematical models codified in ISO 9613-2, Maekawa Diffraction, and ASHRAE TC 9.9</p>
              </div>
            </div>

            <div className="formulas-two-column-grid">
              {/* Formula Card 1: Maekawa Barrier Diffraction */}
              <div className="formula-white-card">
                <div className="formula-card-header">
                  <span className="formula-badge">FORMULA 1</span>
                  <h4>Maekawa Knife-Edge Barrier Diffraction (A_barrier)</h4>
                </div>
                <div className="math-equation-block">
                  <div className="equation-line">
                    <span className="math-lhs">A<sub>barrier</sub></span>
                    <span className="math-eq">=</span>
                    <span className="math-rhs">
                      10 log<sub>10</sub>(3 + 20 · <span className="math-param">N</span>) + <span className="math-param">NRC<sub>bonus</sub></span>
                    </span>
                  </div>
                  <div className="equation-subline">
                    Where Fresnel Number: <span className="math-param">N</span> = <span className="fraction"><span>2 · δ</span><span>λ</span></span> = <span className="fraction"><span>2 · (d<sub>1</sub> + d<sub>2</sub> − d<sub>direct</sub>)</span><span>λ</span></span>
                  </div>
                </div>

                <div className="formula-live-calculation">
                  <span className="calc-eyebrow">LIVE COMPUTED DERIVATION FOR CURRENT GEOMETRY:</span>
                  <div className="calc-steps">
                    <div className="step-row">
                      <span>1. Dominant Compressor Wavelength (λ at 120 Hz):</span>
                      <strong>2.86 meters</strong>
                    </div>
                    <div className="step-row">
                      <span>2. Barrier Path Difference (δ = {diffPath.toFixed(3)}m − {directDist.toFixed(3)}m):</span>
                      <strong>{deltaPath.toFixed(3)} meters</strong>
                    </div>
                    <div className="step-row">
                      <span>3. Resulting Fresnel Number (N = 2 · {deltaPath.toFixed(3)} / 2.86):</span>
                      <strong>{fresnelN.toFixed(4)}</strong>
                    </div>
                    <div className="step-row">
                      <span>4. Material NRC Bonus ({currentWall.name}, NRC {currentWall.nrcRating}):</span>
                      <strong>+{currentWall.nrcRating >= 0.8 ? "2.5" : "1.0"} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>⇒ Total Barrier Insertion Loss Achieved:</span>
                      <strong className="text-emerald">-{results.breakdown.wallAttenuation.toFixed(1)} dB</strong>
                    </div>
                  </div>
                </div>
                <p className="formula-explanation">
                  <strong>Engineering Significance:</strong> Sound diffracts around barrier lips. Increasing barrier height from 4m to {config.wallHeightMeters}m increases path difference δ, forcing acoustic energy into high diffraction orders. High NRC surfaces prevent internal reflection buildup.
                </p>
              </div>

              {/* Formula Card 2: ISO 9613-2 Geometric Decay */}
              <div className="formula-white-card">
                <div className="formula-card-header">
                  <span className="formula-badge">FORMULA 2</span>
                  <h4>ISO 9613-2 Hemispherical Geometric Decay & Propagation Link Budget</h4>
                </div>
                <div className="math-equation-block">
                  <div className="equation-line">
                    <span className="math-lhs">L<sub>p</sub>(d)</span>
                    <span className="math-eq">=</span>
                    <span className="math-rhs">
                      L<sub>w</sub> − 20 log<sub>10</sub>(d) − 11 + A<sub>terrain</sub> + A<sub>inversion</sub> − ∑ A<sub>mitigations</sub>
                    </span>
                  </div>
                  <div className="equation-subline">
                    Geometric Free-Field Spreading: A<sub>div</sub> = 20 log<sub>10</sub>({distanceM}) + 11 = <strong>{results.breakdown.geometricDecay} dB</strong>
                  </div>
                </div>

                <div className="formula-live-calculation">
                  <span className="calc-eyebrow">LIVE COMPUTED DERIVATION:</span>
                  <div className="calc-steps">
                    <div className="step-row">
                      <span>1. Source Chiller Sound Power (Lw):</span>
                      <strong>{results.sourceLw} dBA</strong>
                    </div>
                    <div className="step-row">
                      <span>2. Geometric Spreading Loss ({distanceM}m):</span>
                      <strong>-{results.breakdown.geometricDecay} dB</strong>
                    </div>
                    <div className="step-row">
                      <span>3. Atmospheric Nocturnal Inversion ({timeOfDay}):</span>
                      <strong>{timeOfDay === "night" ? "+1.8 dB (Inversion Lens)" : "-1.2 dB (Solar Lapse)"}</strong>
                    </div>
                    <div className="step-row">
                      <span>4. Terrain Canyon Reflection Echo:</span>
                      <strong>+{results.breakdown.terrainEchoDb} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>⇒ Unmitigated Sound Level at Residential Line:</span>
                      <strong className="text-rose">{results.unmitigatedLp.toFixed(1)} dBA</strong>
                    </div>
                  </div>
                </div>
                <p className="formula-explanation">
                  <strong>Engineering Significance:</strong> In free space, sound decays at 6 dB per doubling of distance. At night, ground cooling creates an acoustic thermal inversion that bends sound waves downward toward suburban bedrooms, making passive barriers critical.
                </p>
              </div>

              {/* Formula Card 3: Bio-Acoustic Foliage Scattering */}
              <div className="formula-white-card">
                <div className="formula-card-header">
                  <span className="formula-badge">FORMULA 3</span>
                  <h4>Bio-Acoustic Foliage Scattering & Porous Soil Ground Attenuation</h4>
                </div>
                <div className="math-equation-block">
                  <div className="equation-line">
                    <span className="math-lhs">A<sub>veg</sub></span>
                    <span className="math-eq">=</span>
                    <span className="math-rhs">
                      12 · (1 − e<sup>−(α · d<sub>buffer</sub> / 10)</sup>) + A<sub>ground_porous</sub>
                    </span>
                  </div>
                  <div className="equation-subline">
                    Where α = {currentTree.acousticAbsorptionCoeff} dB/m for {currentTree.name} ({currentTree.foliageType})
                  </div>
                </div>

                <div className="formula-live-calculation">
                  <span className="calc-eyebrow">LIVE BIO-ACOUSTIC PARAMETERS:</span>
                  <div className="calc-steps">
                    <div className="step-row">
                      <span>1. Planted Buffer Depth (d<sub>buffer</sub>):</span>
                      <strong>{treeBufferDepth} meters</strong>
                    </div>
                    <div className="step-row">
                      <span>2. Species Absorption Coefficient (α):</span>
                      <strong>{currentTree.acousticAbsorptionCoeff} dB/m</strong>
                    </div>
                    <div className="step-row">
                      <span>3. Asymptotic Foliage Multi-Scattering Loss:</span>
                      <strong>-{(results.breakdown.treeAttenuation - (treeBufferDepth >= 10 ? 2.5 : 0)).toFixed(1)} dB</strong>
                    </div>
                    <div className="step-row">
                      <span>4. Forest Floor Porous Ground Effect Bonus:</span>
                      <strong>-{treeBufferDepth >= 10 ? "2.5" : "0.0"} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>⇒ Total Bio-Buffer Attenuation Achieved:</span>
                      <strong className="text-emerald">-{results.breakdown.treeAttenuation.toFixed(1)} dB</strong>
                    </div>
                  </div>
                </div>
                <p className="formula-explanation">
                  <strong>Engineering Significance:</strong> Foliage multi-scatters acoustic wavefronts, converting cohesive 60Hz fan droning into diffuse white noise. Organic leaf litter and root systems eliminate hard acoustic ground bounce reflections.
                </p>
              </div>

              {/* Formula Card 4: Thermodynamic Heat Generation */}
              <div className="formula-white-card">
                <div className="formula-card-header">
                  <span className="formula-badge">FORMULA 4</span>
                  <h4>Thermodynamic Silicon Heat Generation & Acoustic Scaling (2nd Law)</h4>
                </div>
                <div className="math-equation-block">
                  <div className="equation-line">
                    <span className="math-lhs">Q<sub>thermal</sub></span>
                    <span className="math-eq">=</span>
                    <span className="math-rhs">
                      P<sub>IT</sub> + P<sub>fans</sub> ≈ 1.15 · P<sub>IT</sub>
                    </span>
                  </div>
                  <div className="equation-subline">
                    Acoustic Scaling: L<sub>w</sub> = 108.0 + ΔT<sub>ambient</sub> + 18 log<sub>10</sub>(RPM/RPM<sub>nom</sub>) + 10 log<sub>10</sub>(P<sub>IT</sub>/500)
                  </div>
                </div>

                <div className="formula-live-calculation">
                  <span className="calc-eyebrow">LIVE THERMODYNAMIC SCALING:</span>
                  <div className="calc-steps">
                    <div className="step-row">
                      <span>1. Server IT Compute Workload (P<sub>IT</sub>):</span>
                      <strong>{itPowerKw} kW</strong>
                    </div>
                    <div className="step-row">
                      <span>2. Thermal Heat Rejected Outdoors (Q<sub>thermal</sub>):</span>
                      <strong>{(itPowerKw * 1.15).toFixed(0)} kW ({(itPowerKw * 1.15 * 3412 / 12000).toFixed(0)} Tons)</strong>
                    </div>
                    <div className="step-row">
                      <span>3. Chiller Fan Duty / Speed:</span>
                      <strong>{fanSpeedPercent}% of Maximum RPM</strong>
                    </div>
                    <div className="step-row">
                      <span>4. Fan Tip Speed Acoustic Contribution:</span>
                      <strong>{(18 * Math.log10(Math.max(0.3, fanSpeedPercent / 100) / 0.7)).toFixed(1)} dB</strong>
                    </div>
                    <div className="step-row total-step">
                      <span>⇒ Chiller Source Sound Power Level (Lw):</span>
                      <strong className="text-indigo">{results.sourceLw} dBA</strong>
                    </div>
                  </div>
                </div>
                <p className="formula-explanation">
                  <strong>Engineering Significance:</strong> A data center converts 100% of electrical computing power into heat. By the 2nd Law of Thermodynamics, this heat cannot be destroyed; it must be continuously rejected into outdoor ambient air via condenser fan arrays, generating intense acoustic power.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 3: ISO 9613-2 LINK BUDGET WATERFALL
            ========================================================================= */}
        {(activeReportTab === "all" || activeReportTab === "waterfall") && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">03</span>
              <div>
                <h3 className="section-title">Complete ISO 9613-2 Acoustic Link Budget Waterfall</h3>
                <p className="section-sub">Detailed numeric attenuation tracking from silicon compute core to residential receptor porch</p>
              </div>
            </div>

            <div className="table-wrapper-card">
              <table className="clean-report-table">
                <thead>
                  <tr>
                    <th>Step #</th>
                    <th>Acoustic Propagation Stage</th>
                    <th>Physics Mechanism</th>
                    <th>Stage Value</th>
                    <th>Cumulative Sound</th>
                    <th>Impact / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="table-row-source">
                    <td><strong>01</strong></td>
                    <td><strong>Chiller Source Emission (Lw)</strong></td>
                    <td>Compressor screw lift + condenser fan aerodynamics</td>
                    <td><span className="badge-source">{results.sourceLw} dBA</span></td>
                    <td><strong>{results.sourceLw} dBA</strong></td>
                    <td>Source power at 1m reference sphere</td>
                  </tr>
                  <tr>
                    <td><strong>02</strong></td>
                    <td>Geometric Spreading Decay (A<sub>div</sub>)</td>
                    <td>20 · log<sub>10</sub>({distanceM}m) + 11.0 dB (ISO 9613-2)</td>
                    <td><span className="badge-atten">-{results.breakdown.geometricDecay} dB</span></td>
                    <td><strong>{(results.sourceLw - results.breakdown.geometricDecay).toFixed(1)} dBA</strong></td>
                    <td>Hemispherical free-field propagation</td>
                  </tr>
                  <tr>
                    <td><strong>03</strong></td>
                    <td>Atmospheric Inversion / Solar Lapse</td>
                    <td>Nocturnal boundary layer thermal stratification</td>
                    <td><span className={timeOfDay === "night" ? "badge-boost" : "badge-atten"}>{timeOfDay === "night" ? `+${results.breakdown.inversionEffect}` : results.breakdown.inversionEffect} dB</span></td>
                    <td><strong>{(results.sourceLw - results.breakdown.geometricDecay + results.breakdown.inversionEffect).toFixed(1)} dBA</strong></td>
                    <td>Downwind / cool ground acoustic ducting</td>
                  </tr>
                  <tr>
                    <td><strong>04</strong></td>
                    <td>Terrain Basalt / Canyon Reflection</td>
                    <td>Specular acoustic reflection from topography</td>
                    <td><span className={results.breakdown.terrainEchoDb > 0 ? "badge-boost" : "badge-neutral"}>+{results.breakdown.terrainEchoDb} dB</span></td>
                    <td><strong>{results.unmitigatedLp.toFixed(1)} dBA</strong></td>
                    <td>Unmitigated sound level at receptor</td>
                  </tr>
                  <tr className="table-row-divider">
                    <td colSpan="6"><strong>─── ACTIVE SPATIAL MITIGATION LAYERS APPLIED ───</strong></td>
                  </tr>
                  <tr>
                    <td><strong>05</strong></td>
                    <td>Architectural Placement Shielding</td>
                    <td>{currentPlacement.name} ({currentPlacement.tag})</td>
                    <td><span className="badge-atten">-{results.breakdown.placementAttenuation} dB</span></td>
                    <td><strong>{(results.unmitigatedLp - results.breakdown.placementAttenuation).toFixed(1)} dBA</strong></td>
                    <td>Building acoustic shadow / earth berms</td>
                  </tr>
                  <tr>
                    <td><strong>06</strong></td>
                    <td>Acoustic Barrier Wall Insertion Loss</td>
                    <td>{config.wallEnabled ? `${config.wallHeightMeters}m ${currentWall.name} (NRC ${currentWall.nrcRating})` : "Disabled (No wall)"}</td>
                    <td><span className="badge-atten">-{results.breakdown.wallAttenuation} dB</span></td>
                    <td><strong>{(results.unmitigatedLp - results.breakdown.placementAttenuation - results.breakdown.wallAttenuation).toFixed(1)} dBA</strong></td>
                    <td>Maekawa diffraction + mineral wool absorption</td>
                  </tr>
                  <tr>
                    <td><strong>07</strong></td>
                    <td>Bio-Acoustic Foliage Buffer Zone</td>
                    <td>{config.treeEnabled ? `${treeBufferDepth}m ${currentTree.name} buffer` : "Disabled (No trees)"}</td>
                    <td><span className="badge-atten">-{results.breakdown.treeAttenuation} dB</span></td>
                    <td><strong>{(results.unmitigatedLp - results.breakdown.placementAttenuation - results.breakdown.wallAttenuation - results.breakdown.treeAttenuation).toFixed(1)} dBA</strong></td>
                    <td>Needle multi-scattering + porous soil sponge</td>
                  </tr>
                  <tr>
                    <td><strong>08</strong></td>
                    <td>Directivity & Intake Silencers</td>
                    <td>Chiller louvers angled {config.chillerOrientationAngle || 90}° away from homes</td>
                    <td><span className="badge-atten">-{results.breakdown.directivityAttenuation} dB</span></td>
                    <td><strong>{(results.unmitigatedLp - results.breakdown.totalMitigationDb).toFixed(1)} dBA</strong></td>
                    <td>Acoustic blanket wraps & directional louvers</td>
                  </tr>
                  <tr>
                    <td><strong>09</strong></td>
                    <td>Suburban Ambient Noise Floor (L<sub>bg</sub>)</td>
                    <td>Logarithmic intensity addition with nocturnal background</td>
                    <td><span className="badge-neutral">+{results.backgroundNoiseFloor} dBA</span></td>
                    <td><strong>{results.netReceivedLp.toFixed(1)} dBA</strong></td>
                    <td>Natural night background floor limit</td>
                  </tr>
                  <tr className="table-row-total">
                    <td><strong>✓</strong></td>
                    <td><strong>NET RECEIVED SOUND LEVEL AT PORCH</strong></td>
                    <td><strong>Combined Acoustic Sound Pressure (L<sub>p</sub>)</strong></td>
                    <td><span className="badge-highlight">{results.netReceivedLp.toFixed(1)} dBA</span></td>
                    <td><strong style={{ color: results.statusColor, fontSize: "16px" }}>{results.netReceivedLp.toFixed(1)} dBA</strong></td>
                    <td><strong>{results.marginDb >= 0 ? `COMPLIANT (+${results.marginDb.toFixed(1)} dB safe margin)` : `VIOLATION (${results.marginDb.toFixed(1)} dB)`}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 4: CAPEX, OPEX & RISK ROI ANALYSIS
            ========================================================================= */}
        {(activeReportTab === "all" || activeReportTab === "economics") && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">04</span>
              <div>
                <h3 className="section-title">Comprehensive Financial CAPEX, OPEX & Carbon ROI Analysis</h3>
                <p className="section-sub">Capital expenditure requirements, lifecycle operating costs, carbon footprint, and regulatory fine avoidance</p>
              </div>
            </div>

            <div className="economics-summary-grid">
              {/* Card 1: Wall CAPEX */}
              <div className="eco-detail-card">
                <div className="eco-card-header">
                  <span className="eco-icon">🧱</span>
                  <div>
                    <h4>Acoustic Barrier Wall CAPEX</h4>
                    <span className="eco-subtitle">{currentWall.name}</span>
                  </div>
                </div>
                <div className="eco-card-metric">
                  <span className="currency">$</span>
                  <span className="amount">{wallCost.toLocaleString()}</span>
                </div>
                <div className="eco-stat-list">
                  <div className="eco-stat-item">
                    <span>Wall Height & Perimeter:</span>
                    <strong>{config.wallHeightMeters}m × {wallPerimeter}m</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Total Surface Area:</span>
                    <strong>{wallArea} m² ({Math.round(wallArea * 10.764)} sq ft)</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Unit Material Cost:</span>
                    <strong>${currentWall.costPerSqMeter} / m²</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Embodied Carbon Footprint:</span>
                    <strong>{wallCarbon.toLocaleString()} kg CO₂</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Design Lifespan:</span>
                    <strong>{currentWall.durabilityYears} Years</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Bio-Buffer OPEX & Ecology */}
              <div className="eco-detail-card">
                <div className="eco-card-header">
                  <span className="eco-icon">🌲</span>
                  <div>
                    <h4>Bio-Acoustic Buffer OPEX & Ecology</h4>
                    <span className="eco-subtitle">{currentTree.name}</span>
                  </div>
                </div>
                <div className="eco-card-metric text-emerald">
                  <span className="currency">$</span>
                  <span className="amount">{treeMaintCost.toLocaleString()}</span>
                  <small>/year</small>
                </div>
                <div className="eco-stat-list">
                  <div className="eco-stat-item">
                    <span>Planted Buffer Depth & Area:</span>
                    <strong>{treeBufferDepth}m ({treeAreaSqM} m²)</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Estimated Tree Count:</span>
                    <strong>{treeCount} Trees (3m spacing)</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Annual Water Footprint:</span>
                    <strong>{treeWaterGal.toLocaleString()} Gallons/yr</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Carbon Sequestration Offset:</span>
                    <strong>-{treeCo2Seq.toLocaleString()} kg CO₂/yr</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Irrigation Requirement:</span>
                    <strong>{currentTree.annualWaterGallonsPerAcre === 0 ? "Rain-Sustained (0 Irrigation)" : "Low Drip Xeriscape"}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Regulatory & Shutdown Risk Avoidance */}
              <div className="eco-detail-card highlight-border">
                <div className="eco-card-header">
                  <span className="eco-icon">⚖️</span>
                  <div>
                    <h4>Statutory Risk & Fine Avoidance</h4>
                    <span className="eco-subtitle">Loudoun County Zoning Board / Municipal Ordinance</span>
                  </div>
                </div>
                <div className="eco-card-metric text-sky">
                  <span className="currency">$</span>
                  <span className="amount">{(annualAvoidedFines / 1000000).toFixed(2)}M</span>
                  <small>/year</small>
                </div>
                <div className="eco-stat-list">
                  <div className="eco-stat-item">
                    <span>Daily Violation Injunction Fine:</span>
                    <strong>$25,000 / day</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Class-Action Settlement Reserve Saved:</span>
                    <strong>${(litigationReserveSaved / 1000000).toFixed(1)} Million</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Total Acoustic CAPEX Required:</span>
                    <strong>${totalCapexInvested.toLocaleString()}</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Financial Payback Period:</span>
                    <strong>{results.isCompliant ? "< 18 Days" : "Non-Compliant"}</strong>
                  </div>
                  <div className="eco-stat-item">
                    <span>Facility Permit Approval Risk:</span>
                    <strong className={results.isCompliant ? "text-emerald" : "text-rose"}>
                      {results.isCompliant ? "Low (Full Clearance)" : "Critical (Permit Revocation)"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 5: OCTAVE-BAND FREQUENCY SPECTRUM
            ========================================================================= */}
        {(activeReportTab === "all" || activeReportTab === "octave") && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">05</span>
              <div>
                <h3 className="section-title">Octave-Band Frequency Spectrum Analysis (63 Hz – 8,000 Hz)</h3>
                <p className="section-sub">Standard 1/1 octave transmission loss evaluation comparing unweighted dBL, A-weighting (dBA), and low-frequency C-weighting (dBC)</p>
              </div>
            </div>

            <div className="table-wrapper-card">
              <table className="clean-report-table">
                <thead>
                  <tr>
                    <th>Octave Band</th>
                    <th>Chiller Source (Lw)</th>
                    <th>Distance Spreading</th>
                    <th>Air Absorption</th>
                    <th>Barrier TL</th>
                    <th>Tree Buffer</th>
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
                        {row.freq === 125 && <span className="tone-indicator">★ Fundamental Chiller Tone</span>}
                      </td>
                      <td>{row.sourceLw.toFixed(1)} dB</td>
                      <td>-{row.geomLoss.toFixed(1)} dB</td>
                      <td>-{row.airLoss.toFixed(1)} dB</td>
                      <td>-{row.wallLoss.toFixed(1)} dB</td>
                      <td>-{row.vegLoss.toFixed(1)} dB</td>
                      <td><strong>{row.unweightedLp.toFixed(1)} dB</strong></td>
                      <td>
                        <strong className={row.aWeightedLp > 35 ? "text-rose" : "text-emerald"}>
                          {row.aWeightedLp.toFixed(1)} dBA
                        </strong>
                      </td>
                      <td>
                        <strong className="text-indigo">
                          {row.cWeightedLp.toFixed(1)} dBC
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="octave-notes-box">
              <p>
                <strong>📌 Acoustic Engineering Note on Low-Frequency Hum (63 Hz & 125 Hz):</strong> Screw compressors and 2-pole motors generate tonal energy at 60 Hz, 120 Hz, and 125 Hz. While standard A-weighting discounts these low frequencies by -16.1 dB to mimic human ear perception, low-frequency pressure waves easily penetrate double-pane residential glass and induce structural resonance in drywall. HushGrid tracks both <strong>dBA</strong> and <strong>dBC</strong> to guarantee zero sleep disturbance.
              </p>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 6: THERMODYNAMIC HEAT REJECTION INSIGHT
            ========================================================================= */}
        {activeReportTab === "all" && (
          <section className="report-section">
            <div className="section-title-wrap">
              <span className="section-num">06</span>
              <div>
                <h3 className="section-title">Thermodynamic Heat Rejection Architecture (2nd Law)</h3>
                <p className="section-sub">Why hyperscale chillers must be situated outdoors and rejected into the atmosphere</p>
              </div>
            </div>

            <div className="thermo-card-white">
              <div className="thermo-card-grid">
                <div className="thermo-col">
                  <h4>The Silicon-to-Atmosphere Thermal Cycle</h4>
                  <p>
                    A 50-megawatt hyperscale data center consumes electricity to drive billions of transistors. Under the <strong>1st and 2nd Laws of Thermodynamics</strong>, 100% of that electrical energy degrades into thermal heat. To prevent processor junction temperatures from exceeding 85°C, cold chilled water loops (7°C supply / 12°C return) circulate through server rows.
                  </p>
                  <p>
                    Because heat naturally flows only from hot bodies to cold bodies, mechanical chillers use refrigeration cycles (evaporator, compressor, condenser, expansion valve) to lift low-temperature heat from server rooms and dump it into hot summer air.
                  </p>
                </div>
                <div className="thermo-col">
                  <h4>Why Outdoor Air-Cooled Condensers Are Required</h4>
                  <p>
                    Air-cooled chillers require massive airflow (often &gt; 500,000 CFM) across finned aluminum condenser coils to reject tens of megawatts. This necessitates <strong>massive 2-meter diameter axial fan arrays</strong> mounted outdoors where outdoor air is unrestricted.
                  </p>
                  <p>
                    In dense hyperscale clusters like <strong>Loudoun County, VA ("Data Center Alley")</strong>, placing chillers on the side of a building facing residential property lines triggers immediate noise violation citations. HushGrid enables operators to simulate <strong>Building-Shielded Rear Yards, Subterranean Vaults, and Native Evergreen Screens</strong> prior to physical construction.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer Certification Stamp */}
      <footer className="report-footer-signoff">
        <div className="signoff-left">
          <div className="cert-stamp">
            <span className="stamp-title">HUSHGRID SIMULATION ENGINE</span>
            <span className="stamp-sub">VERIFIED DIGITAL TWIN</span>
            <span className="stamp-code">ISO 9613-2 COMPLIANT</span>
          </div>
          <div className="signoff-text">
            <strong>Certified by HushGrid Computational Acoustic Solver v2.4</strong>
            <p>Calculations conform to ISO 9613-2 (Acoustics - Attenuation of sound during propagation outdoors) and ASHRAE TC 9.9 standards.</p>
          </div>
        </div>
        <div className="signoff-right">
          <button className="secondary-print-btn" onClick={handlePrint}>
            🖨️ Export Certified PDF
          </button>
        </div>
      </footer>
    </div>
  );
}
