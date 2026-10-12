import { nextTemperature } from './physics.js';
export const createServers = () => [1, 2, 3].map((id) => ({
  id, name: `Server ${id}`, cpuPercent: 25 + id * 10, fanPercent: 60,
  fanEnabled: true, units: 1, temperatureC: 35,
}));

export class PhysicalSimulator {
  constructor() { this.servers = createServers(); }
  step(seconds) {
    this.servers = this.servers.map(server => ({ ...server, temperatureC: nextTemperature(server, seconds) }));
  }
  command(id, changes) {
    // UI limits are repeated here so the model remains safe to use independently.
    this.servers = this.servers.map(server => server.id !== id ? server : {
      ...server,
      cpuPercent: Math.max(0, Math.min(100, changes.cpuPercent ?? server.cpuPercent)),
      fanPercent: Math.max(0, Math.min(100, changes.fanPercent ?? server.fanPercent)),
      fanEnabled: changes.fanEnabled ?? server.fanEnabled,
      units: Math.max(1, Math.min(6, changes.units ?? server.units)),
    });
  }
  snapshot() { return this.servers.map(server => ({ ...server })); }
}
