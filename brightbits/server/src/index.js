import { loadConfig } from "./config.js";
import { openDb } from "./db.js";
import { createApp } from "./app.js";

const config = loadConfig();
const db = openDb(config.databasePath);
const app = createApp({ db, config });

// Clear expired sessions hourly.
setInterval(() => db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now()), 3600e3).unref();

app.listen(config.port, () => {
  console.log(`Brightbits running at ${config.appUrl} (billing: ${config.stripe ? "stripe" : config.demoBilling ? "demo" : "off"})`);
  if (config.stripe && !config.stripe.webhookSecret) console.warn("STRIPE_WEBHOOK_SECRET is not set: subscriptions won't sync from Stripe.");
});
