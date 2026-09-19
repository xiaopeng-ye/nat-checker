// Propagate the root package.json version to every workspace package so the
// whole monorepo shares one version number. Run automatically by the root
// `version` lifecycle hook (`pnpm version <bump>`), or manually via
// `pnpm sync-version`.
import { readFileSync, writeFileSync } from "node:fs"
import { globSync } from "node:fs"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const { version } = JSON.parse(readFileSync(resolve(root, "package.json")))

const manifests = globSync(["apps/*/package.json", "packages/*/package.json"], {
  cwd: root,
})

for (const rel of manifests) {
  const file = resolve(root, rel)
  const raw = readFileSync(file, "utf8")
  const pkg = JSON.parse(raw)
  if (pkg.version === version) continue
  pkg.version = version
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n")
  console.log(`${pkg.name}: ${version}`)
}
