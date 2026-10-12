import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
const colors = ['#45d6b0', '#75a8ff', '#c2a2ff'];
export default function TemperatureChart({ history }) {
  return <section className="panel chart-panel"><div className="section-heading"><div><span className="eyebrow">LIVE TELEMETRY</span><h2>Temperature over time</h2></div><span className="muted">Solid: physical · Dashed: twin</span></div>
    <div className="chart" role="img" aria-label="Live temperature graph showing physical and twin temperatures for all three servers">
      <ResponsiveContainer width="100%" height="100%"><LineChart data={history} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke="#273347" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="time" stroke="#91a0b8" tickFormatter={value => `${value}s`} minTickGap={40}/><YAxis stroke="#91a0b8" domain={[20, 'auto']} tickFormatter={value => `${value}°`}/><Tooltip contentStyle={{ background: '#152133', border: '1px solid #34465f', borderRadius: 10 }} formatter={(value, name) => [`${Number(value).toFixed(1)} °C`, name]} labelFormatter={time => `${time}s simulation time`}/><ReferenceLine y={75} stroke="#f8717166" strokeDasharray="5 5"/>
        {[1, 2, 3].flatMap((id, index) => [<Line key={`p${id}`} name={`Server ${id} physical`} dataKey={`physical${id}`} stroke={colors[index]} dot={false} strokeWidth={2} isAnimationActive={false}/>, <Line key={`t${id}`} name={`Server ${id} twin`} dataKey={`twin${id}`} stroke={colors[index]} dot={false} strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false}/>])}
      </LineChart></ResponsiveContainer>
    </div><div className="legend">{colors.map((color, index) => <span key={color}><i style={{ background: color }}/>Server {index + 1}</span>)}</div>
  </section>;
}
