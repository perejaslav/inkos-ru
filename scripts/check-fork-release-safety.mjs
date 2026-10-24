import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Guard this fork's development branch from accidentally carrying a tag-triggered
// upstream npm publisher. This cannot replace GitHub-side workflow controls.
const repoRoot = resolve(import.meta.dirname, "..");
const releasePath = resolve(repoRoot, ".github/workflows/release.yml");
const releaseYamlPath = resolve(repoRoot, ".github/workflows/release.yaml");
const ciPath = resolve(repoRoot, ".github/workflows/ci.yml");

if (!existsSync(ciPath)) {
  console.error("Unsafe fork: CI workflow is missing.");
  process.exitCode = 1;
} else if (existsSync(releasePath) || existsSync(releaseYamlPath)) {
  console.error("Unsafe fork: upstream release workflow present. Do not publish.");
  process.exitCode = 1;
} else {
  console.log("Fork release guard PASS: CI present, tag-triggered release workflow absent.");
}
