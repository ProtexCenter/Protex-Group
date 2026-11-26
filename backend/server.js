/**
 * Protex Group — Express / Node.js Server (Full CMS & Admin Dashboard Edition)
 * - Uses Express when installed (`npm install`), or seamlessly runs on a built-in
 *   Node HTTP compatible layer when `node_modules` is not yet installed.
 * - Serves the static frontend (../frontend)
 * - Serves JSON data from ./data (re-read on every request so JSON edits appear immediately)
 * - Full Admin CMS REST API (`/api/admin/*`) + Base64/Binary Image Upload (`POST /api/admin/upload`)
 */
const http = require('http');
const tls = require('tls');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

function createFallbackExpress() {
  const routes = [];
  const matchPath = (pattern, pathname) => {
    const pParts = pattern.split('/').filter(Boolean);
    const uParts = pathname.split('/').filter(Boolean);
    if (pParts.length !== uParts.length) return null;
    const params = {};
    for (let i = 0; i < pParts.length; i++) {
      if (pParts[i].startsWith(':')) params[pParts[i].slice(1)] = decodeURIComponent(uParts[i]);
      else if (pParts[i] !== uParts[i]) return null;
    }
    return params;
  };

  function app(req, res) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    req.path = urlObj.pathname;
    req.query = Object.fromEntries(urlObj.searchParams.entries());
    res.status = (code) => { res.statusCode = code; return res; };
    res.set = (k, v) => { res.setHeader(k, v); return res; };
    res.json = (obj) => {
      if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    };
    res.sendFile = async (filePath) => {
      try {
        const st = await fs.stat(filePath);
        const total = st.size;
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME[ext] || 'application/octet-stream';
        const range = req.headers && req.headers.range;
        if (range && /^bytes=\d*-\d*$/.test(range)) {
          const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
          let start = startStr ? parseInt(startStr, 10) : 0;
          let end = endStr ? parseInt(endStr, 10) : total - 1;
          if (Number.isNaN(start) || start < 0) start = 0;
          if (Number.isNaN(end) || end >= total) end = total - 1;
          if (start > end) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${total}`);
            return res.end();
          }
          const buf = await fs.readFile(filePath);
          const slice = buf.subarray(start, end + 1);
          res.statusCode = 206;
          res.setHeader('Content-Type', mime);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
          res.setHeader('Content-Length', String(slice.length));
          return res.end(slice);
        }
        const buf = await fs.readFile(filePath);
        if (!res.headersSent) {
          res.setHeader('Content-Type', mime);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Length', String(buf.length));
        }
        res.end(buf);
      } catch (e) {
        res.statusCode = 404;
        res.end('Not found');
      }
    };

    let idx = 0;
    const next = (err) => {
      if (err) {
        const status = err instanceof SyntaxError ? 400 : 500;
        return res.status(status).json({ ok: false, message: status === 400 ? 'ข้อมูลที่ส่งมาไม่ถูกต้อง' : 'เซิร์ฟเวอร์ขัดข้อง' });
      }
      const layer = routes[idx++];
      if (!layer) { res.statusCode = 404; return res.end('Not found'); }
      try {
        if (layer.type === 'mw') {
          if (layer.prefix && !req.path.startsWith(layer.prefix)) return next();
          return layer.fn(req, res, next);
        }
        if (layer.method !== req.method) return next();
        const params = matchPath(layer.pattern, req.path);
        if (!params) return next();
        req.params = params;
        return layer.fn(req, res, next);
      } catch (e) {
        return next(e);
      }
    };
    next();
  }

  const composeHandlers = (handlers) => {
    const fns = handlers.flat().filter((h) => typeof h === 'function');
    if (fns.length <= 1) return fns[0] || ((req, res, next) => next());
    return (req, res, outerNext) => {
      let i = 0;
      const dispatch = (err) => {
        if (err) return outerNext(err);
        const fn = fns[i++];
        if (!fn) return outerNext();
        try {
          return Promise.resolve(fn(req, res, dispatch)).catch(outerNext);
        } catch (e) {
          return outerNext(e);
        }
      };
      return dispatch();
    };
  };

  app.disable = () => {};
  app.use = (a, ...rest) => {
    if (typeof a === 'string') routes.push({ type: 'mw', prefix: a, fn: composeHandlers(rest) });
    else routes.push({ type: 'mw', prefix: '', fn: composeHandlers([a, ...rest]) });
  };
  app.get = (pattern, ...fns) => routes.push({ type: 'route', method: 'GET', pattern, fn: composeHandlers(fns) });
  app.post = (pattern, ...fns) => routes.push({ type: 'route', method: 'POST', pattern, fn: composeHandlers(fns) });
  app.put = (pattern, ...fns) => routes.push({ type: 'route', method: 'PUT', pattern, fn: composeHandlers(fns) });
  app.patch = (pattern, ...fns) => routes.push({ type: 'route', method: 'PATCH', pattern, fn: composeHandlers(fns) });
  app.delete = (pattern, ...fns) => routes.push({ type: 'route', method: 'DELETE', pattern, fn: composeHandlers(fns) });
  app.listen = (port, cb) => http.createServer(app).listen(port, cb);
  return app;
}

createFallbackExpress.json = (opts = {}) => {
  const maxBytes = opts.limit === '20mb' ? 20 * 1024 * 1024 : 2 * 1024 * 1024;
  return (req, res, next) => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) return next();
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        req.destroy();
        return;
      }
      raw += chunk.toString('utf8');
    });
    req.on('end', () => {
      if (!raw) { req.body = {}; return next(); }
      try { req.body = JSON.parse(raw); next(); } catch (e) { next(e); }
    });
  };
};

createFallbackExpress.static = (rootDir) => async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const rel = decodeURIComponent(req.path === '/' ? '/index.html' : req.path);
  const safePath = path.normalize(path.join(rootDir, rel));
  if (!safePath.startsWith(rootDir)) return res.status(403).end('Forbidden');
  try {
    let target = safePath;
    const st = await fs.stat(target).catch(() => null);
    if (!st && !path.extname(target)) target = `${target}.html`;
    const st2 = await fs.stat(target);
    if (!st2.isFile()) return next();
    await res.sendFile(target);
  } catch (e) {
    next();
  }
};

let express;
try {
  express = require('express');
} catch (e) {
  express = createFallbackExpress;
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const UPLOADS_DIR = path.join(FRONTEND_DIR, 'assets', 'images', 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const COLLECTIONS = [
  'plants',
  'accessories',
  'promotions',
  'reviews',
  'locations',
  'chatbot-knowledge',
  'popup',
  'site-settings',
  'spare-parts',
  'quotations',
  'orders',
];

const ADMIN_SECRET = process.env.PROTEX_ADMIN_SECRET || 'ptx-liquid-glass-cms-2026-key';
const ADMIN_SESSION_DURATION_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds (18,000,000 ms)
const activeTokens = new Map(); // token -> expiresAt (timestamp)

app.disable('x-powered-by');
app.use(express.json({ limit: '20mb' }));

/* Global API No-Cache Security & Real-Time Sync Policy */
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

const TMP_DATA_DIR = path.join('/tmp', 'protex-cms-data');

async function readJSON(name) {
  try {
    const tmpRaw = await fs.readFile(path.join(TMP_DATA_DIR, `${name}.json`), 'utf8');
    return JSON.parse(tmpRaw);
  } catch (e) {}
  const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf8');
  return JSON.parse(raw);
}

async function writeJSON(name, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  const filePath = path.join(DATA_DIR, `${name}.json`);
  try {
    await fs.writeFile(filePath, content, 'utf8');
    await fs.unlink(path.join(TMP_DATA_DIR, `${name}.json`)).catch(() => {});
  } catch (err) {
    await fs.mkdir(TMP_DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(TMP_DATA_DIR, `${name}.json`), content, 'utf8');
  }
}

const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------------------------- Admin Token Helpers ---------------------------- */
function generateAdminToken(password) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + ADMIN_SESSION_DURATION_MS;
  const payload = `admin:${issuedAt}:${expiresAt}`;
  const sig = crypto
    .createHmac('sha256', `${ADMIN_SECRET}:${password}`)
    .update(payload)
    .digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  activeTokens.set(token, expiresAt);
  return { token, issuedAt, expiresAt };
}

function parseCookies(req) {
  const header = (req.headers && req.headers.cookie) || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

async function verifyAdminRequest(req) {
  const authHeader = (req.headers && req.headers.authorization) || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = parseCookies(req);
  const token = bearer || cookies.ptx_admin_token || '';
  if (!token) {
    return { ok: false, code: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบผู้ดูแล (Unauthorized)' };
  }

  // Check active tokens cache
  const cachedExpiry = activeTokens.get(token);
  if (cachedExpiry) {
    if (Date.now() > cachedExpiry) {
      activeTokens.delete(token);
      return {
        ok: false,
        code: 'SESSION_EXPIRED',
        message: 'ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      };
    }
    return { ok: true, expiresAt: cachedExpiry };
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    let role, issuedAtStr, expiresAtStr, sig;

    if (parts.length === 4) {
      [role, issuedAtStr, expiresAtStr, sig] = parts;
    } else if (parts.length === 3) {
      [role, issuedAtStr, sig] = parts;
      expiresAtStr = String(Number(issuedAtStr) + ADMIN_SESSION_DURATION_MS);
    } else {
      return { ok: false, code: 'INVALID_TOKEN', message: 'โทเค็นไม่ถูกต้อง' };
    }

    if (role !== 'admin' || !issuedAtStr || !sig) {
      return { ok: false, code: 'INVALID_TOKEN', message: 'โทเค็นไม่ถูกต้อง' };
    }

    const issuedAt = Number(issuedAtStr) || 0;
    const expiresAt = Number(expiresAtStr) || (issuedAt + ADMIN_SESSION_DURATION_MS);

    // Strict 5-hour session timeout verification
    if (Date.now() > expiresAt) {
      activeTokens.delete(token);
      return {
        ok: false,
        code: 'SESSION_EXPIRED',
        message: 'ครบกำหนดเวลาใช้งาน 5 ชั่วโมงแล้ว เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
      };
    }

    const payload = parts.length === 4 ? `admin:${issuedAtStr}:${expiresAtStr}` : `admin:${issuedAtStr}`;
    const settings = await readJSON('site-settings').catch(() => ({ adminPassword: 'Protex@2026' }));
    const expected = crypto
      .createHmac('sha256', `${ADMIN_SECRET}:${settings.adminPassword || 'Protex@2026'}`)
      .update(payload)
      .digest('hex');

    if (sig !== expected) {
      return { ok: false, code: 'INVALID_TOKEN', message: 'โทเค็นไม่ถูกต้อง' };
    }

    activeTokens.set(token, expiresAt);
    return { ok: true, expiresAt };
  } catch (e) {
    return { ok: false, code: 'INVALID_TOKEN', message: 'โทเค็นไม่ถูกต้อง' };
  }
}

async function requireAdmin(req, res, next) {
  const result = await verifyAdminRequest(req);
  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      code: result.code || 'UNAUTHORIZED',
      message: result.message || 'กรุณาเข้าสู่ระบบผู้ดูแล (Unauthorized)',
    });
  }
  req.adminExpiresAt = result.expiresAt;
  return next();
}

/* ---------------------------- Admin Auth APIs ---------------------------- */
app.post('/api/admin/login', asyncRoute(async (req, res) => {
  const { password = '' } = req.body || {};
  const settings = await readJSON('site-settings').catch(() => ({ adminPassword: 'Protex@2026' }));
  const actualPassword = settings.adminPassword || 'Protex@2026';

  if (String(password).trim() !== actualPassword) {
    return res.status(401).json({ ok: false, message: 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' });
  }

  const { token, issuedAt, expiresAt } = generateAdminToken(actualPassword);
  const maxAgeSec = Math.floor(ADMIN_SESSION_DURATION_MS / 1000); // 18,000s = 5 hours
  res.set('Set-Cookie', `ptx_admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`);
  res.json({
    ok: true,
    token,
    issuedAt,
    expiresAt,
    expiresIn: ADMIN_SESSION_DURATION_MS,
    message: 'เข้าสู่ระบบ PROTEX Admin สำเร็จ (เซสชัน 5 ชั่วโมง)',
  });
}));

app.get('/api/admin/verify', asyncRoute(async (req, res) => {
  const result = await verifyAdminRequest(req);
  if (!result.ok) {
    return res.status(401).json({
      ok: false,
      code: result.code || 'UNAUTHORIZED',
      message: result.message || 'กรุณาเข้าสู่ระบบผู้ดูแล (Unauthorized)',
    });
  }
  const remainingMs = Math.max(0, (result.expiresAt || 0) - Date.now());
  res.json({
    ok: true,
    expiresAt: result.expiresAt,
    remainingMs,
  });
}));

app.post('/api/admin/logout', (req, res) => {
  const authHeader = (req.headers && req.headers.authorization) || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookies = parseCookies(req);
  const token = bearer || cookies.ptx_admin_token || '';
  if (token) activeTokens.delete(token);
  res.set('Set-Cookie', 'ptx_admin_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.post('/api/admin/password', requireAdmin, asyncRoute(async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body || {};
  const settings = await readJSON('site-settings').catch(() => ({ adminPassword: 'Protex@2026' }));
  const actualPassword = settings.adminPassword || 'Protex@2026';

  if (currentPassword && String(currentPassword).trim() !== actualPassword) {
    return res.status(400).json({ ok: false, message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
  }
  if (String(newPassword).trim().length < 6) {
    return res.status(422).json({ ok: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
  }

  settings.adminPassword = String(newPassword).trim();
  settings.updatedAt = new Date().toISOString();
  await writeJSON('site-settings', settings);

  activeTokens.clear();
  const { token, issuedAt, expiresAt } = generateAdminToken(settings.adminPassword);
  const maxAgeSec = Math.floor(ADMIN_SESSION_DURATION_MS / 1000);
  res.set('Set-Cookie', `ptx_admin_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`);
  res.json({
    ok: true,
    token,
    issuedAt,
    expiresAt,
    expiresIn: ADMIN_SESSION_DURATION_MS,
    message: 'เปลี่ยนรหัสผ่านแอดมินเรียบร้อยแล้ว',
  });
}));

/* ---------------------------- Admin Image Upload API ---------------------------- */
app.post('/api/admin/upload', requireAdmin, asyncRoute(async (req, res) => {
  const { filename = 'image.png', dataUrl = '' } = req.body || {};
  const match = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,(.+)$/i.exec(String(dataUrl));
  if (!match) {
    return res.status(400).json({ ok: false, message: 'รองรับเฉพาะไฟล์รูปภาพ PNG, JPG, WEBP หรือ SVG เท่านั้น' });
  }

  const mimeSubtype = match[1].toLowerCase();
  const base64Data = match[2];
  const extMap = { png: '.png', jpeg: '.jpg', jpg: '.jpg', webp: '.webp', 'svg+xml': '.svg' };
  const ext = extMap[mimeSubtype] || '.png';

  const safeBase = path
    .basename(String(filename), path.extname(String(filename)))
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'protex-upload';

  const finalName = `${safeBase}-${Date.now()}${ext}`;
  const fileBuffer = Buffer.from(base64Data, 'base64');
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOADS_DIR, finalName), fileBuffer);
    const publicUrl = `assets/images/uploads/${finalName}`;
    return res.json({ ok: true, url: publicUrl, filename: finalName, size: fileBuffer.length });
  } catch (err) {
    // Serverless read-only filesystem fallback: persist as dataUrl directly in JSON
    return res.json({ ok: true, url: dataUrl, filename: finalName, size: fileBuffer.length });
  }
}));

/* ---------------------------- Admin Full Collection Sync & Save ---------------------------- */
app.put('/api/admin/collection/:collection', requireAdmin, asyncRoute(async (req, res) => {
  let { collection } = req.params;
  if (collection === 'popups') collection = 'popup';
  if (collection === 'projects') collection = 'locations';
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ ok: false, message: 'ไม่พบคอลเลกชันที่ระบุ' });
  }

  const payload = req.body;
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({ ok: false, message: 'รูปแบบข้อมูล JSON ไม่ถูกต้อง' });
  }

  // If saving site-settings, preserve adminPassword and gmailAppPassword if omitted
  if (collection === 'site-settings') {
    const existing = await readJSON('site-settings').catch(() => ({ adminPassword: 'Protex@2026' }));
    if (!payload.adminPassword) {
      payload.adminPassword = existing.adminPassword || 'Protex@2026';
    }
    if (payload.gmailAppPassword === undefined) {
      payload.gmailAppPassword = existing.gmailAppPassword || '';
    }
    if (!payload.smtpUser) {
      payload.smtpUser = existing.smtpUser || 'protexgroupa@gmail.com';
    }
    payload.updatedAt = new Date().toISOString();
    await writeJSON('site-settings', payload);

    // Cross-sync contact details to locations.json & chatbot-knowledge.json
    try {
      const locations = await readJSON('locations');
      if (locations && locations.headquarters) {
        locations.headquarters.phone = payload.phone || locations.headquarters.phone;
        locations.headquarters.hotline = payload.servicePhone || payload.phone || locations.headquarters.hotline;
        locations.headquarters.email = payload.email || locations.headquarters.email;
        locations.headquarters.serviceEmail = payload.email || locations.headquarters.serviceEmail;
        locations.headquarters.lineId = payload.lineId || locations.headquarters.lineId;
        locations.headquarters.address = payload.address || locations.headquarters.address;
        locations.headquarters.hours = payload.hours || locations.headquarters.hours;
        if (payload.googleMapsUrl) locations.headquarters.googleMapsUrl = payload.googleMapsUrl;
        await writeJSON('locations', locations);
      }
    } catch (e) {}

    try {
      const kb = await readJSON('chatbot-knowledge');
      if (kb && kb.contact) {
        kb.contact.companyName = payload.companyName || kb.contact.companyName;
        kb.contact.phone = payload.phone || kb.contact.phone;
        kb.contact.phoneClean = String(payload.phone || kb.contact.phone).replace(/[^0-9+]/g, '');
        kb.contact.servicePhone = payload.servicePhone || payload.phone || kb.contact.servicePhone;
        kb.contact.lineId = payload.lineId || kb.contact.lineId;
        kb.contact.lineUrl = payload.lineUrl || kb.contact.lineUrl;
        kb.contact.email = payload.email || kb.contact.email;
        kb.contact.address = payload.address || kb.contact.address;
        kb.contact.hours = payload.hours || kb.contact.hours;
        await writeJSON('chatbot-knowledge', kb);
      }
    } catch (e) {}

    return res.json({ ok: true, message: 'บันทึกการตั้งค่าเว็บไซต์และซิงก์ข้อมูลติดต่อเรียบร้อยแล้ว' });
  }

  // If saving spare-parts, also cross-sync partsMarquee into promotions.json
  if (collection === 'spare-parts') {
    await writeJSON('spare-parts', payload);
    if (Array.isArray(payload.partsMarquee)) {
      try {
        const promos = await readJSON('promotions');
        promos.partsMarquee = payload.partsMarquee;
        await writeJSON('promotions', promos);
      } catch (e) {}
    }
    return res.json({ ok: true, message: 'บันทึกข้อมูลสินค้าอะไหล่และโปรโมชั่นสไลด์เรียบร้อยแล้ว' });
  }

  // If saving promotions, also cross-sync partsMarquee into spare-parts.json
  if (collection === 'promotions') {
    await writeJSON('promotions', payload);
    if (Array.isArray(payload.partsMarquee)) {
      try {
        const sp = await readJSON('spare-parts');
        sp.partsMarquee = payload.partsMarquee;
        await writeJSON('spare-parts', sp);
      } catch (e) {}
    }
    return res.json({ ok: true, message: 'บันทึกข้อมูลโปรโมชั่น แคมเปญ และโซเชียลเรียบร้อยแล้ว' });
  }

  // If saving locations, also cross-sync installations into chatbot-knowledge.json
  if (collection === 'locations') {
    await writeJSON('locations', payload);
    if (Array.isArray(payload.installations)) {
      try {
        const kb = await readJSON('chatbot-knowledge');
        kb.installations = payload.installations.map((inst) => ({
          company: inst.company,
          province: inst.province,
          region: inst.regionLabel || inst.region,
          model: inst.model,
          googleMapsUrl: inst.googleMapsUrl,
        }));
        await writeJSON('chatbot-knowledge', kb);
      } catch (e) {}
    }
    return res.json({ ok: true, message: 'บันทึกข้อมูลผลงานติดตั้งและพิกัดแผนที่เรียบร้อยแล้ว' });
  }

  await writeJSON(collection, payload);
  res.json({ ok: true, message: `บันทึกข้อมูล ${collection} เรียบร้อยแล้ว` });
}));

/* ---------------------------- Search ---------------------------- */
const STATIC_PAGES = [
  { type: 'หน้า', title: 'หน้าหลัก', subtitle: 'ภาพรวม Protex Group', url: 'index.html', keywords: 'home หน้าหลัก protex' },
  { type: 'หน้า', title: 'ติดต่อสอบถาม', subtitle: 'สำนักงานใหญ่ สายด่วนวิศวกร 24/7 และแผนที่นำทาง', url: 'contact.html', keywords: 'contact ติดต่อ สอบถาม เบอร์โทร แผนที่ line อีเมล สำนักงานใหญ่' },
  { type: 'หน้า', title: 'บริการหลังการขาย', subtitle: 'ทีมวิศวกร 24/7, PM, ซ่อมฉุกเฉิน และศูนย์บริการทั่วประเทศ', url: 'after-sales.html', keywords: 'after sales service บริการหลังการขาย ซ่อม วิศวกร pm maintenance ศูนย์บริการ 24/7' },
  { type: 'หน้า', title: 'ผลงานติดตั้ง', subtitle: 'ผลงานติดตั้งแพล้นท์ยางมะตอยจริงทั่วประเทศ', url: 'service-plants.html', keywords: 'service plants ผลงานติดตั้ง แผนที่ หมุด พิกัด ชุมพร อุทัยธานี กำแพงเพชร สุรินทร์' },
  { type: 'หน้า', title: 'ออกแบบแพล้นท์', subtitle: 'เลือกสีโครงหลักและอุปกรณ์เสริม', url: 'design-plant.html', keywords: 'design configurator ออกแบบ สี ราคา quote ใบเสนอราคา' },
  { type: 'หน้า', title: 'อะไหล่', subtitle: 'อะไหล่แท้และรีวิวลูกค้า', url: 'spare-parts.html', keywords: 'parts spare อะไหล่ รีวิว review' },
  { type: 'หน้า', title: 'โปรโมชั่น', subtitle: 'แคมเปญ วิดีโอ และโซเชียล', url: 'promotions.html', keywords: 'promotion campaign โปรโมชั่น วิดีโอ facebook line instagram tiktok' },
];

app.get('/api/search', asyncRoute(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase().slice(0, 80);
  if (!q) return res.json({ query: q, results: [] });

  const [plants, accessories, promotions, spareParts] = await Promise.all([
    readJSON('plants').catch(() => ({ models: [] })),
    readJSON('accessories').catch(() => ({ items: [] })),
    readJSON('promotions').catch(() => ({ banners: [], campaigns: [], partsMarquee: [] })),
    readJSON('spare-parts').catch(() => ({ catalog: [] })),
  ]);

  const index = [
    ...STATIC_PAGES,
    ...(plants.models || []).map((m) => ({
      type: 'แพล้นท์', title: m.name, subtitle: `${m.capacity} ${m.capacityUnit || 'T/H'} · ${m.tagline}`,
      url: `index.html#${m.category}`, keywords: `${m.series} ${m.category} ${m.description}`,
    })),
    ...(accessories.items || []).map((a) => ({
      type: 'อุปกรณ์เสริม', title: a.name, subtitle: a.nameEn || a.category,
      url: `design-plant.html#acc-${a.id}`, keywords: `${a.category} ${a.description}`,
    })),
    ...(spareParts.catalog || []).map((sp) => ({
      type: 'อะไหล่แท้', title: sp.name, subtitle: `${sp.category} · ${sp.spec}`,
      url: 'spare-parts.html#partsCatalogSection', keywords: `${sp.category} ${sp.spec}`,
    })),
    ...(promotions.banners || []).map((b) => ({
      type: 'โปรโมชั่น', title: b.title, subtitle: b.subtitle, url: 'index.html#promotions', keywords: b.badge || '',
    })),
    ...(promotions.campaigns || []).map((c) => ({
      type: 'แคมเปญ', title: c.title, subtitle: c.excerpt, url: 'promotions.html#campaigns', keywords: c.type,
    })),
    ...(promotions.partsMarquee || []).map((p) => ({
      type: 'อะไหล่', title: p.title, subtitle: p.detail, url: 'spare-parts.html#parts-promo', keywords: p.discount,
    })),
  ];

  const terms = q.split(/\s+/).filter(Boolean);
  const scored = index
    .map((item) => {
      const hay = `${item.title} ${item.subtitle} ${item.keywords}`.toLowerCase();
      const title = item.title.toLowerCase();
      let score = 0;
      for (const t of terms) {
        if (!hay.includes(t)) return null;
        score += title.startsWith(t) ? 6 : title.includes(t) ? 3 : 1;
      }
      return { score, item };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(({ item }) => ({ type: item.type, title: item.title, subtitle: item.subtitle, url: item.url }));

  res.json({ query: q, results: scored });
}));

/* ---------------------------- Gmail SMTP Sender (`protexgroupa@gmail.com`) & Quotation Engine ---------------------------- */
const QuotationTemplate = require('../frontend/assets/js/quotation-template');
const THB_FMT = new Intl.NumberFormat('th-TH');
const fmtTHB = (n) => `฿${THB_FMT.format(Math.round(Number(n) || 0))}`;
const escHTML = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function buildQuotationEmailHTML(q, isInternalAlert, siteSettings = {}) {
  return QuotationTemplate.buildOfficialQuotationEmailHTML(q, siteSettings, isInternalAlert);
}

/**
 * Native TLS SMTP client for smtp.gmail.com:465 (works with or without nodemailer installed)
 */
function sendRawSmtpMail({ user, pass, from, to, replyTo, subject, html }) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com', rejectUnauthorized: false });
    let buffer = '';
    let step = 0;
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    let rcptIdx = 0;

    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('SMTP connection timeout'));
    }, 15000);

    const finish = (err, info) => {
      clearTimeout(timer);
      try { socket.end(); } catch (e) {}
      if (err) reject(err);
      else resolve(info);
    };

    const sendLine = (cmd) => {
      socket.write(`${cmd}\r\n`);
    };

    socket.on('error', (err) => finish(err));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\r\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line || line.length < 3) continue;
        // Wait for final line of multi-line SMTP response (4th char is space)
        if (line[3] === '-') continue;
        const code = parseInt(line.slice(0, 3), 10);

        if (code >= 400) {
          return finish(new Error(`SMTP Error ${code}: ${line}`));
        }

        if (step === 0 && code === 220) {
          step = 1;
          sendLine('EHLO protexgroup.co.th');
        } else if (step === 1 && code === 250) {
          step = 2;
          sendLine('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          sendLine(Buffer.from(user, 'utf8').toString('base64'));
        } else if (step === 3 && code === 334) {
          step = 4;
          sendLine(Buffer.from(pass, 'utf8').toString('base64'));
        } else if (step === 4 && code === 235) {
          step = 5;
          sendLine(`MAIL FROM:<${user}>`);
        } else if (step === 5 && code === 250) {
          if (rcptIdx < recipients.length) {
            sendLine(`RCPT TO:<${recipients[rcptIdx++]}>`);
          } else {
            step = 6;
            sendLine('DATA');
          }
        } else if (step === 6 && code === 354) {
          step = 7;
          const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`;
          const msg = [
            `From: ${from}`,
            `To: ${recipients.join(', ')}`,
            `Reply-To: ${replyTo || user}`,
            `Subject: ${encodedSubject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            'Content-Transfer-Encoding: base64',
            '',
            Buffer.from(html, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'),
            '.',
          ].join('\r\n');
          sendLine(msg);
        } else if (step === 7 && code === 250) {
          step = 8;
          sendLine('QUIT');
          return finish(null, { ok: true, recipients });
        }
      }
    });
  });
}

async function dispatchQuotationEmails(quotationRecord, options = {}) {
  const mode = options.mode || 'official_customer';
  const settings = await readJSON('site-settings').catch(() => ({}));
  const smtpUser = String(process.env.GMAIL_USER || settings.smtpUser || settings.email || 'protexgroupa@gmail.com').trim();
  const appPass = String(process.env.GMAIL_APP_PASSWORD || settings.gmailAppPassword || '').replace(/\s+/g, '');

  const customerEmail =
    quotationRecord.contact?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quotationRecord.contact.email)
      ? String(quotationRecord.contact.email).trim()
      : '';

  const modelLabel = quotationRecord.model?.name || quotationRecord.officialItems?.[0]?.title || 'PROTEX';

  // Stage 1: Customer submitted a Preliminary Request -> Notify internal PROTEX inbox ONLY (do NOT send signed quote to customer yet)
  if (mode === 'preliminary_internal') {
    const prelimRecord = { ...quotationRecord, docType: 'preliminary', status: 'pending_review' };
    if (!appPass) {
      return {
        emailStatus: 'pending_review',
        emailSender: smtpUser,
        emailRecipients: customerEmail ? [customerEmail] : [],
        emailStatusNote: `รอแอดมินตรวจสอบและกดส่งใบเสนอราคาฉบับทางการกลับไปยัง ${customerEmail || 'อีเมลลูกค้า'}`,
      };
    }

    let nodemailer = null;
    try {
      nodemailer = require('nodemailer');
    } catch (e) {}

    const internalSubject = `[PROTEX รอตรวจสอบใบเสนอราคาเบื้องต้น ${quotationRecord.ref}] ${quotationRecord.contact?.name || ''} - ${modelLabel}`;

    try {
      if (nodemailer) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: appPass },
        });
        await transporter.sendMail({
          from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
          to: 'protexgroupa@gmail.com',
          replyTo: customerEmail || smtpUser,
          subject: internalSubject,
          html: buildQuotationEmailHTML(prelimRecord, true, settings),
        });
      } else {
        await sendRawSmtpMail({
          user: smtpUser,
          pass: appPass,
          from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
          to: ['protexgroupa@gmail.com'],
          replyTo: customerEmail || smtpUser,
          subject: internalSubject,
          html: buildQuotationEmailHTML(prelimRecord, true, settings),
        });
      }
      return {
        emailStatus: 'pending_review',
        emailSender: smtpUser,
        emailRecipients: customerEmail ? [customerEmail] : [],
        emailStatusNote: `แจ้งเตือนทีมงานที่ protexgroupa@gmail.com แล้ว · รอแอดมินตรวจสอบและส่งฉบับทางการไปยัง ${customerEmail || 'ลูกค้า'}`,
      };
    } catch (err) {
      return {
        emailStatus: 'pending_review',
        emailSender: smtpUser,
        emailRecipients: customerEmail ? [customerEmail] : [],
        emailStatusNote: `บันทึกคำขอแล้ว · รอแอดมินตรวจสอบและส่งฉบับทางการไปยัง ${customerEmail || 'ลูกค้า'}`,
      };
    }
  }

  // Stage 2: Admin Verified & Sends Official Signed Quotation back to Customer Gmail
  const officialRecord = {
    ...quotationRecord,
    docType: 'official',
    proposerName: quotationRecord.proposerName || settings.defaultProposerName || 'นายบุญรุ่ง หินดี',
    proposerTitle: quotationRecord.proposerTitle || settings.defaultProposerTitle || 'Sale Engineer',
    proposerTel: quotationRecord.proposerTel || settings.defaultProposerTel || 'Tel. 065-241-5250',
    approverName: quotationRecord.approverName || settings.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี',
    approverTitle: quotationRecord.approverTitle || settings.defaultApproverTitle || 'Managing Director',
  };

  const recipients = [];
  if (customerEmail) recipients.push(customerEmail);
  if (!recipients.includes('protexgroupa@gmail.com')) recipients.push('protexgroupa@gmail.com');

  if (!appPass) {
    return {
      emailStatus: 'pending_smtp',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: `ยืนยันฉบับทางการแล้ว (รอตั้งค่า Gmail App Password 16 หลักของ ${smtpUser} ในหน้าตั้งค่า Admin เพื่อส่งออกจริงไปยัง ${customerEmail || 'อีเมลลูกค้า'})`,
    };
  }

  let nodemailer = null;
  try {
    nodemailer = require('nodemailer');
  } catch (e) {}

  const customerSubject = `ใบเสนอราคาฉบับทางการ PROTEX GROUP (${officialRecord.ref}) — ${modelLabel}`;
  const internalCopySubject = `[สำเนาส่งลูกค้าแล้ว ${officialRecord.ref}] ${officialRecord.contact?.name || ''} - ${modelLabel}`;

  try {
    if (nodemailer) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: appPass },
      });
      if (customerEmail && customerEmail !== 'protexgroupa@gmail.com') {
        await transporter.sendMail({
          from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
          to: customerEmail,
          replyTo: 'protexgroupa@gmail.com',
          subject: customerSubject,
          html: buildQuotationEmailHTML(officialRecord, false, settings),
        });
      }
      await transporter.sendMail({
        from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
        to: 'protexgroupa@gmail.com',
        replyTo: customerEmail || smtpUser,
        subject: internalCopySubject,
        html: buildQuotationEmailHTML(officialRecord, false, settings),
      });
    } else {
      if (customerEmail && customerEmail !== 'protexgroupa@gmail.com') {
        await sendRawSmtpMail({
          user: smtpUser,
          pass: appPass,
          from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
          to: [customerEmail],
          replyTo: 'protexgroupa@gmail.com',
          subject: customerSubject,
          html: buildQuotationEmailHTML(officialRecord, false, settings),
        });
      }
      await sendRawSmtpMail({
        user: smtpUser,
        pass: appPass,
        from: `"PROTEX ACCESSORY INDUSTRIAL" <${smtpUser}>`,
        to: ['protexgroupa@gmail.com'],
        replyTo: customerEmail || smtpUser,
        subject: internalCopySubject,
        html: buildQuotationEmailHTML(officialRecord, false, settings),
      });
    }

    return {
      emailStatus: 'sent',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: `ส่งใบเสนอราคาฉบับทางการจาก ${smtpUser} ไปยัง ${customerEmail || 'protexgroupa@gmail.com'} สำเร็จแล้ว`,
    };
  } catch (err) {
    return {
      emailStatus: 'failed',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: `บันทึกฉบับทางการแล้ว แต่ส่งอีเมลไม่สำเร็จ (${err.message || 'ตรวจสอบ Gmail App Password'})`,
    };
  }
}

async function handleCreateQuotation(req, res) {
  const { config = {}, contact = {}, customRef = '' } = req.body || {};
  const name = String(contact.name || '').trim();
  const phone = String(contact.phone || '').trim();
  const fax = String(contact.fax || '').trim();
  const email = String(contact.email || '').trim();
  const company = String(contact.company || '').trim();
  const note = String(contact.note || '').trim().slice(0, 1000);

  const errors = {};
  if (name.length < 2) errors.name = 'กรุณากรอกชื่อผู้ติดต่อ';
  if (!/^[0-9+\-\s]{9,15}$/.test(phone)) errors.phone = 'กรุณากรอกเบอร์โทร 9–15 หลัก';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'กรุณากรอกอีเมลผู้รับใบเสนอราคาให้ถูกต้อง';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });

  const [plants, accessories, qStore, settings] = await Promise.all([
    readJSON('plants').catch(() => ({ models: [] })),
    readJSON('accessories').catch(() => ({ structureColors: [], items: [] })),
    readJSON('quotations').catch(() => ({ items: [] })),
    readJSON('site-settings').catch(() => ({})),
  ]);

  const model = (plants.models || []).find((m) => m.id === config.modelId) || (plants.models || [])[0];
  const color = (accessories.structureColors || []).find((c) => c.id === config.colorId) || (accessories.structureColors || [])[0];
  if (!model || !color) return res.status(400).json({ ok: false, message: 'ไม่พบรุ่นแพล้นท์หรือสีที่เลือก' });

  const lines = [];
  for (const [id, qtyRaw] of Object.entries(config.items || {})) {
    const item = (accessories.items || []).find((a) => a.id === id);
    const maxQ = item ? Math.max(1, Number(item.maxQty || 1)) : 0;
    const qty = Math.max(0, Math.min(maxQ, Math.floor(Number(qtyRaw) || 0)));
    if (item && qty > 0) {
      const unitPrice = Math.round(Number(item.price) || 0);
      lines.push({
        id,
        name: item.name,
        qty,
        unit: item.unit || 'ชุด',
        unitPrice,
        total: unitPrice * qty,
      });
    }
  }

  const basePrice = Math.round(Number(model.basePrice) || 0);
  const colorSurcharge = Math.round(Number(color.surcharge) || 0);
  const addonsTotal = lines.reduce((s, l) => s + l.total, 0);
  const subtotal = basePrice + colorSurcharge + addonsTotal;
  const vatRate = 7;
  const vatAmount = Math.round(subtotal * 0.07);
  const grandTotal = subtotal + vatAmount;

  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const existingList = Array.isArray(qStore.items) ? qStore.items : [];
  const seq = String(existingList.length + 1).padStart(3, '0');
  const ref = customRef && /^QT-\d{8}-\d{3,4}$/.test(customRef) ? customRef : `QT-${ymd}-${seq}`;
  const validDate = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);

  const attn = String(contact.attn || settings.defaultAttn || 'กรรมการผู้จัดการ').trim();
  const quotationRecord = {
    id: `qt-${Date.now().toString(36)}`,
    ref,
    docType: 'preliminary',
    revision: settings.defaultRevision || 'RE.1',
    attn,
    createdAt: now.toISOString(),
    validUntil: validDate,
    status: 'pending_review',
    salesNote: '',
    deliveryTerm: settings.defaultDeliveryTerm || 'ตามกำหนดการที่ตกลงร่วมกัน',
    priceValidFor: settings.defaultPriceValidFor || '30 วัน นับจากวันที่ออกเอกสาร',
    paymentTerms: Array.isArray(settings.defaultPaymentTerms) && settings.defaultPaymentTerms.length
      ? settings.defaultPaymentTerms
      : QuotationTemplate.DEFAULT_QUOTATION_SETTINGS.defaultPaymentTerms,
    proposerName: '',
    proposerTitle: '',
    proposerTel: '',
    approverName: '',
    approverTitle: '',
    fax,
    contact: { name, phone, fax, email, company, attn, note },
    model: {
      id: model.id,
      name: model.name,
      capacity: model.capacity,
      capacityUnit: model.capacityUnit || 'T/H',
      basePrice,
    },
    color: {
      id: color.id,
      name: color.name,
      nameTh: color.nameTh,
      code: color.code,
      hex: color.hex,
      surcharge: colorSurcharge,
    },
    lines,
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    currency: accessories.currency || 'THB',
  };

  const mailResult = await dispatchQuotationEmails(quotationRecord, { mode: 'preliminary_internal' });
  Object.assign(quotationRecord, mailResult);

  existingList.unshift(quotationRecord);
  await writeJSON('quotations', { items: existingList });
  await fs.appendFile(path.join(DATA_DIR, 'quote-requests.jsonl'), `${JSON.stringify(quotationRecord)}\n`, 'utf8').catch(() => {});

  res.json({
    ok: true,
    ref: quotationRecord.ref,
    total: subtotal,
    subtotal,
    vatAmount,
    grandTotal,
    currency: quotationRecord.currency,
    quotation: quotationRecord,
  });
}

app.post('/api/quotations', asyncRoute(handleCreateQuotation));
app.post('/api/quote', asyncRoute(handleCreateQuotation));

/* ---------------------------- Admin Quotations Management APIs ---------------------------- */
app.get('/api/admin/quotations', requireAdmin, asyncRoute(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const data = await readJSON('quotations').catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  res.json({ ok: true, items });
}));

const VALID_QUOTATION_STATUSES = ['pending_review', 'verified_sent', 'new', 'contacted', 'closed'];

function applyAdminQuotationPayloadToRecord(item, payload, settings) {
  if (payload.status && VALID_QUOTATION_STATUSES.includes(payload.status)) {
    item.status = payload.status;
  }
  if (payload.docType === 'preliminary' || payload.docType === 'official') {
    item.docType = payload.docType;
  }
  if (payload.salesNote !== undefined) item.salesNote = String(payload.salesNote).trim();
  if (payload.ref) item.ref = String(payload.ref).trim();
  if (payload.revision !== undefined) item.revision = String(payload.revision).trim();
  if (payload.attn !== undefined) item.attn = String(payload.attn).trim();
  if (payload.fax !== undefined) item.fax = String(payload.fax).trim();
  if (payload.issueDateDisplay !== undefined) item.issueDateDisplay = String(payload.issueDateDisplay).trim();
  if (payload.contact && typeof payload.contact === 'object') {
    item.contact = { ...(item.contact || {}), ...payload.contact };
  }
  if (Array.isArray(payload.officialItems)) item.officialItems = payload.officialItems;
  if (payload.specialDiscount !== undefined) item.specialDiscount = Math.max(0, Number(payload.specialDiscount || 0));
  if (payload.remarkNote !== undefined) item.remarkNote = String(payload.remarkNote).trim();
  if (payload.deliveryTerm !== undefined) item.deliveryTerm = String(payload.deliveryTerm).trim();
  if (payload.priceValidFor !== undefined) item.priceValidFor = String(payload.priceValidFor).trim();
  if (Array.isArray(payload.paymentTerms)) item.paymentTerms = payload.paymentTerms;
  if (payload.proposerName !== undefined) item.proposerName = String(payload.proposerName).trim();
  if (payload.proposerTitle !== undefined) item.proposerTitle = String(payload.proposerTitle).trim();
  if (payload.proposerTel !== undefined) item.proposerTel = String(payload.proposerTel).trim();
  if (payload.approverName !== undefined) item.approverName = String(payload.approverName).trim();
  if (payload.approverTitle !== undefined) item.approverTitle = String(payload.approverTitle).trim();

  const norm = QuotationTemplate.normalizeQuotationData(item, settings);
  item.subtotal = norm.netBeforeVat;
  item.vatAmount = norm.vatAmount;
  item.grandTotal = norm.grandTotal;
  item.updatedAt = new Date().toISOString();
}

app.post('/api/admin/quotations', requireAdmin, asyncRoute(async (req, res) => {
  const payload = req.body || {};
  const [data, settings] = await Promise.all([
    readJSON('quotations').catch(() => ({ items: [] })),
    readJSON('site-settings').catch(() => ({})),
  ]);
  const items = Array.isArray(data.items) ? data.items : [];
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(items.length + 1).padStart(3, '0');
  const docType = payload.docType === 'preliminary' ? 'preliminary' : 'official';
  const record = {
    id: payload.id || `qt-${Date.now().toString(36)}`,
    ref: String(payload.ref || `QT-${ymd}-${seq}`).trim(),
    docType,
    revision: String(payload.revision || settings.defaultRevision || 'RE.1').trim(),
    attn: String(payload.attn || settings.defaultAttn || 'กรรมการผู้จัดการ').trim(),
    fax: String(payload.fax || payload.contact?.fax || '').trim(),
    issueDateDisplay: String(payload.issueDateDisplay || '').trim(),
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: VALID_QUOTATION_STATUSES.includes(payload.status) ? payload.status : docType === 'preliminary' ? 'pending_review' : 'verified_sent',
    salesNote: String(payload.salesNote || '').trim(),
    contact: payload.contact || { name: '', phone: '', fax: '', company: '', email: '', note: '' },
    officialItems: Array.isArray(payload.officialItems) ? payload.officialItems : [],
    specialDiscount: Math.max(0, Number(payload.specialDiscount || 0)),
    remarkNote: String(payload.remarkNote || '').trim(),
    deliveryTerm: String(payload.deliveryTerm || settings.defaultDeliveryTerm || 'ตามกำหนดการที่ตกลงร่วมกัน').trim(),
    priceValidFor: String(payload.priceValidFor || settings.defaultPriceValidFor || '30 วัน นับจากวันที่ออกเอกสาร').trim(),
    paymentTerms: Array.isArray(payload.paymentTerms) ? payload.paymentTerms : [],
    proposerName:
      payload.proposerName !== undefined
        ? String(payload.proposerName).trim()
        : docType === 'preliminary'
        ? ''
        : String(settings.defaultProposerName || 'นายบุญรุ่ง หินดี').trim(),
    proposerTitle:
      payload.proposerTitle !== undefined
        ? String(payload.proposerTitle).trim()
        : docType === 'preliminary'
        ? ''
        : String(settings.defaultProposerTitle || 'Sale Engineer').trim(),
    proposerTel:
      payload.proposerTel !== undefined
        ? String(payload.proposerTel).trim()
        : docType === 'preliminary'
        ? ''
        : String(settings.defaultProposerTel || 'Tel. 065-241-5250').trim(),
    approverName:
      payload.approverName !== undefined
        ? String(payload.approverName).trim()
        : docType === 'preliminary'
        ? ''
        : String(settings.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี').trim(),
    approverTitle:
      payload.approverTitle !== undefined
        ? String(payload.approverTitle).trim()
        : docType === 'preliminary'
        ? ''
        : String(settings.defaultApproverTitle || 'Managing Director').trim(),
    vatRate: 7,
    currency: 'THB',
    emailStatus: 'pending_smtp',
    emailSender: settings.smtpUser || 'protexgroupa@gmail.com',
    emailRecipients: [payload.contact?.email, 'protexgroupa@gmail.com'].filter(Boolean),
    emailStatusNote: 'สร้างใบเสนอราคาโดยแอดมินเรียบร้อยแล้ว',
  };
  const norm = QuotationTemplate.normalizeQuotationData(record, settings);
  record.subtotal = norm.netBeforeVat;
  record.vatAmount = norm.vatAmount;
  record.grandTotal = norm.grandTotal;

  items.unshift(record);
  await writeJSON('quotations', { items });
  res.json({ ok: true, item: record, message: `สร้างใบเสนอราคา ${record.ref} เรียบร้อยแล้ว` });
}));

async function handleAdminUpdateQuotation(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  const [data, settings] = await Promise.all([
    readJSON('quotations').catch(() => ({ items: [] })),
    readJSON('site-settings').catch(() => ({})),
  ]);
  const items = Array.isArray(data.items) ? data.items : [];
  const item = items.find((x) => x.id === id || x.ref === id);
  if (!item) return res.status(404).json({ ok: false, message: 'ไม่พบใบเสนอราคาที่ระบุ' });

  applyAdminQuotationPayloadToRecord(item, payload, settings);

  await writeJSON('quotations', { items });
  res.json({ ok: true, item, message: `บันทึกใบเสนอราคา ${item.ref} เรียบร้อยแล้ว` });
}

app.put('/api/admin/quotations/:id', requireAdmin, asyncRoute(handleAdminUpdateQuotation));
app.patch('/api/admin/quotations/:id', requireAdmin, asyncRoute(handleAdminUpdateQuotation));

async function handleAdminVerifyAndSendQuotation(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  const [data, settings] = await Promise.all([
    readJSON('quotations').catch(() => ({ items: [] })),
    readJSON('site-settings').catch(() => ({})),
  ]);
  const items = Array.isArray(data.items) ? data.items : [];
  const item = items.find((x) => x.id === id || x.ref === id);
  if (!item) return res.status(404).json({ ok: false, message: 'ไม่พบใบเสนอราคาที่ระบุ' });

  if (payload && typeof payload === 'object' && Object.keys(payload).length) {
    applyAdminQuotationPayloadToRecord(item, payload, settings);
  }

  // Promote to Verified Official Quotation & ensure proposer/approver are populated
  item.docType = 'official';
  item.status = 'verified_sent';
  if (!String(item.proposerName || '').trim()) {
    item.proposerName = String(settings.defaultProposerName || 'นายบุญรุ่ง หินดี').trim();
    item.proposerTitle = String(item.proposerTitle || settings.defaultProposerTitle || 'Sale Engineer').trim();
    item.proposerTel = String(item.proposerTel || settings.defaultProposerTel || 'Tel. 065-241-5250').trim();
  }
  if (!String(item.approverName || '').trim()) {
    item.approverName = String(settings.defaultApproverName || 'คุณสมศักดิ์ ประคองศรี').trim();
    item.approverTitle = String(item.approverTitle || settings.defaultApproverTitle || 'Managing Director').trim();
  }

  const norm = QuotationTemplate.normalizeQuotationData(item, settings);
  item.subtotal = norm.netBeforeVat;
  item.vatAmount = norm.vatAmount;
  item.grandTotal = norm.grandTotal;

  const nowISO = new Date().toISOString();
  const mailResult = await dispatchQuotationEmails(item, { mode: 'official_customer' });
  Object.assign(item, mailResult, {
    verifiedAt: item.verifiedAt || nowISO,
    lastEmailedAt: nowISO,
    updatedAt: nowISO,
  });

  await writeJSON('quotations', { items });

  res.json({
    ok: true,
    item,
    emailStatus: item.emailStatus,
    message: item.emailStatusNote,
  });
}

app.post('/api/admin/quotations/:id/verify-and-send', requireAdmin, asyncRoute(handleAdminVerifyAndSendQuotation));
app.post('/api/admin/quotations/:id/resend-email', requireAdmin, asyncRoute(handleAdminVerifyAndSendQuotation));

app.delete('/api/admin/quotations/:id', requireAdmin, asyncRoute(async (req, res) => {
  const { id } = req.params;
  const data = await readJSON('quotations').catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  const nextItems = items.filter((x) => x.id !== id && x.ref !== id);
  await writeJSON('quotations', { items: nextItems });
  res.json({ ok: true, message: 'ลบรายการใบเสนอราคาเรียบร้อยแล้ว' });
}));

/* ---------------------------- Spare Parts Orders & Gmail Notification (`protexgroupa@gmail.com`) ---------------------------- */
function buildOrderEmailHTML(ord, isInternalAlert) {
  const linesHTML = (ord.lines || [])
    .map(
      (l, i) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#475569;">${i + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;color:#0F172A;font-weight:700;">
          ${escHTML(l.name)}
          ${l.sku ? `<div style="font-size:11px;color:#64748B;font-weight:600;">SKU: ${escHTML(l.sku)}</div>` : ''}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:center;color:#334155;">${l.qty} ${escHTML(l.unit || 'ชิ้น')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:right;color:#334155;">${fmtTHB(l.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #E2E8F0;text-align:right;color:#0F172A;font-weight:800;">${fmtTHB(l.total)}</td>
      </tr>`
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html lang="th">
  <head><meta charset="utf-8"></head>
  <body style="margin:0;padding:24px;background:#F1F5F9;font-family:'IBM Plex Sans Thai',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0F172A;">
    <div style="max-width:680px;margin:0 auto;background:#FFFFFF;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
      <div style="background:linear-gradient(135deg,#DC2626 0%,#991B1B 100%);padding:24px 28px;color:#FFFFFF;">
        <div style="font-size:12px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;opacity:0.9;">PROTEX GROUP CO., LTD. — OEM SPARE PARTS ORDER</div>
        <h1 style="margin:6px 0 4px;font-size:22px;font-weight:800;">${isInternalAlert ? `แจ้งเตือนคำสั่งซื้ออะไหล่ใหม่ (${escHTML(ord.ref)})` : `ยืนยันคำสั่งซื้ออะไหล่แท้ PROTEX (${escHTML(ord.ref)})`}</h1>
        <div style="font-size:13px;opacity:0.92;">โทร 085-392-4448 · LINE: protex000 · อีเมล protexgroupa@gmail.com</div>
      </div>

      <div style="padding:26px 28px;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;background:#F8FAFC;border-radius:12px;padding:14px;">
          <tr>
            <td style="padding:12px 16px;vertical-align:top;width:62%;">
              <div style="font-size:11px;font-weight:700;color:#DC2626;text-transform:uppercase;">ข้อมูลผู้สั่งซื้อและสถานที่จัดส่ง</div>
              <div style="font-size:16px;font-weight:800;color:#0F172A;margin-top:4px;">${escHTML(ord.customer?.name)}</div>
              <div style="font-size:13px;color:#334155;margin-top:2px;">บริษัท/หน่วยงาน: <strong>${escHTML(ord.customer?.company || '-')}</strong></div>
              <div style="font-size:13px;color:#334155;margin-top:2px;">เบอร์โทรศัพท์: <strong>${escHTML(ord.customer?.phone)}</strong></div>
              <div style="font-size:13px;color:#334155;margin-top:2px;">อีเมล: <strong>${escHTML(ord.customer?.email || '-')}</strong></div>
              <div style="font-size:13px;color:#0F172A;margin-top:6px;">ที่อยู่จัดส่ง: <strong>${escHTML(ord.customer?.address || '-')}</strong></div>
            </td>
            <td style="padding:12px 16px;vertical-align:top;text-align:right;">
              <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;">เลขที่คำสั่งซื้อ</div>
              <div style="font-size:16px;font-weight:800;color:#DC2626;margin-top:2px;">${escHTML(ord.ref)}</div>
              <div style="font-size:12px;color:#475569;margin-top:6px;">วันที่สั่งซื้อ: ${escHTML((ord.createdAt || '').slice(0, 10))}</div>
              <div style="font-size:12px;color:#059669;font-weight:700;margin-top:2px;">Express Dispatch 24–48 ชม.</div>
            </td>
          </tr>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#0F172A;color:#FFFFFF;">
              <th style="padding:10px 12px;text-align:left;border-radius:8px 0 0 0;">#</th>
              <th style="padding:10px 12px;text-align:left;">รายการสินค้าอะไหล่แท้ PROTEX</th>
              <th style="padding:10px 12px;text-align:center;">จำนวน</th>
              <th style="padding:10px 12px;text-align:right;">ราคา/หน่วย</th>
              <th style="padding:10px 12px;text-align:right;border-radius:0 8px 0 0;">จำนวนเงิน (THB)</th>
            </tr>
          </thead>
          <tbody>
            ${linesHTML}
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
          <tr>
            <td style="padding:6px 12px;text-align:right;color:#475569;">ราคารวมก่อนภาษี (Subtotal):</td>
            <td style="padding:6px 12px;text-align:right;width:160px;font-weight:700;color:#0F172A;">${fmtTHB(ord.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;text-align:right;color:#475569;">ภาษีมูลค่าเพิ่ม VAT 7%:</td>
            <td style="padding:6px 12px;text-align:right;font-weight:700;color:#0F172A;">${fmtTHB(ord.vatAmount)}</td>
          </tr>
          <tr style="background:#FEF2F2;">
            <td style="padding:12px;text-align:right;font-weight:800;color:#991B1B;border-radius:10px 0 0 10px;">ยอดรวมสุทธิทั้งสิ้น (Grand Total):</td>
            <td style="padding:12px;text-align:right;font-size:18px;font-weight:900;color:#DC2626;border-radius:0 10px 10px 0;">${fmtTHB(ord.grandTotal)}</td>
          </tr>
        </table>
      </div>
    </div>
  </body>
  </html>`;
}

async function dispatchOrderEmails(orderRecord) {
  const settings = await readJSON('site-settings').catch(() => ({}));
  const smtpUser = String(process.env.GMAIL_USER || settings.smtpUser || settings.email || 'protexgroupa@gmail.com').trim();
  const appPass = String(process.env.GMAIL_APP_PASSWORD || settings.gmailAppPassword || '').replace(/\s+/g, '');

  const recipients = ['protexgroupa@gmail.com'];
  if (orderRecord.customer?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orderRecord.customer.email)) {
    if (!recipients.includes(orderRecord.customer.email)) {
      recipients.push(orderRecord.customer.email);
    }
  }

  if (!appPass) {
    return {
      emailStatus: 'pending_smtp',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: 'บันทึกคำสั่งซื้อแล้ว (รอตั้งค่า Gmail App Password 16 หลักของ protexgroupa@gmail.com ในหน้าตั้งค่า Admin)',
    };
  }

  const internalSubject = `[คำสั่งซื้ออะไหล่ใหม่ #${orderRecord.ref}] ${orderRecord.customer?.name} (${fmtTHB(orderRecord.grandTotal)})`;
  const customerSubject = `ยืนยันคำสั่งซื้ออะไหล่แท้ PROTEX GROUP (#${orderRecord.ref})`;

  try {
    await sendRawSmtpMail({
      user: smtpUser,
      pass: appPass,
      from: `"PROTEX GROUP Spare Parts" <${smtpUser}>`,
      to: ['protexgroupa@gmail.com'],
      replyTo: orderRecord.customer?.email || smtpUser,
      subject: internalSubject,
      html: buildOrderEmailHTML(orderRecord, true),
    });
    if (orderRecord.customer?.email && orderRecord.customer.email !== 'protexgroupa@gmail.com') {
      await sendRawSmtpMail({
        user: smtpUser,
        pass: appPass,
        from: `"PROTEX GROUP" <${smtpUser}>`,
        to: [orderRecord.customer.email],
        replyTo: 'protexgroupa@gmail.com',
        subject: customerSubject,
        html: buildOrderEmailHTML(orderRecord, false),
      });
    }
    return {
      emailStatus: 'sent',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: `ส่งอีเมลคำสั่งซื้อจาก ${smtpUser} ไปยัง ${recipients.join(', ')} สำเร็จแล้ว`,
    };
  } catch (err) {
    return {
      emailStatus: 'failed',
      emailSender: smtpUser,
      emailRecipients: recipients,
      emailStatusNote: `บันทึกคำสั่งซื้อแล้ว แต่ส่งอีเมลไม่สำเร็จ (${err.message || 'ตรวจสอบ Gmail App Password'})`,
    };
  }
}

const VALID_ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled'];
const VALID_PAYMENT_STATUSES = ['unpaid', 'paid', 'credit'];

function recalculateOrderTotals(lines = [], discountAmount = 0, shippingFee = 0) {
  const cleanLines = (Array.isArray(lines) ? lines : [])
    .map((l, idx) => {
      const qty = Math.max(1, Math.min(9999, Math.floor(Number(l.qty) || 1)));
      const unitPrice = Math.max(0, Math.round(Number(l.unitPrice) || 0));
      return {
        id: String(l.id || `sp-${idx + 1}`),
        sku: String(l.sku || '').trim(),
        name: String(l.name || 'อะไหล่แท้ PROTEX').trim(),
        unit: String(l.unit || 'ชิ้น').trim(),
        qty,
        unitPrice,
        total: unitPrice * qty,
      };
    })
    .filter((l) => l.name && l.qty > 0);

  const totalQty = cleanLines.reduce((s, l) => s + l.qty, 0);
  const itemsSubtotal = cleanLines.reduce((s, l) => s + l.total, 0);
  const cleanDiscount = Math.max(0, Math.round(Number(discountAmount) || 0));
  const cleanShipping = Math.max(0, Math.round(Number(shippingFee) || 0));
  const subtotal = Math.max(0, itemsSubtotal - cleanDiscount + cleanShipping);
  const vatRate = 7;
  const vatAmount = Math.round(subtotal * 0.07);
  const grandTotal = subtotal + vatAmount;

  return {
    lines: cleanLines,
    totalQty,
    itemsSubtotal,
    discountAmount: cleanDiscount,
    shippingFee: cleanShipping,
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
  };
}

app.post('/api/orders', asyncRoute(async (req, res) => {
  const { customer = {}, items = [] } = req.body || {};
  const name = String(customer.name || '').trim();
  const phone = String(customer.phone || '').trim();
  const company = String(customer.company || '').trim();
  const email = String(customer.email || '').trim();
  const address = String(customer.address || '').trim();
  const note = String(customer.note || customer.taxInfo || '').trim();

  const errors = {};
  if (name.length < 2) errors.name = 'กรุณากรอกชื่อผู้สั่งซื้อ';
  if (!/^[0-9+\-\s]{9,15}$/.test(phone)) errors.phone = 'กรุณากรอกเบอร์โทร 9–15 หลัก';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  if (address.length < 5) errors.address = 'กรุณากรอกที่อยู่จัดส่ง';
  if (!Array.isArray(items) || !items.length) errors.items = 'กรุณาเลือกสินค้าอะไหล่อย่างน้อย 1 รายการ';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors, message: Object.values(errors)[0] });

  const [spData, ordStore] = await Promise.all([
    readJSON('spare-parts').catch(() => ({ catalog: [] })),
    readJSON('orders').catch(() => ({ items: [] })),
  ]);

  const catalog = Array.isArray(spData.catalog) ? spData.catalog : [];
  const rawLines = [];
  for (const entry of items) {
    const found = catalog.find((c) => c.id === entry.id);
    const qty = Math.max(1, Math.min(999, Math.floor(Number(entry.qty) || 1)));
    const unitPrice = Math.round(Number(found ? found.price : entry.unitPrice) || 0);
    if (unitPrice <= 0) continue;
    rawLines.push({
      id: found ? found.id : String(entry.id || `sp-${rawLines.length + 1}`),
      sku: found ? found.sku || '' : String(entry.sku || ''),
      name: found ? found.name : String(entry.name || 'อะไหล่แท้ PROTEX'),
      unit: found ? found.unit || 'ชิ้น' : String(entry.unit || 'ชิ้น'),
      qty,
      unitPrice,
    });
  }

  const calc = recalculateOrderTotals(rawLines, 0, 0);
  if (!calc.lines.length) {
    return res.status(400).json({ ok: false, message: 'ไม่พบรายการสินค้าอะไหล่ที่สามารถสั่งซื้อได้' });
  }

  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const existingList = Array.isArray(ordStore.items) ? ordStore.items : [];
  const seq = String(existingList.length + 1).padStart(3, '0');
  const ref = `ORD-${ymd}-${seq}`;

  const orderRecord = {
    id: `ord-${Date.now().toString(36)}`,
    ref,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    source: 'website_cart',
    status: 'pending',
    paymentStatus: 'unpaid',
    carrier: '',
    trackingNo: '',
    taxInvoiceNo: '',
    salesOwner: '',
    internalNote: '',
    customer: { name, phone, company, email, address, note },
    ...calc,
    currency: 'THB',
  };

  const mailResult = await dispatchOrderEmails(orderRecord);
  Object.assign(orderRecord, mailResult);

  existingList.unshift(orderRecord);
  await writeJSON('orders', { items: existingList });

  res.json({
    ok: true,
    ref: orderRecord.ref,
    order: orderRecord,
    message: 'บันทึกคำสั่งซื้ออะไหล่เรียบร้อยแล้ว',
  });
}));

/* ---------------------------- Admin Orders & Key-in Management APIs ---------------------------- */
app.get('/api/admin/orders', requireAdmin, asyncRoute(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const data = await readJSON('orders').catch(() => ({ items: [] }));
  res.json({ ok: true, items: Array.isArray(data.items) ? data.items : [] });
}));

app.post('/api/admin/orders', requireAdmin, asyncRoute(async (req, res) => {
  const payload = req.body || {};
  const cust = payload.customer || {};
  const name = String(cust.name || '').trim();
  const phone = String(cust.phone || '').trim();
  if (!name || !phone) {
    return res.status(422).json({ ok: false, message: 'กรุณากรอกชื่อผู้สั่งซื้อและเบอร์โทรศัพท์' });
  }

  const calc = recalculateOrderTotals(payload.lines || [], payload.discountAmount, payload.shippingFee);
  if (!calc.lines.length) {
    return res.status(422).json({ ok: false, message: 'กรุณาเพิ่มรายการอะไหล่ในคำสั่งซื้ออย่างน้อย 1 รายการ' });
  }

  const ordStore = await readJSON('orders').catch(() => ({ items: [] }));
  const existingList = Array.isArray(ordStore.items) ? ordStore.items : [];
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(existingList.length + 1).padStart(3, '0');
  const ref = payload.ref && /^ORD-/.test(String(payload.ref)) ? String(payload.ref).trim() : `ORD-${ymd}-${seq}`;

  const orderRecord = {
    id: `ord-${Date.now().toString(36)}`,
    ref,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    source: payload.source || 'admin_keyin',
    status: VALID_ORDER_STATUSES.includes(payload.status) ? payload.status : 'confirmed',
    paymentStatus: VALID_PAYMENT_STATUSES.includes(payload.paymentStatus) ? payload.paymentStatus : 'unpaid',
    carrier: String(payload.carrier || '').trim(),
    trackingNo: String(payload.trackingNo || '').trim(),
    taxInvoiceNo: String(payload.taxInvoiceNo || '').trim(),
    salesOwner: String(payload.salesOwner || '').trim(),
    internalNote: String(payload.internalNote || '').trim(),
    customer: {
      name,
      phone,
      company: String(cust.company || '').trim(),
      email: String(cust.email || '').trim(),
      address: String(cust.address || '').trim(),
      note: String(cust.note || '').trim(),
    },
    ...calc,
    currency: 'THB',
    emailStatus: 'pending_smtp',
    emailSender: 'protexgroupa@gmail.com',
    emailRecipients: ['protexgroupa@gmail.com', String(cust.email || '').trim()].filter(Boolean),
    emailStatusNote: 'คีย์คำสั่งซื้อโดยแอดมินหลังบ้านเรียบร้อยแล้ว',
  };

  existingList.unshift(orderRecord);
  await writeJSON('orders', { items: existingList });
  res.json({ ok: true, item: orderRecord, message: `คีย์คำสั่งซื้อ ${orderRecord.ref} บันทึกลงระบบเรียบร้อยแล้ว` });
}));

async function handleAdminUpdateOrder(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  const data = await readJSON('orders').catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  const item = items.find((x) => x.id === id || x.ref === id);
  if (!item) return res.status(404).json({ ok: false, message: 'ไม่พบคำสั่งซื้อที่ระบุ' });

  if (payload.status && VALID_ORDER_STATUSES.includes(payload.status)) {
    item.status = payload.status;
  }
  if (payload.paymentStatus && VALID_PAYMENT_STATUSES.includes(payload.paymentStatus)) {
    item.paymentStatus = payload.paymentStatus;
  }
  if (payload.carrier !== undefined) item.carrier = String(payload.carrier || '').trim();
  if (payload.trackingNo !== undefined) item.trackingNo = String(payload.trackingNo || '').trim();
  if (payload.taxInvoiceNo !== undefined) item.taxInvoiceNo = String(payload.taxInvoiceNo || '').trim();
  if (payload.salesOwner !== undefined) item.salesOwner = String(payload.salesOwner || '').trim();
  if (payload.internalNote !== undefined) item.internalNote = String(payload.internalNote || '').trim();

  if (payload.customer && typeof payload.customer === 'object') {
    item.customer = {
      name: String(payload.customer.name ?? item.customer?.name ?? '').trim(),
      phone: String(payload.customer.phone ?? item.customer?.phone ?? '').trim(),
      company: String(payload.customer.company ?? item.customer?.company ?? '').trim(),
      email: String(payload.customer.email ?? item.customer?.email ?? '').trim(),
      address: String(payload.customer.address ?? item.customer?.address ?? '').trim(),
      note: String(payload.customer.note ?? item.customer?.note ?? '').trim(),
    };
  }

  if (Array.isArray(payload.lines) || payload.discountAmount !== undefined || payload.shippingFee !== undefined) {
    const calc = recalculateOrderTotals(
      Array.isArray(payload.lines) ? payload.lines : item.lines,
      payload.discountAmount !== undefined ? payload.discountAmount : item.discountAmount,
      payload.shippingFee !== undefined ? payload.shippingFee : item.shippingFee
    );
    Object.assign(item, calc);
  }

  item.updatedAt = new Date().toISOString();
  await writeJSON('orders', { items });
  res.json({ ok: true, item, message: `บันทึกข้อมูลคำสั่งซื้อ ${item.ref} เรียบร้อยแล้ว` });
}

app.put('/api/admin/orders/:id', requireAdmin, asyncRoute(handleAdminUpdateOrder));
app.patch('/api/admin/orders/:id', requireAdmin, asyncRoute(handleAdminUpdateOrder));

app.post('/api/admin/orders/:id/resend-email', requireAdmin, asyncRoute(async (req, res) => {
  const { id } = req.params;
  const data = await readJSON('orders').catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  const item = items.find((x) => x.id === id || x.ref === id);
  if (!item) return res.status(404).json({ ok: false, message: 'ไม่พบคำสั่งซื้อที่ระบุ' });

  const mailResult = await dispatchOrderEmails(item);
  Object.assign(item, mailResult, { lastEmailedAt: new Date().toISOString() });
  await writeJSON('orders', { items });

  res.json({
    ok: true,
    item,
    emailStatus: item.emailStatus,
    message: item.emailStatusNote,
  });
}));

app.delete('/api/admin/orders/:id', requireAdmin, asyncRoute(async (req, res) => {
  const { id } = req.params;
  const data = await readJSON('orders').catch(() => ({ items: [] }));
  const items = Array.isArray(data.items) ? data.items : [];
  const nextItems = items.filter((x) => x.id !== id && x.ref !== id);
  await writeJSON('orders', { items: nextItems });
  res.json({ ok: true, message: 'ลบรายการคำสั่งซื้ออะไหล่เรียบร้อยแล้ว' });
}));

app.post('/api/admin/test-smtp', requireAdmin, asyncRoute(async (req, res) => {
  const { smtpUser = 'protexgroupa@gmail.com', gmailAppPassword = '' } = req.body || {};
  const settings = await readJSON('site-settings').catch(() => ({}));
  if (smtpUser) settings.smtpUser = String(smtpUser).trim();
  if (gmailAppPassword) settings.gmailAppPassword = String(gmailAppPassword).replace(/\s+/g, '');
  await writeJSON('site-settings', settings);

  const sampleQuote = {
    ref: 'QT-TEST-SMTP',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    contact: {
      name: 'ทดสอบระบบส่งอีเมล PROTEX Admin',
      phone: settings.phone || '085-392-4448',
      company: 'PROTEX GROUP CO., LTD.',
      email: settings.smtpUser || 'protexgroupa@gmail.com',
      note: 'ทดสอบการเชื่อมต่อ Gmail SMTP (smtp.gmail.com:465)',
    },
    model: { name: 'MODEL PT-1510RAP', capacity: '110-130', capacityUnit: 'T/H', basePrice: 36900000 },
    color: { nameTh: 'แดงคริมสัน', code: 'RAL 3020', surcharge: 0 },
    lines: [],
    subtotal: 36900000,
    vatAmount: 2583000,
    grandTotal: 39483000,
  };

  const result = await dispatchQuotationEmails(sampleQuote);
  res.json({
    ok: result.emailStatus === 'sent',
    emailStatus: result.emailStatus,
    message: result.emailStatusNote,
  });
}));

/* ---------------------------- Contact Inquiry ---------------------------- */
app.post('/api/inquiry', asyncRoute(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const company = String(body.company || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();
  const topic = String(body.topic || 'general').trim();
  const message = String(body.message || '').trim().slice(0, 1500);
  const errors = {};
  if (name.length < 2) errors.name = 'กรุณากรอกชื่อ-นามสกุล';
  if (!/^[0-9+\-\s]{9,15}$/.test(phone)) errors.phone = 'กรุณากรอกเบอร์โทร 9–15 หลัก';
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
  if (message.length < 5) errors.message = 'กรุณาระบุรายละเอียดที่ต้องการสอบถาม';
  if (Object.keys(errors).length) return res.status(422).json({ ok: false, errors });

  const ref = `INQ-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const record = { ref, createdAt: new Date().toISOString(), name, company, phone, email, topic, message };
  await fs.appendFile(path.join(DATA_DIR, 'inquiries.jsonl'), `${JSON.stringify(record)}\n`, 'utf8').catch(() => {});
  res.json({ ok: true, ref, message: 'ส่งข้อมูลเรียบร้อย ทีมวิศวกรจะติดต่อกลับโดยเร็วที่สุด' });
}));

/* ---------------------------- Public & Protected Collections (Live No-Cache) ---------------------------- */
app.get('/api/:collection', asyncRoute(async (req, res) => {
  let { collection } = req.params;
  if (collection === 'popups') collection = 'popup';
  if (collection === 'projects') collection = 'locations';
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ ok: false, message: 'Unknown collection' });

  // Orders and Quotations are private to internal admin
  if (collection === 'orders' || collection === 'quotations') {
    return requireAdmin(req, res, async () => {
      const data = await readJSON(collection);
      res.json(data);
    });
  }

  const data = await readJSON(collection);
  if (collection === 'site-settings' && data && typeof data === 'object') {
    const publicSettings = { ...data };
    delete publicSettings.adminPassword;
    delete publicSettings.gmailAppPassword;
    publicSettings.hasSmtpPassword = Boolean(data.gmailAppPassword || process.env.GMAIL_APP_PASSWORD);
    return res.json(publicSettings);
  }
  res.json(data);
}));

app.use('/api', (req, res) => res.status(404).json({ ok: false, message: 'Not found' }));

/* ---------------------------- Static frontend ---------------------------- */
app.use(express.static(FRONTEND_DIR, { extensions: ['html'], maxAge: 0, etag: true }));

app.use((req, res) => res.status(404).sendFile(path.join(FRONTEND_DIR, 'index.html')));

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error(err);
  const status = err instanceof SyntaxError ? 400 : 500;
  res.status(status).json({ ok: false, message: status === 400 ? 'ข้อมูลที่ส่งมาไม่ถูกต้อง' : 'เซิร์ฟเวอร์ขัดข้อง กรุณาลองใหม่' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n  Protex Group CMS is running →  http://localhost:${PORT}\n`);
  });
}

module.exports = app;
