import { Component, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { colorOf } from "../simulation/physics.js";

function CameraControls() {
  const { camera, gl } = useThree();
  const orbit = useRef();
  useEffect(() => {
    orbit.current = new OrbitControls(camera, gl.domElement);
    orbit.current.target.set(0, 1.5, 0);
    orbit.current.minDistance = 4;
    orbit.current.maxDistance = 16;
    orbit.current.maxPolarAngle = Math.PI / 2 - 0.05;
    orbit.current.enablePan = false;
    orbit.current.update();
    return () => orbit.current.dispose();
  }, [camera, gl]);
  return null;
}
function Box({ position, size, color, ...props }) {
  return (
    <mesh position={position} {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.65} />
    </mesh>
  );
}
function Fan({ server, running }) {
  const blades = useRef();
  useFrame((_, delta) => {
    if (running && server.fanEnabled)
      blades.current.rotation.z -= (delta * server.fanPercent) / 5;
  });
  return (
    <group position={[0, 2.7, 0.72]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.06, 24]} />
        <meshStandardMaterial color="#07111b" />
      </mesh>
      <group ref={blades}>
        {[0, Math.PI / 2].map((angle) => (
          <Box
            key={angle}
            position={[0, 0, 0.04]}
            rotation={[0, 0, angle]}
            size={[0.36, 0.075, 0.03]}
            color={server.fanEnabled ? "#b8ccd9" : "#f87171"}
          />
        ))}
      </group>
    </group>
  );
}
function TemperatureLabel({ server }) {
  // A small local canvas texture avoids font downloads or another 3D library.
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "#101c2d";
    context.fillRect(0, 0, 512, 128);
    context.textAlign = "center";
    context.font = "bold 38px sans-serif";
    context.fillStyle = colorOf(server.temperatureC);
    context.fillText(
      `${server.name}  ·  ${server.temperatureC.toFixed(1)} °C`,
      256,
      56,
    );
    context.font = "24px sans-serif";
    context.fillStyle = "#9baec7";
    context.fillText("PHYSICAL SYSTEM", 256, 99);
    return new CanvasTexture(canvas);
  }, [server.name, server.temperatureC]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, 3.75, 0]} scale={[2.25, 0.56, 1]}>
      <spriteMaterial map={texture} depthTest={false} />
    </sprite>
  );
}
function Rack({ server, index, selected, onSelect, running }) {
  const temperatureColor = colorOf(server.temperatureC);
  return (
    <group
      position={[(index - 1) * 2.6, 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(server.id);
      }}
    >
      <Box position={[0, 1.6, 0]} size={[1.6, 3.2, 1.4]} color="#1e2d40" />
      <Box
        position={[0, 1.6, 0.715]}
        size={[1.38, 2.98, 0.04]}
        color="#080f19"
      />
      {[-0.73, 0.73].map((x) => (
        <Box
          key={x}
          position={[x, 1.6, 0.76]}
          size={[0.045, 3.05, 0.035]}
          color={selected ? "#75a8ff" : temperatureColor}
        />
      ))}
      {Array.from({ length: server.units }, (_, unit) => (
        <group key={unit} position={[0, 0.35 + unit * 0.36, 0.76]}>
          <Box size={[1.2, 0.28, 0.08]} color={temperatureColor} />
          {[-0.4, -0.2, 0, 0.2].map((x) => (
            <Box
              key={x}
              position={[x, 0, 0.05]}
              size={[0.1, 0.1, 0.015]}
              color="#1c3040"
            />
          ))}
          <Box
            position={[0.48, 0, 0.05]}
            size={[0.045, 0.08, 0.02]}
            color="#ecfff9"
          />
        </group>
      ))}
      <Fan server={server} running={running} />
      <TemperatureLabel server={server} />
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
      <p className="webgl-fallback">
        3D rendering is unavailable in this browser. Use the server selection
        buttons and controls below, or open this Site in a WebGL-enabled
        browser.
      </p>
    ) : (
      this.props.children
    );
  }
}
export default function ServerRoom({ servers, selected, onSelect, running }) {
  return (
    <div>
      <div className="room-canvas">
        <WebGLBoundary>
          <Canvas
            camera={{ position: [7.5, 6, 10], fov: 43 }}
            dpr={[1, 1.5]}
            fallback={
              <p className="webgl-fallback">
                WebGL unavailable. Server controls remain available below.
              </p>
            }
          >
            <color attach="background" args={["#0d1726"]} />
            <ambientLight intensity={1.8} />
            <directionalLight position={[3, 8, 5]} intensity={2.5} />
            <Box position={[0, -0.13, 0]} size={[11, 0.2, 7]} color="#233248" />
            <gridHelper
              args={[11, 22, "#3b5672", "#2d425c"]}
              position={[0, -0.02, 0]}
            />
            <Box position={[0, 2, -2.4]} size={[11, 4, 0.12]} color="#18263a" />
            <Box
              position={[-5.4, 2, 0]}
              size={[0.12, 4, 4.8]}
              color="#1a2b3d"
            />
            {servers.map((server, index) => (
              <Rack
                key={server.id}
                server={server}
                index={index}
                selected={selected === server.id}
                onSelect={onSelect}
                running={running}
              />
            ))}
            <CameraControls />
          </Canvas>
        </WebGLBoundary>
      </div>
      <p className="room-caption">
        Drag to orbit · Scroll or pinch to zoom · Click a rack to select
        <br />
        Room colors and labels show the physical system. Blue rails mark the
        selected rack.
      </p>
      <div className="room-select" aria-label="Select a server">
        {servers.map((server) => (
          <button
            key={server.id}
            aria-pressed={selected === server.id}
            onClick={() => onSelect(server.id)}
          >
            {server.name}
          </button>
        ))}
      </div>
    </div>
  );
}
