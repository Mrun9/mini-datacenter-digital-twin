import { useState } from "react";
import { DATA_CENTER_SITES } from "../simulation/datacenterSites.js";

export default function Header({
  activeTab,
  onSelectTab,
  selectedSiteId,
  onSelectSite,
  acousticResults,
  running,
  onToggleRunning,
  simulationTimeSeconds,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeSite = DATA_CENTER_SITES.find((s) => s.id === selectedSiteId) || DATA_CENTER_SITES[0];

  const getSiteFlag = (country) => {
    if (country === "Ireland") return "🇮🇪";
    if (country === "United States") return "🇺🇸";
    return "🌐";
  };

  return (
    <header className="hushgrid-header">
      {/* Brand & Logo */}
      <div className="brand-group" onClick={() => onSelectTab("landing")} title="Return to Overview">
        <div className="hushgrid-logo">
          <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
            <defs>
              <linearGradient id="gridGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <radialGradient id="pulseGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Hexagonal Shield Perimeter */}
            <path
              d="M22 3 L39 12.5 V31.5 L22 41 L5 31.5 V12.5 Z"
              stroke="url(#gridGrad)"
              strokeWidth="2.5"
              fill="#0b1728"
            />
            {/* Acoustic Wave & Grid Lines */}
            <circle cx="22" cy="22" r="14" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
            <circle cx="22" cy="22" r="9" stroke="#34d399" strokeWidth="1.5" opacity="0.6" />
            <circle cx="22" cy="22" r="4" fill="url(#pulseGlow)" />
            {/* Cross Grid Lines */}
            <line x1="8" y1="22" x2="36" y2="22" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
            <line x1="22" y1="8" x2="22" y2="36" stroke="#38bdf8" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        <div className="brand-titles">
          <div className="brand-name-row">
            <span className="brand-name">HushGrid</span>
            <span className="brand-tag">SPATIAL DIGITAL TWIN</span>
          </div>
          <span className="brand-tagline">Data Center AeroAcoustics & Community Decibel Shield</span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="header-nav" aria-label="Main Navigation">
        <button
          className={`nav-tab-btn ${activeTab === "landing" ? "active" : ""}`}
          onClick={() => onSelectTab("landing")}
        >
          <span className="tab-icon">🗺️</span>
          <span>How It Works</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "site" ? "active" : ""}`}
          onClick={() => onSelectTab("site")}
        >
          <span className="tab-icon">🧊</span>
          <span>Selected Site 3D Twin</span>
          {acousticResults && (
            <span
              className="tab-pill"
              style={{
                background: `${acousticResults.statusColor}22`,
                color: acousticResults.statusColor,
                borderColor: `${acousticResults.statusColor}55`,
              }}
            >
              {acousticResults.netReceivedLp.toFixed(1)} dBA
            </span>
          )}
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "fleet" ? "active" : ""}`}
          onClick={() => onSelectTab("fleet")}
        >
          <span className="tab-icon">🌍</span>
          <span>Global Fleet</span>
        </button>
        <button
          className={`nav-tab-btn ${activeTab === "indoor" ? "active" : ""}`}
          onClick={() => onSelectTab("indoor")}
        >
          <span className="tab-icon">🖥️</span>
          <span>Server Racks</span>
        </button>
      </nav>

      {/* Right Controls: Site Dropdown & Clock */}
      <div className="header-controls">
        {/* Site Dropdown */}
        <div className="site-dropdown-wrapper">
          <label className="dropdown-label">ACTIVE SITE:</label>
          <button
            className={`site-dropdown-trigger ${dropdownOpen ? "open" : ""}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
            aria-label="Select Data Center Site"
          >
            <span className="flag-icon">{getSiteFlag(activeSite.country)}</span>
            <span className="site-name-display">{activeSite.name}</span>
            <span className="dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
          </button>

          {dropdownOpen && (
            <div className="site-dropdown-menu">
              <div className="dropdown-menu-header">
                <span>SELECT DATA CENTER FACILITY</span>
                <small>{DATA_CENTER_SITES.length} SITES AVAILABLE</small>
              </div>
              {DATA_CENTER_SITES.map((site) => (
                <div
                  key={site.id}
                  className={`dropdown-menu-item ${site.id === selectedSiteId ? "selected" : ""}`}
                  onClick={() => {
                    onSelectSite(site.id);
                    setDropdownOpen(false);
                    if (activeTab === "landing") {
                      onSelectTab("site");
                    }
                  }}
                >
                  <div className="item-main">
                    <span className="item-flag">{getSiteFlag(site.country)}</span>
                    <div className="item-info">
                      <span className="item-name">{site.name}</span>
                      <span className="item-sub">{site.subtitle} · {site.realFacilityName || "Facility"}</span>
                    </div>
                  </div>
                  <div className="item-metrics">
                    <span className="metric-tag">{site.defaultDistanceToHomesMeters}m to homes</span>
                    <span className="limit-tag">Limit: {site.municipalNoiseLimitDba} dBA</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Simulation Clock & Pause/Play */}
        <div className="header-clock-strip">
          <button
            className="sim-toggle-btn"
            onClick={onToggleRunning}
            title={running ? "Pause Simulation" : "Resume Simulation"}
          >
            {running ? "⏸" : "▶"}
          </button>
          <div className="clock-details">
            <span className="clock-label">{running ? "LIVE SIM" : "PAUSED"}</span>
            <span className="clock-time">{simulationTimeSeconds.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </header>
  );
}
