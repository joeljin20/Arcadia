# Arcadia

A hidden operating system for secret societies: access by rite, communication by symbol.

Arcadia is a demo-first web experience built for a hackathon setting. It is intentionally narrow, ritualized, and reliable: one coherent happy path that can be run repeatedly in front of judges.

## Submission Snapshot

- **Repo:** [joeljin20/Arcadia](https://github.com/joeljin20/Arcadia)
- **Run locally (single command):**
  ```bash
  npm install && npm run dev
  ```
- **Dev URL:** `http://localhost:3001`
- **Optional backend helper:**
  ```bash
  npx tsx server.ts
  ```

---

## What This Project Is

Arcadia is a two-layer product:

1. **Public front** (`Alchemy / Culinary Vault`): elegant recipe archive UI with hidden ritual mechanics.
2. **Hidden system** (`Arcadia`): multi-stage initiation gate + member dashboard + symbolic intel decode.

The design goal is to make the reveal feel magical while keeping implementation deterministic and demo-safe.

---

## Core Demo Flow (Exact)

1. Open **Alchemy**.
2. Discover/open **The Obsidian Cipher Torte** path.
3. Trigger **Hacker Console** and complete the number-sequence challenge.
4. Reach the unlocked vault state.
5. Enter the **Initiation Rite** (full details below):
   - Auth gate (new member or returning alias)
   - Present catalyst to camera (live ML key detection)
   - Solve Gemini-generated riddle
   - Complete **Trial I: Kio Alignment** (cant-axis puzzle)
   - Complete **Trial II: Ángel Caído** (compass bearing puzzle)
   - Complete **Trial III: Chamberí Signal** (pentagonal signal sequence puzzle)
6. Enter the **Arcadia Dashboard**.
7. In **Global Intel**, submit a message and show emoji cipher output.
8. Decode intel using the clue-driven answer.
9. Reveal original text + location map.
10. Show **Vault** and **Secure Comms** tabs for system completeness.

---

## Product Architecture

### Frontend

- React 19 + TypeScript + Vite
- TailwindCSS 4 + custom CSS ritual effects
- Motion animations via `motion/react`
- Web Audio API micro-sound cues
- TensorFlow.js in-browser object detection and classification for initiation

### Data

- `localStorage` via `src/services/mockDB.ts`
- Seeded data for reliability in demos
- Backward-compatible event schema upgrades

### Optional Backend

- `server.ts` (Express helper)
- Not required for the main app flow

---

## Exactly How Each Major Screen Works

### 1) Alchemy (Culinary Vault)

Implemented in:
- `src/pages/AlchemyPage.tsx`
- `src/components/RecipeCard.tsx`
- `src/components/RecipeDetail.tsx`
- `src/components/HackerConsoleOverlay.tsx`

What it does:
- Renders a responsive slot-based archive with one featured hero card and smaller cards.
- Supports filtering and search.
- The Obsidian path drives the unlock journey.
- Hacker console validates the ritual number sequence.

Notes:
- Layout uses deterministic slot math and periodic reshuffle.
- Visual effects (beam ring, CRT/glow, hover depth, parallax) are presentational only.

---

### 2) Initiation

Implemented in:
- `src/pages/InitiationPage.tsx`
- `src/components/initiation/TrialShell.tsx`
- `src/components/initiation/KioAlignmentTrial.tsx`
- `src/components/initiation/AngelBearingTrial.tsx`
- `src/components/initiation/ChamberiSignalTrial.tsx`

The initiation is a linear state machine with seven steps:

```
AUTH → VISION → PUZZLE → TRIAL_KIO → TRIAL_ANGEL → TRIAL_CHAMBERI → (onSuccess)
                   ↓ (failure)
               RICKROLL
```

#### AUTH gate

Two modes:
- **Return to Alias**: verifies a device-locked alias string against `mockDB`.
- **Start New Initiation**: proceeds directly to the vision scanner.

#### VISION: Alchemist's Gate (camera-based key detection)

The live scanner runs COCO-SSD and MobileNet v2 in-browser at ~5 fps. Each frame produces a composite score from four independent signals:

| Signal | Source | Max contribution |
|---|---|---|
| COCO class hit | Object detected as scissors, knife, fork, spoon, remote, cell phone, pen, toothbrush | 0.55 + 0.14 centre bonus |
| Shape prior | Any non-person elongated bbox (aspect ratio 1.4–12.0) when no COCO class hit | 0.30 |
| MobileNet keyword (full frame) | Probability for labels matching padlock, lock, wrench, bolt, hook, etc. | 0.25 |
| MobileNet keyword (centre crop) | Same keywords on a 55% centre crop (key fills more of crop) | 0.35 |

The raw frame score feeds into an EMA (`α = 0.65`) for temporal smoothing. A hysteresis state machine transitions between five states:

| State | Badge | Meaning |
|---|---|---|
| `LOADING` | hidden | Models still initializing |
| `READY_AWAITING` | grey "Awaiting the Instrument" | Live, no signal |
| `CATALYST_POSSIBLE` | amber "Catalyst Approaching" | EMA above 0.06 |
| `CATALYST_LOCKED` | green "Catalyst Locked" + bottom bar | 2 consecutive frames above 0.14 |
| `ANALYZING` | progress bar | Capture burst in progress |

When `CATALYST_LOCKED`, the CTA changes to "Seal the Gate" with a stronger green glow. The capture burst uses 2 frames (vs 4 cold) and a lower per-frame threshold (0.09 vs 0.12) because the live EMA is already confident.

Failure sends the user to a Rick Roll video. A `[DEV] Override` button bypasses the scanner for demos.

#### PUZZLE: Gemini riddle

A Gemini 1.5 Flash call generates a single-answer cryptic riddle. If the API is unavailable a hardcoded fallback riddle loads instead. Answer matching is case-insensitive, trimmed.

#### TRIAL I: Kio Alignment (`KioAlignmentTrial`)

Background: aerial photo of the Kio Towers (Madrid).

The puzzle presents a crosshair targeting system on a 400×260 SVG viewport. Two axes (left cant and right cant) must be brought into tolerance simultaneously.

Mechanics:
- Four hold-buttons adjust left/right cant independently.
- A 1-second hold-lock timer starts when both axes enter tolerance. Releasing early cancels it. An amber progress bar shows the countdown.
- Both axes drift sinusoidally every 2 seconds once partially aligned, making it slightly harder to hold.
- A convergence indicator shows how far each axis is from target.
- Guide lines converge geometrically onto the crosshair centre (SVG point 200, 130) when both axes are at target.

Two stages:
1. **ALIGN**: find the coarse alignment (±8° tolerance).
2. **HOLD**: maintain alignment for 1 second to seal.

#### TRIAL II: Ángel Caído (`AngelBearingTrial`)

Background: photo of the Ángel Caído statue in Retiro Park (Madrid).

A compass bearing must be set to a specific heading through two stages:

1. **ACQUIRE**: orient the compass SSW, roughly 231° (±10°). Lore: "The exiled one watches south-southwest, where Europa rises from the plain."
2. **CORRECT**: apply a 7° magnetic declination offset, reducing to 224° (±3°). Lore: "Even north deceives. The meridian through Retiro drifts seven degrees toward the setting sun."

Mechanics:
- Four hold-buttons adjust bearing in ±1° and ±10° increments. Arrow keys also work.
- EMA-smoothed proximity bloom ring pulses around the compass as the bearing approaches target.
- The needle wobbles (CSS animation) when far from target; the wobble pivot uses `transformBox: fill-box` so it rotates around the needle's own centre, not the SVG origin.
- A mini-map inset shows a bearing ray from the Retiro centre.
- Stage transition triggers a green radial flash and an audio cue.
- Completion word: **LUX**.

#### TRIAL III: Chamberí Signal (`ChamberiSignalTrial`)

Background: photo of Chamberí ghost metro station (Madrid).

A pentagonal node network displays a sequence of signal pulses. The user must replay the sequence in the correct order within 24 seconds.

Mechanics:
- Five nodes are positioned at geometrically precise pentagon coordinates for the 288×240px container.
- Observe phase: sequence of 4–6 nodes flashes with timing cues.
- Input phase: nodes pulse when hovered; clicking fires a signal. Correct inputs glow green, wrong inputs trigger an error flash and reset to observe.
- Sequence length increases each round. Round 2 adds one extra node.
- Progress bar counts down the 24-second input window.
- A slow-replay button re-shows the current sequence at reduced speed (once per round).
- Completion fires `onSuccess` after a short delay and plays `playAccessGranted`.

#### `TrialShell`

Shared wrapper used by all three trials. Provides:
- Full-screen background with a photo layer (opacity 0.42, saturate 0.7, brightness 0.88) over a dark gradient, plus a `bg-black/28` veil for text legibility.
- Step indicator, stage label badge, close button, and a `[DEV] Override` button.
- `imageObjectPosition` prop for per-trial photo framing.

---

### 3) Arcadia Dashboard

Implemented in:
- `src/pages/ArcadiaDashboard.tsx`
- `src/components/CipherCard.tsx`
- `src/components/AuctionCard.tsx`

Tabs:
- **Global Intel:** create encoded intel + decode challenge.
- **The Vault:** encrypted lot cards.
- **Secure Comms:** local shadow-node messaging simulation.

---

## Global Intel Cipher System (Detailed)

Implemented in:
- `src/logic/cipher.ts`
- `src/components/CipherCard.tsx`
- `src/pages/ArcadiaDashboard.tsx`

### Encoding pipeline

1. Admin/member submits text (typed or speech transcript).
2. Text is tokenized and normalized.
3. Tokens are encoded into symbols:
   - known keywords use a curated map (`lake -> 🌊`, `meeting -> 🜁`, etc.)
   - stopwords map to a neutral marker (`▪️`)
   - unknown words map to a deterministic fallback emoji via hashing (varied output, not repeated `💠`)

### Decode challenge pipeline

For each new intel event the app stores clue metadata:
- `clueType`: one of `last_emoji`, `nth_emoji`, `emoji_count`
- `cluePrompt`
- `expectedAnswer`
- optional `clueMeta`

Clue type selection is deterministic by event ID, weighted for demo reliability:
- ~80% `last_emoji`
- ~10% `nth_emoji`
- ~10% `emoji_count`

### Current answer mode (UX)

Clues are solved via typed text (easy for demos), not emoji keyboard input.
- For glyph-based clues, the user types the word represented by the glyph.
- Includes `Show Hint` and `Override Decode` actions so judges never get blocked.
- Legacy records (older schema) still decode via key fallback.

---

## Type/Data Model

`EventMetadata` supports clue metadata (all optional for backward compatibility):

- `clueType?: 'last_emoji' | 'nth_emoji' | 'emoji_count'`
- `cluePrompt?: string`
- `expectedAnswer?: string`
- `clueMeta?: { index?: number }`

Old events in localStorage remain valid; the read adapter safely defaults missing fields.

---

## Run Instructions

### Prerequisites

- Node.js 18+
- npm

### 1) Install

```bash
npm install
```

### 2) Environment

Create `.env.local` with at least:

```env
GEMINI_API_KEY=your_key_here
```

### 3) Start app

```bash
npm run dev
```

App runs on `http://localhost:3001`.

### 4) Optional helper server

```bash
npx tsx server.ts
```

### 5) Validate

```bash
npm run lint
npm run build
```

---

## Scripts

```bash
npm run dev               # Vite dev server (port 3001)
npm run build             # Production build
npm run preview           # Preview built app
npm run lint              # Type-check (tsc --noEmit)
npm run clean             # Remove dist
npm run ml:deps           # Install python deps for training pipeline
npm run ml:train:key      # Train local key classifier
npm run ml:train:key:docker # Dockerized training path
```

---

## File Structure

```text
src/
  components/
    initiation/
      AngelBearingTrial.tsx   — compass bearing puzzle (Trial II)
      ChamberiSignalTrial.tsx — signal sequence puzzle (Trial III)
      KioAlignmentTrial.tsx   — cant-axis alignment puzzle (Trial I)
      TrialShell.tsx          — shared trial wrapper (background, shell, override)
    AuctionCard.tsx
    CipherCard.tsx
    HackerConsoleOverlay.tsx
    RecipeCard.tsx
    RecipeDetail.tsx
  config/
    constants.ts
  logic/
    cipher.ts
  pages/
    AdminPanel.tsx
    AlchemyPage.tsx
    ArcadiaDashboard.tsx
    InitiationPage.tsx        — full initiation state machine + VisionScanner
  services/
    audio.ts
    gemini.ts
    mockDB.ts
  types/
    index.ts
  App.tsx
  index.css
  main.tsx
public/
  assets/
    trials/
      angel-caido.jpg         — Ángel Caído statue, Retiro Park
      chamberi-platform.jpg   — Chamberí ghost station platform
      kio-towers.jpg          — Kio inclined towers, Madrid
      retiro-map.jpg          — Retiro Park mini-map inset
server.ts
ml/
README.md
```

---

## Fallbacks / Demo Resilience

1. **Puzzle fallback:** hardcoded riddle if Gemini fails.
2. **Vision override:** `[DEV] Override Vision Scanner` bypasses camera detection entirely.
3. **Trial override:** every trial has a `[DEV] Override` button in the shell.
4. **Decode fallback:** hint + override button in intel decode.
5. **Legacy data fallback:** old events remain decodable.
6. **Seeded data:** preloaded auctions/events/members for continuity.
7. **Location fallback:** text location still shown even if map is not ideal.

---

## What Judges Should Notice

1. **Cohesive reveal design:** Alchemy front to hidden Arcadia, each layer narratively motivated.
2. **Three distinct puzzle mechanics:** alignment hold, bearing correction, signal sequence — each thematically tied to a real Madrid location.
3. **Deterministic symbolic system:** repeatable, explainable encoding/decoding.
4. **Demo reliability:** fast local run, seeded state, graceful fallbacks at every step.
5. **Technical breadth:** in-browser ML (COCO-SSD + MobileNet EMA), React state machines, Web Audio, AI puzzle generation, symbolic cipher pipeline.

---

## 5-Minute Pitch Guidance

- Minute 1: Vision + reveal (Alchemy → hidden path)
- Minute 2: Initiation rite (camera detection, riddle, then trials)
- Minute 3: Trial highlights — Kio alignment, Ángel bearing, Chamberí signal
- Minute 4: Global Intel post + emoji cipher + clue-based decode
- Minute 5: Vault/comms + architecture/fallback reliability

Q&A emphasis:
- EMA smoothing and hysteresis prevent false positives in the vision scanner
- Three-stage trial design ensures the reveal feels earned even in a 60-second demo
- Deterministic cipher over fragile AI where reliability matters
- All fallback paths protect live demos at every stage

---

## License

Hackathon prototype. Add a formal license before production use.
