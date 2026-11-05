import { useState } from "react";

export default function LandingPage({ onSelectSite, onNavigateToTwin }) {
  const [activeStep, setActiveStep] = useState(1);
  const [activeTabSolution, setActiveTabSolution] = useState("solution"); // "problem" | "solution"

  const steps = [
    {
      id: 1,
      tag: "STAGE 01",
      title: "Silicon Heat Generation & Compute Workload",
      icon: "⚡",
      metric: "500 kW – 50 MW IT Load",
      summary:
        "High-density server racks and AI compute clusters convert 100% of their electrical power directly into thermal energy that must be extracted from the data hall.",
      physicsDetail:
        "ASHRAE TC 9.9 thermal standards require cold-aisle air at 18°C – 27°C. Chilled water loops (7°C supply / 12°C return) circulate through server rows and pump the heat load to the outdoor mechanical cooling plant.",
      formulaDisplay: (
        <div className="math-display">
          <span className="math-var">Q<sub>thermal</sub></span> ={" "}
          <span className="math-var">P<sub>IT</sub></span> +{" "}
          <span className="math-var">P<sub>fans</sub></span> ≈{" "}
          <span className="math-num">1.15</span> ×{" "}
          <span className="math-var">P<sub>IT</sub></span>
        </div>
      ),
      formulaDesc: "Total facility thermal heat rejection directly scales with internal compute load.",
      badge: "Heat Source Core",
    },
    {
      id: 2,
      tag: "STAGE 02",
      title: "Cooling Plant Acoustic Emission",
      icon: "🌪️",
      metric: "108 – 114 dBA Sound Power (Lw)",
      summary:
        "Outdoor air-cooled chillers and condenser fans reject heat into the atmosphere. Twin-screw compressors emit low-frequency 60Hz/120Hz structural drones, while axial fans spin at 1200+ RPM emitting turbulent air roar.",
      physicsDetail:
        "Sound power scales with compressor lift and the 5th power of fan tip speed (Lw ~ 50 log₁₀(RPM)). In hot climates (115°F in Phoenix), chillers run at 100% duty, maximizing community sound emission.",
      formulaDisplay: (
        <div className="math-display">
          <span className="math-var">L<sub>w</sub></span> ={" "}
          <span className="math-num">108.0</span> +{" "}
          <span className="math-var">ΔT<sub>ambient</sub></span> +{" "}
          <span className="math-num">18</span> log<sub>10</sub>(RPM / RPM<sub>nom</sub>) +{" "}
          <span className="math-num">10</span> log<sub>10</sub>(P<sub>IT</sub> / 500)
        </div>
      ),
      formulaDesc: "Acoustic sound power generated as a function of ambient heat, fan speed, and IT load.",
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
        "Hemispherical spreading reduces sound by -6 dB per doubling of distance. However, low frequencies (60Hz hum) suffer far less air absorption, propagating over 600m into residential bedrooms.",
      formulaDisplay: (
        <div className="math-display">
          <span className="math-var">L<sub>p</sub>(d)</span> ={" "}
          <span className="math-var">L<sub>w</sub></span> −{" "}
          <span className="math-num">20</span> log<sub>10</sub>(d) −{" "}
          <span className="math-num">11</span> +{" "}
          <span className="math-var">A<sub>terrain</sub></span> −{" "}
          <span className="math-var">A<sub>atm</sub></span>
        </div>
      ),
      formulaDesc: "Geometric hemispherical sound decay combined with atmospheric and ground absorption.",
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
      formulaDisplay: (
        <div className="math-display">
          <span className="math-var">A<sub>barrier</sub></span> ={" "}
          <span className="math-num">10</span> log<sub>10</sub>(3 + 20N) + NRC<sub>bonus</sub>
          <span className="math-sep"> · </span>
          <span className="math-var">A<sub>veg</sub></span> ={" "}
          <span className="math-num">12</span>(1 − e<sup>−α·d/10</sup>)
        </div>
      ),
      formulaDesc: "Maekawa diffraction insertion loss and exponential foliage bio-scattering.",
      badge: "Active Countermeasures",
    },
    {
      id: 5,
      tag: "STAGE 05",
      title: "Community Receptor Compliance & Telemetry",
      icon: "🏡",
      metric: "≤ 45 dBA Municipal Limit",
      summary:
        "Calculates net received dBA and low-frequency dBC at the nearest residential property line (250m – 600m). Drives the Web Audio Ear Simulator and coordinates autonomous follow-the-moon nocturnal load shifting.",
      physicsDetail:
        "Ensures zero sleep disruption and full zoning compliance with Loudoun County and EU Environmental Noise Directives. If local night curfew approaches, workload automatically shifts across global time zones.",
      formulaDisplay: (
        <div className="math-display">
          <span className="math-var">Margin</span> ={" "}
          <span className="math-var">L<sub>municipal_limit</sub></span> −{" "}
          <span className="math-var">L<sub>net_received</sub></span> ≥{" "}
          <span className="math-num">0</span> dB ⇒ <span className="math-status">COMPLIANT</span>
        </div>
      ),
      formulaDesc: "Binary compliance determination against local municipal ordinances.",
      badge: "Zoning & Compliance",
    },
  ];

  return (
    <div className="landing-page animated-fadeIn">
      {/* 1. Hero Banner */}
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
            subterranean bunker vaults, high-NRC barrier walls, and native evergreen bio-buffers in 3D.
          </p>

          <div className="hero-cta-group">
            <button className="primary-cta-btn" onClick={() => onNavigateToTwin("loudoun_va")}>
              <span className="btn-icon">🧊</span>
              <span>Open 3D Spatial Twin</span>
              <span className="btn-arrow">→</span>
            </button>
            <a href="#pipeline-section" className="secondary-cta-btn">
              <span className="btn-icon">📐</span>
              <span>Inspect AeroAcoustic Pipeline</span>
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
              <span className="stat-label">Synthesized Web Audio Engine</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem vs Solution Interactive Comparison Card */}
      <section className="problem-solution-section">
        <div className="section-title-wrap">
          <span className="eyebrow-pill">INDUSTRY REALITY</span>
          <h2>The Hyperscale Acoustic Dilemma</h2>
          <p>
            Why standard cooling designs face severe community backlash, and how spatial digital twins solve it.
          </p>
        </div>

        <div className="problem-solution-toggle-bar">
          <button
            className={`toggle-tab ${activeTabSolution === "problem" ? "active danger" : ""}`}
            onClick={() => setActiveTabSolution("problem")}
          >
            ❌ Traditional Unmitigated Architecture
          </button>
          <button
            className={`toggle-tab ${activeTabSolution === "solution" ? "active success" : ""}`}
            onClick={() => setActiveTabSolution("solution")}
          >
            ✅ HushGrid Spatial Twin Mitigated
          </button>
        </div>

        <div className="comparison-card-wrapper">
          {activeTabSolution === "problem" ? (
            <div className="comparison-content-card danger-card animated-fadeIn">
              <div className="card-badge-row">
                <span className="badge danger">62.4 dBA at Property Line · ⚠️ VIOLATION</span>
                <span className="badge-sub">High Risk of Legal Injunctions</span>
              </div>
              <div className="comparison-grid">
                <div className="comp-col">
                  <h4>Mechanical Plant Layout</h4>
                  <p>Rooftop or side-exposed V-bank chillers with zero structural shielding.</p>
                  <ul>
                    <li>1200+ RPM axial fans radiating directly toward suburban homes</li>
                    <li>Twin-screw 60Hz and 120Hz compressors vibrate into structural columns</li>
                    <li>Direct line-of-sight sound propagation across flat topography</li>
                  </ul>
                </div>
                <div className="comp-col">
                  <h4>Community & Financial Fallout</h4>
                  <p>In Loudoun County and Dublin, residents have formed coalitions filing noise injunctions.</p>
                  <ul>
                    <li>Night noise levels exceed 45 dBA by up to 17 dBA</li>
                    <li>Costly emergency retrofits ($3M+ per facility after commissioning)</li>
                    <li>Permit cancellations and delayed commercial operation dates</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="comparison-content-card success-card animated-fadeIn">
              <div className="card-badge-row">
                <span className="badge success">38.2 dBA at Property Line · ✓ COMPLIANT</span>
                <span className="badge-sub">Fully Permitted & Community Aligned</span>
              </div>
              <div className="comparison-grid">
                <div className="comp-col">
                  <h4>Engineered Mitigation Layers</h4>
                  <p>Subterranean vaulting, Maekawa barrier walls, and regional evergreen bio-buffers.</p>
                  <ul>
                    <li>Subterranean excavation (-28 dB) eliminates line-of-sight radiation</li>
                    <li>NRC 0.95 absorptive barrier walls prevent reverberant sound buildup</li>
                    <li>Native pine bio-acoustic screens scatter high-frequency fan turbulence</li>
                  </ul>
                </div>
                <div className="comp-col">
                  <h4>Autonomous Operations & Zero Sleep Disruption</h4>
                  <p>Autonomous coordination with zero impact on resident sleep cycles.</p>
                  <ul>
                    <li>Sleep sanctuary noise level (&lt; 40 dBA inside bedrooms)</li>
                    <li>Follow-the-Moon automated night curfew compute load shifting</li>
                    <li>Verified against real Google Maps satellite geometry before ground-breaking</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Interactive Architecture Pipeline Map */}
      <section id="pipeline-section" className="how-it-works-section">
        <div className="section-title-wrap">
          <span className="eyebrow-pill">END-TO-END ACOUSTIC SOLVER</span>
          <h2>The 5-Stage Physics Pipeline</h2>
          <p>
            Trace acoustic energy from silicon chips inside server racks all the way to the neighbor’s front porch.
            Click any stage to inspect its governing mathematical model.
          </p>
        </div>

        {/* Visual Pipeline Flow */}
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

        {/* Selected Stage Detail Inspector */}
        <div className="active-stage-inspector">
          {(() => {
            const current = steps.find((s) => s.id === activeStep) || steps[0];
            return (
              <div className="stage-detail-grid animated-fadeIn">
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
                    <div className="formula-render">{current.formulaDisplay}</div>
                    <small className="formula-caption">{current.formulaDesc}</small>
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

      {/* 4. Streamlined Call to Action Banner */}
      <section className="landing-bottom-cta">
        <div className="cta-inner-card">
          <div className="cta-text">
            <h2>Ready to Explore the 3D AeroAcoustic Digital Twin?</h2>
            <p>
              Inspect real-world satellite groundings, drag sound probes, adjust barrier walls, and listen to synthesized decibels.
            </p>
          </div>
          <div className="cta-buttons">
            <button className="primary-cta-btn" onClick={() => onNavigateToTwin("loudoun_va")}>
              🧊 Launch 3D Twin Sandbox
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}