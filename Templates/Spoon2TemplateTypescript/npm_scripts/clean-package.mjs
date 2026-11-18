// Empties build/ without removing the directory itself.
import { mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageDir = join(dirname(fileURLToPath(import.meta.url)), "..", "spoons");

await mkdir(packageDir, { recursive: true });
for (const entry of await readdir(packageDir)) {
    await rm(join(packageDir, entry), { recursive: true, force: true });
}
