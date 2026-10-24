import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Cross-platform E2E server launcher; no POSIX shell syntax or local shell aliases.
const studio = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = {
  ...process.env,
  INKOS_STUDIO_PORT: "4581",
  INKOS_PROJECT_ROOT: resolve(studio, "../../test-project"),
  INKOS_STUDIO_HOST: "127.0.0.1",
};
const backend = spawn(process.execPath, ["--import", "tsx", "src/api/index.ts"], {
  cwd: studio, env, stdio: "inherit", windowsHide: true,
});
const vite = spawn(process.execPath, [resolve(studio, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", "4580"], {
  cwd: studio, env, stdio: "inherit", windowsHide: true,
});
function shutdown() {
  for (const child of [backend, vite]) if (!child.killed) child.kill();
}
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { shutdown(); process.exit(0); });
for (const child of [backend, vite]) child.on("exit", (code) => {
  if (code !== null && code !== 0) {
    shutdown();
    process.exitCode = code || 1;
  }
});
