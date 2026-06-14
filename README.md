# Crochet Pattern Generator

Turn any image into a **single-crochet tapestry pattern**: a color chart, written
row-by-row instructions, a real-yarn shopping list, and a yardage estimate. It
runs entirely in your browser — your images never leave your device, and it works
offline as an installable PWA.

This is a standalone app. It does not depend on the surrounding Mithril Matrix
platform and can be lifted into its own repo unchanged.

## Why it looks right (and most quick tools don't)

The engine is classic, deterministic image processing — not generative AI — so
results are predictable and instant. Two details matter most:

1. **Stitch aspect ratio.** Crochet stitches aren't square. We size the grid from
   your **gauge** (stitches/inch vs rows/inch), so the finished piece matches the
   photo's proportions instead of coming out squashed.
2. **Perceptual color.** Color reduction and yarn matching run in **CIEDE2000**
   (Lab) perceptual distance, not RGB — so the colors it picks actually look right.

Plus a **confetti reducer** that dissolves orphan single stitches, because nobody
wants to change colors for one stitch.

## Pipeline

`image → gauge sizing → area-average downscale → quantize (Wu/NeuQuant, CIEDE2000)
→ optional Floyd–Steinberg dither → confetti cleanup → finalize palette → yarn
match → chart + written instructions + yardage estimate`

All stages live in `src/core/` as pure, framework-free TypeScript (fully unit
tested); React is only the UI shell.

## Develop

```bash
cd crochet-app
npm install
npm run dev        # http://localhost:5173
npm test           # run the core pipeline unit tests
npm run build      # production build (PWA)
npm run typecheck
```

### Try it
Upload one of the images in `samples/` (a gradient `sunset.svg` for color
reduction, a high-contrast `emblem.svg` for clean logos), then tune width, color
count, and confetti level, pick a yarn line, and export PNG / Text / PDF.

## Layout

```
src/core/        pure pipeline (image, grid/gauge, color, yarn, output, pipeline)
src/state/       Zustand store + IndexedDB project persistence
src/ui/          React components, chart renderer, exporters
src/data/yarns/  seed yarn color cards (approximate; see note below)
tests/           Vitest unit tests
```

## Known limitations / roadmap

- **First technique only:** tapestry / single crochet. The grid model is built to
  add C2C graphgan, cross-stitch, and mosaic later.
- **Yarn colors are approximate** screen renderings of published color cards; real
  yarn varies under light. Yardage includes a ~10% allowance and is an estimate —
  swatch before buying.
- Heavy images quantize on the main thread (~0.5–1s); moving quantization to a Web
  Worker and code-splitting the PDF export are the obvious next performance steps.
