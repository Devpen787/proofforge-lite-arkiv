import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("..", import.meta.url);
const webRoot = fileURLToPath(new URL("web/", root));
const port = Number(process.env.PORT ?? 4173);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function resolveRequestPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const normalizedPath = decodedPath === "/" ? "/index.html" : decodedPath;
  const absolutePath = path.normalize(path.join(webRoot, normalizedPath));

  if (!absolutePath.startsWith(webRoot)) {
    return null;
  }

  return absolutePath;
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const filePath = resolveRequestPath(url.pathname);

  if (!filePath) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, body) => {
    if (error) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": contentTypes[path.extname(filePath)] ?? "text/plain; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(body);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`ProofForge Lite web demo: http://127.0.0.1:${port}/`);
});
