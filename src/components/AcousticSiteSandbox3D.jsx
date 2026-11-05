import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";

/**
 * Camera Navigation with Smooth Orbit and Pan
 * Expansive framing so the entire 300m radius (North, South, East Highway, West Neighborhood) is in full view
 */
function SiteCameraControls({ navMode, cameraPreset, isDragging }) {
  const { camera, gl } = useThree();
  const orbitRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 0, 0);
    controls.minDistance = 15;
    controls.maxDistance = 320;
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

  // Camera presets
  useEffect(() => {
    if (!orbitRef.current) return;
    if (cameraPreset === "reset") {
      camera.position.set(0, 115, 125);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 160, 0.01);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "highway") {
      camera.position.set(40, 42, 60);
      orbitRef.current.target.set(38, 0, 0);
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

/**
 * Authentic 360-Degree Ground Terrain & Surroundings
 * Fully simulates everything in the 300-meter / 1,000-foot radius matching satellite map:
 * - EAST: Route 28 Multi-Lane Highway with traffic, median barrier, overpass, and curved on-ramp
 * - WEST: Curving suburban residential avenue, cul-de-sac, and 20+ two-story homes
 * - NORTH: Curved Waxpool perimeter road, riparian stream, and pine buffer
 * - SOUTH: Electrical transformer substation and southern campus access road
 * - Red dashed 300m boundary ring matching satellite map
 */
function RealisticCampusTerrain({ site, timeOfDay, onGroundPointerMove, onGroundPointerUp, onDeselect }) {
  const isNight = timeOfDay === "night";

  const terrainColor = useMemo(() => {
    if (site.terrainType === "desert_plain") return isNight ? "#3b2c1c" : "#7c5836";
    if (site.terrainType === "mountain_canyon") return isNight ? "#1f2924" : "#3d4f47";
    return isNight ? "#122419" : "#244c2c";
  }, [site.terrainType, isNight]);

  return (
    <group position={[0, -0.05, 0]}>
      {/* 1. Main Base Terrain Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerMove={onGroundPointerMove}
        onPointerUp={onGroundPointerUp}
        onPointerDown={(e) => {
          if (e.intersections && e.intersections[0]?.object === e.object) {
            onDeselect();
          }
        }}
      >
        <planeGeometry args={[360, 300]} />
        <meshStandardMaterial color={terrainColor} roughness={0.92} />
      </mesh>

      {/* 2. Red Dashed 300m Boundary Ring (Exact 1:1 match with satellite map circle) */}
      <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[37.5, 38.2, 64]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.65} side={DoubleSide} />
        </mesh>
      </group>

      {/* 3. Data Center Central Campus Pad & Paved Access Roads */}
      <group position={[2, 0.02, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[52, 72]} />
          <meshStandardMaterial color="#2b3544" roughness={0.7} />
        </mesh>
        {/* Perimeter Asphalt Service Loop */}
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

      {/* 4. EAST: ROUTE 28 MULTI-LANE HIGHWAY CORRIDOR (Inside 300m Radius at x = 38) */}
      <group position={[38, 0.03, 0]}>
        {/* 4-Lane Divided Highway Pavement */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 240]} />
          <meshStandardMaterial color="#141a24" roughness={0.8} />
        </mesh>
        {/* Concrete Center Jersey Safety Barrier */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.7, 1.0, 240]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {/* White Dashed Lane Lines and Yellow Solid Edge Lines */}
        {[-4, 4].map((hx) => (
          <mesh key={hx} position={[hx, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.25, 230]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        ))}
        {[-7.5, 7.5].map((hx) => (
          <mesh key={hx} position={[hx, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.3, 230]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.75} />
          </mesh>
        ))}

        {/* Sweeping Curved On/Off Ramp from Northeast */}
        <group position={[-10, 0.01, -30]} rotation={[0, -Math.PI / 6, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8, 60]} />
            <meshStandardMaterial color="#161f2c" roughness={0.8} />
          </mesh>
        </group>

        {/* Green Overhead Highway Directional Sign Gantry */}
        <group position={[0, 0, -15]}>
          <mesh position={[-7.5, 3.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[7.5, 3.5, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 7, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.8} />
          </mesh>
          <mesh position={[0, 7.0, 0]}>
            <boxGeometry args={[16, 0.4, 0.4]} />
            <meshStandardMaterial color="#64748b" />
          </mesh>
          {/* Green Highway Signboards */}
          <mesh position={[-3.5, 5.8, 0.2]}>
            <boxGeometry args={[5.5, 2.0, 0.1]} />
            <meshStandardMaterial color="#065f46" roughness={0.3} />
          </mesh>
          <mesh position={[3.5, 5.8, 0.2]}>
            <boxGeometry args={[5.5, 2.0, 0.1]} />
            <meshStandardMaterial color="#065f46" roughness={0.3} />
          </mesh>
        </group>

        {/* Moving/Parked Cars and Semi-Trucks on Highway */}
        {[
          { x: -4, z: -45, color: "#dc2626", type: "sedan" },
          { x: -4, z: -10, color: "#0284c7", type: "truck" },
          { x: -4, z: 25, color: "#ffffff", type: "suv" },
          { x: 4, z: -30, color: "#10b981", type: "sedan" },
          { x: 4, z: 8, color: "#eab308", type: "truck" },
          { x: 4, z: 40, color: "#475569", type: "sedan" },
        ].map((car, idx) => (
          <group key={idx} position={[car.x, 0.65, car.z]}>
            <mesh>
              <boxGeometry args={[car.type === "truck" ? 2.6 : 2.0, car.type === "truck" ? 2.2 : 1.1, car.type === "truck" ? 8.0 : 3.4]} />
              <meshStandardMaterial color={car.color} metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* High-Mast Highway Light Poles */}
        {[-60, -20, 20, 60].map((lz) => (
          <group key={lz} position={[0, 0, lz]}>
            <mesh position={[0, 6, 0]}>
              <cylinderGeometry args={[0.08, 0.12, 12, 8]} />
              <meshStandardMaterial color="#64748b" metalness={0.9} />
            </mesh>
            <mesh position={[0, 12, 0]}>
              <boxGeometry args={[2.5, 0.2, 0.4]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            {isNight && (
              <pointLight position={[0, 12, 0]} intensity={8} distance={28} color="#fef08a" />
            )}
          </group>
        ))}
      </group>

      {/* 5. NORTH: CURVED WAXPOOL ROAD & RIPARIAN CREEK BUFFER */}
      <group position={[0, 0.02, -45]}>
        {/* Curved East-West Northern Perimeter Parkway */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[140, 10]} />
          <meshStandardMaterial color="#161f2c" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[130, 0.25]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
        </mesh>

        {/* Meandering Blue Stream Creek */}
        <mesh position={[-15, -0.005, -10]} rotation={[-Math.PI / 2, 0, 0.1]}>
          <planeGeometry args={[120, 7]} />
          <meshStandardMaterial color="#0369a1" roughness={0.2} metalness={0.6} transparent opacity={0.8} />
        </mesh>
      </group>

      {/* 6. SOUTHEAST: STORMWATER RETENTION DETENTION POND */}
      <group position={[24, 0, 32]}>
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[18, 0.8, 20]} />
          <meshStandardMaterial color="#142b1a" roughness={0.95} />
        </mesh>
        <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[16, 18]} />
          <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.75} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* 7. SOUTH: HIGH-VOLTAGE SUBSTATION YARD (Transformer Banks & Lattice Towers) */}
      <group position={[14, 0.02, 48]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 22]} />
          <meshStandardMaterial color="#475569" roughness={0.95} />
        </mesh>
        {/* Steel Lattice Transmission Tower */}
        <group position={[-10, 0, 0]}>
          <mesh position={[0, 7, 0]}>
            <cylinderGeometry args={[0.3, 1.6, 14, 4]} />
            <meshStandardMaterial color="#94a3b8" wireframe />
          </mesh>
          <mesh position={[0, 12, 0]}>
            <boxGeometry args={[5, 0.3, 0.3]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        </group>
        {/* 3 Step-Down Transformers */}
        {[-4, 4, 10].map((tx) => (
          <group key={tx} position={[tx, 0, 0]}>
            <mesh position={[0, 2.0, 0]}>
              <boxGeometry args={[4.2, 4.0, 4.2]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
            <mesh position={[0, 4.8, 0]}>
              <cylinderGeometry args={[0.15, 0.22, 1.6, 8]} />
              <meshStandardMaterial color="#b45309" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * 3 Angled Hyperscale Compute Buildings (Footprint Matching Satellite Map)
 */
function HyperscaleTripleCampus() {
  const buildingHeight = 7.5;
  const angleRad = (22 * Math.PI) / 180;

  return (
    <group position={[2, 0, -2]} rotation={[0, -angleRad, 0]}>
      {/* BUILDING 1: NORTH COMPUTE HALL */}
      <group position={[0, 0, -20]}>
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
        {/* Rooftop CRAH HVAC Units */}
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
      </group>

      {/* BUILDING 2: CENTRAL COMPUTE HALL */}
      <group position={[0, 0, 0]}>
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
        <mesh position={[0, buildingHeight + 1.2, 0]}>
          <boxGeometry args={[24, 1.8, 0.2]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      </group>

      {/* BUILDING 3: SOUTH COMPUTE HALL & CORPORATE FRONT */}
      <group position={[0, 0, 20]}>
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
        {/* Blue Glass Corporate Entrance */}
        <mesh position={[0, 3.2, 6.7]}>
          <boxGeometry args={[13, 4.6, 0.3]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} transparent opacity={0.75} />
        </mesh>
        {/* Modern Cantilevered Entrance Canopy */}
        <mesh position={[0, 4.4, 8.2]}>
          <boxGeometry args={[15, 0.35, 3.0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Loading Docks with Parked Semi-Trailers */}
        {[-7, 0, 7].map((dockX, idx) => (
          <group key={dockX} position={[dockX, 2.0, -6.7]}>
            <mesh>
              <boxGeometry args={[3.8, 3.6, 0.2]} />
              <meshStandardMaterial color="#334155" metalness={0.7} />
            </mesh>
            {idx === 1 && (
              <group position={[0, 0.2, -6.0]}>
                <mesh>
                  <boxGeometry args={[3.0, 3.4, 10.5]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.4} />
                </mesh>
                <mesh position={[0, -1.6, 0]}>
                  <boxGeometry args={[2.8, 0.25, 10.2]} />
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
              </group>
            )}
          </group>
        ))}
      </group>

      {/* Backup Diesel Generator Yard (West Side) */}
      <group position={[-18, 0, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[5.5, 0.3, 38]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {[-14, -6, 2, 10, 18].map((gz) => (
          <group key={gz} position={[0, 0.3, gz]}>
            <mesh position={[0, 1.5, 0]}>
              <boxGeometry args={[4.6, 2.6, 3.2]} />
              <meshStandardMaterial color="#374151" metalness={0.7} />
            </mesh>
            <mesh position={[1.4, 3.6, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 2.2, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Authentic Curving Suburban Residential Neighborhood (West Boundary)
 */
function CurvingResidentialNeighborhood({ site, timeOfDay }) {
  const isNight = timeOfDay === "night";
  const windowColor = isNight ? "#fef08a" : "#94a3b8";
  const windowEmissive = isNight ? "#eab308" : "#000000";
  const windowIntensity = isNight ? 1.4 : 0.0;

  const housePositions = useMemo(() => {
    const list = [];
    const sidingPalette = ["#f8fafc", "#e2e8f0", "#e5dcd3", "#cbd5e1", "#f1f5f9", "#e2d2b8", "#dbeafe"];
    const roofPalette = ["#334155", "#1e293b", "#475569", "#374151", "#4a3c31", "#1e293b", "#334155"];
    const carPalette = ["#dc2626", "#0284c7", "#475569", "#ffffff", "#10b981", "#eab308", "#1e293b"];

    for (let z = -55; z <= 55; z += 12) {
      const curveX = -32 - Math.sin((z + 10) * 0.035) * 8;

      list.push({
        id: `h_east_${z}`,
        x: curveX + 8,
        z: z,
        rotY: -Math.PI / 2,
        siding: sidingPalette[Math.abs(Math.round(z)) % sidingPalette.length],
        roof: roofPalette[Math.abs(Math.round(z)) % roofPalette.length],
        car: carPalette[Math.abs(Math.round(z * 3)) % carPalette.length],
      });

      list.push({
        id: `h_west_${z}`,
        x: curveX - 8,
        z: z + 3,
        rotY: Math.PI / 2,
        siding: sidingPalette[(Math.abs(Math.round(z)) + 2) % sidingPalette.length],
        roof: roofPalette[(Math.abs(Math.round(z)) + 1) % roofPalette.length],
        car: carPalette[(Math.abs(Math.round(z * 5)) + 1) % carPalette.length],
      });
    }

    for (let cx = -44; cx >= -64; cx -= 9) {
      list.push({
        id: `h_cul_${cx}`,
        x: cx,
        z: cx === -64 ? 4 : cx % 2 === 0 ? 12 : -4,
        rotY: cx === -64 ? 0 : cx % 2 === 0 ? Math.PI : 0,
        siding: sidingPalette[Math.abs(cx) % sidingPalette.length],
        roof: roofPalette[Math.abs(cx) % roofPalette.length],
        car: carPalette[Math.abs(cx * 2) % carPalette.length],
      });
    }

    return list;
  }, []);

  return (
    <group>
      {/* Curving Suburban Paved Street */}
      {[-50, -35, -20, -5, 10, 25, 40, 55].map((segmentZ) => {
        const segX = -32 - Math.sin((segmentZ + 10) * 0.035) * 8;
        return (
          <group key={segmentZ} position={[segX, 0.02, segmentZ]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[9, 18]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh position={[-5.0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.4, 18]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.22, 17]} />
              <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
            </mesh>
            {/* Streetlight */}
            <group position={[-5.6, 0, 0]}>
              <mesh position={[0, 2.6, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 5.2, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} />
              </mesh>
              <mesh position={[0.4, 5.2, 0]} rotation={[0, 0, -Math.PI / 6]}>
                <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
                <meshStandardMaterial color="#64748b" />
              </mesh>
              {isNight && (
                <pointLight position={[0.8, 5.4, 0]} intensity={9} distance={20} color="#fef08a" />
              )}
            </group>
          </group>
        );
      })}

      {/* Cul-de-Sac Branch Road */}
      <group position={[-52, 0.02, 4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[24, 8.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[-11, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[8.5, 24]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      </group>

      {/* Suburban Homes */}
      {housePositions.map((h) => (
        <group key={h.id} position={[h.x, 0, h.z]} rotation={[0, h.rotY, 0]}>
          <mesh position={[-3.2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[8.0, 10]} />
            <meshStandardMaterial color={site.terrainType === "desert_plain" ? "#4a3520" : "#1a4623"} />
          </mesh>
          <mesh position={[-2.8, 0.035, 2.6]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[6.0, 2.6]} />
            <meshStandardMaterial color="#64748b" roughness={0.85} />
          </mesh>
          <group position={[-2.5, 0.65, 2.6]}>
            <mesh>
              <boxGeometry args={[2.8, 1.1, 1.6]} />
              <meshStandardMaterial color={h.car} roughness={0.3} metalness={0.7} />
            </mesh>
          </group>
          <mesh position={[1.6, 2.4, 0]}>
            <boxGeometry args={[6.8, 4.8, 8.0]} />
            <meshStandardMaterial color={h.siding} roughness={0.65} />
          </mesh>
          <mesh position={[1.6, 5.6, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[5.5, 5.5, 8.4]} />
            <meshStandardMaterial color={h.roof} roughness={0.8} />
          </mesh>
          <mesh position={[-1.75, 2.5, 1.8]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
              color={windowColor}
              emissive={windowEmissive}
              emissiveIntensity={windowIntensity}
              side={DoubleSide}
            />
          </mesh>
          <mesh position={[-1.75, 2.5, -1.8]}>
            <planeGeometry args={[1.3, 1.3]} />
            <meshStandardMaterial
              color={windowColor}
              emissive={windowEmissive}
              emissiveIntensity={windowIntensity}
              side={DoubleSide}
            />
          </mesh>
        </group>
      ))}
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

      {/* Equipment Pad */}
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
  const materialConfig = WALL_MATERIALS[item.material] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = item.material === "transparent_acrylic";

  const dimensionTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 70;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 300, 70, 10);
    } else {
      ctx.rect(0, 0, 300, 70);
    }
    ctx.fill();
    ctx.strokeStyle = isSelected ? "#38bdf8" : "#64748b";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 26px monospace";
    ctx.fillStyle = isSelected ? "#38bdf8" : "#f1f5f9";
    ctx.fillText(`WALL: H = ${height}.0m`, 150, 44);

    return new CanvasTexture(canvas);
  }, [height, isSelected]);

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
      {isSelected && <SelectionRing radius={length / 2 + 2} label="WALL · DRAGGABLE" />}

      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.55, height, length]} />
        <meshStandardMaterial
          color={isSelected ? "#0284c7" : materialConfig.color}
          roughness={isTransparent ? 0.05 : 0.6}
          metalness={item.material === "absorptive_metal" ? 0.7 : 0.1}
          transparent={isTransparent}
          opacity={isTransparent ? 0.45 : 1.0}
        />
      </mesh>

      {[-12, -6, 0, 6, 12].map((z) => (
        <mesh key={z} position={[0.3, height / 2, z]}>
          <boxGeometry args={[0.35, height + 0.3, 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      <sprite position={[0, height + 1.8, 0]} scale={[6.0, 1.4, 1]}>
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
 * True-to-scale geographic grounding within 300m radius of the data centers
 */
export default function AcousticSiteSandbox3D({
  site,
  running,
  itPowerKw = 500,
  fanSpeedPercent = 75,
  timeOfDay = "night",
  onChangeTimeOfDay,
  onOpenReport,
}) {
  const [navMode, setNavMode] = useState("orbit"); // "orbit" | "pan"
  const [cameraPreset, setCameraPreset] = useState("reset");
  const [selectedId, setSelectedId] = useState(null);
  const [isDragging, setIsDragging] = useState(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Layout Items (Chillers in campus core, Homes to the West at x=-26)
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

  // Reset layout when site changes
  useEffect(() => {
    setLayoutItems([
      {
        id: "chiller_compound",
        type: "chiller",
        x: site.id === "the_dalles_or" ? 18 : 2,
        z: 0,
        placement: site.id === "the_dalles_or" ? "rear_shielded" : "side_exposed",
        silencers: site.id === "dublin_ie",
        rotation: 0,
      },
      {
        id: "wall_1",
        type: "wall",
        x: -10,
        z: 0,
        height: site.id === "phoenix_az" ? 10 : 8,
        length: 32,
        rotation: 0,
        material: site.id === "the_dalles_or" ? "mass_timber" : "absorptive_metal",
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

  const handleAddWall = () => {
    const newWall = {
      id: `wall_${Date.now()}`,
      type: "wall",
      x: -10,
      z: (Math.random() - 0.5) * 24,
      height: 8,
      length: 28,
      rotation: 0,
      material: "absorptive_metal",
    };
    setLayoutItems((prev) => [...prev, newWall]);
    setSelectedId(newWall.id);
  };

  const handleAddTrees = () => {
    const newTrees = {
      id: `tree_${Date.now()}`,
      type: "tree_cluster",
      x: -18,
      z: (Math.random() - 0.5) * 24,
      depth: 16,
      speciesId: site.recommendedTreeId || "virginia_pine",
    };
    setLayoutItems((prev) => [...prev, newTrees]);
    setSelectedId(newTrees.id);
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
  const treeClusters = layoutItems.filter((i) => i.type === "tree_cluster");

  const selectedItem = layoutItems.find((i) => i.id === selectedId);

  // REAL-TIME ACOUSTIC CALCULATION
  const acousticResults = useMemo(() => {
    const tempPenalty = Math.max(0, (site.ambientTempC - 20) * 0.4);
    const fanRatio = Math.max(0.2, fanSpeedPercent / 100);
    const fanSpeedPenalty = 18 * Math.log10(fanRatio / 0.75);
    const powerScale = 10 * Math.log10(Math.max(100, itPowerKw) / 500);
    const baseLw = 108.0;
    const sourceLw = baseLw + tempPenalty + fanSpeedPenalty + powerScale;

    // Distance from chiller to probe
    const dx = probe.x - chiller.x;
    const dz = probe.z - chiller.z;
    const sceneDist = Math.hypot(dx, dz);
    const distanceMeters = Math.max(15, Math.round((sceneDist / 28) * site.defaultDistanceToHomesMeters));
    const distanceDecay = 20 * Math.log10(distanceMeters) + 11;

    // Building Shielding
    let buildingShieldingDb = 0;
    if (chiller.x > 14 && probe.x < -10) {
      buildingShieldingDb = 17.5;
    }

    // Placement Attenuation
    let placementAttenDb = 0;
    if (chiller.placement === "underground") placementAttenDb = 28.0;
    else if (chiller.placement === "semi_berm") placementAttenDb = 11.5;
    else if (chiller.placement === "rear_shielded") placementAttenDb = 18.0;

    // Intervening Barrier Walls
    let wallAttenDb = 0;
    const minX = Math.min(chiller.x, probe.x);
    const maxX = Math.max(chiller.x, probe.x);

    walls.forEach((w) => {
      if (w.x > minX && w.x < maxX && Math.abs(w.z - (chiller.z + probe.z) / 2) < (w.length || 28) / 2 + 8) {
        const mat = WALL_MATERIALS[w.material] || WALL_MATERIALS.absorptive_metal;
        const thisWallDb = 4.2 + (w.height || 8) * 1.1 + (mat.nrcRating || 0.95) * 2.8;
        wallAttenDb += thisWallDb;
      }
    });
    wallAttenDb = Math.min(24.0, wallAttenDb);

    // Intervening Tree Buffers
    let treeAttenDb = 0;
    treeClusters.forEach((t) => {
      if (t.x > minX && t.x < maxX && Math.abs(t.z - (chiller.z + probe.z) / 2) < (t.depth || 16) + 10) {
        const spec = REGIONAL_TREE_SPECIES[t.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
        const thisTreeDb = (t.depth || 16) * (spec.acousticAbsorptionCoeff || 0.18) * 2.0;
        treeAttenDb += thisTreeDb;
      }
    });
    treeAttenDb = Math.min(14.0, treeAttenDb);

    const silencerDb = chiller.silencers ? 5.5 : 0;
    const directivityDb = (chiller.rotation || 0) >= 135 ? 4.0 : 0;
    const inversionDb = timeOfDay === "night" ? 1.8 : -1.2;
    const terrainEchoDb = site.terrainEchoAmplificationDb || 0;

    const totalMitigationDb =
      distanceDecay +
      buildingShieldingDb +
      placementAttenDb +
      wallAttenDb +
      treeAttenDb +
      silencerDb +
      directivityDb -
      inversionDb -
      terrainEchoDb;

    const netReceivedLp = Math.max(25, sourceLw - totalMitigationDb);
    const activeLimit =
      timeOfDay === "day"
        ? site.daytimeNoiseLimitDba || 55
        : site.municipalNoiseLimitDba;
    const isCompliant = netReceivedLp <= activeLimit;

    return {
      sourceLw: Math.round(sourceLw * 10) / 10,
      netReceivedLp: Math.round(netReceivedLp * 10) / 10,
      distanceMeters,
      activeLimit,
      isCompliant,
      statusColor: isCompliant ? "#34d399" : "#ef4444",
      statusText: isCompliant ? "COMPLIANT" : "EXCEEDS LIMIT",
    };
  }, [chiller, probe, walls, treeClusters, site, fanSpeedPercent, itPowerKw, timeOfDay]);

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

  // Audio Simulator
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
      {/* 1. CLEAN FLOATING TOP HEADER */}
      <div className="clean-floating-top-bar">
        <div className="top-site-badge">
          <span className="top-site-flag">{site.country === "Ireland" ? "🇮🇪" : "🇺🇸"}</span>
          <span className="top-site-name">{site.name}</span>
          <span className="top-site-tag">300M 360° SPATIAL TWIN</span>
        </div>

        <div className="top-time-toggle">
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
            🌙 Night Curfew
          </button>
        </div>

        <button
          className={`top-audio-btn ${audioPlaying ? "playing" : ""}`}
          onClick={toggleAudio}
          title="Click to hear synthesized noise at neighbor's property"
        >
          {audioPlaying ? "🔊 Sound Active" : "🔈 Listen at Sensor"}
        </button>

        {/* View Presets Bar (Full 300m, East Highway, West Homes, 2D Plan) */}
        <div className="top-camera-group">
          <button className="top-cam-btn" onClick={() => setCameraPreset("reset")} title="Expansive 300m Bird's-Eye View">
            ↺ 300m Campus
          </button>
          <button className="top-cam-btn" onClick={() => setCameraPreset("highway")} title="Focus East on Route 28 Highway">
            🛣️ Highway
          </button>
          <button className="top-cam-btn" onClick={() => setCameraPreset("homes")} title="Focus West on Residential Subdivision">
            🏡 Homes
          </button>
          <button className="top-cam-btn" onClick={() => setCameraPreset("top")} title="Top-down 2D Map Plan View">
            🗺️ 2D Plan
          </button>
        </div>
      </div>

      {/* 2. CLEAN FLOATING DECIBEL STATUS CARD */}
      <div className="clean-floating-decibel-card">
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
            {acousticResults.distanceMeters}m from plant · {timeOfDay === "day" ? "Day" : "Night"} limit:{" "}
            <strong>{acousticResults.activeLimit} dBA</strong>
          </span>
        </div>
        <div className="decibel-hint">
          {acousticResults.isCompliant ? "✓ Safe nocturnal sleep sanctuary" : "⚠️ Violates municipal noise ordinance"}
        </div>
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
          {/* Default Camera Framed to Fit Complete 300m Radius (Center 0, 115, 125, FOV 42) */}
          <Canvas camera={{ position: [0, 115, 125], fov: 42 }} dpr={[1, 1.5]}>
            <color attach="background" args={[isNight ? "#0c1527" : "#38bdf8"]} />
            <ambientLight intensity={isNight ? 1.5 : 2.2} color={isNight ? "#94a3b8" : "#ffffff"} />
            <directionalLight
              position={isNight ? [-30, 60, -40] : [40, 70, 50]}
              intensity={isNight ? 1.5 : 3.0}
              color={isNight ? "#cbd5e1" : "#fffbeb"}
              castShadow
            />

            {/* Night Architectural Lighting */}
            {isNight && (
              <group position={[4, 14, 0]}>
                <pointLight intensity={25} distance={70} color="#f8fafc" />
              </group>
            )}

            {/* Authentic Ground Terrain (Highway East, Neighborhood West, Roads, Retention Basin) */}
            <RealisticCampusTerrain
              site={site}
              timeOfDay={timeOfDay}
              onGroundPointerMove={handleGroundPointerMove}
              onGroundPointerUp={handleGroundPointerUp}
              onDeselect={() => setSelectedId(null)}
            />

            {/* 3 Angled Hyperscale Compute Buildings (Satellite Map Footprint) */}
            <HyperscaleTripleCampus />

            {/* Curving Suburban Residential Subdivision (West Boundary within 300m) */}
            <CurvingResidentialNeighborhood site={site} timeOfDay={timeOfDay} />

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

            {/* Draggable Community Sound Sensor (West Neighborhood Receptor) */}
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

            {/* Orbit / Pan Camera Navigation */}
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

                <button
                  className="inspector-tool-btn"
                  onClick={() => updateSelectedItem({ rotation: ((selectedItem.rotation || 0) + 90) % 180 })}
                  title="Rotate wall 90 degrees"
                >
                  ⟳ Rotate
                </button>

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
              <span className="inspector-title">🏢 Chiller Yard</span>
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

        <button className="dock-btn primary" onClick={handleAddWall} title="Add a new sound barrier wall">
          <span className="dock-icon">🧱</span>
          <span className="dock-label">+ Add Wall</span>
        </button>

        <button className="dock-btn primary" onClick={handleAddTrees} title="Plant a bio-acoustic tree screen">
          <span className="dock-icon">🌲</span>
          <span className="dock-label">+ Plant Trees</span>
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
              { id: "wall_1", type: "wall", x: -10, z: 0, height: 8, length: 32, rotation: 0, material: "absorptive_metal" },
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
          <button className="dock-btn highlight" onClick={onOpenReport} title="Open detailed engineering link budget">
            <span className="dock-icon">📊</span>
            <span className="dock-label">Pro Details</span>
          </button>
        )}
      </div>
    </div>
  );
}
