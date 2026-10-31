#!/usr/bin/env python3
"""Conformance + contract tests for the HA Themes pack.

    ~/.hermes/hermes-agent/venv/bin/python tools/test_theme.py

Each test maps to a rule in the Hermes docs (developer-guide/desktop-plugin-sdk,
user-guide/features/skins, plugin catalog rules 6/8/9/14) or to a property the
themes must keep. HERMES_SRC points at the Hermes checkout whose Desktop the
themes are verified against (default ~/.hermes/hermes-agent).
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HERMES_SRC = Path(os.environ.get("HERMES_SRC", Path.home() / ".hermes" / "hermes-agent"))
DESKTOP_SRC = HERMES_SRC / "apps" / "desktop" / "src"

_spec = importlib.util.spec_from_file_location("ha_build", ROOT / "tools" / "build.py")
assert _spec and _spec.loader
build = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build)

# Never publish internal infrastructure, private paths, addresses or credentials.
# Site-specific names are kept OUTSIDE this repo: one regex per line in the file named by
# HA_THEMES_PRIVATE_NAMES (default ~/.hermes/git-hooks/private-names). Generic shapes are checked here.
def _site_patterns():
    import os as _os
    p = _os.path.expanduser(_os.environ.get("HA_THEMES_PRIVATE_NAMES", "~/.hermes/git-hooks/private-names"))
    try:
        with open(p, encoding="utf-8") as fh:
            return [ln.strip() for ln in fh if ln.strip() and not ln.startswith("#")]
    except OSError:
        return []


PRIVATE_PATTERNS = [
    r"\b100\.\d{1,3}\.\d{1,3}\.\d{1,3}\b", r"\.ts\.net\b", r"\bt_[0-9a-f]{8}\b", r"\bp_[0-9a-f]{8}\b",
    r"ghp_[A-Za-z0-9]{20,}", r"github_pat_", r"sk-[A-Za-z0-9]{20,}", r"BEGIN [A-Z ]*PRIVATE KEY",
] + _site_patterns()


def split_top(text: str, sep: str = ",") -> list[str]:
    """Split on `sep` outside parentheses, brackets and quotes."""
    parts, depth, quote, cur = [], 0, None, []
    for ch in text:
        if quote:
            quote = None if ch == quote else quote
        elif ch in "'\"":
            quote = ch
        elif ch in "([":
            depth += 1
        elif ch in ")]":
            depth -= 1
        elif ch == sep and depth == 0:
            parts.append("".join(cur).strip())
            cur = []
            continue
        cur.append(ch)
    parts.append("".join(cur).strip())
    return [p for p in parts if p]


def rules(css: str) -> list[tuple[str, str]]:
    return [(m.group(1).strip(), m.group(2)) for m in re.finditer(r"([^{}]+)\{([^{}]*)\}", css)]


def strip_strings(sel: str) -> str:
    return re.sub(r"'[^']*'|\"[^\"]*\"", "''", sel)


def luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    chans = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in chans]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


class ThemePack(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.plugin_js = (ROOT / "desktop" / "plugin.js").read_text(encoding="utf-8")
        cls.themes = build.all_themes()
        cls.by_name = {t["name"]: t for t in cls.themes}
        out = subprocess.run(["node", str(ROOT / "tools" / "load-plugin.mjs"), str(ROOT / "desktop" / "plugin.js")],
                             capture_output=True, text=True, timeout=60)
        assert out.returncode == 0, out.stderr[-2000:]
        cls.loaded = json.loads(out.stdout)

    def css_of(self, name: str) -> str:
        return self.by_name[name].get("customCSS", "")

    # --- delivery / build -------------------------------------------------
    def test_pack_contains_the_expected_themes(self):
        self.assertEqual(sorted(self.by_name), ["badi-dark-desktop", "winforms"])

    def test_built_plugin_is_up_to_date(self):
        self.assertEqual(self.plugin_js, build.render(self.themes), "desktop/plugin.js is stale: run tools/build.py")

    def test_plugin_id_matches_manifest_and_install_folder(self):
        # SDK docs: "The folder name must equal the plugin id."
        manifest = (ROOT / "plugin.yaml").read_text(encoding="utf-8")
        self.assertRegex(manifest, r"(?m)^name:\s*ha-themes\s*$")
        self.assertEqual(self.loaded["id"], "ha-themes")
        self.assertIn(f"v{build.version()}", self.plugin_js.splitlines()[0])

    def test_manifest_is_truthful(self):
        # catalog rule 14: SemVer floor, version matches the code; rule 6: capabilities match reality.
        manifest = (ROOT / "plugin.yaml").read_text(encoding="utf-8")
        self.assertRegex(build.version(), r"^\d+\.\d+\.\d+$")
        self.assertRegex(manifest, r'(?m)^requires_hermes:\s*">=\d+\.\d+\.\d+"')
        for key in ("provides_tools", "provides_hooks", "requires_env", "capabilities"):
            self.assertRegex(manifest, rf"(?m)^{key}:\s*\[\]\s*$")

    def test_floor_is_honest_for_this_hermes(self):
        """The manifest floor must admit the Hermes the hooks were checked against (HERMES_SRC)."""
        sys.path.insert(0, str(HERMES_SRC))
        from hermes_cli.plugins_manifest import version_satisfies
        floor = re.search(r'(?m)^requires_hermes:\s*"([^"]+)"', (ROOT / "plugin.yaml").read_text()).group(1)
        tags = subprocess.run(["git", "-C", str(HERMES_SRC), "describe", "--tags", "--abbrev=0", "--match", "v[0-9]*"],
                              capture_output=True, text=True).stdout.strip()
        if tags:
            self.assertTrue(version_satisfies(floor, tags), f"{floor} rejects {tags}")

    # --- SDK surface (docs: Pitfalls, Security model; catalog rule 8) -------
    def test_only_the_sdk_is_imported(self):
        self.assertEqual(self.loaded["imports"], ["@hermes/plugin-sdk"])
        self.assertFalse(self.loaded["dynamicImport"])

    def test_no_dom_access_or_dynamic_code(self):
        code = self.plugin_js.split("const THEMES =")[0] + self.plugin_js.split("export default")[1]
        for token in ("document", "window", "eval", "Function(", "<script", "MutationObserver",
                      "localStorage", "querySelector", "hermesDesktop", "prototype", "setInterval"):
            self.assertNotIn(token, code, token)

    def test_plugin_contract_fields_only(self):
        self.assertEqual(sorted(self.loaded["keys"]), ["id", "name", "register"])

    def test_registers_each_theme_once_in_the_themes_area(self):
        regs = self.loaded["registered"]
        self.assertEqual(sorted(r["data"]["name"] for r in regs), sorted(self.by_name))
        for r in regs:
            with self.subTest(r["id"]):
                self.assertEqual(r["area"], "themes")
                self.assertEqual(r["id"], r["data"]["name"])
                data = r["data"]  # apps/desktop/src/themes/types.ts isValidTheme
                self.assertIsInstance(data["label"], str)
                for key in ("background", "foreground", "primary"):
                    self.assertIsInstance(data["colors"][key], str)
                self.assertEqual(data.get("customCSS", ""), self.css_of(data["name"]))

    def test_theme_area_id_is_the_real_one(self):
        src = (DESKTOP_SRC / "themes" / "user-themes.ts").read_text(encoding="utf-8")
        self.assertIn("export const THEMES_AREA = 'themes'", src)

    # --- theme data --------------------------------------------------------
    def test_every_documented_color_key_is_set(self):
        types = (DESKTOP_SRC / "themes" / "types.ts").read_text(encoding="utf-8")
        block = types.split("export interface DesktopThemeColors {")[1].split("\n}")[0]
        keys = re.findall(r"^\s+(\w+)\??:\s*string", block, re.M)
        self.assertGreater(len(keys), 20)
        for t in self.themes:
            for key in keys:
                with self.subTest(theme=t["name"], key=key):
                    self.assertRegex(t["colors"].get(key, ""), r"^#[0-9a-f]{6}$")
            self.assertEqual(t["darkColors"], t["colors"])

    def test_names_do_not_collide_with_builtins_or_skins(self):
        presets = (DESKTOP_SRC / "themes" / "presets.ts").read_text(encoding="utf-8")
        builtin = set(re.findall(r"^\s+name: '([\w-]+)'", presets, re.M))
        self.assertIn("nous", builtin)
        sys.path.insert(0, str(HERMES_SRC))
        from hermes_cli import skin_engine
        user_skins = Path.home() / ".hermes" / "skins"
        skin_names = set(skin_engine._BUILTIN_SKINS)
        if user_skins.is_dir():
            skin_names |= {p.stem for p in user_skins.glob("*.yaml")}
        for name in self.by_name:
            with self.subTest(name):
                self.assertNotIn(name, builtin)
                # Desktop resolves a skin before a contributed theme of the same name.
                self.assertNotIn(name, skin_names, "a skin with the theme's name would shadow it")

    # --- CSS ---------------------------------------------------------------
    def test_every_selector_is_scoped_to_its_own_theme(self):
        for name in self.by_name:
            scope = f":root[data-hermes-theme='{name}']"
            bad = [p for s, _ in rules(self.css_of(name)) for p in split_top(s) if not p.startswith(scope)]
            with self.subTest(name):
                self.assertEqual(bad, [])

    def test_no_internal_class_names(self):
        # SDK docs: "internal class names are not a contract and change without notice".
        for name in self.by_name:
            bad = [s for s, _ in rules(self.css_of(name))
                   if re.search(r"(?<![\w-])\.[A-Za-z_]", strip_strings(s)) or "[class" in s]
            with self.subTest(name):
                self.assertEqual(bad, [])

    def test_self_contained(self):
        for name in self.by_name:
            css = self.css_of(name)
            with self.subTest(name):
                self.assertNotIn("@", css)
                self.assertNotRegex(css, r"url\(")
                self.assertLess(len(css.encode()), build.CSS_CAP)

    def test_minifier_keeps_every_rule(self):
        for d in build.theme_dirs():
            src_file = d / "theme.css"
            if src_file.is_file():
                src = re.sub(r"/\*.*?\*/", "", src_file.read_text(encoding="utf-8"), flags=re.S)
                with self.subTest(d.name):
                    self.assertEqual(len(rules(self.css_of(d.name))), src.count("{"))

    def test_every_hook_exists_in_the_target_desktop(self):
        """Hook drift guard: each data-*/aria value any theme's CSS targets must exist in the Desktop source."""
        corpus = "\n".join(p.read_text(encoding="utf-8", errors="ignore")
                           for p in DESKTOP_SRC.rglob("*.ts*") if ".test." not in p.name)
        en = "\n".join(p.read_text(encoding="utf-8") for p in (DESKTOP_SRC / "i18n").glob("en*.ts"))
        missing = []
        for name in self.by_name:
            css = self.css_of(name)
            for v in sorted(set(re.findall(r"\[data-slot='([\w-]+)'\]", css))):
                if f"'{v}'" not in corpus and f'"{v}"' not in corpus:
                    missing.append(f"{name}: data-slot={v}")
            for a in sorted(set(re.findall(r"\[(data-[\w-]+)", css)) - {"data-hermes-theme", "data-hermes-glass", "data-slot"}):
                if a not in corpus:
                    missing.append(f"{name}: {a}")
            for label in sorted(set(re.findall(r"\[aria-label='([^']+)'\]", css))):
                if label not in en and label not in corpus:
                    missing.append(f"{name}: aria-label={label}")
        self.assertEqual(missing, [])

    def test_palette_contrast(self):
        pairs = [("foreground", "background"), ("cardForeground", "card"), ("popoverForeground", "popover"),
                 ("primaryForeground", "primary"), ("secondaryForeground", "secondary"),
                 ("accentForeground", "accent"), ("mutedForeground", "background"),
                 ("destructiveForeground", "destructive"), ("midgroundForeground", "midground"),
                 ("foreground", "sidebarBackground"), ("foreground", "userBubble")]
        for t in self.themes:
            c = t["colors"]
            for fg, bg in pairs:
                with self.subTest(theme=t["name"], pair=f"{fg}/{bg}"):
                    self.assertGreaterEqual(contrast(c[fg], c[bg]), 4.5, f"{c[fg]} on {c[bg]}")

    def test_winforms_css_contrast(self):
        pairs = {
            "caption on title bar": ("#ffffff", "#4c4a48"),
            "inactive caption tab": ("#d0d0d0", "#4c4a48"),
            "active caption tab": ("#ffffff", "#605e5c"),
            "selected row": ("#000000", "#cce8ff"),
            "tooltip": ("#575757", "#ffffff"),
            "link": ("#0066cc", "#ffffff"),
        }
        for name, (fg, bg) in pairs.items():
            with self.subTest(name):
                self.assertGreaterEqual(contrast(fg, bg), 4.5, f"{name}: {fg} on {bg}")

    # --- publication -------------------------------------------------------
    def test_nothing_private_in_tracked_files(self):
        files = subprocess.run(["git", "-C", str(ROOT), "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
                               capture_output=True, text=True).stdout.split("\0")
        hits = []
        for rel in filter(None, files):
            p = ROOT / rel
            if not p.is_file() or p.suffix.lower() in {".png", ".jpg", ".gif"}:
                continue
            text = p.read_text(encoding="utf-8", errors="ignore")
            if rel == "tools/test_theme.py":  # holds the patterns themselves
                continue
            for pat in PRIVATE_PATTERNS:
                for m in re.finditer(pat, text):
                    hits.append(f"{rel}: {m.group(0)}")
        self.assertEqual(hits, [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
