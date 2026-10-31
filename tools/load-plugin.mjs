// Load desktop/plugin.js the way the Desktop loader would, but against a stub
// SDK, call register() and print what it registered as JSON.
// Usage: node tools/load-plugin.mjs desktop/plugin.js
import { readFileSync } from 'node:fs'

const src = readFileSync(process.argv[2], 'utf8')
const imports = [...src.matchAll(/^\s*import\s.*?from\s+['"]([^'"]+)['"]/gm)].map(m => m[1])
const dynamicImport = /\bimport\s*\(/.test(src)

// The stub exposes the real area id ('themes' in apps/desktop/src/themes/user-themes.ts).
const stubbed = src.replace(
  /^\s*import\s*\{\s*THEMES_AREA\s*\}\s*from\s*['"]@hermes\/plugin-sdk['"]\s*;?/m,
  "const THEMES_AREA = 'themes'\n"
)
const mod = await import('data:text/javascript;base64,' + Buffer.from(stubbed).toString('base64'))
const plugin = mod.default
const registered = []
const ctx = {
  source: `plugin:${plugin.id}`,
  register: c => {
    registered.push(c)
    return () => {}
  },
  registerMany: cs => {
    registered.push(...cs)
    return () => {}
  },
  onDispose: () => {}
}
plugin.register(ctx)
process.stdout.write(
  JSON.stringify({ id: plugin.id, name: plugin.name, keys: Object.keys(plugin), imports, dynamicImport, registered })
)
