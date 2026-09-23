import crypto from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(crypto.scrypt);
export const SESSION_COOKIE = "bb_session";
const SESSION_DAYS = 30;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return "scrypt$" + salt.toString("hex") + "$" + hash.toString("hex");
}

export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return crypto.timingSafeEqual(actual, expected);
}

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

export function createSession(db, userId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 864e5;
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha256(token), userId, expires);
  return { token, expires };
}

export function destroySession(db, token) {
  if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha256(token));
}

export function sessionUser(db, token) {
  if (!token) return null;
  const row = db.prepare(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?"
  ).get(sha256(token), Date.now());
  return row || null;
}

export function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

export function sessionCookie(token, expires, secure) {
  return [
    SESSION_COOKIE + "=" + encodeURIComponent(token),
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    token ? "Expires=" + new Date(expires).toUTCString() : "Max-Age=0"
  ].filter(Boolean).join("; ");
}

// Tiny fixed-window rate limiter for auth endpoints (per process).
export function rateLimiter({ windowMs, max }) {
  const hits = new Map();
  return function limited(key) {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) { hits.set(key, { count: 1, reset: now + windowMs }); return false; }
    entry.count++;
    if (hits.size > 10000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return entry.count > max;
  };
}
