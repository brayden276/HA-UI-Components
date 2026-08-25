export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

export async function flushMicrotasks(turns = 2) {
  for (let index = 0; index < turns; index += 1) await Promise.resolve();
}

export function createDeterministicTimers() {
  let nextId = 1;
  const timers = new Map();
  const schedule = (callback, delay = 0, repeat = false) => {
    if (typeof callback !== "function") throw new TypeError("Timer callback must be a function");
    const id = nextId++;
    timers.set(id, { callback, delay: Number(delay), repeat });
    return id;
  };
  const clear = (id) => timers.delete(id);
  return {
    setTimeout: (callback, delay) => schedule(callback, delay),
    setInterval: (callback, delay) => schedule(callback, delay, true),
    clearTimeout: clear,
    clearInterval: clear,
    run(id) {
      const timer = timers.get(id);
      if (!timer) throw new Error(`Unknown or cleared timer: ${id}`);
      if (!timer.repeat) timers.delete(id);
      return timer.callback();
    },
    runAll() { for (const id of [...timers.keys()]) this.run(id); },
    pending() { return timers.size; },
  };
}
