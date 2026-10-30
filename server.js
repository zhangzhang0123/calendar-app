// ========================================
// 日历记事 - 本地服务器（静态托管 + 应用目录备份接口）
// 启动：node server.js
// ========================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8972;
const ROOT = __dirname;
const BACKUP_FILE = path.join(ROOT, '日历记事备份.json');
const MIME = {
    '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon'
};

function sendJson(res, code, obj) {
    res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(obj));
}

http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);

    // 备份接口：GET 读取 / POST 写入，文件固定在应用目录
    if (urlPath === '/api/backup') {
        if (req.method === 'GET') {
            fs.readFile(BACKUP_FILE, (err, data) => {
                if (err) { sendJson(res, 404, { error: 'no backup file' }); return; }
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            });
            return;
        }
        if (req.method === 'POST') {
            const chunks = [];
            let size = 0;
            req.on('data', c => {
                size += c.length;
                if (size > 10 * 1024 * 1024) { req.destroy(); return; }
                chunks.push(c);
            });
            req.on('end', () => {
                const body = Buffer.concat(chunks);
                try {
                    JSON.parse(body.toString('utf8'));
                } catch (e) {
                    sendJson(res, 400, { error: 'invalid json' });
                    return;
                }
                fs.writeFile(BACKUP_FILE, body, err => {
                    if (err) { sendJson(res, 500, { error: err.message }); return; }
                    sendJson(res, 200, { ok: true, savedAt: new Date().toISOString() });
                });
            });
            return;
        }
        res.writeHead(405); res.end('method not allowed');
        return;
    }

    // 静态文件
    if (urlPath === '/') urlPath = '/index.html';
    const file = path.join(ROOT, urlPath);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
        res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(fs.readFileSync(file));
}).listen(PORT, '127.0.0.1', () => {
    console.log(`日历记事已启动: http://localhost:${PORT}`);
    console.log(`备份文件位置: ${BACKUP_FILE}`);
});
