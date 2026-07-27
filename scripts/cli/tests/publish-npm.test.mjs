import assert from "node:assert/strict";
import test from "node:test";

import { resolvePublishIdentity } from "../publish-npm.mjs";

const sourcePackageJson = {
  name: "@liteyuki/luna-cli",
  version: "0.0.0-development",
  private: true,
  repository: {
    type: "git",
    url: "https://github.com/LiteyukiStudio/luna-cli.git",
  },
};

test("uses the packed manifest as the npm release version source", () => {
  const identity = resolvePublishIdentity({
    sourcePackageJson,
    packedPackageJson: {
      name: "@liteyuki/luna-cli",
      version: "0.0.0-beta.4",
      repository: sourcePackageJson.repository,
    },
    expectedVersion: "0.0.0-beta.4",
    githubRepository: "LiteyukiStudio/luna-cli",
  });

  assert.deepEqual(identity, {
    name: "@liteyuki/luna-cli",
    version: "0.0.0-beta.4",
  });
});

test("accepts the packed repository when it matches GitHub provenance", () => {
  assert.doesNotThrow(() => resolvePublishIdentity({
    sourcePackageJson,
    packedPackageJson: {
      name: "@liteyuki/luna-cli",
      version: "0.0.0-beta.4",
      repository: {
        type: "git",
        url: "git+https://github.com/LiteyukiStudio/luna-cli.git",
      },
    },
    expectedVersion: "0.0.0-beta.4",
    githubRepository: "LiteyukiStudio/luna-cli",
  }));
});

test("rejects a packed repository that would fail npm provenance", () => {
  assert.throws(
    () => resolvePublishIdentity({
      sourcePackageJson,
      packedPackageJson: {
        name: "@liteyuki/luna-cli",
        version: "0.0.0-beta.4",
        repository: {
          type: "git",
          url: "https://github.com/LiteyukiStudio/devops.git",
        },
      },
      expectedVersion: "0.0.0-beta.4",
      githubRepository: "LiteyukiStudio/luna-cli",
    }),
    /npm provenance would reject this release/,
  );
});

test("rejects a tarball with an unexpected package identity or version", () => {
  assert.throws(
    () => resolvePublishIdentity({
      sourcePackageJson,
      packedPackageJson: {
        name: "@example/luna-cli",
        version: "0.0.0-beta.4",
      },
      expectedVersion: "0.0.0-beta.4",
    }),
    /Expected package/,
  );

  assert.throws(
    () => resolvePublishIdentity({
      sourcePackageJson,
      packedPackageJson: {
        name: "@liteyuki/luna-cli",
        version: "0.0.0-beta.3",
      },
      expectedVersion: "0.0.0-beta.4",
    }),
    /Expected version/,
  );
});

test("rejects a private tarball manifest", () => {
  assert.throws(
    () => resolvePublishIdentity({
      sourcePackageJson,
      packedPackageJson: {
        name: "@liteyuki/luna-cli",
        version: "0.0.0-beta.4",
        private: true,
      },
      expectedVersion: "0.0.0-beta.4",
    }),
    /must not be private/,
  );
});
