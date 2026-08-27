# Visual Design — The Resistance: Journey to the West

Companion to [plan.md](plan.md) and [gameplay.md](gameplay.md). Describes how each page presents itself, in a 国风彩墨 (guófēng cǎimò — Chinese ink-and-color wash painting) style themed around Journey to the West.

## Art Direction

- **Core aesthetic**: traditional Chinese ink-wash (水墨) brush strokes and paper-scroll texture as the base layer, lifted with restrained mineral-color (彩墨) accents — the palette used in classical Journey to the West illustrated scrolls, not a flat cartoon style.
- **Motion identity**: brush-stroke reveals, ink-diffusion transitions (ink "blooming" into water) instead of hard cuts/fades; clouds and mist drifting slowly in the background instead of static imagery.
- **Iconography**: every role and phase is represented by a hand-painted-style character portrait or symbol (e.g., a cloud-somersault trail for Sun Wukong, a nine-ring staff glyph for Tang Sanzang) rather than generic icons.

## Color Palette & Typography

| Token | Use | Reference tone |
|---|---|---|
| Ink black / charcoal | primary text, line art, brush strokes | 墨黑 |
| Rice-paper white / warm cream | page background (paper texture) | 宣纸 |
| Vermillion red | primary accent — call-to-action buttons, the host's seal/stamp mark, "Fail" mission result | 朱砂 |
| Imperial gold | secondary accent — win states, Merlin-line role highlights, borders | 泥金 |
| Jade green | tertiary accent — "Success" mission result, good-aligned role highlights | 玉 |
| Indigo/cloud grey | evil-aligned role highlights, night/suspense states | 靛青 |

- **Chinese type**: a brush/calligraphy-style display face for headings and role names; a clean, high-legibility Chinese body face for instructional text (readability on small mobile screens takes priority over brush styling in body copy).
- **Latin type**: a companion serif or brush-influenced Latin display face for English headings, paired with a plain sans-serif for English body text, so English and Chinese body copy sit at matching visual weight per [plan.md](plan.md) AC7 (bilingual interface).
- A red seal/stamp graphic (印章) is used as a recurring brand mark (e.g., on the host's screen, on the final result screen) — a traditional way to "sign" a finished piece, doubling as a visual cue for "host" or "final".

## Graphics & Animation Technology

- **three.js** (official, MIT-licensed, open-source WebGL library) drives the animated background scenes and the mission-progress "journey path" — chosen because it's a legitimately licensed, widely-used standard rather than a bespoke or unlicensed asset pipeline.
- Scenes are built as low-poly / flat-shaded, pixel-art-adjacent 3D (limited color steps, hard-edged lighting) so they read as an extension of the ink-wash 2D art rather than a photorealistic clash, and stay light enough for mobile GPUs.
- three.js is reserved for a small number of "gameified" moments (see Page-by-Page Breakdown) — it is not used for static text/menu screens, keeping most of the UI as lightweight 2D/DOM rendering for battery and performance on mobile Chrome.
- Every three.js scene has a static-image fallback for devices where WebGL is unavailable or disabled.

## Page-by-Page Breakdown

### 1. Landing Page
- Full-bleed ink-wash mountain/cloud scene (three.js, slow parasitic cloud drift) evoking the start of the pilgrimage.
- Two primary actions: "Host a Game" (host flow) and "Join a Game" (join flow), styled as brush-painted scroll buttons.
- Language toggle (English / 中文) in the corner.

### 2. Host Setup Page
- Player-count selector (5–10), styled as counting beads/scroll markers.
- Once set, displays the host's join QR code centered on a scroll/parchment card, with a live seat counter ("2/6 joined").
- Background: static ink mountains (no three.js here — this screen is shown a long time waiting for joins, so kept lightweight).

### 3. Join Page
- Camera/QR-scan viewport framed as an open scroll.
- On successful scan, shows the joining player's own reply QR code for the host to scan back, with a brush-stroke checkmark animation once the host confirms the connection.

### 4. Lobby / Waiting Room
- Player list rendered as a row of character-silhouette scroll portraits (identities hidden — roles aren't assigned yet), each lighting up as a device connects.
- Host-only "Start Game" button, disabled until all seats are filled (mirrors [gameplay.md](gameplay.md) Flow 2).

### 5. Role Reveal Page (private, per device)
- Full-screen reveal: an ink-splash transition resolves into that player's Journey to the West character portrait, role name (bilingual), and any hidden knowledge (e.g., Merlin's list of evil players) painted as a scroll unrolling.
- No other player's device shows any of this content (matches the encryption model in [gameplay.md](gameplay.md) Flow 3).

### 6. Main Game Board
- Centerpiece: a three.js "journey path" — a winding road across five mountain waypoints (one per mission), with a small traveling party icon that advances after each mission resolves. This is the primary "gameified" three.js scene.
- Current leader is marked with a glowing gold seal over their portrait.
- Team Proposal panel: leader taps player portraits to select the mission team.
- Vote panel: brush-stroke "Approve" (jade) / "Reject" (vermillion) buttons; live "x/y voted" counter shown to the host only, with a "Next" scroll-button that only unrolls once all votes are in.

### 7. Mission Resolution Reveal
- Animated ink-splash result: a jade lotus bloom animation for Success, a dark ink-and-smoke demon-silhouette animation for Fail — individual cards are never shown, only the aggregate result (matches [gameplay.md](gameplay.md) Flow 4).

### 8. Assassination Phase Page
- Shown only on the Assassin's device: a portrait grid of all good-aligned-looking players to choose a target from, framed as a "final strike" ink-brush scene.
- All other devices show a shared "the Assassin is choosing…" suspense screen (a slowly swirling ink-cloud three.js scene).

### 9. End Game / Reveal Page
- Full role reveal: every player's true character portrait and role flips over (brush-stroke card-flip), with a large red seal stamp animation over the winning side's emblem (Buddhist lotus seal for Good, demon-mask seal for Evil).
- Host-only "Rematch" / "End Session" scroll buttons.

## Component Library (reused across pages)
- Scroll-card container (the base "panel" shape used for buttons, player lists, and dialogs)
- Brush-stroke divider (section separator)
- Ink-splash transition (used for reveals and result screens)
- Character portrait chip (circular, ink-outlined, used in lobby, board, and reveal pages)
- Seal/stamp badge (host marker, win marker, brand mark)

## Responsive & Performance Considerations
- Mobile-first, portrait-oriented layouts (primary target: mobile Chrome, per [plan.md](plan.md) constraints), with desktop treated as a scaled-up variant of the same layout.
- three.js scenes are limited to the Landing, Main Game Board, and Assassination suspense screens; all other pages use static or CSS-only motion to conserve battery/GPU on mobile devices.
- Ink-wash textures are pre-rendered image assets (not real-time fluid simulation) to keep load times and runtime cost low.

## Localization Notes
- Every text element on every page above has an English and a Chinese variant per [plan.md](plan.md) AC7; layouts must accommodate both without truncation (Chinese glyphs are denser but shorter in character count, English strings run longer horizontally).
