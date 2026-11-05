import { useState } from "react";
import { evaluateSiteAcoustics } from "../simulation/acoustics.js";
import { calculateEnergyMetrics } from "../simulation/energy.js";

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

    const energy = calculateEnergyMetrics({
      itPowerKw: effectivePower,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      chillerPlacement: config.placement,
      silencers: config.acousticSilencers || false,
      siteId: site.id,
    });

    return {
      site,
      config,
      evaluation,
      energy,
      effectivePower,
    };
  });

  // Global Fleet Aggregated Energy & Carbon Metrics
  const totalFleetItKw = siteResults.reduce((acc, s) => acc + s.effectivePower, 0);
  const totalFleetFacilityKw = siteResults.reduce((acc, s) => acc + s.energy.facilityPowerKw, 0);
  const totalFleetCarbonKg = siteResults.reduce((acc, s) => acc + s.energy.hourlyCarbonKg, 0);
  const totalFleetCost = siteResults.reduce((acc, s) => acc + s.energy.hourlyCostUsd, 0);
  const fleetAvgPue = totalFleetFacilityKw / Math.max(1, totalFleetItKw);

  // Carbon and cost impact of Follow-the-Moon load shifting:
  // Baseline: Loudoun at normal itPowerKw, Oregon at normal itPowerKw
  const loudounBaseline = calculateEnergyMetrics({ itPowerKw, siteId: "loudoun_va", ambientTempC: 22, fanSpeedPercent });
  const oregonBaseline = calculateEnergyMetrics({ itPowerKw, siteId: "the_dalles_or", ambientTempC: 16, fanSpeedPercent });
  const loudounShifted = calculateEnergyMetrics({ itPowerKw: 180, siteId: "loudoun_va", ambientTempC: 22, fanSpeedPercent });
  const oregonShifted = calculateEnergyMetrics({ itPowerKw: 720, siteId: "the_dalles_or", ambientTempC: 16, fanSpeedPercent });

  const shiftCarbonDeltaKg = (loudounBaseline.hourlyCarbonKg + oregonBaseline.hourlyCarbonKg) -
                             (loudounShifted.hourlyCarbonKg + oregonShifted.hourlyCarbonKg);
  const shiftCostDeltaUsd = (loudounBaseline.hourlyCostUsd + oregonBaseline.hourlyCostUsd) -
                           (loudounShifted.hourlyCostUsd + oregonShifted.hourlyCostUsd);

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
              <strong>Curfew Orchestration Active:</strong> Throttling Loudoun, VA (180 kW) → Redirecting 540 kW compute to The Dalles, OR (720 kW Hydro)
            </span>
          </div>
          <div className="shift-dividend-badges">
            <span className="dividend-pill green">
              🌱 <strong>+{shiftCarbonDeltaKg.toFixed(0)} kg CO₂/h</strong> Avoided
            </span>
            <span className="dividend-pill blue">
              💵 <strong>+${shiftCostDeltaUsd.toFixed(2)}/h</strong> Saved
            </span>
            <span className="dividend-pill purple">
              🔇 <strong>Zero Curfew Violations</strong>
            </span>
          </div>
        </div>
      )}

      {/* Global Fleet Telemetry Summary Bar */}
      <div className="fleet-telemetry-summary-bar">
        <div className="summary-item">
          <span className="summary-label">FLEET IT COMPUTE</span>
          <strong className="summary-val">{totalFleetItKw.toFixed(0)} kW</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">CAMPUS FACILITY POWER</span>
          <strong className="summary-val">{totalFleetFacilityKw.toFixed(0)} kW</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">FLEET AVG PUE</span>
          <strong className="summary-val" style={{ color: fleetAvgPue <= 1.25 ? "#10b981" : "#f59e0b" }}>
            {fleetAvgPue.toFixed(2)}
          </strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">FLEET CARBON RATE</span>
          <strong className="summary-val">{totalFleetCarbonKg.toFixed(1)} kg CO₂/h</strong>
        </div>
        <div className="summary-item">
          <span className="summary-label">FLEET HOURLY OPEX</span>
          <strong className="summary-val">${totalFleetCost.toFixed(2)}/h</strong>
        </div>
      </div>

      {/* Grid of Data Center Sites */}
      <div className="fleet-grid">
        {siteResults.map(({ site, config, evaluation, energy, effectivePower }) => {
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

              {/* Site Energy & Carbon Telemetry */}
              <div className="fleet-energy-strip">
                <div className="energy-mini-item">
                  <span>Facility Power:</span>
                  <b>{energy.facilityPowerKw.toFixed(0)} kW</b>
                </div>
                <div className="energy-mini-item">
                  <span>PUE:</span>
                  <b style={{ color: energy.pueColor }}>{energy.pue.toFixed(2)}</b>
                </div>
                <div className="energy-mini-item">
                  <span>Cooling:</span>
                  <b>{energy.coolingPowerKw.toFixed(0)} kW ({energy.coolingFractionPercent}%)</b>
                </div>
                <div className="energy-mini-item">
                  <span>Carbon / Cost:</span>
                  <b>{energy.hourlyCarbonKg.toFixed(0)} kg/h · ${energy.hourlyCostUsd.toFixed(1)}/h</b>
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