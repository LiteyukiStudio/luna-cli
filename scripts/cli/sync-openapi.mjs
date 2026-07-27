import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  fail,
  isMainModule,
  parseArguments,
  repositoryRoot,
} from "./lib.mjs";

const upstreamUrl =
  "https://raw.githubusercontent.com/LiteyukiStudio/luna-devops/main/openapi/openapi.yaml";

function defaultLocalSource() {
  const candidates = [
    resolve(repositoryRoot, "../openapi/openapi.yaml"),
    resolve(repositoryRoot, "../luna-devops/openapi/openapi.yaml"),
    resolve(repositoryRoot, "../devops/openapi/openapi.yaml"),
  ];
  return candidates.find(existsSync);
}

export async function loadOpenApiSource(source) {
  if (source?.startsWith("http://") || source?.startsWith("https://")) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Unable to fetch OpenAPI contract: HTTP ${response.status}`);
    }
    return response.text();
  }
  if (source) {
    return readFileSync(resolve(repositoryRoot, source), "utf8");
  }

  const localSource = defaultLocalSource();
  if (localSource) {
    return readFileSync(localSource, "utf8");
  }
  return loadOpenApiSource(upstreamUrl);
}

export async function syncOpenApi(source) {
  const content = await loadOpenApiSource(source);
  const destination = resolve(repositoryRoot, "openapi/openapi.yaml");
  writeFileSync(destination, content.endsWith("\n") ? content : `${content}\n`);
  return destination;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const destination = await syncOpenApi(args.get("source"));
  process.stdout.write(
    `Synchronized ${destination} from ${args.get("source") ?? defaultLocalSource() ?? upstreamUrl}\n`,
  );
}

if (isMainModule(import.meta.url)) {
  main().catch(fail);
}
