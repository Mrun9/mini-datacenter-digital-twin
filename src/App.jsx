import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Simulation } from "./simulation/Simulation.js";
import { powerWatts, totalNoiseDba } from "./simulation/physics.js";
import { DATA_CENTER_SITES } from "./simulation/datacenterSites.js";
import { evaluateSiteAcoustics } from "./simulation/acoustics.js";

import Header from "./components/Header.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Footer from "./components/Footer.jsx";
import AcousticControls from "./components/AcousticControls.jsx";
import FleetComparisonView from "./components/FleetComparisonView.jsx";
import ServerControls from "./components/ServerControls.jsx";
import TemperatureChart from "./components/TemperatureChart.jsx";
import SatelliteArchitectureInspector from "./components/SatelliteArchitectureInspector.jsx";

const ServerRoom = lazy(() => import("./components/ServerRoom.jsx"));
const AcousticSiteSandbox3D = lazy(() => import("./components/AcousticSiteSandbox3D.jsx"));

import "./styles.css";

export default function App() {
  // Single physics simulation instance
  const simulation = useRef(null);
  if (!simulation.current) simulation.current = new Simulation();

  const [selectedServerId, setSelectedServerId] = useState(1);
  const [running, setRunning] = useState(true);
  const [tab, setTab] = useState("landing"); // "landing" | "site" | "fleet" | "indoor"
  const [viewportMode, setViewportMode] = useState("twin"); // "twin" | "satellite" | "split"
  const [, refresh] = useState(0);
  const redraw = () => refresh((value) => value + 1);

  // Multi-Site & Acoustic State
  const [selectedSiteId, setSelectedSiteId] = useState("loudoun_va");
  const [siteConfigs, setSiteConfigs] = useState(() => {
    const initial = {};
    DATA_CENTER_SITES.forEach((site) => {
      initial[site.id] = { ...site.defaultChillerConfig };
    });
    return initial;
  });
  const [fanSpeedPercent, setFanSpeedPercent] = useState(75);

  const activeSite = useMemo(
    () => DATA_CENTER_SITES.find((s) => s.id === selectedSiteId) || DATA_CENTER_SITES[0],
    [selectedSiteId]
  );
  const activeConfig = siteConfigs[selectedSiteId] || activeSite.defaultChillerConfig;

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      simulation.current.tick();
      redraw();
    }, 250);
    return () => clearInterval(timer);
  }, [running]);

  const model = simulation.current;
  const physical = model.physical.servers;

  const command = (id, patch) => {
    model.physical.command(id, patch);
    redraw();
  };

  const handleUpdateConfig = (newConfig) => {
    setSiteConfigs((prev) => ({
      ...prev,
      [selectedSiteId]: newConfig,
    }));
  };

  // Total IT Power from internal racks scaled to facility kilowatts
  const baseRackWatts = physical.reduce((sum, s) => sum + powerWatts(s), 0);
  const itPowerKw = Math.round(baseRackWatts * 0.8 + 420);

  // Real-time site acoustics calculation
  const acousticResults = useMemo(() => {
    return evaluateSiteAcoustics({
      itPowerKw,
      ambientTempC: activeSite.ambientTempC,
      fanSpeedPercent,
      distanceToHomesMeters: activeSite.defaultDistanceToHomesMeters,
      municipalNoiseLimitDba: activeSite.municipalNoiseLimitDba,
      terrainEchoDb: activeSite.terrainEchoAmplificationDb,
      chillerPlacement: activeConfig.placement,
      wallHeightMeters: activeConfig.wallHeightMeters,
      wallMaterial: activeConfig.wallMaterial,
      wallEnabled: activeConfig.wallEnabled,
      treeBufferDepthMeters: activeConfig.treeBufferDepthMeters,
      treeSpeciesId: activeConfig.treeSpeciesId,
      treeEnabled: activeConfig.treeEnabled,
      chillerOrientationAngle: activeConfig.chillerOrientationAngle,
    });
  }, [itPowerKw, activeSite, fanSpeedPercent, activeConfig]);

  const age = model.timeSeconds - model.twin.lastMeasurementSeconds;
  const maxGap = Math.max(
    ...physical.map((server, index) =>
      Math.abs(server.temperatureC - model.twin.servers[index].temperatureC)
    )
  );

  const controls = (id) => (
    <ServerControls
      key={id}
      server={physical[id - 1]}
      twin={model.twin.servers[id - 1]}
      measurement={model.twin.measurements[id - 1]}
      command={command}
    />
  );

  return (
    <div className="hushgrid-app">
      {/* 1. Header with Logo 'HushGrid', Site Dropdown, Navigation & Sim Control */}
      <Header
        activeTab={tab}
        onSelectTab={setTab}
        selectedSiteId={selectedSiteId}
        onSelectSite={setSelectedSiteId}
        acousticResults={acousticResults}
        running={running}
        onToggleRunning={() => setRunning(!running)}
        simulationTimeSeconds={model.timeSeconds}
      />

      <main className="app-main-content">
        {/* VIEW 0: LANDING PAGE (Overview & Map of How This Works) */}
        {tab === "landing" && (
          <LandingPage
            onSelectSite={(id) => setSelectedSiteId(id)}
            onNavigateToTwin={(id) => {
              if (id) setSelectedSiteId(id);
              setTab("site");
            }}
          />
        )}

        {/* VIEW 1: SELECTED SITE 3D TWIN & ACOUSTIC SANDBOX */}
        {tab === "site" && (
          <section className="site-tab-view">
            {/* Site Title Banner & Quick Metadata */}
            <div className="site-view-header">
              <div className="site-title-column">
                <div className="site-eyebrow-row">
                  <span className="eyebrow">SPATIAL DIGITAL TWIN · 3D FACILITY GROUNDING</span>
                  <span
                    className="site-status-pill"
                    style={{
                      background: `${acousticResults.statusColor}22`,
                      color: acousticResults.statusColor,
                      borderColor: `${acousticResults.statusColor}66`,
                    }}
                  >
                    ● {acousticResults.complianceStatus} ({acousticResults.netReceivedLp.toFixed(1)} dBA at {activeSite.defaultDistanceToHomesMeters}m)
                  </span>
                </div>
                <h2>
                  {activeSite.name} <span className="sub-facility">— {activeSite.realFacilityName || "Hyperscale Campus"}</span>
                </h2>
                <p className="site-address-sub">
                  📍 {activeSite.realAddress || activeSite.coordinates} · Terrain: <strong>{activeSite.terrainLabel}</strong> · Ambient: <strong>{activeSite.ambientTempC}°C</strong>
                </p>
              </div>

              {/* Viewport Mode Switcher (3D Twin, Google Maps Satellite, Split View) */}
              <div className="viewport-mode-switcher">
                <button
                  className={viewportMode === "twin" ? "active" : ""}
                  onClick={() => setViewportMode("twin")}
                >
                  🧊 3D Twin Sandbox
                </button>
                <button
                  className={viewportMode === "satellite" ? "active" : ""}
                  onClick={() => setViewportMode("satellite")}
                >
                  🛰️ Google Maps Satellite
                </button>
                <button
                  className={viewportMode === "split" ? "active" : ""}
                  onClick={() => setViewportMode("split")}
                >
                  ⚡ Split View (3D + Maps)
                </button>
              </div>
            </div>

            {/* Viewport Display: 3D Canvas and/or Satellite Map */}
            <div className={`viewport-display ${viewportMode === "split" ? "split-mode" : ""}`}>
              {(viewportMode === "twin" || viewportMode === "split") && (
                <div className="canvas-wrapper">
                  <Suspense fallback={<div className="loading-canvas">Initializing 3D Spatial Acoustic Scene...</div>}>
                    <AcousticSiteSandbox3D
                      site={activeSite}
                      config={activeConfig}
                      acousticResults={acousticResults}
                      running={running}
                      itPowerKw={itPowerKw}
                      fanSpeedPercent={fanSpeedPercent}
                    />
                  </Suspense>
                </div>
              )}

              {(viewportMode === "satellite" || viewportMode === "split") && (
                <div className="satellite-wrapper">
                  <SatelliteArchitectureInspector site={activeSite} />
                </div>
              )}
            </div>

            {/* Engineering Acoustic Controls Panel */}
            <AcousticControls
              site={activeSite}
              config={activeConfig}
              onChangeConfig={handleUpdateConfig}
              results={acousticResults}
              fanSpeedPercent={fanSpeedPercent}
              onChangeFanSpeed={setFanSpeedPercent}
            />
          </section>
        )}

        {/* VIEW 2: GLOBAL FLEET & LOAD SHIFTING */}
        {tab === "fleet" && (
          <FleetComparisonView
            sites={DATA_CENTER_SITES}
            selectedSiteId={selectedSiteId}
            onSelectSite={(id) => {
              setSelectedSiteId(id);
              setTab("site");
            }}
            siteConfigs={siteConfigs}
            itPowerKw={itPowerKw}
            fanSpeedPercent={fanSpeedPercent}
          />
        )}

        {/* VIEW 3: INDOOR COMPUTE RACKS & TELEMETRY */}
        {tab === "indoor" && (
          <>
            <section className="metrics">
              <div>
                <span>Indoor IT Power</span>
                <strong>
                  {physical.reduce((sum, s) => sum + powerWatts(s), 0).toFixed(0)}
                  <small> W</small>
                </strong>
                <p>Drives outdoor chiller demand</p>
              </div>
              <div>
                <span>Indoor Server Fan Noise</span>
                <strong>
                  {totalNoiseDba(physical).toFixed(1)}
                  <small> dBA</small>
                </strong>
                <p>Inside server hall</p>
              </div>
              <div>
                <span>Largest Twin Deviation</span>
                <strong>
                  {maxGap.toFixed(1)}
                  <small> °C</small>
                </strong>
                <p>Physical vs estimated</p>
              </div>
              <div>
                <span>Last Sensor Update</span>
                <strong>
                  {age.toFixed(1)}
                  <small> sec ago</small>
                </strong>
                <p>
                  {model.twin.lastMeasurementSeconds === 0
                    ? "Initialized at t = 0"
                    : `Sampled at t = ${model.twin.lastMeasurementSeconds.toFixed(1)}s`}
                </p>
              </div>
            </section>

            {!model.sensor.connected && (
              <div className="notice">
                Sensors disconnected. The twin keeps estimating from its last reading.
                Change CPU load or disable a fan to observe divergence.
              </div>
            )}

            <div className="section-heading">
              <div>
                <span className="eyebrow">PHYSICAL RACK COMPUTATION → FACILITY CHILLER COUPLING</span>
                <h2>Indoor Server Racks (Heat Generation Core)</h2>
              </div>
              <span className="muted">Adjusting CPU load increases total heat rejected by outdoor chillers</span>
            </div>

            <section className="server-grid">
              {physical.map((s) => controls(s.id))}
            </section>

            <TemperatureChart history={model.history} />

            <div className="section-heading" style={{ marginTop: "32px" }}>
              <div>
                <span className="eyebrow">INDOOR 3D SERVER HALL</span>
                <h2>Rack-Level Geometry</h2>
              </div>
            </div>
            <Suspense fallback={<p>Loading indoor room...</p>}>
              <ServerRoom
                servers={physical}
                selected={selectedServerId}
                onSelect={setSelectedServerId}
                running={running}
              />
            </Suspense>
          </>
        )}
      </main>

      {/* 3. Footer with APIs used, created by, standards, etc. */}
      <Footer />
    </div>
  );
}
