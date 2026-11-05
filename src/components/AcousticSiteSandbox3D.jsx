import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../simulation/datacenterSites.js";
import { calculateNoiseAtPoint, calculateIsophoneRadii } from "../simulation/acoustics.js";

/**
 * Camera Orbit Controls with drag lock
 */
function SiteCameraControls({ isDragging }) {
  const { camera, gl } = useThree();
  const orbit = useRef();

  useEffect(() => {
    orbit.current = new OrbitControls(camera, gl.domElement);
    orbit.current.target.set(0, 3, 0);
    orbit.current.minDistance = 10;
    orbit.current.maxDistance = 220;
    orbit.current.maxPolarAngle = Math.PI / 2 - 0.02;
    orbit.current.enablePan = true;
    orbit.current.update();
    return () => orbit.current.dispose();
  }, [camera, gl]);

  useEffect(() => {
    if (orbit.current) {
      orbit.current.enabled = !isDragging;
    }
  }, [isDragging]);

  return null;
}

/**
 * 360-Degree Ground Terrain & Facility Apron
 */
function Ground({ terrainType, timeOfDay, onGroundClick, onGroundPointerDown, onGroundPointerMove, onGroundPointerUp }) {
  let groundColor = "#122316"; // Virginia temperate grass
  let gridColor = "#1f3a25";

  if (terrainType === "desert_plain") {
    groundColor = timeOfDay === "day" ? "#5a4128" : "#2b1e13"; // Arid desert sand
    gridColor = "#6e5132";
  } else if (terrainType === "mountain_canyon") {
    groundColor = timeOfDay === "day" ? "#2a3330" : "#141c19"; // Basalt rock & gravel
    gridColor = "#394742";
  } else if (terrainType === "coastal_rolling") {
    groundColor = timeOfDay === "day" ? "#143a22" : "#0d2616"; // Irish peat meadow
    gridColor = "#1c4f2f";
  }

  return (
    <group position={[0, -0.05, 0]}>
      {/* Expansive 360 Ground Plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={onGroundClick}
        onPointerDown={onGroundPointerDown}
        onPointerMove={onGroundPointerMove}
        onPointerUp={onGroundPointerUp}
      >
        <planeGeometry args={[300, 240]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} />
      </mesh>
      <gridHelper args={[300, 60, gridColor, gridColor]} position={[0, 0.01, 0]} />

      {/* Concrete Apron / Data Center Yard Pad */}
      <mesh position={[-16, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[56, 58]} />
        <meshStandardMaterial color="#1a2330" roughness={0.7} />
      </mesh>

      {/* Security Fence Perimeter Line */}
      <mesh position={[-16, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[32, 32.3, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

/**
 * 360-Degree Surrounding Environmental Landscape
 * Real-world representations on ALL sides:
 * - North: River (The Dalles) or Suburban Street (Loudoun)
 * - East: Residential Neighborhood (Subdivisions / Homes)
 * - South: Arterial Highway / Canyon Rock (Waxpool Rd / Cliffs)
 * - West: High-Voltage Electrical Substation & Transformer Yard
 */
function SurroundingLandscape({ site, timeOfDay }) {
  const isNight = timeOfDay === "night";
  const windowColor = isNight ? "#fef08a" : "#94a3b8";
  const windowEmissive = isNight ? "#eab308" : "#000000";
  const windowIntensity = isNight ? 1.0 : 0.0;

  return (
    <group>
      {/* =========================================================================
          EAST BOUNDARY: RESIDENTIAL SUBDIVISION (HOMES, STREETS, YARDS)
          ========================================================================= */}
      <group position={[48, 0, 0]}>
        {/* Neighborhood Residential Street */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 120]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Street Centerline */}
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.3, 115]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.6} />
        </mesh>

        {/* Residential Homes along the East Property Line */}
        {[-45, -30, -15, 0, 15, 30, 45].map((z, idx) => (
          <group key={z} position={[12, 0, z]}>
            {/* Front Lawn */}
            <mesh position={[-4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[8, 12]} />
              <meshStandardMaterial color={site.terrainType === "desert_plain" ? "#4a3520" : "#1b4324"} />
            </mesh>

            {/* House Main Body */}
            <mesh position={[2, 2.4, 0]}>
              <boxGeometry args={[7.5, 4.8, 8.5]} />
              <meshStandardMaterial
                color={site.terrainType === "desert_plain" ? "#e2d2b8" : idx % 2 === 0 ? "#f8fafc" : "#e2e8f0"}
                roughness={0.7}
              />
            </mesh>

            {/* Pitched Roof */}
            <mesh position={[2, 5.8, 0]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[5.8, 5.8, 9.2]} />
              <meshStandardMaterial
                color={site.terrainType === "desert_plain" ? "#b45309" : "#334155"}
                roughness={0.8}
              />
            </mesh>

            {/* Front Windows (Glow warmly at night) */}
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
              <meshStandardMaterial color={idx % 3 === 0 ? "#dc2626" : idx % 3 === 1 ? "#0284c7" : "#475569"} roughness={0.4} metalness={0.6} />
            </mesh>

            {/* Suburban Streetlamp */}
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
          SOUTH BOUNDARY: ARTERIAL HIGHWAY CORRIDOR (ROUTE 28 / ARTERIAL ROAD)
          ========================================================================= */}
      <group position={[-16, 0, 52]}>
        {/* 4-Lane Asphalt Highway */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[180, 14]} />
          <meshStandardMaterial color="#18202f" roughness={0.8} />
        </mesh>
        {/* Median Concrete Barrier */}
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[180, 0.9, 0.6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {/* Lane Striping */}
        {[-3.5, 3.5].map((laneZ) => (
          <mesh key={laneZ} position={[0, 0.035, laneZ]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[170, 0.25]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Highway Traffic Simulation (Vehicles moving / stationed) */}
        {[-60, -20, 25, 65].map((carX, i) => (
          <group key={carX} position={[carX, 0.7, (i % 2 === 0 ? 3.5 : -3.5)]}>
            <mesh>
              <boxGeometry args={[3.8, 1.3, 1.8]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#e2e8f0" : "#3b82f6"} metalness={0.6} roughness={0.3} />
            </mesh>
            {/* Headlights / Taillights */}
            <mesh position={[1.92, 0.1, 0]}>
              <planeGeometry args={[0.2, 0.5]} />
              <meshBasicMaterial color={i % 2 === 0 ? "#fef08a" : "#ef4444"} side={DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          WEST BOUNDARY: HIGH-VOLTAGE SUBSTATION & POWER TRANSFORMER YARD
          ========================================================================= */}
      <group position={[-52, 0, 0]}>
        {/* Gravel Substation Yard */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[26, 48]} />
          <meshStandardMaterial color="#334155" roughness={0.95} />
        </mesh>
        {/* Chainlink Fence Surrounding Substation */}
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[26, 3, 48]} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.4} />
        </mesh>
        {/* 3 Step-Down Utility Transformers with Ceramic Insulators */}
        {[-14, 0, 14].map((transZ) => (
          <group key={transZ} position={[0, 0, transZ]}>
            {/* Transformer Main Tank */}
            <mesh position={[0, 2.2, 0]}>
              <boxGeometry args={[5.5, 4.4, 5.5]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Cooling Radiator Fins */}
            {[-2.9, 2.9].map((rx) => (
              <mesh key={rx} position={[rx, 2.2, 0]}>
                <boxGeometry args={[0.3, 3.8, 4.8]} />
                <meshStandardMaterial color="#334155" metalness={0.9} />
              </mesh>
            ))}
            {/* High Voltage Ceramic Bushings / Insulators */}
            {[-1.5, 0, 1.5].map((bx) => (
              <mesh key={bx} position={[bx, 5.2, 0]}>
                <cylinderGeometry args={[0.15, 0.22, 1.8, 8]} />
                <meshStandardMaterial color="#b45309" roughness={0.2} />
              </mesh>
            ))}
            {/* Steel Transmission Lattice Pylon */}
            <mesh position={[0, 7.5, 0]}>
              <boxGeometry args={[2.5, 5, 2.5]} />
              <meshStandardMaterial color="#94a3b8" wireframe />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          SITE SPECIFIC: COLUMBIA RIVER & BASALT CANYON (THE DALLES, OR)
          ========================================================================= */}
      {site.id === "the_dalles_or" && (
        <group>
          {/* North: The Columbia River Expanse */}
          <group position={[0, 0, -56]}>
            {/* Water Surface Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[260, 45]} />
              <meshStandardMaterial
                color="#0f2b48"
                roughness={0.2}
                metalness={0.4}
                transparent
                opacity={0.88}
              />
            </mesh>
            {/* Rocky River Shoreline */}
            <mesh position={[0, 0.1, 22.5]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[260, 4]} />
              <meshStandardMaterial color="#2d3748" roughness={0.95} />
            </mesh>
          </group>

          {/* South: Massive Basalt Canyon Cliffs (Echo Amplification) */}
          <group position={[0, 0, 72]}>
            {[-80, -45, -10, 25, 60, 95].map((cx, idx) => (
              <group key={cx} position={[cx, 0, 0]}>
                {/* Stepped Basalt Cliff Tier 1 */}
                <mesh position={[0, 9, 0]}>
                  <boxGeometry args={[34, 18, 16]} />
                  <meshStandardMaterial color="#1e2930" roughness={0.95} />
                </mesh>
                {/* Stepped Basalt Cliff Tier 2 */}
                <mesh position={[0, 22, 5]}>
                  <boxGeometry args={[28, 16, 12]} />
                  <meshStandardMaterial color="#151e24" roughness={0.95} />
                </mesh>
                {/* Ponderosa Pines on Cliff Ledges */}
                {[-10, 0, 10].map((px) => (
                  <mesh key={px} position={[px, 19, -2]}>
                    <coneGeometry args={[1.8, 5, 6]} />
                    <meshStandardMaterial color="#16381e" />
                  </mesh>
                ))}
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
          {/* Desert Saguaro Cacti Scattering */}
          {[
            [-35, -28], [25, -35], [42, 28], [-42, 38], [15, 38], [-10, -45]
          ].map(([cx, cz], i) => (
            <group key={i} position={[cx, 0, cz]}>
              {/* Main Trunk */}
              <mesh position={[0, 3, 0]}>
                <cylinderGeometry args={[0.3, 0.35, 6, 8]} />
                <meshStandardMaterial color="#2e5a44" roughness={0.9} />
              </mesh>
              {/* Left Arm */}
              <mesh position={[-0.8, 3.2, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 1.4, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
              <mesh position={[-1.4, 4.2, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 2.2, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
              {/* Right Arm */}
              <mesh position={[0.8, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 1.4, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
              <mesh position={[1.4, 3.8, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 2.6, 8]} />
                <meshStandardMaterial color="#2e5a44" />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* =========================================================================
          SITE SPECIFIC: IRISH STONE WALLS & CANAL (DUBLIN, IRELAND)
          ========================================================================= */}
      {site.id === "dublin_ie" && (
        <group>
          {/* Dry Stone Boundary Hedgerow Walls */}
          {[-25, 25].map((wz) => (
            <mesh key={wz} position={[0, 0.5, wz]}>
              <boxGeometry args={[180, 1.0, 0.8]} />
              <meshStandardMaterial color="#475569" roughness={0.95} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/**
 * Realistic Hyperscale Data Center Building with Architectural Variations
 */
function DataCenterBuilding({ explodedProgress = 0, buildingStyle = "1story", timeOfDay }) {
  const isNight = timeOfDay === "night";
  const roofLift = 14 * explodedProgress;
  const wallSpread = 7 * explodedProgress;

  const is2Story = buildingStyle === "2story";
  const buildingHeight = is2Story ? 10.5 : 7.2;

  return (
    <group position={[-18, 0, 0]}>
      {/* Internal Compute Hall (Visible when exploded) */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[26, 0.6, 34]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* 4 Rows of Server Cabinets */}
        {[-9, -3, 3, 9].map((rowZ) => (
          <group key={rowZ} position={[0, 0.6, rowZ]}>
            {[-9, -4, 1, 6].map((colX) => (
              <mesh key={colX} position={[colX, 2.4, 0]}>
                <boxGeometry args={[2.2, 4.8, 1.8]} />
                <meshStandardMaterial color="#0b1320" metalness={0.8} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* Tilt-Up Concrete Exterior Walls */}
      {/* East Facade (Facing Chiller Yard & Homes) */}
      <group position={[13.2 + wallSpread, buildingHeight / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.6, buildingHeight, 34]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        {/* High-Volume Chilled Water Piping Penetrations */}
        {[-6, 0, 6].map((pipeZ) => (
          <mesh key={pipeZ} position={[0.4, -1, pipeZ]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.8, 12]} />
            <meshStandardMaterial color="#0284c7" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* West Facade */}
      <mesh position={[-13.2 - wallSpread, buildingHeight / 2, 0]}>
        <boxGeometry args={[0.6, buildingHeight, 34]} />
        <meshStandardMaterial color="#334155" roughness={0.85} />
      </mesh>

      {/* North Facade */}
      <mesh position={[0, buildingHeight / 2, -17.2 - wallSpread]}>
        <boxGeometry args={[27, buildingHeight, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* South Facade with Entrance Bay */}
      <mesh position={[0, buildingHeight / 2, 17.2 + wallSpread]}>
        <boxGeometry args={[27, buildingHeight, 0.6]} />
        <meshStandardMaterial color="#1e293b" roughness={0.85} />
      </mesh>

      {/* Roof Parapet System (Lifts in Exploded View) */}
      <group position={[0, buildingHeight + roofLift, 0]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[27, 0.6, 35]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Perimeter Parapet Screen */}
        <mesh position={[0, 1.2, 17.2]}>
          <boxGeometry args={[27, 1.4, 0.3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[0, 1.2, -17.2]}>
          <boxGeometry args={[27, 1.4, 0.3]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 400-Ton Modular V-Bank Industrial Air-Cooled Chiller Unit
 */
function VBankChillerUnit({ position, running, fanSpeedPercent, explodedProgress = 0, acousticSilencers }) {
  const fans = [useRef(), useRef(), useRef(), useRef()];

  useFrame((_, delta) => {
    if (!running) return;
    const rot = delta * (fanSpeedPercent / 100) * 22;
    fans.forEach((f) => {
      if (f.current) f.current.rotation.y += rot;
    });
  });

  const fanLift = 6 * explodedProgress;

  return (
    <group position={position}>
      {/* Structural Steel Chiller Skid Base */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[4.8, 0.8, 8.4]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* Twin-Screw Compressors (60Hz / 120Hz Mechanical Vibration Source) */}
      <group position={[0, 1.1, -1.8]}>
        {[-1.2, 1.2].map((cx) => (
          <group key={cx} position={[cx, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 2.8, 16]} />
              <meshStandardMaterial
                color={acousticSilencers ? "#064e3b" : "#3b82f6"} // Green if sound blanket installed
                metalness={0.7}
              />
            </mesh>
            {acousticSilencers && (
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1.5, 1.5, 3.0]} />
                <meshStandardMaterial color="#047857" transparent opacity={0.75} />
              </mesh>
            )}
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

      {/* 4 High-Flow Axial Condenser Fans (Rotates dynamically) */}
      <group position={[0, 4.2 + fanLift, 0]}>
        {[
          [-1.1, -2.2],
          [1.1, -2.2],
          [-1.1, 2.2],
          [1.1, 2.2],
        ].map(([fx, fz], idx) => (
          <group key={idx} position={[fx, 0, fz]}>
            {/* Fan Cowl Shroud */}
            <mesh>
              <cylinderGeometry args={[1.05, 1.05, 0.6, 16, 1, true]} />
              <meshStandardMaterial color="#0f172a" side={DoubleSide} />
            </mesh>
            {/* Rotating Fan Blades */}
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
 * Outdoor Chiller Plant Yard with Placement Architecture
 */
function ChillerYard({
  placement,
  running,
  fanSpeedPercent,
  orientationAngle,
  explodedProgress = 0,
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
    yardY = -5.5; // Excavated 5.5m below grade
  } else if (placement === "semi_berm") {
    yardY = -2.2;
  }

  const radAngle = (orientationAngle * Math.PI) / 180;

  return (
    <group position={[yardX, yardY, yardZ]}>
      {/* Subterranean Vault Concrete Excavation Walls & Ramp */}
      {placement === "underground" && (
        <group>
          {/* Bunker Floor */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[18, 0.4, 28]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* North, South, East, West Retaining Walls */}
          <mesh position={[9, 3, 0]}>
            <boxGeometry args={[0.8, 6, 28]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[-9, 3, 0]}>
            <boxGeometry args={[0.8, 6, 28]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 3, 14]}>
            <boxGeometry args={[18, 6, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 3, -14]}>
            <boxGeometry args={[18, 6, 0.8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {/* Semi-Bermed Sloped Earthen Berms */}
      {placement === "semi_berm" && (
        <group position={[0, 1.2, 0]}>
          <mesh position={[7.5, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[4.5, 3.5, 26]} />
            <meshStandardMaterial color="#1f3a25" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Chiller Skid Units Array (3 Modular 400-Ton Units) */}
      <group rotation={[0, radAngle, 0]}>
        {[-9, 0, 9].map((chillerZ, idx) => (
          <VBankChillerUnit
            key={idx}
            position={[0, 0, chillerZ]}
            running={running}
            fanSpeedPercent={fanSpeedPercent}
            explodedProgress={explodedProgress}
            acousticSilencers={acousticSilencers}
          />
        ))}
      </group>
    </group>
  );
}

/**
 * Full Multi-Sided Acoustic Barrier Wall System
 * Dynamically updates height, material, and enclosure configuration (Single / U-Cowl / 4-Sided)
 */
function AcousticBarrierWall({
  enabled,
  heightMeters = 8,
  materialId = "absorptive_metal",
  placement,
  wallOffset = [0, 0],
  wallEnclosure = "single_east", // "single_east" | "u_shape" | "full_4side"
  isDraggable = false,
}) {
  if (!enabled || heightMeters <= 0) return null;

  const materialConfig = WALL_MATERIALS[materialId] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = materialId === "transparent_acrylic";

  let wallX = 10 + wallOffset[0];
  let wallY = 0;
  let wallZ = 0 + wallOffset[1];

  if (placement === "rear_shielded") {
    wallX = -46 + wallOffset[0];
  } else if (placement === "rooftop") {
    wallX = -9 + wallOffset[0];
    wallY = 8.5;
  } else if (placement === "underground") {
    wallY = 0; // Wall sits on ground above vault lip
  }

  // Floating 3D Dimension Callout Tag above Wall
  const dimensionTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 100;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 384, 100, 16);
    } else {
      ctx.rect(0, 0, 384, 100);
    }
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 28px monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText(`H = ${heightMeters}.0m WALL`, 192, 40);

    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText(`${materialConfig.name.split(" ")[0]} (NRC: ${materialConfig.nrcRating})`, 192, 74);

    return new CanvasTexture(canvas);
  }, [heightMeters, materialConfig]);

  useEffect(() => () => dimensionTexture.dispose(), [dimensionTexture]);

  return (
    <group position={[wallX, wallY, wallZ]}>
      {/* 1. Main East Wall (Facing Community) */}
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

      {/* Structural Steel I-Beam Columns along East Wall */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <mesh key={z} position={[0.28, heightMeters / 2, z]}>
          <boxGeometry args={[0.35, heightMeters + 0.3, 0.3]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* 2. U-Shaped Cowl Wings (North & South Returns) */}
      {(wallEnclosure === "u_shape" || wallEnclosure === "full_4side") && (
        <group>
          {/* North Return Wall */}
          <mesh position={[-7, heightMeters / 2, -16]}>
            <boxGeometry args={[14, heightMeters, 0.45]} />
            <meshStandardMaterial
              color={materialConfig.color}
              roughness={isTransparent ? 0.05 : 0.6}
              transparent={isTransparent}
              opacity={isTransparent ? 0.45 : 1.0}
            />
          </mesh>
          {/* South Return Wall */}
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

      {/* 3. Full 4-Sided Yard Enclosure (West Closure) */}
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

      {/* Floating Elevation / Height Dimension Billboard Tag */}
      <sprite position={[0, heightMeters + 2.4, 0]} scale={[7.5, 2.0, 1]}>
        <spriteMaterial map={dimensionTexture} depthTest={false} />
      </sprite>

      {/* Vertical Elevation Guide Line */}
      <mesh position={[0, heightMeters / 2, 16.5]}>
        <cylinderGeometry args={[0.04, 0.04, heightMeters, 6]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>
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
      {/* Trunk */}
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 2.4, 8]} />
        <meshStandardMaterial color={species.trunkColor || "#3e2723"} roughness={0.9} />
      </mesh>
      {/* Species-Specific Foliage */}
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
 * Multi-Sided Bio-Acoustic Buffer Belt (East Buffer vs 360° Perimeter Belt)
 */
function VegetationBufferZone({
  enabled,
  depthMeters = 20,
  treeSpeciesId,
  treeArrangement = "east_buffer",
  treeOffset = [0, 0],
}) {
  if (!enabled || depthMeters <= 0) return null;

  const species = REGIONAL_TREE_SPECIES[treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const rows = Math.max(1, Math.min(8, Math.round(depthMeters / 6)));

  const trees = useMemo(() => {
    const list = [];
    const startX = 18 + treeOffset[0];
    const spacingX = Math.min(5.5, depthMeters / rows);

    // East Residential Buffer Rows
    for (let r = 0; r < rows; r++) {
      const x = startX + r * spacingX;
      for (let z = -28 + treeOffset[1]; z <= 28 + treeOffset[1]; z += 5) {
        const jitterZ = ((r % 2) - 0.5) * 2.0;
        list.push([x, 0, z + jitterZ]);
      }
    }

    // 360-Degree Perimeter Ring Belt (North, South, and West)
    if (treeArrangement === "perimeter_ring") {
      // North & South Perimeter Belts
      for (let r = 0; r < Math.min(3, rows); r++) {
        for (let x = -40; x <= 16; x += 6) {
          list.push([x, 0, -32 - r * 4]); // North boundary
          list.push([x, 0, 32 + r * 4]);  // South boundary
        }
      }
      // West Buffer
      for (let r = 0; r < Math.min(2, rows); r++) {
        for (let z = -24; z <= 24; z += 6) {
          list.push([-42 - r * 4, 0, z]);
        }
      }
    }

    return list;
  }, [rows, depthMeters, treeOffset, treeArrangement]);

  return (
    <group>
      {trees.map((pos, idx) => (
        <ProceduralTree key={idx} position={pos} species={species} />
      ))}
    </group>
  );
}

/**
 * Concentric Noise Circles with dBA Labels & Distance
 */
function ConcentricNoiseCircles({ isophoneRadii, chillerPlacement, originPos = [2, 0, 0] }) {
  let originX = originPos[0];
  if (chillerPlacement === "rear_shielded") originX = -38;
  else if (chillerPlacement === "rooftop") originX = -18;

  const getColorForDba = (dba) => {
    if (dba >= 75) return "#ef4444"; // Red
    if (dba >= 65) return "#f97316"; // Orange
    if (dba >= 55) return "#eab308"; // Amber
    if (dba >= 45) return "#10b981"; // Green
    return "#38bdf8"; // Cyan
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
 * Interactive Noise Pointer Probe Tool
 */
function InteractiveNoiseProbe({ probePos, probeTelemetry, onPointerDown }) {
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
      {/* Ground Target Ring */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 2.2, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} side={DoubleSide} />
      </mesh>

      {/* Holographic Probe Mast */}
      <mesh position={[0, 3.5, 0]} onPointerDown={onPointerDown}>
        <cylinderGeometry args={[0.08, 0.12, 7, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>

      {/* Glowing Sensor Tip */}
      <mesh position={[0, 7.2, 0]} onPointerDown={onPointerDown}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color={probeTelemetry?.isCompliant ? "#34d399" : "#ef4444"}
          emissive={probeTelemetry?.isCompliant ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Billboard Telemetry */}
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
  const [explodedProgress, setExplodedProgress] = useState(0);
  const [isExplodingAuto, setIsExplodingAuto] = useState(false);

  // Sound Probe Coordinates [X, Z]
  const [probePos, setProbePos] = useState([32, 0]);
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);
  const [dragMode, setDragMode] = useState("probe"); // "probe" | "wall" | "trees" | "chillers"

  const [wallOffset, setWallOffset] = useState([0, 0]);
  const [treeOffset, setTreeOffset] = useState([0, 0]);
  const [compoundOffset, setCompoundOffset] = useState([0, 0]);

  // Exploded Auto-Animation
  useEffect(() => {
    if (!isExplodingAuto) return;
    let dir = 1;
    const interval = setInterval(() => {
      setExplodedProgress((prev) => {
        if (prev >= 1) dir = -1;
        if (prev <= 0) dir = 1;
        return Math.max(0, Math.min(1, prev + dir * 0.05));
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isExplodingAuto]);

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
    let sourceX = 2 + compoundOffset[0];
    let sourceZ = compoundOffset[1];
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
  }, [probePos, compoundOffset, config, itPowerKw, site, fanSpeedPercent, timeOfDay, acousticResults]);

  // Pointer Handlers
  const handleGroundClick = (e) => {
    e.stopPropagation();
    if (dragMode === "probe") {
      setProbePos([e.point.x, e.point.z]);
    }
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDraggingProbe(true);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingProbe) return;
    const x = e.point.x;
    const z = e.point.z;
    if (dragMode === "probe") setProbePos([x, z]);
    else if (dragMode === "wall") setWallOffset([x - 10, z]);
    else if (dragMode === "trees") setTreeOffset([x - 18, z]);
    else if (dragMode === "chillers") setCompoundOffset([x - 2, z]);
  };

  const handlePointerUp = () => {
    setIsDraggingProbe(false);
  };

  const isNight = timeOfDay === "night";

  return (
    <div className="site-canvas-supercontainer" style={{ position: "relative", width: "100%" }}>
      {/* 3D Viewport Controls HUD Overlay (Top-Left) */}
      <div className="canvas-hud-toolbar">
        {/* Day / Night Time-of-Day Switcher */}
        <div className="hud-pill-group">
          <span className="hud-label">ATMOSPHERE:</span>
          <button
            className={`hud-btn-mini ${!isNight ? "selected" : ""}`}
            onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("day")}
            title="Simulate Daytime (Solar illumination, 55 dBA daytime ordinance, traffic ambient)"
          >
            ☀️ Day (55 dBA)
          </button>
          <button
            className={`hud-btn-mini ${isNight ? "selected" : ""}`}
            onClick={() => onChangeTimeOfDay && onChangeTimeOfDay("night")}
            title="Simulate Night Curfew (Nocturnal silence, 45 dBA curfew, thermal inversion)"
          >
            🌙 Night Curfew (45 dBA)
          </button>
        </div>

        {/* Exploded Subsystem View Controls */}
        <div className="hud-pill-group">
          <button
            className={`hud-btn ${explodedProgress > 0 ? "active" : ""}`}
            onClick={() => {
              setIsExplodingAuto(false);
              setExplodedProgress(explodedProgress > 0 ? 0 : 1);
            }}
            title="Toggle Exploded CAD Disassembly View"
          >
            <span className="hud-icon">📐</span>
            <span>Exploded: {Math.round(explodedProgress * 100)}%</span>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={explodedProgress}
            onChange={(e) => {
              setIsExplodingAuto(false);
              setExplodedProgress(parseFloat(e.target.value));
            }}
            className="hud-slider"
          />
        </div>

        {/* 3D Drag & Drop Mode Palette */}
        <div className="hud-pill-group">
          <span className="hud-label">ARRANGE 3D:</span>
          <button
            className={`hud-btn-mini ${dragMode === "probe" ? "selected" : ""}`}
            onClick={() => setDragMode("probe")}
          >
            📍 Sound Probe
          </button>
          <button
            className={`hud-btn-mini ${dragMode === "wall" ? "selected" : ""}`}
            onClick={() => setDragMode("wall")}
          >
            🧱 Barrier Wall
          </button>
          <button
            className={`hud-btn-mini ${dragMode === "trees" ? "selected" : ""}`}
            onClick={() => setDragMode("trees")}
          >
            🌲 Tree Belt
          </button>
          <button
            className={`hud-btn-mini ${dragMode === "chillers" ? "selected" : ""}`}
            onClick={() => setDragMode("chillers")}
          >
            🌪️ Chiller Yard
          </button>
          {(wallOffset[0] !== 0 || treeOffset[0] !== 0 || compoundOffset[0] !== 0) && (
            <button
              className="hud-btn-mini reset"
              onClick={() => {
                setWallOffset([0, 0]);
                setTreeOffset([0, 0]);
                setCompoundOffset([0, 0]);
              }}
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Real-time Interactive Probe Telemetry HUD Overlay (Top-Right) */}
      <div className="canvas-probe-hud">
        <div className="probe-hud-header">
          <span className="probe-dot"></span>
          <strong>ACOUSTIC PROBE (360° TERRAIN)</strong>
          <span className="probe-hint">(Click/drag anywhere)</span>
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
            <span>Distance: <strong>{probeTelemetry.distanceMeters}m</strong> from cooling plant</span>
            <span>Limit: <strong>{acousticResults.activeLegalLimit || site.municipalNoiseLimitDba} dBA</strong> ({probeTelemetry.marginDb >= 0 ? `-${probeTelemetry.marginDb.toFixed(1)} dB safe` : `+${Math.abs(probeTelemetry.marginDb).toFixed(1)} dB OVER`})</span>
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
            {/* Dynamic Sky & Lighting for Day / Night */}
            <color attach="background" args={[isNight ? "#030712" : "#38bdf8"]} />
            <ambientLight intensity={isNight ? 0.35 : 1.8} />
            <directionalLight
              position={isNight ? [-25, 40, -30] : [35, 60, 40]}
              intensity={isNight ? 0.6 : 2.8}
              color={isNight ? "#93c5fd" : "#fffbeb"}
              castShadow
            />

            {/* Night Security Floodlights for Chiller Yard */}
            {isNight && (
              <group position={[2, 10, 0]}>
                <pointLight intensity={35} distance={50} color="#f8fafc" />
              </group>
            )}

            {/* Expansive Ground Terrain */}
            <Ground
              terrainType={site.terrainType}
              timeOfDay={timeOfDay}
              onGroundClick={handleGroundClick}
              onGroundPointerDown={handlePointerDown}
              onGroundPointerMove={handlePointerMove}
              onGroundPointerUp={handlePointerUp}
            />

            {/* 360-Degree Realistic Surroundings (Subdivisions, Highways, Substations, Rivers, Canyons) */}
            <SurroundingLandscape site={site} timeOfDay={timeOfDay} />

            {/* Data Center Architecture */}
            <DataCenterBuilding
              explodedProgress={explodedProgress}
              buildingStyle={config.buildingStyle || "1story"}
              timeOfDay={timeOfDay}
            />

            {/* Chiller Mechanical Yard */}
            <ChillerYard
              placement={config.placement}
              running={running}
              fanSpeedPercent={fanSpeedPercent}
              orientationAngle={config.chillerOrientationAngle}
              explodedProgress={explodedProgress}
              compoundOffset={compoundOffset}
              acousticSilencers={config.acousticSilencers}
            />

            {/* Multi-Sided Acoustic Barrier Wall System */}
            <AcousticBarrierWall
              enabled={config.wallEnabled}
              heightMeters={config.wallHeightMeters}
              materialId={config.wallMaterial}
              placement={config.placement}
              wallOffset={wallOffset}
              wallEnclosure={config.wallEnclosure || "single_east"}
              isDraggable={dragMode === "wall"}
            />

            {/* Multi-Sided Bio-Acoustic Tree Belt */}
            <VegetationBufferZone
              enabled={config.treeEnabled}
              depthMeters={config.treeBufferDepthMeters}
              treeSpeciesId={config.treeSpeciesId}
              treeArrangement={config.treeArrangement || "east_buffer"}
              treeOffset={treeOffset}
            />

            {/* ISO 9613-2 Concentric Noise Isophone Circles */}
            <ConcentricNoiseCircles
              isophoneRadii={isophoneRadii}
              chillerPlacement={config.placement}
              originPos={[2 + compoundOffset[0], 0, compoundOffset[1]]}
            />

            {/* Interactive Sound Probe */}
            <InteractiveNoiseProbe
              probePos={probePos}
              probeTelemetry={probeTelemetry}
              onPointerDown={handlePointerDown}
            />

            <SiteCameraControls isDragging={isDraggingProbe} />
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