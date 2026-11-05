export default function Footer() {
  return (
    <footer className="hushgrid-footer">
      <div className="footer-top-grid">
        {/* Column 1: Brand & Overview */}
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <span className="footer-logo-icon">🌐</span>
            <span className="footer-brand-title">HushGrid</span>
          </div>
          <p className="footer-description">
            Next-generation spatial digital twin platform modeling aeroacoustic propagation, subterranean cooling plant
            vaulting, Maekawa barrier diffraction, and regional bio-acoustic buffer screens to eliminate community noise
            pollution around hyperscale data centers.
          </p>
          <div className="footer-status-pill">
            <span className="status-dot"></span>
            <span>AeroAcoustic Solver: <strong>v2.4 Active</strong> (ISO 9613-2)</span>
          </div>
        </div>

        {/* Column 2: APIs & Technologies Used */}
        <div className="footer-col">
          <h4>APIs & Engineering Stack</h4>
          <ul className="footer-links">
            <li>
              <strong>Three.js / WebGL</strong> — 3D spatial twin rendering & interactive raycasting
            </li>
            <li>
              <strong>Web Audio API</strong> — Real-time synthesized 60Hz/120Hz harmonic compressor hum & turbulent pink noise
            </li>
            <li>
              <strong>Google Maps Platform</strong> — Real-world satellite coordinates & high-altitude 3D terrain grounding
            </li>
            <li>
              <strong>ISO 9613-2 Standard</strong> — Hemispherical outdoor acoustic decay & foliage scattering
            </li>
            <li>
              <strong>Maekawa / Kurze-Anderson Model</strong> — Knife-edge acoustic barrier wall diffraction
            </li>
            <li>
              <strong>React 19 & Vite</strong> — High-frequency component lifecycle & responsive UI state
            </li>
          </ul>
        </div>

        {/* Column 3: Regulatory Compliance Standards */}
        <div className="footer-col">
          <h4>Regulatory Standards & Ordinances</h4>
          <ul className="footer-links">
            <li>
              <span>Loudoun County, VA Ordinance:</span>
              <strong> ≤ 45 dBA Night / 55 dBA Day</strong>
            </li>
            <li>
              <span>EU Environmental Noise Directive:</span>
              <strong> ≤ 40 dBA Residential Night</strong>
            </li>
            <li>
              <span>Maricopa County / Chandler, AZ:</span>
              <strong> ≤ 50 dBA Boundary Limit</strong>
            </li>
            <li>
              <span>ASHRAE TC 9.9 Thermal Guidelines:</span>
              <strong> 18°C - 27°C Recommended Supply</strong>
            </li>
          </ul>
        </div>

        {/* Column 4: Project Info & Author */}
        <div className="footer-col">
          <h4>Created By & Resources</h4>
          <div className="author-card">
            <p><strong>Created By:</strong> HushGrid Architecture & Spatial Computing Team</p>
            <p><strong>Prototype:</strong> Innovation Class Digital Twin</p>
          </div>
          <div className="footer-resource-links">
            <a
              href="https://github.com/Mrun9/mini-datacenter-digital-twin"
              target="_blank"
              rel="noreferrer"
              className="resource-pill"
            >
              ⭐ GitHub Repository ↗
            </a>
            <a href="#physics-guide" className="resource-pill" onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              📖 System Architecture
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>© 2026 HushGrid · AeroAcoustic Data Center Digital Twin · MIT License</p>
        <div className="footer-bottom-tags">
          <span>Silicon-to-Neighborhood Telemetry</span>
          <span>•</span>
          <span>Harmonic Decibel Synthesizer</span>
          <span>•</span>
          <span>Follow-the-Moon Curfew Load Shifting</span>
        </div>
      </div>
    </footer>
  );
}
