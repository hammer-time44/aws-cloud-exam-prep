// Backend entry point. Serves the JSON API under /api and the frontend folder as static files.
// No dependencies: it uses only Node's built-in modules.
const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleApi } = require("./routes/api");

const PORT = process.env.PORT || 3000;
const FRONTEND = path.join(__dirname, "..", "frontend");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const target = path.join(FRONTEND, urlPath === "/" ? "index.html" : urlPath);

  // Block paths that escape the frontend folder.
  if (!target.startsWith(FRONTEND)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(target, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": MIME[path.extname(target)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api")) return handleApi(req, res);
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log("AWS PYQ Planner running at http://localhost:" + PORT);
});
