/**
 * anita-keepalive.js
 * HTTP server ringan agar Deepnote tidak sleep karena idle.
 * UptimeRobot bisa ping endpoint ini setiap 5 menit.
 *
 * Endpoints:
 *   GET /       - Halaman HTML Bot is Running
 *   GET /ping   - JSON response sederhana untuk monitoring
 *   GET /health - Info lengkap: uptime, RAM, status koneksi WA
 */

import http from 'http';
import { logger } from './anita-logger.js';

const PORT = parseInt(process.env.KEEPALIVE_PORT || '8080');
let _server = null;
let _startTime = Date.now();
let _connectionStatus = 'starting';
let _botName = 'Ryo Yamada MD';

/**
 * Update status koneksi WA (dipanggil dari connection.js)
 * @param {'starting'|'connected'|'disconnected'} status
 */
export function updateConnectionStatus(status) {
  _connectionStatus = status;
}

/**
 * Set nama bot untuk ditampilkan di halaman health
 * @param {string} name
 */
export function setBotNameForKeepAlive(name) {
  _botName = name;
}

function getMemoryUsageMB() {
  const mem = process.memoryUsage();
  return {
    rss: (mem.rss / 1024 / 1024).toFixed(1),
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(1),
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(1),
  };
}

function getUptimeStr() {
  const ms = Date.now() - _startTime;
  const secs = Math.floor(ms / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return ${days}d h m;
  if (hours > 0) return ${hours}h m s;
  if (mins > 0) return ${mins}m s;
  return ${secs}s;
}

function handleRequest(req, res) {
  const url = req.url?.split('?')[0] || '/';
  const now = new Date().toISOString();

  if (url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: _botName,
      wa: _connectionStatus,
      uptime: getUptimeStr(),
      ts: now,
    }));
    return;
  }

  if (url === '/health') {
    const mem = getMemoryUsageMB();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bot: _botName,
      wa_status: _connectionStatus,
      uptime: getUptimeStr(),
      memory_mb: {
        rss: ${mem.rss} MB,
        heap_used: ${mem.heapUsed} MB,
        heap_total: ${mem.heapTotal} MB,
      },
      node_version: process.version,
      platform: process.platform,
      ts: now,
    }, null, 2));
    return;
  }

  // GET / - halaman HTML
  const statusColor = _connectionStatus === 'connected' ? '#22c55e' : _connectionStatus === 'starting' ? '#f59e0b' : '#ef4444';
  const statusText = _connectionStatus === 'connected' ? '🟢 Connected' : _connectionStatus === 'starting' ? '🟡 Starting...' : '🔴 Disconnected';
  const mem = getMemoryUsageMB();

  const html = <!DOCTYPE html>
<html lang=id>
<head>
  <meta charset=UTF-8>
  <meta name=viewport content=width=device-width, initial-scale=1.0>
  <meta http-equiv=refresh content=30>
  <title> - Status</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px 48px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
    .logo { font-size: 48px; margin-bottom: 12px; }
    h1 { font-size: 1.6rem; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }
    .version { color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; background: #0f172a; border: 1px solid 33; color: ; padding: 8px 20px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; margin-bottom: 28px; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat { background: #0f172a; border-radius: 10px; padding: 14px; }
    .stat-label { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .stat-value { color: #f1f5f9; font-weight: 600; font-size: 1rem; }
    .endpoints { background: #0f172a; border-radius: 10px; padding: 14px; text-align: left; }
    .endpoints p { color: #64748b; font-size: 0.75rem; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .endpoints a { color: #60a5fa; font-size: 0.85rem; text-decoration: none; display: block; margin-bottom: 4px; font-family: monospace; }
    .endpoints a:hover { color: #93c5fd; }
    .footer { color: #334155; font-size: 0.75rem; margin-top: 20px; }
  </style>
</head>
<body>
  <div class=card>
    <div class=logo>🤖</div>
    <h1></h1>
    <p class=version>v3.3 • Deepnote Hosting</p>
    <div class=status-badge></div>
    <div class=stats>
      <div class=stat>
        <p class=stat-label>Uptime</p>
        <p class=stat-value></p>
      </div>
      <div class=stat>
        <p class=stat-label>RAM Used</p>
        <p class=stat-value> MB</p>
      </div>
    </div>
    <div class=endpoints>
      <p>Monitoring Endpoints</p>
      <a href=/ping>/ping</a>
      <a href=/health>/health</a>
    </div>
    <p class=footer>Auto-refresh setiap 30 detik • </p>
  </div>
</body>
</html>;

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

/**
 * Mulai HTTP keep-alive server
 * @param {string} [botName] Nama bot untuk ditampilkan
 * @returns {Promise<void>}
 */
export function startKeepAlive(botName) {
  if (botName) _botName = botName;
  _startTime = Date.now();

  // Hanya aktif di Deepnote atau jika dipaksa via env
  const forceStart = process.env.KEEPALIVE_FORCE === 'true';
  const onDeepnote = !!(
    process.env.DEEPNOTE_PROJECT_ID ||
    process.env.DEEPNOTE_KERNEL_ID ||
    process.env.DEEPNOTE
  );

  if (!onDeepnote && !forceStart) {
    logger.info('keepalive', 'Bukan di Deepnote, keep-alive server dilewati (set KEEPALIVE_FORCE=true untuk paksa aktif)');
    return;
  }

  if (_server) {
    logger.warn('keepalive', 'Server sudah berjalan');
    return;
  }

  _server = http.createServer(handleRequest);

  _server.listen(PORT, '0.0.0.0', () => {
    logger.success('keepalive', HTTP Keep-Alive server aktif di port );
    logger.info('keepalive', Endpoint: /ping /health /);
    logger.info('keepalive', Pasang UptimeRobot: https://uptimerobot.com → monitor URL /ping);
  });

  _server.on('error', (err) => {
    logger.error('keepalive', Server error: );
  });
}

/**
 * Stop keep-alive server
 */
export function stopKeepAlive() {
  if (_server) {
    _server.close();
    _server = null;
    logger.info('keepalive', 'HTTP Keep-Alive server dihentikan');
  }
}
