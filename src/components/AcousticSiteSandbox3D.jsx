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
    orbit.current.maxDistance = 160;
    orbit.current.maxPolarAngle = Math.PI / 2 - 0.03;
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
 * Ground terrain matching the satellite geography
 */
function Ground({ terrainType, onGroundClick, onGroundPointerMove, onGroundPointerUp, onGroundPointerDown }) {
  let groundColor = "#132319"; // Temperate grass
  let gridColor = "#223d2b";
  if (terrainType === "desert_plain") {
    groundColor = "#332617"; // Arid desert sand
    gridColor = "#4d3822";
  } else if (terrainType === "mountain_canyon") {
    groundColor = "#1a2123"; // Basalt rock
    gridColor = "#2c383b";
  } else if (terrainType === "coastal_rolling") {
    groundColor = "#0f261e"; // Irish lush peat
    gridColor = "#1b4033";
  }

  return (
    <group position={[0, -0.05, 0]}>
      {/* Main Ground Surface */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={onGroundClick}
        onPointerDown={onGroundPointerDown}
        onPointerMove={onGroundPointerMove}
        onPointerUp={onGroundPointerUp}
      >
        <planeGeometry args={[220, 160]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} />
      </mesh>
      <gridHelper args={[220, 44, gridColor, gridColor]} position={[0, 0.01, 0]} />

      {/* Concrete Apron / Roadway around Data Center Facility */}
      <mesh position={[-18, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[46, 48]} />
        <meshStandardMaterial color="#1c232e" roughness={0.7} />
      </mesh>

      {/* Surrounding Perimeter Roadway */}
      <mesh position={[10, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6, 80]} />
        <meshStandardMaterial color="#222b37" roughness={0.6} />
      </mesh>
    </group>
  );
}

/**
 * Mountain canyon backdrop for Columbia River Gorge
 */
function TerrainBackdrop({ terrainType }) {
  if (terrainType !== "mountain_canyon") return null;
  return (
    <group position={[0, 0, -60]}>
      {[-55, -25, 5, 35, 65].map((x, i) => (
        <mesh key={i} position={[x, 14 + (i % 2) * 6, 0]}>
          <coneGeometry args={[24, 32 + (i % 3) * 8, 5]} />
          <meshStandardMaterial color="#1e262b" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Realistic Hyperscale Data Center Building
 * Supports Iron Man Exploded View ("Stark Mode")
 */
function DataCenterBuilding({ explodedProgress = 0 }) {
  const roofLift = 14 * explodedProgress;
  const wallSpread = 7 * explodedProgress;

  // Floating Stark HUD texture
  const starkHudTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "rgba(10, 25, 45, 0.85)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 512, 128, 16);
    } else {
      ctx.rect(0, 0, 512, 128);
    }
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 26px sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.fillText("⚡ STARK HOLOGRAPHIC DISASSEMBLY", 256, 42);

    ctx.font = "20px monospace";
    ctx.fillStyle = "#67e8f9";
    ctx.fillText("48U COMPUTE ROWS · AIR LOUVERS · SUBSTATION", 256, 82);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("INTERNAL CORE REVEALED", 256, 112);

    return new CanvasTexture(canvas);
  }, []);

  useEffect(() => () => starkHudTexture.dispose(), [starkHudTexture]);

  return (
    <group position={[-18, 0, 0]}>
      {/* =========================================
          INTERNAL SERVER HALL (REVEALED IN EXPLODED VIEW)
          ========================================= */}
      <group position={[0, 0, 0]}>
        {/* Raised Floor System */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[26, 0.6, 34]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
        </mesh>

        {/* 4 Rows of 48U Server Racks with Cyan LED Indicators */}
        {[-9, -3, 3, 9].map((rowZ) => (
          <group key={rowZ} position={[0, 0.7, rowZ]}>
            {/* Server Rack Cabinets */}
            {[-9, -5, -1, 3, 7].map((colX) => (
              <group key={colX} position={[colX, 2.5, 0]}>
                {/* 48U Steel Frame */}
                <mesh>
                  <boxGeometry args={[2.2, 5.0, 1.8]} />
                  <meshStandardMaterial color="#0b1320" metalness={0.8} roughness={0.3} />
                </mesh>
                {/* Glowing Server Status LEDs */}
                <mesh position={[0, 0, 0.92]}>
                  <planeGeometry args={[1.8, 4.4]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
                </mesh>
                {/* Server Rack Top Light Strip */}
                <mesh position={[0, 2.55, 0]}>
                  <boxGeometry args={[2.2, 0.1, 0.2]} />
                  <meshBasicMaterial color="#34d399" />
                </mesh>
              </group>
            ))}

            {/* Cold Aisle Containment Roof & Air Baffles */}
            <mesh position={[0, 5.4, 0]}>
              <boxGeometry args={[22, 0.15, 2.8]} />
              <meshStandardMaterial color="#38bdf8" transparent opacity={0.3} />
            </mesh>
          </group>
        ))}

        {/* Indoor CRAC Units (Computer Room Air Handlers) */}
        {[-11, 11].map((x) => (
          <group key={x} position={[x, 2.6, 0]}>
            <mesh>
              <boxGeometry args={[1.6, 5.2, 12]} />
              <meshStandardMaterial color="#334155" metalness={0.7} />
            </mesh>
            <mesh position={[0, 2.7, 0]}>
              <cylinderGeometry args={[0.6, 0.6, 0.4, 12]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
          </group>
        ))}

        {/* Overhead Yellow Fiber Trays and Blue Chilled Header Loop */}
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[24, 0.2, 0.6]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
        <mesh position={[0, 6.6, 0]}>
          <boxGeometry args={[24, 0.3, 0.3]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
      </group>

      {/* =========================================
          EXTERIOR TILT-UP CONCRETE WALLS (DISASSEMBLED IN STARK MODE)
          ========================================= */}
      {/* Front Wall (Facing Chiller Yard +X) */}
      <group position={[14 + wallSpread, 5.5, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 11, 36]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            metalness={0.4}
            transparent={explodedProgress > 0}
            opacity={Math.max(0.25, 1 - explodedProgress * 0.75)}
          />
        </mesh>
        {/* Louver Filter Panels on Front Wall */}
        {[-10, -5, 0, 5, 10].map((z) => (
          <mesh key={z} position={[0.35, -2.3, z]}>
            <boxGeometry args={[0.1, 3.5, 3.8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Rear Wall (-X) */}
      <group position={[-14 - wallSpread, 5.5, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 11, 36]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            transparent={explodedProgress > 0}
            opacity={Math.max(0.25, 1 - explodedProgress * 0.75)}
          />
        </mesh>
      </group>

      {/* Left Wall (-Z) */}
      <group position={[0, 5.5, -18 - wallSpread]}>
        <mesh>
          <boxGeometry args={[28, 11, 0.6]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            transparent={explodedProgress > 0}
            opacity={Math.max(0.25, 1 - explodedProgress * 0.75)}
          />
        </mesh>
      </group>

      {/* Right Wall (+Z) */}
      <group position={[0, 5.5, 18 + wallSpread]}>
        <mesh>
          <boxGeometry args={[28, 11, 0.6]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.5}
            transparent={explodedProgress > 0}
            opacity={Math.max(0.25, 1 - explodedProgress * 0.75)}
          />
        </mesh>
      </group>

      {/* =========================================
          ROOF DECK & PARAPET (LIFTS UP IN EXPLODED VIEW)
          ========================================= */}
      <group position={[0, 11.2 + roofLift, 0]}>
        {/* Main Roof Slab */}
        <mesh>
          <boxGeometry args={[28.5, 0.6, 36.5]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.3}
            transparent={explodedProgress > 0}
            opacity={Math.max(0.35, 1 - explodedProgress * 0.65)}
          />
        </mesh>
        {/* Perimeter Parapet Flashing */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[28.7, 0.4, 36.7]} />
          <meshStandardMaterial color="#475569" wireframe={explodedProgress > 0.4} />
        </mesh>

        {/* Holographic Projection Marker in Stark Mode */}
        {explodedProgress > 0.25 && (
          <sprite position={[0, 5, 0]} scale={[12, 3, 1]}>
            <spriteMaterial map={starkHudTexture} depthTest={false} transparent opacity={0.9} />
          </sprite>
        )}
      </group>

      {/* High-Voltage Substation Yard & Transformers */}
      <group position={[-18, 0, 14]}>
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[6.5, 2.8, 6.5]} />
          <meshStandardMaterial color="#475569" wireframe={true} />
        </mesh>
        <mesh position={[-1.4, 1.5, 0]}>
          <boxGeometry args={[2.2, 3, 2.6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[1.4, 1.5, 0]}>
          <boxGeometry args={[2.2, 3, 2.6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
      </group>

      {/* Chilled Water Header Piping Loop (Supply: Blue, Return: Orange) */}
      <group position={[14.2, 1.8, 0]}>
        <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.2, 12]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
        <mesh position={[0.2, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.2, 12]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * 400-ton Industrial V-Bank Air-Cooled Chiller Unit
 * Supports Iron Man component disassembly
 */
function VBankChillerUnit({ position, running, fanSpeedPercent, explodedProgress = 0 }) {
  const fans = [useRef(), useRef(), useRef(), useRef()];

  useFrame((_, delta) => {
    if (running) {
      const rot = delta * (fanSpeedPercent / 100) * 20;
      fans.forEach((ref) => {
        if (ref.current) ref.current.rotation.y += rot;
      });
    }
  });

  const fanLift = 7 * explodedProgress;
  const coilSpread = 1.2 * explodedProgress;
  const skidDrop = -1.0 * explodedProgress;

  return (
    <group position={position}>
      {/* 1. Lower Skid & Twin-Screw Compressor Housing */}
      <group position={[0, skidDrop, 0]}>
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[6.2, 1.2, 2.8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.45, 0.45, 5.8, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Slanted V-Bank Condenser Coils (Separates outward in Stark mode) */}
      {/* Left Coil Bank */}
      <mesh
        position={[-0.7 - coilSpread, 2.2 + 1.5 * explodedProgress, 0]}
        rotation={[0, 0, Math.PI / 12 + 0.35 * explodedProgress]}
      >
        <boxGeometry args={[0.2, 2.2, 5.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Right Coil Bank */}
      <mesh
        position={[0.7 + coilSpread, 2.2 + 1.5 * explodedProgress, 0]}
        rotation={[0, 0, -Math.PI / 12 - 0.35 * explodedProgress]}
      >
        <boxGeometry args={[0.2, 2.2, 5.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* 3. Upper Fan Deck Plenum */}
      <mesh position={[0, 3.2 + 3.5 * explodedProgress, 0]}>
        <boxGeometry args={[2.0, 0.2, 5.8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 4. Four Upward-Blowing Axial Condenser Fans (Levitate high in Stark mode) */}
      {[-1.8, -0.6, 0.6, 1.8].map((z, idx) => (
        <group key={z} position={[0, 3.35 + fanLift, z]}>
          {/* Fan Cowling Cylinder */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.35, 16]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.7}
              emissive={explodedProgress > 0.2 ? "#38bdf8" : "#000"}
              emissiveIntensity={explodedProgress * 0.4}
            />
          </mesh>
          {/* Rotating Fan Blades */}
          <group ref={fans[idx]}>
            {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle) => (
              <mesh key={angle} rotation={[0, angle, 0]} position={[0, 0.1, 0]}>
                <boxGeometry args={[0.95, 0.04, 0.16]} />
                <meshStandardMaterial color="#94a3b8" />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Chilled Water Ports */}
      <mesh position={[3.2, 0.6, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
        <meshStandardMaterial color="#0284c7" />
      </mesh>
      <mesh position={[3.2, 0.6, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
        <meshStandardMaterial color="#ea580c" />
      </mesh>
    </group>
  );
}

/**
 * Chiller Compound Yard
 */
function ChillerYard({
  placement,
  running,
  fanSpeedPercent,
  orientationAngle,
  explodedProgress,
  compoundOffset = [0, 0],
}) {
  let yardPos = [2 + compoundOffset[0], 0, compoundOffset[1]];
  let isUnderground = placement === "underground";
  let isSemiBerm = placement === "semi_berm";
  let isRooftop = placement === "rooftop";
  let isRearShielded = placement === "rear_shielded";

  if (isRearShielded) {
    yardPos = [-38 + compoundOffset[0], 0, compoundOffset[1]];
  } else if (isRooftop) {
    yardPos = [-18 + compoundOffset[0], 11.2, compoundOffset[1]];
  } else if (isUnderground) {
    yardPos = [2 + compoundOffset[0], -4.5, compoundOffset[1]];
  } else if (isSemiBerm) {
    yardPos = [2 + compoundOffset[0], -1.8, compoundOffset[1]];
  }

  const radAngle = (orientationAngle * Math.PI) / 180;

  return (
    <group position={yardPos}>
      {/* Subterranean Excavation Pit */}
      {(isUnderground || isSemiBerm) && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[18, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          <mesh position={[-9, Math.abs(yardPos[1]) / 2, 0]}>
            <boxGeometry args={[0.4, Math.abs(yardPos[1]), 24]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[9, Math.abs(yardPos[1]) / 2, 0]}>
            <boxGeometry args={[0.4, Math.abs(yardPos[1]), 24]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, Math.abs(yardPos[1]) / 2, -12]}>
            <boxGeometry args={[18, Math.abs(yardPos[1]), 0.4]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, Math.abs(yardPos[1]) / 2, 12]}>
            <boxGeometry args={[18, Math.abs(yardPos[1]), 0.4]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
        </group>
      )}

      {/* Earth Berm for Semi-Bermed Basin */}
      {isSemiBerm && (
        <group position={[10, 1.8, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[3.2, 3.2, 26]} />
            <meshStandardMaterial color="#2d4a35" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Bank of 3 Chillers */}
      <group rotation={[0, radAngle, 0]}>
        <VBankChillerUnit
          position={[0, 0, -7.5]}
          running={running}
          fanSpeedPercent={fanSpeedPercent}
          explodedProgress={explodedProgress}
        />
        <VBankChillerUnit
          position={[0, 0, 0]}
          running={running}
          fanSpeedPercent={fanSpeedPercent}
          explodedProgress={explodedProgress}
        />
        <VBankChillerUnit
          position={[0, 0, 7.5]}
          running={running}
          fanSpeedPercent={fanSpeedPercent}
          explodedProgress={explodedProgress}
        />
      </group>
    </group>
  );
}

/**
 * Acoustic Barrier Wall (Draggable along X/Z)
 */
function AcousticBarrierWall({
  enabled,
  heightMeters,
  materialId,
  placement,
  wallOffset = [0, 0],
  isDraggable = false,
}) {
  if (!enabled || heightMeters <= 0) return null;

  const materialConfig = WALL_MATERIALS[materialId] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = materialId === "transparent_acrylic";

  let wallX = 12 + wallOffset[0];
  let wallY = 0;
  let wallZ = 0 + wallOffset[1];

  if (placement === "rear_shielded") {
    wallX = -46 + wallOffset[0];
  } else if (placement === "rooftop") {
    wallX = -9 + wallOffset[0];
    wallY = 11.2;
  }

  return (
    <group position={[wallX, wallY, wallZ]}>
      {/* Main Sound Wall */}
      <mesh position={[0, heightMeters / 2, 0]}>
        <boxGeometry args={[0.4, heightMeters, 32]} />
        <meshStandardMaterial
          color={materialConfig.color}
          roughness={isTransparent ? 0.1 : 0.6}
          metalness={materialId === "absorptive_metal" ? 0.7 : 0.1}
          transparent={isTransparent}
          opacity={isTransparent ? 0.45 : 1.0}
        />
      </mesh>
      {/* Return Wings */}
      <mesh position={[-2, heightMeters / 2, 16.5]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, heightMeters, 6]} />
        <meshStandardMaterial
          color={materialConfig.color}
          roughness={isTransparent ? 0.1 : 0.6}
          transparent={isTransparent}
          opacity={isTransparent ? 0.45 : 1.0}
        />
      </mesh>
      <mesh position={[-2, heightMeters / 2, -16.5]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.4, heightMeters, 6]} />
        <meshStandardMaterial
          color={materialConfig.color}
          roughness={isTransparent ? 0.1 : 0.6}
          transparent={isTransparent}
          opacity={isTransparent ? 0.45 : 1.0}
        />
      </mesh>

      {/* Structural Columns */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <mesh key={z} position={[0.25, heightMeters / 2, z]}>
          <boxGeometry args={[0.3, heightMeters + 0.4, 0.25]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}

      {/* Drag Indicator Ring if draggable */}
      {isDraggable && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.2, 24]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

/**
 * Procedural Tree & Bio-Buffer Zone
 */
function ProceduralTree({ position, species }) {
  const isConical = species.foliageShape === "conical" || species.foliageShape === "tall_conical";
  const isColumnar = species.foliageShape === "columnar";
  const isPyramidal = species.foliageShape === "pyramidal";

  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.2, 0.3, 2.4, 8]} />
        <meshStandardMaterial color={species.trunkColor || "#3e2723"} roughness={0.9} />
      </mesh>
      {isConical && (
        <group position={[0, 3.8, 0]}>
          <mesh position={[0, -0.6, 0]}>
            <coneGeometry args={[1.8, 3.2, 8]} />
            <meshStandardMaterial color={species.color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <coneGeometry args={[1.3, 2.6, 8]} />
            <meshStandardMaterial color={species.color} roughness={0.8} />
          </mesh>
        </group>
      )}
      {isColumnar && (
        <mesh position={[0, 3.2, 0]}>
          <cylinderGeometry args={[0.8, 1.0, 4.2, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
      {isPyramidal && (
        <mesh position={[0, 2.8, 0]}>
          <coneGeometry args={[1.6, 3.8, 7]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
      {!isConical && !isColumnar && !isPyramidal && (
        <mesh position={[0, 3.5, 0]}>
          <sphereGeometry args={[1.9, 8, 8]} />
          <meshStandardMaterial color={species.color} roughness={0.8} />
        </mesh>
      )}
    </group>
  );
}

function VegetationBufferZone({ enabled, depthMeters, treeSpeciesId, treeOffset = [0, 0] }) {
  if (!enabled || depthMeters <= 0) return null;

  const species = REGIONAL_TREE_SPECIES[treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;
  const rows = Math.max(1, Math.min(8, Math.round(depthMeters / 6)));

  const trees = useMemo(() => {
    const list = [];
    const startX = 18 + treeOffset[0];
    const spacingX = Math.min(5, depthMeters / rows);
    for (let r = 0; r < rows; r++) {
      const x = startX + r * spacingX;
      for (let z = -20 + treeOffset[1]; z <= 20 + treeOffset[1]; z += 4.5) {
        const jitterZ = ((r % 2) - 0.5) * 1.8;
        list.push([x, 0, z + jitterZ]);
      }
    }
    return list;
  }, [rows, depthMeters, treeOffset]);

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
 * Dynamically expands/contracts based on real-time ISO 9613-2 link budget!
 */
function ConcentricNoiseCircles({ isophoneRadii, chillerPlacement, originPos = [2, 0, 0] }) {
  const pulseRef = useRef();

  useFrame((_, delta) => {
    if (pulseRef.current) {
      pulseRef.current.rotation.z -= delta * 0.2;
    }
  });

  let originX = originPos[0];
  if (chillerPlacement === "rear_shielded") originX = -38;
  else if (chillerPlacement === "rooftop") originX = -18;

  // Color mapping by decibel level
  const getColorForDba = (dba) => {
    if (dba >= 75) return "#ef4444"; // Red (Critical machinery roar)
    if (dba >= 65) return "#f97316"; // Orange (Heavy industrial zone)
    if (dba >= 55) return "#eab308"; // Amber (Daytime annoyance limit)
    if (dba >= 45) return "#10b981"; // Green (Nighttime curfew limit)
    return "#38bdf8"; // Cyan (Quiet sleep sanctuary)
  };

  // Convert real-world meters into scene units (10m ~ 1 unit, calibrated smoothly)
  const meterToSceneScale = (m) => Math.max(4, Math.min(65, 3 + (m / 600) * 48));

  return (
    <group position={[originX, 0.08, originPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      {isophoneRadii.map((ring, idx) => {
        const sceneRadius = meterToSceneScale(ring.radiusMeters);
        const color = getColorForDba(ring.targetDba);

        return (
          <group key={ring.targetDba}>
            {/* Primary Isophone Circle */}
            <mesh position={[0, 0, 0.005 * (idx + 1)]}>
              <ringGeometry args={[sceneRadius - 0.25, sceneRadius + 0.25, 64]} />
              <meshBasicMaterial color={color} transparent opacity={0.65} side={DoubleSide} />
            </mesh>

            {/* Subtle semi-transparent area fill */}
            <mesh position={[0, 0, 0.002 * (idx + 1)]}>
              <ringGeometry args={[sceneRadius * 0.95, sceneRadius, 64]} />
              <meshBasicMaterial color={color} transparent opacity={0.12} side={DoubleSide} />
            </mesh>
          </group>
        );
      })}

      {/* Rotating Pulse Marker */}
      <mesh ref={pulseRef} position={[0, 0, 0.03]}>
        <ringGeometry args={[12, 12.3, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * Interactive Sound Pointer / Spatial Probe
 * User can click anywhere to place or drag across the terrain
 */
function InteractiveNoiseProbe({ probePos, probeTelemetry, isDraggingProbe, onPointerDown }) {
  // Floating Canvas Sprite showing live dBA & Distance
  const probeSprite = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 460;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "rgba(11, 19, 34, 0.92)";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 460, 160, 18);
    } else {
      ctx.rect(0, 0, 460, 160);
    }
    ctx.fill();

    const isComp = probeTelemetry?.isCompliant ?? true;
    ctx.strokeStyle = isComp ? "#34d399" : "#ef4444";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 32px sans-serif";
    ctx.fillStyle = isComp ? "#34d399" : "#ef4444";
    ctx.fillText(`${probeTelemetry?.netDba?.toFixed(1) || 45.0} dBA`, 230, 46);

    ctx.font = "bold 20px monospace";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(`Distance: ${probeTelemetry?.distanceMeters || 100}m · ${probeTelemetry?.netDbc || 58} dBC`, 230, 88);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = isComp ? "#a7f3d0" : "#fca5a5";
    ctx.fillText(
      isComp
        ? "✓ COMPLIANT WITH NIGHT LIMIT"
        : `⚠ VIOLATION (+${Math.abs(probeTelemetry?.marginDb || 0)} dB)`,
      230,
      124
    );

    ctx.font = "14px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("📍 INTERACTIVE SOUND PROBE", 230, 148);

    return new CanvasTexture(canvas);
  }, [probeTelemetry]);

  useEffect(() => () => probeSprite.dispose(), [probeSprite]);

  return (
    <group position={[probePos[0], 0, probePos[1]]}>
      {/* Ground Target Ring & Pulsing Beacon */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} onPointerDown={onPointerDown}>
        <ringGeometry args={[1.4, 2.0, 32]} />
        <meshBasicMaterial
          color={probeTelemetry?.isCompliant ? "#34d399" : "#ef4444"}
          transparent
          opacity={0.8}
          side={DoubleSide}
        />
      </mesh>

      {/* Vertical Holographic Probe Mast */}
      <mesh position={[0, 3.5, 0]} onPointerDown={onPointerDown}>
        <cylinderGeometry args={[0.08, 0.12, 7, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.9} emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>

      {/* Glowing Sensor Sphere */}
      <mesh position={[0, 7.2, 0]} onPointerDown={onPointerDown}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial
          color={probeTelemetry?.isCompliant ? "#34d399" : "#ef4444"}
          emissive={probeTelemetry?.isCompliant ? "#10b981" : "#ef4444"}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Floating 3D Telemetry Billboard Sprite */}
      <sprite position={[0, 10.2, 0]} scale={[8.5, 3.0, 1]}>
        <spriteMaterial map={probeSprite} depthTest={false} transparent />
      </sprite>
    </group>
  );
}

/**
 * Residential Receptor House at Site Property Line
 */
function ResidentialReceptor({ distanceMeters, netDba, limitDba, isCompliant, netDbc }) {
  const sceneX = Math.min(68, 36 + (distanceMeters / 600) * 26);

  const labelTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 175;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#09121d";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(0, 0, 512, 175, 24);
    } else {
      ctx.rect(0, 0, 512, 175);
    }
    ctx.fill();
    ctx.strokeStyle = isCompliant ? "#34d399" : "#ef4444";
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 42px sans-serif";
    ctx.fillStyle = isCompliant ? "#34d399" : "#ef4444";
    ctx.fillText(`${netDba.toFixed(1)} dBA`, 256, 56);

    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(
      isCompliant
        ? `COMPLIANT · Night Limit: ${limitDba} dBA`
        : `VIOLATION (+${(netDba - limitDba).toFixed(1)} dB over limit)`,
      256,
      96
    );

    ctx.font = "18px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Low-Freq Hum: ${netDbc ? netDbc.toFixed(1) : (netDba + 14).toFixed(1)} dBC · Distance: ${distanceMeters}m`, 256, 132);

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("NEAREST RESIDENTIAL PROPERTY LINE", 256, 160);

    return new CanvasTexture(canvas);
  }, [netDba, limitDba, isCompliant, distanceMeters, netDbc]);

  useEffect(() => () => labelTexture.dispose(), [labelTexture]);

  return (
    <group position={[sceneX, 0, 0]}>
      {/* Residential House */}
      <group position={[0, 0, -5]}>
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[7.5, 4.4, 8.5]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
        </mesh>
        <mesh position={[0, 5.2, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[5.4, 5.4, 9]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        <mesh position={[-3.78, 2.2, -1.5]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshStandardMaterial color="#fef08a" emissive="#eab308" emissiveIntensity={0.8} side={DoubleSide} />
        </mesh>
      </group>

      {/* Property Line Boundary Fence */}
      <mesh position={[-5.5, 0.7, 0]}>
        <boxGeometry args={[0.1, 1.4, 38]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Decibel Sensor Pole */}
      <group position={[-4.5, 0, 0]}>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 6, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <sphereGeometry args={[0.3, 12, 12]} />
          <meshStandardMaterial
            color={isCompliant ? "#34d399" : "#ef4444"}
            emissive={isCompliant ? "#10b981" : "#dc2626"}
            emissiveIntensity={0.8}
          />
        </mesh>
        <sprite position={[0, 9.2, 0]} scale={[8.8, 2.8, 1]}>
          <spriteMaterial map={labelTexture} depthTest={false} />
        </sprite>
      </group>
    </group>
  );
}

class WebGLBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div
        className="webgl-fallback"
        style={{
          padding: "40px",
          textAlign: "center",
          background: "#0a101d",
          borderRadius: "12px",
          color: "#94a3b8",
          minHeight: "360px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h3 style={{ color: "#38bdf8", marginBottom: "8px" }}>3D Spatial View Fallback</h3>
        <p style={{ maxWidth: "500px", margin: "0 auto 16px auto" }}>
          WebGL rendering is disabled or unsupported in this browser view. All real-time acoustic calculations,
          decibel telemetry, placement options, and the Web Audio Ear Simulator remain fully operational.
        </p>
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
}) {
  // Iron Man Exploded View State (0 = collapsed, 1 = fully exploded)
  const [explodedProgress, setExplodedProgress] = useState(0);
  const [isExplodingAuto, setIsExplodingAuto] = useState(false);

  // Interactive Noise Pointer Coordinates [X, Z]
  const [probePos, setProbePos] = useState([28, 0]);
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);
  const [dragMode, setDragMode] = useState("probe"); // "probe" | "wall" | "trees" | "chillers"

  // Draggable object offsets
  const [wallOffset, setWallOffset] = useState([0, 0]);
  const [treeOffset, setTreeOffset] = useState([0, 0]);
  const [compoundOffset, setCompoundOffset] = useState([0, 0]);

  // Auto-animate Exploded View if active
  useEffect(() => {
    if (!isExplodingAuto) return;
    let direction = 1;
    const interval = setInterval(() => {
      setExplodedProgress((prev) => {
        if (prev >= 1) direction = -1;
        if (prev <= 0) direction = 1;
        const next = prev + direction * 0.05;
        return Math.max(0, Math.min(1, next));
      });
    }, 40);
    return () => clearInterval(interval);
  }, [isExplodingAuto]);

  // Calculate real-time isophone radii for concentric circles
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
      treeBufferDepthMeters: config.treeBufferDepthMeters,
      treeSpeciesId: config.treeSpeciesId,
      treeEnabled: config.treeEnabled,
      chillerOrientationAngle: config.chillerOrientationAngle,
    });
  }, [itPowerKw, site, fanSpeedPercent, config]);

  // Calculate real-time noise at probe position
  const probeTelemetry = useMemo(() => {
    // Chiller origin
    let sourceX = 2 + compoundOffset[0];
    let sourceZ = compoundOffset[1];
    if (config.placement === "rear_shielded") sourceX = -38;
    else if (config.placement === "rooftop") sourceX = -18;

    const dx = probePos[0] - sourceX;
    const dz = probePos[1] - sourceZ;
    const sceneDist = Math.hypot(dx, dz);

    // Map scene units back to real-world meters
    // 30 scene units corresponds approximately to site's default residential distance
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
      treeBufferDepthMeters: config.treeBufferDepthMeters,
      treeSpeciesId: config.treeSpeciesId,
      treeEnabled: config.treeEnabled,
      chillerOrientationAngle: config.chillerOrientationAngle,
      municipalNoiseLimitDba: site.municipalNoiseLimitDba,
    });
  }, [probePos, compoundOffset, config, itPowerKw, site, fanSpeedPercent]);

  // Handle ground clicks or drags to move objects
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

    if (dragMode === "probe") {
      setProbePos([x, z]);
    } else if (dragMode === "wall") {
      setWallOffset([x - 12, z]);
    } else if (dragMode === "trees") {
      setTreeOffset([x - 18, z]);
    } else if (dragMode === "chillers") {
      setCompoundOffset([x - 2, z]);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingProbe(false);
  };

  return (
    <div className="site-canvas-supercontainer" style={{ position: "relative", width: "100%" }}>
      {/* 3D Viewport Controls HUD Overlay (Top-Left) */}
      <div className="canvas-hud-toolbar">
        {/* Stark Exploded View Controls */}
        <div className="hud-pill-group">
          <button
            className={`hud-btn ${explodedProgress > 0 ? "active" : ""}`}
            onClick={() => {
              setIsExplodingAuto(false);
              setExplodedProgress(explodedProgress > 0 ? 0 : 1);
            }}
            title="Toggle Iron Man Exploded Hologram"
          >
            <span className="hud-icon">⚡</span>
            <span>Iron Man Exploded View: {Math.round(explodedProgress * 100)}%</span>
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
            title="Slide to explode/reassemble building and chillers"
          />

          <button
            className={`hud-btn-mini ${isExplodingAuto ? "playing" : ""}`}
            onClick={() => setIsExplodingAuto(!isExplodingAuto)}
            title="Auto-Animate Stark Disassembly"
          >
            {isExplodingAuto ? "⏹ Pause" : "▶ Animate"}
          </button>
        </div>

        {/* Drag & Drop Mode Palette */}
        <div className="hud-pill-group">
          <span className="hud-label">3D DRAG & DROP:</span>
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
            🌲 Tree Buffer
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
              title="Reset layout to site defaults"
            >
              ↺ Reset Layout
            </button>
          )}
        </div>
      </div>

      {/* Real-time Interactive Probe Telemetry HUD Overlay (Top-Right) */}
      <div className="canvas-probe-hud">
        <div className="probe-hud-header">
          <span className="probe-dot"></span>
          <strong>INTERACTIVE NOISE PROBE</strong>
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
            <span>Distance: <strong>{probeTelemetry.distanceMeters}m</strong> from plant</span>
            <span>Limit: <strong>{site.municipalNoiseLimitDba} dBA</strong> ({probeTelemetry.marginDb >= 0 ? `-${probeTelemetry.marginDb.toFixed(1)} dB margin` : `+${Math.abs(probeTelemetry.marginDb).toFixed(1)} dB OVER`})</span>
            <span className="probe-sensation">{probeTelemetry.sensation}</span>
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div
        className="site-canvas-container"
        style={{
          width: "100%",
          height: "620px",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1px solid #1e2d42",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
        }}
      >
        <WebGLBoundary>
          <Canvas camera={{ position: [28, 38, 54], fov: 45 }} dpr={[1, 1.5]}>
            <color attach="background" args={["#080e18"]} />
            <ambientLight intensity={1.6} />
            <directionalLight position={[25, 45, 30]} intensity={2.4} castShadow />

            <Ground
              terrainType={site.terrainType}
              onGroundClick={handleGroundClick}
              onGroundPointerDown={handlePointerDown}
              onGroundPointerMove={handlePointerMove}
              onGroundPointerUp={handlePointerUp}
            />

            <TerrainBackdrop terrainType={site.terrainType} />

            <DataCenterBuilding explodedProgress={explodedProgress} />

            <ChillerYard
              placement={config.placement}
              running={running}
              fanSpeedPercent={fanSpeedPercent}
              orientationAngle={config.chillerOrientationAngle}
              explodedProgress={explodedProgress}
              compoundOffset={compoundOffset}
            />

            <AcousticBarrierWall
              enabled={config.wallEnabled}
              heightMeters={config.wallHeightMeters}
              materialId={config.wallMaterial}
              placement={config.placement}
              wallOffset={wallOffset}
              isDraggable={dragMode === "wall"}
            />

            <VegetationBufferZone
              enabled={config.treeEnabled}
              depthMeters={config.treeBufferDepthMeters}
              treeSpeciesId={config.treeSpeciesId}
              treeOffset={treeOffset}
            />

            {/* Concentric Noise Circles with dBA labels based on distance */}
            <ConcentricNoiseCircles
              isophoneRadii={isophoneRadii}
              chillerPlacement={config.placement}
              originPos={[2 + compoundOffset[0], 0, compoundOffset[1]]}
            />

            {/* Interactive Sound Pointer Tool */}
            <InteractiveNoiseProbe
              probePos={probePos}
              probeTelemetry={probeTelemetry}
              isDraggingProbe={isDraggingProbe}
              onPointerDown={handlePointerDown}
            />

            <ResidentialReceptor
              distanceMeters={site.defaultDistanceToHomesMeters}
              netDba={acousticResults.netReceivedLp}
              limitDba={site.municipalNoiseLimitDba}
              isCompliant={acousticResults.isCompliant}
              netDbc={acousticResults.netReceivedLpC}
            />

            <SiteCameraControls isDragging={isDraggingProbe} />
          </Canvas>
        </WebGLBoundary>
      </div>

      {/* Concentric Circle Legend Bar Below Canvas */}
      <div className="concentric-legend-strip">
        <span className="legend-title">CONCENTRIC NOISE CIRCLES:</span>
        <div className="legend-badges">
          <span className="legend-badge red">🔴 75+ dBA (Machinery Roar)</span>
          <span className="legend-badge orange">🟠 65 dBA (Industrial Zone)</span>
          <span className="legend-badge amber">🟡 55 dBA (Commercial Border)</span>
          <span className="legend-badge green">🟢 45 dBA ({site.municipalNoiseLimitDba} dBA Legal Night Limit)</span>
          <span className="legend-badge cyan">🔵 40 dBA (Quiet Sleep Sanctuary)</span>
        </div>
      </div>
    </div>
  );
}
