// Zero-dependency local server for the Growth Portal.
// Serves index.html + routes /api/<name> to the Vercel-style handlers in api/.
// Usage: node server.js   (PORT env optional, default 4200)

const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 4200);
const ROOT = __dirname;

// Load .env.local into process.env (simple KEY="value" / KEY=value lines).
const envFile = path.join(ROOT, ".env.local");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !line.trim().startsWith("#")) process.env[m[1]] = m[2];
  }
}

function shimRes(res) {
  return {
    status(code) { res.statusCode = code; return this; },
    json(obj) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(obj));
    },
  };
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);

  // CORS: allow the Vercel-hosted UI to call this API through the tunnel.
  res.setHeader("Access-Control-Allow-Origin", "https://rich-group-portal.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }

  // API routes
  const apiMatch = u.pathname.match(/^\/api\/([a-z_-]+)\/?$/);
  if (apiMatch) {
    const handlerPath = path.join(ROOT, "api", `${apiMatch[1]}.js`);
    if (!fs.existsSync(handlerPath)) {
      res.statusCode = 404;
      return res.end(JSON.stringify({ error: "no such api" }));
    }
    // Parse body for POST/PUT
    let body = {};
    if (req.method === "POST" || req.method === "PUT") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try { body = JSON.parse(Buffer.concat(chunks).toString() || "{}"); } catch { body = {}; }
    }
    const query = Object.fromEntries(u.searchParams.entries());
    const handler = require(handlerPath);
    try {
      await handler({ method: req.method, body, query, headers: req.headers }, shimRes(res));
    } catch (e) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  // Static: index.html + content/*.js
  if (u.pathname === "/" || u.pathname === "/index.html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return fs.createReadStream(path.join(ROOT, "index.html")).pipe(res);
  }
  if (/^\/content\/[a-z0-9_-]+\.js$/.test(u.pathname)) {
    const f = path.join(ROOT, u.pathname);
    if (fs.existsSync(f)) {
      res.setHeader("Content-Type", "application/javascript");
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.statusCode = 404;
  res.end("not found");
});

server.listen(PORT, () => console.log(`Growth Portal: http://localhost:${PORT}`));
