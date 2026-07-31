import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(projectRoot, "src", "index.parts");
const outputPath = path.join(projectRoot, "src", "index.generated.ts");
const expectedSha256 = "cc387151df0286c7c6be08df9aeccc8413728080b268e68fd54009b534a61fa1";

const files = (await readdir(partsDir))
  .filter((name) => name.endsWith(".ts.part"))
  .sort();

if (files.length !== 8) {
  throw new Error(`Expected 8 source parts, found ${files.length}`);
}

const source = (await Promise.all(files.map((name) => readFile(path.join(partsDir, name), "utf8")))).join("");
const actualSha256 = createHash("sha256").update(source).digest("hex");

if (actualSha256 !== expectedSha256) {
  throw new Error(`Worker source hash mismatch: ${actualSha256}`);
}

await writeFile(outputPath, source, "utf8");
console.log(`Assembled ${files.length} parts -> src/index.generated.ts (${actualSha256})`);
