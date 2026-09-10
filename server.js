import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'surveys.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
}

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function readSurveys() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Lỗi đọc data/surveys.json:', err);
    return [];
  }
}

function saveSurveys(surveys) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(surveys, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Lỗi ghi data/surveys.json:', err);
    return false;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/info') {
    const lanIp = getLanIp();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      lanIp,
      port: PORT,
      url: `http://${lanIp}:${PORT}`
    }));
    return;
  }

  if (url.pathname === '/api/surveys' && req.method === 'GET') {
    const surveys = readSurveys();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, surveys }));
    return;
  }

  if (url.pathname === '/api/surveys/sync' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const incomingSurveys = Array.isArray(payload) ? payload : (payload.surveys || []);
        
        let existingSurveys = readSurveys();
        const existingMap = new Map(existingSurveys.map(item => [item.id, item]));

        let addedOrUpdatedCount = 0;
        incomingSurveys.forEach(item => {
          if (!item.id) return;
          const updatedItem = { ...item, status: 'SYNCED' };
          if (!existingMap.has(item.id) || existingMap.get(item.id).status !== 'SYNCED') {
            existingMap.set(item.id, updatedItem);
            addedOrUpdatedCount++;
          }
        });

        const mergedSurveys = Array.from(existingMap.values());
        mergedSurveys.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        saveSurveys(mergedSurveys);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          syncedCount: addedOrUpdatedCount,
          surveys: mergedSurveys
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  const lanIp = getLanIp();
  console.log(`\n==================================================`);
  console.log(`🚀 VKU Field Survey Server đang chạy!`);
  console.log(`💻 Trình duyệt Máy tính: http://localhost:${PORT}`);
  console.log(`📱 Trình duyệt Điện thoại (Cùng Wi-Fi): http://${lanIp}:${PORT}`);
  console.log(`==================================================\n`);
});
