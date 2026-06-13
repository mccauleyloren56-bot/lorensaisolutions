# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains a single static HTML tool — **After-Hours Revenue Leak Calculator** — for Loren's AI Solutions (lorensaisolutions.com). It is a self-contained, no-build-step page targeted at HVAC and home service business owners.

## Development

No build, compile, or install step required. Open `calculator.html` directly in a browser or serve it with any static file server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/calculator.html
```

## Architecture

Everything lives in `calculator.html` — HTML structure, CSS, and JavaScript are all inline in a single file.

**CSS** uses custom properties defined on `:root`:
- `--gold: #C9A84C` — primary brand accent
- `--gold-dim: #C9A84C33` — translucent gold for borders
- `--dark: #0D0D0D` — page background

**JavaScript** (bottom of `<body>`) has three parts:
1. **Slider↔input sync** — `pairs` array wires each `<input type="number">` bidirectionally to its matching `<input type="range">`.
2. **`calculate()`** — reads the three inputs (missed calls/week, job value, weeks/year), computes four output figures, injects them into the results section, and selects one of four verdict strings based on annual loss tier (<$10K / $10K–$50K / $50K–$150K / >$150K).
3. **`resetCalc()`** — clears inputs and hides results.

**Results section** (`#results`) is hidden by default (`display:none`) and toggled visible via the `.visible` class.

## Key Details

- CTA button links to `https://calendly.com/lorensaisolutions/30min` — update if the booking link changes.
- `formatMoney()` abbreviates large numbers to `$XK` / `$X.XM` format.
- The verdict copy mentions specific pricing (`$147/month`, `$147–$297/month`) — keep these in sync with actual service pricing.
- Google Fonts (`Cormorant Garamond` + `Inter`) are loaded from CDN; no local font files.
