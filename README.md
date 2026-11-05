# AeroAcoustic Data Center Digital Twin (Innovation Prototype)

An interactive, browser-only spatial digital twin platform designed to **simulate, predict, and eliminate community noise pollution caused by data center cooling plants (chillers and cooling towers)** across diverse geographic regions.

- **GitHub Repository:** https://github.com/Mrun9/mini-datacenter-digital-twin
- **Walkthrough & Physics Guide:** [LEARNING_GUIDE.md](LEARNING_GUIDE.md)

---

## 🎯 Innovation Need Statement & Problem Context

Data center noise pollution has emerged as a critical environmental and legal conflict:
* **The Culprit:** Outdoor mechanical chillers, cooling towers, and CRAH exhaust fans emit continuous 24/7 low-frequency hums (60–120 Hz) and turbulent air roar (95–114 dBA sound power at the plant).
* **The Community Conflict:** In suburban hubs like **Loudoun County, VA ("Data Center Alley")**, Chandler, AZ, and Dublin, Ireland, residents living within 250–600 m suffer sleep deprivation, leading to municipal lawsuits and zoning moratoriums. Most local ordinances enforce strict nighttime limits of **40–45 dBA at the property line**.
* **The Solution:** An **Architectural AeroAcoustic Spatial Digital Twin** that simulates site layout, subterranean chiller placement, high-absorption perimeter walls, and native regional bio-acoustic buffers *before* and *after* construction, paired with autonomous cross-fleet night-curfew workload balancing.

---

## 🚀 Key Prototype Innovations

### 1. Interactive 3D Spatial Sandbox (`AcousticSiteSandbox3D.jsx`)
* **Movable Chillers:** Toggle between **Surface Yard** (0 dB attenuation), **Semi-Bermed Basin** (−11.5 dB), and **Subterranean Bunker Vault** (−28 dB direct line-of-sight elimination).
* **Exhaust Baffle Direction:** Rotate cooling exhaust fans away from residential developments (0° to 180°).
* **Acoustic Barrier Walls:** Drag-and-adjust wall heights from **2 m up to 16 m** with material physics:
  * *Perforated Absorptive Metal Composite* (NRC 0.95 — maximum sound absorption)
  * *Dense Precast Concrete* (NRC 0.05 — high mass reflection)
  * *Acoustic Mass Timber* (NRC 0.65 — carbon-negative glulam slats)
  * *Acoustic Polycarbonate* (Transparent daylighting)
* **Regional Native Bio-Acoustic Buffers:** Plant species-specific tree screens optimized for acoustic scattering, zero-to-low irrigation, and minimal maintenance:
  * *Loudoun County, VA:* Eastern White & Virginia Pine (Dense needle evergreen, rain-fed)
  * *Phoenix, AZ:* Arizona Cypress & Velvet Mesquite (Extreme heat/drought hardy, drip xeriscaping)
  * *Columbia River Gorge, OR:* Western Red Cedar & Douglas Fir (Rain-fed conifer sound screen)
  * *Dublin, Ireland:* Irish Yew & Scots Pine (Damp-tolerant maritime acoustic hedging)
* **Real-time 3D Acoustic Wave Rings:** Animated isophone rings on the terrain (Red >65 dBA, Amber >50 dBA, Green <45 dBA) that visually shrink back toward the plant as mitigations are applied.

### 2. Multi-Site Geographic Fleet & "Follow-the-Moon" Load Shifting
* Compare real-world data centers across different microclimates, terrains (mountain canyon echoes vs flat plains), and legal limits.
* **Autonomous Night Curfew Shifting:** Automatically migrates compute load from Loudoun County at 10:00 PM (night noise curfew) to daylight/hydro-powered sites with underground chillers, keeping global throughput 24/7 without community noise violations.

### 3. Live Web Audio "Ear Simulator" (`audioSynthesizer.js`)
* Judges and users can click **"Listen at Neighbor's Porch"** to hear a real-time synthesized acoustic environment:
  * 60 Hz / 120 Hz harmonic mechanical compressor drone
  * Low-pass filtered turbulent fan airflow rush
  * Dynamic amplitude scaling matching the calculated dBA at the residential property line.

### 4. Silicon-to-Neighborhood Digital Twin Link
* Internal compute utilization (CPU slider / unit count in server racks) directly drives heat rejection demand, which scales outdoor chiller fan speed and acoustic emission.

---

## 🛠️ Run Locally

```sh
cd "/Volumes/Projects/Data Center twin"
npm ci
npm run dev
```

Open the local URL (usually http://127.0.0.1:5173).

```sh
npm test      # Runs 13 physics and acoustic unit tests
npm run build # Generates production bundle
```

---

## 📐 Scientific & Engineering Foundations

1. **Source Sound Power ($L_w$):**
   Scales with compressor compression ratio, ambient temperature penalty, and tip speed:

   $$
   L_w = 108.0 + \Delta T_{\text{ambient}} + 18\log_{10}\left(\frac{\text{RPM}}{\text{RPM}_{\text{nom}}}\right) + 10\log_{10}\left(\frac{P_{\text{IT}}}{500}\right)
   $$

2. **Hemispherical Distance Decay (ISO 9613-2):**
   Acoustic geometric spreading over hemispherical terrain:

   $$
   L_p = L_w - 20\log_{10}(d) - 11
   $$

3. **Barrier Wall Insertion Loss (Maekawa / Fresnel Diffraction):**
   Diffraction over perimeter barrier walls with material absorption bonus:

   $$
   N = \frac{2}{\lambda}\delta, \quad A_{\text{barrier}} = 10\log_{10}(3 + 20N) + \text{Bonus}_{\text{NRC}}
   $$

4. **Bio-Acoustic Foliage Scattering (ISO 9613-2):**
   Canopy foliage scattering depth combined with porous ground absorption:

   $$
   A_{\text{veg}} = 12 \cdot \left(1 - \exp\left(-\frac{\alpha \cdot \text{depth}}{10}\right)\right) + A_{\text{ground}}
   $$
