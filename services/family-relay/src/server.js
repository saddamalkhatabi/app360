'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_PORT = Number(process.env.PORT || 8787);
const DEFAULT_HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_ROOT = path.resolve(process.env.APP360_ROOT || path.join(__dirname, '..', '..', '..'));
const WS_PATH = '/family-ws';
const HOST_GRACE_MS = Math.max(5000, Number(process.env.FAMILY_HOST_GRACE_MS || 15000));
const PENDING_CONNECT_MS = Math.max(HOST_GRACE_MS, Number(process.env.FAMILY_PENDING_CONNECT_MS || 18000));
const MAX_MESSAGE_BYTES = Math.max(64 * 1024, Number(process.env.FAMILY_MAX_MESSAGE_BYTES || 256 * 1024));
const RATE_WINDOW_MS = 10000;
const RATE_MAX = Math.max(60, Number(process.env.FAMILY_RATE_MAX || 240));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

function safeId(value, max = 96) {
  return String(value || '').replace(/[^a-zA-Z0-9_.:-]/g, '').slice(0, max);
}
function isHostPeerId(id) { return /^app360fam-[a-z0-9_-]{1,40}$/i.test(String(id || '')); }
function json(res, code, body) {
  const text = JSON.stringify(body);
  res.writeHead(code, {'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(text)});
  res.end(text);
}
function normalizeWsPath(url) {
  try { return new URL(url || '/', 'http://app360.local').pathname; } catch (_) { return '/'; }
}
function sameOriginAllowed(req, allowedOrigins) {
  const origin = String(req.headers.origin || '');
  if (!origin) return true;
  if (allowedOrigins && allowedOrigins.length) return allowedOrigins.includes(origin);
  try {
    const o = new URL(origin);
    return o.host === String(req.headers.host || '');
  } catch (_) { return false; }
}

function wsAcceptKey(key) {
  return crypto.createHash('sha1').update(String(key) + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
}
function encodeFrame(opcode, payload) {
  const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || '');
  let header;
  if (data.length < 126) {
    header = Buffer.allocUnsafe(2); header[0] = 0x80 | opcode; header[1] = data.length;
  } else if (data.length <= 0xffff) {
    header = Buffer.allocUnsafe(4); header[0] = 0x80 | opcode; header[1] = 126; header.writeUInt16BE(data.length, 2);
  } else {
    header = Buffer.allocUnsafe(10); header[0] = 0x80 | opcode; header[1] = 127; header.writeBigUInt64BE(BigInt(data.length), 2);
  }
  return Buffer.concat([header, data]);
}
function wsSend(client, message) {
  if (!client || client.closed || !client.socket || client.socket.destroyed) return false;
  let text;
  try { text = typeof message === 'string' ? message : JSON.stringify(message); } catch (_) { return false; }
  if (Buffer.byteLength(text) > MAX_MESSAGE_BYTES) return false;
  try { client.socket.write(encodeFrame(0x1, text)); return true; } catch (_) { return false; }
}
function wsClose(client, code = 1000, reason = '') {
  if (!client || client.closed) return;
  client.closed = true;
  const reasonBuf = Buffer.from(String(reason || '').slice(0, 120));
  const payload = Buffer.allocUnsafe(2 + reasonBuf.length); payload.writeUInt16BE(code, 0); reasonBuf.copy(payload, 2);
  try { client.socket.write(encodeFrame(0x8, payload)); } catch (_) {}
  try { client.socket.end(); } catch (_) {}
}
function decodeFrames(client, chunk, handlers) {
  client.buffer = client.buffer && client.buffer.length ? Buffer.concat([client.buffer, chunk]) : Buffer.from(chunk);
  let buf = client.buffer;
  while (buf.length >= 2) {
    const b0 = buf[0], b1 = buf[1], fin = !!(b0 & 0x80), opcode = b0 & 0x0f, masked = !!(b1 & 0x80);
    let len = b1 & 0x7f, offset = 2;
    if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); offset = 4; }
    else if (len === 127) {
      if (buf.length < 10) break;
      const big = buf.readBigUInt64BE(2); if (big > BigInt(MAX_MESSAGE_BYTES)) { handlers.tooLarge(); return; }
      len = Number(big); offset = 10;
    }
    if (len > MAX_MESSAGE_BYTES) { handlers.tooLarge(); return; }
    const maskBytes = masked ? 4 : 0;
    if (buf.length < offset + maskBytes + len) break;
    let mask = null;
    if (masked) { mask = buf.subarray(offset, offset + 4); offset += 4; }
    const payload = Buffer.from(buf.subarray(offset, offset + len));
    if (masked) for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i % 4];
    buf = buf.subarray(offset + len);
    if (!fin && opcode !== 0x0) {
      client.fragmentOpcode = opcode; client.fragments = [payload]; continue;
    }
    if (opcode === 0x0) {
      if (!client.fragments) continue;
      client.fragments.push(payload);
      if (!fin) continue;
      const joined = Buffer.concat(client.fragments); const original = client.fragmentOpcode;
      client.fragments = null; client.fragmentOpcode = 0;
      if (original === 0x1) handlers.text(joined.toString('utf8'));
      continue;
    }
    if (opcode === 0x1) handlers.text(payload.toString('utf8'));
    else if (opcode === 0x8) { handlers.close(); return; }
    else if (opcode === 0x9) { try { client.socket.write(encodeFrame(0xA, payload)); } catch (_) {} }
    else if (opcode === 0xA) { client.lastPong = Date.now(); }
  }
  client.buffer = buf;
}

function createRelayState(options = {}) {
  const rooms = new Map();
  const clients = new Set();
  const graceMs = options.hostGraceMs || HOST_GRACE_MS;
  const pendingMs = options.pendingConnectMs || PENDING_CONNECT_MS;

  function roomFor(hostId, create) {
    let room = rooms.get(hostId);
    if (!room && create) {
      room = {hostId, host: null, guests: new Map(), createdAt: Date.now(), lastHostAt: 0, expireTimer: null};
      rooms.set(hostId, room);
    }
    return room;
  }
  function connectionKey(client, connId) { return `${client.clientId}:${connId}`; }
  function clearRoomTimer(room) { if (room && room.expireTimer) { clearTimeout(room.expireTimer); room.expireTimer = null; } }
  function maybeDeleteRoom(room) {
    if (!room || room.host || room.guests.size) return;
    clearRoomTimer(room); rooms.delete(room.hostId);
  }
  function expireHost(room) {
    if (!room || room.host) return;
    for (const [key, g] of room.guests) {
      wsSend(g.client, {type:'conn-close', connectionId:g.connectionId, reason:'host-timeout'});
      room.guests.delete(key);
    }
    maybeDeleteRoom(room);
  }
  function scheduleHostExpiry(room) {
    clearRoomTimer(room);
    room.expireTimer = setTimeout(() => expireHost(room), graceMs);
  }
  function openGuestToHost(room, g, resumed) {
    if (!room.host || !g || g.openedAgainstHost === room.host.clientId) return;
    g.openedAgainstHost = room.host.clientId;
    wsSend(room.host, {type:'incoming', connectionId:g.connectionId, peerId:g.peerId, metadata:g.metadata || {}, resumed:!!resumed});
    wsSend(room.host, {type:'conn-open', connectionId:g.connectionId, peerId:g.peerId, resumed:!!resumed});
    if (!g.everOpened) {
      g.everOpened = true;
      wsSend(g.client, {type:'conn-open', connectionId:g.connectionId, peerId:room.hostId, resumed:false});
    } else {
      wsSend(g.client, {type:'conn-resumed', connectionId:g.connectionId, peerId:room.hostId});
    }
    if (g.toHostQueue && g.toHostQueue.length) {
      const q = g.toHostQueue.splice(0);
      for (const payload of q) wsSend(room.host, {type:'data', connectionId:g.connectionId, payload});
    }
  }
  function register(client, msg) {
    client.peerId = safeId(msg.peerId, 96) || `a360ws-${crypto.randomBytes(7).toString('hex')}`;
    client.registered = true;
    wsSend(client, {type:'peer-open', peerId:client.peerId, serverTime:Date.now()});
    if (!isHostPeerId(client.peerId)) return;
    const room = roomFor(client.peerId, true);
    clearRoomTimer(room);
    if (room.host && room.host !== client) {
      const old = room.host; room.host = null;
      wsSend(old, {type:'peer-replaced'}); wsClose(old, 4001, 'host-replaced');
    }
    room.host = client; room.lastHostAt = Date.now(); client.hostId = room.hostId;
    for (const g of room.guests.values()) openGuestToHost(room, g, true);
  }
  function connectGuest(client, msg) {
    const hostId = safeId(msg.hostId, 96), connId = safeId(msg.connectionId, 96);
    if (!isHostPeerId(hostId) || !connId || !client.registered) return;
    const room = roomFor(hostId, true), key = connectionKey(client, connId);
    let g = room.guests.get(key);
    if (!g) {
      g = {key, client, connectionId:connId, peerId:client.peerId || `guest-${client.clientId}`, metadata:msg.metadata || {}, createdAt:Date.now(), everOpened:false, openedAgainstHost:'', toHostQueue:[], pendingTimer:null};
      room.guests.set(key, g);
      if (!room.host) {
        g.pendingTimer = setTimeout(() => {
          if (!g.everOpened && room.guests.get(key) === g) {
            wsSend(client, {type:'conn-close', connectionId:connId, reason:'host-unavailable'});
            room.guests.delete(key); maybeDeleteRoom(room);
          }
        }, pendingMs);
      }
    } else {
      g.metadata = msg.metadata || g.metadata; g.client = client;
    }
    if (room.host) {
      if (g.pendingTimer) { clearTimeout(g.pendingTimer); g.pendingTimer = null; }
      openGuestToHost(room, g, g.everOpened);
    } else wsSend(client, {type:'conn-wait', connectionId:connId, hostId});
  }
  function findGuestByConn(client, connId) {
    if (client.hostId) {
      const room = rooms.get(client.hostId); if (!room) return null;
      for (const g of room.guests.values()) if (g.connectionId === connId) return {room, g, fromHost:true};
      return null;
    }
    for (const room of rooms.values()) {
      const key = connectionKey(client, connId), g = room.guests.get(key);
      if (g) return {room, g, fromHost:false};
    }
    return null;
  }
  function relayData(client, msg) {
    const connId = safeId(msg.connectionId, 96), found = findGuestByConn(client, connId); if (!found) return;
    const {room, g, fromHost} = found;
    if (fromHost) wsSend(g.client, {type:'data', connectionId:connId, payload:msg.payload});
    else if (room.host) wsSend(room.host, {type:'data', connectionId:connId, payload:msg.payload});
    else {
      g.toHostQueue.push(msg.payload); if (g.toHostQueue.length > 32) g.toHostQueue.shift();
    }
  }
  function closeConnection(client, msg, reason) {
    const connId = safeId(msg.connectionId, 96), found = findGuestByConn(client, connId); if (!found) return;
    const {room, g} = found;
    if (g.pendingTimer) clearTimeout(g.pendingTimer);
    room.guests.delete(g.key);
    if (room.host && room.host !== client) wsSend(room.host, {type:'conn-close', connectionId:connId, reason:reason || 'peer-close'});
    if (g.client !== client) wsSend(g.client, {type:'conn-close', connectionId:connId, reason:reason || 'peer-close'});
    maybeDeleteRoom(room);
  }
  function onMessage(client, msg) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'peer-register') register(client, msg);
    else if (msg.type === 'connect') connectGuest(client, msg);
    else if (msg.type === 'data') relayData(client, msg);
    else if (msg.type === 'conn-close') closeConnection(client, msg, 'peer-close');
    else if (msg.type === 'client-ping') wsSend(client, {type:'server-pong', at:Date.now()});
  }
  function onClientClose(client) {
    clients.delete(client);
    if (client.hostId) {
      const room = rooms.get(client.hostId);
      if (room && room.host === client) {
        room.host = null; room.lastHostAt = Date.now();
        for (const g of room.guests.values()) { g.openedAgainstHost = ''; wsSend(g.client, {type:'conn-suspended', connectionId:g.connectionId, graceMs}); }
        scheduleHostExpiry(room);
      }
      return;
    }
    for (const room of rooms.values()) {
      const remove = [];
      for (const [key, g] of room.guests) if (g.client === client) remove.push([key, g]);
      for (const [key, g] of remove) {
        if (g.pendingTimer) clearTimeout(g.pendingTimer);
        room.guests.delete(key);
        if (room.host) wsSend(room.host, {type:'conn-close', connectionId:g.connectionId, reason:'guest-disconnected'});
      }
      maybeDeleteRoom(room);
    }
  }
  return {rooms, clients, onMessage, onClientClose};
}

function createApp360Server(options = {}) {
  const root = path.resolve(options.root || DEFAULT_ROOT);
  const allowedOrigins = (options.allowedOrigins || String(process.env.APP360_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean));
  const relay = createRelayState(options);
  const server = http.createServer((req, res) => {
    const pathname = normalizeWsPath(req.url);
    const publicLinks = pathname === '/data/public-links.json';
    if(publicLinks)res.setHeader('Vary','Origin');
    const integrationOrigins = ['https://yem1.com','https://www.yem1.com','https://school.yem1.com'];
    if(publicLinks && integrationOrigins.includes(req.headers.origin)){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');}
    if(publicLinks && req.method === 'OPTIONS'){res.writeHead(204);return res.end();}
    if (pathname === '/health' || pathname === '/family-health') return json(res, 200, {ok:true, service:'app360-family-relay', rooms:relay.rooms.size, clients:relay.clients.size, uptime:Math.round(process.uptime()), now:Date.now()});
    let rel = pathname === '/' ? '/index.html' : pathname;
    let filePath;
    try { filePath = path.resolve(root, '.' + decodeURIComponent(rel)); } catch (_) { res.writeHead(400); return res.end('Bad request'); }
    if (!filePath.startsWith(root + path.sep) && filePath !== path.join(root, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
    fs.stat(filePath, (err, st) => {
      if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (readErr, data) => {
        if (readErr) { res.writeHead(readErr.code === 'ENOENT' ? 404 : 500, {'content-type':'text/plain; charset=utf-8'}); return res.end('Not found'); }
        const ext = path.extname(filePath).toLowerCase();
        if(ext === '.html')res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://yem1.com https://www.yem1.com https://school.yem1.com");
        let body = data;
        if (path.basename(filePath) === 'index.html') {
          let text = data.toString('utf8');
          const marker = '<script>window.APP360_FAMILY_SERVER=true;window.APP360_FAMILY_WS_REQUIRED=true;window.APP360_FAMILY_WS_URL=(location.protocol==="https:"?"wss://":"ws://")+location.host+"/family-ws";</script>';
          text = text.includes('APP360_FAMILY_SERVER=true') ? text : text.replace('</head>', marker + '\n</head>');
          body = Buffer.from(text);
        }
        res.writeHead(200, {'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' || /(?:sw(?:-v24)?\.js|offline-worker-v1\.js|offline-catalog\.json)$/.test(filePath) || filePath.includes(path.sep+'data'+path.sep+'offline'+path.sep) ? 'no-store' : 'public, max-age=300', 'content-length': body.length});
        res.end(body);
      });
    });
  });

  server.on('upgrade', (req, socket, head) => {
    if (normalizeWsPath(req.url) !== WS_PATH || !sameOriginAllowed(req, allowedOrigins)) { socket.write('HTTP/1.1 403 Forbidden\r\n\r\n'); return socket.destroy(); }
    const key = req.headers['sec-websocket-key'];
    if (!key || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') { socket.write('HTTP/1.1 400 Bad Request\r\n\r\n'); return socket.destroy(); }
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + wsAcceptKey(key) + '\r\n\r\n');
    const client = {socket, clientId: crypto.randomBytes(8).toString('hex'), peerId:'', hostId:'', registered:false, closed:false, cleaned:false, buffer:Buffer.alloc(0), lastPong:Date.now(), rateAt:Date.now(), rateCount:0, fragments:null, fragmentOpcode:0};
    relay.clients.add(client);
    function finishClose() { if (client.cleaned) return; client.cleaned = true; client.closed = true; relay.onClientClose(client); }
    socket.on('data', chunk => decodeFrames(client, chunk, {
      text(text) {
        const now = Date.now(); if (now - client.rateAt > RATE_WINDOW_MS) { client.rateAt = now; client.rateCount = 0; }
        if (++client.rateCount > RATE_MAX) return wsClose(client, 1008, 'rate-limit');
        let msg; try { msg = JSON.parse(text); } catch (_) { return; }
        relay.onMessage(client, msg);
      },
      close() { wsClose(client, 1000, 'bye'); finishClose(); },
      tooLarge() { wsClose(client, 1009, 'message-too-large'); finishClose(); }
    }));
    socket.on('error', finishClose); socket.on('end', finishClose); socket.on('close', finishClose);
    if (head && head.length) socket.emit('data', head);
  });

  const pingTimer = setInterval(() => {
    const now = Date.now();
    for (const client of relay.clients) {
      if (client.closed || client.socket.destroyed) continue;
      if (now - client.lastPong > 65000) {
        client.cleaned = true;
        wsClose(client, 1001, 'heartbeat-timeout');
        relay.onClientClose(client);
        continue;
      }
      try { client.socket.write(encodeFrame(0x9, Buffer.from('a360'))); } catch (_) {}
    }
  }, 20000);
  pingTimer.unref();

  return {
    server, relay,
    listen(port = DEFAULT_PORT, host = DEFAULT_HOST) { return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { server.off('error', reject); resolve(server.address()); }); }); },
    close() { clearInterval(pingTimer); for (const c of relay.clients) wsClose(c, 1001, 'server-stop'); return new Promise(resolve => server.close(() => resolve())); }
  };
}

if (require.main === module) {
  const app = createApp360Server();
  app.listen().then(addr => {
    const port = addr && addr.port || DEFAULT_PORT;
    console.log(`[App360 Family] http://localhost:${port}`);
    console.log(`[App360 Family] WebSocket ${WS_PATH}`);
  }).catch(err => { console.error(err); process.exitCode = 1; });
}

module.exports = {createApp360Server, createRelayState};
