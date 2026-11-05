import { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../simulation/datacenterSites.js";
import { acousticSimulator } from "../simulation/audioSynthesizer.js";

/**
 * Camera Navigation with Smooth Orbit and Pan
 */
function SiteCameraControls({ navMode, cameraPreset, isDragging }) {
  const { camera, gl } = useThree();
  const orbitRef = useRef();

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.target.set(0, 3, 0);
    controls.minDistance = 8;
    controls.maxDistance = 280;
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

  // Temporarily disable OrbitControls while user is actively dragging an object in 3D
  useEffect(() => {
    if (!orbitRef.current) return;
    orbitRef.current.enabled = !isDragging;
  }, [isDragging]);

  // Switch between Orbit and Pan
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
      camera.position.set(36, 44, 62);
      orbitRef.current.target.set(0, 3, 0);
    } else if (cameraPreset === "top") {
      camera.position.set(0, 120, 0.01);
      orbitRef.current.target.set(0, 0, 0);
    } else if (cameraPreset === "plant") {
      camera.position.set(16, 18, 24);
      orbitRef.current.target.set(2, 3, 0);
    } else if (cameraPreset === "homes") {
      camera.position.set(44, 22, 32);
      orbitRef.current.target.set(48, 3, 0);
    }
    orbitRef.current.update();
  }, [cameraPreset, camera]);

  return null;
}

/**
 * Authentic 360-Degree Ground Terrain & Campus Infrastructure
 * Exactly mirrors satellite layout: asphalt roads, parking bays, security gate, and retention pond
 */
function InteractiveGround({ terrainType, timeOfDay, onGroundPointerMove, onGroundPointerUp, onDeselect }) {
  let groundColor = "#112215";
  let gridColor = "#1e3824";

  if (terrainType === "desert_plain") {
    groundColor = timeOfDay === "day" ? "#5a4128" : "#2b1e13";
    gridColor = "#6e5132";
  } else if (terrainType === "mountain_canyon") {
    groundColor = timeOfDay === "day" ? "#28322e" : "#141c19";
    gridColor = "#394742";
  } else if (terrainType === "coastal_rolling") {
    groundColor = timeOfDay === "day" ? "#143a22" : "#0d2616";
    gridColor = "#1c4f2f";
  }

  const isNight = timeOfDay === "night";

  return (
    <group position={[0, -0.05, 0]}>
      {/* Expansive Regional Landscape Ground Plane */}
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
        <planeGeometry args={[340, 280]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} />
      </mesh>
      <gridHelper args={[340, 68, gridColor, gridColor]} position={[0, 0.01, 0]} />

      {/* Main Campus Ring Road (Paved Heavy-Duty Asphalt) */}
      <mesh position={[-16, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[84, 86]} />
        <meshStandardMaterial color="#141d29" roughness={0.7} />
      </mesh>

      {/* Concrete Facility Apron & Maintenance Yard */}
      <mesh position={[-16, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[62, 64]} />
        <meshStandardMaterial color="#2d3748" roughness={0.65} />
      </mesh>

      {/* Concrete Curbs Around Facility Apron */}
      <mesh position={[-16, 0.08, 32]}>
        <boxGeometry args={[62, 0.16, 0.4]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[-16, 0.08, -32]}>
        <boxGeometry args={[62, 0.16, 0.4]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>

      {/* Visitor & Staff Parking Bays (South Entrance) */}
      <group position={[-16, 0.035, 26]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[28, 9]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Painted White Parking Space Lines */}
        {[-12, -8, -4, 0, 4, 8, 12].map((x) => (
          <mesh key={x} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, 7.5]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
          </mesh>
        ))}
      </group>

      {/* Security Guardhouse & Gated Main Entrance (South Property Line) */}
      <group position={[-16, 0, 42]}>
        {/* Guard Shack Building */}
        <mesh position={[4, 1.6, 0]}>
          <boxGeometry args={[3.2, 3.2, 4.0]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[4, 1.8, 0]}>
          <boxGeometry args={[3.3, 1.4, 3.2]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} transparent opacity={0.6} />
        </mesh>
        {/* Motorized Yellow Barrier Gate Arm */}
        <mesh position={[-1.5, 1.1, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 2.2, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-4.5, 1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 6, 8]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>

      {/* Stormwater Retention Basin (Mandated by Loudoun / EPA Water Regulations) */}
      <group position={[22, 0, 42]}>
        {/* Sloped Earthen Basin Pit */}
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[20, 0.8, 22]} />
          <meshStandardMaterial color="#1a351f" roughness={0.9} />
        </mesh>
        {/* Reflective Retention Water Pool */}
        <mesh position={[0, -0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[18, 20]} />
          <meshStandardMaterial
            color="#0284c7"
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.82}
          />
        </mesh>
        {/* Cattail / Reeds along pond edge */}
        {[-8, -4, 0, 4, 8].map((rx) => (
          <mesh key={rx} position={[rx, 0.4, -9.5]}>
            <cylinderGeometry args={[0.04, 0.06, 1.2, 6]} />
            <meshStandardMaterial color="#65a30d" />
          </mesh>
        ))}
      </group>

      {/* Perimeter Security Fence (Chainlink Wire with Barbed Wire Top Outriggers) */}
      <group>
        {/* South Boundary Fence */}
        <mesh position={[-16, 1.4, 46]}>
          <boxGeometry args={[78, 2.8, 0.08]} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.3} />
        </mesh>
        {/* East Property Line Security Fence (Separates Data Center from Residential Lots) */}
        <mesh position={[28, 1.4, 0]}>
          <boxGeometry args={[0.08, 2.8, 88]} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Authentic 360-Degree Surroundings
 * East: Real Residential Subdivision with 2-Story Gabled Homes, Yards, and Streetlights
 * South: 4-Lane Arterial Highway
 * West: High-Voltage Transmission Substation
 */
function SurroundingLandscape({ site, timeOfDay }) {
  const isNight = timeOfDay === "night";
  const windowColor = isNight ? "#fef08a" : "#94a3b8";
  const windowEmissive = isNight ? "#eab308" : "#000000";
  const windowIntensity = isNight ? 1.2 : 0.0;

  return (
    <group>
      {/* =========================================================================
          EAST BOUNDARY: RESIDENTIAL SUBDIVISION (Neighborhood Cul-de-sac)
          ========================================================================= */}
      <group position={[48, 0, 0]}>
        {/* Neighborhood Paved Residential Street */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9, 136]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {/* Concrete Sidewalk & Curb */}
        <mesh position={[-5, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.6, 136]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
        </mesh>
        {/* Double Yellow Road Centerline */}
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.25, 130]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={0.7} />
        </mesh>

        {/* 7 Distinct Suburban Two-Story Homes */}
        {[-48, -32, -16, 0, 16, 32, 48].map((z, idx) => {
          const sidingColors = ["#f8fafc", "#e2e8f0", "#e2d8ce", "#cbd5e1", "#f1f5f9", "#e2d2b8", "#f8fafc"];
          const roofColors = ["#334155", "#1e293b", "#475569", "#374151", "#334155", "#4a3c31", "#1e293b"];
          const carColors = ["#dc2626", "#0284c7", "#475569", "#ffffff", "#10b981", "#eab308", "#1e293b"];

          return (
            <group key={z} position={[12, 0, z]}>
              {/* Manicured Front Green Lawn */}
              <mesh position={[-4, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[9, 13.5]} />
                <meshStandardMaterial color={site.terrainType === "desert_plain" ? "#4a3520" : "#1a4623"} />
              </mesh>

              {/* Concrete Driveway */}
              <mesh position={[-3.5, 0.035, 3.2]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[7, 3.2]} />
                <meshStandardMaterial color="#64748b" roughness={0.85} />
              </mesh>

              {/* Parked Resident Car */}
              <group position={[-3, 0.65, 3.2]}>
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[3.2, 1.1, 1.8]} />
                  <meshStandardMaterial color={carColors[idx % carColors.length]} roughness={0.3} metalness={0.7} />
                </mesh>
                <mesh position={[-0.3, 0.7, 0]}>
                  <boxGeometry args={[1.8, 0.8, 1.6]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} />
                </mesh>
              </group>

              {/* House Main Body (2-Story) */}
              <mesh position={[2, 2.6, 0]}>
                <boxGeometry args={[8.0, 5.2, 9.2]} />
                <meshStandardMaterial color={sidingColors[idx % sidingColors.length]} roughness={0.65} />
              </mesh>

              {/* Front Porch & Entrance Door */}
              <group position={[-2.2, 1.2, 0]}>
                <mesh position={[0, -0.6, 0]}>
                  <boxGeometry args={[1.6, 0.3, 3.2]} />
                  <meshStandardMaterial color="#94a3b8" />
                </mesh>
                <mesh position={[0, 1.2, 0]}>
                  <boxGeometry args={[1.6, 0.2, 3.4]} />
                  <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[0.2, 0.3, 0]}>
                  <boxGeometry args={[0.1, 1.9, 1.0]} />
                  <meshStandardMaterial color="#78350f" />
                </mesh>
              </group>

              {/* Gabled Architectural Shingle Roof */}
              <mesh position={[2, 6.2, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[6.2, 6.2, 9.8]} />
                <meshStandardMaterial color={roofColors[idx % roofColors.length]} roughness={0.8} />
              </mesh>

              {/* Windows (Warm golden glow at night) */}
              <mesh position={[-2.05, 2.8, 2.2]}>
                <planeGeometry args={[1.6, 1.6]} />
                <meshStandardMaterial
                  color={windowColor}
                  emissive={windowEmissive}
                  emissiveIntensity={windowIntensity}
                  side={DoubleSide}
                />
              </mesh>
              <mesh position={[-2.05, 2.8, -2.2]}>
                <planeGeometry args={[1.6, 1.6]} />
                <meshStandardMaterial
                  color={windowColor}
                  emissive={windowEmissive}
                  emissiveIntensity={windowIntensity}
                  side={DoubleSide}
                />
              </mesh>

              {/* Wooden Fenced Backyard (Separates homes from Data Center perimeter) */}
              <mesh position={[6.5, 0.9, 0]}>
                <boxGeometry args={[0.1, 1.8, 12]} />
                <meshStandardMaterial color="#78350f" roughness={0.9} />
              </mesh>

              {/* Streetlamp on Curb */}
              <group position={[-8.5, 0, 0]}>
                <mesh position={[0, 2.8, 0]}>
                  <cylinderGeometry args={[0.06, 0.08, 5.6, 8]} />
                  <meshStandardMaterial color="#64748b" metalness={0.8} />
                </mesh>
                <mesh position={[0.5, 5.6, 0]} rotation={[0, 0, -Math.PI / 6]}>
                  <cylinderGeometry args={[0.05, 0.05, 1.2, 8]} />
                  <meshStandardMaterial color="#64748b" />
                </mesh>
                {isNight && (
                  <pointLight position={[1.0, 5.8, 0]} intensity={9} distance={20} color="#fef08a" />
                )}
              </group>
            </group>
          );
        })}
      </group>

      {/* =========================================================================
          SOUTH BOUNDARY: 4-LANE ARTERIAL HIGHWAY (Waxpool Road Corridor)
          ========================================================================= */}
      <group position={[-16, 0, 58]}>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[220, 16]} />
          <meshStandardMaterial color="#141a24" roughness={0.8} />
        </mesh>
        {/* Concrete Jersey Safety Barrier in Center */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[220, 1.0, 0.6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {/* Painted Lane Markings */}
        {[-4, 4].map((lz) => (
          <mesh key={lz} position={[0, 0.035, lz]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[210, 0.25]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          WEST BOUNDARY: HIGH-VOLTAGE UTILITY SUBSTATION & TRANSMISSION TOWERS
          ========================================================================= */}
      <group position={[-60, 0, 0]}>
        {/* Crushed Rock / Gravel Yard Pad */}
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[32, 56]} />
          <meshStandardMaterial color="#475569" roughness={0.95} />
        </mesh>
        {/* Substation Chainlink Security Enclosure */}
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[32, 3.6, 56]} />
          <meshStandardMaterial color="#64748b" wireframe transparent opacity={0.4} />
        </mesh>

        {/* 2 High-Voltage Steel Lattice A-Frame Towers */}
        {[-18, 18].map((tz) => (
          <group key={tz} position={[-8, 0, tz]}>
            <mesh position={[0, 8, 0]}>
              <cylinderGeometry args={[0.3, 1.8, 16, 4]} />
              <meshStandardMaterial color="#94a3b8" wireframe />
            </mesh>
            <mesh position={[0, 14, 0]}>
              <boxGeometry args={[6, 0.4, 0.4]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
          </group>
        ))}

        {/* Step-Down Transformers with Cooling Radiator Fins */}
        {[-14, 0, 14].map((transZ) => (
          <group key={transZ} position={[4, 0, transZ]}>
            <mesh position={[0, 2.4, 0]}>
              <boxGeometry args={[6.0, 4.8, 6.0]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Cooling Fin Radiators */}
            {[-3.2, 3.2].map((rx) => (
              <mesh key={rx} position={[rx, 2.4, 0]}>
                <boxGeometry args={[0.4, 4.0, 5.2]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} />
              </mesh>
            ))}
            {/* Porcelain High-Voltage Bushings */}
            {[-1.8, 0, 1.8].map((bx) => (
              <mesh key={bx} position={[bx, 5.6, 0]}>
                <cylinderGeometry args={[0.18, 0.26, 2.0, 8]} />
                <meshStandardMaterial color="#b45309" roughness={0.2} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * Authentic Hyperscale Data Center Building
 * Exactly modeled after Google, AWS, and Equinix campuses:
 * - Precast concrete insulated sandwich panels with reveal joints
 * - Reflective white TPO membrane flat roof
 * - 8 Rooftop Air Handling Units (CRAHs / RTUs) with exhaust cowls
 * - Rooftop acoustic louver screen wall
 * - Loading dock bays with 2 parked 53-ft logistics dry-van trailers!
 * - Corporate blue glass curtain-wall entrance with steel canopy
 * - Backup diesel generator farm
 */
function DataCenterBuilding() {
  const buildingHeight = 7.8;

  return (
    <group position={[-18, 0, 0]}>
      {/* =========================================================================
          1. MAIN COMPUTE SERVER HALL STRUCTURE
          ========================================================================= */}
      {/* Precast Insulated Concrete Walls with Reveal Joints */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[30, buildingHeight, 38]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.12} />
      </mesh>

      {/* Dark Architectural Corporate Accent Band */}
      <mesh position={[0, buildingHeight * 0.76, 0]}>
        <boxGeometry args={[30.2, 0.9, 38.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>

      {/* =========================================================================
          2. WHITE TPO REFLECTIVE MEMBRANE ROOF & ROOFTOP CRAH / RTU UNITS
          ========================================================================= */}
      {/* White Heat-Reflective Roof Membrane */}
      <mesh position={[0, buildingHeight + 0.15, 0]}>
        <boxGeometry args={[30.4, 0.3, 38.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Roof Parapet Walls */}
      <mesh position={[0, buildingHeight + 0.6, 19.1]}>
        <boxGeometry args={[30.4, 0.9, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, buildingHeight + 0.6, -19.1]}>
        <boxGeometry args={[30.4, 0.9, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[15.1, buildingHeight + 0.6, 0]}>
        <boxGeometry args={[0.4, 0.9, 38.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[-15.1, buildingHeight + 0.6, 0]}>
        <boxGeometry args={[0.4, 0.9, 38.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* 8 Rooftop Air Handling Units (CRAH / RTU Penthouse Units) */}
      {[-8, 0, 8].map((rx) =>
        [-10, 0, 10].map((rz) => {
          if (rx === 0 && rz === 0) return null; // Center roof corridor
          return (
            <group key={`${rx}_${rz}`} position={[rx, buildingHeight + 0.3, rz]}>
              {/* HVAC Enclosure Box */}
              <mesh position={[0, 0.9, 0]}>
                <boxGeometry args={[4.2, 1.8, 3.4]} />
                <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Silver Vertical Exhaust Cowl */}
              <mesh position={[0, 2.1, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 0.6, 16]} />
                <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
              </mesh>
            </group>
          );
        })
      )}

      {/* Rooftop Acoustic Screen Louver Fence */}
      <mesh position={[0, buildingHeight + 1.2, 0]}>
        <boxGeometry args={[24, 1.8, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>

      {/* =========================================================================
          3. CORPORATE FRONT ENTRANCE (South Facade)
          ========================================================================= */}
      <group position={[0, 0, 19.2]}>
        {/* Tinted Corporate Blue Glass Curtain Wall */}
        <mesh position={[0, 3.2, 0]}>
          <boxGeometry args={[15, 4.8, 0.3]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} transparent opacity={0.75} />
        </mesh>
        {/* Modern Cantilevered Entrance Canopy */}
        <mesh position={[0, 4.4, 2.0]}>
          <boxGeometry args={[17, 0.4, 4.0]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} />
        </mesh>
        {/* Concrete Security Bollards */}
        {[-6, -3, 0, 3, 6].map((bx) => (
          <mesh key={bx} position={[bx, 0.5, 3.8]}>
            <cylinderGeometry args={[0.16, 0.16, 1.0, 12]} />
            <meshStandardMaterial color="#cbd5e1" />
          </mesh>
        ))}
      </group>

      {/* =========================================================================
          4. INDUSTRIAL LOADING DOCK & 53-FT LOGISTICS SEMI-TRAILERS (North Facade)
          ========================================================================= */}
      <group position={[0, 0, -19.2]}>
        {[-8, -2.5, 3, 8.5].map((dockX, idx) => (
          <group key={dockX} position={[dockX, 2.2, 0]}>
            {/* Roll-Up Overhead Dock Door */}
            <mesh>
              <boxGeometry args={[4.2, 3.8, 0.2]} />
              <meshStandardMaterial color="#334155" metalness={0.7} />
            </mesh>
            {/* Yellow Rubber Dock Bumpers */}
            <mesh position={[-1.8, -1.6, 0.2]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>
            <mesh position={[1.8, -1.6, 0.2]}>
              <boxGeometry args={[0.3, 0.8, 0.3]} />
              <meshStandardMaterial color="#eab308" />
            </mesh>

            {/* 2 Parked 53-ft Logistics Semi-Trailers Backed into Docks 1 and 3 */}
            {(idx === 0 || idx === 2) && (
              <group position={[0, 0.2, -7.5]}>
                {/* 53-Ft Dry-Van White Aluminum Cargo Trailer Body */}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[3.4, 3.6, 13.5]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.4} metalness={0.2} />
                </mesh>
                {/* Red Structural Steel Chassis Frame */}
                <mesh position={[0, -1.7, 0]}>
                  <boxGeometry args={[3.2, 0.3, 13.2]} />
                  <meshStandardMaterial color="#dc2626" />
                </mesh>
                {/* Rear Tandem Dual Wheels */}
                {[-1.4, 1.4].map((wx) => (
                  <group key={wx} position={[wx, -1.8, -4.5]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                      <cylinderGeometry args={[0.6, 0.6, 0.5, 16]} />
                      <meshStandardMaterial color="#1e293b" />
                    </mesh>
                  </group>
                ))}
              </group>
            )}
          </group>
        ))}
      </group>

      {/* =========================================================================
          5. BACKUP DIESEL GENERATOR FARM (West of Compute Core)
          ========================================================================= */}
      <group position={[-21, 0, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[8.5, 0.3, 30]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>
        {/* 4 Heavy-Duty Weatherproof Sound-Attenuated Generators */}
        {[-9, -3, 3, 9].map((genZ) => (
          <group key={genZ} position={[0, 0.3, genZ]}>
            <mesh position={[0, 1.6, 0]}>
              <boxGeometry args={[5.4, 2.8, 3.6]} />
              <meshStandardMaterial color="#374151" metalness={0.7} roughness={0.4} />
            </mesh>
            {/* Vertical Silver Silencer Stack */}
            <mesh position={[1.8, 4.0, 0]}>
              <cylinderGeometry args={[0.25, 0.25, 2.4, 12]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =========================================================================
          6. CHILLED WATER DISTRIBUTION MANIFOLDS (CHWS & CHWR)
          ========================================================================= */}
      <group position={[15.2, 1.6, 0]}>
        {/* Blue: Chilled Water Supply (CHWS, 7°C) */}
        <mesh position={[0, 0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 2.6, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} />
        </mesh>
        {/* Green: Chilled Water Return (CHWR, 14°C) */}
        <mesh position={[0, -0.45, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.35, 0.35, 2.6, 16]} />
          <meshStandardMaterial color="#10b981" metalness={0.7} />
        </mesh>
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

      {/* Equipment Dunnage Pad with Safety Yellow Perimeter Warning Line */}
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

      {/* Subterranean Excavation Walls */}
      {item.placement === "underground" && (
        <group>
          <mesh position={[8, 3, 0]}><boxGeometry args={[0.8, 6, 28]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[-8, 3, 0]}><boxGeometry args={[0.8, 6, 28]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 3, 14]}><boxGeometry args={[16, 6, 0.8]} /><meshStandardMaterial color="#1e293b" /></mesh>
          <mesh position={[0, 3, -14]}><boxGeometry args={[16, 6, 0.8]} /><meshStandardMaterial color="#1e293b" /></mesh>
        </group>
      )}

      {/* 3 Modular V-Bank Chiller Units */}
      <group rotation={[0, radAngle, 0]}>
        {[-8.5, 0, 8.5].map((chillerZ, idx) => (
          <group key={idx} position={[0, 0, chillerZ]}>
            {/* Structural Skid Frame */}
            <mesh position={[0, 0.4, 0]}>
              <boxGeometry args={[4.8, 0.8, 7.8]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
            </mesh>
            {/* Twin Screw Compressors */}
            <mesh position={[0, 1.1, -1.8]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 2.8, 16]} />
              <meshStandardMaterial color={item.silencers ? "#064e3b" : "#2563eb"} metalness={0.7} />
            </mesh>
            {/* V-Bank Coils */}
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

      {/* Main Wall Slab */}
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

      {/* Structural Steel Columns */}
      {[-12, -6, 0, 6, 12].map((z) => (
        <mesh key={z} position={[0.3, height / 2, z]}>
          <boxGeometry args={[0.35, height + 0.3, 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* Floating 3D Dimension Tag */}
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
 * Clean, modern, CAD-grade drag-and-drop spatial sandbox
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

  // Initialize Layout Items for Site
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
      x: 12,
      z: 0,
      height: 8,
      length: 28,
      rotation: 0,
      material: "absorptive_metal",
    },
    {
      id: "tree_1",
      type: "tree_cluster",
      x: 24,
      z: 0,
      depth: 16,
      speciesId: site.recommendedTreeId || "virginia_pine",
    },
    {
      id: "probe_1",
      type: "probe",
      x: 42,
      z: 0,
    },
  ]);

  // Reset layout to default when site changes
  useEffect(() => {
    setLayoutItems([
      {
        id: "chiller_compound",
        type: "chiller",
        x: site.id === "the_dalles_or" ? -38 : 2,
        z: 0,
        placement: site.id === "the_dalles_or" ? "rear_shielded" : "side_exposed",
        silencers: site.id === "dublin_ie",
        rotation: 0,
      },
      {
        id: "wall_1",
        type: "wall",
        x: 12,
        z: 0,
        height: site.id === "phoenix_az" ? 10 : 8,
        length: 28,
        rotation: 0,
        material: site.id === "the_dalles_or" ? "mass_timber" : "absorptive_metal",
      },
      {
        id: "tree_1",
        type: "tree_cluster",
        x: 24,
        z: 0,
        depth: 16,
        speciesId: site.recommendedTreeId || "virginia_pine",
      },
      {
        id: "probe_1",
        type: "probe",
        x: 42,
        z: 0,
      },
    ]);
    setSelectedId(null);
  }, [site]);

  // Global Pointer Up listener to ensure drag release is always caught
  useEffect(() => {
    const handleUp = () => setIsDragging(null);
    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, []);

  // Keyboard Delete / Backspace support for selected items
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

  // Update item position during drag
  const handleGroundPointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();

    const newX = Math.max(-50, Math.min(48, Math.round(e.point.x)));
    const newZ = Math.max(-55, Math.min(55, Math.round(e.point.z)));

    setLayoutItems((prev) =>
      prev.map((item) =>
        item.id === isDragging ? { ...item, x: newX, z: newZ } : item
      )
    );
  };

  const handleGroundPointerUp = () => {
    setIsDragging(null);
  };

  // Add Wall
  const handleAddWall = () => {
    const newWall = {
      id: `wall_${Date.now()}`,
      type: "wall",
      x: 12,
      z: (Math.random() - 0.5) * 20,
      height: 8,
      length: 28,
      rotation: 0,
      material: "absorptive_metal",
    };
    setLayoutItems((prev) => [...prev, newWall]);
    setSelectedId(newWall.id);
  };

  // Add Trees
  const handleAddTrees = () => {
    const newTrees = {
      id: `tree_${Date.now()}`,
      type: "tree_cluster",
      x: 24,
      z: (Math.random() - 0.5) * 20,
      depth: 16,
      speciesId: site.recommendedTreeId || "virginia_pine",
    };
    setLayoutItems((prev) => [...prev, newTrees]);
    setSelectedId(newTrees.id);
  };

  // Delete Selected
  const handleDeleteSelected = () => {
    if (!selectedId) return;
    if (selectedId.startsWith("chiller") || selectedId.startsWith("probe")) return;
    setLayoutItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  };

  // Update an item's property
  const updateSelectedItem = (patch) => {
    if (!selectedId) return;
    setLayoutItems((prev) =>
      prev.map((item) => (item.id === selectedId ? { ...item, ...patch } : item))
    );
  };

  // Extract primary objects
  const chiller = layoutItems.find((i) => i.type === "chiller") || {
    x: 2,
    z: 0,
    placement: "side_exposed",
    silencers: false,
    rotation: 0,
  };
  const probe = layoutItems.find((i) => i.type === "probe") || { x: 42, z: 0 };
  const walls = layoutItems.filter((i) => i.type === "wall");
  const treeClusters = layoutItems.filter((i) => i.type === "tree_cluster");

  const selectedItem = layoutItems.find((i) => i.id === selectedId);

  // REAL-TIME ACOUSTIC CALCULATION BASED ON 3D PLACEMENT
  const acousticResults = useMemo(() => {
    // 1. Source Sound Power Lw
    const tempPenalty = Math.max(0, (site.ambientTempC - 20) * 0.4);
    const fanRatio = Math.max(0.2, fanSpeedPercent / 100);
    const fanSpeedPenalty = 18 * Math.log10(fanRatio / 0.75);
    const powerScale = 10 * Math.log10(Math.max(100, itPowerKw) / 500);
    const baseLw = 108.0;
    const sourceLw = baseLw + tempPenalty + fanSpeedPenalty + powerScale;

    // 2. Real-World Distance Calculation from 3D Coordinates
    const dx = probe.x - chiller.x;
    const dz = probe.z - chiller.z;
    const sceneDist = Math.hypot(dx, dz);
    const distanceMeters = Math.max(15, Math.round((sceneDist / 40) * site.defaultDistanceToHomesMeters));
    const distanceDecay = 20 * Math.log10(distanceMeters) + 11;

    // 3. Building Shielding
    let buildingShieldingDb = 0;
    if (chiller.x < -16 && probe.x > -4) {
      buildingShieldingDb = 16.0;
    }

    // 4. Placement Attenuation
    let placementAttenDb = 0;
    if (chiller.placement === "underground") placementAttenDb = 28.0;
    else if (chiller.placement === "semi_berm") placementAttenDb = 11.5;
    else if (chiller.placement === "rear_shielded") placementAttenDb = 18.0;

    // 5. Intervening Barrier Walls Attenuation
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

    // 6. Intervening Tree Buffer Attenuation
    let treeAttenDb = 0;
    treeClusters.forEach((t) => {
      if (t.x > minX && t.x < maxX && Math.abs(t.z - (chiller.z + probe.z) / 2) < (t.depth || 16) + 10) {
        const spec = REGIONAL_TREE_SPECIES[t.speciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
        const thisTreeDb = (t.depth || 16) * (spec.acousticAbsorptionCoeff || 0.18) * 2.0;
        treeAttenDb += thisTreeDb;
      }
    });
    treeAttenDb = Math.min(14.0, treeAttenDb);

    // 7. Equipment Silencers & Directivity
    const silencerDb = chiller.silencers ? 5.5 : 0;
    const directivityDb = (chiller.rotation || 0) >= 135 ? 4.0 : 0;

    // 8. Day vs Night Atmospheric Thermal Inversion
    const inversionDb = timeOfDay === "night" ? 1.8 : -1.2;
    const terrainEchoDb = site.terrainEchoAmplificationDb || 0;

    // Net Received Noise at Community Sensor
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
      breakdown: {
        distanceDecay: Math.round(distanceDecay * 10) / 10,
        buildingShieldingDb: Math.round(buildingShieldingDb * 10) / 10,
        placementAttenDb: Math.round(placementAttenDb * 10) / 10,
        wallAttenDb: Math.round(wallAttenDb * 10) / 10,
        treeAttenDb: Math.round(treeAttenDb * 10) / 10,
        silencerDb,
      },
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

  // Sync Audio Synthesizer
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
      {/* =========================================================================
          1. CLEAN FLOATING TOP HEADER PILL (Minimalist, Calm, Executive)
          ========================================================================= */}
      <div className="clean-floating-top-bar">
        {/* Site Flag & Title */}
        <div className="top-site-badge">
          <span className="top-site-flag">{site.country === "Ireland" ? "🇮🇪" : "🇺🇸"}</span>
          <span className="top-site-name">{site.name}</span>
          <span className="top-site-tag">SPATIAL TWIN</span>
        </div>

        {/* Day / Night Curfew Switcher */}
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

        {/* Listen at Sensor Button */}
        <button
          className={`top-audio-btn ${audioPlaying ? "playing" : ""}`}
          onClick={toggleAudio}
          title="Click to hear synthesized noise at neighbor's property"
        >
          {audioPlaying ? "🔊 Sound Active" : "🔈 Listen at Sensor"}
        </button>

        {/* Camera Perspective Reset */}
        <div className="top-camera-group">
          <button className="top-cam-btn" onClick={() => setCameraPreset("top")} title="Top-down 2D schematic">
            🗺️ 2D Plan
          </button>
          <button className="top-cam-btn" onClick={() => setCameraPreset("reset")} title="Isometric 3D perspective">
            ↺ 3D View
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. CLEAN FLOATING DECIBEL STATUS CARD (Top Right)
          ========================================================================= */}
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

      {/* =========================================================================
          3. MAIN 3D THREE.JS CANVAS
          ========================================================================= */}
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
          <Canvas camera={{ position: [36, 44, 62], fov: 45 }} dpr={[1, 1.5]}>
            <color attach="background" args={[isNight ? "#030712" : "#38bdf8"]} />
            <ambientLight intensity={isNight ? 0.4 : 1.8} />
            <directionalLight
              position={isNight ? [-25, 40, -30] : [35, 60, 40]}
              intensity={isNight ? 0.6 : 2.8}
              color={isNight ? "#93c5fd" : "#fffbeb"}
              castShadow
            />
            {isNight && (
              <group position={[chiller.x, 10, chiller.z]}>
                <pointLight intensity={30} distance={50} color="#f8fafc" />
              </group>
            )}

            {/* Interactive Ground Plane with Security Fencing, Parking, and Retention Basin */}
            <InteractiveGround
              terrainType={site.terrainType}
              timeOfDay={timeOfDay}
              onGroundPointerMove={handleGroundPointerMove}
              onGroundPointerUp={handleGroundPointerUp}
              onDeselect={() => setSelectedId(null)}
            />

            {/* 360 Surroundings (Residential Neighborhood East, Highway South, Substation West) */}
            <SurroundingLandscape site={site} timeOfDay={timeOfDay} />

            {/* Hyperscale Building with Rooftop HVAC, Loading Docks, and Parked Logistics Trailers */}
            <DataCenterBuilding />

            {/* Draggable Chiller Compound */}
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

            {/* Concentric Isophone Circles */}
            <ConcentricNoiseRings centerPos={[chiller.x, chiller.z]} radii={isophoneRadii} />

            {/* Smooth Orbit / Pan Controls */}
            <SiteCameraControls
              navMode={navMode}
              cameraPreset={cameraPreset}
              isDragging={isDragging !== null}
            />
          </Canvas>
        </WebGLBoundary>
      </div>

      {/* =========================================================================
          4. CONTEXTUAL INSPECTOR PILL (Appears ONLY when an object is selected!)
          ========================================================================= */}
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
                <span className="inspector-hint">Drag anywhere across neighborhood to test decibels</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          5. CLEAN FLOATING BOTTOM ACTION DOCK (Figma / Mac Dock Style)
          ========================================================================= */}
      <div className="clean-floating-dock">
        {/* Navigation Mode */}
        <button
          className={`dock-btn ${navMode === "orbit" ? "active" : ""}`}
          onClick={() => setNavMode(navMode === "orbit" ? "pan" : "orbit")}
          title="Toggle camera Orbit vs Pan"
        >
          <span className="dock-icon">{navMode === "orbit" ? "🔄" : "✋"}</span>
          <span className="dock-label">{navMode === "orbit" ? "Orbit 3D" : "Pan 2D"}</span>
        </button>

        <div className="dock-divider"></div>

        {/* Add Wall */}
        <button className="dock-btn primary" onClick={handleAddWall} title="Add a new sound barrier wall">
          <span className="dock-icon">🧱</span>
          <span className="dock-label">+ Add Wall</span>
        </button>

        {/* Add Trees */}
        <button className="dock-btn primary" onClick={handleAddTrees} title="Plant a bio-acoustic tree screen">
          <span className="dock-icon">🌲</span>
          <span className="dock-label">+ Plant Trees</span>
        </button>

        {/* Delete button (active only when something is selected) */}
        {selectedItem && selectedItem.type !== "chiller" && selectedItem.type !== "probe" && (
          <button className="dock-btn danger" onClick={handleDeleteSelected} title="Delete selected object (Delete key)">
            <span className="dock-icon">🗑️</span>
            <span className="dock-label">Delete</span>
          </button>
        )}

        <div className="dock-divider"></div>

        {/* Reset Layout */}
        <button
          className="dock-btn"
          onClick={() => {
            setLayoutItems([
              { id: "chiller_compound", type: "chiller", x: 2, z: 0, placement: "side_exposed", silencers: false, rotation: 0 },
              { id: "wall_1", type: "wall", x: 12, z: 0, height: 8, length: 28, rotation: 0, material: "absorptive_metal" },
              { id: "tree_1", type: "tree_cluster", x: 24, z: 0, depth: 16, speciesId: site.recommendedTreeId || "virginia_pine" },
              { id: "probe_1", type: "probe", x: 42, z: 0 },
            ]);
            setSelectedId(null);
          }}
          title="Reset elements to initial positions"
        >
          <span className="dock-icon">↺</span>
          <span className="dock-label">Reset</span>
        </button>

        {/* Detailed Engineering Report Drawer */}
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
