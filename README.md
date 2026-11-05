# AeroAcoustic Data Center Digital Twin (Innovation Prototype)

[![Build & Tests](https://img.shields.io/badge/tests-20%20passing-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![ISO 9613-2](https://img.shields.io/badge/Acoustics-ISO%209613--2-informational.svg)](https://www.iso.org/standard/20649.html)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-orange.svg)](src/simulation/audioSynthesizer.js)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%2F%20R3F-black.svg)](src/components/AcousticSiteSandbox3D.jsx)

An interactive, browser-only spatial digital twin platform designed to **simulate, predict, and eliminate community noise pollution caused by hyperscale AI data center cooling infrastructure (chillers, cooling towers, and CRAH exhaust fans)** while optimizing campus thermodynamic cooling energy, PUE, and grid carbon emissions across diverse geographic regions.

- **GitHub Repository:** https://github.com/Mrun9/mini-datacenter-digital-twin
- **Walkthrough & Physics Guide:** [LEARNING_GUIDE.md](LEARNING_GUIDE.md)

---

## 🎯 Innovation Need Statement & Problem Context

Hyperscale AI data center noise pollution has emerged as a severe environmental, health, and municipal conflict worldwide:

* **The Culprit:** Outdoor mechanical chillers, cooling towers, and condenser exhaust fans reject hundreds of megawatts of compute heat. Twin-screw compressors emit continuous 24/7 low-frequency structural hums (60–120 Hz) while high-speed axial fans produce turbulent broadband air roar (95–114 dBA sound power at the plant fence).
* **The Community Conflict:** In suburban data center hubs like **Loudoun County, VA ("Data Center Alley")**, Chandler, AZ, and Dublin, Ireland, residential neighborhoods within 250–600 m experience sleep disruption and stress, sparking zoning moratoriums and municipal lawsuits. Local ordinances enforce strict nighttime limits of **40–45 dBA at residential property boundaries**.
* **The Low-Frequency Challenge:** Low-frequency tones (60 Hz / 120 Hz) undergo minimal atmospheric absorption, easily penetrating home windows and exterior walls.
* **The Digital Twin Solution:** **HushGrid**—an Architectural AeroAcoustic Spatial Digital Twin that models site layout, subterranean chiller bunker vaulting, high-absorption perimeter barrier walls, and native regional bio-acoustic tree buffers *before* and *after* construction, paired with autonomous cross-fleet "follow-the-moon" nocturnal workload balancing and real-time PUE energy telemetry.

---

## 🚀 Key Prototype Innovations

### 1. Interactive 3D Spatial Sandbox (`AcousticSiteSandbox3D.jsx`)
* **Interactive 3D Drag & Drop:** Freely move chiller yards, multi-sided perimeter acoustic walls, and native tree buffers directly across the campus using mouse-driven ground plane raycasting.
* **Minimal Figma-Style Floating Toolbar:** Quick-action dock to add walls, plant tree clusters, toggle camera modes (Pan, Orbit, Top-Down), reset site layouts, and switch Day/Night lighting.
* **Movable Chiller Architecture:**
  * **Surface Yard:** Baseline industrial placement (0 dB attenuation).
  * **Semi-Bermed Basin:** Earthen berm acoustic recess (−11.5 dB attenuation, −1.5°C thermal shading).
  * **Subterranean Bunker Vault:** Complete direct line-of-sight sound elimination (−28 dB attenuation, −3.8°C thermal buffer from underground ground mass).
  * **Acoustic Silencer Baffles:** Tuned discharge silencer packs (−6.0 dB attenuation).
* **Multi-Sided Acoustic Perimeter Barrier Walls:**
  * Adjustable wall heights from **2 m up to 16 m** with real-time height callouts.
  * Rigorous acoustic materials:
    * *Perforated Absorptive Metal Composite* (NRC 0.95 — maximum sound absorption)
    * *Dense Precast Concrete* (NRC 0.05 — high mass reflection)
    * *Acoustic Mass Timber* (NRC 0.65 — carbon-negative glulam slats)
    * *Acoustic Polycarbonate* (Transparent daylighting screen)
* **Regional Native Bio-Acoustic Buffers:** Canopy screening optimized for acoustic scattering, zero-to-low irrigation, and regional climate resilience:
  * *Loudoun County, VA:* Eastern White & Virginia Pine (Dense needle evergreen, rain-fed)
  * *Phoenix, AZ:* Arizona Cypress & Velvet Mesquite (Extreme heat/drought hardy, drip xeriscaping)
  * *Columbia River Gorge, OR:* Western Red Cedar & Douglas Fir (Rain-fed conifer sound screen)
  * *Dublin, Ireland:* Irish Yew & Scots Pine (Damp-tolerant maritime acoustic hedging)
* **Real-Time 3D Acoustic Wave Rings:** Animated isophone contour rings on the terrain (Red >65 dBA, Amber >50 dBA, Green <45 dBA) that visually contract toward the plant as mitigations are applied.
* **Interactive 3D Noise Sensor Probe:** Draggable receptor probe delivering real-time decibel readouts ($L_p$), distance to source, and subjective human loudness perception anywhere across the site.
* **360° Hyperscale Campus Context:** Datacenter server halls, electrical substations, stormwater retention ponds, surrounding residential zones, highway traffic, and dynamic day/night atmospheric lighting.
* **Dual-View / Side-by-Side:** Inspect the 3D twin alongside high-resolution satellite aerial photography.

### 2. Live Multi-Telemetry HUD & Energy Engine (`energy.js`)
* **Unified HUD Card:** Toggleable floating heads-up display tracking acoustics, facility energy, and carbon:
  * **📊 Unified View:** Side-by-side acoustics and energy status.
  * **🔊 Acoustic Compliance:** Live dBA, distance to homes, and municipal night curfew margin.
  * **⚡ Energy & PUE:** Total facility power (kW), PUE benchmark rating, IT vs. cooling power split bar, chiller COP, hourly carbon emissions (kg CO₂/h), and operational cost ($/h).
* **Thermodynamic Chiller COP Modeling:** Models Carnot temperature lift penalties above 20°C ambient (2.2% COP reduction per °C) and economizer free-cooling bonuses below 20°C (1.8% COP improvement per °C). Subterranean placement provides −3.8°C thermal buffering.
* **Fan Affinity Law Scaling:** Condenser fan electrical power scales cubically with fan speed ($P \propto \text{RPM}^3$).
* **Grid Carbon Tracking:** Couples regional power grid emissions factors (PJM Loudoun: 385 gCO₂/kWh; Oregon BPA Hydro: 24 gCO₂/kWh) to quantify operational carbon footprints.

### 3. Multi-Site Fleet & "Follow-the-Moon" Workload Migration
* **Compare 4 Real-World Sites:**
  * **Loudoun County, VA:** Data Center Alley, flat terrain, strict 45 dBA nighttime residential curfew.
  * **Phoenix, AZ:** 115°F summer heat stress, low air humidity, desert xeriscaping.
  * **Columbia River Gorge, OR:** Canyon basalt cliff echoes (+4 dB reflection), 100% clean hydropower, 50 dBA limit.
  * **Dublin, Ireland:** Maritime damp climate, conifer acoustic hedging, 40 dBA EU Environmental Noise limit.
* **Autonomous Nocturnal Curfew Load Migration:** Automatically migrates compute load from Loudoun County at 10:00 PM (night noise curfew) to daylight or hydro-powered sites with underground chillers, maintaining global compute throughput 24/7 without violating municipal sleep ordinances.
* **Fleet Telemetry Summary Bar:** Aggregates fleet-wide IT load, facility power, fleet average PUE, total grid carbon emissions, and load-shift dividend badges (e.g. `+14.2 dB Sleep Margin`, `-38.5% Carbon Abatement`, `+$24.80/hr Energy Savings`).

### 4. Live Web Audio "Ear Simulator" (`audioSynthesizer.js`)
* Real-time audio synthesis powered by the Web Audio API:
  * **60 Hz / 120 Hz Harmonic Compressor Drone:** Dual oscillators modeling magnetostrictive and mechanical vibration.
  * **Turbulent Airflow Rush:** Low-pass filtered pink/white noise simulating axial fan vortex shedding.
  * **Dynamic Attenuation:** Distance decay, barrier wall insertion loss, and canopy scattering modulate the synthesizer volume in real time.
* **Audio Spectrum Visualizer:** Real-time canvas oscilloscope waveform and 16-band FFT audio spectrum analyzer.
* **"Listen at Neighbor's Porch":** One-click auditory check from the nearest bedroom or porch.

### 5. Acoustic Engineering Compliance Report (`AcousticEngineeringReport.jsx`)
* Formal engineering report dialog with 5 comprehensive tabs:
  * **📊 Executive Dashboard:** Link budget waterfall, municipal limit comparison, pass/fail compliance badge.
  * **📐 Physics Formulas:** Formal mathematical definitions and parameter tables.
  * **🎛️ Octave Band Analysis:** 8 standard octave bands (63 Hz to 8 kHz) comparing A-weighted vs. C-weighted levels to calculate low-frequency rumble excess ($L_C - L_A$).
  * **🌡️ Thermodynamic Lift:** Temperature lift curves and cooling load demand.
  * **⚡ Facility Energy & PUE:** Detailed kW power split table, fan affinity savings, grid carbon emissions, and operational cost breakdown.
* **One-Click Export:** Copy full formatted markdown engineering reports for municipal permitting submissions.

---

## 🛠️ Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Development

```sh
# Clone repository and enter project directory
git clone https://github.com/Mrun9/mini-datacenter-digital-twin.git
cd mini-datacenter-digital-twin

# Install dependencies
npm ci

# Start local development server
npm run dev
```

Open your browser to the local URL (usually `http://127.0.0.1:5173`).

### Test Suite & Production Build

```sh
# Run 20 physics, acoustic, and energy unit tests
npm test

# Generate production bundle
npm run build
```

---

## 📐 Scientific & Engineering Foundations

The simulation engine implements peer-reviewed acoustic and thermodynamic formulations conforming to **ISO 9613-2**, **Maekawa Knife-Edge Diffraction**, and **ASHRAE Datacom guidelines**.

### Acoustic & Aerodynamic Governing Equations

| Phenomenon | Governing Equation | Physical Description |
| :--- | :--- | :--- |
| **Source Sound Power** ($L_w$) | `L_w = 108.0 + ΔT_amb + 18·log₁₀(RPM / RPM_nom) + 10·log₁₀(P_IT / 500)` | Sound power scaling with compressor lift, fan tip speed, and compute load |
| **Hemispherical Distance Decay** ($L_p$) | `L_p = L_w - 20·log₁₀(d) - 11` | **ISO 9613-2**: Geometric spherical/hemispherical sound divergence over distance $d$ |
| **Barrier Wall Insertion Loss** ($A_\text{barrier}$) | `N = (2/λ)·δ`<br>`A_barrier = 10·log₁₀(3 + 20N) + NRC_bonus` | **Maekawa / Fresnel Diffraction**: Path difference $\delta$, wavelength $\lambda$, and material NRC bonus |
| **Bio-Acoustic Foliage Scattering** ($A_\text{veg}$) | `A_veg = 12·(1 - exp(-α·depth / 10)) + A_ground` | **ISO 9613-2**: Asymptotic canopy scattering depth + porous soil ground effect ($A_\text{ground} = 2.5\text{ dB}$) |
| **Low-Frequency Rumble Metric** | `Low-Freq Excess = L_pC - L_pA` | ANSI S12.9 Part 4 low-frequency rattle criterion ($L_C - L_A > 15\text{ dB}$) |

---

### Thermodynamic & Energy Governing Equations

| Parameter | Governing Equation | Physical Description |
| :--- | :--- | :--- |
| **Chiller COP (Lift Penalty)** | `COP = COP_nom / (1 + ΔT_hot · 0.022)` *(for T > 20°C)*<br>`COP = COP_nom · (1 + ΔT_cold · 0.018)` *(for T ≤ 20°C)* | Carnot temperature lift penalty and free-cooling economizer bonus |
| **Compressor Power** ($P_\text{comp}$) | `P_comp = P_IT / COP` | Chiller compressor electrical power required to reject IT heat |
| **Condenser Fan Affinity Law** ($P_\text{fan}$) | `P_fan = P_fan_peak · (RPM / RPM_nom)³` | Cubic fan affinity power law scaling with condenser fan speed |
| **Power Usage Effectiveness** (PUE) | `PUE = P_facility / P_IT` | Ratio of total facility power (IT + cooling + electrical losses) to IT compute power |
| **Grid Carbon Emission Rate** | `Carbon (kg/hr) = (P_facility_kW · Grid_Intensity_g/kWh) / 1000` | Real-time carbon footprint based on regional electricity grid mix |

---

### Detailed Equation Definitions

```
1. Chiller Sound Power Level:
   L_w = 108.0 + ΔT_ambient + 18 · log₁₀(RPM / RPM_nom) + 10 · log₁₀(P_IT / 500)

2. ISO 9613-2 Hemispherical Distance Attenuation:
   L_p = L_w - 20 · log₁₀(distance) - 11 + A_terrain - A_atmosphere

3. Maekawa Barrier Diffraction Insertion Loss:
   Fresnel Number: N = (2 / λ) · (A + B - d)
   A_barrier = 10 · log₁₀(3 + 20N) + NRC_bonus

4. Canopy Bio-Acoustic Scattering:
   A_veg = 12 · (1 - exp(-α · depth / 10)) + A_ground

5. Power Usage Effectiveness (PUE):
   PUE = (P_IT + P_compressor + P_fans + P_pumps + P_losses) / P_IT
```

---

## 🏛️ Project Architecture & Tech Stack

```
src/
├── components/
│   ├── AcousticSiteSandbox3D.jsx         # 3D interactive Three.js site sandbox, 3D drag-and-drop, HUD
│   ├── AcousticControls.jsx              # Executive Simple / Engineering Advanced control panel
│   ├── AcousticEngineeringReport.jsx     # Permitting report modal (dashboard, octave, thermo, energy)
│   ├── FleetComparisonView.jsx           # Multi-site comparison, follow-the-moon workload shifting
│   ├── SiteFleetSelector.jsx             # Geographic site switcher (Loudoun, Phoenix, Gorge, Dublin)
│   ├── SatelliteArchitectureInspector.jsx # Dual-view aerial satellite map overlay
│   ├── LandingPage.jsx                   # Innovation overview, physics stages, problem statement
│   ├── Header.jsx & Footer.jsx           # Navigation header, status badge, footer
│   └── ErrorBoundary.jsx                 # Graceful fallback boundary
├── simulation/
│   ├── acoustics.js                      # ISO 9613-2 propagation, Maekawa diffraction, isophone rings
│   ├── energy.js                         # Thermodynamic chiller COP, fan affinity, PUE, carbon engine
│   ├── audioSynthesizer.js               # Web Audio API real-time acoustic synthesizer & visualizer
│   ├── datacenterSites.js                # Regional site metadata, tree species, wall materials
│   └── physics.js                        # Thermal lumped-parameter simulator & rack thermodynamics
└── tests/
    ├── acoustics.test.js                 # 8 unit tests for acoustics & spatial propagation
    ├── energy.test.js                    # 5 unit tests for thermodynamics, PUE, and fan affinity
    └── physics.test.js                   # 7 unit tests for server thermodynamics & sensor synchronization
```

- **Frontend Core:** React 19, Vite 7
- **3D Graphics & Spatial Rendering:** Three.js (0.174), React Three Fiber, OrbitControls
- **Audio Simulation:** Web Audio API, Canvas 2D FFT Spectrum Visualizer
- **Testing:** Node.js native test runner (`node --test`), 20 passing unit tests

---

## 📄 License

This prototype is open-source under the [MIT License](LICENSE).
