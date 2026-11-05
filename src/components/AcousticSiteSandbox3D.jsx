import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../simulation/datacenterSites.js";
import { calculateNoiseAtPoint, calculateIsophoneRadii } from "../simulation/acoustics.js";

/**
 * Camera Navigation Controls with Orbit, Pan, and Focus Presets
 */
function SiteCameraControls({ navMode, cameraPreset }) {
  const { camera, gl } = useThree();
  const orbitRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 3, 0);
    controls.minDistance = 8;
    controls.maxDistance = 250;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
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

  // Switch between Orbit (left-click rotates) and Pan (left-click pans)
  useEffect(() => {
    if (!orbitRef.current) return;
    if (navMode === "pan") {
      orbitRef.current.mouseButtons = {
        LEFT: 2, // Pan
        MIDDLE: 1, // Dolly
        RIGHT: 0, // Rotate
      };
    } else {
      orbitRef.current.mouseButtons = {
        LEFT: 0, // Rotate
        MIDDLE: 1, // Dolly
        RIGHT: 2, // Pan
      };
    }
  }, [navMode]);

  // Handle camera position presets
  useEffect(() => {
    if (!orbitRef.current) return;
    if (cameraPreset === "reset") {
      camera.position.set(34, 42, 60);
      orbitRef.current.target.set(0, 3, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 110, 0.01);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "plant") {
      camera.position.set(14, 16, 24);
      orbitRef.current.target.set(2, 3, 0);
    } else if (cameraPreset === "homes") {
      camera.position.set(42, 20, 32);
      orbitRef.current.target.set(48, 3, 0);
    }
    orbitRef.current.update();
  }, [cameraPreset, camera]);

  return null;
}

/**
 * 360-Degree Ground Terrain & Campus Infrastructure
 */
function Ground({ terrainType, timeOfDay }) {
  let groundColor = "#122316";
  let gridColor = "#1f3a25";

  if (terrainType === "desert_plain") {
    groundColor = timeOfDay === "day" ? "#5a4128" : "#2b1e13";
    gridColor = "#6e5132";
  } else if (terrainType === "mountain_canyon") {
    groundColor = timeOfDay === "day" ? "#2a3330" : "#141c19";
    gridColor = "#394742";
  } else if (terrainType === "coastal_rolling") {
    groundColor = timeOfDay === "day" ? "#143a22" : "#0d2616";
    gridColor = "#1c4f2f";
  }

  return (
    <group position={[0, -0.05, 0]}>
      {/* 360 Landscape Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[320, 260]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} />
      </mesh>
      <gridHelper args={[320, 64, gridColor, gridColor]} position={[0, 0.01, 0]} />

      {/* Asphalt Campus Ring Road (Encircles the facility for emergency & maintenance access) */}
      <mesh position={[-16, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[72, 76]} />
        <meshStandardMaterial color="#182230" roughness={0.7} />
      </mesh>

      {/* Concrete Equipment Yard Pad */}
      <mesh position={[-16, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[56, 58]} />
        <meshStandardMaterial color="#2d3748" roughness={0.65} />
      </mesh>

      {/* Visitor & Staff Parking Bays (South of Main Office Entrance) */}
      <mesh position={[-16, 0.035, 26]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Authentic 360-Degree Surroundings
 * (North: River / Roads; East: Residential Neighborhoods; South: Arterial Highway; West: Substation)
 */
function SurroundingLandscape({ site, timeOfDay }) {
  const isNight = timeOfDay === "night";
  const windowColor = isNight ? "#fef08a" : "#94a3b8";
  const windowEmissive = isNight ? "#eab308" : "#000000";
  const windowIntensity = isNight ? 1.0 : 0.0;

  return (
    <group>
      {/* =========================================================================
          EAST BOUNDARY: REAL RESIDENTIAL SUBDIVISION (Pitched Homes, Lawns, Curbs)
          ========================================================================= */}
      <group position={[48, 0, 0]}>
        {/* Neighborhood Paved Street */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 130]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 125]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
        </mesh>

        {/* Rows of Suburban Homes along Property Boundary */}
        {[-48, -32, -16, 0, 16, 32, 48].map((z, idx) => (
          <group key={z} position={[12, 0, z]}>
            {/* Front Lawn */}
            <mesh position={[-4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[8, 13]} />
              <meshStandardMaterial color={site.terrainType === "desert_plain" ? "#4a3520" : "#1b4324"} />
            </mesh>

            {/* House Body */}
            <mesh position={[2, 2.4, 0]}>
              <boxGeometry args={[7.5, 4.8, 8.5]} />
              <meshStandardMaterial
                color={site.terrainType === "desert_plain" ? "#e2d2b8" : idx % 2 === 0 ? "#f8fafc" : "#e2e8f0"}
                roughness={0.7}
              />
            </mesh>

            {/* Pitched Gable Roof */}
            <mesh position={[2, 5.8, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[5.8, 5.8, 9.2]} />
              <meshStandardMaterial
                color={site.terrainType === "desert_plain" ? "#b45309" : "#334155"}
                roughness={0.8}
              />
            </mesh>

            {/* Windows (Warm golden glow at night) */}
            <mesh position={[-1.8, 2.5, 2]}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshStandardMaterial
                color={windowColor}
                emissive={windowEmissive}
                emissiveIntensity={windowIntensity}
                side={DoubleSide}
              />
            </mesh>
            <mesh position={[-1.8, 2.5, -2]}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshStandardMaterial
                color={windowColor}
                emissive={windowEmissive}
                emissiveIntensity={windowIntensity}
                side={DoubleSide}
              />
            </mesh>

            {/* Driveway & Parked Car */}
            <mesh position={[-3, 0.035, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[6, 3.2]} />
              <meshStandardMaterial color="#334155" roughness={0.9} />
            </mesh>
            <mesh position={[-2.5, 0.7, 3.2]}>
              <boxGeometry args={[3.2, 1.2, 1.8]} />
              <meshStandardMaterial
                color={idx % 3 === 0 ? "#dc2626" : idx % 3 === 1 ? "#0284c7" : "#475569"}
                roughness={0.4}
                metalness={0.6}
              />
            </mesh>

            {/* Streetlamp on Curb */}
            <group position={[-7.5, 0, 0]}>
              <mesh position={[0, 2.8, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 5.6, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.8} />
              </mesh>
              <mesh position={[0.4, 5.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
                <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
                <meshStandardMaterial color="#64748b" />
              </mesh>
              {isNight && (
                <pointLight position={[0.8, 5.8, 0]} intensity={8} distance={18} color="#fef08a" />
              )}
            </group>
          </group>
        ))}
      </group>

      {/* =========================================================================
          SOUTH BOUNDARY: 4-LANE ARTERIAL HIGHWAY (Waxpool Rd / Route 28 Corridor)
          ========================================================================= */}
      <group position={[-16, 0, 56]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[200, 14]} />
          <meshStandardMaterial color="#18202f" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[200, 0.9, 0.6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {[-3.5, 3.5].map((laneZ) => (
          <mesh key={laneZ} position={[0, 0.035, laneZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[190, 0.25]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          WEST BOUNDARY: UTILITY HIGH-VOLTAGE SUBSTATION & TRANSFORMER BANK
          ========================================================================= */}
      <group position={[-56, 0, 0]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[26, 48]} />
          <meshStandardMaterial color="#334155" roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[26, 3, 48]} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.35} />
        </mesh>
        {[-14, 0, 14].map((transZ) => (
          <group key={transZ} position={[0, 0, transZ]}>
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[5.5, 4.4, 5.5]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.4} />
            </mesh>
            {[-2.9, 2.9].map((rx) => (
              <mesh key={rx} position={[rx, 2.2, 0]}>
                <boxGeometry args={[0.3, 3.8, 4.8]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
            ))}
            {[-1.5, 0, 1.5].map((bx) => (
              <mesh key={bx} position={[bx, 5.2, 0]}>
                <cylinderGeometry args={[0.15, 0.22, 1.8, 8]} />
                <meshStandardMaterial color="#b45309" roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* =========================================================================
          SITE SPECIFIC: COLUMBIA RIVER & BASALT CANYON BLUFFS (THE DALLES, OR)
          ========================================================================= */}
      {site.id === "the_dalles_or" && (
        <group>
          {/* North: The Columbia River Expanse */}
          <group position={[0, 0, -60]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[280, 50]} />
              <meshStandardMaterial
                color="#0f2b48"
                roughness={0.2}
                metalness={0.4}
                transparent
                opacity={0.88}
              />
            </mesh>
            <mesh position={[0, 0.1, 25]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[280, 4]} />
              <meshStandardMaterial color="#2d3748" roughness={0.95} />
            </mesh>
          </group>

          {/* South: Towering Basalt Canyon Cliffs */}
          <group position={[0, 0, 78]}>
            {[-80, -45, -10, 25, 60, 95].map((cx) => (
              <group key={cx} position={[cx, 0, 0]}>
                <mesh position={[0, 10, 0]}>
                  <boxGeometry args={[36, 20, 18]} />
                  <meshStandardMaterial color="#1e2930" roughness={0.95} />
                </mesh>
                <mesh position={[0, 24, 6]}>
                  <boxGeometry args={[30, 18, 14]} />
                  <meshStandardMaterial color="#151e24" roughness={0.95} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* =========================================================================
          SITE SPECIFIC: DESERT CORRIDOR (CHANDLER / PHOENIX, AZ)
          ========================================================================= */}
      {site.id === "phoenix_az" && (
        <group>
          {[[-35, -28], [25, -35], [42, 28], [-42, 38], [15, 38]].map(([cx, cz], i) => (
            <group key={i} position={[cx, 0, cz]}>
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.3, 0.35, 6, 8]} />
                <meshStandardMaterial color="#2e5a44" roughness={0.9} />
              </mesh>
              <mesh position={[-0.8, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 1.4, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
              <mesh position={[0.8, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 1.4, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * Authentic Hyperscale Data Center Building
 * Inspired by Google, Digital Realty, and Equinix campuses on 3D maps:
 * - Precast white concrete with architectural reveal bands
 * - Glass curtain-wall corporate front entrance
 * - Loading dock bays with yellow bumpers
 * - Dedicated backup diesel generator yard with silencers
 * - Insulated chilled water supply/return piping manifolds
 */
function DataCenterBuilding({ explodedProgress = 0, buildingStyle = "1story" }) {
  const roofLift = 14 * explodedProgress;
  const is2Story = buildingStyle === "2story";
  const buildingHeight = is2Story ? 10.5 : 7.2;

  return (
    <group position={[-18, 0, 0]}>
      {/* =========================================================================
          MAIN COMPUTE HALL STRUCTURE
          ========================================================================= */}
      {/* Precast Insulated Concrete Walls with Reveal Lines */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[28, buildingHeight, 36]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Dark Architectural Corporate Banding */}
      <mesh position={[0, buildingHeight * 0.75, 0]}>
        <boxGeometry args={[28.2, 0.9, 36.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* Front Entrance (South): Tinted Glass Curtain Wall & Entrance Canopy */}
      <group position={[0, 0, 18.2]}>
        <mesh position={[0, 3, 0]}>
          <boxGeometry args={[14, 4.5, 0.3]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
        </mesh>
        {/* Entrance Metal Canopy */}
        <mesh position={[0, 4.2, 1.8]}>
          <boxGeometry args={[16, 0.4, 3.6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
      </group>

      {/* Industrial Loading Dock Bay (North Facade) */}
      <group position={[0, 0, -18.2]}>
        {[-6, 0, 6].map((dockX) => (
          <group key={dockX} position={[dockX, 2.2, 0]}>
            {/* Roll-up Dock Door */}
            <mesh>
              <boxGeometry args={[3.8, 3.6, 0.2]} />
              <meshStandardMaterial color="#475569" metalness={0.7} />
            </mesh>
            {/* Yellow Rubber Dock Bumpers */}
            <mesh position={[-1.7, -1.6, 0.2]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>
            <mesh position={[1.7, -1.6, 0.2]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>
          </group>
        ))}
      </group>

      {/* Roof Parapet System (Lifts in Exploded View) */}
      <group position={[0, buildingHeight + roofLift, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[28.4, 0.6, 36.4]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Rooftop Parapet Acoustic Louver Screen */}
        <mesh position={[0, 1.2, 18]}>
          <boxGeometry args={[28.4, 1.4, 0.3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0, 1.2, -18]}>
          <boxGeometry args={[28.4, 1.4, 0.3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>

      {/* =========================================================================
          BACKUP DIESEL GENERATOR YARD (West of Building)
          ========================================================================= */}
      <group position={[-20, 0, 0]}>
        {/* Concrete Generator Pad */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[8, 0.3, 28]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* 4 Weatherproof Sound-Attenuated Diesel Generators with Exhaust Stacks */}
        {[-9, -3, 3, 9].map((genZ) => (
          <group key={genZ} position={[0, 0.3, genZ]}>
            {/* Generator Acoustic Enclosure */}
            <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[5.2, 2.8, 3.4]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Vertical Silver Exhaust Muffler Silencer Stack */}
            <mesh position={[1.8, 4.0, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 2.4, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          CHILLED WATER SUPPLY & RETURN PIPING MANIFOLD (Entering Building)
          ========================================================================= */}
      <group position={[14.2, 1.6, 0]}>
        {/* Blue: Chilled Water Supply (CHWS) */}
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 2.4, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} />
        </mesh>
        {/* Green: Chilled Water Return (CHWR) */}
        <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.3, 0.3, 2.4, 16]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 400-Ton V-Bank Industrial Air-Cooled Chiller Unit
 */
function VBankChillerUnit({ position, running, fanSpeedPercent, acousticSilencers }) {
  const fans = [useRef(), useRef(), useRef(), useRef()];

  useFrame((_, delta) => {
    if (!running) return;
    const rot = delta * (fanSpeedPercent / 100) * 22;
    fans.forEach((f) => {
      if (f.current) f.current.rotation.y += rot;
    });
  });

  return (
    <group position={position}>
      {/* Structural Steel Equipment Skid Base */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4.8, 0.8, 8.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Twin-Screw Compressors (Mechanical Noise Source) */}
      <group position={[0, 1.1, -1.8]}>
        {[-1.2, 1.2].map((cx) => (
          <group key={cx} position={[cx, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 2.8, 16]} />
              <meshStandardMaterial
                color={acousticSilencers ? "#064e3b" : "#2563eb"}
                metalness={0.7}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* V-Bank Condenser Aluminum Coils */}
      <mesh position={[-1.2, 2.5, 0]} rotation={[0, 0, Math.PI / 8]}>
        <boxGeometry args={[0.3, 3.2, 7.8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>
      <mesh position={[1.2, 2.5, 0]} rotation={[0, 0, -Math.PI / 8]}>
        <boxGeometry args={[0.3, 3.2, 7.8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} />
      </mesh>

      {/* 4 High-Flow Axial Condenser Fans */}
      <group position={[0, 4.2, 0]}>
        {[
          [-1.1, -2.2],
          [1.1, -2.2],
          [-1.1, 2.2],
          [1.1, 2.2],
        ].map(([fx, fz], idx) => (
          <group key={idx} position={[fx, 0, fz]}>
            <mesh>
              <cylinderGeometry args={[1.05, 1.05, 0.6, 16, 1, true]} />
              <meshStandardMaterial color="#0f172a" side={DoubleSide} />
            </mesh>
            <group ref={fans[idx]}>
              {[0, 1, 2, 3, 4].map((blade) => (
                <mesh key={blade} rotation={[0, (blade * Math.PI) / 2.5, 0]}>
                  <boxGeometry args={[1.8, 0.05, 0.3]} />
                  <meshStandardMaterial color="#0284c7" />
                </mesh>
              ))}
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Chiller Mechanical Compound with Structural Housekeeping Pads
 */
function ChillerYard({
  placement,
  running,
  fanSpeedPercent,
  orientationAngle,
  compoundOffset = [0, 0],
  acousticSilencers = false,
}) {
  let yardX = 2 + compoundOffset[0];
  let yardY = 0;
  let yardZ = compoundOffset[1];

  if (placement === "rear_shielded") {
    yardX = -38 + compoundOffset[0];
  } else if (placement === "rooftop") {
    yardX = -18 + compoundOffset[0];
    yardY = 8.5;
  } else if (placement === "underground") {
    yardY = -5.5;
  } else if (placement === "semi_berm") {
    yardY = -2.2;
  }

  const radAngle = (orientationAngle * Math.PI) / 180;

  return (
    <group position={[yardX, yardY, yardZ]}>
      {/* Concrete Dunnage Housekeeping Pad */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[14, 0.3, 26]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Subterranean Excavation Bunker Walls */}
      {placement === "underground" && (
        <group>
          <mesh position={[8, 3, 0]}>
            <boxGeometry args={[0.8, 6, 28]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-8, 3, 0]}>
            <boxGeometry args={[0.8, 6, 28]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 3, 14]}>
            <boxGeometry args={[16, 6, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 3, -14]}>
            <boxGeometry args={[16, 6, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {/* 3 Modular Chiller Units */}
      <group rotation={[0, radAngle, 0]}>
        {[-8.5, 0, 8.5].map((chillerZ, idx) => (
          <VBankChillerUnit
            key={idx}
            position={[0, 0, chillerZ]}
            running={running}
            fanSpeedPercent={fanSpeedPercent}
            acousticSilencers={acousticSilencers}
          />
        ))}
      </group>
    </group>
  );
}

/**
 * Multi-Sided Acoustic Barrier Wall with Real-Time 3D Height Tag
 */
function AcousticBarrierWall({
  enabled,
  heightMeters = 8,
  materialId = "absorptive_metal",
  placement,
  wallEnclosure = "single_east",
}) {
  if (!enabled || heightMeters <= 0) return null;

  const materialConfig = WALL_MATERIALS[materialId] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = materialId === "transparent_acrylic";

  let wallX = 10;
  let wallY = 0;
  let wallZ = 0;

  if (placement === "rear_shielded") {
    wallX = -46;
  } else if (placement === "rooftop") {
    wallX = -9;
    wallY = 8.5;
  }

  // Floating 3D Dimension Tag
  const dimensionTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 384, 96, 14);
    } else {
      ctx.rect(0, 0, 384, 96);
    }
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 26px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`H = ${heightMeters}.0m WALL`, 192, 38);

    ctx.font = "bold 17px sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText(`${materialConfig.name.split(" ")[0]} (NRC: ${materialConfig.nrcRating})`, 192, 70);

    return new CanvasTexture(canvas);
  }, [heightMeters, materialConfig]);

  useEffect(() => () => dimensionTexture.dispose(), [dimensionTexture]);

  return (
    <group position={[wallX, wallY, wallZ]}>
      {/* East Face Wall */}
      <mesh position={[0, heightMeters / 2, 0]}>
        <boxGeometry args={[0.45, heightMeters, 32]} />
        <meshStandardMaterial
          color={materialConfig.color}
          roughness={isTransparent ? 0.05 : 0.6}
          metalness={materialId === "absorptive_metal" ? 0.7 : 0.1}
          transparent={isTransparent}
          opacity={isTransparent ? 0.45 : 1.0}
        />
      </mesh>

      {/* Structural Steel Columns */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <mesh key={z} position={[0.28, heightMeters / 2, z]}>
          <boxGeometry args={[0.35, heightMeters + 0.3, 0.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* U-Shaped Return Wings (North & South) */}
      {(wallEnclosure === "u_shape" || wallEnclosure === "full_4side") && (
        <group>
          <mesh position={[-7, heightMeters / 2, -16]}>
            <boxGeometry args={[14, heightMeters, 0.45]} />
            <meshStandardMaterial
              color={materialConfig.color}
              roughness={isTransparent ? 0.05 : 0.6}
              transparent={isTransparent}
              opacity={isTransparent ? 0.45 : 1.0}
            />
          </mesh>
          <mesh position={[-7, heightMeters / 2, 16]}>
            <boxGeometry args={[14, heightMeters, 0.45]} />
            <meshStandardMaterial
              color={materialConfig.color}
              roughness={isTransparent ? 0.05 : 0.6}
              transparent={isTransparent}
              opacity={isTransparent ? 0.45 : 1.0}
            />
          </mesh>
        </group>
      )}

      {/* Full 4-Sided Enclosure (West Closure) */}
      {wallEnclosure === "full_4side" && (
        <mesh position={[-14, heightMeters / 2, 0]}>
          <boxGeometry args={[0.45, heightMeters, 32]} />
          <meshStandardMaterial
            color={materialConfig.color}
            roughness={isTransparent ? 0.05 : 0.6}
            transparent={isTransparent}
            opacity={isTransparent ? 0.45 : 1.0}
          />
        </mesh>
      )}

      {/* 3D Elevation Dimension Tag */}
      <sprite position={[0, heightMeters + 2.2, 0]} scale={[7.2, 1.8, 1]}>
        <spriteMaterial map={dimensionTexture} depthTest={false} />
      </sprite>
    </group>
  );
}

/**
 * Procedural Tree Model
 */
function ProceduralTree({ position, species }) {
  const isConical = species.foliageShape === "conical" || species.foliageShape === "tall_conical";
  const isColumnar = species.foliageShape === "columnar";
  const isPyramidal = species.foliageShape === "pyramidal";

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 2.4, 8]} />
        <meshStandardMaterial color={species.trunkColor || "#3e2723"} roughness={0.9} />
      </mesh>
      {isConical && (
        <group position={[0, 3.8, 0]}>
          <mesh position={[0, -0.6, 0]}>
            <coneGeometry args={[2.0, 3.4, 8]} />
            <meshStandardMaterial color={species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <coneGeometry args={[1.4, 2.8, 8]} />
            <meshStandardMaterial color={species.color} roughness={0.8} />
          </mesh>
        </group>
      )}
      {isColumnar && (
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.8, 1.1, 4.4, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
      {isPyramidal && (
        <mesh position={[0, 3.0, 0]}>
          <coneGeometry args={[1.8, 4.2, 7]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
      {!isConical && !isColumnar && !isPyramidal && (
        <mesh position={[0, 3.6, 0]}>
          <sphereGeometry args={[2.0, 8, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Multi-Sided Bio-Acoustic Tree Screen
 */
function VegetationBufferZone({
  enabled,
  depthMeters = 20,
  treeSpeciesId,
  treeArrangement = "east_buffer",
}) {
  if (!enabled || depthMeters <= 0) return null;

  const species = REGIONAL_TREE_SPECIES[treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const rows = Math.max(1, Math.min(8, Math.round(depthMeters / 6)));

  const trees = useMemo(() => {
    const list = [];
    const startX = 18;
    const spacingX = Math.min(5.5, depthMeters / rows);

    // East Residential Buffer
    for (let r = 0; r < rows; r++) {
      const x = startX + r * spacingX;
      for (let z = -28; z <= 28; z += 5) {
        const jitterZ = ((r % 2) - 0.5) * 2.0;
        list.push([x, 0, z + jitterZ]);
      }
    }

    // 360-Degree Perimeter Ring Belt
    if (treeArrangement === "perimeter_ring") {
      for (let r = 0; r < Math.min(3, rows); r++) {
        for (let x = -40; x <= 16; x += 6) {
          list.push([x, 0, -32 - r * 4]);
          list.push([x, 0, 32 + r * 4]);
        }
      }
    }

    return list;
  }, [rows, depthMeters, treeArrangement]);

  return (
    <group>
      {trees.map((pos, idx) => (
        <ProceduralTree key={idx} position={pos} species={species} />
      ))}
    </group>
  );
}

/**
 * Concentric Noise Isophone Rings
 */
function ConcentricNoiseCircles({ isophoneRadii, chillerPlacement, originPos = [2, 0, 0] }) {
  let originX = originPos[0];
  if (chillerPlacement === "rear_shielded") originX = -38;
  else if (chillerPlacement === "rooftop") originX = -18;

  const getColorForDba = (dba) => {
    if (dba >= 75) return "#ef4444";
    if (dba >= 65) return "#f97316";
    if (dba >= 55) return "#eab308";
    if (dba >= 45) return "#10b981";
    return "#38bdf8";
  };

  const meterToSceneScale = (m) => Math.max(4, Math.min(75, 3 + (m / 600) * 52));

  return (
    <group position={[originX, 0.08, originPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {isophoneRadii.map((ring, idx) => {
        const sceneRadius = meterToSceneScale(ring.radiusMeters);
        const color = getColorForDba(ring.targetDba);

        return (
          <group key={ring.targetDba}>
            <mesh position={[0, 0, 0.005 * (idx + 1)]}>
              <ringGeometry args={[sceneRadius - 0.25, sceneRadius + 0.25, 64]} />
              <meshBasicMaterial color={color} transparent opacity={0.65} side={DoubleSide} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/**
 * Interactive Noise Probe
 */
function InteractiveNoiseProbe({ probePos, probeTelemetry }) {
  const probeSprite = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 440;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#0b1626";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 440, 140, 16);
    } else {
      ctx.rect(0, 0, 440, 140);
    }
    ctx.fill();

    const isComp = probeTelemetry ? probeTelemetry.isCompliant : true;
    ctx.strokeStyle = isComp ? "#34d399" : "#ef4444";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 40px monospace";
    ctx.fillStyle = isComp ? "#34d399" : "#ef4444";
    const dbaText = probeTelemetry ? `${probeTelemetry.netDba.toFixed(1)} dBA` : "-- dBA";
    ctx.fillText(dbaText, 220, 52);

    ctx.font = "bold 20px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    const distText = probeTelemetry ? `${probeTelemetry.distanceMeters}m from plant` : "";
    ctx.fillText(distText, 220, 88);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#94a3b8";
    const sensText = probeTelemetry ? probeTelemetry.sensation : "";
    ctx.fillText(sensText, 220, 120);

    return new CanvasTexture(canvas);
  }, [probeTelemetry]);

  useEffect(() => () => probeSprite.dispose(), [probeSprite]);

  return (
    <group position={[probePos[0], 0, probePos[1]]}>
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
      <sprite position={[0, 10.2, 0]} scale={[8.5, 3.0, 1]}>
        <spriteMaterial map={probeSprite} depthTest={false} transparent />
      </sprite>
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
 * Master 3D Spatial Acoustic Sandbox
 */
export default function AcousticSiteSandbox3D({
  site,
  config,
  acousticResults,
  running,
  itPowerKw,
  fanSpeedPercent,
  timeOfDay = "night",
  onChangeTimeOfDay,
}) {
  const [navMode, setNavMode] = useState("orbit"); // "orbit" | "pan"
  const [cameraPreset, setCameraPreset] = useState("reset");
  const [probePos, setProbePos] = useState([32, 0]);

  const triggerCamera = (preset) => {
    setCameraPreset(preset);
    // Reset preset trigger after tick
    setTimeout(() => setCameraPreset(""), 100);
  };

  // Isophone Radii
  const isophoneRadii = useMemo(() => {
    return calculateIsophoneRadii({
      targetDbaLevels: [75, 65, 55, 45, 40],
      itPowerKw,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      terrainEchoDb: site.terrainEchoAmplificationDb,
      chillerPlacement: config.placement,
      wallHeightMeters: config.wallHeightMeters,
      wallMaterial: config.wallMaterial,
      wallEnabled: config.wallEnabled,
      wallEnclosure: config.wallEnclosure,
      treeBufferDepthMeters: config.treeBufferDepthMeters,
      treeSpeciesId: config.treeSpeciesId,
      treeEnabled: config.treeEnabled,
      chillerOrientationAngle: config.chillerOrientationAngle,
      timeOfDay,
      acousticSilencers: config.acousticSilencers,
    });
  }, [itPowerKw, site, fanSpeedPercent, config, timeOfDay]);

  // Probe Telemetry
  const probeTelemetry = useMemo(() => {
    let sourceX = 2;
    let sourceZ = 0;
    if (config.placement === "rear_shielded") sourceX = -38;
    else if (config.placement === "rooftop") sourceX = -18;

    const dx = probePos[0] - sourceX;
    const dz = probePos[1] - sourceZ;
    const sceneDist = Math.hypot(dx, dz);
    const distanceMeters = Math.max(10, Math.round((sceneDist / 30) * site.defaultDistanceToHomesMeters));

    return calculateNoiseAtPoint({
      probeDistanceMeters: distanceMeters,
      itPowerKw,
      ambientTempC: site.ambientTempC,
      fanSpeedPercent,
      terrainEchoDb: site.terrainEchoAmplificationDb,
      chillerPlacement: config.placement,
      wallHeightMeters: config.wallHeightMeters,
      wallMaterial: config.wallMaterial,
      wallEnabled: config.wallEnabled,
      wallEnclosure: config.wallEnclosure,
      treeBufferDepthMeters: config.treeBufferDepthMeters,
      treeSpeciesId: config.treeSpeciesId,
      treeEnabled: config.treeEnabled,
      chillerOrientationAngle: config.chillerOrientationAngle,
      municipalNoiseLimitDba: acousticResults.activeLegalLimit || site.municipalNoiseLimitDba,
      timeOfDay,
      acousticSilencers: config.acousticSilencers,
    });
  }, [probePos, config, itPowerKw, site, fanSpeedPercent, timeOfDay, acousticResults]);

  const isNight = timeOfDay === "night";

  return (
    <div className="site-canvas-supercontainer" style={{ position: "relative", width: "100%" }}>
      {/* Sleek Floating Camera & Navigation Toolbar */}
      <div className="canvas-hud-toolbar">
        {/* Camera Navigation Tool (Orbit vs Pan) */}
        <div className="hud-pill-group">
          <span className="hud-label">CAMERA TOOL:</span>
          <button
            className={`hud-btn-mini ${navMode === "orbit" ? "selected" : ""}`}
            onClick={() => setNavMode("orbit")}
            title="Orbit 3D: Left click to rotate, right click or two-finger to pan"
          >
            🔄 Orbit 3D
          </button>
          <button
            className={`hud-btn-mini ${navMode === "pan" ? "selected" : ""}`}
            onClick={() => setNavMode("pan")}
            title="Pan Campus: Left click and drag anywhere to pan smoothly across the site"
          >
            ✋ Pan Campus
          </button>
        </div>

        {/* Camera Presets & Views */}
        <div className="hud-pill-group">
          <span className="hud-label">VIEWS:</span>
          <button
            className="hud-btn-mini"
            onClick={() => triggerCamera("top")}
            title="Top-Down 2D Map Plan View"
          >
            🗺️ 2D Plan
          </button>
          <button
            className="hud-btn-mini"
            onClick={() => triggerCamera("plant")}
            title="Focus on Chiller Plant & Barriers"
          >
            🏢 Plant
          </button>
          <button
            className="hud-btn-mini"
            onClick={() => triggerCamera("homes")}
            title="Focus on Residential Homes & Neighbors"
          >
            🏡 Homes
          </button>
          <button
            className="hud-btn-mini"
            onClick={() => triggerCamera("reset")}
            title="Reset to Isometric Perspective"
          >
            ↺ Reset
          </button>
        </div>

        {/* Day / Night Switcher */}
        <div className="hud-pill-group">
          <button
            className={`hud-btn-mini ${!isNight ? "selected" : ""}`}
            onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("day")}
          >
            ☀️ Day
          </button>
          <button
            className={`hud-btn-mini ${isNight ? "selected" : ""}`}
            onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("night")}
          >
            🌙 Night Curfew
          </button>
        </div>
      </div>

      {/* Floating Sound Probe HUD */}
      <div className="canvas-probe-hud">
        <div className="probe-hud-header">
          <span className="probe-dot"></span>
          <strong>ACOUSTIC PROBE TELEMETRY</strong>
        </div>
        <div className="probe-hud-metrics">
          <div className="probe-metric-main">
            <span
              className="probe-dbs"
              style={{ color: probeTelemetry.isCompliant ? "#34d399" : "#ef4444" }}
            >
              {probeTelemetry.netDba.toFixed(1)} <small>dBA</small>
            </span>
            <span className="probe-dbc">{probeTelemetry.netDbc.toFixed(1)} dBC</span>
          </div>
          <div className="probe-metric-detail">
            <span>Distance: <strong>{probeTelemetry.distanceMeters}m</strong> from plant</span>
            <span>Limit: <strong>{acousticResults.activeLegalLimit || site.municipalNoiseLimitDba} dBA</strong></span>
            <span className="probe-sensation">{probeTelemetry.sensation}</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas Viewport */}
      <div
        className="site-canvas-container"
        style={{
          width: "100%",
          height: "640px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #1e2d42",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <WebGLBoundary>
          <Canvas camera={{ position: [34, 42, 60], fov: 45 }} dpr={[1, 1.5]}>
            <color attach="background" args={[isNight ? "#030712" : "#38bdf8"]} />
            <ambientLight intensity={isNight ? 0.35 : 1.8} />
            <directionalLight
              position={isNight ? [-25, 40, -30] : [35, 60, 40]}
              intensity={isNight ? 0.6 : 2.8}
              color={isNight ? "#93c5fd" : "#fffbeb"}
              castShadow
            />

            {isNight && (
              <group position={[2, 10, 0]}>
                <pointLight intensity={35} distance={50} color="#f8fafc" />
              </group>
            )}

            {/* Expansive Ground Terrain */}
            <Ground terrainType={site.terrainType} timeOfDay={timeOfDay} />

            {/* 360-Degree Surroundings */}
            <SurroundingLandscape site={site} timeOfDay={timeOfDay} />

            {/* Authentic Hyperscale Data Center Building */}
            <DataCenterBuilding buildingStyle={config.buildingStyle || "1story"} />

            {/* Chiller Mechanical Compound */}
            <ChillerYard
              placement={config.placement}
              running={running}
              fanSpeedPercent={fanSpeedPercent}
              orientationAngle={config.chillerOrientationAngle}
              acousticSilencers={config.acousticSilencers}
            />

            {/* Multi-Sided Acoustic Barrier Wall System */}
            <AcousticBarrierWall
              enabled={config.wallEnabled}
              heightMeters={config.wallHeightMeters}
              materialId={config.wallMaterial}
              placement={config.placement}
              wallEnclosure={config.wallEnclosure || "single_east"}
            />

            {/* Multi-Sided Bio-Acoustic Tree Screen */}
            <VegetationBufferZone
              enabled={config.treeEnabled}
              depthMeters={config.treeBufferDepthMeters}
              treeSpeciesId={config.treeSpeciesId}
              treeArrangement={config.treeArrangement || "east_buffer"}
            />

            {/* ISO 9613-2 Concentric Noise Circles */}
            <ConcentricNoiseCircles
              isophoneRadii={isophoneRadii}
              chillerPlacement={config.placement}
              originPos={[2, 0, 0]}
            />

            {/* Interactive Sound Probe */}
            <InteractiveNoiseProbe probePos={probePos} probeTelemetry={probeTelemetry} />

            <SiteCameraControls navMode={navMode} cameraPreset={cameraPreset} />
          </Canvas>
        </WebGLBoundary>
      </div>

      {/* Concentric Circle Legend Bar */}
      <div className="concentric-legend-strip">
        <span className="legend-title">CONCENTRIC NOISE CONTOURS (ISO 9613-2):</span>
        <div className="legend-badges">
          <span className="legend-badge red">🔴 75+ dBA (Machinery Roar)</span>
          <span className="legend-badge orange">🟠 65 dBA (Industrial Zone)</span>
          <span className="legend-badge amber">🟡 55 dBA (Daytime Limit)</span>
          <span className="legend-badge green">🟢 45 dBA (Night Curfew Limit)</span>
          <span className="legend-badge cyan">🔵 40 dBA (Quiet Sleep Sanctuary)</span>
        </div>
      </div>
    </div>
  );
}