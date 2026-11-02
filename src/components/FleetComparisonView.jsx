import { useState } from "react";
import { evaluateSiteAcoustics } from "../simulation/acoustics.js";

export default function FleetComparisonView({
  sites,
  selectedSiteId,
  onSelectSite,
  siteConfigs,
  itPowerKw,
  fanSpeedPercent,
}) {
  const [loadShiftActive, setLoadShiftActive] = useState(false);

  // Compute acoustic evaluation for each site
  const siteResults = sites.map((site) => {
    const config = siteConfigs[site.id] || site.defaultChillerConfig;
    // If load shifting is active, Loudoun County throttles load down to 200kW, while Oregon picks it up
    let effectivePower = itPowerKw;
    if (loadShiftActive) {
      if (site.id === "loudoun_va") effectivePower = 180; // throttled for night curfew
      if (site.id === "the_dalles_or") effectivePower = 720; // absorbs AI compute
    }

    const evaluation = evaluateSiteAcoustics({
      itPowerKw: effectivePower,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      distanceToHomesMeters: site.defaultDistanceToHomesMeters,
      municipalNoiseLimitDba: site.municipalNoiseLimitDba,
      terrainEchoDb: site.terrainEchoAmplificationDb,
      chillerPlacement: config.placement,
      wallHeightMeters: config.wallHeightMeters,
      wallMaterial: config.wallMaterial,
      wallEnabled: config.wallEnabled,
      treeBufferDepthMeters: config.treeBufferDepthMeters,
      treeSpeciesId: config.treeSpeciesId,
      treeEnabled: config.treeEnabled,
      chillerOrientationAngle: config.chillerOrientationAngle,
    });

    return {
      site,
      config,
      evaluation,
      effectivePower,
    };
  });

  return (
    <div className="fleet-view-container">
      {/* Fleet Hero & Innovation Showcase */}
      <section className="fleet-hero">
        <div className="fleet-hero-content">
          <span className="eyebrow">GLOBAL DATA CENTER FLEET & COMMUNITY ACOUSTICS</span>
          <h2>Autonomous Fleet Acoustic Orchestration</h2>
          <p>
            Compare real-world data center sites across different microclimates, terrains, and local municipal
            ordinances. Test how architectural placement and bio-acoustic buffering prevent community lawsuits.
          </p>
        </div>

        {/* Load Shifting Innovation Feature */}
        <div className="load-shift-card">
          <div className="load-shift-info">
            <span className="eyebrow">INNOVATION FEATURE</span>
            <h4>🌙 Acoustic "Follow-the-Moon" Workload Balancing</h4>
            <p>
              When Loudoun County enters night noise curfew (10 PM, 45 dBA max), automatically shift non-urgent AI
              workloads to daylight or hydro-powered sites with underground chillers.
            </p>
          </div>
          <button
            className={`load-shift-btn ${loadShiftActive ? "active" : ""}`}
            onClick={() => setLoadShiftActive(!loadShiftActive)}
          >
            {loadShiftActive ? "✓ Night Curfew Load Balancing Active" : "▶ Simulate 10 PM Night Curfew Shifting"}
          </button>
        </div>
      </section>

      {/* Grid of Data Center Sites */}
      <div className="fleet-grid">
        {siteResults.map(({ site, config, evaluation, effectivePower }) => {
          const isSelected = site.id === selectedSiteId;
          return (
            <article
              key={site.id}
              className={`fleet-card ${isSelected ? "selected" : ""}`}
              onClick={() => onSelectSite(site.id)}
            >
              <div className="fleet-card-header">
                <div>
                  <span className="site-region-tag">{site.country}</span>
                  <h3>{site.name}</h3>
                  <small className="site-subtitle">{site.subtitle}</small>
                </div>
                <div
                  className="fleet-status-pill"
                  style={{
                    background: `${evaluation.statusColor}20`,
                    color: evaluation.statusColor,
                    borderColor: `${evaluation.statusColor}50`,
                  }}
                >
                  {evaluation.complianceStatus}
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="fleet-metrics-strip">
                <div>
                  <span>Receptor Noise</span>
                  <strong style={{ color: evaluation.statusColor }}>
                    {evaluation.netReceivedLp.toFixed(1)} <small>dBA</small>
                  </strong>
                </div>
                <div>
                  <span>Legal Limit</span>
                  <strong>
                    {site.municipalNoiseLimitDba} <small>dBA</small>
                  </strong>
                </div>
                <div>
                  <span>Distance to Homes</span>
                  <strong>{site.defaultDistanceToHomesMeters}m</strong>
                </div>
                <div>
                  <span>Ambient Temp</span>
                  <strong>{site.ambientTempC}°C</strong>
                </div>
              </div>

              {/* Site Mitigation Summary */}
              <div className="fleet-config-summary">
                <div className="config-item">
                  <span>Placement:</span>
                  <b>{config.placement === "underground" ? "🛡️ Underground Bunker" : config.placement === "semi_berm" ? "⛰️ Semi-Bermed" : "🏢 Surface Yard"}</b>
                </div>
                <div className="config-item">
                  <span>Acoustic Wall:</span>
                  <b>{config.wallEnabled ? `${config.wallHeightMeters}m Wall` : "None"}</b>
                </div>
                <div className="config-item">
                  <span>Vegetation Buffer:</span>
                  <b>{config.treeEnabled ? `${config.treeBufferDepthMeters}m Native Forest` : "None"}</b>
                </div>
                <div className="config-item">
                  <span>Active IT Load:</span>
                  <b style={{ color: "#38bdf8" }}>{effectivePower} kW</b>
                </div>
              </div>

              <p className="site-desc">{site.description}</p>

              <div className="fleet-card-footer">
                <button
                  className="select-site-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSite(site.id);
                  }}
                >
                  {isSelected ? "Currently Selected in 3D" : "Open 3D Digital Twin →"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
