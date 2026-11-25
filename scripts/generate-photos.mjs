// Scans public/images and writes src/generated/photos.json (list of file names, natural sort).
import { readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = join(root, 'public', 'images')
const outFile = join(root, 'src', 'generated', 'photos.json')
const OK = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

const all = existsSync(imagesDir) ? readdirSync(imagesDir) : []
const photos = all
  .filter((f) => OK.has(extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
const skipped = all.filter((f) => !f.startsWith('.') && !OK.has(extname(f).toLowerCase()))

mkdirSync(dirname(outFile), { recursive: true })
writeFileSync(outFile, JSON.stringify(photos, null, 2) + '\n')
console.log(`[photos] ${photos.length} photo(s) found in public/images`)
if (skipped.length) console.warn(`[photos] skipped unsupported file(s): ${skipped.join(', ')} (convert .heic to .jpg)`)
