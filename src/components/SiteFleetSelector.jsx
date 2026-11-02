import { DATA_CENTER_SITES } from "../simulation/datacenterSites.js";

export default function SiteFleetSelector({ selectedSiteId, onSelectSite, evaluation }) {
  return (
    <div className="site-fleet-bar">
      <div className="fleet-bar-label">
        <span className="live-dot"></span>
        <span className="label-text">ACTIVE SITE TWIN:</span>
      </div>

      <div className="site-tabs" role="tablist">
        {DATA_CENTER_SITES.map((site) => {
          const isSelected = site.id === selectedSiteId;
          return (
            <button
              key={site.id}
              role="tab"
              aria-selected={isSelected}
              className={`site-tab-btn ${isSelected ? "active" : ""}`}
              onClick={() => onSelectSite(site.id)}
            >
              <span className="site-pill-name">{site.name}</span>
              <span className="site-pill-sub">{site.terrainLabel}</span>
            </button>
          );
        })}
      </div>

      {evaluation && (
        <div className="fleet-bar-status">
          <span
            className="status-pill"
            style={{
              background: `${evaluation.statusColor}22`,
              color: evaluation.statusColor,
              border: `1px solid ${evaluation.statusColor}66`,
            }}
          >
            {evaluation.netReceivedLp.toFixed(1)} dBA · {evaluation.complianceStatus}
          </span>
        </div>
      )}
    </div>
  );
}
