import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";
const root = path.resolve("out");
const prefix =
  load(await readFile(path.join(root, "index.html"), "utf8"))("base").attr(
    "href",
  ) || "/";
const elements = JSON.parse(await readFile("public/elements.json", "utf8"));
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) await walk(file);
    else if (file.endsWith(".html")) files.push(file);
  }
}
await walk(root);
const missing = new Set();
let checked = 0;
for (const file of files) {
  const $ = load(await readFile(file, "utf8"));
  const base = new URL(
    $("base").attr("href") || prefix,
    "https://preview.invalid",
  );
  for (const node of $("a[href],link[href],script[src],img[src]").toArray()) {
    // Origin hints are not page/asset paths (Next emits a root preconnect for fonts).
    if (["preconnect", "dns-prefetch"].includes($(node).attr("rel"))) continue;
    const ref = $(node).attr("href") || $(node).attr("src");
    if (!ref || ref.startsWith("#")) continue;
    const url = new URL(ref, base);
    if (url.origin !== "https://preview.invalid") continue;
    assert.ok(
      url.pathname.startsWith(prefix),
      `Unprefixed asset/link ${ref} in ${file}`,
    );
    const target = path.join(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)),
    );
    try {
      const info = await stat(target);
      if (info.isDirectory()) await stat(path.join(target, "index.html"));
      checked++;
    } catch {
      missing.add(`${ref} (${path.relative(root, file)})`);
    }
  }
}
for (const element of elements) {
  const html = await readFile(
    path.join(root, element.name.toLowerCase(), "index.html"),
    "utf8",
  );
  assert.ok(load(html)("title").text().includes(element.name));
}
assert.equal(
  missing.size,
  0,
  `Missing static targets:\n${[...missing].join("\n")}`,
);
for (const page of ["faq", "roadmap", "feedback"]) {
  await stat(path.join(root, page, "index.html"));
}
console.log(
  `Static export verified: ${files.length} HTML files, all 118 element pages, contribution pages, ${checked} local asset/link references under ${prefix}.`,
);
