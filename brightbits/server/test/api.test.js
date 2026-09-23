import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { openDb } from "../src/db.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

async function startServer(overrides = {}, stripe) {
  const config = { ...loadConfig({ NODE_ENV: "test" }), databasePath: ":memory:", ...overrides };
  const db = openDb(":memory:");
  const server = createApp({ db, config, stripe }).listen(0);
  await new Promise((r) => server.once("listening", r));
  return { db, server, base: "http://127.0.0.1:" + server.address().port };
}

// Minimal cookie-jar client.
function client(base) {
  let cookie = "";
  return async function call(method, path, body, headers = {}) {
    const res = await fetch(base + path, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body)
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, body: json, text };
  };
}

describe("Brightbits API (demo billing)", () => {
  let ctx, alice, bob;
  before(async () => {
    ctx = await startServer();
    alice = client(ctx.base);
    bob = client(ctx.base);
  });
  after(() => ctx.server.close());

  test("health reports demo billing", async () => {
    const r = await alice("GET", "/api/health");
    assert.equal(r.status, 200);
    assert.equal(r.body.billing, "demo");
  });

  test("serves the frontend but never server files", async () => {
    assert.equal((await alice("GET", "/")).status, 200);
    assert.equal((await alice("GET", "/app.js")).status, 200);
    assert.equal((await alice("GET", "/server/src/app.js")).status, 404);
    assert.equal((await alice("GET", "/server/.env")).status, 404);
  });

  test("signup validates input", async () => {
    assert.equal((await alice("POST", "/api/auth/signup", { email: "nope", password: "longenough" })).status, 400);
    assert.equal((await alice("POST", "/api/auth/signup", { email: "a@x.io", password: "short" })).status, 400);
  });

  test("signup saves the quiz state, trimmed to free limits, and never trusts client Pro", async () => {
    const stashes = Array.from({ length: 5 }, (_, i) => ({ id: "s" + i, name: "S" + i, emoji: "⭐", ideaIds: Array.from({ length: 10 }, (_, k) => "i" + k) }));
    const r = await alice("POST", "/api/auth/signup", {
      email: "Alice@Example.com", password: "correct horse", name: "Alice",
      state: { onboarded: true, profile: { name: "Alice", topics: ["money"] }, stashes, pro: { plan: "annual" }, junk: 1 }
    });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.email, "alice@example.com");
    assert.equal(r.body.user.handle, "alice");
    assert.equal(r.body.pro, false);
    assert.equal(r.body.state.onboarded, true);
    assert.equal(r.body.state.pro, undefined);
    assert.equal(r.body.state.junk, undefined);
    assert.equal(r.body.state.stashes.length, 3);
    assert.equal(r.body.state.stashes.reduce((a, s) => a + s.ideaIds.length, 0), 25);
  });

  test("duplicate email is rejected", async () => {
    const r = await bob("POST", "/api/auth/signup", { email: "alice@example.com", password: "whatever123" });
    assert.equal(r.status, 409);
  });

  test("mutations require JSON (CSRF guard) and a session", async () => {
    const anon = client(ctx.base);
    assert.equal((await anon("PUT", "/api/state", "state=x", { "Content-Type": "application/x-www-form-urlencoded" })).status, 415);
    assert.equal((await anon("PUT", "/api/state", { state: {} })).status, 401);
    assert.equal((await anon("GET", "/api/me")).status, 401);
  });

  test("login, wrong password and logout", async () => {
    const c = client(ctx.base);
    assert.equal((await c("POST", "/api/auth/login", { email: "alice@example.com", password: "wrong password" })).status, 401);
    assert.equal((await c("POST", "/api/auth/login", { email: "ALICE@example.com", password: "correct horse" })).status, 200);
    assert.equal((await c("GET", "/api/me")).status, 200);
    assert.equal((await c("POST", "/api/auth/logout", {})).status, 200);
    assert.equal((await c("GET", "/api/me")).status, 401);
  });

  test("free plan limits are enforced on sync", async () => {
    const me = (await alice("GET", "/api/me")).body;
    const stashes = me.state.stashes;
    const tooMany = [...stashes, { id: "new", name: "New", emoji: "📘", ideaIds: [] }];
    const r = await alice("PUT", "/api/state", { state: { stashes: tooMany } });
    assert.equal(r.status, 402);
    assert.equal(r.body.limit, "stashes");
    const moreSaves = stashes.map((s, i) => (i === 0 ? { ...s, ideaIds: [...s.ideaIds, "i40"] } : s));
    assert.equal((await alice("PUT", "/api/state", { state: { stashes: moreSaves } })).body.limit, "saves");
    // Removing is always fine, and other keys merge in.
    const fewer = stashes.map((s, i) => (i === 0 ? { ...s, ideaIds: s.ideaIds.slice(1) } : s));
    assert.equal((await alice("PUT", "/api/state", { state: { stashes: fewer, theme: "dark" } })).status, 200);
    const after = (await alice("GET", "/api/me")).body.state;
    assert.equal(after.theme, "dark");
    assert.equal(after.onboarded, true);
  });

  test("community ideas and follows are shared between users", async () => {
    await bob("POST", "/api/auth/signup", { email: "bob@example.com", password: "hunter2hunter2", name: "Bob" });
    assert.equal((await alice("POST", "/api/ideas", { title: "T", body: "B", topic: "nope" })).status, 400);
    const created = await alice("POST", "/api/ideas", { title: "Walk after lunch", body: "Ten minutes helps.", topic: "health", source: "s7" });
    assert.equal(created.status, 201);
    const aliceId = created.body.idea.curator;

    assert.equal((await bob("PUT", "/api/follows/" + aliceId, {})).status, 200);
    assert.equal((await bob("PUT", "/api/follows/c3", {})).status, 200);
    assert.equal((await bob("PUT", "/api/follows/c999", {})).status, 404);
    assert.equal((await alice("PUT", "/api/follows/" + aliceId, {})).status, 400);

    const feed = (await bob("GET", "/api/ideas")).body;
    assert.equal(feed.ideas[0].title, "Walk after lunch");
    assert.equal(feed.users[aliceId].followers, 1);
    assert.equal(feed.followers.c3, 1);
    assert.deepEqual((await bob("GET", "/api/me")).body.following, [aliceId, "c3"]);

    const profile = (await bob("GET", "/api/users/" + aliceId)).body;
    assert.equal(profile.user.name, "Alice");
    assert.equal(profile.ideas.length, 1);

    assert.equal((await bob("DELETE", "/api/ideas/" + created.body.idea.id, {})).status, 404);
    assert.equal((await alice("DELETE", "/api/ideas/" + created.body.idea.id, {})).status, 200);
    assert.equal((await bob("DELETE", "/api/follows/c3", {})).status, 200);
    assert.deepEqual((await bob("GET", "/api/me")).body.following, [aliceId]);
  });

  test("demo checkout grants Pro, lifts limits, and can be cancelled", async () => {
    assert.equal((await alice("POST", "/api/billing/checkout", { plan: "weekly" })).status, 400);
    const r = await alice("POST", "/api/billing/checkout", { plan: "quarter" });
    assert.deepEqual(r.body, { activated: true });
    const me = (await alice("GET", "/api/me")).body;
    assert.equal(me.pro, true);
    assert.equal(me.subscription.status, "trialing");
    assert.equal(me.subscription.plan, "quarter");
    assert.equal((await alice("POST", "/api/billing/checkout", { plan: "annual" })).status, 409);
    const many = [...me.state.stashes, { id: "a", name: "A", emoji: "", ideaIds: ["i1"] }, { id: "b", name: "B", emoji: "", ideaIds: ["i2"] }];
    assert.equal((await alice("PUT", "/api/state", { state: { stashes: many } })).status, 200);
    assert.equal((await alice("POST", "/api/billing/cancel", {})).status, 200);
    assert.equal((await alice("GET", "/api/me")).body.pro, false);
  });
});

describe("Brightbits API (Stripe billing)", () => {
  const WEBHOOK_SECRET = "whsec_test_secret";
  const stripeLib = new Stripe("sk_test_fake");
  const calls = [];
  // Fake the network-facing Stripe calls; webhook verification uses the real library.
  const fakeStripe = {
    customers: { create: async (p) => { calls.push(["customer", p]); return { id: "cus_123" }; } },
    checkout: { sessions: { create: async (p) => { calls.push(["checkout", p]); return { url: "https://checkout.stripe.test/c/pay/cs_1" }; } } },
    billingPortal: { sessions: { create: async (p) => { calls.push(["portal", p]); return { url: "https://billing.stripe.test/p/1" }; } } },
    subscriptions: { retrieve: async () => subscription("trialing") },
    webhooks: stripeLib.webhooks
  };
  const subscription = (status) => ({
    id: "sub_1", object: "subscription", customer: "cus_123", status, cancel_at_period_end: false,
    trial_end: Math.floor(Date.now() / 1000) + 7 * 86400, metadata: { userId: "1", plan: "annual" },
    items: { data: [{ price: { id: "price_annual" }, current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400 }] }
  });
  const signed = (event) => {
    const payload = JSON.stringify(event);
    return { payload, header: stripeLib.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET }) };
  };
  let ctx, u;

  before(async () => {
    ctx = await startServer({
      demoBilling: false,
      appUrl: "https://app.example",
      stripe: { secretKey: "sk_test_fake", webhookSecret: WEBHOOK_SECRET, prices: { annual: "price_annual", quarter: "price_q", month: "price_m" } }
    }, fakeStripe);
    u = client(ctx.base);
    await u("POST", "/api/auth/signup", { email: "carol@example.com", password: "password123", name: "Carol" });
  });
  after(() => ctx.server.close());

  test("checkout creates a customer and a trial subscription session", async () => {
    const r = await u("POST", "/api/billing/checkout", { plan: "annual" });
    assert.equal(r.status, 200);
    assert.match(r.body.url, /^https:\/\/checkout\.stripe\.test/);
    const params = calls.find((c) => c[0] === "checkout")[1];
    assert.equal(params.mode, "subscription");
    assert.equal(params.customer, "cus_123");
    assert.equal(params.line_items[0].price, "price_annual");
    assert.equal(params.subscription_data.trial_period_days, 7);
    assert.equal(params.success_url, "https://app.example/?checkout=success#/home");
    assert.equal((await u("GET", "/api/me")).body.pro, false, "no Pro until Stripe confirms");
  });

  test("webhooks with a bad signature are rejected", async () => {
    const r = await fetch(ctx.base + "/api/billing/webhook", {
      method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": "t=1,v1=bad" }, body: "{}"
    });
    assert.equal(r.status, 400);
  });

  test("signed subscription webhooks drive Pro status", async () => {
    const send = async (type, obj) => {
      const { payload, header } = signed({ id: "evt_" + type, object: "event", type, data: { object: obj } });
      return fetch(ctx.base + "/api/billing/webhook", { method: "POST", headers: { "Content-Type": "application/json", "Stripe-Signature": header }, body: payload });
    };
    assert.equal((await send("checkout.session.completed", { id: "cs_1", object: "checkout.session", client_reference_id: "1", customer: "cus_123", subscription: "sub_1" })).status, 200);
    let me = (await u("GET", "/api/me")).body;
    assert.equal(me.pro, true);
    assert.equal(me.subscription.plan, "annual");
    assert.equal(me.subscription.provider, "stripe");

    await send("customer.subscription.updated", subscription("past_due"));
    assert.equal((await u("GET", "/api/me")).body.pro, false);
    await send("customer.subscription.updated", subscription("active"));
    assert.equal((await u("GET", "/api/me")).body.pro, true);
    await send("customer.subscription.deleted", subscription("canceled"));
    me = (await u("GET", "/api/me")).body;
    assert.equal(me.pro, false);
    assert.equal(me.subscription.status, "canceled");
  });

  test("billing portal returns a Stripe URL; demo cancel is refused", async () => {
    const r = await u("POST", "/api/billing/portal", {});
    assert.equal(r.body.url, "https://billing.stripe.test/p/1");
    assert.equal((await u("POST", "/api/billing/cancel", {})).status, 400);
  });

  test("resubscribing skips the free trial", async () => {
    calls.length = 0;
    await u("POST", "/api/billing/checkout", { plan: "month" });
    const params = calls.find((c) => c[0] === "checkout")[1];
    assert.equal(params.subscription_data.trial_period_days, undefined);
    assert.equal(params.line_items[0].price, "price_m");
  });
});

describe("Billing off in production without Stripe", () => {
  test("checkout is unavailable", async () => {
    const ctx = await startServer({ production: true, demoBilling: false, stripe: null });
    const c = client(ctx.base);
    await c("POST", "/api/auth/signup", { email: "d@example.com", password: "password123" });
    assert.equal((await c("GET", "/api/health")).body.billing, "off");
    assert.equal((await c("POST", "/api/billing/checkout", { plan: "annual" })).status, 503);
    ctx.server.close();
  });
});
