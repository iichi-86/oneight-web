import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";

// Astro may inline small modules. Authorize only the actual built scripts,
// including JSON-LD, instead of allowing arbitrary inline JavaScript.
const hashes = new Set();
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith(".html")) {
      const html = await readFile(path, "utf8");
      for (const match of html.matchAll(
        /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      )) {
        if (!/\bsrc\s*=/.test(match[1]) && match[2].trim()) {
          hashes.add(
            `'sha256-${createHash("sha256").update(match[2]).digest("base64")}'`,
          );
        }
      }
    }
  }
}
await walk("dist");
const template = await readFile("public/_headers", "utf8");
const policy = template.replace(
  "script-src 'self'",
  `script-src 'self' ${[...hashes].join(" ")}`,
);
await writeFile("dist/_headers", policy);
console.log(`Generated CSP for ${hashes.size} inline script variants.`);
