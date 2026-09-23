import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(here, "..");
export const WEB_ROOT = path.resolve(SERVER_ROOT, "..");

// Minimal .env loader so there's no dotenv dependency. Real env vars win.
function loadDotEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadDotEnv(path.join(SERVER_ROOT, ".env"));

export function loadConfig(env = process.env) {
  const production = env.NODE_ENV === "production";
  const stripeKey = env.STRIPE_SECRET_KEY || "";
  return {
    production,
    port: Number(env.PORT) || 8787,
    appUrl: (env.APP_URL || "http://localhost:" + (Number(env.PORT) || 8787)).replace(/\/$/, ""),
    databasePath: env.DATABASE_PATH || path.join(SERVER_ROOT, "data", "brightbits.db"),
    trialDays: Number(env.TRIAL_DAYS ?? 7),
    stripe: stripeKey
      ? {
          secretKey: stripeKey,
          webhookSecret: env.STRIPE_WEBHOOK_SECRET || "",
          prices: { annual: env.STRIPE_PRICE_ANNUAL || "", quarter: env.STRIPE_PRICE_QUARTER || "", month: env.STRIPE_PRICE_MONTH || "" }
        }
      : null,
    demoBilling: !stripeKey && (!production || env.ALLOW_DEMO_BILLING === "1")
  };
}
