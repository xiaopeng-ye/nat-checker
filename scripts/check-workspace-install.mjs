#!/usr/bin/env node
/**
 * Verifies that every workspace package with dependencies has its node_modules
 * tree installed.
 *
 * `pnpm install --frozen-lockfile` exits 0 when a workspace package manifest is
 * missing from the tree it is given (for example when the Dockerfile deps stage
 * COPY list is out of date), it just installs nothing for that package. The
 * mistake then only shows up later as a confusing module-resolution error.
 *
 * Packages without dependencies are skipped: pnpm does not create a node_modules
 * directory for them.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const WORKSPACE_ROOTS = ["apps", "packages"]
const DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
]

const missing = []

for (const root of WORKSPACE_ROOTS) {
  if (!existsSync(root)) continue

  for (const name of readdirSync(root)) {
    const dir = join(root, name)
    const manifestPath = join(dir, "package.json")
    if (!existsSync(manifestPath)) continue

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
    const hasDependencies = DEPENDENCY_FIELDS.some(
      (field) => Object.keys(manifest[field] ?? {}).length > 0
    )

    if (hasDependencies && !existsSync(join(dir, "node_modules"))) {
      missing.push(dir)
    }
  }
}

if (missing.length > 0) {
  console.error(
    `No dependencies installed for: ${missing.join(", ")}\n` +
      "Add their package.json to the deps stage and their node_modules copy to " +
      "the builder stage of the Dockerfile."
  )
  process.exitCode = 1
} else {
  console.log("Workspace dependencies are installed.")
}
