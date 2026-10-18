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

## Git

Branch off `develop-alpha`, never off `main` and never commit directly to
`main`. Feature branches merge into a `session/<n>` branch first, then that
merges into `develop-alpha`.

### Branch names

`<type>/<kebab-case-summary>-<suffix>`

- `type` — one of `feat`, `fix`, `refactor`.
- summary — short, kebab-case, describes the change.
- `suffix` — a short unique token to avoid collisions. Use `F…` for `feat` and
  `fix`, `R…` for `refactor`. Omit it only if the name is already unique.

Examples from this repo:

- `feat/copy-button-component-F3Cbc7`
- `fix/collection-status-tdz-F6CsT7`
- `refactor/dedupe-shoot-creation-R4`

### Commit messages

`<emoji> <type>[(scope)]: <summary>`

Pick the single emoji that best fits the change. Subject line only; add a body
only when the change genuinely needs explanation. No trailing period.

| Emoji | Use for |
| --- | --- |
| ✨ | new feature |
| 🐛 | bug fix |
| ♻️ | refactor, no behavior change |
| 🎨 | style, formatting, visual polish |
| ⚡ | performance |
| ♿ | accessibility |
| 🔒 | security, hiding or restricting access |
| 🔓 | removing a restriction |
| 📊 | data, tables, analytics |
| 📋 | docs |
| 🔧 | config, tooling |
| 🙈 | gitignore |
| 🚀 | deploy, release |
| 💳 | payments |
| 💄 | cosmetic UI |

Example: `🐛 fix: Define missing keyframes and fix budget hover timer`

Keep one logical change per commit. Do not use `git commit --no-verify`. Only
commit when asked; do not push or open PRs unless asked.

## Verification

<!-- Tell the agent what "done" means for this repo. Example:

Before finishing a change:
1. `npx eslint src`
2. `npm test -- --watchAll=false`
3. Manually confirm the affected flow in the dev server.
-->
