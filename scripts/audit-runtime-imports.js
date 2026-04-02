import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targetDirectories = ['src', 'api']
const allowedPackageSubpaths = new Set(['viem/accounts', 'multiformats/cid'])

const runtimeImportPattern =
  /\bfrom\s+['"]([^'"\n]+)['"]|\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g

/**
 * Resolves the base package name from an import specifier.
 * @param specifier - Full module specifier.
 * @returns Base package name for allowlist checks.
 */
function getPackageName(specifier) {
  if (specifier.startsWith('@')) {
    const [scope, name] = specifier.split('/')
    return `${scope}/${name}`
  }

  const [name] = specifier.split('/')
  return name
}

/**
 * Recursively collects TypeScript files for import auditing.
 * @param directoryPath - Directory path to traverse.
 * @param output - Aggregated TypeScript file list.
 */
function walk(directoryPath, output) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) {
      continue
    }

    const filePath = path.join(directoryPath, entry.name)

    if (entry.isDirectory()) {
      walk(filePath, output)
      continue
    }

    if (!entry.name.endsWith('.ts')) {
      continue
    }

    output.push(filePath)
  }
}

const tsFiles = []
for (const directory of targetDirectories) {
  const absolutePath = path.join(root, directory)
  if (fs.existsSync(absolutePath)) {
    walk(absolutePath, tsFiles)
  }
}

const issues = []

for (const filePath of tsFiles) {
  const relativePath = path.relative(root, filePath)
  const content = fs.readFileSync(filePath, 'utf8')

  for (const match of content.matchAll(runtimeImportPattern)) {
    const specifier = match[1] ?? match[2]
    if (!specifier) {
      continue
    }

    if (specifier.startsWith('node:')) {
      continue
    }

    if (specifier.startsWith('.')) {
      if (!specifier.endsWith('.js') && !specifier.endsWith('.json')) {
        issues.push(
          `${relativePath}: relative import must use explicit extension (.js/.json): ${specifier}`,
        )
      }
      continue
    }

    const packageName = getPackageName(specifier)
    if (specifier !== packageName && !allowedPackageSubpaths.has(specifier)) {
      issues.push(
        `${relativePath}: package subpath import is not allowlisted: ${specifier}`,
      )
    }
  }
}

if (issues.length > 0) {
  console.error('Runtime import audit failed:')
  for (const issue of issues) {
    console.error(`- ${issue}`)
  }
  process.exit(1)
}

console.log(
  `Runtime import audit passed (${tsFiles.length.toString()} files checked).`,
)
