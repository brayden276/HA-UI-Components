export function createHassFixture({ states = {}, registries = {}, services = [] } = {}) {
  const calls = services;
  return {
    states,
    registries,
    services: calls,
    callService(domain, service, data = {}, target) {
      calls.push({ domain, service, data, target });
      return Promise.resolve();
    },
    connection: {
      async sendMessage(message) {
        const response = registries[message?.type];
        if (response === undefined) throw new Error(`No registry fixture for ${message?.type}`);
        return response;
      },
      subscribeEvents() { throw new Error("subscribeEvents requires an explicit fixture override"); },
    },
  };
}
