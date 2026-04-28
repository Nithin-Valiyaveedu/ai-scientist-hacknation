# LabProcure — Product Demo Video

30-second product demo built with [Remotion](https://remotion.dev).

## Scenes

| # | Scene | Duration | Notes |
|---|-------|----------|-------|
| 0 | Hook / Title | 3s | Flask logo + headline fades in |
| 1 | Input | 4s | Hypothesis typewriter + Analyse click |
| 2 | Literature QC | 5s | 3-column: papers · novelty badge · lit chat |
| 3 | Generating Plan | 2s | Rotating flask + progress bar 20→87% |
| 4 | Protocol & Budget | 6s | Sidebar steps + animated donut chart + line items |
| 5 | Materials | 6s | SKU cards + Compare button + Email Quote click |
| 6 | Voice Agent | 4s | Full-screen mic + waveform + Q&A typewriter |

**Total:** ~30 seconds · 1920×1080 · 30fps · slide-left transitions

## Quick start

```bash
npm install
npm run studio   # open Remotion Studio to preview
npm run render   # render to out/labprocure-demo.mp4
```

## Design tokens

Colour palette, fonts, and layout all match the app's `tailwind.config.js` and `index.css`:
- Background: `#F2EDE3` / `#FAFAF8`
- Text: `#111110` / `#4A4A44` / `#9A9A94`
- Success green: `#2D7A3A`
- Font: Inter (sans) + JetBrains Mono (mono)

## Customising

- Edit content in `src/shared.jsx` (`HYPOTHESIS`, colours)
- Adjust scene durations in `src/LabProcureDemo.jsx` (`SCENE_DURATIONS`)
- Swap slide direction in `LabProcureDemo.jsx` → `slide({ direction: '...' })`
