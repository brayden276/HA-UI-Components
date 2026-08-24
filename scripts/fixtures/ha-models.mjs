export const entityState = (entityId, state, attributes = {}) => Object.freeze({
  entity_id: entityId,
  state,
  attributes: Object.freeze({ ...attributes }),
});

export const registryFixture = ({ areas = [], devices = [], entities = [] } = {}) => {
  const byDevice = new Map();
  for (const entity of entities) {
    if (!entity.device_id) continue;
    byDevice.set(entity.device_id, [...(byDevice.get(entity.device_id) || []), entity]);
  }
  return Object.freeze({
    areas,
    areaMap: new Map(areas.map((area) => [area.id, area])),
    devices,
    entities,
    byDevice,
  });
};

export const hassFixture = (states = {}, overrides = {}) => Object.freeze({
  config: { time_zone: "Australia/Sydney", ...(overrides.config || {}) },
  locale: { language: "en-AU", time_format: "language", ...(overrides.locale || {}) },
  states: Object.freeze({ ...states }),
  ...overrides,
});
