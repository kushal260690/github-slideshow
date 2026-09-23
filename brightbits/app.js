(function () {
  "use strict";

  var D = window.BB_DATA;
  var API = window.BB_API;
  var KEY = "brightbits.v1";
  var SYNC_KEYS = ["onboarded", "profile", "stashes", "liked", "history", "journeys", "badges", "theme"];
  var FREE_STASH_LIMIT = 3;
  var FREE_SAVE_LIMIT = 25;
  var FREE_HISTORY_DAYS = 3;
  var $app = document.getElementById("app");
  var $tabbar = document.getElementById("tabbar");
  var $modal = document.getElementById("modal-root");
  var $toast = document.getElementById("toast");

  // ---------- State ----------
  function defaultState() {
    return {
      onboarded: false,
      profile: { name: "", age: "", goals: [], topics: [], challenge: "", minutes: 10, answers: {} },
      stashes: [
        { id: "st-fav", name: "Favourites", emoji: "⭐", ideaIds: [] },
        { id: "st-later", name: "Read later", emoji: "🔖", ideaIds: [] }
      ],
      liked: [],
      history: {}, // "YYYY-MM-DD" -> [ideaId]
      custom: [],
      following: [],
      journeys: {}, // journeyId -> { done: [dayIndex] }
      badges: [],
      pro: null, // { plan, since, trialEnds }
      theme: "auto"
    };
  }
  var state = load();
  // Server mode only: the signed-in account, and shared community data.
  var account = null; // { user, subscription }
  var community = { ideas: [], users: {}, followers: {} };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = Object.assign(defaultState(), JSON.parse(raw));
        s.profile = Object.assign(defaultState().profile, s.profile);
        return s;
      }
    } catch (e) { /* storage unavailable */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    if (API.online && account) API.saveState(syncable(state));
  }
  function syncable(s) {
    var out = {};
    SYNC_KEYS.forEach(function (k) { out[k] = s[k]; });
    return out;
  }
  // Server responses are the source of truth for progress, follows and Pro status.
  function applyServer(me) {
    account = { user: me.user, subscription: me.subscription };
    var theme = state.theme;
    state = Object.assign(defaultState(), me.state || {});
    state.profile = Object.assign(defaultState().profile, state.profile);
    if (!me.state || !me.state.theme) state.theme = theme;
    state.following = me.following || [];
    state.custom = [];
    var sub = me.subscription;
    state.pro = me.pro ? { plan: sub.plan, since: 0, trialEnds: sub.trialEnd || sub.currentPeriodEnd, provider: sub.provider, status: sub.status, cancelAtPeriodEnd: sub.cancelAtPeriodEnd } : null;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function refreshMe() {
    return API.me().then(function (me) { applyServer(me); return me; });
  }
  function loadCommunity() {
    if (!API.online) return Promise.resolve();
    return API.ideas().then(function (r) { community = r; }).catch(function () { /* keep what we have */ });
  }
  API.onSyncError(function (e) {
    toast(e.status === 402 ? "🔒 " + e.message + " — go Pro for unlimited" : "Couldn't sync: " + e.message);
    if (e.status === 402 || e.status === 400) refreshMe().then(rerenderKeepScroll, function () {});
  });

  // ---------- Helpers ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function byId(list, id) { return list.find(function (x) { return x.id === id; }); }
  function topic(id) { return byId(D.topics, id) || { id: id, name: id, emoji: "✨", color: "#ff6b3d" }; }
  function source(id) { return byId(D.sources, id); }
  function journey(id) { return byId(D.journeys, id); }
  function allIdeas() { return D.ideas.concat(API.online ? community.ideas : state.custom); }
  function idea(id) { return byId(allIdeas(), id); }
  function myId() { return account ? account.user.id : "me"; }
  function myIdeas() { return allIdeas().filter(function (i) { return i.curator === "me" || (account && i.curator === account.user.id); }); }
  function me() {
    var u = account && account.user;
    var n = (u && u.name) || state.profile.name || "You";
    return { id: "me", name: n, handle: (u && u.handle) || n.toLowerCase().replace(/[^a-z0-9]/g, "") || "you", bio: (u && u.bio) || "Growing a little every day.", color: "var(--accent)", followers: u ? u.followers : 0 };
  }
  var USER_COLORS = ["#ef476f", "#3a86ff", "#ff7b00", "#2ec27e", "#9b5de5", "#17c3b2"];
  function curator(id) {
    if (id === "me" || (account && id === account.user.id)) return me();
    var seed = byId(D.curators, id);
    if (seed) return seed;
    var u = community.users[id];
    return u ? Object.assign({ color: USER_COLORS[hash(id) % USER_COLORS.length] }, u, { followers: 0 }) : null;
  }
  // Seed curators have a baseline audience; real follows from the server (or this device) add to it.
  function followerCount(c) {
    if (c.id === "me") return c.followers;
    var real = API.online ? (community.followers[c.id] || 0) : (state.following.indexOf(c.id) >= 0 ? 1 : 0);
    return (c.followers || 0) + real;
  }
  function ideaCurator(i) {
    if (i.curator) return curator(i.curator);
    var s = source(i.source);
    return s ? curator(s.curator) : null;
  }
  function isPro() { return !!state.pro; }
  function compact(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n); }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  function isMine(i) { return i.curator === "me" || (!!account && i.curator === account.user.id); }
  function saveCount(i) { return (isMine(i) || !byId(D.ideas, i.id) ? 0 : 120 + (hash(i.id) % 4700)) + (isStashed(i.id) ? 1 : 0); }
  function likeCount(i) { return (isMine(i) || !byId(D.ideas, i.id) ? 0 : 40 + (hash(i.id + "l") % 1900)) + (state.liked.indexOf(i.id) >= 0 ? 1 : 0); }

  function readSet() {
    var s = {};
    Object.keys(state.history).forEach(function (k) { state.history[k].forEach(function (id) { s[id] = true; }); });
    return s;
  }
  function dailyGoal() { return Math.max(3, Math.round(state.profile.minutes / 2)); }
  function todayCount() { return (state.history[dayKey()] || []).length; }
  function hitGoal(key) { return (state.history[key] || []).length >= dailyGoal(); }
  function streak() {
    var n = 0, d = new Date();
    if (!hitGoal(dayKey(d))) d = addDays(d, -1); // today still in progress
    while (hitGoal(dayKey(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function stashedTotal() { return state.stashes.reduce(function (a, s) { return a + s.ideaIds.length; }, 0); }
  function isStashed(id) { return state.stashes.some(function (s) { return s.ideaIds.indexOf(id) >= 0; }); }

  // Deterministic shuffle so picks are stable for a given day.
  function seeded(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  function myTopics() { return state.profile.topics.length ? state.profile.topics : D.topics.map(function (t) { return t.id; }); }
  function todaysPicks() {
    var topics = myTopics();
    var today = state.history[dayKey()] || [];
    var read = readSet();
    var rnd = seeded(dayKey() + topics.join());
    var pool = D.ideas.filter(function (i) { return topics.indexOf(i.topic) >= 0; })
      .map(function (i) { return [rnd(), i]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    var picks = today.map(idea).filter(Boolean).slice(0, dailyGoal());
    var fresh = pool.filter(function (i) { return !read[i.id]; });
    var rest = fresh.length ? fresh : pool;
    for (var k = 0; picks.length < dailyGoal() && k < rest.length; k++) {
      if (picks.indexOf(rest[k]) < 0) picks.push(rest[k]);
    }
    return picks;
  }
  // "For you" ranking: your topics first, everything else mixed in lower.
  function forYou() {
    var topics = myTopics(), rnd = seeded("fy" + dayKey() + topics.join()), read = readSet();
    return allIdeas().map(function (i) {
      var score = rnd() * (topics.indexOf(i.topic) >= 0 ? 1 : 0.4) * (read[i.id] ? 0.5 : 1);
      return [score, i];
    }).sort(function (a, b) { return b[0] - a[0]; }).map(function (x) { return x[1]; });
  }
  function followingFeed() {
    return allIdeas().filter(function (i) { var c = ideaCurator(i); return c && state.following.indexOf(c.id) >= 0; })
      .sort(function (a, b) { return hash(b.id + dayKey()) - hash(a.id + dayKey()); });
  }

  function markRead(id) {
    var k = dayKey();
    state.history[k] = state.history[k] || [];
    if (state.history[k].indexOf(id) >= 0) return false;
    var before = hitGoal(k);
    state.history[k].push(id);
    save();
    if (!before && hitGoal(k)) toast("🔥 Daily goal reached — " + streak() + "-day streak!");
    checkBadges();
    return true;
  }
  function toggleLike(id) {
    var i = state.liked.indexOf(id);
    if (i >= 0) state.liked.splice(i, 1); else state.liked.push(id);
    save(); checkBadges();
    return i < 0;
  }
  function toggleFollow(cid) {
    var i = state.following.indexOf(cid), on = i < 0;
    if (on) state.following.push(cid); else state.following.splice(i, 1);
    if (API.online && account) {
      community.followers[cid] = Math.max(0, (community.followers[cid] || 0) + (on ? 1 : -1));
      API.follow(cid, on).catch(function (e) {
        toast("Couldn't update follow: " + e.message);
        refreshMe().then(loadCommunity).then(rerenderKeepScroll, function () {});
      });
    }
    save(); checkBadges();
    return on;
  }

  // ---------- Badges ----------
  var BADGES = [
    { id: "first", emoji: "🌱", name: "First idea", desc: "Read your first idea", test: function () { return Object.keys(readSet()).length >= 1; } },
    { id: "goal", emoji: "🎯", name: "Goal getter", desc: "Hit your daily goal", test: function () { return Object.keys(state.history).some(hitGoal); } },
    { id: "streak3", emoji: "🔥", name: "On fire", desc: "3-day streak", test: function () { return streak() >= 3; } },
    { id: "streak7", emoji: "⚡", name: "Unstoppable", desc: "7-day streak", test: function () { return streak() >= 7; } },
    { id: "reader50", emoji: "📚", name: "Bookworm", desc: "Read 50 ideas", test: function () { return Object.keys(readSet()).length >= 50; } },
    { id: "collector", emoji: "📌", name: "Collector", desc: "Stash 10 ideas", test: function () { return stashedTotal() >= 10; } },
    { id: "social", emoji: "🤝", name: "Networker", desc: "Follow 3 curators", test: function () { return state.following.length >= 3; } },
    { id: "creator", emoji: "✍️", name: "Creator", desc: "Publish an idea", test: function () { return myIdeas().length >= 1; } },
    { id: "journey", emoji: "🏁", name: "Finisher", desc: "Complete a journey", test: function () { return D.journeys.some(function (j) { return journeyDone(j) === j.days.length; }); } }
  ];
  function checkBadges() {
    BADGES.forEach(function (b) {
      if (state.badges.indexOf(b.id) < 0 && b.test()) {
        state.badges.push(b.id); save();
        setTimeout(function () { toast(b.emoji + " Badge unlocked: " + b.name); }, 900);
      }
    });
  }

  // ---------- Journeys ----------
  function journeyDone(j) { return ((state.journeys[j.id] || {}).done || []).length; }
  function journeyLocked(j) { return j.pro && !isPro(); }
  function activeJourney() {
    return D.journeys.find(function (j) { var n = journeyDone(j); return state.journeys[j.id] && n < j.days.length; });
  }
  function completeJourneyDay(jid, idx) {
    var js = state.journeys[jid] = state.journeys[jid] || { done: [] };
    if (js.done.indexOf(idx) < 0) js.done.push(idx);
    save(); checkBadges();
  }

  // ---------- UI helpers ----------
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { $toast.classList.remove("show"); }, 2200);
  }
  function ring(pct, size, stroke) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - Math.min(1, pct)) + '" style="transition:stroke-dashoffset .4s"/></svg>';
  }
  function avatar(c, size) {
    size = size || 32;
    return '<span class="av" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.42) + "px;background:" + c.color + '">' + esc(c.name.charAt(0).toUpperCase()) + "</span>";
  }
  function proTag() { return '<span class="pro-tag">PRO</span>'; }
  function applyTheme() {
    if (state.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
  }
  function requirePro(reason) {
    if (isPro()) return true;
    paywallReason = reason || "";
    location.hash = "#/pro";
    return false;
  }

  // ---------- Audio (Pro): browser text-to-speech ----------
  var speaking = null;
  function canSpeak() { return "speechSynthesis" in window; }
  function speak(i, onEnd) {
    stopSpeak();
    if (!canSpeak()) { toast("Audio isn't supported in this browser"); return; }
    var u = new SpeechSynthesisUtterance(i.title + ". " + i.body);
    u.rate = 1;
    u.onend = function () { speaking = null; if (onEnd) onEnd(); };
    speaking = i.id;
    speechSynthesis.speak(u);
  }
  function stopSpeak() { speaking = null; if (canSpeak()) speechSynthesis.cancel(); }

  // ---------- Onboarding (growth-plan quiz) ----------
  var ob = { step: 0, draft: null };
  var AGES = ["18–24", "25–34", "35–44", "45–54", "55+"];
  var STATEMENTS = [
    { id: "unfinished", text: "I often start things but struggle to finish them." },
    { id: "scroll", text: "I spend more time scrolling than I'd like to." },
    { id: "learn", text: "I want to learn more, but long books feel like a big commitment." }
  ];
  var CHALLENGES = [
    { id: "time", label: "Not enough time", emoji: "⏰" },
    { id: "focus", label: "Staying focused", emoji: "📱" },
    { id: "overwhelm", label: "Too much information", emoji: "🌊" },
    { id: "motivation", label: "Staying motivated", emoji: "🔋" }
  ];
  var MINUTES = [
    { v: 5, label: "5 min / day", sub: "Casual" },
    { v: 10, label: "10 min / day", sub: "Regular" },
    { v: 15, label: "15 min / day", sub: "Serious" },
    { v: 20, label: "20+ min / day", sub: "Intense" }
  ];
  // Steps: 0 welcome, 1 age, 2 goals, 3 topics, 4 challenge, 5-7 statements, 8 minutes, 9 name, 10 building, 11 plan
  var OB_LAST_Q = 9;

  function renderOnboarding() {
    if (!ob.draft) ob.draft = JSON.parse(JSON.stringify(state.profile));
    var p = ob.draft, s = ob.step, html = "";
    var top = s > 0 && s <= OB_LAST_Q
      ? '<div class="ob-top"><button class="icon-btn" data-act="ob-back" aria-label="Back">←</button>' +
        '<div class="progress"><i style="width:' + Math.round((s / OB_LAST_Q) * 100) + '%"></i></div>' +
        '<span class="small muted">' + s + "/" + OB_LAST_Q + "</span></div>"
      : "";

    if (s === 0) {
      html = '<div class="hero ob-step"><div class="logo">✨</div><h1>Get smarter in 10 minutes a day</h1>' +
        '<p class="muted">Big ideas from books, articles and podcasts, boiled down to 1-minute reads and arranged into a growth plan built around your goals.</p>' +
        '<div class="stack">' + D.topics.slice(0, 6).map(function (t) { return '<span class="pill">' + t.emoji + " " + t.name + "</span>"; }).join("") + "</div>" +
        '<button class="btn block" data-act="ob-next">Build my growth plan</button>' +
        '<p class="small muted" style="margin-top:14px">⭐ 4.8 average from our readers · Takes 1 minute</p>' +
        (API.online ? '<p><button class="link-btn" data-act="show-login">I already have an account</button></p>' : "") + "</div>";
    } else if (s === 1) {
      html = '<div class="ob-step"><h1>How old are you?</h1><p class="lead">We use this to pick ideas that fit your stage of life.</p><div class="options">' +
        AGES.map(function (a) { return optBtn("age", a, "🙂", a, p.age === a, false); }).join("") + "</div></div>";
    } else if (s === 2) {
      html = '<div class="ob-step"><h1>What do you want to work on?</h1><p class="lead">Pick all that apply.</p><div class="options">' +
        D.goals.map(function (g) { return optBtn("goal", g.id, g.emoji, g.label, p.goals.indexOf(g.id) >= 0, true); }).join("") +
        '</div><div class="sticky-cta"><button class="btn block" data-act="ob-next"' + (p.goals.length ? "" : " disabled") + ">Continue</button></div></div>";
    } else if (s === 3) {
      if (!p.topics.length) {
        p.goals.forEach(function (gid) {
          byId(D.goals, gid).topics.forEach(function (t) { if (p.topics.indexOf(t) < 0) p.topics.push(t); });
        });
      }
      html = '<div class="ob-step"><h1>Pick your topics</h1><p class="lead">We pre-selected a few based on your goals. Choose at least 2.</p><div class="options grid2">' +
        D.topics.map(function (t) { return optBtn("topic", t.id, t.emoji, t.name, p.topics.indexOf(t.id) >= 0, true); }).join("") +
        '</div><div class="sticky-cta"><button class="btn block" data-act="ob-next"' + (p.topics.length >= 2 ? "" : " disabled") + ">Continue</button></div></div>";
    } else if (s === 4) {
      html = '<div class="ob-step"><h1>What gets in the way most?</h1><p class="lead">We\'ll shape your plan around it.</p><div class="options">' +
        CHALLENGES.map(function (c) { return optBtn("challenge", c.id, c.emoji, c.label, p.challenge === c.id, false); }).join("") + "</div></div>";
    } else if (s >= 5 && s <= 7) {
      var st = STATEMENTS[s - 5], val = p.answers[st.id];
      html = '<div class="ob-step"><p class="small muted">Do you agree with this statement?</p><div class="statement">“' + esc(st.text) + '”</div>' +
        '<div class="scale">' + ["😣", "🙁", "😐", "🙂", "😄"].map(function (e, i) {
          return '<button data-act="answer" data-id="' + st.id + '" data-v="' + (i + 1) + '" class="' + (val === i + 1 ? "sel" : "") + '" aria-label="' + (i + 1) + ' of 5">' + e + "</button>";
        }).join("") + '</div><div class="scale-legend"><span>Strongly disagree</span><span>Strongly agree</span></div></div>';
    } else if (s === 8) {
      html = '<div class="ob-step"><h1>How much time can you give it?</h1><p class="lead">Each idea takes about a minute to read. You can change this later.</p><div class="options">' +
        MINUTES.map(function (m) {
          return '<button class="opt ' + (p.minutes === m.v ? "sel" : "") + '" data-act="minutes" data-v="' + m.v + '"><span class="emo">⏱️</span><span><b>' + m.label + '</b><br><span class="small muted">' + m.sub + " · " + Math.max(3, Math.round(m.v / 2)) + ' ideas a day</span></span><span class="check">' + (p.minutes === m.v ? "✓" : "") + "</span></button>";
        }).join("") + "</div></div>";
    } else if (s === 9) {
      html = '<div class="ob-step"><h1>What should we call you?</h1><p class="lead">So your plan feels like yours.</p>' +
        '<input class="text-input" id="ob-name" maxlength="30" placeholder="Your first name" value="' + esc(p.name) + '" autocomplete="given-name">' +
        '<button class="btn block" data-act="ob-next">Create my plan</button></div>';
    } else if (s === 10) {
      html = '<div class="builder ob-step"><div class="ring-wrap" id="bring">' + ring(0, 160, 12) + '<div class="pct" id="bpct">0%</div></div>' +
        '<h2>Building your growth plan…</h2><ul class="build-steps" id="bsteps">' +
        ["Analysing your goals", "Matching ideas to your topics", "Pacing your daily sessions", "Finalising your 4-week plan"].map(function (t) { return "<li>" + t + "</li>"; }).join("") +
        "</ul></div>";
    } else if (s === 11) {
      html = renderPlan(p, true);
    } else if (s === 12) {
      html = '<div class="ob-step"><div class="hero" style="padding-top:0"><div class="logo">🔐</div></div><h1>Save your plan</h1>' +
        '<p class="lead">Create a free account to keep your plan, streak and stashes on every device.</p>' +
        '<form id="auth-form" data-mode="signup" novalidate>' +
        '<input class="text-input" name="name" maxlength="30" placeholder="First name" autocomplete="given-name" value="' + esc(p.name) + '">' +
        '<input class="text-input" name="email" type="email" required placeholder="Email" autocomplete="email">' +
        '<input class="text-input" name="password" type="password" required minlength="8" placeholder="Password (8+ characters)" autocomplete="new-password">' +
        '<p class="form-error" id="auth-err" role="alert"></p>' +
        '<button class="btn block" type="submit">Create account</button></form>' +
        '<p style="text-align:center"><button class="link-btn" data-act="show-login">I already have an account</button></p></div>';
    } else if (s === "login") {
      html = '<div class="ob-step"><div class="ob-top"><button class="icon-btn" data-act="ob-restart" aria-label="Back">←</button></div><h1>Welcome back</h1><p class="lead">Log in to pick up where you left off.</p>' +
        '<form id="auth-form" data-mode="login" novalidate>' +
        '<input class="text-input" name="email" type="email" required placeholder="Email" autocomplete="email">' +
        '<input class="text-input" name="password" type="password" required placeholder="Password" autocomplete="current-password">' +
        '<p class="form-error" id="auth-err" role="alert"></p>' +
        '<button class="btn block" type="submit">Log in</button></form>' +
        '<p style="text-align:center"><button class="link-btn" data-act="ob-restart">New here? Build your growth plan</button></p></div>';
    }
    $app.innerHTML = top + html;
    if (s === 9) { var n = document.getElementById("ob-name"); n.focus(); n.addEventListener("keydown", function (e) { if (e.key === "Enter") act("ob-next"); }); }
    if (s === 10) runBuilder();
    var form = document.getElementById("auth-form");
    if (form) form.addEventListener("submit", submitAuth);
  }

  function submitAuth(e) {
    e.preventDefault();
    var f = e.target, mode = f.dataset.mode, err = document.getElementById("auth-err"), btn = f.querySelector("button[type=submit]");
    var email = f.email.value.trim(), password = f.password.value;
    err.textContent = "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Enter a valid email."; return; }
    if (mode === "signup" && password.length < 8) { err.textContent = "Password must be at least 8 characters."; return; }
    btn.disabled = true;
    var offlineIdeas = state.custom.slice();
    var req;
    if (mode === "signup") {
      var p = Object.assign({}, ob.draft || state.profile, { name: f.name.value.trim() || (ob.draft || state.profile).name });
      req = API.signup({ email: email, password: password, name: p.name, state: syncable(Object.assign({}, state, { profile: p, onboarded: true })) });
    } else {
      req = API.login(email, password);
    }
    req.then(function (meRes) {
      applyServer(meRes);
      // Carry over ideas written before the account existed.
      return Promise.all(mode === "signup" ? offlineIdeas.map(function (i) {
        return API.createIdea({ title: i.title, body: i.body, topic: i.topic, source: i.source }).catch(function () {});
      }) : []).then(loadCommunity);
    }).then(function () {
      checkBadges();
      if (!state.onboarded) { ob = { step: 1, draft: null }; render(); return; }
      ob = { step: 0, draft: null };
      if (mode === "signup" && !isPro()) { paywallFromQuiz = true; paywallReason = ""; location.hash = "#/pro"; }
      else { toast(mode === "login" ? "Welcome back" + (state.profile.name ? ", " + state.profile.name : "") + " 👋" : "Account created 🎉"); location.hash = "#/home"; }
      render(); window.scrollTo(0, 0);
    }, function (ex) {
      btn.disabled = false;
      err.textContent = ex.message;
    });
  }

  function optBtn(kind, id, emoji, label, sel, multi) {
    return '<button class="opt ' + (sel ? "sel" : "") + '" data-act="pick" data-kind="' + kind + '" data-id="' + esc(id) + '" aria-pressed="' + sel + '">' +
      '<span class="emo">' + emoji + "</span><span>" + esc(label) + "</span>" + (multi || sel ? '<span class="check">' + (sel ? "✓" : "") + "</span>" : "") + "</button>";
  }

  function runBuilder() {
    var pct = 0, lis = document.querySelectorAll("#bsteps li");
    var iv = setInterval(function () {
      pct = Math.min(100, pct + 2);
      var wrap = document.getElementById("bring");
      if (!wrap) return clearInterval(iv);
      wrap.querySelector("svg").outerHTML = ring(pct / 100, 160, 12);
      document.getElementById("bpct").textContent = pct + "%";
      lis.forEach(function (li, i) { if (pct >= (i + 1) * 25) li.classList.add("done"); });
      if (pct >= 100) { clearInterval(iv); setTimeout(function () { ob.step = 11; renderOnboarding(); }, 450); }
    }, 45);
  }

  function planWeeks(p) {
    var ts = p.topics.map(topic);
    var chal = { time: "Micro-sessions that fit between meetings", focus: "Attention training to beat distraction", overwhelm: "Fewer, better ideas — no info overload", motivation: "Quick wins and streaks to keep momentum" }[p.challenge] || "Build the daily habit";
    return [
      { t: "Foundations", d: chal + "." },
      { t: ts[0] ? ts[0].emoji + " " + ts[0].name + " essentials" : "Core ideas", d: "The most-stashed ideas in your top topic." },
      { t: ts[1] ? ts[1].emoji + " " + ts[1].name + " in practice" : "Putting it to work", d: "Turning ideas into small daily actions." },
      { t: "Make it stick", d: "Review your stashes and lock in the habits that worked." }
    ];
  }

  function renderPlan(p, fromQuiz) {
    var goal = Math.max(3, Math.round(p.minutes / 2));
    var name = p.name ? esc(p.name) + ", your" : "Your";
    var pts = [], W = 300, H = 120;
    for (var x = 0; x <= 28; x++) pts.push([(x / 28) * W, H - 10 - (1 - Math.exp(-x / 11)) * (H - 25)]);
    var path = "M" + pts.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L");
    var today = new Date(), end = addDays(today, 28);
    var fmt = function (d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); };

    return '<div class="ob-step"><p class="small muted" style="text-align:center">🎉 Plan ready</p>' +
      '<h1 style="text-align:center">' + name + " 4-week growth plan</h1>" +
      '<p class="muted" style="text-align:center">Focused on ' + p.topics.map(function (t) { return topic(t).name; }).join(", ") + ".</p>" +
      '<div class="plan-card"><div class="stat-row">' +
      '<div class="stat"><b>' + goal + "</b><span>ideas / day</span></div>" +
      '<div class="stat"><b>' + p.minutes + "</b><span>min / day</span></div>" +
      '<div class="stat"><b>' + goal * 28 + "</b><span>ideas total</span></div></div>" +
      '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Projected growth over 4 weeks">' +
      '<path d="' + path + " L" + W + " " + H + " L0 " + H + ' Z" fill="var(--accent-soft)"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="' + pts[28][0] + '" cy="' + pts[28][1] + '" r="5" fill="var(--accent)"/></svg>' +
      '<div class="small muted" style="display:flex;justify-content:space-between"><span>Today · ' + fmt(today) + "</span><span>Goal · " + fmt(end) + "</span></div></div>" +
      '<div class="plan-card"><h2>Your roadmap</h2><div class="weeks">' +
      planWeeks(p).map(function (w, i) { return '<div class="week"><div class="num">W' + (i + 1) + "</div><div><b>" + esc(w.t) + '</b><div class="small muted">' + esc(w.d) + "</div></div></div>"; }).join("") +
      "</div></div>" +
      (fromQuiz ? '<div class="sticky-cta"><button class="btn block" data-act="ob-finish">Continue →</button></div>' : "") + "</div>";
  }

  // ---------- Paywall ----------
  var paywallReason = "", selectedPlan = "annual", paywallFromQuiz = false, countdownEnd = 0;
  function viewPro() {
    if (!countdownEnd) countdownEnd = Date.now() + 10 * 60 * 1000;
    if (isPro()) {
      var plan = byId(D.plans, state.pro.plan) || D.plans[0];
      return '<div class="header-row"><a class="icon-btn" href="#/me" aria-label="Back" style="text-decoration:none">←</a><span></span></div>' +
        '<div class="hero" style="padding-top:2vh"><div class="logo">👑</div><h1>You\'re Pro</h1><p class="muted">' + plan.label + " plan · " + proStatusText() + "</p></div>" +
        proBenefits() + '<button class="btn block ghost" data-act="cancel-pro">' + (state.pro.provider === "stripe" ? "Manage billing" : "Cancel subscription") + "</button>";
    }
    return '<div class="header-row"><button class="icon-btn" data-act="skip-pro" aria-label="Close">✕</button>' +
      '<span class="timer" id="pw-timer">⏳ Offer reserved for <b>10:00</b></span></div>' +
      '<div class="pw-hero"><div class="logo">🚀</div><h1>' + (paywallReason ? esc(paywallReason) : (state.profile.name ? esc(state.profile.name) + ", unlock" : "Unlock") + " your full growth plan") + "</h1>" +
      '<p class="muted">People who stick to a plan read 3× more ideas in their first month.</p></div>' +
      proBenefits() +
      '<div class="plans">' + D.plans.map(function (pl) {
        return '<button class="plan ' + (selectedPlan === pl.id ? "sel" : "") + '" data-act="pick-plan" data-id="' + pl.id + '">' +
          (pl.badge ? '<span class="plan-badge">' + pl.badge + "</span>" : "") +
          '<span class="radio"></span><span class="grow"><b>' + pl.label + '</b><br><span class="small muted"><s>' + pl.was + "</s> " + pl.price + '</span></span><span class="per">' + pl.per + "</span></button>";
      }).join("") + "</div>" +
      '<button class="btn block" data-act="start-trial"' + (API.online && API.billing === "off" ? " disabled" : "") + ">Start 7-day free trial</button>" +
      '<p class="small muted" style="text-align:center;margin-top:10px">Cancel anytime before the trial ends.<br>' + paywallNote() + "</p>" +
      '<p style="text-align:center"><button class="link-btn" data-act="skip-pro">Continue with the free plan</button></p>';
  }
  function proStatusText() {
    var pr = state.pro, when = pr.trialEnds ? new Date(pr.trialEnds).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
    if (pr.cancelAtPeriodEnd) return "cancels " + when;
    if (pr.status === "active") return "renews " + when;
    return "trial ends " + when;
  }
  function paywallNote() {
    if (!API.online) return "<b>Demo build:</b> no payment is taken — this just unlocks Pro on this device.";
    if (API.billing === "stripe") return "Secure checkout by Stripe. You won't be charged until the trial ends.";
    if (API.billing === "demo") return "<b>Demo billing:</b> no payment is taken — Pro is granted on the server for testing.";
    return "Subscriptions aren't available yet.";
  }
  function proBenefits() {
    return '<ul class="benefits">' +
      ["🎧 Listen to every idea with audio", "📚 Unlimited stashes and saves", "🧭 All guided journeys", "🗓️ Full reading history, by day", "🚫 No limits, no ads"]
        .map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul>";
  }
  function tickCountdown() {
    var el = document.getElementById("pw-timer");
    if (!el) return;
    var s = Math.max(0, Math.round((countdownEnd - Date.now()) / 1000));
    el.innerHTML = s ? "⏳ Offer reserved for <b>" + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") + "</b>" : "⏳ Offer expires soon";
  }
  setInterval(tickCountdown, 1000);

  // ---------- Cards ----------
  function ideaCard(i, opts) {
    opts = opts || {};
    var t = topic(i.topic), src = source(i.source), c = ideaCurator(i), read = readSet()[i.id];
    var liked = state.liked.indexOf(i.id) >= 0, stashed = isStashed(i.id);
    var head = c ? '<div class="card-head"><button class="who" data-act="open-user" data-id="' + c.id + '">' + avatar(c, 32) +
      '<span><b>' + esc(c.name) + '</b><span class="small muted"> @' + esc(c.handle) + "</span></span></button>" +
      (c.id !== "me" && state.following.indexOf(c.id) < 0 ? '<button class="follow-btn" data-act="follow" data-id="' + c.id + '">Follow</button>' : "") + "</div>" : "";
    return '<article class="idea ' + (opts.feed ? "feed" : "") + (read && opts.dimRead ? " read" : "") + '" style="--topic:' + t.color + '" data-act="open-idea" data-id="' + i.id + '">' +
      (read && opts.dimRead ? '<span class="done-badge">✓ Read</span>' : "") + head +
      (src ? '<button class="src-row" data-act="open-source" data-id="' + src.id + '"><span class="cover" style="--topic:' + t.color + '">' + t.emoji + '</span><span><b>' + esc(src.title) + '</b><br><span class="small muted">' + src.type + " · " + t.name + "</span></span></button>"
        : '<div class="meta"><span class="tag">' + t.emoji + " " + esc(t.name) + "</span></div>") +
      "<h3>" + esc(i.title) + "</h3><p" + (opts.feed ? ' class="full"' : "") + ">" + esc(i.body) + "</p>" +
      '<div class="idea-actions">' +
      '<button class="act ' + (stashed ? "on" : "") + '" data-act="stash" data-id="' + i.id + '" aria-label="Stash">' + (stashed ? "📌" : "➕") + " <span>" + compact(saveCount(i)) + "</span></button>" +
      '<button class="act ' + (liked ? "on" : "") + '" data-act="like" data-id="' + i.id + '" aria-label="Like">' + (liked ? "❤️" : "🤍") + " <span>" + compact(likeCount(i)) + "</span></button>" +
      '<button class="act" data-act="listen" data-id="' + i.id + '" aria-label="Listen">' + (speaking === i.id ? "⏸" : "🎧") + "</button>" +
      '<button class="act" data-act="share" data-id="' + i.id + '" aria-label="Share">↗</button>' +
      "</div></article>";
  }

  function goalCard() {
    var goal = dailyGoal(), done = Math.min(goal, todayCount()), days = [];
    var start = addDays(new Date(), -((new Date().getDay() + 6) % 7)); // Monday
    for (var d = 0; d < 7; d++) {
      var k = dayKey(addDays(start, d));
      days.push('<i class="' + (hitGoal(k) ? "hit " : "") + (k === dayKey() ? "today" : "") + '">' + "MTWTFSS"[d] + "</i>");
    }
    return '<div class="goal-card" id="goal-card"><div class="mini-ring">' + ring(done / goal, 72, 8) + "<b>" + done + "/" + goal + "</b></div>" +
      '<div class="grow"><b>' + (done >= goal ? "Daily goal complete! 🎉" : "Today's plan: " + goal + " ideas") + '</b><div class="small muted">' +
      (done >= goal ? "Keep reading or come back tomorrow." : "About " + (goal - done) + " min left today") + '</div><div class="week-dots">' + days.join("") + "</div></div>" +
      '<button class="btn small" data-act="read-today">' + (done >= goal ? "Review" : done ? "Continue" : "Start") + "</button></div>";
  }

  // ---------- Views ----------
  var feed = { tab: "foryou", shown: 8 };
  function viewHome() {
    var hour = new Date().getHours();
    var hi = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    var aj = activeJourney();
    var list = feed.tab === "foryou" ? forYou() : followingFeed();
    var html = '<div class="header-row"><div><div class="small muted">' + hi + (state.profile.name ? ", " + esc(state.profile.name) : "") + "</div><h1>Home</h1></div>" +
      '<div style="display:flex;gap:8px;align-items:center">' + (isPro() ? "" : '<a class="go-pro" href="#/pro">Go Pro</a>') +
      '<span class="streak" title="Day streak">🔥 ' + streak() + "</span></div></div>" + goalCard();
    if (aj) {
      var n = journeyDone(aj);
      html += '<button class="journey-strip" data-act="open-journey" data-id="' + aj.id + '"><span class="emo">' + aj.emoji + '</span><span class="grow"><span class="small muted">Continue journey · Day ' + (n + 1) + "/" + aj.days.length + "</span><br><b>" + esc(aj.days[n].title) + '</b></span><span>→</span></button>';
    }
    html += '<div class="tabs"><button class="' + (feed.tab === "foryou" ? "sel" : "") + '" data-act="feed-tab" data-id="foryou">For you</button>' +
      '<button class="' + (feed.tab === "following" ? "sel" : "") + '" data-act="feed-tab" data-id="following">Following</button></div>';
    if (!list.length) {
      html += '<div class="empty"><span class="big">👥</span>Follow curators to see what they stash.<br><br>' +
        '<div class="curator-row">' + D.curators.slice(0, 4).map(curatorChip).join("") + "</div></div>";
    } else {
      html += '<div class="idea-list">' + list.slice(0, feed.shown).map(function (i) { return ideaCard(i, { feed: true, dimRead: true }); }).join("") + "</div>" +
        (feed.shown < list.length ? '<div id="feed-more" class="empty small">Loading more ideas…</div>' : '<div class="empty small">🎉 You\'re all caught up</div>');
    }
    return html;
  }
  function curatorChip(c) {
    var on = state.following.indexOf(c.id) >= 0;
    return '<div class="curator-chip"><button class="who col" data-act="open-user" data-id="' + c.id + '">' + avatar(c, 48) + "<b>" + esc(c.name.split(" ")[0]) + '</b><span class="small muted">' + compact(followerCount(c)) + ' followers</span></button>' +
      '<button class="follow-btn ' + (on ? "on" : "") + '" data-act="follow" data-id="' + c.id + '">' + (on ? "Following" : "Follow") + "</button></div>";
  }

  var exploreState = { q: "", topic: "all" };
  function viewExplore() {
    var q = exploreState.q.trim().toLowerCase(), tp = exploreState.topic;
    var chips = '<div class="chips"><button class="chip ' + (tp === "all" ? "sel" : "") + '" data-act="ex-topic" data-id="all">All</button>' +
      D.topics.map(function (t) { return '<button class="chip ' + (tp === t.id ? "sel" : "") + '" data-act="ex-topic" data-id="' + t.id + '">' + t.emoji + " " + t.name + "</button>"; }).join("") + "</div>";
    var body;
    if (q) {
      var hits = allIdeas().filter(function (i) {
        var src = source(i.source);
        return (tp === "all" || i.topic === tp) && (i.title + " " + i.body + " " + (src ? src.title : "")).toLowerCase().indexOf(q) >= 0;
      });
      var people = D.curators.filter(function (c) { return (c.name + " " + c.handle).toLowerCase().indexOf(q) >= 0; });
      body = (people.length ? '<div class="section-title"><h2>People</h2></div><div class="curator-row">' + people.map(curatorChip).join("") + "</div>" : "") +
        '<div class="section-title"><h2>Ideas</h2><span class="small muted">' + hits.length + "</span></div>" +
        (hits.length ? '<div class="idea-list">' + hits.map(function (i) { return ideaCard(i); }).join("") + "</div>" : '<div class="empty"><span class="big">🔎</span>No ideas match “' + esc(exploreState.q) + "”.</div>");
    } else {
      var srcs = D.sources.filter(function (s) { return tp === "all" || s.topic === tp; });
      var js = D.journeys.filter(function (j) { return tp === "all" || j.topic === tp; });
      var top = allIdeas().filter(function (i) { return tp === "all" || i.topic === tp; })
        .sort(function (a, b) { return saveCount(b) - saveCount(a); }).slice(0, 4);
      body = (js.length ? '<div class="section-title"><h2>Journeys</h2><span class="small muted">Guided, day by day</span></div><div class="h-scroll">' + js.map(journeyCard).join("") + "</div>" : "") +
        (tp === "all" ? '<div class="section-title"><h2>Curators to follow</h2></div><div class="curator-row">' + D.curators.map(curatorChip).join("") + "</div>" : "") +
        '<div class="section-title"><h2>Sources</h2><span class="small muted">' + srcs.length + "</span></div>" +
        '<div class="source-grid">' + srcs.map(function (s) {
          var t = topic(s.topic), n = D.ideas.filter(function (i) { return i.source === s.id; }).length;
          return '<button class="source" style="--topic:' + t.color + '" data-act="open-source" data-id="' + s.id + '"><span class="type">' + t.emoji + " " + s.type + "</span><div><b>" + esc(s.title) + "</b><br><small>" + n + " ideas · " + s.minutes + " min</small></div></button>";
        }).join("") + "</div>" +
        '<div class="section-title"><h2>Most stashed</h2></div><div class="idea-list">' + top.map(function (i) { return ideaCard(i); }).join("") + "</div>";
    }
    return "<h1>Explore</h1>" +
      '<div class="search"><input class="text-input" id="ex-q" type="search" placeholder="Search ideas, sources, people" value="' + esc(exploreState.q) + '"></div>' + chips + body;
  }
  function journeyCard(j) {
    var t = topic(j.topic), n = journeyDone(j);
    return '<button class="journey-card" style="--topic:' + t.color + '" data-act="open-journey" data-id="' + j.id + '">' +
      '<span class="emo">' + j.emoji + "</span>" + (journeyLocked(j) ? proTag() : "") +
      "<b>" + esc(j.title) + '</b><span class="small">' + j.days.length + " days" + (n ? " · " + n + " done" : "") + "</span></button>";
  }

  function viewJourney(id) {
    var j = journey(id);
    if (!j) return viewNotFound();
    var t = topic(j.topic), n = journeyDone(j), locked = journeyLocked(j);
    return '<div class="header-row"><a class="icon-btn" href="#/explore" aria-label="Back" style="text-decoration:none">←</a><span></span></div>' +
      '<div class="source" style="--topic:' + t.color + ';min-height:170px;cursor:default;margin-bottom:18px"><span class="type">' + t.emoji + " Journey · " + j.days.length + ' days</span><div><b style="font-size:24px">' + j.emoji + " " + esc(j.title) + "</b><br><small>" + esc(j.desc) + "</small></div></div>" +
      '<div class="progress" style="margin-bottom:6px"><i style="width:' + (n / j.days.length) * 100 + '%"></i></div><p class="small muted">' + n + " of " + j.days.length + " days complete</p>" +
      '<div class="days">' + j.days.map(function (d, k) {
        var done = ((state.journeys[j.id] || {}).done || []).indexOf(k) >= 0;
        var open = !locked && (k === 0 || ((state.journeys[j.id] || {}).done || []).indexOf(k - 1) >= 0);
        return '<button class="day ' + (done ? "done" : "") + '" data-act="journey-day" data-id="' + j.id + '" data-day="' + k + '"' + (open || done ? "" : " aria-disabled=true") + ">" +
          '<span class="num">' + (done ? "✓" : k + 1) + '</span><span class="grow"><b>Day ' + (k + 1) + ": " + esc(d.title) + '</b><br><span class="small muted">' + d.ideas.length + " ideas · ~" + d.ideas.length + " min</span></span>" +
          "<span>" + (done ? "↻" : open ? "▶" : "🔒") + "</span></button>";
      }).join("") + "</div>" +
      (locked ? '<button class="btn block" data-act="go-pro" data-reason="Unlock every journey">Unlock with Pro</button>' : "");
  }

  function viewSource(id) {
    var s = source(id);
    if (!s) return viewNotFound();
    var t = topic(s.topic), c = curator(s.curator), list = D.ideas.filter(function (i) { return i.source === id; });
    return '<div class="header-row"><button class="icon-btn" data-act="back" aria-label="Back">←</button><span></span></div>' +
      '<div class="source" style="--topic:' + t.color + ';min-height:180px;cursor:default;margin-bottom:14px"><span class="type">' + t.emoji + " " + t.name + " · " + s.type + '</span><div><b style="font-size:24px">' + esc(s.title) + "</b><br><small>" + esc(s.author) + " · " + list.length + " ideas · " + s.minutes + " min read</small></div></div>" +
      (c ? '<div class="card-head" style="margin-bottom:14px"><button class="who" data-act="open-user" data-id="' + c.id + '">' + avatar(c, 32) + '<span class="small">Stashed by <b>' + esc(c.name) + "</b></span></button></div>" : "") +
      '<div style="display:flex;gap:10px"><button class="btn grow" data-act="read-source" data-id="' + id + '">Read all ' + list.length + ' ideas</button><button class="btn ghost" data-act="stash-all" data-id="' + id + '">➕ Stash all</button></div>' +
      '<div class="section-title"><h2>Ideas</h2></div><div class="idea-list">' + list.map(function (i) { return ideaCard(i, { dimRead: true }); }).join("") + "</div>";
  }

  var userCache = {};
  function viewUser(id) {
    var c = curator(id);
    if (!c && API.online && /^u\d+$/.test(id)) {
      // Someone with no ideas in the community feed yet: fetch their profile.
      if (!userCache[id]) {
        userCache[id] = API.user(id).then(function (r) {
          community.users[id] = r.user;
          r.ideas.forEach(function (i) { if (!byId(community.ideas, i.id)) community.ideas.push(i); });
          render();
        }, function () { userCache[id] = "missing"; render(); });
      }
      return userCache[id] === "missing" ? viewNotFound() : '<div class="empty">Loading profile…</div>';
    }
    if (!c) return viewNotFound();
    var list = allIdeas().filter(function (i) { var x = ideaCurator(i); return x && x.id === c.id; });
    var on = state.following.indexOf(c.id) >= 0;
    return '<div class="header-row"><button class="icon-btn" data-act="back" aria-label="Back">←</button><span></span></div>' +
      '<div class="profile-head">' + avatar(c, 72) + '<div class="grow"><h1>' + esc(c.name) + '</h1><div class="small muted">@' + esc(c.handle) + "</div></div></div>" +
      "<p>" + esc(c.bio) + "</p>" +
      '<div class="stat-row"><div class="stat"><b>' + list.length + '</b><span>ideas</span></div><div class="stat"><b>' + compact(followerCount(c)) + '</b><span>followers</span></div><div class="stat"><b>' + (c.id === "me" ? state.following.length : byId(D.curators, c.id) ? 40 + hash(c.id) % 300 : (c.following || 0)) + "</b><span>following</span></div></div>" +
      (c.id === "me" ? "" : '<button class="btn block ' + (on ? "ghost" : "") + '" data-act="follow" data-id="' + c.id + '">' + (on ? "Following ✓" : "Follow") + "</button>") +
      '<div class="section-title"><h2>Stashed ideas</h2></div><div class="idea-list">' + list.map(function (i) { return ideaCard(i); }).join("") + "</div>";
  }

  var libTab = "stashes";
  function viewLibrary() {
    var tabs = '<div class="tabs">' + [["stashes", "Stashes"], ["history", "History"], ["liked", "Liked"]].map(function (x) {
      return '<button class="' + (libTab === x[0] ? "sel" : "") + '" data-act="lib-tab" data-id="' + x[0] + '">' + x[1] + "</button>";
    }).join("") + "</div>";
    var body = "";
    if (libTab === "stashes") {
      body = (isPro() ? "" : '<p class="small muted">Free plan: ' + state.stashes.length + "/" + FREE_STASH_LIMIT + " stashes · " + stashedTotal() + "/" + FREE_SAVE_LIMIT + ' saves. <a href="#/pro">Go unlimited</a></p>') +
        '<div class="stash-grid">' + state.stashes.map(function (s) {
          return '<button class="stash" data-act="open-stash" data-id="' + s.id + '"><span class="emo">' + s.emoji + "</span><b>" + esc(s.name) + '</b><span class="small muted">' + s.ideaIds.length + " ideas</span></button>";
        }).join("") + '<button class="stash new" data-act="new-stash">＋ New stash</button></div>';
    } else if (libTab === "history") {
      var days = Object.keys(state.history).filter(function (k) { return state.history[k].length; }).sort().reverse();
      var cutoff = dayKey(addDays(new Date(), -(FREE_HISTORY_DAYS - 1)));
      var visible = isPro() ? days : days.filter(function (k) { return k >= cutoff; });
      body = !days.length ? '<div class="empty"><span class="big">🗓️</span>Ideas you read will show up here, day by day.</div>' :
        visible.map(function (k) {
          var d = new Date(k + "T00:00:00");
          var label = k === dayKey() ? "Today" : k === dayKey(addDays(new Date(), -1)) ? "Yesterday" : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
          return '<div class="section-title"><h3>' + label + '</h3><span class="small muted">' + state.history[k].length + " ideas</span></div>" +
            '<div class="idea-list">' + state.history[k].map(idea).filter(Boolean).map(function (i) { return ideaCard(i); }).join("") + "</div>";
        }).join("") +
        (visible.length < days.length ? '<button class="lock-card" data-act="go-pro" data-reason="See your full reading history">🔒 ' + (days.length - visible.length) + " earlier days · Unlock full history with Pro</button>" : "");
    } else {
      var liked = state.liked.map(idea).filter(Boolean);
      body = liked.length ? '<div class="idea-list">' + liked.map(function (i) { return ideaCard(i); }).join("") + "</div>" : '<div class="empty"><span class="big">🤍</span>Ideas you like will appear here.</div>';
    }
    return "<h1>Library</h1>" + tabs + body;
  }

  function viewStash(id) {
    var s = byId(state.stashes, id);
    if (!s) return viewNotFound();
    var list = s.ideaIds.map(idea).filter(Boolean);
    return '<div class="header-row"><a class="icon-btn" href="#/library" aria-label="Back" style="text-decoration:none">←</a>' +
      '<div style="display:flex;gap:8px"><button class="btn small ghost" data-act="rename-stash" data-id="' + id + '">Rename</button>' +
      '<button class="btn small ghost" data-act="delete-stash" data-id="' + id + '">Delete</button></div></div>' +
      "<h1>" + s.emoji + " " + esc(s.name) + '</h1><p class="muted">' + list.length + " ideas</p>" +
      (list.length ? '<button class="btn block" data-act="read-stash" data-id="' + id + '">Review this stash →</button><div class="idea-list" style="margin-top:18px">' + list.map(function (i) { return ideaCard(i); }).join("") + "</div>"
        : '<div class="empty"><span class="big">📭</span>Nothing here yet. Tap ➕ on any idea to stash it.</div>');
  }

  function viewCreate() {
    var mine = myIdeas().slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    var srcOpts = '<option value="">No source (my own thought)</option>' + D.sources.map(function (s) { return '<option value="' + s.id + '">' + esc(s.title) + " (" + s.type + ")</option>"; }).join("");
    return "<h1>Create an idea</h1><p class=\"muted\">Found something worth keeping? Put it in your own words and share it with your followers.</p>" +
      '<form id="create-form">' +
      '<input class="text-input" name="title" maxlength="80" required placeholder="Idea title (e.g. The 5-second rule)">' +
      '<textarea class="text-input" name="body" maxlength="600" required placeholder="Explain it in a few sentences…"></textarea>' +
      '<select class="text-input" name="topic">' + D.topics.map(function (t) { return '<option value="' + t.id + '">' + t.emoji + " " + t.name + "</option>"; }).join("") + "</select>" +
      '<select class="text-input" name="source">' + srcOpts + "</select>" +
      '<button class="btn block" type="submit">Publish idea</button></form>' +
      (mine.length ? '<div class="section-title"><h2>Your ideas</h2><span class="small muted">' + mine.length + '</span></div><div class="idea-list">' + mine.map(function (i) { return ideaCard(i); }).join("") + "</div>" : "");
  }

  function viewMe() {
    var p = state.profile, m = me(), read = Object.keys(readSet()).length;
    var bars = [], max = 1;
    for (var d = 6; d >= 0; d--) {
      var dd = addDays(new Date(), -d), n = (state.history[dayKey(dd)] || []).length;
      max = Math.max(max, n);
      bars.push({ n: n, l: dd.toLocaleDateString(undefined, { weekday: "narrow" }) });
    }
    return '<div class="profile-head">' + avatar(m, 64) + '<div class="grow"><h1>' + esc(m.name) + (isPro() ? " " + proTag() : "") + '</h1><div class="small muted">@' + esc(m.handle) + " · " + state.following.length + " following · " +
      p.topics.map(function (t) { return topic(t).emoji; }).join(" ") + "</div></div></div>" +
      (isPro() ? "" : '<a class="pro-banner" href="#/pro"><span>🚀</span><span class="grow"><b>Try Pro free for 7 days</b><br><span class="small">Audio, all journeys, unlimited stashes</span></span><span>→</span></a>') +
      '<div class="stat-row"><div class="stat"><b>🔥 ' + streak() + '</b><span>day streak</span></div><div class="stat"><b>' + read + '</b><span>ideas read</span></div><div class="stat"><b>' + stashedTotal() + "</b><span>stashed</span></div></div>" +
      '<div class="plan-card"><h3>Last 7 days</h3><div class="bars">' + bars.map(function (b) { return "<div>" + (b.n || "") + '<span style="height:' + (b.n / max) * 80 + '%"></span>' + b.l + "</div>"; }).join("") + "</div></div>" +
      '<div class="section-title"><h2>Badges</h2><span class="small muted">' + state.badges.length + "/" + BADGES.length + '</span></div><div class="badges">' +
      BADGES.map(function (b) { var got = state.badges.indexOf(b.id) >= 0; return '<div class="badge ' + (got ? "got" : "") + '" title="' + esc(b.desc) + '"><span>' + b.emoji + "</span><b>" + b.name + '</b><small class="muted">' + b.desc + "</small></div>"; }).join("") + "</div>" +
      '<h2 style="margin-top:22px">Settings</h2><div class="list">' +
      '<div class="list-row"><span class="grow">Daily time</span><div class="seg">' + [5, 10, 15, 20].map(function (x) { return '<button class="' + (p.minutes === x ? "sel" : "") + '" data-act="set-min" data-v="' + x + '">' + x + "m</button>"; }).join("") + "</div></div>" +
      '<div class="list-row"><span class="grow">Theme</span><div class="seg">' + ["auto", "light", "dark"].map(function (x) { return '<button class="' + (state.theme === x ? "sel" : "") + '" data-act="set-theme" data-v="' + x + '">' + x + "</button>"; }).join("") + "</div></div>" +
      '<div class="list-row"><span class="grow">Topics</span><button class="btn small ghost" data-act="edit-topics">Edit</button></div>' +
      '<div class="list-row"><span class="grow">Growth plan</span><button class="btn small ghost" data-act="view-plan">View</button></div>' +
      '<div class="list-row"><span class="grow">Subscription</span><a class="btn small ghost" href="#/pro">' + (isPro() ? "Manage" : "Go Pro") + "</a></div>" +
      '<div class="list-row"><span class="grow">Public profile</span><button class="btn small ghost" data-act="open-user" data-id="me">View</button></div>' +
      "</div>" +
      (API.online && account
        ? '<div class="list"><div class="list-row"><span class="grow">Signed in as <b>' + esc(account.user.email) + '</b></span><button class="btn small ghost" data-act="logout">Log out</button></div></div>'
        : '<p class="small muted">Offline mode: your data is saved on this device only.</p>') +
      '<div class="list"><div class="list-row"><span class="grow">Retake the quiz</span><button class="btn small ghost" data-act="retake">Retake</button></div>' +
      '<div class="list-row"><span class="grow">Reset all data</span><button class="btn small ghost" data-act="reset">Reset</button></div></div>' +
      '<p class="small muted" style="text-align:center">Brightbits' + (API.online ? "" : " · your data stays on this device") + "</p>";
  }

  function viewNotFound() {
    return '<div class="empty"><span class="big">🤷</span>That page doesn\'t exist.<br><br><a class="btn" href="#/home">Go home</a></div>';
  }

  // ---------- Reader ----------
  var reader = null;
  function openReader(list, opts) {
    if (!list.length) return;
    opts = opts || {};
    var start = 0;
    if (opts.resume) {
      var todays = state.history[dayKey()] || [];
      for (var i = 0; i < list.length; i++) { if (todays.indexOf(list[i].id) < 0) { start = i; break; } }
    }
    reader = { list: list, i: start, finished: false, onFinish: opts.onFinish, autoplay: false };
    renderReader();
  }
  function closeReader() { stopSpeak(); reader = null; var el = document.querySelector(".reader"); if (el) el.remove(); render(); }
  function renderReader() {
    var el = document.querySelector(".reader");
    if (!el) { el = document.createElement("div"); el.className = "reader"; document.body.appendChild(el); }
    var r = reader, bars = r.list.map(function (_, k) { return '<i class="' + (k <= r.i || r.finished ? "on" : "") + '"></i>'; }).join("");
    var top = '<div class="reader-top"><button class="icon-btn" data-act="reader-close" aria-label="Close">✕</button><div class="reader-bars">' + bars + "</div></div>";
    if (r.finished) {
      var goalDone = todayCount() >= dailyGoal();
      el.innerHTML = top + '<div class="reader-stage"><div class="reader-card celebrate"><div class="big">' + (r.doneMsg ? "🏁" : goalDone ? "🔥" : "🌟") + "</div><h2>" +
        (r.doneMsg || (goalDone ? "Daily goal reached!" : "Session complete")) + '</h2><p class="body muted">' +
        (goalDone ? "You're on a " + streak() + "-day streak. Small steps, every day — that's how it compounds." : "You read " + r.list.length + " ideas. Keep going to hit today's goal.") +
        '</p></div></div><div class="reader-bottom"><button class="btn" data-act="reader-close">Done</button></div>';
      return;
    }
    var it = r.list[r.i], t = topic(it.topic), src = source(it.source), c = ideaCurator(it);
    markRead(it.id);
    el.innerHTML = top + '<div class="reader-stage"><div class="reader-card" style="--topic:' + t.color + '" id="rcard"><div class="tag">' + t.emoji + " " + esc(t.name) +
      " · " + (r.i + 1) + "/" + r.list.length + "</div><h2>" + esc(it.title) + '</h2><div class="body">' + esc(it.body) + "</div>" +
      '<div class="src">' + (src ? "From <b>" + esc(src.title) + "</b> · " + esc(src.type) : "An original idea") + (c ? " · stashed by " + esc(c.name) : "") + "</div></div></div>" +
      '<div class="reader-bottom">' +
      '<button class="icon-btn" data-act="reader-prev" aria-label="Previous"' + (r.i === 0 ? " disabled" : "") + ">‹</button>" +
      '<button class="icon-btn ' + (r.autoplay ? "on" : "") + '" data-act="reader-listen" aria-label="Listen">' + (r.autoplay ? "⏸" : "🎧") + "</button>" +
      '<button class="icon-btn ' + (state.liked.indexOf(it.id) >= 0 ? "on" : "") + '" data-act="like" data-id="' + it.id + '" aria-label="Like">' + (state.liked.indexOf(it.id) >= 0 ? "❤️" : "🤍") + "</button>" +
      '<button class="icon-btn ' + (isStashed(it.id) ? "on" : "") + '" data-act="stash" data-id="' + it.id + '" aria-label="Stash">' + (isStashed(it.id) ? "📌" : "➕") + "</button>" +
      '<button class="btn" data-act="reader-next">' + (r.i === r.list.length - 1 ? "Finish" : "Next") + " →</button></div>";
    swipe(document.getElementById("rcard"));
    if (r.autoplay) speak(it, function () { if (reader && reader.autoplay) readerStep(1); });
  }
  function readerStep(d) {
    if (!reader) return;
    if (d > 0 && reader.i === reader.list.length - 1) {
      reader.finished = true; reader.autoplay = false; stopSpeak();
      if (reader.onFinish) reader.doneMsg = reader.onFinish();
    } else {
      reader.i = Math.max(0, Math.min(reader.list.length - 1, reader.i + d));
      if (!reader.autoplay) stopSpeak();
    }
    renderReader();
  }
  function swipe(el) {
    var x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 60) readerStep(dx < 0 ? 1 : -1);
    });
  }

  // ---------- Sheets ----------
  function sheet(html) {
    $modal.innerHTML = '<div class="backdrop" data-act="sheet-close"><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>' + html + "</div></div>";
  }
  function closeSheet() { $modal.innerHTML = ""; }
  function stashSheet(id) {
    sheet("<h2>Save to stash</h2>" + state.stashes.map(function (s) {
      var on = s.ideaIds.indexOf(id) >= 0;
      return '<button class="sheet-row" data-act="toggle-stash" data-stash="' + s.id + '" data-id="' + id + '"><span style="font-size:24px">' + s.emoji + "</span><span><b>" + esc(s.name) + '</b><br><span class="small muted">' + s.ideaIds.length + ' ideas</span></span><span class="check">' + (on ? "✅" : "⬜") + "</span></button>";
    }).join("") + '<button class="sheet-row" data-act="new-stash" data-id="' + id + '"><span style="font-size:24px">＋</span><b>New stash</b>' + (!isPro() && state.stashes.length >= FREE_STASH_LIMIT ? " " + proTag() : "") + "</button>");
  }
  function ideaSheet(id) {
    var i = idea(id); if (!i) return;
    var t = topic(i.topic), src = source(i.source);
    sheet('<div class="tag small" style="color:' + t.color + ';font-weight:800;text-transform:uppercase">' + t.emoji + " " + t.name + "</div><h2>" + esc(i.title) + '</h2><p style="font-size:18px">' + esc(i.body) + "</p>" +
      (src ? '<p class="small muted">From <a href="#/source/' + src.id + '" data-act="sheet-link">' + esc(src.title) + "</a> · " + src.type + "</p>" : "") +
      '<div class="idea-actions"><button class="btn" data-act="stash" data-id="' + id + '">' + (isStashed(id) ? "📌 Stashed" : "➕ Stash") + '</button><button class="btn ghost" data-act="like" data-id="' + id + '">' + (state.liked.indexOf(id) >= 0 ? "❤️" : "🤍") + '</button><button class="btn ghost" data-act="listen" data-id="' + id + '">🎧</button><button class="btn ghost" data-act="share" data-id="' + id + '">↗</button></div>' +
      (isMine(i) ? '<p style="text-align:center;margin-top:14px"><button class="link-btn" data-act="delete-idea" data-id="' + id + '">Delete this idea</button></p>' : ""));
    markRead(id);
  }
  function topicsSheet() {
    sheet("<h2>Your topics</h2><p class=\"muted small\">Your feed and daily plan are drawn from these.</p><div class=\"options grid2\">" +
      D.topics.map(function (t) { return optBtn("ptopic", t.id, t.emoji, t.name, state.profile.topics.indexOf(t.id) >= 0, true); }).join("") +
      '</div><button class="btn block" data-act="sheet-close-btn">Done</button>');
  }
  function planSheet() { sheet(renderPlan(state.profile, false) + '<button class="btn block" data-act="sheet-close-btn">Close</button>'); }

  // ---------- Router ----------
  function route() { return (location.hash.replace(/^#\/?/, "") || "home").split("/"); }
  var observer = null;
  function render() {
    applyTheme();
    if (observer) { observer.disconnect(); observer = null; }
    if (!state.onboarded || (API.online && !account)) {
      if (state.onboarded && ob.step === 0) ob.step = 12; // offline progress: offer to save it
      $tabbar.hidden = true;
      $app.classList.add("no-tabs");
      renderOnboarding();
      return;
    }
    var r = route(), html;
    var full = r[0] === "pro";
    $tabbar.hidden = full;
    $app.classList.toggle("no-tabs", full);
    switch (r[0]) {
      case "home": case "today": html = viewHome(); break;
      case "explore": html = viewExplore(); break;
      case "source": html = viewSource(r[1]); break;
      case "journey": html = viewJourney(r[1]); break;
      case "u": html = viewUser(r[1]); break;
      case "library": case "stashes": html = viewLibrary(); break;
      case "stash": html = viewStash(r[1]); break;
      case "create": html = viewCreate(); break;
      case "me": case "profile": html = viewMe(); break;
      case "pro": html = viewPro(); break;
      default: html = viewNotFound();
    }
    $app.innerHTML = html;
    var tab = { today: "home", source: "explore", journey: "explore", stash: "library", stashes: "library", profile: "me", u: "explore" }[r[0]] || r[0];
    $tabbar.querySelectorAll("a").forEach(function (a) { a.classList.toggle("active", a.dataset.tab === tab); });
    bindView(r[0]);
    if (r[0] === "pro") tickCountdown();
  }
  function rerenderKeepScroll() {
    var y = window.scrollY;
    if (reader) renderReader();
    render();
    window.scrollTo(0, y);
  }

  function bindView(name) {
    if (name === "explore") {
      var q = document.getElementById("ex-q");
      q.addEventListener("input", function () {
        exploreState.q = q.value;
        var pos = q.selectionStart;
        render();
        var n = document.getElementById("ex-q"); n.focus(); n.setSelectionRange(pos, pos);
      });
    }
    if (name === "create") {
      document.getElementById("create-form").addEventListener("submit", function (e) {
        e.preventDefault();
        var f = e.target, title = f.title.value.trim(), body = f.body.value.trim();
        if (!title || !body) return;
        var draft = { title: title, body: body, topic: f.topic.value, source: f.source.value || undefined };
        if (API.online) {
          var btn = f.querySelector("button[type=submit]");
          btn.disabled = true;
          API.createIdea(draft).then(function (r) {
            community.ideas.unshift(r.idea);
            checkBadges(); toast("Idea published ✨"); render();
          }, function (err) { btn.disabled = false; toast(err.message); });
          return;
        }
        state.custom.push(Object.assign({ id: "c" + Date.now(), curator: "me" }, draft));
        save(); checkBadges(); toast("Idea published ✨"); render();
      });
    }
    if ((name === "home" || name === "today") && "IntersectionObserver" in window) {
      // Infinite scroll + count an idea as read once it's been on screen for a moment.
      var timers = {};
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var el = en.target;
          if (el.id === "feed-more") {
            if (en.isIntersecting) { feed.shown += 8; rerenderKeepScroll(); }
            return;
          }
          var id = el.dataset.id;
          if (en.isIntersecting) {
            timers[id] = setTimeout(function () {
              if (markRead(id)) {
                el.classList.add("read");
                var gc = document.getElementById("goal-card");
                if (gc) gc.outerHTML = goalCard();
              }
            }, 2500);
          } else clearTimeout(timers[id]);
        });
      }, { threshold: 0.6 });
      document.querySelectorAll(".idea.feed").forEach(function (el) { observer.observe(el); });
      var more = document.getElementById("feed-more");
      if (more) observer.observe(more);
    }
  }

  // ---------- Actions ----------
  function act(name, el) {
    var id = el && el.dataset.id, p = ob.draft;
    switch (name) {
      case "ob-next":
        if (ob.step === 9) p.name = (document.getElementById("ob-name").value || "").trim();
        if (ob.step === 11) { act("ob-finish"); return; }
        ob.step++; renderOnboarding(); window.scrollTo(0, 0); break;
      case "ob-back": ob.step = Math.max(0, ob.step - 1); renderOnboarding(); break;
      case "show-login": ob.step = "login"; renderOnboarding(); window.scrollTo(0, 0); break;
      case "ob-restart": ob = { step: 0, draft: null }; renderOnboarding(); break;
      case "pick": {
        var kind = el.dataset.kind;
        if (kind === "goal") { toggleIn(p.goals, id); p.topics = []; }
        else if (kind === "topic") toggleIn(p.topics, id);
        else if (kind === "age" || kind === "challenge") { p[kind] = id; renderOnboarding(); setTimeout(function () { act("ob-next"); }, 220); return; }
        else if (kind === "ptopic") {
          toggleIn(state.profile.topics, id);
          if (!state.profile.topics.length) state.profile.topics.push(id);
          save(); topicsSheet(); return;
        }
        renderOnboarding(); break;
      }
      case "answer":
        p.answers[id] = +el.dataset.v; renderOnboarding();
        setTimeout(function () { act("ob-next"); }, 220); break;
      case "minutes":
        p.minutes = +el.dataset.v; renderOnboarding();
        setTimeout(function () { act("ob-next"); }, 220); break;
      case "ob-finish":
        if (API.online && !account) { ob.step = 12; renderOnboarding(); window.scrollTo(0, 0); break; }
        state.profile = p; state.onboarded = true; ob = { step: 0, draft: null };
        save(); paywallReason = ""; paywallFromQuiz = true; location.hash = "#/pro"; render(); window.scrollTo(0, 0); break;

      case "pick-plan": selectedPlan = id; render(); break;
      case "start-trial":
        if (API.online) {
          el.disabled = true;
          API.checkout(selectedPlan).then(function (r) {
            if (r.url) { location.href = r.url; return; } // Stripe Checkout
            return refreshMe().then(function () { toast("👑 Pro unlocked — enjoy!"); paywallFromQuiz = false; location.hash = "#/home"; });
          }).catch(function (e) { el.disabled = false; toast(e.message); });
          break;
        }
        state.pro = { plan: selectedPlan, since: Date.now(), trialEnds: addDays(new Date(), 7).getTime() };
        save(); toast("👑 Pro unlocked — enjoy!"); paywallFromQuiz = false; location.hash = "#/home"; break;
      case "skip-pro":
        if (paywallFromQuiz) { paywallFromQuiz = false; location.hash = "#/home"; } else history.length > 1 ? history.back() : (location.hash = "#/home");
        break;
      case "cancel-pro":
        if (API.online && state.pro && state.pro.provider === "stripe") {
          el.disabled = true;
          API.portal().then(function (r) { location.href = r.url; }, function (e) { el.disabled = false; toast(e.message); });
          break;
        }
        if (!confirm("Cancel Pro? You'll go back to the free plan.")) break;
        if (API.online) { API.cancel().then(refreshMe).then(function () { location.hash = "#/me"; render(); }, function (e) { toast(e.message); }); break; }
        state.pro = null; save(); location.hash = "#/me";
        break;
      case "logout":
        API.flush().then(API.logout).catch(function () {}).then(function () {
          try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
          location.hash = "";
          location.reload();
        });
        break;
      case "go-pro": closeSheet(); requirePro(el.dataset.reason); break;

      case "feed-tab": feed.tab = id; feed.shown = 8; render(); break;
      case "lib-tab": libTab = id; render(); break;
      case "back": history.length > 1 ? history.back() : (location.hash = "#/home"); break;

      case "read-today": openReader(todaysPicks(), { resume: true }); break;
      case "read-source": openReader(D.ideas.filter(function (i) { return i.source === id; })); break;
      case "read-stash": {
        var st = byId(state.stashes, id);
        openReader(st.ideaIds.map(idea).filter(Boolean)); break;
      }
      case "journey-day": {
        var j = journey(id), k = +el.dataset.day;
        if (journeyLocked(j)) { requirePro("Unlock every journey"); return; }
        if (el.getAttribute("aria-disabled")) { toast("Finish day " + k + " first"); return; }
        state.journeys[j.id] = state.journeys[j.id] || { done: [] }; save();
        openReader(j.days[k].ideas.map(idea).filter(Boolean), {
          onFinish: function () { completeJourneyDay(j.id, k); return k === j.days.length - 1 ? "Journey complete!" : "Day " + (k + 1) + " complete!"; }
        });
        break;
      }
      case "reader-next": readerStep(1); break;
      case "reader-prev": readerStep(-1); break;
      case "reader-close": closeReader(); break;
      case "reader-listen":
        if (!requirePro("Listen to every idea")) { closeReader(); return; }
        reader.autoplay = !reader.autoplay;
        if (!reader.autoplay) stopSpeak();
        renderReader(); break;

      case "open-idea": ideaSheet(id); break;
      case "open-source": location.hash = "#/source/" + id; break;
      case "open-user": closeSheet(); location.hash = "#/u/" + id; break;
      case "open-journey": location.hash = "#/journey/" + id; break;
      case "open-stash": location.hash = "#/stash/" + id; break;
      case "ex-topic": exploreState.topic = id; render(); break;

      case "follow": {
        var c = curator(id);
        toast(toggleFollow(id) ? "Following " + c.name : "Unfollowed " + c.name);
        rerenderKeepScroll(); break;
      }
      case "like": toast(toggleLike(id) ? "Liked ❤️" : "Removed like"); refreshSheetOrView(id); break;
      case "listen": {
        if (!requirePro("Listen to every idea")) { closeSheet(); return; }
        var li = idea(id);
        if (speaking === id) stopSpeak(); else speak(li, function () { rerenderKeepScroll(); });
        rerenderKeepScroll(); break;
      }
      case "stash": stashSheet(id); break;
      case "toggle-stash": {
        var s = byId(state.stashes, el.dataset.stash);
        var k2 = s.ideaIds.indexOf(id);
        if (k2 < 0 && !isPro() && stashedTotal() >= FREE_SAVE_LIMIT) { closeSheet(); requirePro("Save unlimited ideas"); return; }
        if (k2 >= 0) s.ideaIds.splice(k2, 1); else s.ideaIds.push(id);
        save(); checkBadges(); toast(k2 >= 0 ? "Removed from " + s.name : "Saved to " + s.name);
        stashSheet(id); rerenderKeepScroll(); break;
      }
      case "stash-all": {
        var ids = D.ideas.filter(function (i) { return i.source === id; }).map(function (i) { return i.id; });
        var fav = state.stashes[0];
        if (!fav) return;
        var add = ids.filter(function (x) { return fav.ideaIds.indexOf(x) < 0; });
        if (!isPro() && stashedTotal() + add.length > FREE_SAVE_LIMIT) { requirePro("Save unlimited ideas"); return; }
        fav.ideaIds = fav.ideaIds.concat(add); save(); checkBadges();
        toast("Saved " + add.length + " ideas to " + fav.name); render(); break;
      }
      case "new-stash": {
        if (!isPro() && state.stashes.length >= FREE_STASH_LIMIT) { closeSheet(); requirePro("Create unlimited stashes"); return; }
        var nm = prompt("Name your stash");
        if (!nm || !nm.trim()) return;
        var emojis = ["📘", "🧠", "💡", "🌱", "🎯", "🚀", "🧩", "🌙"];
        var ns = { id: "st" + Date.now(), name: nm.trim().slice(0, 40), emoji: emojis[state.stashes.length % emojis.length], ideaIds: id ? [id] : [] };
        state.stashes.push(ns); save();
        if (id) { toast("Saved to " + ns.name); stashSheet(id); }
        rerenderKeepScroll(); break;
      }
      case "rename-stash": {
        var rs = byId(state.stashes, id);
        var nn = prompt("Rename stash", rs.name);
        if (nn && nn.trim()) { rs.name = nn.trim().slice(0, 40); save(); render(); }
        break;
      }
      case "delete-stash":
        if (confirm("Delete this stash? The ideas themselves stay available.")) {
          state.stashes = state.stashes.filter(function (x) { return x.id !== id; });
          save(); location.hash = "#/library";
        }
        break;
      case "share": shareIdea(id); break;
      case "delete-idea": {
        if (!confirm("Delete this idea for everyone?")) return;
        var drop = function () {
          community.ideas = community.ideas.filter(function (x) { return x.id !== id; });
          state.custom = state.custom.filter(function (x) { return x.id !== id; });
          save(); closeSheet(); toast("Idea deleted"); rerenderKeepScroll();
        };
        if (API.online && account) API.deleteIdea(id).then(drop, function (e) { toast(e.message); });
        else drop();
        break;
      }

      case "set-min": state.profile.minutes = +el.dataset.v; save(); render(); break;
      case "set-theme": state.theme = el.dataset.v; save(); render(); break;
      case "edit-topics": topicsSheet(); break;
      case "view-plan": planSheet(); break;
      case "retake": state.onboarded = false; ob = { step: 1, draft: null }; save(); render(); break;
      case "reset":
        if (confirm("Erase your plan, stashes and reading history?")) { state = defaultState(); ob = { step: 0, draft: null }; save(); location.hash = ""; render(); }
        break;

      case "sheet-close": if (el.classList.contains("backdrop")) { closeSheet(); rerenderKeepScroll(); } break;
      case "sheet-close-btn": closeSheet(); rerenderKeepScroll(); break;
      case "sheet-link": closeSheet(); break;
    }
  }
  function refreshSheetOrView(id) {
    if ($modal.querySelector(".sheet") && !$modal.querySelector("[data-act=toggle-stash]") && !$modal.querySelector("[data-kind=ptopic]")) ideaSheet(id);
    rerenderKeepScroll();
  }
  function toggleIn(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
  function shareIdea(id) {
    var i = idea(id); if (!i) return;
    var text = i.title + " — " + i.body + "\n\nvia Brightbits";
    if (navigator.share) { navigator.share({ title: i.title, text: text }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("Copied to clipboard"); }, function () { toast("Couldn't copy"); });
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var name = el.dataset.act;
    // Clicks inside a sheet (not on an action) shouldn't close it.
    if (name === "sheet-close" && e.target !== el) return;
    if (el.disabled) return;
    e.stopPropagation();
    act(name, el);
  });
  document.addEventListener("keydown", function (e) {
    if (reader) {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); readerStep(1); }
      else if (e.key === "ArrowLeft") readerStep(-1);
      else if (e.key === "Escape") closeReader();
    } else if (e.key === "Escape" && $modal.innerHTML) { closeSheet(); rerenderKeepScroll(); }
  });
  window.addEventListener("hashchange", function () { closeSheet(); stopSpeak(); render(); window.scrollTo(0, 0); });

  function handleCheckoutReturn() {
    var params = new URLSearchParams(location.search), result = params.get("checkout");
    if (!result) return;
    history.replaceState(null, "", location.pathname + location.hash);
    if (result === "cancel") { toast("Checkout cancelled"); return; }
    // The webhook can land a moment after the redirect, so poll briefly.
    toast("Finishing up your subscription…");
    var tries = 0;
    (function poll() {
      refreshMe().then(function () {
        if (isPro()) { toast("👑 Welcome to Pro!"); render(); }
        else if (++tries < 8) setTimeout(poll, 1500);
        else toast("Payment received — Pro will unlock shortly");
      }, function () {});
    })();
  }

  $app.innerHTML = '<div class="empty">Loading…</div>';
  API.init().then(function (online) {
    if (!online) return;
    return API.me().then(applyServer, function () { account = null; }).then(loadCommunity);
  }).then(function () {
    if (account) handleCheckoutReturn();
    checkBadges();
    render();
  });
})();
