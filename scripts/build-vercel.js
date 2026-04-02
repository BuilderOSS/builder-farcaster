import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const distDirectory = path.join(root, 'dist')
const vercelDistDirectory = path.join(distDirectory, 'vercel')
const sourceHtmlPath = path.join(root, 'index.html')
const outputHtmlPath = path.join(vercelDistDirectory, 'index.html')

if (!fs.existsSync(sourceHtmlPath)) {
  throw new Error('Missing index.html in repository root.')
}

fs.mkdirSync(vercelDistDirectory, { recursive: true })
fs.copyFileSync(sourceHtmlPath, outputHtmlPath)
