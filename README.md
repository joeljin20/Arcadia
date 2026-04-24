# Arcadia

A hidden operating system for secret societies: access by rite, communication by symbol.

Arcadia is a demo-first ritual web experience. Users enter through a public-facing “Alchemy” vault, discover hidden access paths, complete initiation, and unlock a symbolic coordination layer.

## Product Summary

Arcadia is designed as a narrow, high-impact demo system with a coherent end-to-end flow:

1. Alchemy landing and archive exploration.
2. Secret unlock discovery and ritual decryption path.
3. Initiation with artefact verification + puzzle gate.
4. Member dashboard and encoded message flow.
5. Admin event/message creation.
6. Decode and reveal behavior with resilient fallbacks.

The implementation prioritizes stability, performance, and demo reliability over feature sprawl.

## Demo Story

Recommended demo run order:

1. Open **Alchemy / Culinary Vault**.
2. Click **Alchemy** to reveal search and enter the hidden phrase or follow the Obsidian clue path.
3. Open **The Obsidian Cipher Torte** detail view.
4. Trigger **Initiate Decryption** and complete the hacker console sequence.
5. Return to the vault with unlocked state active.
6. Trigger Arcadia access and run initiation.
7. Pass artefact check (camera/upload path + retry fallback).
8. Solve puzzle (Gemini-generated with hardcoded backup).
9. Enter dashboard, review encoded content.
10. Switch to admin panel, create encoded event/message.
11. Return to member flow and decode.

## Architecture Overview

### Frontend

- React + TypeScript + Vite
- Motion animations via `motion/react`
- TailwindCSS 4 styling + custom ritual effects in `src/index.css`

State flow is managed in `src/App.tsx`:

- `ALCHEMY`
- `INITIATION`
- `DASHBOARD`
- `ADMIN`
- (`HACKER` type exists for flow compatibility; hacker console currently used as overlay)

### Pages and Components

- `src/pages/AlchemyPage.tsx`
  - Vault layout engine
  - Secret/unlock flow orchestration
  - Featured + card slot composition and reshuffle
- `src/components/HackerConsoleOverlay.tsx`
  - Number-sequence validation and breach flow
- `src/pages/InitiationPage.tsx`
  - Artefact check + puzzle challenge
- `src/pages/ArcadiaDashboard.tsx`
  - Member-facing ritual dashboard
- `src/pages/AdminPanel.tsx`
  - Admin creation flow
- `src/components/RecipeCard.tsx`, `src/components/RecipeDetail.tsx`
  - Archive cards, featured treatment, detail and decryption CTA

### Data Layer

- Current runtime persistence: `localStorage` abstraction via `src/services/mockDB.ts`
- Seeded default entities included for demo continuity

### Optional Backend Helper

- `server.ts` (Express utility service)
- Provides `/api/health` only; initiation artefact verification runs in-browser with TensorFlow.js

## Technologies Used

- React 19
- TypeScript
- Vite
- TailwindCSS 4
- `motion/react`
- Lucide React icons
- Google Gemini (`@google/genai`)
- TensorFlow.js (`@tensorflow/tfjs`, `@tensorflow-models/coco-ssd`, `@tensorflow-models/mobilenet`)
- Express + CORS (optional local API helper)

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm

### 1) Install

```bash
npm install
```

### 2) Environment

Create `.env.local` from `.env.example`.

Minimum key:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
```

Optional backend helper keys:

```env
BACKEND_PORT=3001
```

### 3) Run frontend

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

### 4) Run optional backend helper (second terminal)

```bash
npx tsx server.ts
```

Backend runs on `http://localhost:3001`.

### 5) Build and type-check

```bash
npm run lint
npm run build
```

### 6) Train custom key model (recommended for production reliability)

```bash
npm run ml:deps
npm run ml:train:key
```

If your local Python is not 3.11-compatible for TensorFlow conversion, use Docker:

```bash
npm run ml:train:key:docker
```

Dataset format:

```text
ml/datasets/
  key/
  not_key/
```

Full training guide: [`ml/README.md`](ml/README.md)

## API Usage Overview

### Gemini

Used for:

- initiation puzzle generation
- thematic AI content in ritual flow

Cost control:

- one puzzle per initiation attempt
- backup hardcoded puzzle when generation fails

### Vision

Used for:

- artefact verification in initiation

Paths:

- primary: in-browser TensorFlow.js model-assisted flow (`coco-ssd` + `mobilenet`)
- production path: custom trained TF model auto-loaded from `public/models/key_classifier/model.json`
- backend helper not required for vision verification

Fallback:

- retry path + alternative input path when verification fails

### Speech / Voice

Used as optional enhancement in admin flow where enabled.

Fallback:

- typed input is always available

### Maps / Location Reveal

Decode flows are designed with text-first fallback if map loading is unavailable.

### Storage

Current default: local storage mock service (`mockDB`) with seeded data for continuity.

## Team Module Ownership

| Module | Ownership | Scope |
|---|---|---|
| Entry / Alchemy Experience | Builder 1 | Landing, search reveal, unlock gating, transitions |
| Initiation System | Builder 2 | Artefact check, puzzle flow, pass/fail states |
| Admin Ritual Console | Builder 3 | Event creation, text-first + optional voice |
| Cipher + Storage + Reveal | Builder 4 | Deterministic encoding/decoding, persistence, reveal behavior |
| Integration + Demo Polish (optional) | Builder 5 / shared | QA, resilience, README, demo script |

## Demo Resilience / Backup Paths

1. **Predefined artefact target**
   - Demo with one stable recognizable object.
2. **Backup puzzle**
   - If Gemini fails, fallback puzzle is used.
3. **Typed admin fallback**
   - Voice is optional; text path remains primary.
4. **Location fallback**
   - If map/reveal service fails, show location in text.
5. **Seeded data**
   - Pre-seeded archive/event data ensures flow continuity.

## Current Scope Notes

In-scope behavior is focused on a complete ritual happy path and polished transitions. Out-of-scope platform features (full chat/forum systems, advanced cryptography, multiplayer orchestration, complex permissions engines) are intentionally constrained to keep demo reliability high.

## Project Structure

```text
src/
  components/
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
    InitiationPage.tsx
  services/
    audio.ts
    gemini.ts
    mockDB.ts
  types/
    index.ts
  App.tsx
  index.css
  main.tsx
server.ts
ml/
  Dockerfile
  README.md
  train_key_classifier.py
  train_key_classifier_docker.sh
README.md
```

## Scripts

```bash
npm run dev      # start Vite dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # TypeScript type-check (no emit)
npm run clean    # remove dist
```

## Git Workflow (Recommended)

- Keep `main` demo-stable.
- Use feature branches for major changes.
- Keep PRs small and demo-visible.
- Rehearse full happy path before merges.

## License

Hackathon/demo prototype. Add a formal license if this moves beyond event scope.
