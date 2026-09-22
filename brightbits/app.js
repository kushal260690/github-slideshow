(function () {
  "use strict";

  var D = window.BB_DATA;
  var KEY = "brightbits.v1";
  var $app = document.getElementById("app");
  var $tabbar = document.getElementById("tabbar");
  var $modal = document.getElementById("modal-root");
  var $toast = document.getElementById("toast");

  // ---------- State ----------
  function defaultState() {
    return {
      onboarded: false,
      profile: { name: "", goals: [], topics: [], challenge: "", minutes: 10, answers: {} },
      stashes: [
        { id: "st-fav", name: "Favourites", emoji: "⭐", ideaIds: [] },
        { id: "st-later", name: "Read later", emoji: "🔖", ideaIds: [] }
      ],
      liked: [],
      history: {}, // "YYYY-MM-DD" -> [ideaId]
      custom: [],
      theme: "auto"
    };
  }
  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* storage unavailable */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

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
  function topic(id) { return D.topics.find(function (t) { return t.id === id; }) || { id: id, name: id, emoji: "✨", color: "#ff6b3d" }; }
  function source(id) { return D.sources.find(function (s) { return s.id === id; }); }
  function allIdeas() { return D.ideas.concat(state.custom); }
  function idea(id) { return allIdeas().find(function (i) { return i.id === id; }); }
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

  // Deterministic shuffle so "today's picks" are stable for a given day.
  function seeded(seed) {
    var h = 2166136261;
    for (var i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  function todaysPicks() {
    var topics = state.profile.topics.length ? state.profile.topics : D.topics.map(function (t) { return t.id; });
    var today = state.history[dayKey()] || [];
    var read = readSet();
    var pool = D.ideas.filter(function (i) { return topics.indexOf(i.topic) >= 0; });
    var rnd = seeded(dayKey() + topics.join());
    pool = pool.map(function (i) { return [rnd(), i]; }).sort(function (a, b) { return a[0] - b[0]; }).map(function (x) { return x[1]; });
    // Keep ideas already read today in place, fill the rest with unread ones (fallback: anything).
    var picks = today.map(idea).filter(Boolean);
    var fresh = pool.filter(function (i) { return !read[i.id]; });
    var rest = fresh.length ? fresh : pool;
    for (var k = 0; picks.length < dailyGoal() && k < rest.length; k++) {
      if (picks.indexOf(rest[k]) < 0) picks.push(rest[k]);
    }
    return picks;
  }

  function markRead(id) {
    var k = dayKey();
    state.history[k] = state.history[k] || [];
    if (state.history[k].indexOf(id) < 0) state.history[k].push(id);
    save();
  }
  function isStashed(id) { return state.stashes.some(function (s) { return s.ideaIds.indexOf(id) >= 0; }); }
  function toggleLike(id) {
    var i = state.liked.indexOf(id);
    if (i >= 0) state.liked.splice(i, 1); else state.liked.push(id);
    save();
    return i < 0;
  }

  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { $toast.classList.remove("show"); }, 1800);
  }

  function ring(pct, size, stroke) {
    var r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="var(--accent)" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - Math.min(1, pct)) + '" style="transition:stroke-dashoffset .4s"/></svg>';
  }

  function applyTheme() {
    if (state.theme === "auto") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", state.theme);
  }

  // ---------- Onboarding (growth-plan quiz) ----------
  var ob = { step: 0, draft: null };
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
  // Steps: 0 welcome, 1 goals, 2 topics, 3 challenge, 4-6 statements, 7 minutes, 8 name, 9 building, 10 plan
  var OB_LAST_Q = 8;

  function renderOnboarding() {
    if (!ob.draft) ob.draft = JSON.parse(JSON.stringify(state.profile));
    var p = ob.draft, s = ob.step, html = "";
    var top = s > 0 && s <= OB_LAST_Q
      ? '<div class="ob-top"><button class="icon-btn" data-act="ob-back" aria-label="Back">←</button>' +
        '<div class="progress"><i style="width:' + Math.round((s / OB_LAST_Q) * 100) + '%"></i></div>' +
        '<span class="small muted">' + s + "/" + OB_LAST_Q + "</span></div>"
      : "";

    if (s === 0) {
      html = '<div class="hero ob-step"><div class="logo">✨</div><h1>Grow a little every day</h1>' +
        '<p class="muted">Big ideas from books, articles and podcasts, boiled down to 1-minute reads and arranged into a plan built around your goals.</p>' +
        '<div class="stack">' + D.topics.slice(0, 6).map(function (t) { return '<span class="pill">' + t.emoji + " " + t.name + "</span>"; }).join("") + "</div>" +
        '<button class="btn block" data-act="ob-next">Build my growth plan</button>' +
        '<p class="small muted" style="margin-top:14px">Takes about 1 minute</p></div>';
    } else if (s === 1) {
      html = '<div class="ob-step"><h1>What do you want to work on?</h1><p class="lead">Pick all that apply.</p><div class="options">' +
        D.goals.map(function (g) { return optBtn("goal", g.id, g.emoji, g.label, p.goals.indexOf(g.id) >= 0, true); }).join("") +
        '</div><div class="sticky-cta"><button class="btn block" data-act="ob-next"' + (p.goals.length ? "" : " disabled") + ">Continue</button></div></div>";
    } else if (s === 2) {
      if (!p.topics.length) {
        p.topics = [];
        p.goals.forEach(function (gid) {
          var g = D.goals.find(function (x) { return x.id === gid; });
          g.topics.forEach(function (t) { if (p.topics.indexOf(t) < 0) p.topics.push(t); });
        });
      }
      html = '<div class="ob-step"><h1>Pick your topics</h1><p class="lead">We pre-selected a few based on your goals. Choose at least 2.</p><div class="options grid2">' +
        D.topics.map(function (t) { return optBtn("topic", t.id, t.emoji, t.name, p.topics.indexOf(t.id) >= 0, true); }).join("") +
        '</div><div class="sticky-cta"><button class="btn block" data-act="ob-next"' + (p.topics.length >= 2 ? "" : " disabled") + ">Continue</button></div></div>";
    } else if (s === 3) {
      html = '<div class="ob-step"><h1>What gets in the way most?</h1><p class="lead">We\'ll shape your plan around it.</p><div class="options">' +
        CHALLENGES.map(function (c) { return optBtn("challenge", c.id, c.emoji, c.label, p.challenge === c.id, false); }).join("") + "</div></div>";
    } else if (s >= 4 && s <= 6) {
      var st = STATEMENTS[s - 4], val = p.answers[st.id];
      html = '<div class="ob-step"><p class="small muted">Do you agree with this statement?</p><div class="statement">“' + esc(st.text) + '”</div>' +
        '<div class="scale">' + ["😣", "🙁", "😐", "🙂", "😄"].map(function (e, i) {
          return '<button data-act="answer" data-id="' + st.id + '" data-v="' + (i + 1) + '" class="' + (val === i + 1 ? "sel" : "") + '" aria-label="' + (i + 1) + ' of 5">' + e + "</button>";
        }).join("") + '</div><div class="scale-legend"><span>Strongly disagree</span><span>Strongly agree</span></div></div>';
    } else if (s === 7) {
      html = '<div class="ob-step"><h1>How much time can you give it?</h1><p class="lead">Each idea takes about a minute to read. You can change this later.</p><div class="options">' +
        MINUTES.map(function (m) {
          return '<button class="opt ' + (p.minutes === m.v ? "sel" : "") + '" data-act="minutes" data-v="' + m.v + '"><span class="emo">⏱️</span><span><b>' + m.label + '</b><br><span class="small muted">' + m.sub + " · " + Math.max(3, Math.round(m.v / 2)) + ' ideas a day</span></span><span class="check">' + (p.minutes === m.v ? "✓" : "") + "</span></button>";
        }).join("") + "</div></div>";
    } else if (s === 8) {
      html = '<div class="ob-step"><h1>What should we call you?</h1><p class="lead">So your plan feels like yours.</p>' +
        '<input class="text-input" id="ob-name" maxlength="30" placeholder="Your first name" value="' + esc(p.name) + '" autocomplete="given-name">' +
        '<button class="btn block" data-act="ob-next">Create my plan</button></div>';
    } else if (s === 9) {
      html = '<div class="builder ob-step"><div class="ring-wrap" id="bring">' + ring(0, 160, 12) + '<div class="pct" id="bpct">0%</div></div>' +
        '<h2>Building your growth plan…</h2><ul class="build-steps" id="bsteps">' +
        ["Analysing your goals", "Matching ideas to your topics", "Pacing your daily sessions", "Finalising your 4-week plan"].map(function (t) { return "<li>" + t + "</li>"; }).join("") +
        "</ul></div>";
    } else if (s === 10) {
      html = renderPlan(p);
    }
    $app.innerHTML = top + html;
    if (s === 8) { var n = document.getElementById("ob-name"); n.focus(); n.addEventListener("keydown", function (e) { if (e.key === "Enter") act("ob-next"); }); }
    if (s === 9) runBuilder();
  }

  function optBtn(kind, id, emoji, label, sel, multi) {
    return '<button class="opt ' + (sel ? "sel" : "") + '" data-act="pick" data-kind="' + kind + '" data-id="' + id + '" aria-pressed="' + sel + '">' +
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
      if (pct >= 100) { clearInterval(iv); setTimeout(function () { ob.step = 10; renderOnboarding(); }, 450); }
    }, 45);
  }

  function planWeeks(p) {
    var ts = p.topics.map(topic);
    var chal = { time: "Micro-sessions that fit between meetings", focus: "Attention training to beat distraction", overwhelm: "Fewer, better ideas — no info overload", motivation: "Quick wins and streaks to keep momentum" }[p.challenge] || "Build the daily habit";
    return [
      { t: "Foundations", d: chal + "." },
      { t: ts[0] ? ts[0].emoji + " " + ts[0].name + " essentials" : "Core ideas", d: "The most-saved ideas in your top topic." },
      { t: ts[1] ? ts[1].emoji + " " + ts[1].name + " in practice" : "Putting it to work", d: "Turning ideas into small daily actions." },
      { t: "Make it stick", d: "Review your stashes and lock in the habits that worked." }
    ];
  }

  function renderPlan(p) {
    var goal = Math.max(3, Math.round(p.minutes / 2));
    var total = goal * 28;
    var name = p.name ? esc(p.name) + ", your" : "Your";
    var ts = p.topics.map(topic);
    // Projected knowledge curve: habit-formation shaped (slow start, then compounding)
    var pts = [], W = 300, H = 120;
    for (var x = 0; x <= 28; x++) {
      var y = 1 - Math.exp(-x / 11);
      pts.push([(x / 28) * W, H - 10 - y * (H - 25)]);
    }
    var path = "M" + pts.map(function (q) { return q[0].toFixed(1) + " " + q[1].toFixed(1); }).join(" L");
    var today = new Date(), end = addDays(today, 28);
    var fmt = function (d) { return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); };

    return '<div class="ob-step"><p class="small muted" style="text-align:center">🎉 Plan ready</p>' +
      '<h1 style="text-align:center">' + name + " 4-week growth plan</h1>" +
      '<p class="muted" style="text-align:center">Focused on ' + ts.map(function (t) { return t.name; }).join(", ") + ".</p>" +
      '<div class="plan-card"><div class="stat-row">' +
      '<div class="stat"><b>' + goal + "</b><span>ideas / day</span></div>" +
      '<div class="stat"><b>' + p.minutes + "</b><span>min / day</span></div>" +
      '<div class="stat"><b>' + total + "</b><span>ideas total</span></div></div>" +
      '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Projected growth over 4 weeks">' +
      '<path d="' + path + " L" + W + " " + H + " L0 " + H + ' Z" fill="var(--accent-soft)"/>' +
      '<path d="' + path + '" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="' + pts[28][0] + '" cy="' + pts[28][1] + '" r="5" fill="var(--accent)"/></svg>' +
      '<div class="small muted" style="display:flex;justify-content:space-between"><span>Today · ' + fmt(today) + "</span><span>Goal · " + fmt(end) + "</span></div></div>" +
      '<div class="plan-card"><h2>Your roadmap</h2><div class="weeks">' +
      planWeeks(p).map(function (w, i) { return '<div class="week"><div class="num">W' + (i + 1) + "</div><div><b>" + esc(w.t) + '</b><div class="small muted">' + esc(w.d) + "</div></div></div>"; }).join("") +
      "</div></div>" +
      '<div class="sticky-cta"><button class="btn block" data-act="ob-finish">Start my plan →</button></div></div>';
  }

  // ---------- Main views ----------
  function ideaCard(i, opts) {
    opts = opts || {};
    var t = topic(i.topic), src = source(i.source), read = readSet()[i.id];
    return '<article class="idea ' + (read && opts.dimRead ? "read" : "") + '" style="--topic:' + t.color + '" data-act="open-idea" data-id="' + i.id + '">' +
      (read && opts.dimRead ? '<span class="done-badge">✓ Read</span>' : "") +
      '<div class="meta"><span class="tag">' + t.emoji + " " + esc(t.name) + "</span>" + (src ? "· " + esc(src.title) : i.author ? "· by " + esc(i.author) : "") + "</div>" +
      "<h3>" + esc(i.title) + "</h3><p>" + esc(i.body) + "</p>" +
      '<div class="idea-actions">' +
      '<button class="icon-btn ' + (state.liked.indexOf(i.id) >= 0 ? "on" : "") + '" data-act="like" data-id="' + i.id + '" aria-label="Like">' + (state.liked.indexOf(i.id) >= 0 ? "❤️" : "🤍") + "</button>" +
      '<button class="icon-btn ' + (isStashed(i.id) ? "on" : "") + '" data-act="stash" data-id="' + i.id + '" aria-label="Stash">' + (isStashed(i.id) ? "📌" : "➕") + "</button>" +
      '<button class="icon-btn" data-act="share" data-id="' + i.id + '" aria-label="Share">↗</button>' +
      "</div></article>";
  }

  function viewToday() {
    var picks = todaysPicks(), goal = dailyGoal(), done = Math.min(goal, todayCount());
    var hour = new Date().getHours();
    var hi = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    var days = [];
    var start = addDays(new Date(), -((new Date().getDay() + 6) % 7)); // Monday
    for (var d = 0; d < 7; d++) {
      var dd = addDays(start, d), k = dayKey(dd);
      days.push('<i class="' + (hitGoal(k) ? "hit " : "") + (k === dayKey() ? "today" : "") + '">' + "MTWTFSS"[d] + "</i>");
    }
    var next = picks.find(function (i) { return (state.history[dayKey()] || []).indexOf(i.id) < 0; });
    return '<div class="header-row"><div><div class="small muted">' + hi + (state.profile.name ? ", " + esc(state.profile.name) : "") + '</div><h1>Today\'s ideas</h1></div>' +
      '<span class="streak" title="Day streak">🔥 ' + streak() + "</span></div>" +
      '<div class="goal-card"><div class="mini-ring">' + ring(done / goal, 72, 8) + "<b>" + done + "/" + goal + "</b></div>" +
      "<div><b>" + (done >= goal ? "Daily goal complete! 🎉" : "Daily goal: " + goal + " ideas") + '</b><div class="small muted">' +
      (done >= goal ? "Come back tomorrow to keep your streak." : "About " + (goal - done) + " min left today") + '</div><div class="week-dots">' + days.join("") + "</div></div></div>" +
      (next ? '<button class="btn block" data-act="read-today">' + (done ? "Continue reading" : "Start today's session") + " →</button>" :
        '<button class="btn block ghost" data-act="read-today">Review today\'s ideas</button>') +
      '<div class="section-title"><h2>Your picks</h2><span class="small muted">' + picks.length + " ideas</span></div>" +
      '<div class="idea-list">' + picks.map(function (i) { return ideaCard(i, { dimRead: true }); }).join("") + "</div>";
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
      body = '<div class="section-title"><h2>Results</h2><span class="small muted">' + hits.length + "</span></div>" +
        (hits.length ? '<div class="idea-list">' + hits.map(function (i) { return ideaCard(i); }).join("") + "</div>" : '<div class="empty"><span class="big">🔎</span>No ideas match “' + esc(exploreState.q) + "”.</div>");
    } else {
      var srcs = D.sources.filter(function (s) { return tp === "all" || s.topic === tp; });
      var ideasIn = allIdeas().filter(function (i) { return tp === "all" || i.topic === tp; });
      var popular = ideasIn.slice().sort(function (a, b) { return b.body.length % 7 - a.body.length % 7; }).slice(0, 4);
      body = '<div class="section-title"><h2>Sources</h2><span class="small muted">' + srcs.length + "</span></div>" +
        '<div class="source-grid">' + srcs.map(function (s) {
          var t = topic(s.topic), n = D.ideas.filter(function (i) { return i.source === s.id; }).length;
          return '<button class="source" style="--topic:' + t.color + '" data-act="open-source" data-id="' + s.id + '"><span class="type">' + t.emoji + " " + s.type + "</span><div><b>" + esc(s.title) + "</b><br><small>" + n + " ideas · " + s.minutes + " min</small></div></button>";
        }).join("") + "</div>" +
        '<div class="section-title"><h2>Trending ideas</h2></div><div class="idea-list">' + popular.map(function (i) { return ideaCard(i); }).join("") + "</div>";
    }
    return "<h1>Explore</h1>" +
      '<div class="search"><input class="text-input" id="ex-q" type="search" placeholder="Search ideas, topics, sources" value="' + esc(exploreState.q) + '"></div>' + chips + body;
  }

  function viewSource(id) {
    var s = source(id);
    if (!s) return viewNotFound();
    var t = topic(s.topic), list = D.ideas.filter(function (i) { return i.source === id; });
    return '<div class="header-row"><a class="icon-btn" href="#/explore" aria-label="Back" style="text-decoration:none">←</a><span></span></div>' +
      '<div class="source" style="--topic:' + t.color + ';min-height:180px;cursor:default;margin-bottom:18px"><span class="type">' + t.emoji + " " + t.name + " · " + s.type + '</span><div><b style="font-size:24px">' + esc(s.title) + "</b><br><small>" + esc(s.author) + " · " + list.length + " ideas · " + s.minutes + " min read</small></div></div>" +
      '<button class="btn block" data-act="read-source" data-id="' + id + '">Read all ' + list.length + " ideas →</button>" +
      '<div class="section-title"><h2>Ideas</h2></div><div class="idea-list">' + list.map(function (i) { return ideaCard(i, { dimRead: true }); }).join("") + "</div>";
  }

  function viewStashes() {
    return '<div class="header-row"><h1>Your stashes</h1></div>' +
      '<p class="muted">Save ideas into collections to revisit anytime.</p>' +
      '<div class="stash-grid">' + state.stashes.map(function (s) {
        return '<button class="stash" data-act="open-stash" data-id="' + s.id + '"><span class="emo">' + s.emoji + "</span><b>" + esc(s.name) + '</b><span class="small muted">' + s.ideaIds.length + " ideas</span></button>";
      }).join("") + '<button class="stash new" data-act="new-stash">＋ New stash</button></div>' +
      (state.liked.length ? '<div class="section-title"><h2>Liked</h2><span class="small muted">' + state.liked.length + '</span></div><div class="idea-list">' +
        state.liked.map(idea).filter(Boolean).map(function (i) { return ideaCard(i); }).join("") + "</div>" : "");
  }

  function viewStash(id) {
    var s = state.stashes.find(function (x) { return x.id === id; });
    if (!s) return viewNotFound();
    var list = s.ideaIds.map(idea).filter(Boolean);
    return '<div class="header-row"><a class="icon-btn" href="#/stashes" aria-label="Back" style="text-decoration:none">←</a>' +
      '<div style="display:flex;gap:8px"><button class="btn small ghost" data-act="rename-stash" data-id="' + id + '">Rename</button>' +
      '<button class="btn small ghost" data-act="delete-stash" data-id="' + id + '">Delete</button></div></div>' +
      '<h1>' + s.emoji + " " + esc(s.name) + '</h1><p class="muted">' + list.length + " ideas</p>" +
      (list.length ? '<button class="btn block" data-act="read-stash" data-id="' + id + '">Review this stash →</button><div class="idea-list" style="margin-top:18px">' + list.map(function (i) { return ideaCard(i); }).join("") + "</div>"
        : '<div class="empty"><span class="big">📭</span>Nothing here yet. Tap ➕ on any idea to stash it.</div>');
  }

  function viewCreate() {
    var mine = state.custom.slice().reverse();
    return "<h1>Create an idea</h1><p class=\"muted\">Captured something worth keeping? Write it in your own words — it'll be searchable and stashable like any other idea.</p>" +
      '<form id="create-form">' +
      '<input class="text-input" name="title" maxlength="80" required placeholder="Idea title (e.g. The 5-second rule)">' +
      '<textarea class="text-input" name="body" maxlength="600" required placeholder="Explain it in a few sentences…"></textarea>' +
      '<select class="text-input" name="topic">' + D.topics.map(function (t) { return '<option value="' + t.id + '">' + t.emoji + " " + t.name + "</option>"; }).join("") + "</select>" +
      '<button class="btn block" type="submit">Publish idea</button></form>' +
      (mine.length ? '<div class="section-title"><h2>Your ideas</h2><span class="small muted">' + mine.length + '</span></div><div class="idea-list">' + mine.map(function (i) { return ideaCard(i); }).join("") + "</div>" : "");
  }

  function viewProfile() {
    var p = state.profile, read = Object.keys(readSet()).length;
    var bars = [], max = 1;
    for (var d = 6; d >= 0; d--) {
      var dd = addDays(new Date(), -d), n = (state.history[dayKey(dd)] || []).length;
      max = Math.max(max, n);
      bars.push({ n: n, l: dd.toLocaleDateString(undefined, { weekday: "narrow" }) });
    }
    var stashedCount = state.stashes.reduce(function (a, s) { return a + s.ideaIds.length; }, 0);
    return '<div class="profile-head"><div class="avatar">' + esc((p.name || "?").charAt(0).toUpperCase()) + "</div><div><h1>" + esc(p.name || "Reader") + '</h1><div class="small muted">' +
      p.topics.map(function (t) { return topic(t).emoji; }).join(" ") + "</div></div></div>" +
      '<div class="stat-row"><div class="stat"><b>🔥 ' + streak() + '</b><span>day streak</span></div><div class="stat"><b>' + read + '</b><span>ideas read</span></div><div class="stat"><b>' + stashedCount + "</b><span>stashed</span></div></div>" +
      '<div class="plan-card"><h3>Last 7 days</h3><div class="bars">' + bars.map(function (b) { return "<div>" + (b.n || "") + '<span style="height:' + (b.n / max) * 80 + '%"></span>' + b.l + "</div>"; }).join("") + "</div></div>" +
      '<h2 style="margin-top:22px">Settings</h2><div class="list">' +
      '<div class="list-row"><span class="grow">Daily time</span><div class="seg">' + [5, 10, 15, 20].map(function (m) { return '<button class="' + (p.minutes === m ? "sel" : "") + '" data-act="set-min" data-v="' + m + '">' + m + "m</button>"; }).join("") + "</div></div>" +
      '<div class="list-row"><span class="grow">Theme</span><div class="seg">' + ["auto", "light", "dark"].map(function (m) { return '<button class="' + (state.theme === m ? "sel" : "") + '" data-act="set-theme" data-v="' + m + '">' + m + "</button>"; }).join("") + "</div></div>" +
      '<div class="list-row"><span class="grow">Topics</span><button class="btn small ghost" data-act="edit-topics">Edit</button></div>' +
      '<div class="list-row"><span class="grow">Growth plan</span><button class="btn small ghost" data-act="view-plan">View</button></div>' +
      "</div>" +
      '<div class="list"><div class="list-row"><span class="grow">Retake the quiz</span><button class="btn small ghost" data-act="retake">Retake</button></div>' +
      '<div class="list-row"><span class="grow">Reset all data</span><button class="btn small ghost" data-act="reset">Reset</button></div></div>' +
      '<p class="small muted" style="text-align:center">Brightbits · your data stays on this device</p>';
  }

  function viewNotFound() {
    return '<div class="empty"><span class="big">🤷</span>That page doesn\'t exist.<br><br><a class="btn" href="#/today">Go home</a></div>';
  }

  // ---------- Reader ----------
  var reader = null;
  function openReader(list, title) {
    if (!list.length) return;
    var start = 0;
    var todays = state.history[dayKey()] || [];
    for (var i = 0; i < list.length; i++) { if (todays.indexOf(list[i].id) < 0) { start = i; break; } }
    reader = { list: list, i: start, title: title, finished: false };
    renderReader();
  }
  function closeReader() { reader = null; var el = document.querySelector(".reader"); if (el) el.remove(); render(); }
  function renderReader() {
    var el = document.querySelector(".reader");
    if (!el) { el = document.createElement("div"); el.className = "reader"; document.body.appendChild(el); }
    var r = reader, bars = r.list.map(function (_, k) { return '<i class="' + (k <= r.i || r.finished ? "on" : "") + '"></i>'; }).join("");
    var top = '<div class="reader-top"><button class="icon-btn" data-act="reader-close" aria-label="Close">✕</button><div class="reader-bars">' + bars + "</div></div>";
    if (r.finished) {
      var goalDone = todayCount() >= dailyGoal();
      el.innerHTML = top + '<div class="reader-stage"><div class="reader-card celebrate"><div class="big">' + (goalDone ? "🔥" : "🌟") + "</div><h2>" +
        (goalDone ? "Daily goal reached!" : "Session complete") + '</h2><p class="body muted">' +
        (goalDone ? "You're on a " + streak() + "-day streak. Small steps, every day — that's how it compounds." : "You read " + r.list.length + " ideas. Keep going to hit today's goal.") +
        '</p></div></div><div class="reader-bottom"><button class="btn" data-act="reader-close">Done</button></div>';
      return;
    }
    var it = r.list[r.i], t = topic(it.topic), src = source(it.source);
    markRead(it.id);
    el.innerHTML = top + '<div class="reader-stage"><div class="reader-card" style="--topic:' + t.color + '" id="rcard"><div class="tag">' + t.emoji + " " + esc(t.name) +
      " · " + (r.i + 1) + "/" + r.list.length + "</div><h2>" + esc(it.title) + '</h2><div class="body">' + esc(it.body) + "</div>" +
      '<div class="src">' + (src ? "From <b>" + esc(src.title) + "</b> · " + esc(src.type) : "Your idea") + "</div></div></div>" +
      '<div class="reader-bottom">' +
      '<button class="icon-btn" data-act="reader-prev" aria-label="Previous"' + (r.i === 0 ? " disabled" : "") + ">‹</button>" +
      '<button class="icon-btn ' + (state.liked.indexOf(it.id) >= 0 ? "on" : "") + '" data-act="like" data-id="' + it.id + '" aria-label="Like">' + (state.liked.indexOf(it.id) >= 0 ? "❤️" : "🤍") + "</button>" +
      '<button class="icon-btn ' + (isStashed(it.id) ? "on" : "") + '" data-act="stash" data-id="' + it.id + '" aria-label="Stash">' + (isStashed(it.id) ? "📌" : "➕") + "</button>" +
      '<button class="btn" data-act="reader-next">' + (r.i === r.list.length - 1 ? "Finish" : "Next") + " →</button></div>";
    swipe(document.getElementById("rcard"));
  }
  function readerStep(d) {
    if (!reader) return;
    if (d > 0 && reader.i === reader.list.length - 1) { reader.finished = true; }
    else reader.i = Math.max(0, Math.min(reader.list.length - 1, reader.i + d));
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
    }).join("") + '<button class="sheet-row" data-act="new-stash" data-id="' + id + '"><span style="font-size:24px">＋</span><b>New stash</b></button>');
  }
  function ideaSheet(id) {
    var i = idea(id); if (!i) return;
    var t = topic(i.topic), src = source(i.source);
    sheet('<div class="tag small" style="color:' + t.color + ';font-weight:800;text-transform:uppercase">' + t.emoji + " " + t.name + "</div><h2>" + esc(i.title) + '</h2><p style="font-size:18px">' + esc(i.body) + "</p>" +
      (src ? '<p class="small muted">From <a href="#/source/' + src.id + '" data-act="sheet-link">' + esc(src.title) + "</a> · " + src.type + "</p>" : "") +
      '<div class="idea-actions"><button class="btn" data-act="stash" data-id="' + id + '">' + (isStashed(id) ? "📌 Stashed" : "➕ Stash") + '</button><button class="btn ghost" data-act="like" data-id="' + id + '">' + (state.liked.indexOf(id) >= 0 ? "❤️ Liked" : "🤍 Like") + '</button><button class="btn ghost" data-act="share" data-id="' + id + '">↗ Share</button></div>');
    markRead(id);
  }
  function topicsSheet() {
    sheet("<h2>Your topics</h2><p class=\"muted small\">Today's picks are drawn from these.</p><div class=\"options grid2\">" +
      D.topics.map(function (t) { return optBtn("ptopic", t.id, t.emoji, t.name, state.profile.topics.indexOf(t.id) >= 0, true); }).join("") +
      '</div><button class="btn block" data-act="sheet-close-btn">Done</button>');
  }
  function planSheet() {
    sheet(renderPlan(state.profile).replace('data-act="ob-finish">Start my plan →', 'data-act="sheet-close-btn">Close'));
  }

  // ---------- Router ----------
  function route() { return (location.hash.replace(/^#\/?/, "") || "today").split("/"); }
  function render() {
    applyTheme();
    if (!state.onboarded) {
      $tabbar.hidden = true;
      $app.classList.add("no-tabs");
      renderOnboarding();
      return;
    }
    $tabbar.hidden = false;
    $app.classList.remove("no-tabs");
    var r = route(), html;
    switch (r[0]) {
      case "today": html = viewToday(); break;
      case "explore": html = viewExplore(); break;
      case "source": html = viewSource(r[1]); break;
      case "stashes": html = viewStashes(); break;
      case "stash": html = viewStash(r[1]); break;
      case "create": html = viewCreate(); break;
      case "profile": html = viewProfile(); break;
      default: html = viewNotFound();
    }
    $app.innerHTML = html;
    var tab = { source: "explore", stash: "stashes" }[r[0]] || r[0];
    $tabbar.querySelectorAll("a").forEach(function (a) { a.classList.toggle("active", a.dataset.tab === tab); });
    bindView(r[0]);
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
        var f = e.target;
        var title = f.title.value.trim(), body = f.body.value.trim();
        if (!title || !body) return;
        state.custom.push({ id: "c" + Date.now(), title: title, body: body, topic: f.topic.value, author: state.profile.name || "you" });
        save(); toast("Idea published ✨"); render();
      });
    }
  }

  // ---------- Actions ----------
  function act(name, el) {
    var id = el && el.dataset.id, p = ob.draft;
    switch (name) {
      case "ob-next":
        if (ob.step === 8) p.name = (document.getElementById("ob-name").value || "").trim();
        ob.step++; renderOnboarding(); window.scrollTo(0, 0); break;
      case "ob-back": ob.step = Math.max(0, ob.step - 1); renderOnboarding(); break;
      case "pick": {
        var kind = el.dataset.kind;
        if (kind === "goal") { toggleIn(p.goals, id); p.topics = []; }
        else if (kind === "topic") toggleIn(p.topics, id);
        else if (kind === "challenge") { p.challenge = id; renderOnboarding(); setTimeout(function () { act("ob-next"); }, 220); return; }
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
        state.profile = p; state.onboarded = true; ob = { step: 0, draft: null };
        save(); location.hash = "#/today"; render(); window.scrollTo(0, 0); break;

      case "read-today": openReader(todaysPicks(), "Today"); break;
      case "read-source": openReader(D.ideas.filter(function (i) { return i.source === id; }), "Source"); break;
      case "read-stash": {
        var st = state.stashes.find(function (s) { return s.id === id; });
        openReader(st.ideaIds.map(idea).filter(Boolean), st.name); break;
      }
      case "reader-next": readerStep(1); break;
      case "reader-prev": readerStep(-1); break;
      case "reader-close": closeReader(); break;

      case "open-idea": ideaSheet(id); break;
      case "open-source": location.hash = "#/source/" + id; break;
      case "open-stash": location.hash = "#/stash/" + id; break;
      case "ex-topic": exploreState.topic = id; render(); break;

      case "like": toast(toggleLike(id) ? "Liked ❤️" : "Removed like"); refreshSheetOrView(id); break;
      case "stash": stashSheet(id); break;
      case "toggle-stash": {
        var s = state.stashes.find(function (x) { return x.id === el.dataset.stash; });
        var k = s.ideaIds.indexOf(id);
        if (k >= 0) s.ideaIds.splice(k, 1); else s.ideaIds.push(id);
        save(); toast(k >= 0 ? "Removed from " + s.name : "Saved to " + s.name);
        stashSheet(id); rerenderKeepScroll(); break;
      }
      case "new-stash": {
        var nm = prompt("Name your stash");
        if (!nm || !nm.trim()) return;
        var emojis = ["📘", "🧠", "💡", "🌱", "🎯", "🚀", "🧩", "🌙"];
        var ns = { id: "st" + Date.now(), name: nm.trim().slice(0, 40), emoji: emojis[state.stashes.length % emojis.length], ideaIds: id ? [id] : [] };
        state.stashes.push(ns); save();
        if (id) { toast("Saved to " + ns.name); stashSheet(id); }
        rerenderKeepScroll(); break;
      }
      case "rename-stash": {
        var rs = state.stashes.find(function (x) { return x.id === id; });
        var nn = prompt("Rename stash", rs.name);
        if (nn && nn.trim()) { rs.name = nn.trim().slice(0, 40); save(); render(); }
        break;
      }
      case "delete-stash":
        if (confirm("Delete this stash? The ideas themselves stay available.")) {
          state.stashes = state.stashes.filter(function (x) { return x.id !== id; });
          save(); location.hash = "#/stashes";
        }
        break;
      case "share": shareIdea(id); break;

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
    if ($modal.innerHTML && $modal.querySelector(".sheet h2") && !$modal.querySelector("[data-act=toggle-stash]")) ideaSheet(id);
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
    // Clicks on inner action buttons shouldn't also open the card or close the sheet.
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
  window.addEventListener("hashchange", function () { closeSheet(); render(); window.scrollTo(0, 0); });

  render();
})();
