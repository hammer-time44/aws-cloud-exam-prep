// API routes. Reads the JSON data files once at startup and answers GET requests.
const modules = require("../data/modules.json");
const papers = require("../data/papers.json");

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function handleApi(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Only GET is supported" });

  const path = new URL(req.url, "http://localhost").pathname.replace(/\/+$/, "");
  const parts = path.split("/").filter(Boolean); // ["api", "modules", "m1"]
  const [, resource, id] = parts;

  if (resource === "health" && !id) return send(res, 200, { status: "ok" });

  if (resource === "modules") {
    if (!id) return send(res, 200, modules);
    const found = modules.find((m) => m.id === id.toLowerCase());
    return found ? send(res, 200, found) : send(res, 404, { error: "Module not found: " + id });
  }

  if (resource === "papers") {
    if (!id) return send(res, 200, papers);
    const found = papers.find((p) => p.id.toLowerCase() === id.toLowerCase());
    return found ? send(res, 200, found) : send(res, 404, { error: "Paper not found: " + id });
  }

  return send(res, 404, { error: "Unknown API route" });
}

module.exports = { handleApi };
