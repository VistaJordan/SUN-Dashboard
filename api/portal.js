// SUN Holdings Live Portal — data API (Vercel serverless function).
// Microsoft sign-in is switched off for now. Anyone with the link can read the portal (or, if PORTAL_VIEW_KEY
// is set, anyone who enters that access code once). Requests that carry the Seamless FM admin code
// (PORTAL_ADMIN_KEY) can also write: upload trackers, post updates, add notes and change settings.
// The portal's data is one JSON state kept as numbered versions in a private Vercel Blob store; the newest
// KEEP_VERSIONS are kept as a rolling backup.
import { list, put, del } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

const ADMIN_KEY = (process.env.PORTAL_ADMIN_KEY || '').trim();   // unlocks editing (required for any write)
const VIEW_KEY = (process.env.PORTAL_VIEW_KEY || '').trim();     // optional: viewers must enter this once
const PREFIX = 'portal-state-';
const KEEP_VERSIONS = 30;
const MAX_DOC_BYTES = 256 * 1024;
const MAX_DOCS = 5000;
const SEGMENT = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;

function same(a, b) {
  if (!a || !b) return false;
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// who is asking: read rights from the link (or the view code), write rights from the admin code
function identify(req) {
  const h = k => String(req.headers[k] || '').trim();
  const canEdit = !!ADMIN_KEY && same(h('x-portal-key'), ADMIN_KEY);
  const canView = canEdit || !VIEW_KEY || same(h('x-portal-view'), VIEW_KEY);
  let name = '';
  try { name = decodeURIComponent(h('x-portal-name')); } catch (e) { name = h('x-portal-name'); }
  name = name.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || (canEdit ? 'Seamless FM' : 'Viewer');
  const id = canEdit ? 'sfm:' + (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'admin') : 'viewer';
  return { id, name, canEdit, canView };
}

async function readBlobJson(blob) {
  let res = await fetch(blob.url, { headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } });
  if (!res.ok) res = await fetch(blob.downloadUrl || blob.url);
  if (!res.ok) throw new Error('blob-read-' + res.status);
  return res.json();
}

async function versions() {
  const { blobs } = await list({ prefix: PREFIX });
  return blobs.sort((a, b) => b.pathname.localeCompare(a.pathname));
}

async function latest() {
  const blobs = await versions();
  if (!blobs.length) return { version: 0, docs: {}, people: {} };
  const s = await readBlobJson(blobs[0]);
  return { version: Number(s.version) || 0, docs: s.docs || {}, people: s.people || {}, updatedAt: s.updatedAt, updatedBy: s.updatedBy };
}

async function save(state) {
  const name = `${PREFIX}${String(state.version).padStart(10, '0')}.json`;
  await put(name, JSON.stringify(state), { access: 'private', contentType: 'application/json', addRandomSuffix: true });
  try {
    const stale = (await versions()).slice(KEEP_VERSIONS).map(b => b.url);
    if (stale.length) await del(stale);
  } catch (e) { /* pruning is best-effort */ }
}

// document paths: collection/doc pairs, e.g. "portal/meta", "chunks/c0", "updates/abc123"
function validPath(p) {
  if (typeof p !== 'string' || p.length > 1000) return false;
  const parts = p.split('/');
  return parts.length >= 2 && parts.length <= 16 && parts.length % 2 === 0 && parts.every(s => SEGMENT.test(s) && s !== '.' && s !== '..');
}

// nested objects merge; arrays and everything else replace (same as the page expects)
function merge(target, patch) {
  const out = Array.isArray(target) || typeof target !== 'object' || target === null ? {} : { ...target };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k]) ? merge(out[k], v) : v;
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const who = identify(req);
  const me = { id: who.id, name: who.name, canEdit: who.canEdit, viewCodeRequired: !!VIEW_KEY, adminCodeSet: !!ADMIN_KEY };
  if (!who.canView) return res.status(401).json({ error: 'view-key', me });

  try {
    if (req.method === 'GET') {
      const state = await latest();
      const since = Number(req.query && req.query.since);
      if (Number.isFinite(since) && since === state.version) return res.status(200).json({ unchanged: true, version: state.version, me });
      // names of the Seamless FM people who changed things are for the admin view only
      return res.status(200).json({ version: state.version, docs: state.docs, people: who.canEdit ? state.people : {}, me });
    }

    if (req.method === 'POST') {
      if (!who.canEdit) return res.status(403).json({ error: 'read-only', me });
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { op, path, data } = body;
      if (!['set', 'update', 'delete'].includes(op)) return res.status(400).json({ error: 'bad-op' });
      if (!validPath(path)) return res.status(400).json({ error: 'bad-path' });
      if (op !== 'delete' && (!data || typeof data !== 'object' || Array.isArray(data))) return res.status(400).json({ error: 'bad-data' });

      const state = await latest();
      if (op === 'set') state.docs[path] = data;
      else if (op === 'update') {
        if (!Object.prototype.hasOwnProperty.call(state.docs, path)) return res.status(400).json({ error: 'not-found' });
        state.docs[path] = merge(state.docs[path], data);
      } else delete state.docs[path];

      if (op !== 'delete' && Buffer.byteLength(JSON.stringify(state.docs[path])) > MAX_DOC_BYTES) return res.status(413).json({ error: 'document-too-large' });
      if (Object.keys(state.docs).length > MAX_DOCS) return res.status(413).json({ error: 'too-many-documents' });

      state.people[who.id] = who.name;
      state.version += 1;
      state.updatedAt = Date.now();
      state.updatedBy = who.id;
      await save(state);
      return res.status(200).json({ version: state.version, docs: state.docs, people: state.people, me });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method-not-allowed' });
  } catch (e) {
    console.error('portal api', e);
    return res.status(500).json({ error: 'server' });
  }
}
