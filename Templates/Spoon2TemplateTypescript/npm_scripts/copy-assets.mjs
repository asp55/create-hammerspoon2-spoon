// Copies every file in src/ into build/ (directory structure preserved) except the
// ones tsc handles: TypeScript sources (.ts/.tsx/.mts/.cts, including .d.ts) and
// macOS .DS_Store files.
import { cp, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const outDir = join(root, "build");
const TYPESCRIPT_FILE = /\.[cm]?tsx?$/i; // also matches .d.ts, .d.mts, .d.cts
const IGNORED_FILES = new Set([".DS_Store"]);

let copied = 0;
for (const entry of await readdir(srcDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || IGNORED_FILES.has(entry.name) || TYPESCRIPT_FILE.test(entry.name)) continue;
    const from = join(entry.parentPath, entry.name);
    const to = join(outDir, from.slice(srcDir.length));
    await mkdir(dirname(to), { recursive: true });
    await cp(from, to);
    copied++;
}
console.log(`copied ${copied} asset file(s) to build/`);
