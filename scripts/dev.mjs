import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const files = [
  fileURLToPath(new URL("../server/index.js", import.meta.url)),
  fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
];
const children = files.map((file, index) => spawn(process.execPath, [file], {
  stdio: "inherit",
  env: { ...process.env, ...(index === 0 ? { PORT: "8787" } : {}) },
}));
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill();
  if (code) process.exitCode = code;
}
for (const child of children) {
  child.on("error", (error) => { console.error(error); stop(1); });
  child.on("exit", (code) => { if (!stopping) stop(code || 0); });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
