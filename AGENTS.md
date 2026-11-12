# Repository Guidelines

## Project Structure

This repository contains a single-page wheel (鋁圈) configurator. Everything lives in `index.html`: inline CSS, inline JavaScript, and a canvas renderer that draws the wheel preview to scale (tire diameter fixed at about 650 mm; bolt circle, center bore, and barrel width derived from PCD, CB, and J). The only external resource is Google Fonts. It is published with GitHub Pages from the root of `main`.

It is also a PWA: `manifest.webmanifest` (relative `start_url`/`scope` so it works under the `/wheel-configurator/` Pages path), `sw.js` (network-first for the page, cache-first for same-origin assets, cached Google Fonts), and icons in `icons/`. Bump `VERSION` in `sw.js` whenever `index.html` or an icon changes so old caches are cleared.

The repository previously held a repair-reporting demo (Supabase-backed). That code was removed; it remains available in Git history.

## Development

No build step, dependencies, or test framework. Preview locally with `python3 -m http.server 8000` and open http://localhost:8000/. Service workers need `localhost` or HTTPS; test offline mode from `localhost`. Check both light and dark color schemes and a phone-width viewport (about 390 px) with no horizontal scrolling.

## Conventions

- Keep Traditional Chinese labels. Option values: sizes 17–20 inch; J 7–12 in 0.5 steps; PCD 5H110, 5H112, 5H114.3, 5H120, 5H130; ET 0–50; CB 50.0–120.0 mm.
- Spec code format: `{size}x{J}J {PCD} ET{ET} CB{CB}`, for example `18x8.5J 5H114.3 ET35 CB73.1`.
- Positive ET moves the mounting face toward the outer face, so the wheel sits further inward.
- Define colors as CSS custom properties with light and dark values; avoid literal colors in component rules.
- Do not add third-party product photos or brand logos without a license. The app icons in `icons/` are cropped from an INCURVE wheel photo that the repository owner supplied and confirmed they are licensed to use.

## Commits

Use concise imperative subjects. Pull requests should describe the change and include screenshots for visible changes.
