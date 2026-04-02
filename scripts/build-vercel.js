import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const distDirectory = path.join(root, 'dist')
const sourceHtmlPath = path.join(root, 'index.html')
const outputHtmlPath = path.join(distDirectory, 'index.html')

if (!fs.existsSync(sourceHtmlPath)) {
  throw new Error('Missing index.html in repository root.')
}

fs.rmSync(distDirectory, { recursive: true, force: true })
fs.mkdirSync(distDirectory, { recursive: true })
fs.copyFileSync(sourceHtmlPath, outputHtmlPath)
