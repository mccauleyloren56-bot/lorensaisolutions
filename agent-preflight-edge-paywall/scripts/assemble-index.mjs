import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(projectRoot, "src", "index.parts");
const outputPath = path.join(projectRoot, "src", "index.generated.ts");
const shaOutputPath = path.join(projectRoot, ".source-sha256");

const files = (await readdir(partsDir))
  .filter((name) => name.endsWith(".ts.part"))
  .sort();

if (files.length !== 8) {
  throw new Error(`Expected 8 source parts, found ${files.length}`);
}

const source = (await Promise.all(files.map((name) => readFile(path.join(partsDir, name), "utf8")))).join("");
const actualSha256 = createHash("sha256").update(source).digest("hex");

await writeFile(outputPath, source, "utf8");
await writeFile(shaOutputPath, `${actualSha256}  src/index.generated.ts\n`, "utf8");
console.log(`Assembled ${files.length} parts -> src/index.generated.ts (${actualSha256})`);
