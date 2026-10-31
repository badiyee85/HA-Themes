# SECURITY.md

## Permissions / surfaces touched

| Surface | Access | Notes |
|---|---|---|
| `<HERMES_HOME>/desktop-plugins/ha-themes/plugin.js` | written by the README install lines | One file from a tagged release. No secrets. |
| Hermes Desktop renderer | registers themes via `@hermes/plugin-sdk` | No DOM access, no `<style>` of its own, no storage, no gateway calls, no native bridge. The app applies a theme's CSS only while that theme is selected. |
| Agent / gateway | none | `__init__.py` is inert: no tools, hooks, commands or settings (`hermes plugins validate`: declared = registered = nothing). |
| `config.yaml` | none | The pack never writes config. Selecting a theme is the user's own Appearance choice. |
| Network | none at runtime | No `@import`, `@font-face` or `url()` in any CSS, and no fetches in the JS (tested). Installing downloads one file from GitHub. |

## Threats considered
- **Plugin authority.** A Desktop plugin runs with the app's full authority (Hermes SDK docs: Security
  model). This one is data plus a single `ctx.registerMany` call. The tests reject:
  - `document`, `window`, `eval`, `Function(` and `<script`;
  - `MutationObserver`, `localStorage`, `querySelector` and `hermesDesktop`;
  - prototype patching;
  - any import other than `@hermes/plugin-sdk`.
  `hermes plugins validate` runs the same security scan and desktop-surface lint as the plugin catalog.
- **Rules leaking into other themes.** Every selector is scoped to its theme. The real-app test switches
  away and confirms 0 bytes of theme CSS remain.
- **Hiding safety UI.** WinForms restyles but never hides a control (the only `display:none` is the
  tooltip's decorative arrow). Approval and dialog frames stay visible and bordered.
- **Unreadable text.** Contrast tests cover every palette text/background pair and WinForms' own CSS pairs (≥ 4.5:1).
- **A bad update.** Deleting the `ha-themes` folder restores the default theme. The real-app test proves
  the app starts cleanly with no leftover CSS.
- **Leaking private information through a public repo.** A test scans every tracked file for internal
  host names, addresses, paths and credential shapes before publishing.

## Not protected
- Installs pull a **tagged** file from this public repo. It is not catalog-reviewed; only tested commits
  are pushed to `main` and tagged.
- `aria-label` hooks (`Window controls`, `App controls`) are English UI strings. In another UI language
  WinForms' title-bar icons keep the app's default colour.
