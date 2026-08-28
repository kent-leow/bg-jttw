# Journey to the West — Social Deduction

Backend-free, single-device pass-and-play social-deduction party game (reskin of the Resistance/Avalon rule family), themed around Journey to the West. See [.docs/initial-plan/plan.md](.docs/initial-plan/plan.md) and [.docs/pass-and-play-plan/plan.md](.docs/pass-and-play-plan/plan.md) for the full spec.

## Commands

```bash
npm install     # install dependencies
npm run dev     # start the dev server
npm run build   # static production build (dist/) — no server/API routes
npm run preview # preview the production build locally
npm test        # run the test suite once
npm run test:watch
npm run lint    # eslint
npm run format  # prettier --write
```

## Structure

- `src/engine/` — framework-agnostic game-logic modules
- `src/state/` — local game state and persistence modules
- `src/i18n/` — translation infra and locale files
- `src/theme/` — ink-wash design system and three.js scene modules
- `src/pages/` — page-level UI components

### Single-Device Pass-and-Play Model

This game uses a **single-device pass-and-play** architecture: one device is used for the entire game session. Players physically pass the device around; sensitive game phases (role reveal, voting, mission card submission, assassination pick) are gated behind a "pass-the-device" confirmation screen that hides content until explicitly revealed by the current player. Game state persists locally in browser storage and is never synchronized across devices.

## Deployment

Static-only hosting on Vercel (see `vercel.json`) — no serverless functions or API routes.
