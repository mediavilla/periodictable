import http from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { load } from "cheerio";
import path from "node:path";
const root = path.resolve("out");
const port = Number(process.env.PORT || 3019);
const prefix = (
  load(await readFile(path.join(root, "index.html"), "utf8"))("base").attr(
    "href",
  ) || "/"
).replace(/\/$/, "");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (prefix && (pathname === "/" || pathname === prefix)) {
        res.writeHead(302, { Location: prefix + "/" }).end();
        return;
      }
      if (!pathname.startsWith(prefix + "/")) {
        res.writeHead(404).end("Not found");
        return;
      }
      let file = path.resolve(root, "." + pathname.slice(prefix.length));
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403).end();
        return;
      }
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      const size = (await stat(file)).size;
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Content-Length": size,
      });
      if (req.method === "HEAD") res.end();
      else createReadStream(file).pipe(res);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Static preview: http://localhost:${port}${prefix}/`),
  );
