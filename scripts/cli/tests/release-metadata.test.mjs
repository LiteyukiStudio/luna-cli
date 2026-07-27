import assert from "node:assert/strict";
import test from "node:test";

import { resolveReleaseMetadata } from "../release-metadata.mjs";

test("maps stable CLI tags to latest", () => {
  assert.deepEqual(resolveReleaseMetadata("v1.2.3"), {
    tag: "v1.2.3",
    version: "1.2.3",
    npm_tag: "latest",
    prerelease: "false",
  });
});

test("maps beta and other prereleases without contaminating latest", () => {
  assert.equal(
    resolveReleaseMetadata("v1.2.3-beta.1").npm_tag,
    "beta",
  );
  assert.equal(
    resolveReleaseMetadata("v1.2.3-rc.1").npm_tag,
    "next",
  );
});

test("rejects malformed tags", () => {
  assert.throws(
    () => resolveReleaseMetadata("1.2.3"),
    /must start with v/,
  );
  assert.throws(
    () => resolveReleaseMetadata("v1.2.3-rc.01"),
    /invalid SemVer/,
  );
});
