import { useState } from "react";
import { DATA_CENTER_SITES } from "../simulation/datacenterSites.js";

export default function LandingPage({ onSelectSite, onNavigateToTwin }) {
  const [activeStep, setActiveStep] = useState(1);

  const steps = [
    {
      id: 1,
      tag: "STAGE 01",
      title: "Silicon Heat Generation & Compute Workload",
      icon: "⚡",
      metric: "500 kW - 50 MW IT Load",
      summary:
        "High-density server racks and AI compute clusters generate massive heat inside the data hall. Every watt of compute electricity is converted directly into thermal energy that must be extracted.",
      physicsDetail:
        "ASHRAE TC 9.9 thermal standards require cold-aisle air at 18°C - 27°C. Chilled water loops (7°C supply / 12°C return) circulate through server rows and pump the heat load to the outdoor mechanical plant.",
      formula: "Q_{thermal} = P_{IT} + P_{fans} \\approx 1.15 \\times P_{IT}",
      badge: "Heat Source Core",
    },
    {
      id: 2,
      tag: "STAGE 02",
      title: "Cooling Plant Acoustic Emission",
      icon: "🌪️",
      metric: "108 - 114 dBA Sound Power (Lw)",
      summary:
        "Outdoor air-cooled chillers and condenser fans reject heat into the atmosphere. Twin-screw compressors emit low-frequency 60Hz/120Hz structural drones, while axial fans spin at 1200+ RPM emitting turbulent air roar.",
      physicsDetail:
        "Sound power scales with compressor lift and the 5th power of fan tip speed (Lw ~ 50 log10(RPM)). In hot climates (115°F in Phoenix), chillers run at 100% duty, maximizing community sound emission.",
      formula: "L_w = 108.0 + \\Delta T_{ambient} + 18\\log_{10}(RPM / RPM_{nom}) + 10\\log_{10}(P_{IT}/500)",
      badge: "Acoustic Noise Origin",
    },
    {
      id: 3,
      tag: "STAGE 03",
      title: "Spatial AeroAcoustic Propagation Engine",
      icon: "📐",
      metric: "ISO 9613-2 Hemispherical Decay",
      summary:
        "Sound pressure spreads outward across the surrounding terrain. Geographic microclimates, canyon echo reflections (such as Columbia River Gorge basalt cliffs), and atmospheric absorption dictate attenuation.",
      physicsDetail:
        "Hemispherical spreading reduces sound by -6 dB per doubling of distance (20 log10(d) + 11). However, low frequencies (60Hz hum) suffer far less air absorption, propagating over 600m into residential bedrooms.",
      formula: "L_p(d) = L_w - 20\\log_{10}(d) - 11 + A_{terrain} - A_{atm}",
      badge: "Physics Solver",
    },
    {
      id: 4,
      tag: "STAGE 04",
      title: "Multi-Layer Spatial Mitigations Sandbox",
      icon: "🛡️",
      metric: "-10 to -35 dBA Attenuation",
      summary:
        "HushGrid simulates 3 distinct engineering mitigation layers before breaking ground: Subterranean Chiller Vaulting (-28 dB), Maekawa Absorptive Barrier Walls (-18 dB), and Native Regional Bio-Buffers (-12 dB).",
      physicsDetail:
        "Maekawa diffraction calculates knife-edge insertion loss (N = 2δ/λ). NRC 0.95 absorptive metal prevents yard reflections, while regional evergreen needles scatter acoustic energy without irrigation.",
      formula: "A_{barrier} = 10\\log_{10}(3 + 20N) + NRC_{bonus}, \\quad A_{veg} = 12(1 - e^{-\\alpha \\cdot d / 10})",
      badge: "Active Countermeasures",
    },
    {
      id: 5,
      tag: "STAGE 05",
      title: "Community Receptor Compliance & Telemetry",
      icon: "🏡",
      metric: "≤ 45 dBA Municipal Limit",
      summary:
        "Calculates net received dBA and low-frequency dBC at the nearest residential property line (250m - 600m). Drives the Web Audio Ear Simulator and coordinates autonomous follow-the-moon nocturnal load shifting.",
      physicsDetail:
        "Ensures zero sleep disruption and full zoning compliance with Loudoun County and EU Environmental Noise Directives. If local night curfew approaches, workload automatically shifts across global time zones.",
      formula: "Margin = L_{municipal\\_limit} - L_{net\\_received} \\ge 0 \\implies COMPLIANT",
      badge: "Zoning & Compliance",
    },
  ];

  return (
    <div className="landing-page">
      {/* Hero Banner */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="sparkle-icon">✨</span>
            <span>NEXT-GENERATION SPATIAL COMPUTING & ACOUSTIC ENGINEERING</span>
          </div>
          <h1 className="hero-headline">
            Eliminating Data Center <span className="highlight-gradient">Community Noise</span> Through Spatial Digital Twins
          </h1>
          <p className="hero-subtext">
            Hyperscale cooling plants emit continuous <strong>95–114 dBA</strong> mechanical drones that violate suburban
            nighttime noise ordinances (<strong>≤ 40–45 dBA</strong>). HushGrid simulates architectural placements,
            subterranean bunker vaults, high-NRC barrier walls, and native evergreen bio-buffers before and after construction.
          </p>

          <div className="hero-cta-group">
            <button className="primary-cta-btn" onClick={() => onNavigateToTwin("loudoun_va")}>
              <span className="btn-icon">🧊</span>
              <span>Launch Selected Site 3D Twin</span>
              <span className="btn-arrow">→</span>
            </button>
            <a href="#how-it-works-map" className="secondary-cta-btn">
              <span className="btn-icon">🗺️</span>
              <span>Explore How It Works Map</span>
            </a>
          </div>

          <div className="hero-stats-ribbon">
            <div className="stat-item">
              <span className="stat-number">4+</span>
              <span className="stat-label">Satellite-Grounded Real Sites</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">ISO 9613-2</span>
              <span className="stat-label">Acoustic Propagation Standard</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">-35 dBA</span>
              <span className="stat-label">Maximum Multi-Layer Attenuation</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">60Hz / 120Hz</span>
              <span className="stat-label">Real-Time Web Audio Synthesizer</span>
            </div>
          </div>
        </div>
      </section>

      {/* System Architecture Map: How It Works */}
      <section id="how-it-works-map" className="how-it-works-section">
        <div className="section-title-wrap">
          <span className="eyebrow-pill">INTERACTIVE ARCHITECTURE MAP</span>
          <h2>How HushGrid Works: End-to-End Acoustic Pipeline</h2>
          <p>
            Trace the complete acoustic link budget from silicon server chips inside the data hall to the neighbor’s
            front porch. Click any stage to inspect the underlying physics formulas and real-world parameters.
          </p>
        </div>

        {/* The Visual Pipeline Roadmap */}
        <div className="pipeline-map-flow">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`pipeline-card ${activeStep === step.id ? "active-step" : ""}`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="card-top">
                <span className="step-tag">{step.tag}</span>
                <span className="step-icon">{step.icon}</span>
              </div>
              <h3 className="step-title">{step.title}</h3>
              <div className="step-metric-pill">{step.metric}</div>
              <div className="step-status-indicator">
                <span className="indicator-dot"></span>
                <span>{step.badge}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className="flow-arrow-connector">
                  <span>➔</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected Stage Detail Drawer */}
        <div className="active-stage-inspector">
          {(() => {
            const current = steps.find((s) => s.id === activeStep) || steps[0];
            return (
              <div className="stage-detail-grid">
                <div className="stage-detail-left">
                  <div className="stage-header-row">
                    <span className="stage-large-icon">{current.icon}</span>
                    <div>
                      <span className="stage-tag-badge">{current.tag} · {current.badge}</span>
                      <h3>{current.title}</h3>
                      <span className="stage-metric-highlight">{current.metric}</span>
                    </div>
                  </div>
                  <p className="stage-summary-text">{current.summary}</p>
                  <p className="stage-physics-text">
                    <strong>Engineering Physics:</strong> {current.physicsDetail}
                  </p>
                </div>
                <div className="stage-detail-right">
                  <div className="formula-box">
                    <span className="formula-header">GOVERNING MATHEMATICAL MODEL</span>
                    <code className="formula-code">{current.formula}</code>
                  </div>
                  <div className="stage-actions">
                    <button
                      className="stage-test-btn"
                      onClick={() => onNavigateToTwin("loudoun_va")}
                    >
                      Test in 3D Site Twin ↗
                    </button>
                    <span className="stage-hint">Select different stages above to explore each layer</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="features-showcase-section">
        <div className="section-title-wrap">
          <span className="eyebrow-pill">ENGINEERING INNOVATIONS</span>
          <h2>Core Prototype Features & Spatial Capabilities</h2>
          <p>
            Experience an unprecedented level of spatial interaction, decibel transparency, and Stark-inspired 3D visualization.
          </p>
        </div>

        <div className="features-grid">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🧊</div>
            <h3>3D Site Twin Matching Satellite Imagery</h3>
            <p>
              Accurate 3D geometry grounded in verified Google Maps coordinates. Inspect realistic tilt-up concrete
              walls, 400-ton V-bank chillers, and residential property boundaries across Loudoun County, Phoenix,
              Columbia Gorge, and Dublin.
            </p>
            <div className="feature-pill">Real-World Coordinates Grounded</div>
          </div>

          {/* Feature 2 */}
          <div className="feature-card highlighted-feature">
            <div className="feature-icon-wrapper">🎯</div>
            <h3>Concentric Noise Circles (dBA Isophones)</h3>
            <p>
              Dynamic concentric contour rings (75, 65, 55, 45, 40 dBA) painted on the terrain radiating outward
              from the chiller plant. Applying barrier walls or subterranean vaults physically contracts the rings
              in real time.
            </p>
            <div className="feature-pill highlight-pill">Real-Time ISO 9613-2 Physics</div>
          </div>

          {/* Feature 3 */}
          <div className="feature-card highlighted-feature">
            <div className="feature-icon-wrapper">📍</div>
            <h3>Interactive Noise Pointer & Spatial Probe</h3>
            <p>
              Click or drag the holographic sound probe anywhere on the 3D ground. Immediately read out the exact
              distance from the cooling plant and the calculated sound pressure level (dBA and low-frequency dBC).
            </p>
            <div className="feature-pill highlight-pill">Freeform Terrain Sampling</div>
          </div>

          {/* Feature 4 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🦾</div>
            <h3>Iron Man Exploded View ("Stark Mode")</h3>
            <p>
              Engage the holographic disassembly slider to lift the data center roof, expand exterior concrete walls,
              and explode V-bank chiller components into floating Stark-style subassemblies with internal server halls.
            </p>
            <div className="feature-pill">Holographic Stark Disassembly</div>
          </div>

          {/* Feature 5 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🏗️</div>
            <h3>3D Drag-and-Drop Object Placement</h3>
            <p>
              Freely move chillers, position modular acoustic barrier walls, adjust wall heights from 2m to 16m, and
              plant species-specific evergreen tree screens to observe instant acoustic attenuation in 3D.
            </p>
            <div className="feature-pill">Interactive Spatial Layout</div>
          </div>

          {/* Feature 6 */}
          <div className="feature-card">
            <div className="feature-icon-wrapper">🎧</div>
            <h3>Live Web Audio Ear Simulator</h3>
            <p>
              Listen to the actual noise level at the residential property line. Synthesizes 60Hz/120Hz twin-screw
              compressor hum and turbulent airflow roar with volume calibrated to the calculated decibels.
            </p>
            <div className="feature-pill">Harmonic Web Audio Engine</div>
          </div>
        </div>
      </section>

      {/* Geographic Sites Quick Launch */}
      <section className="sites-gallery-section">
        <div className="section-title-wrap">
          <span className="eyebrow-pill">GLOBAL DATA CENTER FLEET</span>
          <h2>Select a Real-World Facility to Simulate</h2>
          <p>
            Each location presents unique microclimates, ambient temperature penalties, terrain echoes, and strict
            zoning noise limits.
          </p>
        </div>

        <div className="sites-gallery-grid">
          {DATA_CENTER_SITES.map((site) => (
            <div key={site.id} className="site-gallery-card">
              <div className="site-card-header">
                <span className="site-country-tag">{site.country}</span>
                <span className="site-terrain-tag">{site.terrainLabel}</span>
              </div>
              <h3 className="site-card-title">{site.name}</h3>
              <p className="site-card-facility">{site.realFacilityName || "Hyperscale Facility"}</p>
              <p className="site-card-desc">{site.description}</p>
              <div className="site-card-meta">
                <div className="meta-row">
                  <span>Distance to Homes:</span>
                  <strong>{site.defaultDistanceToHomesMeters}m</strong>
                </div>
                <div className="meta-row">
                  <span>Nighttime Limit:</span>
                  <strong>{site.municipalNoiseLimitDba} dBA</strong>
                </div>
                <div className="meta-row">
                  <span>Ambient Outdoor Temp:</span>
                  <strong>{site.ambientTempC}°C</strong>
                </div>
              </div>
              <button
                className="site-launch-btn"
                onClick={() => {
                  onSelectSite(site.id);
                  onNavigateToTwin(site.id);
                }}
              >
                Launch 3D Twin for {site.name} →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
