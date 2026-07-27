# AGENTS.md

## Project

Luna CLI is the standalone command-line client and paired AI Skill for Luna DevOps.

## Required behavior

- Use pnpm for dependency management.
- Keep human-readable and `--agent` JSON output behavior stable.
- User-visible CLI text must support Chinese and English.
- Treat `openapi/openapi.yaml` as a synchronized snapshot of the Luna DevOps API contract.
- Keep `skills/luna-devops` aligned with the command catalog and CLI version.
- Do not commit generated `dist/`, `release/`, dependency directories, credentials, or local environment files.
- Do not commit or push unless explicitly requested.

## Validation

```bash
pnpm install
pnpm check:release-scripts
pnpm check:contract
pnpm check:skills
pnpm check
```

When a sibling Luna DevOps checkout is available, also run:

```bash
LUNA_PLATFORM_ROOT=../luna-devops pnpm check:platform-coverage
```
