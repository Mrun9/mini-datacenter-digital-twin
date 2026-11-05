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
    // If load shifting is active, Loudoun County throttles load down to 180kW, while Oregon absorbs it
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
    <div className="fleet-view-container animated-fadeIn">
      {/* Fleet Hero & Innovation Showcase */}
      <section className="fleet-hero">
        <div className="fleet-hero-content">
          <span className="eyebrow">GLOBAL DATA CENTER FLEET & COMMUNITY ACOUSTICS</span>
          <h2>Autonomous Fleet Acoustic Orchestration</h2>
          <p>
            Compare real-world data center sites across different microclimates, terrains, and local municipal
            ordinances. Test how architectural placement and bio-acoustic buffering prevent community noise violations.
          </p>
        </div>

        {/* Load Shifting Innovation Feature */}
        <div className="load-shift-card">
          <div className="load-shift-info">
            <span className="eyebrow">AUTONOMOUS ORCHESTRATION</span>
            <h4>🌙 Acoustic "Follow-the-Moon" Workload Balancing</h4>
            <p>
              When Loudoun County enters night noise curfew (10 PM, 45 dBA max), automatically throttle local compute
              and shift workloads to daylight or hydro-powered sites with underground chillers.
            </p>
          </div>
          <button
            className={`load-shift-btn ${loadShiftActive ? "active" : ""}`}
            onClick={() => setLoadShiftActive(!loadShiftActive)}
          >
            {loadShiftActive ? "✓ Curfew Load Balancing Active" : "▶ Activate 10 PM Curfew Shift"}
          </button>
        </div>
      </section>

      {/* Animated Load Shift Visual Ribbon (shows when active) */}
      {loadShiftActive && (
        <div className="load-shift-active-ribbon animated-fadeIn">
          <div className="shift-indicator">
            <span className="shift-dot"></span>
            <span>
              <strong>Active Shifting:</strong> Throttling Loudoun, VA (180 kW) → Redirecting 540 kW non-urgent AI training to The Dalles, OR (720 kW)
            </span>
          </div>
          <div className="shift-sparkline">
            <div className="sparkline-bar va-cut">VA: -57% IT Heat</div>
            <div className="sparkline-bar or-boost">OR: +71% IT Power</div>
          </div>
        </div>
      )}

      {/* Grid of Data Center Sites */}
      <div className="fleet-grid">
        {siteResults.map(({ site, config, evaluation, effectivePower }) => {
          const isSelected = site.id === selectedSiteId;
          const limit = site.municipalNoiseLimitDba;
          const current = evaluation.netReceivedLp;
          const ratioPercent = Math.min(100, Math.round((current / limit) * 100));

          return (
            <article
              key={site.id}
              className={`fleet-card ${isSelected ? "selected" : ""} animated-card`}
              onClick={() => onSelectSite(site.id)}
            >
              <div className="fleet-card-header">
                <div>
                  <span className="site-region-tag">{site.country} · {site.terrainLabel}</span>
                  <h3>{site.name}</h3>
                  <small className="site-subtitle">{site.subtitle}</small>
                </div>
                <div
                  className="fleet-status-pill"
                  style={{
                    background: `${evaluation.statusColor}22`,
                    color: evaluation.statusColor,
                    borderColor: `${evaluation.statusColor}66`,
                  }}
                >
                  ● {evaluation.complianceStatus}
                </div>
              </div>

              {/* Acoustic Compliance Meter Bar */}
              <div className="fleet-compliance-meter">
                <div className="meter-label-row">
                  <span>Receptor Sound Pressure</span>
                  <strong>
                    <span style={{ color: evaluation.statusColor }}>{current.toFixed(1)} dBA</span> / {limit} dBA Limit
                  </strong>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${Math.min(100, (current / 75) * 100)}%`,
                      background: evaluation.statusColor,
                    }}
                  />
                  <div
                    className="meter-limit-marker"
                    style={{ left: `${(limit / 75) * 100}%` }}
                    title={`Legal Limit: ${limit} dBA`}
                  />
                </div>
                <div className="meter-sub-text">
                  {current <= limit ? (
                    <span className="text-safe">✓ {(limit - current).toFixed(1)} dBA safety margin</span>
                  ) : (
                    <span className="text-danger">⚠️ +{(current - limit).toFixed(1)} dBA violation over legal cap</span>
                  )}
                </div>
              </div>

              {/* Live Metric Badges */}
              <div className="fleet-metrics-strip">
                <div>
                  <span>Distance to Homes</span>
                  <strong>{site.defaultDistanceToHomesMeters}m</strong>
                </div>
                <div>
                  <span>Ambient Temp</span>
                  <strong>{site.ambientTempC}°C</strong>
                </div>
                <div>
                  <span>Active IT Load</span>
                  <strong style={{ color: "#38bdf8" }}>{effectivePower} kW</strong>
                </div>
              </div>

              {/* Site Mitigation Summary */}
              <div className="fleet-config-summary">
                <div className="config-item">
                  <span>Placement:</span>
                  <b>
                    {config.placement === "underground"
                      ? "🛡️ Underground Bunker"
                      : config.placement === "semi_berm"
                      ? "⛰️ Semi-Bermed"
                      : config.placement === "rear_shielded"
                      ? "🏢 Rear Shielded"
                      : "⚠️ Surface Yard"}
                  </b>
                </div>
                <div className="config-item">
                  <span>Acoustic Wall:</span>
                  <b>{config.wallEnabled ? `${config.wallHeightMeters}m Wall` : "None"}</b>
                </div>
                <div className="config-item">
                  <span>Vegetation Buffer:</span>
                  <b>{config.treeEnabled ? `${config.treeBufferDepthMeters}m Native Forest` : "None"}</b>
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
                  {isSelected ? "Currently Active in 3D →" : "Inspect in 3D Digital Twin →"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}