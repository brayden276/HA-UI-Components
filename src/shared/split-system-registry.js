/**
 * Compatibility surface for older composition code.
 *
 * Split System state now comes directly from climate/select/timer entities. This
 * object intentionally discovers, stores and models nothing and can be removed
 * once older composition callers stop probing for the former registry API.
 */
const splitRegistryCompatibility = Object.freeze({
  result: null,
  async load() {
    return null;
  },
  async refresh() {
    return null;
  },
  subscribe() {
    return () => {};
  },
});

globalThis.__componentSplitRegistryV4 = splitRegistryCompatibility;
