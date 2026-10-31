# CONFORMANCE.md — HA Themes vs the Nous Hermes documentation

Checked 2026-10-31 against the **live** docs at hermes-agent.nousresearch.com:
- Desktop Plugin SDK (Themes, Two delivery modes, Pitfalls, Security model)
- Skins & Themes
- Plugin catalog (trust model, submission rules)

These Hermes builds were used:
- release **v0.22.2**, the floor: static and hook checks;
- **v0.22.5** (`bf0203a794a0`, `94454059c81`): static checks plus real-app tests;
- upstream **`main` @ `6bb377a51d5`** (2026-10-30): static checks plus `hermes plugins validate`.

Re-run the checks after every Hermes release.

| # | Documented rule (source) | How the pack meets it | Evidence |
|---|---|---|---|
| 1 | A Desktop theme is a plugin contribution: `ctx.register({ area: THEMES_AREA, data: DesktopTheme })` (SDK → Themes) | `desktop/plugin.js` registers each theme in `themes/` once, in `THEMES_AREA`, and nothing else | `test_registers_each_theme_once_in_the_themes_area`, `test_theme_area_id_is_the_real_one` |
| 2 | "Registering a theme lists it; it does not select it." (SDK → Themes) | The plugin never calls `setTheme`/`requestTheme`; the user picks a theme in Settings → Appearance, ⌘K or `/skin <name>` | real-app test: no pack theme is active after install; one becomes active only after `/skin <name>` |
| 3 | Delivery: "Disk (recommended)": `$HERMES_HOME/desktop-plugins/<id>/plugin.js`; folder name = plugin id; Desktop plugins are app-level, one root for every profile and remote (SDK → Two delivery modes, Quick start) | id `ha-themes` everywhere; the README installs `desktop/plugin.js` from a tagged release into `desktop-plugins/ha-themes/`; removal = delete the folder | `test_plugin_id_matches_manifest_and_install_folder`; the real-app test installs and removes exactly that way |
| 4 | Only `@hermes/plugin-sdk`, `react`, `react/jsx-runtime` may be imported (SDK → Pitfalls; catalog rule 8) | Imports `THEMES_AREA` from `@hermes/plugin-sdk` only; no dynamic `import()` | `test_only_the_sdk_is_imported`; `hermes plugins validate`: *desktop surface ✓* |
| 5 | No `eval`, no script injection, no reaching into app markup or stores from JS, no prototype patching (catalog rule 8; SDK → Security model) | The JS is data plus one `registerMany` call. It uses no `document`, `window`, `querySelector`, `MutationObserver`, `localStorage` or native bridge | `test_no_dom_access_or_dynamic_code`; validator: *desktop surface ✓*, *security scan: safe* |
| 6 | A `<style>` you append yourself survives disable and hot-reload; wire cleanup through the host (SDK → Pitfalls) | No `<style>` of its own. CSS rides in `DesktopTheme.customCSS`, which the app injects only while that theme is active | real-app test: switching away leaves 0 bytes of theme CSS, and so does remove + relaunch |
| 7 | Theme CSS targets documented hooks (`data-slot`, `data-chat-surface`, the `[data-hermes-theme="…"]` scope). "Internal class names are not a contract" (SDK → Styling the chat switch) | Every selector starts with `:root[data-hermes-theme='<theme>']`. Hooks are `data-*`, `role` and `aria-label` attributes only; there are **zero** class selectors | `test_every_selector_is_scoped_to_its_own_theme`, `test_no_internal_class_names`, `test_every_hook_exists_in_the_target_desktop` (passes on v0.22.2, v0.22.5 and `main`) |
| 8 | `DesktopTheme` shape: name, label, `colors` (+ optional `darkColors`, `typography`, `customCSS`) (SDK exports) | Every theme sets all documented colour keys as hex. `darkColors` = `colors` (single-mode looks); WinForms sets fonts via `typography` | `test_every_documented_color_key_is_set` |
| 9 | Built-in theme names are reserved, and a skin with the same name resolves before a contributed theme (Skins → On the Desktop app) | No theme name equals a Desktop built-in, a CLI built-in skin or an installed user skin. Badi Dark is named `badi-dark-desktop` because a `badi-dark` skin exists | `test_names_do_not_collide_with_builtins_or_skins` |
| 10 | Manifest is truthful: SemVer `version`, `requires_hermes` floor, declared capabilities match reality (catalog rules 6, 14) | `version: "0.3.0"`; `requires_hermes: ">=0.22.2"` (the oldest release with every hook, checked); no tools, hooks, env or capabilities | `test_manifest_is_truthful`, `test_floor_is_honest_for_this_hermes`; validator checks manifest, requires_hermes and declared tools/hooks/middleware |
| 11 | The Agent loader imports every plugin directory, so a Desktop-only package ships an inert entrypoint (catalog precedents: theme-only packs) | `__init__.py` with a no-op `register` | validator: *loadable ✓*, *capability probe ✓* |
| 12 | No runtime overrides of Hermes core (catalog rule 9) | The package has no Python behaviour | validator: *no core override ✓* |
| 13 | Self-contained; no network (SDK → Security model) | No `@import`, `@font-face` or `url()`; no fetches. Segoe UI is used where it is installed | `test_self_contained` |

## Reviewer warning (expected, disclosed)
On upstream `main`, `hermes plugins validate` adds one **warning**, not a failure:
*"desktop surface review (catalog rule 8): app markup selector"*.
- It refers to WinForms' CSS naming `data-slot` hooks.
- The SDK docs document exactly this pattern for themes, and listed catalog themes carry the same
  disclosure ("its stylesheet restyles native Desktop surfaces").
- It is a prompt for a human reviewer, and it would matter only for a catalog submission.

## Not applicable / deliberately not done
- **Catalog listing** (rules 2–5): the pack installs from this public repo as a custom git source, not
  from the catalog. If it were ever submitted, rule 15 needs WinForms' disclosure "unofficial, not
  affiliated with Microsoft" (already in `plugin.yaml` and the README).
- **CLI/TUI skins**: not shipped. A skin with a theme's name would shadow the theme, and a skin with
  another name would repaint Desktop with a flat conversion whenever it became active.
- **New UI controls** (e.g. WinForms' File/View/Help menu): a theme restyles; adding controls would need
  code that rewrites app markup, which rule 8 forbids.
