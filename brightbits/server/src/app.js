import crypto from "node:crypto";
import path from "node:path";
import express from "express";
import {
  SESSION_COOKIE, createSession, destroySession, hashPassword, rateLimiter, readCookie, sessionCookie, sessionUser, verifyPassword
} from "./auth.js";
import { BillingError, createBilling, isPro, subscriptionFor } from "./billing.js";
import { CURATOR_IDS, FREE_LIMITS, PLAN_IDS, SOURCE_IDS, TOPIC_IDS } from "./content.js";
import { WEB_ROOT } from "./config.js";

const STATIC_FILES = ["index.html", "app.js", "api.js", "data.js", "styles.css"];
const STATE_KEYS = ["onboarded", "profile", "stashes", "liked", "history", "journeys", "badges", "theme"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class HttpError extends Error {
  constructor(status, message, extra) { super(message); this.status = status; this.extra = extra; }
}
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const publicId = (userId) => "u" + userId;

function publicUser(db, u) {
  return {
    id: publicId(u.id), name: u.name || u.handle, handle: u.handle, bio: u.bio,
    followers: db.prepare("SELECT COUNT(*) n FROM follows WHERE target = ?").get(publicId(u.id)).n
  };
}

function uniqueHandle(db, base) {
  const slug = (base || "reader").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "reader";
  for (let i = 0; i < 20; i++) {
    const h = i === 0 ? slug : slug + crypto.randomInt(100, 9999);
    if (!db.prepare("SELECT 1 FROM users WHERE handle = ?").get(h)) return h;
  }
  return slug + crypto.randomBytes(4).toString("hex");
}

function parseState(json) {
  try { const s = JSON.parse(json); return s && typeof s === "object" ? s : {}; } catch { return {}; }
}

// Keep only known keys with sane shapes so the blob can't grow unbounded or smuggle in Pro status.
function sanitizeState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpError(400, "state must be an object");
  const out = {};
  for (const k of STATE_KEYS) if (input[k] !== undefined) out[k] = input[k];
  if (out.stashes !== undefined) {
    if (!Array.isArray(out.stashes) || out.stashes.length > 500) throw new HttpError(400, "invalid stashes");
    out.stashes = out.stashes.map((s) => ({
      id: str(s?.id, 40), name: str(s?.name, 40) || "Stash", emoji: str(s?.emoji, 8),
      ideaIds: Array.isArray(s?.ideaIds) ? [...new Set(s.ideaIds.filter((x) => typeof x === "string").map((x) => x.slice(0, 40)))].slice(0, 5000) : []
    }));
  }
  if (out.liked !== undefined && !Array.isArray(out.liked)) throw new HttpError(400, "invalid liked");
  if (out.history !== undefined && (typeof out.history !== "object" || Array.isArray(out.history))) throw new HttpError(400, "invalid history");
  return out;
}
const countSaves = (s) => (s.stashes || []).reduce((a, x) => a + x.ideaIds.length, 0);

export function createApp({ db, config, stripe }) {
  const app = express();
  const billing = createBilling({ db, config, stripe });
  const authLimited = rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  // Stripe needs the raw body to verify signatures, so this route comes before express.json().
  app.post("/api/billing/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const type = await billing.handleWebhook(req.body, req.headers["stripe-signature"]);
    res.json({ received: true, type });
  });

  app.use("/api", express.json({ limit: "256kb" }));

  // CSRF defence: state-changing API calls must be JSON, which browsers can't send cross-site without CORS.
  app.use("/api", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD" && !req.is("application/json")) {
      return next(new HttpError(415, "Content-Type must be application/json"));
    }
    req.user = sessionUser(db, readCookie(req, SESSION_COOKIE));
    next();
  });
  const requireUser = (req, res, next) => (req.user ? next() : next(new HttpError(401, "Please log in")));

  function mePayload(user) {
    return {
      user: { ...publicUser(db, user), email: user.email },
      subscription: subscriptionFor(db, user.id),
      pro: isPro(db, user.id),
      state: parseState(user.state),
      following: db.prepare("SELECT target FROM follows WHERE user_id = ? ORDER BY created_at").all(user.id).map((r) => r.target)
    };
  }
  function startSession(res, userId) {
    const { token, expires } = createSession(db, userId);
    res.setHeader("Set-Cookie", sessionCookie(token, expires, config.production));
  }

  app.get("/api/health", (req, res) => res.json({ ok: true, billing: billing.mode, trialDays: config.trialDays }));

  // ----- Auth -----
  app.post("/api/auth/signup", async (req, res) => {
    const email = str(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const name = str(req.body.name, 30);
    if (authLimited("signup:" + req.ip)) throw new HttpError(429, "Too many attempts, try again later");
    if (!EMAIL_RE.test(email)) throw new HttpError(400, "Enter a valid email");
    if (password.length < 8 || password.length > 200) throw new HttpError(400, "Password must be at least 8 characters");
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(email)) throw new HttpError(409, "An account with this email already exists");
    const state = req.body.state ? sanitizeState(req.body.state) : {};
    // New accounts start on the free plan, so trim any offline data to the free limits.
    if (state.stashes) {
      state.stashes = state.stashes.slice(0, FREE_LIMITS.stashes);
      let room = FREE_LIMITS.saves;
      for (const s of state.stashes) { s.ideaIds = s.ideaIds.slice(0, Math.max(0, room)); room -= s.ideaIds.length; }
    }
    const info = db.prepare("INSERT INTO users (email, password_hash, name, handle, state, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(email, await hashPassword(password), name, uniqueHandle(db, name || email.split("@")[0]), JSON.stringify(state), Date.now());
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    startSession(res, user.id);
    res.status(201).json(mePayload(user));
  });

  app.post("/api/auth/login", async (req, res) => {
    const email = str(req.body.email, 200).toLowerCase();
    const password = typeof req.body.password === "string" ? req.body.password : "";
    if (authLimited("login:" + req.ip + ":" + email)) throw new HttpError(429, "Too many attempts, try again later");
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await verifyPassword(password, user.password_hash))) throw new HttpError(401, "Wrong email or password");
    startSession(res, user.id);
    res.json(mePayload(user));
  });

  app.post("/api/auth/logout", (req, res) => {
    destroySession(db, readCookie(req, SESSION_COOKIE));
    res.setHeader("Set-Cookie", sessionCookie("", 0, config.production));
    res.json({ ok: true });
  });

  // ----- Account & synced state -----
  app.get("/api/me", requireUser, (req, res) => res.json(mePayload(req.user)));

  app.patch("/api/me", requireUser, (req, res) => {
    const name = req.body.name !== undefined ? str(req.body.name, 30) : req.user.name;
    const bio = req.body.bio !== undefined ? str(req.body.bio, 160) : req.user.bio;
    db.prepare("UPDATE users SET name = ?, bio = ? WHERE id = ?").run(name, bio, req.user.id);
    res.json(mePayload(db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id)));
  });

  app.put("/api/state", requireUser, (req, res) => {
    const next = sanitizeState(req.body.state);
    const prev = parseState(req.user.state);
    if (!isPro(db, req.user.id)) {
      // Free plan: don't let totals grow past the limits (existing data from a lapsed Pro plan is kept).
      const prevStashes = (prev.stashes || []).length, prevSaves = countSaves(prev);
      if (next.stashes && next.stashes.length > Math.max(FREE_LIMITS.stashes, prevStashes)) throw new HttpError(402, "Free plan stash limit reached", { limit: "stashes" });
      if (next.stashes && countSaves(next) > Math.max(FREE_LIMITS.saves, prevSaves)) throw new HttpError(402, "Free plan save limit reached", { limit: "saves" });
    }
    const merged = { ...prev, ...next };
    const json = JSON.stringify(merged);
    if (json.length > 256 * 1024) throw new HttpError(413, "State too large");
    db.prepare("UPDATE users SET state = ? WHERE id = ?").run(json, req.user.id);
    const profileName = str(next.profile?.name, 30);
    if (profileName && profileName !== req.user.name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(profileName, req.user.id);
    res.json({ ok: true });
  });

  // ----- Community ideas -----
  app.get("/api/ideas", (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const rows = db.prepare(`
      SELECT i.*, u.name, u.handle, u.bio FROM ideas i JOIN users u ON u.id = i.user_id
      ORDER BY i.created_at DESC LIMIT ?`).all(limit);
    const users = {};
    for (const r of rows) if (!users[publicId(r.user_id)]) users[publicId(r.user_id)] = publicUser(db, { id: r.user_id, name: r.name, handle: r.handle, bio: r.bio });
    const followers = Object.fromEntries(db.prepare("SELECT target, COUNT(*) n FROM follows GROUP BY target").all().map((r) => [r.target, r.n]));
    res.json({
      ideas: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, topic: r.topic, source: r.source_id || undefined, curator: publicId(r.user_id), createdAt: r.created_at })),
      users,
      followers
    });
  });

  app.post("/api/ideas", requireUser, (req, res) => {
    const title = str(req.body.title, 80), body = str(req.body.body, 600);
    const topic = str(req.body.topic, 40), source = str(req.body.source, 40) || null;
    if (!title || !body) throw new HttpError(400, "Title and text are required");
    if (!TOPIC_IDS.has(topic)) throw new HttpError(400, "Unknown topic");
    if (source && !SOURCE_IDS.has(source)) throw new HttpError(400, "Unknown source");
    const recent = db.prepare("SELECT COUNT(*) n FROM ideas WHERE user_id = ? AND created_at > ?").get(req.user.id, Date.now() - 3600e3).n;
    if (recent >= 30) throw new HttpError(429, "You're publishing too fast, take a breather");
    const id = "x" + crypto.randomBytes(6).toString("hex");
    const now = Date.now();
    db.prepare("INSERT INTO ideas (id, user_id, title, body, topic, source_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, req.user.id, title, body, topic, source, now);
    res.status(201).json({ idea: { id, title, body, topic, source: source || undefined, curator: publicId(req.user.id), createdAt: now } });
  });

  app.delete("/api/ideas/:id", requireUser, (req, res) => {
    const r = db.prepare("DELETE FROM ideas WHERE id = ? AND user_id = ?").run(String(req.params.id), req.user.id);
    if (!r.changes) throw new HttpError(404, "Idea not found");
    res.json({ ok: true });
  });

  // ----- People & follows -----
  app.get("/api/users/:id", (req, res) => {
    const m = /^u(\d+)$/.exec(req.params.id);
    const u = m && db.prepare("SELECT * FROM users WHERE id = ?").get(Number(m[1]));
    if (!u) throw new HttpError(404, "User not found");
    const ideas = db.prepare("SELECT * FROM ideas WHERE user_id = ? ORDER BY created_at DESC LIMIT 200").all(u.id)
      .map((r) => ({ id: r.id, title: r.title, body: r.body, topic: r.topic, source: r.source_id || undefined, curator: publicId(u.id), createdAt: r.created_at }));
    const following = db.prepare("SELECT COUNT(*) n FROM follows WHERE user_id = ?").get(u.id).n;
    res.json({ user: { ...publicUser(db, u), following }, ideas });
  });

  function followTarget(req) {
    const t = String(req.params.target);
    if (CURATOR_IDS.has(t)) return t;
    const m = /^u(\d+)$/.exec(t);
    if (!m || !db.prepare("SELECT 1 FROM users WHERE id = ?").get(Number(m[1]))) throw new HttpError(404, "Unknown curator");
    if (Number(m[1]) === req.user.id) throw new HttpError(400, "You can't follow yourself");
    return t;
  }
  app.put("/api/follows/:target", requireUser, (req, res) => {
    db.prepare("INSERT OR IGNORE INTO follows (user_id, target, created_at) VALUES (?, ?, ?)").run(req.user.id, followTarget(req), Date.now());
    res.json({ ok: true });
  });
  app.delete("/api/follows/:target", requireUser, (req, res) => {
    db.prepare("DELETE FROM follows WHERE user_id = ? AND target = ?").run(req.user.id, String(req.params.target));
    res.json({ ok: true });
  });

  // ----- Billing -----
  app.post("/api/billing/checkout", requireUser, async (req, res) => {
    const plan = str(req.body.plan, 20);
    if (!PLAN_IDS.has(plan)) throw new HttpError(400, "Unknown plan");
    res.json(await billing.checkout(req.user, plan));
  });
  app.post("/api/billing/portal", requireUser, async (req, res) => res.json(await billing.portal(req.user)));
  app.post("/api/billing/cancel", requireUser, (req, res) => {
    billing.cancelDemo(req.user);
    res.json({ ok: true, subscription: subscriptionFor(db, req.user.id) });
  });

  app.use("/api", (req, res, next) => next(new HttpError(404, "Not found")));

  // ----- Frontend (explicit allowlist so server files are never served) -----
  const sendWeb = (file) => (req, res) => res.sendFile(path.join(WEB_ROOT, file), { headers: { "Cache-Control": "no-cache" } });
  app.get("/", sendWeb("index.html"));
  for (const f of STATIC_FILES) app.get("/" + f, sendWeb(f));

  // Errors: JSON for the API.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err instanceof HttpError || err instanceof BillingError ? err.status : err.type === "entity.parse.failed" ? 400 : err.status === 413 ? 413 : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? "Something went wrong" : err.message, ...(err.extra || {}) });
  });

  return app;
}
