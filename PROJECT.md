# PROJECT.md — HA Themes

## What ships (v0.3.0)
One Hermes plugin package, `ha-themes`: `plugin.yaml`, an inert `__init__.py`, and `desktop/plugin.js`, which
registers each theme in `themes/` through `THEMES_AREA`. Install by placing a tagged `desktop/plugin.js` at
`<HERMES_HOME>/desktop-plugins/ha-themes/plugin.js` (README).

| Theme | CSS | Notes |
|---|---|---|
| `winforms` — WinForms | 15.5 KB scoped `customCSS` | charcoal title bar `#4c4a48`; face `#f0f0f0`; sunken white transcript and composer; Windows push buttons; `#cce8ff` selection; square corners, no shadows or blur; Segoe UI / Consolas, 12 px chat text; status bar with `#d7d7d7` rule |
| `badi-dark-desktop` — Badi Dark (Desktop) | none | palette only: bg `#0f1419`, text `#c9d4e3`, accent `#5b9dff`, sidebar `#0b0f14`, border `#232d3a` |

## Contracts (tested)
`tools/test_theme.py` covers:
- **Build and package.** The pack contents and built file are current; id, folder and manifest agree; the
  manifest is truthful (SemVer, floor, nothing declared); the floor admits the checked build.
- **SDK surface.** SDK-only import; no DOM or dynamic code; plugin contract fields only; each theme is
  registered once in `THEMES_AREA` and passes the app's theme shape check; the area id is the real one.
- **Theme data.** All `DesktopThemeColors` keys are set; no name collides with a Desktop built-in, a CLI
  built-in skin or a user skin.
- **CSS.** Each theme's CSS is scoped to its own name; no class selectors; self-contained; the minifier
  keeps every rule; every hook exists in the target Desktop source.
- **Contrast.** Palette and WinForms CSS pairs ≥ 4.5:1.
- **Privacy.** No private strings in tracked files.

`hermes plugins validate .` passes. Upstream `main` adds one reviewer warning, because WinForms' CSS
names app markup hooks; that is expected for a restyling theme (see `CONFORMANCE.md`).

`tools/shoot.spec.ts` runs 2 real-app tests. Each installs the built file the README way into an isolated
Desktop: built app, real `hermes serve`, throwaway HOME, fake LLM, Xvfb.
1. The theme is not active until picked. `/skin winforms` gives painted checks plus 0 rounded elements on
   the empty and chat screens, and square, borderless-shadow popups. `/skin badi-dark-desktop` gives a
   dark body with 0 bytes of CSS.
2. The pick survives a relaunch; `/skin nous` leaves 0 bytes; deleting the folder plus a relaunch starts
   cleanly with 0 bytes.

## Known gaps
- WinForms has no File/View/Help menu or "Connected" wording. A theme restyles existing UI; adding
  controls would need markup-rewriting code, which the plugin rules forbid.
- WinForms has no white menu strip, because no class-free hook exists for it.
- Layout (sidebar width, composer position) stays Hermes'.
- Hooks can drift with Hermes releases. Re-run the tests with `HERMES_SRC=<new build>` after updating.
