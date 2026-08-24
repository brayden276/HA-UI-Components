import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = Object.fromEntries(await Promise.all([
  "src/components/media-row.js",
  "src/components/welcome-header.js",
  "src/components/home-overview.js",
  "src/components/household-directory.js",
  "src/components/history-graph.js",
  "src/components/energy-history-card.js",
  "src/components/camera-controller-v2.js",
  "src/components/security-camera-wall.js",
  "src/components/security-dashboard.js",
  "src/components/camera-controller.js",
  "src/components/component-apple-tv-controller-v1.js",
  "src/components/room-directory.js",
  "src/components/wled-controller.js",
  "src/shared/dashboard-style-tokens.js",
  "src/shared/lifecycle.js",
  "src/shared/security-runtime.js",
  "src/support/dashboard-preference-editor.js",
].map(async (file) => [file, await readFile(resolve(root, file), "utf8")])));

const failures = [];
const requireText = (file, text, message) => {
  if (!sources[file].includes(text)) failures.push(message);
};

requireText("src/shared/dashboard-style-tokens.js", "--dashboard-control-height:44px", "Global controls must retain a 44px minimum target token");
requireText("src/shared/dashboard-style-tokens.js", "prefers-reduced-motion:reduce", "Global motion must respect reduced-motion preferences");
requireText("src/components/media-row.js", ".btn{position:relative;width:44px;height:44px", "Media transport controls must retain 44px targets");
requireText("src/components/welcome-header.js", ".row{min-height:44px", "Welcome header must retain a stable 44px row");
requireText("src/components/home-overview.js", ".weather{appearance:none;border:0;min-height:44px", "Overview weather control must retain a 44px target");
requireText("src/components/home-overview.js", 'quick_action_label: "dashboard_quick_action"', "Home must configure reusable labelled quick actions");
requireText("src/components/household-directory.js", 'action: "perform-action"', "Labelled Home quick actions must execute native Home Assistant actions");
requireText("src/components/household-directory.js", "labels.includes(this.c.quick_action_label)", "Home quick actions must be discovered by registry label");
requireText("src/components/history-graph.js", ".legend button{appearance:none;min-height:44px", "Reusable graph legend controls must retain 44px targets");
requireText("src/components/energy-history-card.js", ".legend button{appearance:none;min-height:44px", "Energy legend controls must retain 44px targets");
requireText("src/components/energy-history-card.js", "if(next.profile)next.calendar_day=true", "Profile-backed Energy history must use the backend calendar-day contract");
requireText("src/support/dashboard-preference-editor.js", ".cancel,.save{min-height:44px", "Preference actions must retain 44px targets");
requireText("src/shared/security-runtime.js", "is not configured", "Missing Security profiles must remain explicit configuration errors");
requireText("src/components/camera-controller-v2.js", 'wasOn ? "turn_off" : "turn_on"', "Camera controls must call explicit switch on/off services");
requireText("src/components/camera-controller-v2.js", "dialogController.setBusy(true)", "Camera controls must expose pending state semantics");
requireText("src/components/security-camera-wall.js", ">Settings</span>", "Security camera tiles must expose a labelled Settings action");
requireText("src/components/security-dashboard.js", 'document.createElement("ha-camera-stream")', "Security camera imagery must open a dedicated live viewer");
requireText("src/components/security-dashboard.js", "createOverlayController", "Security camera overlays must use the shared resilient overlay controller");
requireText("src/components/security-dashboard.js", "Quick actions", "Security composition must retain backend-mapped quick actions");
requireText("src/shared/lifecycle.js", "backdropPointerStarted", "Overlay dismissal must not consume the click that opened it");
requireText("src/components/camera-controller-v2.js", "Last detections", "Camera settings must expose the latest classification snapshots");
requireText("src/components/camera-controller.js", ".switchbtn{min-width:58px;height:44px", "Camera V1 switch controls must retain 44px targets");
requireText("src/components/component-apple-tv-controller-v1.js", ".keyboard-input{width:100%;min-height:44px", "Apple TV keyboard input must retain a 44px target");
requireText("src/components/room-directory.js", ".metric{appearance:none;border:0;background:transparent;min-height:44px", "Room sheet metrics must retain 44px targets");
requireText("src/components/wled-controller.js", ".preset-btn{appearance:none;min-height:44px", "WLED presets must retain 44px targets");

if (failures.length) throw new Error(`Polish contract failures:\n${failures.join("\n")}`);
console.log("Polish contracts passed: targets, motion, profile errors and deterministic controls");
