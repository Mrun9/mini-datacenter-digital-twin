import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES, getTreeSuitability } from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";
import { calculateEnergyMetrics } from "../simulation/energy.js";
import { evaluateSiteAcoustics } from "../simulation/acoustics.js";

/**
 * Camera Navigation with Smooth Orbit and Pan
 */
function SiteCameraControls({ navMode, cameraPreset, isDragging }) {
  const { camera, gl } = useThree();
  const orbitRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 0, 0);
    controls.minDistance = 15;
    controls.maxDistance = 340;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.screenSpacePanning = true;

    orbitRef.current = controls;
    return () => controls.dispose();
  }, [camera, gl]);

  useFrame(() => {
    if (orbitRef.current) {
      orbitRef.current.update();
    }
  });

  useEffect(() => {
    if (!orbitRef.current) return;
    orbitRef.current.enabled = !isDragging;
  }, [isDragging]);

  useEffect(() => {
    if (!orbitRef.current) return;
    if (navMode === "pan") {
      orbitRef.current.mouseButtons = { LEFT: 2, MIDDLE: 1, RIGHT: 0 };
    } else {
      orbitRef.current.mouseButtons = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };
    }
  }, [navMode]);

  useEffect(() => {
    if (!orbitRef.current) return;
    if (cameraPreset === "reset") {
      camera.position.set(0, 115, 125);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 160, 0.01);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "feature") {
      camera.position.set(38, 42, 60);
      orbitRef.current.target.set(36, 0, 0);
    } else if (cameraPreset === "homes") {
      camera.position.set(-36, 32, 45);
      orbitRef.current.target.set(-36, 0, 0);
    } else if (cameraPreset === "plant") {
      camera.position.set(4, 28, 38);
      orbitRef.current.target.set(4, 0, 0);
    }
    orbitRef.current.update();
  }, [cameraPreset, camera]);

  return null;
}

/* ==========================================================================
   1. LOUDOUN COUNTY, VA ENVIRONMENT ("Data Center Alley")
   - 3 Angled Hyperscale Compute Buildings (22° NW-to-SE)
   - East: Route 28 Multi-Lane Highway with traffic, ramps, and overhead gantry
   - West: Curving suburban residential avenue + cul-de-sac + 20 family homes
   - North: Meandering riparian creek stream & Virginia pines
   - South: Substation transformer yard & retention basin pond
   ========================================================================== */
function LoudounCampusEnvironment({ timeOfDay }) {
  const isNight = timeOfDay === "night";
  const windowColor = isNight ? "#fef08a" : "#94a3b8";
  const windowEmissive = isNight ? "#eab308" : "#000000";
  const windowIntensity = isNight ? 1.4 : 0.0;
  const buildingHeight = 7.5;
  const angleRad = (22 * Math.PI) / 180;

  return (
    <group>
      {/* 1. Base Suburban Lawn & Ring Roads */}
      <group position={[2, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[52, 72]} />
          <meshStandardMaterial color="#2b3544" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 80]} />
          <meshStandardMaterial color="#161f2c" roughness={0.8} />
        </mesh>
        {/* Parking Bays */}
        <mesh position={[0, 0.02, 34]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[28, 9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {[-12, -8, -4, 0, 4, 8, 12].map((px) => (
          <mesh key={px} position={[px, 0.025, 34]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.22, 7.5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>

      {/* 2. 3 Angled Hyperscale Compute Buildings */}
      <group position={[2, 0, -2]} rotation={[0, -angleRad, 0]}>
        {[-20, 0, 20].map((bz, idx) => (
          <group key={bz} position={[0, 0, bz]}>
            <mesh position={[0, buildingHeight / 2, 0]}>
              <boxGeometry args={[32, buildingHeight, 13]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.1} />
            </mesh>
            <mesh position={[0, buildingHeight * 0.75, 0]}>
              <boxGeometry args={[32.2, 0.8, 13.2]} />
              <meshStandardMaterial color="#1e293b" roughness={0.5} />
            </mesh>
            <mesh position={[0, buildingHeight + 0.15, 0]}>
              <boxGeometry args={[32.4, 0.3, 13.4]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.25} />
            </mesh>
            {/* Rooftop HVAC CRAH Units */}
            {[-9, 0, 9].map((rx) =>
              [-3, 3].map((rz) => (
                <group key={`${rx}_${rz}`} position={[rx, buildingHeight + 0.3, rz]}>
                  <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[3.4, 1.6, 2.4]} />
                    <meshStandardMaterial color="#475569" metalness={0.7} />
                  </mesh>
                  <mesh position={[0, 1.8, 0]}>
                    <cylinderGeometry args={[0.65, 0.65, 0.5, 12]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
                  </mesh>
                </group>
              ))
            )}
            {/* Glass Entrance on South Building */}
            {idx === 2 && (
              <group position={[0, 0, 6.7]}>
                <mesh position={[0, 3.2, 0]}>
                  <boxGeometry args={[13, 4.6, 0.3]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.9} transparent opacity={0.75} />
                </mesh>
                <mesh position={[0, 4.4, 1.5]}>
                  <boxGeometry args={[15, 0.35, 3.0]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              </group>
            )}
          </group>
        ))}
        {/* Backup Generators */}
        <group position={[-18, 0, 0]}>
          <mesh position={[0, 0.15, 0]}><boxGeometry args={[5.5, 0.3, 38]} /><meshStandardMaterial color="#334155" /></mesh>
          {[-14, -6, 2, 10, 18].map((gz) => (
            <group key={gz} position={[0, 0.3, gz]}>
              <mesh position={[0, 1.5, 0]}><boxGeometry args={[4.6, 2.6, 3.2]} /><meshStandardMaterial color="#374151" metalness={0.7} /></mesh>
              <mesh position={[1.4, 3.6, 0]}><cylinderGeometry args={[0.22, 0.22, 2.2, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={0.9} /></mesh>
            </group>
          ))}
        </group>
      </group>

      {/* 3. EAST: Route 28 Multi-Lane Highway (Inside 300m at x = 38) */}
      <group position={[38, 0.03, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 240]} />
          <meshStandardMaterial color="#141a24" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.7, 1.0, 240]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {[-4, 4].map((hx) => (
          <mesh key={hx} position={[hx, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 230]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        ))}
        {/* Highway Overhead Sign Gantry */}
        <group position={[0, 0, -15]}>
          <mesh position={[-7.5, 3.5, 0]}><cylinderGeometry args={[0.15, 0.15, 7, 8]} /><meshStandardMaterial color="#64748b" metalness={0.8} /></mesh>
          <mesh position={[7.5, 3.5, 0]}><cylinderGeometry args={[0.15, 0.15, 7, 8]} /><meshStandardMaterial color="#64748b" metalness={0.8} /></mesh>
          <mesh position={[0, 7.0, 0]}><boxGeometry args={[16, 0.4, 0.4]} /><meshStandardMaterial color="#64748b" /></mesh>
          <mesh position={[-3.5, 5.8, 0.2]}><boxGeometry args={[5.5, 2.0, 0.1]} /><meshStandardMaterial color="#065f46" /></mesh>
          <mesh position={[3.5, 5.8, 0.2]}><boxGeometry args={[5.5, 2.0, 0.1]} /><meshStandardMaterial color="#065f46" /></mesh>
        </group>
        {/* Cars on Highway */}
        {[
          { x: -4, z: -45, color: "#dc2626" },
          { x: -4, z: 15, color: "#ffffff" },
          { x: 4, z: -20, color: "#0284c7" },
          { x: 4, z: 35, color: "#eab308" },
        ].map((c, i) => (
          <mesh key={i} position={[c.x, 0.65, c.z]}><boxGeometry args={[2.0, 1.1, 3.5]} /><meshStandardMaterial color={c.color} /></mesh>
        ))}
      </group>

      {/* 4. WEST: Curving Suburban Residential Neighborhood */}
      <group>
        {[-50, -35, -20, -5, 10, 25, 40, 55].map((z) => {
          const segX = -32 - Math.sin((z + 10) * 0.035) * 8;
          return (
            <group key={z} position={[segX, 0.02, z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[9, 18]} /><meshStandardMaterial color="#1e293b" /></mesh>
              <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.22, 17]} /><meshBasicMaterial color="#fef08a" /></mesh>
            </group>
          );
        })}
        {/* 16 Suburban Homes */}
        {[-48, -36, -24, -12, 0, 12, 24, 36, 48].map((z, idx) => {
          const curX = -32 - Math.sin((z + 10) * 0.035) * 8;
          return (
            <group key={z} position={[curX - 8, 0, z]}>
              <mesh position={[1.6, 2.4, 0]}><boxGeometry args={[6.8, 4.8, 8.0]} /><meshStandardMaterial color={idx % 2 === 0 ? "#f8fafc" : "#e2e8f0"} /></mesh>
              <mesh position={[1.6, 5.6, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[5.5, 5.5, 8.4]} /><meshStandardMaterial color="#334155" /></mesh>
              <mesh position={[-1.75, 2.5, 1.8]}><planeGeometry args={[1.3, 1.3]} /><meshStandardMaterial color={windowColor} emissive={windowEmissive} emissiveIntensity={windowIntensity} side={DoubleSide} /></mesh>
              <mesh position={[-1.75, 2.5, -1.8]}><planeGeometry args={[1.3, 1.3]} /><meshStandardMaterial color={windowColor} emissive={windowEmissive} emissiveIntensity={windowIntensity} side={DoubleSide} /></mesh>
            </group>
          );
        })}
      </group>

      {/* 5. NORTH: Stream Creek & SOUTH: Substation */}
      <group position={[0, 0.02, -45]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[140, 10]} /><meshStandardMaterial color="#161f2c" /></mesh>
        <mesh position={[-15, -0.005, -10]} rotation={[-Math.PI / 2, 0, 0.1]}><planeGeometry args={[120, 7]} /><meshStandardMaterial color="#0369a1" roughness={0.2} transparent opacity={0.8} /></mesh>
      </group>
      <group position={[14, 0.02, 48]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[30, 22]} /><meshStandardMaterial color="#475569" /></mesh>
        {[-4, 4, 10].map((tx) => (
          <group key={tx} position={[tx, 0, 0]}>
            <mesh position={[0, 2.0, 0]}><boxGeometry args={[4.2, 4.0, 4.2]} /><meshStandardMaterial color="#334155" metalness={0.8} /></mesh>
            <mesh position={[0, 4.8, 0]}><cylinderGeometry args={[0.15, 0.22, 1.6, 8]} /><meshStandardMaterial color="#b45309" /></mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   2. COLUMBIA RIVER GORGE, OR ENVIRONMENT (Google Flagship Campus)
   - North: The vast Columbia River (wide open water expanse spanning northern half)
   - South: Towering 200-ft Basalt Canyon Palisades / Rock Bluffs (acoustic parabolic echo!)
   - Buildings: Twin Google Riverfront Compute Halls with Pacific cedar sound screens
   - West: Union Pacific railway tracks along the river & rural orchard farm houses
   - East: Riverfront industrial cooling water intake pumping station
   ========================================================================== */
function TheDallesCampusEnvironment({ timeOfDay }) {
  const isNight = timeOfDay === "night";
  const waterColor = isNight ? "#082f49" : "#0284c7";

  return (
    <group>
      {/* 1. NORTH: VAST COLUMBIA RIVER EXPANSE */}
      <group position={[0, 0.02, -46]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[340, 60]} />
          <meshStandardMaterial
            color={waterColor}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.9}
          />
        </mesh>
        {/* Riverbank Rock Riprap */}
        <mesh position={[0, 0.2, 30]}>
          <boxGeometry args={[340, 0.6, 3]} />
          <meshStandardMaterial color="#334155" roughness={0.95} />
        </mesh>
        {/* River Navigation Warning Buoy */}
        <group position={[-20, 0.8, -10]}>
          <cylinderGeometry args={[0.4, 0.6, 1.6, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={isNight ? 0.8 : 0.2} />
        </group>
      </group>

      {/* 2. SOUTH: TOWERING 200-FOOT BASALT CANYON ROCK PALISADES (Parabolic Echo Mirror) */}
      <group position={[0, 0, 48]}>
        {/* Stepped Massive Volcanic Basalt Bluffs */}
        {[-140, -80, -20, 40, 100, 160].map((bx, i) => (
          <group key={bx} position={[bx, 0, (i % 2) * 4]}>
            <mesh position={[0, 14, 0]}>
              <boxGeometry args={[65, 28, 26]} />
              <meshStandardMaterial color="#292524" roughness={0.98} metalness={0.1} />
            </mesh>
            <mesh position={[0, 26, 0]}>
              <boxGeometry args={[55, 6, 20]} />
              <meshStandardMaterial color="#1c1917" roughness={0.99} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 3. TWIN GOOGLE RIVERFRONT DATA CENTER HALLS */}
      <group position={[4, 0, 2]}>
        {[-14, 14].map((bz) => (
          <group key={bz} position={[0, 0, bz]}>
            <mesh position={[0, 4.0, 0]}>
              <boxGeometry args={[44, 8.0, 18]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 8.2, 0]}>
              <boxGeometry args={[44.4, 0.4, 18.4]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. WEST: Union Pacific Riverfront Rail Tracks & Rural Orchard Houses */}
      <group position={[-42, 0.03, -12]}>
        {/* Steel Rail Line Tracks */}
        {[-0.8, 0.8].map((rx) => (
          <mesh key={rx} position={[rx, 0.1, 0]}>
            <boxGeometry args={[0.15, 0.15, 60]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
          </mesh>
        ))}
        {/* Wooden Rail Ties */}
        {[-24, -16, -8, 0, 8, 16, 24].map((rz) => (
          <mesh key={rz} position={[0, 0.05, rz]}>
            <boxGeometry args={[2.4, 0.1, 0.4]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   3. PHOENIX / CHANDLER, AZ ENVIRONMENT (Silicon Desert Corridor)
   - Terrain: Arid Sonoran Desert hardpan soil, xeriscape gravel, and red washes
   - Buildings: Desert Hyperscale Facility with tan/sandstone precast panels
   - Chiller Yard: Sunken Semi-Bermed Earthen Basin to deflect sound into desert heat
   - Surroundings: Concrete irrigation canal, Saguaro Cacti, and terracotta tile Pueblo homes
   ========================================================================== */
function PhoenixCampusEnvironment({ timeOfDay }) {
  const isNight = timeOfDay === "night";

  return (
    <group>
      {/* 1. DESERT HARDPAN TERRAIN OVERLAY */}
      <group position={[0, 0.01, 0]}>
        {/* Desert Technology Boulevard (Price Road) */}
        <mesh position={[36, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 240]} />
          <meshStandardMaterial color="#292524" roughness={0.8} />
        </mesh>
        {/* Concrete Central Arizona Irrigation Canal */}
        <group position={[22, 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[7, 240]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} transparent opacity={0.85} />
          </mesh>
          {[-3.8, 3.8].map((cx) => (
            <mesh key={cx} position={[cx, 0.2, 0]}>
              <boxGeometry args={[0.6, 0.4, 240]} />
              <meshStandardMaterial color="#d6d3d1" />
            </mesh>
          ))}
        </group>
      </group>

      {/* 2. DESERT HYPERSCALE CAMPUS (Tan / Sandstone Architectural Tilt-Up) */}
      <group position={[2, 0, 0]}>
        <mesh position={[0, 4.2, 0]}>
          <boxGeometry args={[38, 8.4, 24]} />
          <meshStandardMaterial color="#d4b996" roughness={0.85} metalness={0.05} />
        </mesh>
        {/* White Heat-Reflective Desert Roof with Solar PV Canopy */}
        <mesh position={[0, 8.6, 0]}>
          <boxGeometry args={[38.4, 0.4, 24.4]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.2} />
        </mesh>
        {/* Rooftop Solar Canopy Arrays */}
        {[-12, -4, 4, 12].map((sx) => (
          <mesh key={sx} position={[sx, 9.6, 0]} rotation={[0, 0, Math.PI / 18]}>
            <boxGeometry args={[6, 0.2, 20]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
          </mesh>
        ))}
      </group>

      {/* 3. NATIVE SONORAN DESERT SAGUARO CACTI CLUSTERS */}
      {[
        [-16, 18], [-20, -24], [-12, -32], [14, 28], [18, -26], [-28, 34]
      ].map(([cx, cz], i) => (
        <group key={i} position={[cx, 0, cz]}>
          {/* Main Saguaro Trunk */}
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.25, 0.3, 4.4, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
          {/* Curved Saguaro Arms */}
          <group position={[0.5, 2.2, 0]}>
            <mesh position={[0.3, 0.4, 0]}><boxGeometry args={[0.6, 0.2, 0.2]} /><meshStandardMaterial color="#15803d" /></mesh>
            <mesh position={[0.6, 1.0, 0]}><cylinderGeometry args={[0.15, 0.15, 1.2, 6]} /><meshStandardMaterial color="#15803d" /></mesh>
          </group>
        </group>
      ))}

      {/* 4. SOUTHWEST: SPANISH-STYLE PUEBLO HOMES (Terracotta Tile Roofs & Stucco) */}
      <group position={[-36, 0, 0]}>
        {[-36, -18, 0, 18, 36].map((hz) => (
          <group key={hz} position={[0, 0, hz]}>
            <mesh position={[0, 2.0, 0]}>
              <boxGeometry args={[7.5, 4.0, 8.5]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.8} />
            </mesh>
            {/* Terracotta Clay Barrel Tile Low-Pitch Roof */}
            <mesh position={[0, 4.4, 0]} rotation={[0, 0, Math.PI / 8]}>
              <boxGeometry args={[6.5, 1.2, 9.2]} />
              <meshStandardMaterial color="#ea580c" roughness={0.7} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ==========================================================================
   4. DUBLIN / KILDARE, IRELAND ENVIRONMENT (Grange Castle European Hub)
   - Terrain: Emerald green maritime peat grasslands and hedgerows
   - North: The Historic Grand Canal of Dublin (waterway channel & walking towpath)
   - Surroundings: Traditional Irish stone walls, hawthorn hedgerows, dark slate-roofed village houses
   - Subterranean bunker ventilation shafts
   ========================================================================== */
function DublinCampusEnvironment({ timeOfDay }) {
  const isNight = timeOfDay === "night";

  return (
    <group>
      {/* 1. NORTH: THE HISTORIC GRAND CANAL OF DUBLIN */}
      <group position={[0, 0.02, -42]}>
        {/* Canal Water Channel */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[340, 12]} />
          <meshStandardMaterial color="#065f46" roughness={0.2} metalness={0.5} transparent opacity={0.85} />
        </mesh>
        {/* Stone Canal Towpath */}
        <mesh position={[0, 0.01, 8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[340, 3]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>
        {/* Traditional Irish Stone Wall along Canal */}
        <mesh position={[0, 0.6, 10]}>
          <boxGeometry args={[340, 1.2, 0.5]} />
          <meshStandardMaterial color="#57534e" roughness={0.95} />
        </mesh>
      </group>

      {/* 2. GRANGE CASTLE HYPERSCALE COMPLEX */}
      <group position={[2, 0, 0]}>
        <mesh position={[0, 4.0, 0]}>
          <boxGeometry args={[36, 8.0, 22]} />
          <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 8.2, 0]}>
          <boxGeometry args={[36.4, 0.4, 22.4]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      </group>

      {/* 3. TRADITIONAL IRISH STONE WALLS & HEDGEROW PADDOCKS */}
      <group>
        {[-30, 0, 30].map((pz) => (
          <mesh key={pz} position={[-20, 0.5, pz]}>
            <boxGeometry args={[0.5, 1.0, 24]} />
            <meshStandardMaterial color="#57534e" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* 4. EAST: CLONDALKIN VILLAGE HOMES (Dark Slate Roofs & Pebble-dash) */}
      <group position={[-38, 0, 0]}>
        {[-36, -18, 0, 18, 36].map((vz) => (
          <group key={vz} position={[0, 0, vz]}>
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[7.0, 4.4, 8.0]} />
              <meshStandardMaterial color="#e7e5e4" roughness={0.7} />
            </mesh>
            {/* Dark Natural Slate Steep Pitched Roof */}
            <mesh position={[0, 5.4, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[5.2, 5.2, 8.4]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
            {/* Traditional Red Brick Chimney */}
            <mesh position={[1.4, 6.2, 0]}>
              <boxGeometry args={[0.8, 2.0, 0.8]} />
              <meshStandardMaterial color="#991b1b" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * 3D Selection Ring Indicator
 */
function SelectionRing({ radius = 8, label = "SELECTED" }) {
  const spriteTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(14, 165, 233, 0.95)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 256, 64, 12);
    } else {
      ctx.rect(0, 0, 256, 64);
    }
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, 128, 40);

    return new CanvasTexture(canvas);
  }, [label]);

  useEffect(() => () => spriteTexture.dispose(), [spriteTexture]);

  return (
    <group position={[0, 0.1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.4, radius, 32]} />
        <meshBasicMaterial color="#38bdf8" side={DoubleSide} />
      </mesh>
      <sprite position={[0, radius * 0.7 + 2, 0]} scale={[5, 1.25, 1]}>
        <spriteMaterial map={spriteTexture} depthTest={false} />
      </sprite>
    </group>
  );
}

/**
 * Draggable Chiller Yard Compound
 */
function DraggableChillerYard({
  item,
  isSelected,
  running,
  fanSpeedPercent,
  onSelect,
  onPointerDown,
}) {
  const fans = [useRef(), useRef(), useRef(), useRef()];

  useFrame((_, delta) => {
    if (!running) return;
    const rot = delta * (fanSpeedPercent / 100) * 22;
    fans.forEach((f) => {
      if (f.current) f.current.rotation.y += rot;
    });
  });

  let yardY = 0;
  if (item.placement === "underground") yardY = -5.5;
  else if (item.placement === "semi_berm") yardY = -2.2;

  const radAngle = ((item.rotation || 0) * Math.PI) / 180;

  return (
    <group
      position={[item.x, yardY, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onPointerDown(item.id, e);
      }}
    >
      {isSelected && <SelectionRing radius={10} label="CHILLERS · DRAGGABLE" />}

      {/* Equipment Pad with Yellow Warning Stripes */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[14, 0.3, 26]} />
        <meshStandardMaterial color={isSelected ? "#38bdf8" : "#334155"} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, 12.8]}>
        <boxGeometry args={[13.8, 0.05, 0.4]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>
      <mesh position={[0, 0.16, -12.8]}>
        <boxGeometry args={[13.8, 0.05, 0.4]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* 3 Modular V-Bank Chiller Units */}
      <group rotation={[0, radAngle, 0]}>
        {[-8.5, 0, 8.5].map((chillerZ, idx) => (
          <group key={idx} position={[0, 0, chillerZ]}>
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[4.8, 0.8, 7.8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.1, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 2.8, 16]} />
              <meshStandardMaterial color={item.silencers ? "#064e3b" : "#2563eb"} metalness={0.7} />
            </mesh>
            <mesh position={[-1.2, 2.5, 0]} rotation={[0, 0, Math.PI / 8]}>
              <boxGeometry args={[0.3, 3.2, 7.4]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh position={[1.2, 2.5, 0]} rotation={[0, 0, -Math.PI / 8]}>
              <boxGeometry args={[0.3, 3.2, 7.4]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            {/* 4 Condenser Fans */}
            <group position={[0, 4.2, 0]}>
              {[[-1.1, -2.0], [1.1, -2.0], [-1.1, 2.0], [1.1, 2.0]].map(([fx, fz], fIdx) => (
                <group key={fIdx} position={[fx, 0, fz]}>
                  <mesh>
                    <cylinderGeometry args={[1.0, 1.0, 0.6, 16, 1, true]} />
                    <meshStandardMaterial color="#0f172a" side={DoubleSide} />
                  </mesh>
                  <group ref={fans[fIdx]}>
                    {[0, 1, 2, 3].map((blade) => (
                      <mesh key={blade} rotation={[0, (blade * Math.PI) / 2, 0]}>
                        <boxGeometry args={[1.7, 0.05, 0.3]} />
                        <meshStandardMaterial color="#0284c7" />
                      </mesh>
                    ))}
                  </group>
                </group>
              ))}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Draggable Acoustic Barrier Wall Piece
 */
function DraggableWall({ item, isSelected, onSelect, onPointerDown }) {
  const height = item.height || 8;
  const length = item.length || 28;
  const rot = ((item.rotation || 0) * Math.PI) / 180;
  const angleDeg = Math.round(((item.rotation || 0) % 360 + 360) % 360);
  const materialConfig = WALL_MATERIALS[item.material] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = item.material === "transparent_acrylic";
  const isGreen = item.material?.startsWith("green_wall");
  const isMasonry = item.material === "masonry_brick";
  const isSteel = item.material === "steel_aluminum";
  const isThickConcrete = item.material === "concrete_thick";
  const isCurved = item.shape === "curved";
  const curveAngleDeg = item.curveAngle || 60;
  const curveAngleRad = (curveAngleDeg * Math.PI) / 180;

  // Wall physical thickness in 3D:
  // Standard 4" ~ 0.45m, 4.5"+ low-freq / masonry ~ 0.58m, living wall with cassettes ~ 0.72m
  const wallThickness = isGreen ? 0.72 : isMasonry || isThickConcrete ? 0.58 : 0.45;

  // Compute curved segments along an arc of total angle curveAngleRad
  const curvedSegments = useMemo(() => {
    if (!isCurved) return [];
    const numSegs = 8;
    const radius = Math.max(14, length / curveAngleRad);
    const segWidth = (radius * curveAngleRad) / numSegs;
    const segs = [];
    for (let i = 0; i < numSegs; i++) {
      const alpha = -curveAngleRad / 2 + (i + 0.5) * (curveAngleRad / numSegs);
      const x = radius * (Math.cos(alpha) - Math.cos(curveAngleRad / 2));
      const z = radius * Math.sin(alpha);
      segs.push({
        x,
        z,
        rotY: -alpha,
        width: segWidth + 0.18,
      });
    }
    return segs;
  }, [isCurved, length, curveAngleRad]);

  const dimensionTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 80;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 400, 80, 12);
    } else {
      ctx.rect(0, 0, 400, 80);
    }
    ctx.fill();
    ctx.strokeStyle = isSelected ? "#38bdf8" : materialConfig.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 20px monospace";
    ctx.fillStyle = isSelected ? "#38bdf8" : "#f1f5f9";
    const shapeText = isCurved ? ` · Arc ${curveAngleDeg}°` : "";
    const titleText = `${materialConfig.shortName || "WALL"}: H=${height}m · ${angleDeg}°${shapeText}`;
    ctx.fillText(titleText, 200, 34);

    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = isSelected ? "#bae6fd" : "#34d399";
    const bonusText = isCurved ? ` (Wrap Shield +2dB)` : "";
    const dropText = materialConfig.soundDropLabel ? `📉 ${materialConfig.soundDropLabel}${bonusText}` : "Acoustic Barrier";
    ctx.fillText(dropText, 200, 60);

    return new CanvasTexture(canvas);
  }, [height, isSelected, materialConfig, angleDeg, isCurved, curveAngleDeg]);

  useEffect(() => () => dimensionTexture.dispose(), [dimensionTexture]);

  return (
    <group
      position={[item.x, 0, item.z]}
      rotation={[0, rot, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onPointerDown(item.id, e);
      }}
    >
      {isSelected && (
        <SelectionRing
          radius={length / 2 + 2}
          label={`${(materialConfig.shortName || "WALL").toUpperCase()} · ${angleDeg}° · DRAGGABLE`}
        />
      )}

      {/* Render Curved Arc or Straight Slab */}
      {isCurved ? (
        <group>
          {curvedSegments.map((seg, idx) => (
            <group key={idx} position={[seg.x, 0, seg.z]} rotation={[0, seg.rotY, 0]}>
              <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[wallThickness, height, seg.width]} />
                <meshStandardMaterial
                  color={isSelected ? "#0284c7" : materialConfig.color}
                  roughness={isTransparent ? 0.05 : isGreen ? 0.88 : isMasonry ? 0.8 : 0.55}
                  metalness={isSteel ? 0.85 : item.material === "absorptive_metal" ? 0.65 : 0.08}
                  transparent={isTransparent}
                  opacity={isTransparent ? 0.45 : 1.0}
                />
              </mesh>
              {/* Joint post */}
              <mesh position={[wallThickness / 2 + 0.06, height / 2, 0]}>
                <boxGeometry args={[0.22, height + 0.2, 0.22]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
              {/* Green wall cassette accents */}
              {isGreen && (
                <mesh position={[wallThickness / 2 + 0.05, height * 0.48, 0]}>
                  <boxGeometry args={[0.1, height * 0.72, seg.width * 0.85]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.95} />
                </mesh>
              )}
            </group>
          ))}
        </group>
      ) : (
        <>
          {/* Main Structural Barrier Slab */}
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[wallThickness, height, length]} />
            <meshStandardMaterial
              color={isSelected ? "#0284c7" : materialConfig.color}
              roughness={isTransparent ? 0.05 : isGreen ? 0.88 : isMasonry ? 0.8 : 0.55}
              metalness={isSteel ? 0.85 : item.material === "absorptive_metal" ? 0.65 : 0.08}
              transparent={isTransparent}
              opacity={isTransparent ? 0.45 : 1.0}
            />
          </mesh>

          {/* Steel H-Beam Foundation Posts */}
          {[-12, -6, 0, 6, 12].map((z) => (
            <mesh key={z} position={[wallThickness / 2 + 0.08, height / 2, z]}>
              <boxGeometry args={[0.26, height + 0.3, 0.26]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
          ))}

          {/* Living Wall Biophilic Foliage Cassettes & Planter Rail */}
          {isGreen && (
            <>
              <mesh position={[0, height + 0.12, 0]}>
                <boxGeometry args={[wallThickness + 0.15, 0.24, length + 0.2]} />
                <meshStandardMaterial color="#14532d" roughness={0.7} />
              </mesh>
              {[-8, -2, 4, 10].map((z) => (
                <mesh key={`green_cassette_${z}`} position={[wallThickness / 2 + 0.06, height * 0.48, z]}>
                  <boxGeometry args={[0.12, height * 0.72, 3.2]} />
                  <meshStandardMaterial color="#16a34a" roughness={0.95} />
                </mesh>
              ))}
            </>
          )}
        </>
      )}

      {/* Dimension & Noise Reduction Floating Sprite */}
      <sprite position={[0, height + 1.9, 0]} scale={[6.8, 1.45, 1]}>
        <spriteMaterial map={dimensionTexture} depthTest={false} />
      </sprite>
    </group>
  );
}

/**
 * Draggable Single Tree (Individual Tree with Location Suitability & Calibrated Sound Drop)
 */
function DraggableSingleTree({ item, isSelected, site, onSelect, onPointerDown }) {
  const height = item.height || 7;
  const species = REGIONAL_TREE_SPECIES[item.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const suitability = getTreeSuitability(item.speciesId, site?.id);

  const dimensionTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 380;
    canvas.height = 84;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 380, 84, 12);
    } else {
      ctx.rect(0, 0, 380, 84);
    }
    ctx.fill();
    ctx.strokeStyle = isSelected ? "#38bdf8" : suitability.color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillStyle = isSelected ? "#38bdf8" : "#f1f5f9";
    ctx.fillText(`${species.icon || "🌲"} ${species.shortName || species.name} (H=${height}m)`, 190, 34);

    ctx.font = "bold 14px monospace";
    ctx.fillStyle = suitability.color;
    ctx.fillText(`${suitability.badge} · ${species.soundDropLabel}`, 190, 62);

    return new CanvasTexture(canvas);
  }, [species, height, isSelected, suitability]);

  useEffect(() => () => dimensionTexture.dispose(), [dimensionTexture]);

  return (
    <group
      position={[item.x, 0, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onPointerDown(item.id, e);
      }}
    >
      {isSelected && (
        <SelectionRing
          radius={3.8}
          label={`${(species.shortName || "TREE").toUpperCase()} · DRAGGABLE`}
        />
      )}

      {/* Porous Ground Mulch Circle (Acoustic Ground Effect) */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.0, 16]} />
        <meshStandardMaterial color="#2d2218" roughness={0.95} />
      </mesh>

      {/* Tree Trunk */}
      <mesh position={[0, height * 0.25, 0]}>
        <cylinderGeometry args={[0.18, 0.32, height * 0.5, 8]} />
        <meshStandardMaterial color={species.trunkColor || "#3e2723"} roughness={0.9} />
      </mesh>

      {/* Foliage Canopy based on species.foliageShape */}
      {species.foliageShape === "columnar" ? (
        // Columnar (Irish Yew)
        <mesh position={[0, height * 0.6, 0]}>
          <cylinderGeometry args={[0.95, 0.95, height * 0.75, 10]} />
          <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.8} />
        </mesh>
      ) : species.foliageShape === "oval" ? (
        // Oval / Broadleaf (Poplar)
        <mesh position={[0, height * 0.65, 0]}>
          <sphereGeometry args={[height * 0.36, 12, 10]} />
          <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.75} />
        </mesh>
      ) : species.foliageShape === "pyramidal" ? (
        // Pyramidal (Arizona Cypress)
        <>
          <mesh position={[0, height * 0.52, 0]}>
            <coneGeometry args={[1.6, height * 0.65, 8]} />
            <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.85} />
          </mesh>
          <mesh position={[0, height * 0.72, 0]}>
            <coneGeometry args={[1.0, height * 0.45, 8]} />
            <meshStandardMaterial color={isSelected ? "#4ade80" : species.color} roughness={0.85} />
          </mesh>
        </>
      ) : species.foliageShape === "tall_conical" ? (
        // Tall Conical (Douglas Fir / Pacific Cedar)
        <>
          <mesh position={[0, height * 0.42, 0]}>
            <coneGeometry args={[2.2, height * 0.45, 8]} />
            <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, height * 0.62, 0]}>
            <coneGeometry args={[1.6, height * 0.42, 8]} />
            <meshStandardMaterial color={isSelected ? "#4ade80" : species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, height * 0.82, 0]}>
            <coneGeometry args={[1.0, height * 0.35, 8]} />
            <meshStandardMaterial color={isSelected ? "#86efac" : species.color} roughness={0.8} />
          </mesh>
        </>
      ) : (
        // Standard Conical (Virginia Pine)
        <>
          <mesh position={[0, height * 0.48, 0]}>
            <coneGeometry args={[1.8, height * 0.55, 8]} />
            <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, height * 0.72, 0]}>
            <coneGeometry args={[1.2, height * 0.45, 8]} />
            <meshStandardMaterial color={isSelected ? "#4ade80" : species.color} roughness={0.8} />
          </mesh>
        </>
      )}

      {/* Floating Info Sprite */}
      <sprite position={[0, height + 1.6, 0]} scale={[6.4, 1.45, 1]}>
        <spriteMaterial map={dimensionTexture} depthTest={false} />
      </sprite>
    </group>
  );
}

/**
 * Draggable Tree Buffer Cluster
 */
function DraggableTreeCluster({ item, isSelected, onSelect, onPointerDown }) {
  const depth = item.depth || 16;
  const species = REGIONAL_TREE_SPECIES[item.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;

  const clusterTrees = useMemo(() => {
    const list = [];
    const count = Math.max(6, Math.min(16, Math.round(depth * 0.7)));
    for (let i = 0; i < count; i++) {
      const offsetX = ((i % 3) - 1) * 3.5 + (((i * 7) % 5) - 2) * 0.8;
      const offsetZ = Math.floor(i / 3) * 4.5 - (count * 1.5) + (((i * 11) % 5) - 2) * 0.8;
      list.push([offsetX, offsetZ]);
    }
    return list;
  }, [depth]);

  return (
    <group
      position={[item.x, 0, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onPointerDown(item.id, e);
      }}
    >
      {isSelected && <SelectionRing radius={depth / 2 + 3} label="TREES · DRAGGABLE" />}

      {clusterTrees.map(([ox, oz], idx) => (
        <group key={idx} position={[ox, 0, oz]}>
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.2, 0.35, 2.4, 8]} />
            <meshStandardMaterial color={species.trunkColor || "#3e2723"} roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.8, 0]}>
            <coneGeometry args={[1.8, 3.8, 8]} />
            <meshStandardMaterial color={isSelected ? "#22c55e" : species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 5.2, 0]}>
            <coneGeometry args={[1.3, 3.0, 8]} />
            <meshStandardMaterial color={isSelected ? "#4ade80" : species.color} roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * Draggable Acoustic Probe (Community Sound Sensor)
 */
function DraggableProbe({ item, isSelected, probeTelemetry, onSelect, onPointerDown }) {
  const probeSprite = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 380;
    canvas.height = 110;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(11, 22, 38, 0.95)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 380, 110, 14);
    } else {
      ctx.rect(0, 0, 380, 110);
    }
    ctx.fill();

    const isComp = probeTelemetry ? probeTelemetry.isCompliant : true;
    ctx.strokeStyle = isComp ? "#34d399" : "#ef4444";
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 34px monospace";
    ctx.fillStyle = isComp ? "#34d399" : "#ef4444";
    const dbaText = probeTelemetry ? `${probeTelemetry.netDba.toFixed(1)} dBA` : "-- dBA";
    ctx.fillText(dbaText, 190, 44);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    const distText = probeTelemetry ? `${probeTelemetry.distanceMeters}m from plant` : "";
    ctx.fillText(distText, 190, 78);

    ctx.font = "14px sans-serif";
    ctx.fillStyle = isComp ? "#a7f3d0" : "#fca5a5";
    const sensText = probeTelemetry ? (isComp ? "✓ Peaceful Sleep" : "⚠️ Loud Complaint Risk") : "";
    ctx.fillText(sensText, 190, 100);

    return new CanvasTexture(canvas);
  }, [probeTelemetry]);

  useEffect(() => () => probeSprite.dispose(), [probeSprite]);

  return (
    <group
      position={[item.x, 0, item.z]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect(item.id);
        onPointerDown(item.id, e);
      }}
    >
      {isSelected && <SelectionRing radius={4} label="SENSOR · DRAGGABLE" />}

      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.2, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={DoubleSide} />
      </mesh>
      <mesh position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 7, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 7.2, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color={probeTelemetry?.isCompliant ? "#34d399" : "#ef4444"}
          emissive={probeTelemetry?.isCompliant ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.9}
        />
      </mesh>
      <sprite position={[0, 9.8, 0]} scale={[7.5, 2.2, 1]}>
        <spriteMaterial map={probeSprite} depthTest={false} transparent />
      </sprite>
    </group>
  );
}

/**
 * Concentric Noise Isophone Heat Rings
 */
function ConcentricNoiseRings({ centerPos, radii }) {
  const getColorForDba = (dba) => {
    if (dba >= 75) return "#ef4444";
    if (dba >= 65) return "#f97316";
    if (dba >= 55) return "#eab308";
    if (dba >= 45) return "#10b981";
    return "#38bdf8";
  };

  return (
    <group position={[centerPos[0], 0.08, centerPos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
      {radii.map((ring, idx) => {
        const color = getColorForDba(ring.targetDba);
        const radius = Math.max(3, ring.radius);
        return (
          <group key={ring.targetDba}>
            <mesh position={[0, 0, 0.005 * (idx + 1)]}>
              <ringGeometry args={[radius - 0.25, radius + 0.25, 64]} />
              <meshBasicMaterial color={color} transparent opacity={0.65} side={DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * WebGL Boundary Fallback
 */
class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8", background: "#0a101d" }}>
        <h3>3D WebGL Spatial Sandbox</h3>
        <p>WebGL initialization paused. Acoustic calculations & audio simulator remain active.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}

/**
 * MASTER 3D INTERACTIVE ACOUSTIC DIGITAL TWIN
 * True-to-scale geographic grounding within 300m radius of the data centers across all sites
 */
export default function AcousticSiteSandbox3D({
  site,
  running,
  itPowerKw = 500,
  fanSpeedPercent = 75,
  timeOfDay = "night",
  onChangeTimeOfDay,
  onOpenReport,
  onUpdateConfig,
}) {
  const [navMode, setNavMode] = useState("orbit");
  const [cameraPreset, setCameraPreset] = useState("reset");
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [hudTelemetryMode, setHudTelemetryMode] = useState("all"); // "all" | "acoustics" | "energy"

  // Dynamic Layout Items per Site
  const [layoutItems, setLayoutItems] = useState(() => [
    {
      id: "chiller_compound",
      type: "chiller",
      x: 2,
      z: 0,
      placement: "side_exposed",
      silencers: false,
      rotation: 0,
    },
    {
      id: "wall_1",
      type: "wall",
      x: -10,
      z: 0,
      height: 8,
      length: 32,
      rotation: 0,
      material: "absorptive_metal",
    },
    {
      id: "tree_1",
      type: "tree_cluster",
      x: -18,
      z: 0,
      depth: 18,
      speciesId: site.recommendedTreeId || "virginia_pine",
    },
    {
      id: "probe_1",
      type: "probe",
      x: -26,
      z: 0,
    },
  ]);

  // When selected site changes, adapt layout items to that site's physics
  useEffect(() => {
    let defaultPlacement = "side_exposed";
    let wallMat = "absorptive_metal";
    let wallH = 8;
    let chX = 2;
    let chZ = 0;
    let prX = -26;
    let prZ = 0;

    if (site.id === "the_dalles_or") {
      defaultPlacement = "rear_shielded";
      wallMat = "absorptive_metal";
      wallH = 8;
      chX = 4;
      chZ = 2;
      prX = -28;
      prZ = 10;
    } else if (site.id === "phoenix_az") {
      defaultPlacement = "semi_berm";
      wallMat = "dense_concrete";
      wallH = 10;
      chX = 2;
      chZ = 0;
      prX = -28;
      prZ = 0;
    } else if (site.id === "dublin_ie") {
      defaultPlacement = "underground";
      wallMat = "mass_timber";
      wallH = 6;
      chX = 2;
      chZ = 0;
      prX = -26;
      prZ = 0;
    }

    setLayoutItems([
      {
        id: "chiller_compound",
        type: "chiller",
        x: chX,
        z: chZ,
        placement: defaultPlacement,
        silencers: site.id === "dublin_ie",
        rotation: 0,
      },
      {
        id: "wall_1",
        type: "wall",
        x: -10,
        z: 0,
        height: wallH,
        length: 32,
        rotation: 0,
        material: wallMat,
      },
      {
        id: "tree_1",
        type: "tree_cluster",
        x: -18,
        z: 0,
        depth: 18,
        speciesId: site.recommendedTreeId || "virginia_pine",
      },
      {
        id: "probe_1",
        type: "probe",
        x: prX,
        z: prZ,
      },
    ]);
    setSelectedId(null);
  }, [site]);

  useEffect(() => {
    const handleUp = () => setIsDragging(null);
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        if (!selectedId.startsWith("chiller") && !selectedId.startsWith("probe")) {
          setLayoutItems((prev) => prev.filter((i) => i.id !== selectedId));
          setSelectedId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  const handleGroundPointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();

    const newX = Math.max(-65, Math.min(50, Math.round(e.point.x)));
    const newZ = Math.max(-65, Math.min(65, Math.round(e.point.z)));

    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === isDragging ? { ...item, x: newX, z: newZ } : item
      )
    );
  };

  const handleGroundPointerUp = () => {
    setIsDragging(null);
  };

  // Add Wall Modal State & Handlers
  const [isAddWallModalOpen, setIsAddWallModalOpen] = useState(false);
  const [selectedWallTypeToAdd, setSelectedWallTypeToAdd] = useState("absorptive_metal");
  const [newWallHeight, setNewWallHeight] = useState(8);
  const [newWallLength, setNewWallLength] = useState(28);
  const [newWallShape, setNewWallShape] = useState("straight");
  const [newWallAngle, setNewWallAngle] = useState(0);
  const [newWallCurveArc, setNewWallCurveArc] = useState(60);

  // Add Single Tree Modal State & Handlers
  const [isAddTreeModalOpen, setIsAddTreeModalOpen] = useState(false);
  const [selectedTreeSpeciesToAdd, setSelectedTreeSpeciesToAdd] = useState(site.recommendedTreeId || "virginia_pine");
  const [newTreeHeight, setNewTreeHeight] = useState(7);

  const handleOpenAddWallModal = () => {
    setIsAddWallModalOpen(true);
  };

  const handleCloseAddWallModal = () => {
    setIsAddWallModalOpen(false);
  };

  const handleConfirmAddWall = (typeOverride, heightOverride, lengthOverride, shapeOverride, angleOverride, arcOverride) => {
    const chosenType = typeOverride || selectedWallTypeToAdd || "absorptive_metal";
    const chosenHeight = heightOverride || newWallHeight || 8;
    const chosenLength = lengthOverride || newWallLength || 28;
    const chosenShape = shapeOverride || newWallShape || "straight";
    const chosenAngle = angleOverride !== undefined ? angleOverride : newWallAngle || 0;
    const chosenArc = arcOverride || newWallCurveArc || 60;

    const newWall = {
      id: `wall_${Date.now()}`,
      type: "wall",
      x: -10,
      z: (Math.random() - 0.5) * 20,
      height: chosenHeight,
      length: chosenLength,
      rotation: chosenAngle,
      shape: chosenShape,
      curveAngle: chosenArc,
      material: chosenType,
    };
    setLayoutItems((prev) => [...prev, newWall]);
    setSelectedId(newWall.id);
    setIsAddWallModalOpen(false);
  };

  const handleOpenAddTreeModal = () => {
    setSelectedTreeSpeciesToAdd(site.recommendedTreeId || "virginia_pine");
    setIsAddTreeModalOpen(true);
  };

  const handleCloseAddTreeModal = () => {
    setIsAddTreeModalOpen(false);
  };

  const handleConfirmAddTree = (speciesOverride, heightOverride) => {
    const chosenSpecies = speciesOverride || selectedTreeSpeciesToAdd || site.recommendedTreeId || "virginia_pine";
    const chosenHeight = heightOverride || newTreeHeight || 7;

    const newTree = {
      id: `tree_${Date.now()}`,
      type: "tree",
      x: -16 + (Math.random() - 0.5) * 6,
      z: (Math.random() - 0.5) * 22,
      speciesId: chosenSpecies,
      height: chosenHeight,
    };
    setLayoutItems((prev) => [...prev, newTree]);
    setSelectedId(newTree.id);
    setIsAddTreeModalOpen(false);
  };

  // Backwards-compatible quick adds
  const handleAddWall = () => {
    handleOpenAddWallModal();
  };

  const handleAddTrees = () => {
    handleOpenAddTreeModal();
  };

  const handleAddTreeCluster = () => {
    const newCluster = {
      id: `cluster_${Date.now()}`,
      type: "tree_cluster",
      x: -18,
      z: (Math.random() - 0.5) * 24,
      depth: 16,
      speciesId: site.recommendedTreeId || "virginia_pine",
    };
    setLayoutItems((prev) => [...prev, newCluster]);
    setSelectedId(newCluster.id);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    if (selectedId.startsWith("chiller") || selectedId.startsWith("probe")) return;
    setLayoutItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelectedItem = (patch) => {
    if (!selectedId) return;
    setLayoutItems((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, ...patch } : item))
    );
  };

  const chiller = layoutItems.find((i) => i.type === "chiller") || {
    x: 2,
    z: 0,
    placement: "side_exposed",
    silencers: false,
    rotation: 0,
  };
  const probe = layoutItems.find((i) => i.type === "probe") || { x: -26, z: 0 };
  const walls = layoutItems.filter((i) => i.type === "wall");
  const singleTrees = layoutItems.filter((i) => i.type === "tree");
  const treeClusters = layoutItems.filter((i) => i.type === "tree_cluster");

  const selectedItem = layoutItems.find((i) => i.id === selectedId);

  // Synthesize up-to-date site configuration from 3D scene elements
  const effectiveConfig = useMemo(() => {
    const hasWalls = walls.length > 0;
    const maxWallHeight = hasWalls ? Math.max(...walls.map((w) => w.height || 8)) : 0;
    // Prefer the material of the currently selected wall if a wall is selected, else primary wall
    const activeWall = (selectedId && walls.find((w) => w.id === selectedId)) || walls[0];
    const wallMaterial = activeWall?.material || "absorptive_metal";
    const wallShape = walls.some((w) => w.shape === "curved") ? "curved" : "straight";
    const wallEnclosure =
      walls.length >= 3 ? "full_4side" : walls.length === 2 ? "u_shape" : "single_east";

    const hasTrees = singleTrees.length > 0 || treeClusters.length > 0;
    const clusterDepth = treeClusters.reduce((sum, t) => sum + (t.depth || 16), 0);
    const singleTreeDepth = singleTrees.reduce((sum, t) => {
      const sp = REGIONAL_TREE_SPECIES[t.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
      return sum + (sp.acousticAbsorptionCoeff / 0.18) * 3.5;
    }, 0);
    const totalTreeDepth = clusterDepth + singleTreeDepth;

    const activeTree = (selectedId && singleTrees.find((t) => t.id === selectedId)) ||
      (selectedId && treeClusters.find((c) => c.id === selectedId)) ||
      singleTrees[0] ||
      treeClusters[0];
    const treeSpeciesId =
      activeTree?.speciesId || site.recommendedTreeId || "virginia_pine";
    const treeArrangement =
      (singleTrees.length + treeClusters.length) >= 2 ? "perimeter_ring" : "east_buffer";

    const dx = probe.x - chiller.x;
    const dz = probe.z - chiller.z;
    const sceneDist = Math.hypot(dx, dz);
    const distanceMeters = Math.max(
      15,
      Math.round((sceneDist / 28) * site.defaultDistanceToHomesMeters)
    );

    return {
      placement: chiller.placement || "side_exposed",
      acousticSilencers: Boolean(chiller.silencers),
      chillerOrientationAngle: chiller.rotation || 0,
      wallEnabled: hasWalls,
      wallHeightMeters: maxWallHeight,
      wallMaterial,
      wallEnclosure,
      wallShape,
      treeEnabled: hasTrees,
      treeBufferDepthMeters: totalTreeDepth,
      treeSpeciesId,
      treeArrangement,
      singleTreeCount: singleTrees.length,
      distanceMeters,
      walls,
      singleTrees,
      treeClusters,
    };
  }, [walls, singleTrees, treeClusters, chiller, probe, site, selectedId]);

  // Synchronize 3D layout state upstream to App and Dashboard
  useEffect(() => {
    if (onUpdateConfig) {
      onUpdateConfig(effectiveConfig);
    }
  }, [effectiveConfig, onUpdateConfig]);

  // REAL-TIME ACOUSTIC CALCULATION USING ISO 9613-2 ENGINE
  const acousticResults = useMemo(() => {
    const evaluation = evaluateSiteAcoustics({
      itPowerKw,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      distanceToHomesMeters: effectiveConfig.distanceMeters,
      municipalNoiseLimitDba: site.municipalNoiseLimitDba,
      daytimeNoiseLimitDba: site.daytimeNoiseLimitDba || 55,
      timeOfDay,
      terrainEchoDb: site.terrainEchoAmplificationDb,
      chillerPlacement: effectiveConfig.placement,
      wallHeightMeters: effectiveConfig.wallHeightMeters,
      wallMaterial: effectiveConfig.wallMaterial,
      wallEnabled: effectiveConfig.wallEnabled,
      wallEnclosure: effectiveConfig.wallEnclosure,
      wallShape: effectiveConfig.wallShape,
      treeBufferDepthMeters: effectiveConfig.treeBufferDepthMeters,
      treeSpeciesId: effectiveConfig.treeSpeciesId,
      treeEnabled: effectiveConfig.treeEnabled,
      treeArrangement: effectiveConfig.treeArrangement,
      singleTreeCount: effectiveConfig.singleTreeCount,
      chillerOrientationAngle: effectiveConfig.chillerOrientationAngle,
      acousticSilencers: effectiveConfig.acousticSilencers,
    });

    return {
      ...evaluation,
      distanceMeters: effectiveConfig.distanceMeters,
      activeLimit: evaluation.activeLegalLimit,
      statusText: evaluation.isCompliant ? "COMPLIANT" : "EXCEEDS LIMIT",
    };
  }, [itPowerKw, site, fanSpeedPercent, timeOfDay, effectiveConfig]);

  // Live facility energy, cooling power, PUE, and carbon calculation
  const energyMetrics = useMemo(() => {
    return calculateEnergyMetrics({
      itPowerKw,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      chillerPlacement: effectiveConfig.placement,
      silencers: effectiveConfig.acousticSilencers,
      siteId: site.id,
      timeOfDay,
    });
  }, [itPowerKw, site, fanSpeedPercent, effectiveConfig.placement, effectiveConfig.acousticSilencers, timeOfDay]);

  // Live Sound Wave Isophone Radii
  const isophoneRadii = useMemo(() => {
    const netDba = acousticResults.netReceivedLp;
    return [
      { targetDba: 75, radius: Math.max(5, Math.min(45, (75 / netDba) * 10)) },
      { targetDba: 65, radius: Math.max(8, Math.min(55, (65 / netDba) * 18)) },
      { targetDba: 55, radius: Math.max(12, Math.min(70, (55 / netDba) * 26)) },
      { targetDba: 45, radius: Math.max(16, Math.min(90, (45 / netDba) * 36)) },
    ];
  }, [acousticResults.netReceivedLp]);

  useEffect(() => {
    if (audioPlaying) {
      acousticSimulator.setDecibels(acousticResults.netReceivedLp);
      acousticSimulator.setTimeOfDay(timeOfDay);
    }
  }, [audioPlaying, acousticResults.netReceivedLp, timeOfDay]);

  const toggleAudio = () => {
    const isNowPlaying = acousticSimulator.toggle();
    setAudioPlaying(isNowPlaying);
    if (isNowPlaying) {
      acousticSimulator.setDecibels(acousticResults.netReceivedLp);
      acousticSimulator.setTimeOfDay(timeOfDay);
    }
  };

  const isNight = timeOfDay === "night";

  return (
    <div className="canvas-interactive-wrapper" style={{ position: "relative", width: "100%", height: "720px" }}>
      {/* 1. CLEAN FLOATING VERTICAL CONTROLS DOCK (LEFT SIDE) */}
      <div className="clean-floating-vertical-dock">
        <div className="vertical-site-badge">
          <div className="badge-title-row">
            <span className="top-site-flag">{site.country === "Ireland" ? "🇮🇪" : "🇺🇸"}</span>
            <span className="top-site-name">{site.name}</span>
          </div>
          <span className="top-site-tag">300M 360° SPATIAL TWIN</span>
        </div>

        <div className="vertical-control-section">
          <span className="vertical-section-label">SIMULATION TIME</span>
          <div className="vertical-time-toggle">
            <button
              className={`time-toggle-btn ${!isNight ? "active" : ""}`}
              onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("day")}
            >
              ☀️ Day
            </button>
            <button
              className={`time-toggle-btn ${isNight ? "active" : ""}`}
              onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("night")}
            >
              🌙 Night
            </button>
          </div>
        </div>

        <div className="vertical-control-section">
          <span className="vertical-section-label">AUDIO RECEPTOR</span>
          <button
            className={`vertical-audio-btn ${audioPlaying ? "playing" : ""}`}
            onClick={toggleAudio}
            title="Click to hear synthesized noise at neighbor's property"
          >
            {audioPlaying ? "🔊 Sound Active" : "🔈 Listen at Sensor"}
          </button>
        </div>

        <div className="vertical-control-section">
          <span className="vertical-section-label">CAMERA PRESETS</span>
          <div className="vertical-camera-group">
            <button className="vertical-cam-btn" onClick={() => setCameraPreset("reset")} title="Expansive 300m Bird's-Eye View">
              ↺ 300m Campus
            </button>
            <button className="vertical-cam-btn" onClick={() => setCameraPreset("feature")} title="Focus on site-specific primary feature">
              {site.id === "the_dalles_or" ? "🌊 River & Canyon" : site.id === "phoenix_az" ? "🏜️ Canal & Desert" : site.id === "dublin_ie" ? "🛶 Grand Canal" : "🛣️ Highway"}
            </button>
            <button className="vertical-cam-btn" onClick={() => setCameraPreset("homes")} title="Focus on Neighborhood Receptors">
              🏡 Homes
            </button>
            <button className="vertical-cam-btn" onClick={() => setCameraPreset("top")} title="Top-down 2D Map Plan View">
              🗺️ 2D Plan
            </button>
          </div>
        </div>
      </div>

      {/* 2. CLEAN FLOATING MULTI-TELEMETRY CARD (ACOUSTICS + ENERGY) */}
      <div className="clean-floating-decibel-card telemetry-multi-card">
        <div className="telemetry-tabs-row">
          <button
            className={`telemetry-tab-pill ${hudTelemetryMode === "all" ? "active" : ""}`}
            onClick={() => setHudTelemetryMode("all")}
            title="Unified Acoustics & Energy View"
          >
            📊 Unified
          </button>
          <button
            className={`telemetry-tab-pill ${hudTelemetryMode === "acoustics" ? "active" : ""}`}
            onClick={() => setHudTelemetryMode("acoustics")}
            title="Acoustic Decibel Monitoring"
          >
            🔊 {acousticResults.netReceivedLp.toFixed(1)} dBA
          </button>
          <button
            className={`telemetry-tab-pill ${hudTelemetryMode === "energy" ? "active" : ""}`}
            onClick={() => setHudTelemetryMode("energy")}
            title="Energy & PUE Monitoring"
          >
            ⚡ PUE {energyMetrics.pue.toFixed(2)}
          </button>
        </div>

        {/* Section A: Acoustic Decibel Monitoring */}
        {(hudTelemetryMode === "acoustics" || hudTelemetryMode === "all") && (
          <div className="telemetry-section acoustics-section">
            <div className="decibel-main-row">
              <span className="decibel-number" style={{ color: acousticResults.statusColor }}>
                {acousticResults.netReceivedLp.toFixed(1)}
              </span>
              <span className="decibel-unit">dBA</span>
              <span
                className="decibel-compliance-pill"
                style={{
                  background: `${acousticResults.statusColor}22`,
                  color: acousticResults.statusColor,
                  borderColor: `${acousticResults.statusColor}66`,
                }}
              >
                {acousticResults.statusText}
              </span>
            </div>
            <div className="decibel-sub-row">
              <span>
                {acousticResults.distanceMeters}m to homes · {timeOfDay === "day" ? "Day" : "Night"} limit:{" "}
                <strong>{acousticResults.activeLimit} dBA</strong>
              </span>
            </div>
          </div>
        )}

        {/* Section B: Energy & PUE Telemetry */}
        {(hudTelemetryMode === "energy" || hudTelemetryMode === "all") && (
          <div className={`telemetry-section energy-section ${hudTelemetryMode === "all" ? "bordered-top" : ""}`}>
            <div className="energy-header-row">
              <div className="energy-stat-pair">
                <span className="energy-stat-label">FACILITY POWER</span>
                <span className="energy-stat-big">{energyMetrics.facilityPowerKw.toFixed(0)} <small>kW</small></span>
              </div>
              <div className="energy-stat-pair">
                <span className="energy-stat-label">PUE BENCHMARK</span>
                <span className="energy-stat-big" style={{ color: energyMetrics.pueColor }}>
                  {energyMetrics.pue.toFixed(2)}
                </span>
              </div>
              <span
                className="energy-rating-badge"
                style={{
                  background: `${energyMetrics.pueColor}22`,
                  color: energyMetrics.pueColor,
                  borderColor: `${energyMetrics.pueColor}66`,
                }}
              >
                {energyMetrics.pueRating.split(" ")[0]}
              </span>
            </div>

            {/* Split Bar: IT Compute vs Chiller Cooling */}
            <div className="energy-bar-track" title={`IT Load: ${energyMetrics.itPowerKw} kW (${energyMetrics.itFractionPercent}%) | Cooling: ${energyMetrics.coolingPowerKw} kW (${energyMetrics.coolingFractionPercent}%)`}>
              <div className="bar-fill-it" style={{ width: `${energyMetrics.itFractionPercent}%` }}></div>
              <div className="bar-fill-cooling" style={{ width: `${energyMetrics.coolingFractionPercent}%` }}></div>
            </div>
            <div className="energy-bar-legend">
              <span>IT: <strong>{energyMetrics.itPowerKw}kW</strong></span>
              <span>Cooling: <strong>{energyMetrics.coolingPowerKw}kW</strong> (COP {energyMetrics.chillerCop})</span>
            </div>

            <div className="energy-eco-footer">
              <span>🌱 <strong>{energyMetrics.hourlyCarbonKg.toFixed(1)}</strong> kg CO₂/h</span>
              <span>·</span>
              <span>💵 <strong>${energyMetrics.hourlyCostUsd.toFixed(2)}</strong>/h</span>
              {energyMetrics.hourlyCostSavedUsd > 0 && (
                <span className="eco-savings-tag" title="Saved compared to 100% full-blast unoptimized fan duty">
                  Save ${energyMetrics.hourlyCostSavedUsd.toFixed(2)}/h
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN 3D THREE.JS CANVAS */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #1e293b",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.4)",
        }}
      >
        <WebGLBoundary>
          <Canvas camera={{ position: [0, 115, 125], fov: 42 }} dpr={[1, 1.5]}>
            <color attach="background" args={[isNight ? "#0c1527" : "#38bdf8"]} />
            <ambientLight intensity={isNight ? 1.5 : 2.2} color={isNight ? "#94a3b8" : "#ffffff"} />
            <directionalLight
              position={isNight ? [-30, 60, -40] : [40, 70, 50]}
              intensity={isNight ? 1.5 : 3.0}
              color={isNight ? "#cbd5e1" : "#fffbeb"}
              castShadow
            />

            {/* Night Lighting */}
            {isNight && (
              <group position={[4, 14, 0]}>
                <pointLight intensity={25} distance={70} color="#f8fafc" />
              </group>
            )}

            {/* Red Dashed 300m Radius Ring */}
            <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <mesh>
                <ringGeometry args={[37.5, 38.2, 64]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.65} side={DoubleSide} />
              </mesh>
            </group>

            {/* Base Interactive Ground Plane */}
            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
              onPointerMove={handleGroundPointerMove}
              onPointerUp={handleGroundPointerUp}
              onPointerDown={(e) => {
                if (e.intersections && e.intersections[0]?.object === e.object) {
                  setSelectedId(null);
                }
              }}
            >
              <planeGeometry args={[360, 300]} />
              <meshStandardMaterial
                color={site.terrainType === "desert_plain" ? (isNight ? "#3b2c1c" : "#7c5836") : site.terrainType === "mountain_canyon" ? (isNight ? "#1f2924" : "#3d4f47") : (isNight ? "#122419" : "#244c2c")}
                roughness={0.92}
              />
            </mesh>

            {/* -------------------------------------------------------------------------
                LOCATION-SPECIFIC 3D GEOGRAPHY (Each site has its own authentic layout!)
                ------------------------------------------------------------------------- */}
            {site.id === "loudoun_va" && <LoudounCampusEnvironment timeOfDay={timeOfDay} />}
            {site.id === "the_dalles_or" && <TheDallesCampusEnvironment timeOfDay={timeOfDay} />}
            {site.id === "phoenix_az" && <PhoenixCampusEnvironment timeOfDay={timeOfDay} />}
            {site.id === "dublin_ie" && <DublinCampusEnvironment timeOfDay={timeOfDay} />}
            {site.id !== "loudoun_va" && site.id !== "the_dalles_or" && site.id !== "phoenix_az" && site.id !== "dublin_ie" && (
              <LoudounCampusEnvironment timeOfDay={timeOfDay} />
            )}

            {/* Draggable Chiller Yard Compound */}
            <DraggableChillerYard
              item={chiller}
              isSelected={selectedId === chiller.id}
              running={running}
              fanSpeedPercent={fanSpeedPercent}
              onSelect={setSelectedId}
              onPointerDown={(id) => setIsDragging(id)}
            />

            {/* Draggable Barrier Walls */}
            {walls.map((wall) => (
              <DraggableWall
                key={wall.id}
                item={wall}
                isSelected={selectedId === wall.id}
                onSelect={setSelectedId}
                onPointerDown={(id) => setIsDragging(id)}
              />
            ))}

            {/* Draggable Single Bio-Acoustic Trees */}
            {singleTrees.map((tree) => (
              <DraggableSingleTree
                key={tree.id}
                item={tree}
                site={site}
                isSelected={selectedId === tree.id}
                onSelect={setSelectedId}
                onPointerDown={(id) => setIsDragging(id)}
              />
            ))}

            {/* Draggable Tree Buffers */}
            {treeClusters.map((trees) => (
              <DraggableTreeCluster
                key={trees.id}
                item={trees}
                isSelected={selectedId === trees.id}
                onSelect={setSelectedId}
                onPointerDown={(id) => setIsDragging(id)}
              />
            ))}

            {/* Draggable Community Sound Sensor */}
            <DraggableProbe
              item={probe}
              isSelected={selectedId === probe.id}
              probeTelemetry={{
                netDba: acousticResults.netReceivedLp,
                distanceMeters: acousticResults.distanceMeters,
                isCompliant: acousticResults.isCompliant,
              }}
              onSelect={setSelectedId}
              onPointerDown={(id) => setIsDragging(id)}
            />

            {/* Concentric Noise Isophone Heat Rings */}
            <ConcentricNoiseRings centerPos={[chiller.x, chiller.z]} radii={isophoneRadii} />

            {/* Camera Controls */}
            <SiteCameraControls
              navMode={navMode}
              cameraPreset={cameraPreset}
              isDragging={isDragging !== null}
            />
          </Canvas>
        </WebGLBoundary>
      </div>

      {/* 4. CONTEXTUAL INSPECTOR PILL */}
      {selectedItem && (
        <div className="clean-floating-inspector-pill animated-slide-up">
          {selectedItem.type === "wall" && (
            <div className="inspector-content-row">
              <span className="inspector-title">🧱 Barrier Wall</span>
              <div className="inspector-actions">
                <span className="inspector-label">Type:</span>
                <select
                  className="inspector-select"
                  value={selectedItem.material || "absorptive_metal"}
                  onChange={(e) => updateSelectedItem({ material: e.target.value })}
                  title="Change barrier wall material & sound drop rating"
                >
                  {Object.values(WALL_MATERIALS).map((mat) => (
                    <option key={mat.id} value={mat.id}>
                      {mat.icon} {mat.shortName} ({mat.soundDropLabel})
                    </option>
                  ))}
                </select>

                <span className="inspector-label">Shape:</span>
                <div className="inspector-toggle-group">
                  <button
                    className={`inspector-pill-choice ${selectedItem.shape !== "curved" ? "active" : ""}`}
                    onClick={() => updateSelectedItem({ shape: "straight" })}
                    title="Straight Barrier Wall"
                  >
                    Straight
                  </button>
                  <button
                    className={`inspector-pill-choice ${selectedItem.shape === "curved" ? "active" : ""}`}
                    onClick={() => updateSelectedItem({ shape: "curved", curveAngle: selectedItem.curveAngle || 60 })}
                    title="Curved Arc Wall (+2dB wrap-around shielding against flanking noise)"
                  >
                    ⌒ Curved (+2dB)
                  </button>
                </div>

                {selectedItem.shape === "curved" && (
                  <>
                    <span className="inspector-label">Arc:</span>
                    <input
                      type="range"
                      min="30"
                      max="120"
                      step="5"
                      value={selectedItem.curveAngle || 60}
                      onChange={(e) => updateSelectedItem({ curveAngle: Number(e.target.value) })}
                      className="inspector-angle-range"
                      title="Curvature arc angle"
                    />
                    <span className="inspector-val">{selectedItem.curveAngle || 60}°</span>
                  </>
                )}

                <span className="inspector-label">Rotation:</span>
                <div className="inspector-angle-control-group">
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step="1"
                    value={Math.round(((selectedItem.rotation || 0) % 360 + 360) % 360)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        updateSelectedItem({ rotation: ((val % 360) + 360) % 360 });
                      }
                    }}
                    className="inspector-angle-number-input"
                    title="Direct angle input (e.g. 56°)"
                  />
                  <span className="inspector-unit">°</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={Math.round(((selectedItem.rotation || 0) % 360 + 360) % 360)}
                    onChange={(e) => updateSelectedItem({ rotation: Number(e.target.value) })}
                    className="inspector-angle-range"
                    title="Slide to rotate wall to any angle (0° - 360°)"
                  />
                  <div className="inspector-angle-chips">
                    {[0, 45, 56, 90, 135, 180].map((deg) => (
                      <button
                        key={deg}
                        className={`angle-chip-btn ${Math.round(((selectedItem.rotation || 0) % 360 + 360) % 360) === deg ? "active" : ""}`}
                        onClick={() => updateSelectedItem({ rotation: deg })}
                        title={`Set angle to ${deg}°`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                <span className="inspector-label">Height:</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ height: Math.max(3, (selectedItem.height || 8) - 1) })}
                  title="Decrease height"
                >
                  −
                </button>
                <span className="inspector-val">{selectedItem.height || 8}m</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ height: Math.min(16, (selectedItem.height || 8) + 1) })}
                  title="Increase height"
                >
                  +
                </button>

                {(() => {
                  const curMat = WALL_MATERIALS[selectedItem.material] || WALL_MATERIALS.absorptive_metal;
                  const wArea = (selectedItem.length || 28) * (selectedItem.height || 8);
                  const isCurvedWall = selectedItem.shape === "curved";
                  const wCost = Math.round(wArea * curMat.costPerSqMeter * (isCurvedWall ? 1.15 : 1.0));
                  return (
                    <div className="inspector-badge-row">
                      <span className="inspector-stat-pill drop" title="Rated sound drop">
                        📉 {curMat.soundDropLabel} {isCurvedWall ? "(+2dB Wrap)" : ""}
                      </span>
                      <span className="inspector-stat-pill cost" title="Estimated section cost">
                        💰 ${wCost.toLocaleString()}
                      </span>
                    </div>
                  );
                })()}

                <button
                  className="inspector-delete-btn"
                  onClick={handleDeleteSelected}
                  title="Delete this barrier wall"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {selectedItem.type === "tree" && (
            <div className="inspector-content-row">
              <span className="inspector-title">🌲 Individual Tree</span>
              <div className="inspector-actions">
                <span className="inspector-label">Species:</span>
                <select
                  className="inspector-select"
                  value={selectedItem.speciesId || site.recommendedTreeId || "virginia_pine"}
                  onChange={(e) => updateSelectedItem({ speciesId: e.target.value })}
                  title="Change tree species"
                >
                  {Object.values(REGIONAL_TREE_SPECIES).map((sp) => {
                    const suit = getTreeSuitability(sp.id, site.id);
                    return (
                      <option key={sp.id} value={sp.id}>
                        {sp.icon} {sp.name} ({sp.soundDropLabel} · {suit.badge})
                      </option>
                    );
                  })}
                </select>

                {(() => {
                  const sp = REGIONAL_TREE_SPECIES[selectedItem.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
                  const suit = getTreeSuitability(sp.id, site.id);
                  return (
                    <span className={`suitability-pill ${suit.badgeClass}`} title={suit.reason}>
                      {suit.badge}
                    </span>
                  );
                })()}

                <span className="inspector-label">Height:</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ height: Math.max(3, (selectedItem.height || 7) - 1) })}
                  title="Decrease height"
                >
                  −
                </button>
                <span className="inspector-val">{selectedItem.height || 7}m</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ height: Math.min(14, (selectedItem.height || 7) + 1) })}
                  title="Increase height"
                >
                  +
                </button>

                {(() => {
                  const sp = REGIONAL_TREE_SPECIES[selectedItem.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
                  return (
                    <div className="inspector-badge-row">
                      <span className="inspector-stat-pill drop" title="Acoustic attenuation per tree row">
                        📉 {sp.soundDropLabel}
                      </span>
                      <span className="inspector-stat-pill cost" title="Specimen planting cost">
                        💰 ${sp.costPerTree}
                      </span>
                    </div>
                  );
                })()}

                <button
                  className="inspector-delete-btn"
                  onClick={handleDeleteSelected}
                  title="Remove this tree"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {selectedItem.type === "tree_cluster" && (
            <div className="inspector-content-row">
              <span className="inspector-title">🌲 Tree Buffer</span>
              <div className="inspector-actions">
                <span className="inspector-label">Depth:</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ depth: Math.max(6, (selectedItem.depth || 16) - 4) })}
                >
                  −
                </button>
                <span className="inspector-val">{selectedItem.depth || 16}m</span>
                <button
                  className="inspector-step-btn"
                  onClick={() => updateSelectedItem({ depth: Math.min(40, (selectedItem.depth || 16) + 4) })}
                >
                  +
                </button>

                <button
                  className="inspector-delete-btn"
                  onClick={handleDeleteSelected}
                  title="Delete this tree cluster"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          )}

          {selectedItem.type === "chiller" && (
            <div className="inspector-content-row">
              <div className="inspector-title-group">
                <span className="inspector-title">🏢 Chiller Yard</span>
                <span className="inspector-telemetry-chip" style={{ color: energyMetrics.pueColor }}>
                  ⚡ {energyMetrics.coolingPowerKw.toFixed(0)} kW Cooling (PUE {energyMetrics.pue.toFixed(2)})
                </span>
              </div>
              <div className="inspector-actions">
                <span className="inspector-label">Placement:</span>
                <button
                  className={`inspector-pill-choice ${selectedItem.placement === "side_exposed" ? "active" : ""}`}
                  onClick={() => updateSelectedItem({ placement: "side_exposed" })}
                >
                  Surface
                </button>
                <button
                  className={`inspector-pill-choice ${selectedItem.placement === "semi_berm" ? "active" : ""}`}
                  onClick={() => updateSelectedItem({ placement: "semi_berm" })}
                >
                  Berm (-11.5dB)
                </button>
                <button
                  className={`inspector-pill-choice ${selectedItem.placement === "underground" ? "active" : ""}`}
                  onClick={() => updateSelectedItem({ placement: "underground" })}
                >
                  Bunker (-28dB)
                </button>

                <button
                  className={`inspector-tool-btn ${selectedItem.silencers ? "active" : ""}`}
                  onClick={() => updateSelectedItem({ silencers: !selectedItem.silencers })}
                >
                  {selectedItem.silencers ? "✓ Silencers (-5.5dB)" : "+ Silencers"}
                </button>
              </div>
            </div>
          )}

          {selectedItem.type === "probe" && (
            <div className="inspector-content-row">
              <span className="inspector-title">📍 Community Sensor</span>
              <div className="inspector-actions">
                <span className="inspector-hint">Drag anywhere across the neighborhood to measure noise</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. CLEAN FLOATING BOTTOM DOCK */}
      <div className="clean-floating-dock">
        <button
          className={`dock-btn ${navMode === "orbit" ? "active" : ""}`}
          onClick={() => setNavMode(navMode === "orbit" ? "pan" : "orbit")}
          title="Toggle camera Orbit vs Pan"
        >
          <span className="dock-icon">{navMode === "orbit" ? "🔄" : "✋"}</span>
          <span className="dock-label">{navMode === "orbit" ? "Orbit 3D" : "Pan 2D"}</span>
        </button>

        <div className="dock-divider"></div>

        <button className="dock-btn primary" onClick={handleOpenAddWallModal} title="Add a new sound barrier wall (straight or curved, any angle)">
          <span className="dock-icon">🧱</span>
          <span className="dock-label">+ Add Wall</span>
        </button>

        <button className="dock-btn primary" onClick={handleOpenAddTreeModal} title="Plant individual bio-acoustic trees with site suitability rating">
          <span className="dock-icon">🌲</span>
          <span className="dock-label">+ Plant Tree</span>
        </button>

        <button className="dock-btn" onClick={handleAddTreeCluster} title="Plant a dense multi-row tree buffer band">
          <span className="dock-icon">🌳</span>
          <span className="dock-label">+ Tree Buffer</span>
        </button>

        {selectedItem && selectedItem.type !== "chiller" && selectedItem.type !== "probe" && (
          <button className="dock-btn danger" onClick={handleDeleteSelected} title="Delete selected object (Delete key)">
            <span className="dock-icon">🗑️</span>
            <span className="dock-label">Delete</span>
          </button>
        )}

        <div className="dock-divider"></div>

        <button
          className="dock-btn"
          onClick={() => {
            setLayoutItems([
              { id: "chiller_compound", type: "chiller", x: 2, z: 0, placement: "side_exposed", silencers: false, rotation: 0 },
              { id: "wall_1", type: "wall", x: -10, z: 0, height: 8, length: 32, rotation: 0, shape: "straight", material: "absorptive_metal" },
              { id: "tree_1", type: "tree_cluster", x: -18, z: 0, depth: 18, speciesId: site.recommendedTreeId || "virginia_pine" },
              { id: "probe_1", type: "probe", x: -26, z: 0 },
            ]);
            setSelectedId(null);
          }}
          title="Reset elements to initial positions"
        >
          <span className="dock-icon">↺</span>
          <span className="dock-label">Reset</span>
        </button>

        {onOpenReport && (
          <button
            className="dock-btn highlight"
            onClick={() => onOpenReport(effectiveConfig)}
            title="Open detailed engineering link budget"
          >
            <span className="dock-icon">📊</span>
            <span className="dock-label">Pro Details</span>
          </button>
        )}
      </div>

      {/* 6. ADD ACOUSTIC BARRIER WALL MODAL */}
      {isAddWallModalOpen && (
        <div className="report-modal-overlay animated-fadeIn" onClick={handleCloseAddWallModal}>
          <div
            className="wall-picker-modal-dialog animated-popIn"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="wall-picker-header">
              <div className="wall-picker-title-row">
                <span className="wall-picker-icon">🧱</span>
                <div>
                  <h3 className="wall-picker-title">Select Acoustic Barrier Wall Type</h3>
                  <p className="wall-picker-subtitle">
                    Select barrier material, sound drop rating, shape (straight or curved arc), and orientation angle
                  </p>
                </div>
              </div>
              <button className="wall-picker-close-btn" onClick={handleCloseAddWallModal} title="Close">
                ✕
              </button>
            </div>

            {/* Source Reference Banner */}
            <div className="wall-picker-source-banner">
              <span className="source-banner-icon">📖</span>
              <div className="source-banner-text">
                <strong>Empirical Industrial Noise Standards:</strong> Barrier sound drop ratings and frequency dampening specifications based on{" "}
                <a
                  href="https://www.lsars.com/data-center-noise"
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  LSARS Data Center Noise Research (lsars.com/data-center-noise)
                </a>
              </div>
            </div>

            {/* Wall Types Selection Grid */}
            <div className="wall-picker-grid">
              {Object.values(WALL_MATERIALS).map((mat) => {
                const isSelected = selectedWallTypeToAdd === mat.id;
                return (
                  <div
                    key={mat.id}
                    className={`wall-card-option ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedWallTypeToAdd(mat.id)}
                  >
                    <div className="wall-card-top">
                      <span className="wall-card-icon">{mat.icon}</span>
                      <div className="wall-card-headline">
                        <h4 className="wall-card-name">{mat.name}</h4>
                        <span className="wall-card-cat">{mat.category}</span>
                      </div>
                      <span className="wall-card-drop-badge">{mat.soundDropLabel}</span>
                    </div>

                    <p className="wall-card-desc">{mat.description}</p>

                    <div className="wall-card-specs-row">
                      <span className="spec-item">
                        <strong>Thickness:</strong> {mat.typicalThickness}
                      </span>
                      <span className="spec-item">
                        <strong>NRC:</strong> {mat.nrcRating}
                      </span>
                      <span className="spec-item">
                        <strong>Unit Cost:</strong> ${mat.costPerSqMeter}/m²
                      </span>
                    </div>

                    <div className="wall-card-freq-note">
                      <small>💡 {mat.frequencyNote}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Config & Preview Strip */}
            {(() => {
              const activeMat = WALL_MATERIALS[selectedWallTypeToAdd] || WALL_MATERIALS.absorptive_metal;
              const area = newWallLength * newWallHeight;
              const isCurved = newWallShape === "curved";
              const cost = Math.round(area * activeMat.costPerSqMeter * (isCurved ? 1.15 : 1.0));
              const carbon = Math.round(area * activeMat.embodiedCarbonKgPerSqMeter);

              return (
                <div className="wall-picker-footer-bar">
                  <div className="wall-config-controls">
                    <label className="config-control-label">
                      <span>Shape:</span>
                      <div className="modal-shape-strip">
                        <button
                          type="button"
                          className={`modal-chip-btn ${newWallShape === "straight" ? "active" : ""}`}
                          onClick={() => setNewWallShape("straight")}
                        >
                          Straight
                        </button>
                        <button
                          type="button"
                          className={`modal-chip-btn ${newWallShape === "curved" ? "active" : ""}`}
                          onClick={() => setNewWallShape("curved")}
                          title="Curved arc wall (+2 dB wrap-around diffraction shielding)"
                        >
                          ⌒ Curved (+2dB)
                        </button>
                      </div>
                    </label>

                    <label className="config-control-label">
                      <span>Angle:</span>
                      <div className="modal-angle-input-box">
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={newWallAngle}
                          onChange={(e) => setNewWallAngle(Number(e.target.value) || 0)}
                          className="modal-number-ctrl"
                        />
                        <span className="modal-unit">°</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          step="1"
                          value={newWallAngle}
                          onChange={(e) => setNewWallAngle(Number(e.target.value))}
                          className="modal-range-ctrl"
                        />
                      </div>
                    </label>

                    {newWallShape === "curved" && (
                      <label className="config-control-label">
                        <span>Arc:</span>
                        <select
                          value={newWallCurveArc}
                          onChange={(e) => setNewWallCurveArc(Number(e.target.value))}
                          className="modal-select-ctrl"
                        >
                          <option value={45}>45° Gentle Curve</option>
                          <option value={60}>60° Standard Arc</option>
                          <option value={90}>90° Enclosing Horseshoe</option>
                        </select>
                      </label>
                    )}

                    <label className="config-control-label">
                      <span>Height:</span>
                      <select
                        value={newWallHeight}
                        onChange={(e) => setNewWallHeight(Number(e.target.value))}
                        className="modal-select-ctrl"
                      >
                        {[4, 6, 8, 10, 12, 14, 16].map((h) => (
                          <option key={h} value={h}>
                            {h} meters ({Math.round(h * 3.28)} ft)
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="config-control-label">
                      <span>Length:</span>
                      <select
                        value={newWallLength}
                        onChange={(e) => setNewWallLength(Number(e.target.value))}
                        className="modal-select-ctrl"
                      >
                        {[20, 28, 36, 44].map((l) => (
                          <option key={l} value={l}>
                            {l} meters ({Math.round(l * 3.28)} ft)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="wall-live-preview-stats">
                    <div className="stat-pill">
                      <span>Sound Drop:</span>
                      <strong className="text-emerald">
                        📉 {activeMat.soundDropLabel} {isCurved ? "(+2dB Wrap)" : ""}
                      </strong>
                    </div>
                    <div className="stat-pill">
                      <span>Estimated CAPEX:</span>
                      <strong className="text-sky">💰 ${cost.toLocaleString()}</strong>
                    </div>
                    <div className="stat-pill">
                      <span>CO₂ Footprint:</span>
                      <strong className="text-amber">🌱 {carbon.toLocaleString()} kg</strong>
                    </div>
                  </div>

                  <div className="wall-modal-action-btns">
                    <button className="wall-modal-btn cancel" onClick={handleCloseAddWallModal}>
                      Cancel
                    </button>
                    <button
                      className="wall-modal-btn confirm"
                      onClick={() =>
                        handleConfirmAddWall(
                          selectedWallTypeToAdd,
                          newWallHeight,
                          newWallLength,
                          newWallShape,
                          newWallAngle,
                          newWallCurveArc
                        )
                      }
                    >
                      Add Wall to Site 🧱
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 7. ADD BIO-ACOUSTIC TREE MODAL (INDIVIDUAL PLANTING WITH SITE SUITABILITY) */}
      {isAddTreeModalOpen && (
        <div className="report-modal-overlay animated-fadeIn" onClick={handleCloseAddTreeModal}>
          <div
            className="tree-picker-modal-dialog animated-popIn"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="wall-picker-header">
              <div className="wall-picker-title-row">
                <span className="wall-picker-icon">🌲</span>
                <div>
                  <h3 className="wall-picker-title">Plant Individual Bio-Acoustic Tree</h3>
                  <p className="wall-picker-subtitle">
                    Plant one tree at a time precisely where needed. Acoustic absorption and climate suitability are evaluated for <strong>{site.name}</strong>.
                  </p>
                </div>
              </div>
              <button className="wall-picker-close-btn" onClick={handleCloseAddTreeModal} title="Close">
                ✕
              </button>
            </div>

            {/* Site Climate Context Banner */}
            <div className="tree-site-climate-banner">
              <div className="climate-banner-flag">{site.country === "Ireland" ? "🇮🇪" : "🇺🇸"}</div>
              <div className="climate-banner-info">
                <strong>Current Campus Environment: {site.name} ({site.region})</strong>
                <p>
                  Terrain: <em>{site.terrainType.replace("_", " ")}</em> · Municipal Noise Limit: <em>{site.municipalNoiseLimitDba} dBA</em>.
                  Species adapted to this climate survive without costly irrigation and provide year-round acoustic canopy density.
                </p>
              </div>
            </div>

            {/* Tree Species Selection Grid */}
            <div className="tree-picker-grid">
              {Object.values(REGIONAL_TREE_SPECIES).map((sp) => {
                const isSelected = selectedTreeSpeciesToAdd === sp.id;
                const suit = getTreeSuitability(sp.id, site.id);
                return (
                  <div
                    key={sp.id}
                    className={`tree-card-option ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedTreeSpeciesToAdd(sp.id)}
                  >
                    <div className="tree-card-top">
                      <span className="tree-card-icon">{sp.icon}</span>
                      <div className="tree-card-headline">
                        <h4 className="tree-card-name">{sp.name}</h4>
                        <span className="tree-card-botanical">{sp.botanicalName}</span>
                      </div>
                      <span className={`tree-card-suitability-badge ${suit.badgeClass}`} style={{ borderColor: suit.color }}>
                        {suit.badge}
                      </span>
                    </div>

                    {/* Suitability Note / Alert */}
                    <div className="tree-suitability-note-box" style={{ borderLeftColor: suit.color }}>
                      <span className="suitability-note-icon">
                        {suit.status === "optimal" ? "✨" : suit.status === "compatible" ? "🌱" : "⚠️"}
                      </span>
                      <span className="suitability-note-text">{suit.reason}</span>
                    </div>

                    <div className="tree-card-specs-row">
                      <span className="spec-item">
                        <strong>Sound Drop:</strong> <span className="spec-highlight">📉 {sp.soundDropLabel}</span>
                      </span>
                      <span className="spec-item">
                        <strong>Water:</strong> {sp.waterUsageGalPerAcre.toLocaleString()} gal/ac/yr
                      </span>
                      <span className="spec-item">
                        <strong>Specimen Cost:</strong> ${sp.costPerTree}
                      </span>
                      <span className="spec-item">
                        <strong>Growth:</strong> {sp.growthRate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tree Modal Footer */}
            {(() => {
              const activeTree = REGIONAL_TREE_SPECIES[selectedTreeSpeciesToAdd] || REGIONAL_TREE_SPECIES.virginia_pine;
              const suit = getTreeSuitability(activeTree.id, site.id);

              return (
                <div className="tree-picker-footer-bar">
                  <div className="tree-config-controls">
                    <label className="config-control-label">
                      <span>Tree Height:</span>
                      <select
                        value={newTreeHeight}
                        onChange={(e) => setNewTreeHeight(Number(e.target.value))}
                        className="modal-select-ctrl"
                      >
                        {[5, 6, 7, 8, 9, 10, 12].map((h) => (
                          <option key={h} value={h}>
                            {h} meters ({Math.round(h * 3.28)} ft mature canopy)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="tree-live-preview-stats">
                    <div className="stat-pill">
                      <span>Suitability:</span>
                      <strong style={{ color: suit.color }}>{suit.badge}</strong>
                    </div>
                    <div className="stat-pill">
                      <span>Acoustic Drop:</span>
                      <strong className="text-emerald">📉 {activeTree.soundDropLabel}</strong>
                    </div>
                    <div className="stat-pill">
                      <span>Planting Cost:</span>
                      <strong className="text-sky">💰 ${activeTree.costPerTree}</strong>
                    </div>
                  </div>

                  <div className="wall-modal-action-btns">
                    <button className="wall-modal-btn cancel" onClick={handleCloseAddTreeModal}>
                      Cancel
                    </button>
                    <button
                      className="wall-modal-btn confirm"
                      onClick={() => handleConfirmAddTree(selectedTreeSpeciesToAdd, newTreeHeight)}
                    >
                      Plant Tree on Site 🌲
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
