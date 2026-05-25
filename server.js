const express = require("express");
const os = require("os");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const startedAt = Date.now();
let visitorCount = 0;

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use((req, res, next) => {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const ip = req.ip || req.socket.remoteAddress || "-";
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms ${ip}`);
  });

  next();
});

app.use(express.static(path.join(__dirname, "public"), {
  etag: true,
  maxAge: "1h"
}));

function formatDuration(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function getInfo() {
  const hostname = os.hostname();

  return {
    timestamp: new Date().toISOString(),
    hostname,
    podName: process.env.HOSTNAME || hostname,
    uptime: formatDuration(process.uptime()),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    visitorCount,
    environment: {
      nodeEnv: process.env.NODE_ENV || "development",
      port,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      startedAt: new Date(startedAt).toISOString()
    }
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderDashboard(info) {
  const envRows = Object.entries(info.environment)
    .map(([key, value]) => `
      <div class="env-row">
        <span>${escapeHtml(key)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>CloudTrack Mini</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <main class="shell">
    <section class="hero" aria-labelledby="page-title">
      <div>
        <p class="eyebrow">AWS Free Tier ready</p>
        <h1 id="page-title">CloudTrack Mini</h1>
        <p class="summary">A tiny Express dashboard for Docker containers and Kubernetes pods.</p>
      </div>
      <a class="api-link" href="/api/info">JSON API</a>
    </section>

    <section class="metrics" aria-label="Runtime metrics">
      <article class="metric primary">
        <span>Current Timestamp</span>
        <strong id="timestamp">${escapeHtml(info.timestamp)}</strong>
      </article>
      <article class="metric">
        <span>Server Uptime</span>
        <strong id="uptime">${escapeHtml(info.uptime)}</strong>
      </article>
      <article class="metric">
        <span>Hostname / Container ID</span>
        <strong id="hostname">${escapeHtml(info.hostname)}</strong>
      </article>
      <article class="metric">
        <span>Kubernetes Pod Name</span>
        <strong id="podName">${escapeHtml(info.podName)}</strong>
      </article>
      <article class="metric">
        <span>Visitors This Process</span>
        <strong id="visitorCount">${escapeHtml(info.visitorCount)}</strong>
      </article>
      <article class="metric">
        <span>Node Runtime</span>
        <strong id="nodeVersion">${escapeHtml(info.nodeVersion)}</strong>
      </article>
    </section>

    <section class="panel" aria-labelledby="env-title">
      <div class="panel-heading">
        <h2 id="env-title">Environment</h2>
        <span id="refreshState">Auto-refreshing</span>
      </div>
      <div class="env-grid" id="environment">
        ${envRows}
      </div>
    </section>
  </main>

  <script src="/app.js" defer></script>
</body>
</html>`;
}

app.get("/", (req, res) => {
  visitorCount += 1;
  res.type("html").send(renderDashboard(getInfo()));
});

app.get("/api/info", (req, res) => {
  res.json(getInfo());
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`CloudTrack Mini listening on port ${port}`);
});
