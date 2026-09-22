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
- **Pro paywall (simulated)**: three plans with a countdown and a 7-day trial. Free limits: 3 stashes, 25 saves and 3 days of history, with no audio and no premium journeys. **No payment is taken.** "Start trial" only unlocks Pro on this device.

## Structure

| File | Purpose |
| --- | --- |
| `index.html` | Shell and tab bar |
| `styles.css` | Mobile-first styles with light and dark tokens |
| `data.js` | Seed topics, goals, curators, sources, journeys, plans and 42 ideas (original summaries) |
| `app.js` | Hash router, views, onboarding, reader and state |

All user state lives in `localStorage` under `brightbits.v1`. To add content, append to `sources` and `ideas` in `data.js`.

## Taking it to production

To make this a real multi-user platform, the next steps are:

1. **Backend**: accounts (email or OAuth), plus tables for ideas, sources, stashes, reads and likes. Postgres through Supabase or Firebase maps directly onto the current state shape.
2. **Content pipeline**: an admin or CMS for editors, or AI-assisted summarisation of sources with human review.
3. **Subscriptions**: connect the existing paywall to Stripe (web) or RevenueCat (mobile) and enforce limits on the server.
4. **Notifications**: daily reminders through web push or email.
5. **Mobile**: add a PWA manifest and service worker, or wrap the app with Capacitor.
