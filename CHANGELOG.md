# CHANGELOG

## 0.3.0 — 2026-10-31 — HA Themes pack
- The plugin is now a **theme pack**, `ha-themes`, published at `badiyee85/HA-Themes`. Install by
  pulling `desktop/plugin.js` from a tagged release into `desktop-plugins/ha-themes/` (README).
- Added **Badi Dark (Desktop)** (`badi-dark-desktop`): the badi-dark CLI skin hand-tuned as a full
  Desktop theme (all 26 colours, no custom CSS). Its name differs from the skin's on purpose, because a
  skin shadows a theme of the same name.
- WinForms is unchanged from 0.2.0.
- `requires_hermes` lowered to `>=0.22.2`, the oldest release with every hook the themes use (checked).
- Tests: 20 (per-theme shape, colours, scope, class-name ban, hook drift, contrast, plus a privacy scan
  of all tracked files). Real-app tests cover both themes and install/remove through the documented disk
  delivery. `hermes plugins install` was tried: the package installs, but its Desktop half did not
  appear in the app on 0.22.5, so it is not the documented route.

## 0.2.0 — 2026-10-31 — WinForms as a Desktop theme
- Shipped as a theme-only Desktop plugin registering one `DesktopTheme` (`THEMES_AREA`), per the Desktop
  Plugin SDK docs. It is no longer a CLI skin.
- Colours and fonts moved into `DesktopTheme.colors` and `typography`. The CSS moved onto documented hooks
  only (`data-*`, `role`, `aria-label`), with every class-name selector removed.
  - The white strip under the title bar was dropped.
  - Selection became Explorer-style `#cce8ff`.

## 0.1.0 — 2026-10-30 — WinForms skin (superseded)
- First version as a CLI skin with `customCSS`. Never activated.
