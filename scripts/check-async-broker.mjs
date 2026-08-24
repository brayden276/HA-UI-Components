import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "src/shared/async-broker.js"), "utf8");
const context = { clearTimeout, console, Date, Error, Map, Object, Promise, Set, setTimeout };
context.globalThis = context;
vm.runInContext(source, vm.createContext(context), { filename: "src/shared/async-broker.js" });
const { createAsyncBroker } = context.__HA_COMPONENT_LIBRARY_SHARED__;
const sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds));

{
  let calls = 0, release;
  const gate = new Promise((resolveGate) => { release = resolveGate; });
  const broker = createAsyncBroker(async () => { calls += 1; await gate; return { revision: calls }; }, { ttl: 1000 });
  const first = broker.read("same");
  const second = broker.read("same");
  release();
  const [left, right] = await Promise.all([first, second]);
  assert.equal(calls, 1, "concurrent reads must coalesce into one request");
  assert.equal(left, right, "coalesced readers must receive the same value");
  await broker.read("same");
  assert.equal(calls, 1, "fresh cached data must not trigger another request");
}

{
  let value = 1;
  const broker = createAsyncBroker(async () => value, { ttl: 5, maxStale: 1000 });
  assert.equal(await broker.read("stale"), 1);
  await sleep(10);
  value = 2;
  assert.equal(await broker.read("stale"), 1, "stale-while-refresh must return the last good value immediately");
  await sleep(5);
  assert.equal(broker.peek("stale").value, 2, "background refresh must replace stale data");
}

{
  let fail = false;
  const broker = createAsyncBroker(async () => { if (fail) throw new Error("offline"); return "last-good"; }, { ttl: 1, maxStale: 1000 });
  assert.equal(await broker.read("resilient"), "last-good");
  fail = true;
  broker.invalidate("resilient");
  assert.equal(await broker.refresh("resilient"), "last-good", "a failed refresh must preserve the last successful payload");
  assert.match(broker.peek("resilient").error.message, /offline/);
}

{
  let calls = 0;
  const broker = createAsyncBroker(async () => { calls += 1; throw new Error("down"); }, { retryBase: 1000, retryMax: 1000 });
  await assert.rejects(broker.read("backoff"), /down/);
  await assert.rejects(broker.read("backoff"), /down/);
  assert.equal(calls, 1, "retry backoff must prevent request storms after failure");
}

{
  let calls = 0, release;
  const gate = new Promise((resolveGate) => { release = resolveGate; });
  const broker = createAsyncBroker(async () => {
    calls += 1;
    if (calls === 1) await gate;
    return calls;
  }, { ttl: 1000 });
  const first = broker.read("invalidate-flight");
  await Promise.resolve();
  broker.invalidate("invalidate-flight");
  const forced = broker.read("invalidate-flight", null, { force: true });
  release();
  assert.equal(await first, 1);
  assert.equal(await forced, 2, "a forced read invalidated in flight must wait for a fresh follow-up request");
  assert.equal(calls, 2);
}

console.log("Async broker check passed: coalescing, fresh cache, stale refresh, last-good retention and backoff");
