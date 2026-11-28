// Kleiner lokaler Server für die Werkzeuge (npm run schau, npm run og). Liefert den Projektordner auf 127.0.0.1 aus.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TYP = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.xml': 'application/xml', '.txt': 'text/plain' };

function start() {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const datei = path.join(ROOT, p);
    if (!datei.startsWith(ROOT + path.sep) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': TYP[path.extname(datei)] || 'application/octet-stream' });
    fs.createReadStream(datei).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}`, stop: () => server.close() })));
}

// Chrome: Umgebungsvariable CHROME_PATH oder die üblichen Orte.
function chrome() {
  const orte = [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
  const da = orte.find((o) => o && fs.existsSync(o));
  if (!da) throw new Error('Chrome nicht gefunden. CHROME_PATH setzen, z. B. CHROME_PATH="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"');
  return da;
}

module.exports = { ROOT, start, chrome };
