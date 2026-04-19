const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static('public', {
  setHeaders: (res, path) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

const AUTH_FILE = path.join(__dirname, 'provider-auth.json');

function loadAuthStore() {
  try {
    if (!fs.existsSync(AUTH_FILE)) return { providers: [] };
    const raw = fs.readFileSync(AUTH_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.providers)) return { providers: [] };
    return parsed;
  } catch {
    return { providers: [] };
  }
}

function saveAuthStore(store) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify(store, null, 2));
}

function hashPassword(password, salt) {
  const useSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha512').toString('hex');
  return { salt: useSalt, hash };
}

function safeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

const authStore = loadAuthStore();
const providerSessions = new Map();
const PROVIDER_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const PROVIDER_ONLINE_TTL_MS = 24 * 60 * 60 * 1000;

function parseSessionRoom(roomName) {
  const match = /^session:([^:]+):([^:]+)$/.exec(String(roomName || '').trim());
  if (!match) return null;
  return { patientSocketId: match[1], providerSocketId: match[2] };
}

async function ensureSessionRoomParticipants(io, currentSocket, roomName) {
  const parsed = parseSessionRoom(roomName);
  if (!parsed) {
    const roomMembers = io.sockets.adapter.rooms.get(roomName);
    return roomMembers || null;
  }

  await currentSocket.join(roomName);

  const providerSocket = io.sockets.sockets.get(parsed.providerSocketId);
  if (providerSocket) {
    await providerSocket.join(roomName);
  }

  return io.sockets.adapter.rooms.get(roomName) || null;
}

function getValidProviderSession(token) {
  const session = providerSessions.get(token);
  if (!session) return null;
  const expiresAt = session.expiresAt || (session.createdAt + PROVIDER_SESSION_TTL_MS);
  if (Date.now() > expiresAt) {
    providerSessions.delete(token);
    return null;
  }
  return session;
}

app.post('/api/provider/register', (req, res) => {
  const username = safeUsername(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');

  if (!username || password.length < 4) {
    return res.status(400).json({ error: 'Username required and password must be at least 4 characters.' });
  }

  const exists = authStore.providers.find(p => p.username === username);
  if (exists) {
    return res.status(409).json({ error: 'Username already exists.' });
  }

  const { salt, hash } = hashPassword(password);
  authStore.providers.push({ username, salt, hash, createdAt: Date.now() });
  saveAuthStore(authStore);
  return res.json({ ok: true });
});

app.post('/api/provider/login', (req, res) => {
  const username = safeUsername(req.body && req.body.username);
  const password = String((req.body && req.body.password) || '');

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const provider = authStore.providers.find(p => p.username === username);
  if (!provider) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const { hash } = hashPassword(password, provider.salt);
  if (hash !== provider.hash) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const createdAt = Date.now();
  providerSessions.set(token, { username, createdAt, expiresAt: createdAt + PROVIDER_SESSION_TTL_MS });
  return res.json({ ok: true, token, username });
});

app.post('/api/provider/logout', (req, res) => {
  const token = String((req.body && req.body.token) || '');
  if (token) providerSessions.delete(token);
  return res.json({ ok: true });
});

app.post('/api/provider/session/validate', (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const session = getValidProviderSession(token);
  if (!session) return res.status(401).json({ ok: false });
  return res.json({ ok: true, username: session.username });
});

app.post('/api/provider/profile/get', (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const session = getValidProviderSession(token);
  if (!session) return res.status(401).json({ ok: false });

  const provider = authStore.providers.find(p => p.username === session.username);
  if (!provider || !provider.profile) {
    return res.json({ ok: true, profile: null });
  }

  return res.json({ ok: true, profile: provider.profile });
});

app.post('/api/provider/profile/save', (req, res) => {
  const token = String((req.body && req.body.token) || '');
  const session = getValidProviderSession(token);
  if (!session) return res.status(401).json({ ok: false });

  const name = String((req.body && req.body.name) || '').trim();
  const lat = Number(req.body && req.body.lat);
  const lon = Number(req.body && req.body.lon);
  const specialty = String((req.body && req.body.specialty) || '').trim();

  if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ ok: false, error: 'Name and valid location are required.' });
  }

  const provider = authStore.providers.find(p => p.username === session.username);
  if (!provider) return res.status(404).json({ ok: false, error: 'Provider not found.' });

  provider.profile = { name, lat, lon, specialty, updatedAt: Date.now() };
  saveAuthStore(authStore);
  return res.json({ ok: true });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const patients = new Map();   // socketId -> { id, name, lat, lon, socket }
const providers = new Map();  // socketId -> { id, name, lat, lon, specialty, socket }

function haversineKm(a, b) {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDlat = Math.sin(dLat / 2);
  const sinDlon = Math.sin(dLon / 2);
  const h = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
  return 2 * R * Math.asin(Math.sqrt(h));
}

app.get('/api/medical-offices/nearby', async (req, res) => {
  const lat = Number(req.query && req.query.lat);
  const lon = Number(req.query && req.query.lon);
  const radiusKmRaw = Number(req.query && req.query.radiusKm);
  const radiusKm = Number.isFinite(radiusKmRaw) ? Math.min(Math.max(radiusKmRaw, 1), 80) : 20;
  const radiusMeters = Math.round(radiusKm * 1000);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ ok: false, error: 'Valid lat and lon are required.' });
  }

  const query = `
[out:json][timeout:25];
(
  node["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](around:${radiusMeters},${lat},${lon});
  way["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](around:${radiusMeters},${lat},${lon});
  relation["amenity"~"hospital|clinic|doctors|dentist|pharmacy"](around:${radiusMeters},${lat},${lon});
);
out center tags;
`;

  const overpassUrls = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  async function queryOverpass(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      // Overpass supports form-encoded `data=` payload; this is broadly compatible.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
          'User-Agent': 'TheArcadian/1.0 (medical office lookup)'
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json().catch(() => null);
      if (!data || !Array.isArray(data.elements)) return null;
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }

  try {
    let data = null;
    for (const url of overpassUrls) {
      try {
        data = await queryOverpass(url);
        if (data) break;
      } catch {
        // Try the next mirror.
      }
    }

    if (!data) {
      return res.status(502).json({ ok: false, error: 'Medical office lookup is temporarily unavailable.' });
    }

    const elements = Array.isArray(data.elements) ? data.elements : [];
    const seen = new Set();
    const offices = [];

    for (const item of elements) {
      const itemLat = Number(item.lat != null ? item.lat : item.center && item.center.lat);
      const itemLon = Number(item.lon != null ? item.lon : item.center && item.center.lon);
      if (!Number.isFinite(itemLat) || !Number.isFinite(itemLon)) continue;

      const tags = item.tags || {};
      const category = String(tags.amenity || 'medical').trim();
      const name = String(tags.name || '').trim() || 'Medical office';
      const distanceKm = haversineKm({ lat, lon }, { lat: itemLat, lon: itemLon });
      const key = `${name}|${itemLat.toFixed(5)}|${itemLon.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      offices.push({
        name,
        category,
        lat: itemLat,
        lon: itemLon,
        distanceKm
      });
    }

    offices.sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ ok: true, offices });
  } catch {
    return res.status(502).json({ ok: false, error: 'Could not load nearby medical offices right now.' });
  }
});

io.on('connection', socket => {
  socket.on('identify', payload => {
    const p = { id: socket.id, name: payload.name || 'Anonymous', lat: payload.lat, lon: payload.lon, socket };
    if (payload.role === 'patient') {
      patients.set(socket.id, p);
      socket.emit('identified', { role: 'patient', id: socket.id });
    } else {
      const token = String(payload.authToken || '');
      const session = getValidProviderSession(token);
      if (!session) {
        socket.emit('auth_required');
        return;
      }
      providers.set(socket.id, Object.assign(p, {
        specialty: payload.specialty || '',
        username: session.username,
        sessionToken: token,
        sessionExpiresAt: session.expiresAt,
        onlineUntil: 0
      }));
      socket.emit('identified', { role: 'provider', id: socket.id });
    }
  });

  socket.on('request_match', async data => {
    // data: { lat, lon, radiusKm (optional) }
    const radiusKm = data.radiusKm || 50;
    const patient = { lat: data.lat, lon: data.lon };
    const nearby = [];
    const now = Date.now();
    for (const prov of providers.values()) {
      if (!prov.onlineUntil || prov.onlineUntil <= now) continue;
      if (!prov.sessionToken || !getValidProviderSession(prov.sessionToken)) continue;
      if (typeof prov.lat !== 'number' || typeof prov.lon !== 'number') continue;
      const dist = haversineKm(patient, { lat: prov.lat, lon: prov.lon });
      if (dist <= radiusKm) nearby.push({ id: prov.id, name: prov.name, specialty: prov.specialty, lat: prov.lat, lon: prov.lon, dist });
    }
    nearby.sort((a, b) => a.dist - b.dist);
    if (nearby.length === 0) {
      socket.emit('no_providers');
      return;
    }
    const chosen = nearby[0];
    const providerEntry = providers.get(chosen.id);
    if (!providerEntry || !providerEntry.socket) {
      socket.emit('no_providers');
      return;
    }

    const providerSocket = providerEntry.socket;
    const room = `session:${socket.id}:${chosen.id}`;
    await Promise.all([
      socket.join(room),
      providerSocket.join(room)
    ]);

    // notify both sides
    socket.emit('match_found', { provider: chosen, room });
    providerSocket.emit('patient_chat_request', { room, patientId: socket.id });
    providerSocket.emit('matched_patient', { patientId: socket.id, room, patientLoc: { lat: data.lat, lon: data.lon } });
  });

  socket.on('announce_availability', data => {
    // provider sends updated location/availability
    const prov = providers.get(socket.id);
    if (!prov) return;
    if (!prov.sessionToken) {
      socket.emit('auth_required');
      return;
    }
    const session = getValidProviderSession(prov.sessionToken);
    if (!session) {
      socket.emit('auth_required');
      providers.delete(socket.id);
      return;
    }
    const requestedOnlineUntil = Date.now() + PROVIDER_ONLINE_TTL_MS;
    const onlineUntil = Math.min(requestedOnlineUntil, session.expiresAt);
    prov.lat = data.lat;
    prov.lon = data.lon;
    prov.specialty = data.specialty || prov.specialty;
    prov.onlineUntil = onlineUntil;
    providers.set(socket.id, prov);
    socket.emit('availability_updated', { onlineUntil });
  });

  socket.on('join_room', ({ room }) => {
    socket.join(room);
  });

  socket.on('message', async ({ room, text }) => {
    const safeRoom = String(room || '').trim();
    const safeText = String(text || '').trim();
    if (!safeRoom || !safeText) {
      socket.emit('message_error', { error: 'Message could not be sent. No active chat session.' });
      return;
    }

    const roomMembers = await ensureSessionRoomParticipants(io, socket, safeRoom);
    if (!roomMembers || roomMembers.size < 2) {
      socket.emit('message_error', { error: 'Message could not be sent. The other participant is not connected.' });
      return;
    }

    socket.to(safeRoom).emit('message', { from: socket.id, text: safeText, ts: Date.now() });
    socket.emit('message_sent', { room: safeRoom, ts: Date.now() });
  });

  socket.on('media_message', async (mediaData) => {
    const safeRoom = String(mediaData && mediaData.room || '').trim();
    if (!safeRoom) {
      socket.emit('message_error', { error: 'Media could not be sent. No active chat session.' });
      return;
    }
    const roomMembers = await ensureSessionRoomParticipants(io, socket, safeRoom);
    if (!roomMembers || roomMembers.size < 2) {
      socket.emit('message_error', { error: 'Media could not be sent. The other participant is not connected.' });
      return;
    }

    // broadcast media message to room
    socket.to(safeRoom).emit('media_message', {
      from: socket.id,
      fileName: mediaData.fileName,
      fileType: mediaData.fileType,
      fileSize: mediaData.fileSize,
      data: mediaData.data,
      ts: Date.now()
    });
    socket.emit('message_sent', { room: safeRoom, ts: Date.now() });
  });

  socket.on('disconnect', () => {
    patients.delete(socket.id);
    providers.delete(socket.id);
    // optionally notify others
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));