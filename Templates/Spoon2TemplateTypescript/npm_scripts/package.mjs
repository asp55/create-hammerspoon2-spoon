// Packages the built spoon:
//   1. empty package/ (the directory itself is kept)
//   2. create package/<name>.spoon2, where <name> comes from the built spoon.json
//   3. copy everything from build/ into it
// Run `npm run build` first (the `package` npm script does this for you).
import { cp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const buildDir = join(root, "build");
const packageDir = join(root, "spoons");

let name;
try {
    ({ name } = JSON.parse(await readFile(join(buildDir, "spoon.json"), "utf8")));
} catch {
    throw new Error("build/spoon.json not found - run `npm run build` first");
}
// Allowlist: the name becomes a directory name, so reject anything path-like.
if (typeof name !== "string" || !/^[A-Za-z0-9_-]+$/.test(name)) {
    throw new Error(`spoon.json: "name" must match [A-Za-z0-9_-]+ (got ${JSON.stringify(name)})`);
}

// 1. Empty package/ without removing the directory itself.
await mkdir(packageDir, { recursive: true });
for (const entry of await readdir(packageDir)) {
    await rm(join(packageDir, entry), { recursive: true, force: true });
}

// 2. Create the .spoon2 directory.
const spoonDir = join(packageDir, `${name}.spoon2`);
await mkdir(spoonDir);

// 3. Copy build/ into it.
await cp(buildDir, spoonDir, {
    recursive: true,
    filter: (src) => !src.endsWith(".DS_Store"),
});

console.log(`packaged build/ into package/${name}.spoon2`);
