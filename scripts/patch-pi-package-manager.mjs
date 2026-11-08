/**
 * 将 Pi SDK package-manager 中的 fs.globSync 改为 glob.sync（兼容 Electron Node 20）。
 * 在 postinstall 执行，可重复运行（幂等）。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const MARKER = '/* sportdesk-fs-glob-polyfill */'
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'node_modules/@earendil-works/pi-coding-agent/dist/core/package-manager.js')

let source
try {
  source = readFileSync(target, 'utf-8')
} catch {
  console.warn('[sportdesk] skip Pi patch: package-manager.js not found')
  process.exit(0)
}

if (source.includes(MARKER)) {
  process.exit(0)
}

const fsImportNeedle =
  'import { chmodSync, existsSync, globSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, } from "node:fs";'
const fsImportPatched =
  'import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, } from "node:fs";'

if (!source.includes(fsImportNeedle)) {
  console.warn('[sportdesk] skip Pi patch: unexpected package-manager.js import shape')
  process.exit(0)
}

const globImport = 'import glob from "glob";\n'
const globShim = `${MARKER}\nconst globSync = (pattern, options) => glob.sync(pattern, options ?? {});\n`

source = source.replace(fsImportNeedle, fsImportPatched)
source = source.replace(
  'import { homedir } from "node:os";',
  `${globImport}${globShim}import { homedir } from "node:os";`
)

writeFileSync(target, source, 'utf-8')
console.log('[sportdesk] patched pi-coding-agent package-manager.js for Electron fs.globSync')
