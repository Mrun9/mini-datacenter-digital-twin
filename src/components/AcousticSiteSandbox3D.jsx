import { Component, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, DoubleSide } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../simulation/datacenterSites.js";

function SiteCameraControls() {
  const { camera, gl } = useThree();
  const orbit = useRef();
  useEffect(() => {
    orbit.current = new OrbitControls(camera, gl.domElement);
    orbit.current.target.set(0, 2, 0);
    orbit.current.minDistance = 12;
    orbit.current.maxDistance = 140;
    orbit.current.maxPolarAngle = Math.PI / 2 - 0.04;
    orbit.current.enablePan = true;
    orbit.current.update();
    return () => orbit.current.dispose();
  }, [camera, gl]);
  return null;
}

function Ground({ terrainType }) {
  let groundColor = "#1a2c20"; // Temperate grass
  let gridColor = "#2d4a35";
  if (terrainType === "desert_plain") {
    groundColor = "#3d2f1f"; // Arid desert sand
    gridColor = "#57432c";
  } else if (terrainType === "mountain_canyon") {
    groundColor = "#232b2b"; // Basalt rock
    gridColor = "#3d4849";
  } else if (terrainType === "coastal_rolling") {
    groundColor = "#152e25"; // Irish lush peat
    gridColor = "#25483b";
  }

  return (
    <group position={[0, -0.05, 0]}>
      {/* Main Ground Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[180, 130]} />
        <meshStandardMaterial color={groundColor} roughness={0.9} />
      </mesh>
      <gridHelper args={[180, 36, gridColor, gridColor]} position={[0, 0.01, 0]} />

      {/* Concrete Apron / Roadway around Data Center Facility */}
      <mesh position={[-18, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[44, 46]} />
        <meshStandardMaterial color="#222b38" roughness={0.7} />
      </mesh>
    </group>
  );
}

function TerrainBackdrop({ terrainType }) {
  if (terrainType !== "mountain_canyon") return null;
  return (
    <group position={[0, 0, -50]}>
      {[-45, -20, 10, 40].map((x, i) => (
        <mesh key={i} position={[x, 12 + (i % 2) * 5, 0]}>
          <coneGeometry args={[20, 26 + (i % 3) * 6, 5]} />
          <meshStandardMaterial color="#222b30" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function DataCenterBuilding() {
  return (
    <group position={[-18, 0, 0]}>
      {/* Main 2-Story Hyperscale Data Hall (Precast Tilt-Up Concrete) */}
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[28, 11, 36]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Roof Parapet Trim & Ballast */}
      <mesh position={[0, 11.2, 0]}>
        <boxGeometry args={[28.5, 0.5, 36.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Architectural Reveal Wall Grooves (tilt-up panel joints) */}
      {[-12, -6, 0, 6, 12].map((z) => (
        <mesh key={z} position={[14.05, 5.5, z]}>
          <boxGeometry args={[0.08, 10.8, 0.2]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
      ))}

      {/* Datacenter Air Intake Louvers (Low-Velocity Filter Wall) */}
      {[-10, -5, 0, 5, 10].map((z) => (
        <mesh key={z} position={[14.08, 3.2, z]}>
          <boxGeometry args={[0.08, 3.5, 3.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
      ))}

      {/* High-Voltage Substation Yard & Transformers on the rear corner */}
      <group position={[-18, 0, 14]}>
        {/* Security Fence Enclosure */}
        <mesh position={[0, 1.4, 0]}>
          <boxGeometry args={[6.5, 2.8, 6.5]} />
          <meshStandardMaterial color="#475569" wireframe={true} />
        </mesh>
        {/* Step-down Transformers */}
        <mesh position={[-1.4, 1.5, 0]}>
          <boxGeometry args={[2.2, 3, 2.6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[1.4, 1.5, 0]}>
          <boxGeometry args={[2.2, 3, 2.6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        {/* Transformer Ceramic Bushings */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 3.4, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1, 8]} />
            <meshStandardMaterial color="#94a3b8" />
          </mesh>
        ))}
      </group>

      {/* Chilled Water Header Piping Loop (Supply: Blue, Return: Orange) */}
      <group position={[14.2, 1.8, 0]}>
        {/* Chilled Water Supply Line (Blue) */}
        <mesh position={[0.2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.2, 12]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} />
        </mesh>
        {/* Warm Condenser Return Line (Orange) */}
        <mesh position={[0.2, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 1.2, 12]} />
          <meshStandardMaterial color="#ea580c" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Realistic Industrial V-Bank Air-Cooled Chiller Unit
 * Remodeled after actual 400-ton chillers (Trane Stealth / Carrier AquaForce / Vertiv Liebert)
 * Features dual V-shaped microchannel condenser coils and 4 upward-blowing axial fans.
 */
function VBankChillerUnit({ position, running, fanSpeedPercent }) {
  const fans = [useRef(), useRef(), useRef(), useRef()];

  useFrame((_, delta) => {
    if (running) {
      const rot = delta * (fanSpeedPercent / 100) * 18;
      fans.forEach((ref) => {
        if (ref.current) ref.current.rotation.y += rot;
      });
    }
  });

  return (
    <group position={position}>
      {/* Lower Skid & Compressor Housing (Hermetic Twin-Screw Compressors) */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[6.2, 1.2, 2.8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Shell-and-Tube Evaporator Barrel underneath */}
      <mesh position={[0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.45, 0.45, 5.8, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>

      {/* V-Shaped Condenser Coil Banks (Left & Right Slanted Coil Walls) */}
      {/* Left Coil (Slanted inward) */}
      <mesh position={[-0.7, 2.2, 0]} rotation={[0, 0, Math.PI / 12]}>
        <boxGeometry args={[0.2, 2.2, 5.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Right Coil (Slanted inward) */}
      <mesh position={[0.7, 2.2, 0]} rotation={[0, 0, -Math.PI / 12]}>
        <boxGeometry args={[0.2, 2.2, 5.6]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Upper Fan Deck Plenum */}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[2.0, 0.2, 5.8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* 4 Upward-Blowing Axial Condenser Fans with Venturi Cowlings */}
      {[-1.8, -0.6, 0.6, 1.8].map((z, idx) => (
        <group key={z} position={[0, 3.35, z]}>
          {/* Fan Cowling Cylinder */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.55, 0.55, 0.35, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
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

      {/* Insulated Chilled Water Flanged Connection Ports */}
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

function ChillerYard({ placement, running, fanSpeedPercent, orientationAngle }) {
  // Determine placement coordinates based on actual architectural configurations
  let yardPos = [2, 0, 0]; // Default: Side Ground Compound (Exposed)
  let isUnderground = placement === "underground";
  let isSemiBerm = placement === "semi_berm";
  let isRooftop = placement === "rooftop";
  let isRearShielded = placement === "rear_shielded";

  if (isRearShielded) {
    // Placed BEHIND the data center core (Building-Shielded acoustic shadow)
    yardPos = [-38, 0, 0];
  } else if (isRooftop) {
    // Placed on top of the 11m building roof deck
    yardPos = [-18, 11.2, 0];
  } else if (isUnderground) {
    yardPos = [2, -4.5, 0];
  } else if (isSemiBerm) {
    yardPos = [2, -1.8, 0];
  }

  const radAngle = (orientationAngle * Math.PI) / 180;

  return (
    <group position={yardPos}>
      {/* 1. Subterranean Excavation Pit & Retaining Walls */}
      {(isUnderground || isSemiBerm) && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[18, 24]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          {/* Concrete Retaining Perimeter */}
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

      {/* 2. Earth Berm for Semi-Bermed Basin */}
      {isSemiBerm && (
        <group position={[10, 1.8, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[3.2, 3.2, 26]} />
            <meshStandardMaterial color="#2d4a35" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* 3. Surface Acoustic Silencer Stacks for Underground Vault */}
      {isUnderground && (
        <group position={[0, 4.8, 0]}>
          {[-7, 7].map((z) => (
            <group key={z} position={[0, 0, z]}>
              <mesh position={[0, 0.6, 0]}>
                <boxGeometry args={[5.5, 1.2, 4.2]} />
                <meshStandardMaterial color="#334155" metalness={0.8} />
              </mesh>
              {/* Acoustic Louvers on Stack Face */}
              {[-0.3, 0, 0.3].map((y) => (
                <mesh key={y} position={[2.8, 0.6 + y, 0]}>
                  <boxGeometry args={[0.1, 0.15, 3.8]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 4. Rooftop Visual & Acoustic Parapet Louver Screen */}
      {isRooftop && (
        <group position={[0, 1.5, 0]}>
          {/* Rooftop screen surrounding the chiller penthouse */}
          <mesh position={[0, 0, 14]}>
            <boxGeometry args={[16, 3, 0.2]} />
            <meshStandardMaterial color="#475569" wireframe={true} />
          </mesh>
          <mesh position={[0, 0, -14]}>
            <boxGeometry args={[16, 3, 0.2]} />
            <meshStandardMaterial color="#475569" wireframe={true} />
          </mesh>
          <mesh position={[8, 0, 0]}>
            <boxGeometry args={[0.2, 3, 28]} />
            <meshStandardMaterial color="#475569" wireframe={true} />
          </mesh>
        </group>
      )}

      {/* 5. Bank of 3 Hyperscale V-Bank Air-Cooled Chillers */}
      <group rotation={[0, radAngle, 0]}>
        <VBankChillerUnit position={[0, 0, -7.5]} running={running} fanSpeedPercent={fanSpeedPercent} />
        <VBankChillerUnit position={[0, 0, 0]} running={running} fanSpeedPercent={fanSpeedPercent} />
        <VBankChillerUnit position={[0, 0, 7.5]} running={running} fanSpeedPercent={fanSpeedPercent} />
      </group>
    </group>
  );
}

function AcousticBarrierWall({ enabled, heightMeters, materialId, placement }) {
  if (!enabled || heightMeters <= 0) return null;

  const materialConfig = WALL_MATERIALS[materialId] || WALL_MATERIALS.absorptive_metal;
  const isTransparent = materialId === "transparent_acrylic";

  // Position wall according to chiller placement
  let wallX = 12; // In front of side yard
  let wallY = 0;
  let wallZ = 0;

  if (placement === "rear_shielded") {
    wallX = -46; // Behind rear chillers
  } else if (placement === "rooftop") {
    wallX = -9; // Edge of rooftop
    wallY = 11.2;
  }

  return (
    <group position={[wallX, wallY, wallZ]}>
      {/* Main Sound Wall Center Screen */}
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
      {/* Return Diffraction Wings */}
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
      {/* Structural Steel Columns */}
      {[-14, -10, -6, -2, 2, 6, 10, 14].map((z) => (
        <mesh key={z} position={[0.25, heightMeters / 2, z]}>
          <boxGeometry args={[0.3, heightMeters + 0.4, 0.25]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

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

function VegetationBufferZone({ enabled, depthMeters, treeSpeciesId }) {
  if (!enabled || depthMeters <= 0) return null;

  const species = REGIONAL_TREE_SPECIES[treeSpeciesId] || REGIONAL_TREE_SPECIES.virginia_pine;

  const rows = Math.max(1, Math.min(8, Math.round(depthMeters / 6)));
  const trees = useMemo(() => {
    const list = [];
    const startX = 18;
    const spacingX = Math.min(5, depthMeters / rows);
    for (let r = 0; r < rows; r++) {
      const x = startX + r * spacingX;
      for (let z = -20; z <= 20; z += 4.5) {
        const jitterZ = ((r % 2) - 0.5) * 1.8;
        list.push([x, 0, z + jitterZ]);
      }
    }
    return list;
  }, [rows, depthMeters]);

  return (
    <group>
      {trees.map((pos, idx) => (
        <ProceduralTree key={idx} position={pos} species={species} />
      ))}
    </group>
  );
}

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

      {/* Acoustic Telemetry Decibel Sensor Pole */}
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

function AcousticWaveRings({ netDba, placement }) {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.4;
    }
  });

  // Calculate origin of sound based on placement
  let originX = 2;
  if (placement === "rear_shielded") originX = -38;
  else if (placement === "rooftop") originX = -18;

  const unmitigatedRadius = Math.max(14, Math.min(52, 16 + (netDba - 35) * 0.9));
  const isMuffled = placement === "underground" || placement === "rear_shielded";

  return (
    <group position={[originX, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* 65 dBA Severe Impact Ring (Red) */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[unmitigatedRadius * 0.48, unmitigatedRadius * 0.52, 48]} />
        <meshBasicMaterial
          color={isMuffled ? "#10b981" : "#ef4444"}
          transparent
          opacity={isMuffled ? 0.15 : 0.6}
          side={DoubleSide}
        />
      </mesh>
      {/* 50 dBA Community Nuisance Ring (Yellow) */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[unmitigatedRadius * 0.82, unmitigatedRadius * 0.86, 48]} />
        <meshBasicMaterial
          color="#eab308"
          transparent
          opacity={isMuffled ? 0.2 : 0.5}
          side={DoubleSide}
        />
      </mesh>
      {/* 45 dBA Compliance Threshold Ring (Cyan/Green) */}
      <mesh ref={ringRef} position={[0, 0, 0.02]}>
        <ringGeometry args={[unmitigatedRadius * 1.15, unmitigatedRadius * 1.19, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.4} side={DoubleSide} />
      </mesh>
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
          decibel telemetry, placement options, and the Web Audio Ear Simulator remain fully operational below.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}

export default function AcousticSiteSandbox3D({
  site,
  config,
  acousticResults,
  running,
  itPowerKw,
  fanSpeedPercent,
}) {
  return (
    <div className="site-canvas-container" style={{ width: "100%", height: "540px", borderRadius: "12px", overflow: "hidden" }}>
      <WebGLBoundary>
        <Canvas camera={{ position: [28, 36, 50], fov: 45 }} dpr={[1, 1.5]}>
          <color attach="background" args={["#0a101d"]} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[20, 40, 25]} intensity={2.2} castShadow />

          <Ground terrainType={site.terrainType} />
          <TerrainBackdrop terrainType={site.terrainType} />

          <DataCenterBuilding />

          <ChillerYard
            placement={config.placement}
            running={running}
            fanSpeedPercent={fanSpeedPercent}
            orientationAngle={config.chillerOrientationAngle}
          />

          <AcousticBarrierWall
            enabled={config.wallEnabled}
            heightMeters={config.wallHeightMeters}
            materialId={config.wallMaterial}
            placement={config.placement}
          />

          <VegetationBufferZone
            enabled={config.treeEnabled}
            depthMeters={config.treeBufferDepthMeters}
            treeSpeciesId={config.treeSpeciesId}
          />

          <AcousticWaveRings
            netDba={acousticResults.netReceivedLp}
            placement={config.placement}
          />

          <ResidentialReceptor
            distanceMeters={site.defaultDistanceToHomesMeters}
            netDba={acousticResults.netReceivedLp}
            limitDba={site.municipalNoiseLimitDba}
            isCompliant={acousticResults.isCompliant}
            netDbc={acousticResults.netReceivedLpC}
          />

          <SiteCameraControls />
        </Canvas>
      </WebGLBoundary>
    </div>
  );
}
