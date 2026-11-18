// Empties build/ without removing the directory itself.
import { mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const buildDir = join(dirname(fileURLToPath(import.meta.url)), "..", "build");

await mkdir(buildDir, { recursive: true });
for (const entry of await readdir(buildDir)) {
    await rm(join(buildDir, entry), { recursive: true, force: true });
}
