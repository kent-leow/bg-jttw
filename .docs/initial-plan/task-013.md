# Task 013 — Bilingual Interface (AC7)

## Goal
Every screen, role name, and instructional string is available in both English and Chinese, with a language toggle, per AC7.

## Prerequisites
- [x] task-011.md completed
- [x] task-012.md completed

## Tasks

### i18n Infrastructure
- [x] `src/i18n/index.ts` — translation lookup utility (key → active-locale string), with `en` and `zh` as supported locales (new)
  - [x] `src/i18n/index.spec.ts` — returns the correct string for the active locale; falls back explicitly (not silently) when a key is missing in one locale
- [x] `src/i18n/locales/en.json` — English strings for every page/role/instruction introduced in task-006 through task-011 (new)
- [x] `src/i18n/locales/zh.json` — Chinese strings for the same key set as `en.json` (new)
  - [x] `src/i18n/localeParity.spec.ts` — asserts `en.json` and `zh.json` contain exactly the same set of keys (no missing/extra translations)
- [x] `src/pages/components/LanguageToggle.<ext>` — English/中文 toggle shown in the corner of every page per [design.md](design.md) §1 (new)
  - [x] `src/pages/components/LanguageToggle.spec.<ext>` — switching locale updates rendered text on the current page without a reload

### Wiring
- [x] `src/pages/HostSetupPage.<ext>`, `JoinPage.<ext>`, `LobbyPage.<ext>`, `RoleRevealPage.<ext>`, `GameBoardPage.<ext>`, `MissionResultPage.<ext>`, `AssassinationPage.<ext>`, `EndGamePage.<ext>` — replace hardcoded strings with `i18n` lookups (edit, no new test files — covered by each page's existing spec asserting translated output)

## Done When
- [x] Toggling language on any page immediately re-renders all visible text in the chosen language, with no page needing a reload
- [x] `localeParity.spec` passes, confirming no missing translations
- [x] All new/modified tests pass
- [x] No existing tests broken
