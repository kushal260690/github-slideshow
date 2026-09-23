// Loads the seed catalogue from the frontend's data.js so client and server agree on ids.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { WEB_ROOT } from "./config.js";

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(WEB_ROOT, "data.js"), "utf8"), sandbox);
const data = sandbox.window.BB_DATA;

export const TOPIC_IDS = new Set(data.topics.map((t) => t.id));
export const SOURCE_IDS = new Set(data.sources.map((s) => s.id));
export const CURATOR_IDS = new Set(data.curators.map((c) => c.id));
export const PLAN_IDS = new Set(data.plans.map((p) => p.id));

// Keep in sync with FREE_* constants in app.js.
export const FREE_LIMITS = { stashes: 3, saves: 25 };
