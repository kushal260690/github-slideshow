# Brightbits

A micro-learning web app in the style of Deepstash: big ideas from books, articles and podcasts, boiled down to one-minute reads and arranged into a personal growth plan.

Open `index.html` in a browser (or visit `/brightbits/` on GitHub Pages). There's no build step and no dependencies.

## Features

- **Growth-plan quiz**: goals → topics → biggest obstacle → three agree/disagree statements → daily time → name. It ends with a 4-week plan that shows ideas per day, a projected progress curve and a weekly roadmap.
- **Today**: a stable set of daily picks drawn from your topics, a daily-goal ring, week dots and a 🔥 streak.
- **Reader**: full-screen, story-style cards. Swipe or use the ← → keys, and like or stash as you go.
- **Explore**: sources grouped by topic, topic chips, full-text search and a source detail page.
- **Stashes**: collections you can create, rename and delete, plus a Liked list and a "review this stash" session.
- **Create**: write your own ideas. They're searchable and stashable like everything else.
- **Me**: stats, a 7-day activity chart, daily-time and theme (auto/light/dark) settings, topic editing, a retake-quiz option and a reset option.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Shell and tab bar |
| `styles.css` | Mobile-first styles with light and dark tokens |
| `data.js` | Seed topics, goals, sources and 42 ideas (original summaries) |
| `app.js` | Hash router, views, onboarding, reader and state |

All user state lives in `localStorage` under `brightbits.v1`. To add content, append to `sources` and `ideas` in `data.js`.

## Taking it to production

To make this a real multi-user platform, the next steps are:

1. **Backend**: accounts (email or OAuth), plus tables for ideas, sources, stashes, reads and likes. Postgres through Supabase or Firebase maps directly onto the current state shape.
2. **Content pipeline**: an admin or CMS for editors, or AI-assisted summarisation of sources with human review.
3. **Subscriptions**: a paywall after the plan screen, using Stripe or RevenueCat.
4. **Notifications**: daily reminders through web push or email.
5. **Mobile**: add a PWA manifest and service worker, or wrap the app with Capacitor.
