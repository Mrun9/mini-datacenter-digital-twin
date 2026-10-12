import { powerWatts, statusOf, colorOf } from '../simulation/physics.js';
import { forecastTemperature } from '../simulation/Predictor.js';
export default function ServerControls({ server, twin, measurement, command }) {
  const change = (patch) => command(server.id, patch);
  return <article className="server-card">
    <div className="card-heading"><span className="eyebrow">RACK 0{server.id}</span><span className="status" style={{ color: colorOf(server.temperatureC) }}>{statusOf(server.temperatureC)}</span></div>
    <h3>{server.name}<span className="unit-count">{server.units} / 6 units</span></h3>
    <div className="temperature">{server.temperatureC.toFixed(1)}<span>°C</span><small>Physical system</small></div>
    <div className="readings"><div><span>Twin estimate</span><strong>{twin.temperatureC.toFixed(1)} °C</strong></div><div><span>Last sensor</span><strong>{measurement.temperatureC.toFixed(1)} °C</strong></div><div><span>Power model</span><strong>{powerWatts(server).toFixed(0)} W</strong></div><div><span>Twin +30 sec</span><strong>{forecastTemperature(twin).toFixed(1)} °C</strong></div></div>
    <label className="slider-label">CPU utilization <b>{server.cpuPercent}%</b><input aria-label={`${server.name} CPU utilization`} type="range" min="0" max="100" value={server.cpuPercent} onChange={e => change({ cpuPercent: Number(e.target.value) })}/></label>
    <label className="slider-label">Cooling fan speed <b>{server.fanPercent}%</b><input aria-label={`${server.name} cooling fan speed`} type="range" min="0" max="100" value={server.fanPercent} onChange={e => change({ fanPercent: Number(e.target.value) })}/></label>
    <div className="card-bottom"><label><input type="checkbox" checked={server.fanEnabled} onChange={e => change({ fanEnabled: e.target.checked })}/> Fan enabled</label><div className="unit-buttons"><button aria-label={`Remove unit from ${server.name}`} disabled={server.units === 1} onClick={() => change({ units: server.units - 1 })}>−</button><span>Units</span><button aria-label={`Add unit to ${server.name}`} disabled={server.units === 6} onClick={() => change({ units: server.units + 1 })}>+</button></div></div>
  </article>;
}
