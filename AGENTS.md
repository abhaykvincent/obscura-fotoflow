# AGENTS.md

Project guidance for OpenCode. Loaded automatically every session — no need to
repeat it in prompts. Keep it short; move long-form docs to `Docs/` and reference
them. Delete any section that does not apply.

## Project

FotoFlow (`obscura-fotoflow`) — React photo project management and sharing app.
CRA frontend, Redux Toolkit for state, Firebase for auth, Firestore, Storage,
and Cloud Functions.

- `src/` — React app. Feature code in `src/features/`, Redux slices in
  `src/app/slices/`, services in `src/services/`.
- `functions/` — Node 20 Cloud Functions (Express-based, firebase-functions v4).
- `Docs/`, `data-structure/` — reference material. Do not treat as source.
- Generated / do not edit by hand: `build/`, `node_modules/`, `firebase-export-*`.

## Commands

Run from the repo root unless noted.

| Task | Command |
| --- | --- |
| Dev server | `npm start` (uses `.env.development`) |
| Emulators | `npm run emulator` |
| Production build | `npm run build` (uses `.env.production`) |
| Tests | `npm test -- --watchAll=false` |
| Lint | `npx eslint src` |
| Functions serve | `cd functions && npm run serve` |

<!-- Add the exact command you use for typecheck, tests, and the "definition of
done" checks. Agents will run these before saying they are finished. -->

## Conventions

- Follow the Clean Code / SOLID guidance in `GEMINI.md`; this file does not
  restate it. Prefer small functions with intention-revealing names.
- Keep Redux state serializable. Convert `Date` to ISO strings before dispatch;
  never store Promises or class instances in the store.
- Keep Firestore access inside `src/services/` (or `src/firebase/`); components
  must not query Firestore directly.
- Style with Tailwind + Emotion per the surrounding file. Do not introduce a new
  styling system.
- Match existing file naming and folder placement before adding new patterns.

## Rules

- Do not commit secrets. `.env.development` and `.env.production` are local; if
  you need a new variable, add it to both and note it in `README.md`.
- Do not edit `firestore.rules`, `storage.rules`, or `firebase.json` without
  calling out the change explicitly — they affect deployed behavior.
- Never run `firebase deploy` (including `npm run deploy` / `deploy-all`).
  Deploys are manual.
- `npm test` runs in watch mode by default; always pass `--watchAll=false`.
- Do not modify `GEMINI.md`; it is another tool's config.

## Verification

<!-- Tell the agent what "done" means for this repo. Example:

Before finishing a change:
1. `npx eslint src`
2. `npm test -- --watchAll=false`
3. Manually confirm the affected flow in the dev server.
-->
