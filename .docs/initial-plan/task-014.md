# Task 014 — Ink-Wash Visual Theme & Gamified Scenes (AC8)

## Goal
Every page is presented in the 国风彩墨 ink-wash visual theme, and the designated "gamified" moments (landing, main game board journey path, assassination suspense, end reveal) render as animated three.js scenes with a static-image fallback.

## Prerequisites
- [ ] task-011.md completed

## Tasks

### Design System
- [ ] `src/theme/tokens.<ext>` — color tokens (ink black, rice-paper white, vermillion, imperial gold, jade, indigo) and typography tokens per [design.md](design.md) §Color Palette & Typography (new)
  - [ ] `src/theme/tokens.spec.<ext>` — every token referenced in the component library resolves to a defined value
- [ ] `src/pages/components/ScrollCard.<ext>` — base scroll/parchment panel container (new)
- [ ] `src/pages/components/BrushDivider.<ext>` — brush-stroke section divider (new)
- [ ] `src/pages/components/InkSplashTransition.<ext>` — ink-diffusion reveal/transition wrapper (new)
  - [ ] `src/pages/components/InkSplashTransition.spec.<ext>` — transition completes and reveals wrapped content
- [ ] `src/pages/components/SealBadge.<ext>` — red seal/stamp badge (host marker, win marker) (new)

### Three.js Gamified Scenes
- [ ] `src/theme/scenes/landingScene.<ext>` — ink-wash mountain/cloud drift scene for the Landing page (new)
  - [ ] `src/theme/scenes/landingScene.spec.<ext>` — falls back to a static image when WebGL is unavailable
- [ ] `src/theme/scenes/journeyPathScene.<ext>` — five-waypoint journey-path scene on the Main Game Board, advancing the traveling-party icon after each mission resolves (new)
  - [ ] `src/theme/scenes/journeyPathScene.spec.<ext>` — advances exactly one waypoint per resolved mission result; falls back to a static image when WebGL is unavailable
- [ ] `src/theme/scenes/assassinationSuspenseScene.<ext>` — swirling ink-cloud suspense scene for non-Assassin devices during the Assassination Phase (new)
  - [ ] `src/theme/scenes/assassinationSuspenseScene.spec.<ext>` — falls back to a static image when WebGL is unavailable
- [ ] `src/pages/EndGamePage.<ext>` — add the red-seal stamp reveal animation (lotus seal for Good, demon-mask seal for Evil) (edit)
  - [ ] `src/pages/EndGamePage.spec.<ext>` — renders the lotus seal on GoodWin and the demon-mask seal on EvilWin (extends existing spec from task-011)

### Page Wiring
- [ ] `src/pages/LandingPage.<ext>` — new landing page using `landingScene`, `ScrollCard` host/join buttons, and `LanguageToggle` per [design.md](design.md) §1 (new)
  - [ ] `src/pages/LandingPage.spec.<ext>` — renders Host/Join actions and the language toggle

## Done When
- [ ] Every page listed in [design.md](design.md) Page-by-Page Breakdown uses the shared ink-wash component library
- [ ] All four three.js scenes render their static fallback when WebGL is disabled (verified in tests)
- [ ] All new/modified tests pass
- [ ] No existing tests broken
