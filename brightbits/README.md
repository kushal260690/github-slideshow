# Brightbits

A micro-learning web app in the style of Deepstash: big ideas from books, articles and podcasts, boiled down to one-minute reads and arranged into a personal growth plan.

Open `index.html` in a browser (or visit `/brightbits/` on GitHub Pages). There's no build step and no dependencies.

## Features

- **Growth-plan quiz**: age → goals → topics → biggest obstacle → three agree/disagree statements → daily time → name. It ends with a 4-week plan (ideas per day, a progress curve and a weekly roadmap) and then the Pro offer.
- **Home feed**: "For you" and "Following" tabs with infinite scroll. Full idea cards show the curator, source cover, stash and like counts, audio and share. An idea counts as read once it has been on screen for a moment.
- **Daily plan and streaks**: a daily-goal ring, week dots, a 🔥 streak and a "continue journey" strip.
- **Curators**: follow or unfollow curators, and see profile pages with each curator's stashed ideas and follower counts.
- **Journeys**: multi-day guided courses. Each day unlocks after the previous one. The first journey is free and the rest need Pro.
- **Reader**: full-screen, story-style cards with swipe and arrow keys. On Pro, 🎧 auto-plays through the ideas using the browser's text-to-speech.
- **Explore**: journeys, curators to follow, sources, most-stashed ideas, topic chips, and search across ideas, sources and people.
- **Library**: stashes (collections), reading history grouped by day, and liked ideas.
- **Create**: publish your own ideas, optionally linked to a source. They appear on your public profile.
- **Me**: stats, a 7-day activity chart, 9 badges, settings (daily time, theme, topics), and subscription management.
- **Pro paywall**: three plans with a countdown and a 7-day trial. Free limits: 3 stashes, 25 saves and 3 days of history, with no audio and no premium journeys. In static mode no payment is taken and "Start trial" only unlocks Pro on this device. With the server it goes through Stripe (see below).

## Two ways to run it

**1. Static (offline) mode.** Open `index.html`, or host the folder on GitHub Pages. Everything is stored in `localStorage` and Pro is only simulated. Nothing to install.

**2. Full platform with the server.** Accounts, synced progress, a community feed, real follows and Stripe subscriptions:

```bash
cd brightbits/server
npm install
npm start            # http://localhost:8787
npm test             # API test suite
```

The frontend detects the API automatically (`GET /api/health`). If there's no server, it falls back to static mode.

## How the platform works

- **Accounts**: new users take the growth-plan quiz, then create an account ("Save your plan") before the paywall. Returning users log in from the welcome screen. Passwords are hashed with scrypt. Sessions use a random token in an `HttpOnly`, `SameSite=Lax` cookie, and only its SHA-256 hash is stored. Login and signup are rate-limited.
- **Sync**: your plan, stashes, likes, history, journeys, badges and theme are saved to your account, debounced, and merged on the server.
- **Community**: ideas you publish are stored on the server and appear in everyone's feed. Follows are real, so follower counts come from the database. Profiles live at `#/u/u<id>`.
- **Pro is server-authoritative**: the client can't grant itself Pro, and the free limits (3 stashes, 25 saves) are also enforced by the API.
- **Billing**: `POST /api/billing/checkout` opens a Stripe Checkout subscription with a 7-day trial (only on the first subscription). The Stripe customer portal handles cancelling, upgrading and card updates. Webhooks keep the subscription status in sync. Without Stripe keys the server runs in **demo billing**, which grants Pro with no payment. It's on by default in development and off in production unless you set `ALLOW_DEMO_BILLING=1`.
- **Security**: state-changing API calls must be JSON, which blocks cross-site form posts. Stored state is whitelisted and size-capped, and the server only serves the five frontend files, never its own code.

## Setting up Stripe

1. Create a product with three **recurring prices** (12 months, 3 months, 1 month) in the Stripe dashboard. Test mode is fine to start.
2. Copy `server/.env.example` to `server/.env`, then set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_QUARTER`, `STRIPE_PRICE_MONTH` and `APP_URL`.
3. Add a webhook endpoint at `https://<your-domain>/api/billing/webhook` for these events: `checkout.session.completed` and `customer.subscription.created`, `.updated` and `.deleted`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`. For local testing, run `stripe listen --forward-to localhost:8787/api/billing/webhook`.
4. Turn on the customer portal (Settings → Billing → Customer portal).
5. Update the displayed prices in `data.js` (`plans`) to match your Stripe prices.

## Deploying

The `Dockerfile` builds a single container with the frontend and API:

```bash
docker build -t brightbits brightbits
docker run -p 8787:8787 -v brightbits-data:/data --env-file brightbits/server/.env brightbits
```

It works on any host with a persistent disk, such as Fly.io, Render or Railway. SQLite lives at `DATABASE_PATH`, so mount a volume there. Serve it over HTTPS so the session cookie is `Secure`.

## Structure

| Path | Purpose |
| --- | --- |
| `index.html`, `styles.css` | Shell, tab bar, mobile-first light and dark styles |
| `data.js` | Seed catalogue: topics, goals, curators, sources, journeys, plans, 42 ideas (original summaries). Shared with the server. |
| `app.js` | Hash router, views, onboarding, reader, local state |
| `api.js` | API client: detection, auth, debounced sync |
| `server/src/app.js` | Express routes: auth, state, ideas, follows, users, billing |
| `server/src/billing.js` | Stripe Checkout, customer portal, webhooks, demo billing |
| `server/src/auth.js`, `db.js` | Password hashing and sessions; SQLite schema (`node:sqlite`, no native dependencies) |
| `server/test/api.test.js` | 16 API tests, including signed Stripe webhooks |

## API

| Method | Path | |
| --- | --- | --- |
| GET | `/api/health` | Server and billing mode |
| POST | `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout` | Accounts |
| GET / PATCH | `/api/me` | Account, subscription, synced state, follows |
| PUT | `/api/state` | Save synced state (free limits enforced) |
| GET / POST / DELETE | `/api/ideas`, `/api/ideas/:id` | Community ideas |
| GET | `/api/users/:id` | Public profile |
| PUT / DELETE | `/api/follows/:target` | Follow a curator (`c1`…) or user (`u12`) |
| POST | `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/cancel` (demo) | Subscriptions |
| POST | `/api/billing/webhook` | Stripe events |

## Still to do

- Password reset and email verification (needs an email provider such as Postmark or Resend).
- Daily reminder notifications (web push or email).
- An admin or CMS for editors to add sources and ideas. They currently live in `data.js`.
- Content moderation and reporting for community ideas.
- An installable app: a PWA manifest and service worker, or Capacitor for the app stores.
