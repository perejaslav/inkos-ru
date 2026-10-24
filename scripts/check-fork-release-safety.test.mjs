import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

const guard = resolve(import.meta.dirname, "check-fork-release-safety.mjs");

function inFixture(files, validate) {
  const root = mkdtempSync(join(tmpdir(), "inkos-guard-"));
  try {
    mkdirSync(join(root, "scripts"));
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    copyFileSync(guard, join(root, "scripts", "check-fork-release-safety.mjs"));
    for (const file of files) writeFileSync(join(root, ".github", "workflows", file), "name: fixture\n");
    validate(spawnSync(process.execPath, [join(root, "scripts", "check-fork-release-safety.mjs")], { encoding: "utf8" }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("accepts a CI-only fork", () => {
  inFixture(["ci.yml"], (run) => {
    assert.equal(run.status, 0);
    assert.match(run.stdout, /PASS/);
  });
});

for (const releaseName of ["release.yml", "release.yaml"]) {
  test(`rejects upstream ${releaseName}`, () => {
    inFixture(["ci.yml", releaseName], (run) => {
      assert.equal(run.status, 1);
      assert.match(run.stderr, /Unsafe fork/);
    });
  });
}

test("rejects missing CI workflow", () => {
  inFixture([], (run) => {
    assert.equal(run.status, 1);
    assert.match(run.stderr, /CI workflow is missing/);
  });
});
