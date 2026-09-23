import Stripe from "stripe";

const ACTIVE = new Set(["trialing", "active"]);

export function subscriptionFor(db, userId) {
  const row = db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId);
  if (!row) return null;
  return {
    provider: row.provider,
    plan: row.plan,
    status: row.status,
    active: ACTIVE.has(row.status),
    trialEnd: row.trial_end,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: !!row.cancel_at_period_end
  };
}
export const isPro = (db, userId) => !!subscriptionFor(db, userId)?.active;

function upsert(db, userId, s) {
  db.prepare(`
    INSERT INTO subscriptions (user_id, provider, plan, status, stripe_subscription_id, trial_end, current_period_end, cancel_at_period_end, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET provider = excluded.provider, plan = excluded.plan, status = excluded.status,
      stripe_subscription_id = excluded.stripe_subscription_id, trial_end = excluded.trial_end,
      current_period_end = excluded.current_period_end, cancel_at_period_end = excluded.cancel_at_period_end, updated_at = excluded.updated_at
  `).run(userId, s.provider, s.plan ?? null, s.status, s.subscriptionId ?? null, s.trialEnd ?? null, s.periodEnd ?? null, s.cancelAtPeriodEnd ? 1 : 0, Date.now());
}

export class BillingError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function createBilling({ db, config, stripe: injected }) {
  const stripe = injected || (config.stripe ? new Stripe(config.stripe.secretKey) : null);
  const mode = stripe ? "stripe" : config.demoBilling ? "demo" : "off";
  const planForPrice = (priceId) =>
    Object.entries(config.stripe?.prices || {}).find(([, id]) => id && id === priceId)?.[0] || null;

  async function ensureCustomer(user) {
    if (user.stripe_customer_id) return user.stripe_customer_id;
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: String(user.id) } });
    db.prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?").run(customer.id, user.id);
    return customer.id;
  }

  function syncStripeSubscription(sub) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    let user = db.prepare("SELECT id FROM users WHERE stripe_customer_id = ?").get(customerId);
    if (!user && sub.metadata?.userId) user = db.prepare("SELECT id FROM users WHERE id = ?").get(Number(sub.metadata.userId));
    if (!user) return false;
    const item = sub.items?.data?.[0];
    const periodEnd = sub.current_period_end ?? item?.current_period_end ?? null;
    upsert(db, user.id, {
      provider: "stripe",
      plan: planForPrice(item?.price?.id) || sub.metadata?.plan || null,
      status: sub.status,
      subscriptionId: sub.id,
      trialEnd: sub.trial_end ? sub.trial_end * 1000 : null,
      periodEnd: periodEnd ? periodEnd * 1000 : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end
    });
    return true;
  }

  return {
    mode,

    async checkout(user, plan) {
      if (mode === "off") throw new BillingError(503, "Billing is not configured");
      const existing = subscriptionFor(db, user.id);
      if (existing?.active) throw new BillingError(409, "You already have Pro");
      if (mode === "demo") {
        const trialEnd = Date.now() + config.trialDays * 864e5;
        upsert(db, user.id, { provider: "demo", plan, status: "trialing", trialEnd, periodEnd: trialEnd });
        return { activated: true };
      }
      const price = config.stripe.prices[plan];
      if (!price) throw new BillingError(500, "No Stripe price configured for plan " + plan);
      const customer = await ensureCustomer(user);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: String(user.id),
        line_items: [{ price, quantity: 1 }],
        subscription_data: {
          ...(config.trialDays > 0 && !existing ? { trial_period_days: config.trialDays } : {}),
          metadata: { userId: String(user.id), plan }
        },
        allow_promotion_codes: true,
        success_url: config.appUrl + "/?checkout=success#/home",
        cancel_url: config.appUrl + "/?checkout=cancel#/pro"
      });
      return { url: session.url };
    },

    async portal(user) {
      if (mode === "stripe") {
        if (!user.stripe_customer_id) throw new BillingError(400, "No billing account yet");
        const session = await stripe.billingPortal.sessions.create({ customer: user.stripe_customer_id, return_url: config.appUrl + "/#/me" });
        return { url: session.url };
      }
      throw new BillingError(400, "The billing portal needs Stripe");
    },

    // Demo mode only: there is no Stripe portal, so cancel directly.
    cancelDemo(user) {
      const sub = subscriptionFor(db, user.id);
      if (!sub || sub.provider !== "demo") throw new BillingError(400, "No demo subscription to cancel");
      upsert(db, user.id, { provider: "demo", plan: sub.plan, status: "canceled", trialEnd: sub.trialEnd, periodEnd: Date.now() });
    },

    async handleWebhook(rawBody, signature) {
      if (mode !== "stripe" || !config.stripe.webhookSecret) throw new BillingError(400, "Webhooks are not configured");
      let event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, config.stripe.webhookSecret);
      } catch (e) {
        throw new BillingError(400, "Invalid signature");
      }
      const obj = event.data.object;
      switch (event.type) {
        case "checkout.session.completed":
          if (obj.client_reference_id && obj.customer) {
            db.prepare("UPDATE users SET stripe_customer_id = COALESCE(stripe_customer_id, ?) WHERE id = ?")
              .run(typeof obj.customer === "string" ? obj.customer : obj.customer.id, Number(obj.client_reference_id));
          }
          if (obj.subscription) syncStripeSubscription(await stripe.subscriptions.retrieve(typeof obj.subscription === "string" ? obj.subscription : obj.subscription.id));
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "customer.subscription.paused":
        case "customer.subscription.resumed":
          syncStripeSubscription(obj);
          break;
      }
      return event.type;
    }
  };
}
