import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(root, "bundle-parts");
const parts = fs.readdirSync(partsDir).filter((name) => name.endsWith(".b64")).sort();
if (parts.length === 0) throw new Error("No bundle parts found");
const encoded = parts.map((name) => fs.readFileSync(path.join(partsDir, name), "utf8")).join("");
const output = gunzipSync(Buffer.from(encoded, "base64"));
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist", "index.js"), output);
console.log(`Assembled dist/index.js from ${parts.length} compressed parts (${output.length} bytes).`);
