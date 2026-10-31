# CONTEXT.md — glossary

| Term | Meaning here |
|---|---|
| **Theme** | A Hermes Desktop `DesktopTheme` (name, label, colours, typography, optional `customCSS`) listed in Settings → Appearance. |
| **Theme pack** | This plugin, `ha-themes`: one Desktop plugin that registers several themes through the SDK's `THEMES_AREA`. |
| **Skin** | A Hermes CLI/TUI theme file in `~/.hermes/skins/`. A skin with the same name as a theme shadows the theme on Desktop, so theme names here never match a skin. |
| **customCSS** | A theme's own CSS. The app injects it as `<style id="hermes-desktop-custom-css">` only while that theme is active. |
| **Scope** | `:root[data-hermes-theme='<name>']`. Every rule in a theme's CSS starts with it. |
| **Hook** | A `data-*`, `role` or `aria-label` attribute a theme's CSS targets. Never an internal class name (the docs say those are not a contract). |
| **Hook drift** | A Hermes release renaming a hook. Caught by `test_every_hook_exists_in_the_target_desktop` run against that build. |
| **Face** | (WinForms) Windows control-face grey `#f0f0f0`. |
| **Pane** | (WinForms) A white list / transcript / edit area with a 1px `#828790` edge. |
| **Sunken** | (WinForms) The Windows 3D inset edge: dark top-left, white bottom-right. |
| **Title bar** | (WinForms) Every pane header touching the window top, painted `#4c4a48` with white captions. |
| **Reference** | `reference/winforms-target.png`, the Windows screenshot WinForms is matched against. |
| **Desktop machine** | A computer where the Hermes Desktop app runs. The pack is installed there. |
| **Run** | One `tools/shoot.sh` execution, `shots/run-<label>/` (git-ignored). Curated evidence goes to `docs/shots/`. |
