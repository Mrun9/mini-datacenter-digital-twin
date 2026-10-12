import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Simulation } from './simulation/Simulation.js';
import { powerWatts, totalNoiseDba } from './simulation/physics.js';
import ServerControls from './components/ServerControls.jsx';
import TemperatureChart from './components/TemperatureChart.jsx';
const ServerRoom = lazy(() => import('./components/ServerRoom.jsx'));
import './styles.css';
export default function App() {
  const simulation = useRef(new Simulation());
  const [selected, setSelected] = useState(1);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState('dashboard');
  const [, refresh] = useState(0);
  const redraw = () => refresh(value => value + 1);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => { simulation.current.tick(); redraw(); }, 250);
    return () => clearInterval(timer);
  }, [running]);
  const model = simulation.current;
  const physical = model.physical.servers;
  const command = (id, patch) => { model.physical.command(id, patch); redraw(); };
  const age = model.timeSeconds - model.twin.lastMeasurementSeconds;
  const maxGap = Math.max(...physical.map((server, index) => Math.abs(server.temperatureC - model.twin.servers[index].temperatureC)));
  const controls = (id) => <ServerControls key={id} server={physical[id - 1]} twin={model.twin.servers[id - 1]} measurement={model.twin.measurements[id - 1]} command={command}/>;
  return <main className="app-shell">
    <header><div className="brand-icon">▥</div><div><div className="eyebrow">DIGITAL TWIN LAB / 001</div><h1>Mini Data Center <span>Digital Twin</span></h1></div><div className="local-badge"><i/>Browser simulation</div></header>
    <div className="intro"><p>A small system. A living model.<br/><span>Explore how heat, cooling, and sensor data connect a physical system to its twin.</span></p><div className="clock"><span>SIMULATION TIME</span><b>{model.timeSeconds.toFixed(1)}<small> sec</small></b></div></div>
    <nav aria-label="Views"><button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>01 <span>Digital Twin Dashboard</span></button><button className={tab === 'room' ? 'active' : ''} onClick={() => setTab('room')}>02 <span>Interactive 3D Data Center</span></button></nav>
    <div className="toolbar"><div className="playback"><button className="primary" disabled={running} onClick={() => setRunning(true)}>▶ Start</button><button disabled={!running} onClick={() => setRunning(false)}>Ⅱ Pause</button><button onClick={() => { setRunning(false); simulation.current = new Simulation(); redraw(); }}>↺ Reset</button><span className="muted">{running ? 'Running' : 'Paused'}</span></div><label className="sensor-toggle"><input type="checkbox" checked={model.sensor.connected} onChange={e => { model.sensor.connected = e.target.checked; redraw(); }}/>Sensors connected <span className={model.sensor.connected ? 'connected' : 'disconnected'}>{model.sensor.connected ? '2s sampling' : 'Disconnected'}</span></label></div>
    <section className="metrics"><div><span>Total power</span><strong>{physical.reduce((sum, s) => sum + powerWatts(s), 0).toFixed(0)}<small> W</small></strong><p>Physical power model</p></div><div><span>Cooling noise</span><strong>{totalNoiseDba(physical).toFixed(1)}<small> dBA</small></strong><p>Approximate combined level</p></div><div><span>Largest twin deviation</span><strong>{maxGap.toFixed(1)}<small> °C</small></strong><p>Physical vs estimated</p></div><div><span>Last sensor update</span><strong>{age.toFixed(1)}<small> sec ago</small></strong><p>{model.twin.lastMeasurementSeconds === 0 ? 'Initialized at t = 0' : `Sampled at t = ${model.twin.lastMeasurementSeconds.toFixed(1)}s`}</p></div></section>
    {!model.sensor.connected && <div className="notice">Sensors disconnected. The twin keeps estimating from its last reading. Change CPU load or disable a fan to observe divergence.</div>}
    {tab === 'dashboard' ? <><div className="section-heading"><div><span className="eyebrow">PHYSICAL SYSTEM → SENSOR → DIGITAL TWIN</span><h2>Three servers. One experiment.</h2></div><span className="muted">Controls act on the physical system</span></div><section className="server-grid">{physical.map(s => controls(s.id))}</section><TemperatureChart history={model.history}/></> : <><div className="section-heading"><div><span className="eyebrow">PHYSICAL WORLD / 3D VIEW</span><h2>Inside the server room</h2></div><span className="muted">One shared cooling fan per rack</span></div><section className="room-layout"><Suspense fallback={<p>Loading the 3D room…</p>}><ServerRoom servers={physical} selected={selected} onSelect={setSelected} running={running}/></Suspense>{controls(selected)}</section></>}
    <footer><span>EDUCATIONAL MODEL</span><p>Illustrative temperatures and noise, not validated measurements. Forecasts assume the twin’s last observed controls remain constant. Simulation time slows in background tabs.</p></footer>
  </main>;
}
