// Seed content for Brightbits. All summaries are original paraphrases written for this app.
window.BB_DATA = {
  topics: [
    { id: "productivity", name: "Productivity", emoji: "⚡", color: "#f5a524" },
    { id: "mindfulness", name: "Mindfulness", emoji: "🧘", color: "#17c3b2" },
    { id: "psychology", name: "Psychology", emoji: "🧠", color: "#9b5de5" },
    { id: "money", name: "Money", emoji: "💰", color: "#2ec27e" },
    { id: "communication", name: "Communication", emoji: "💬", color: "#3a86ff" },
    { id: "health", name: "Health", emoji: "💪", color: "#ef476f" },
    { id: "leadership", name: "Leadership", emoji: "🧭", color: "#ff7b00" },
    { id: "creativity", name: "Creativity", emoji: "🎨", color: "#e056fd" }
  ],

  goals: [
    { id: "focus", label: "Sharpen my focus", emoji: "🎯", topics: ["productivity", "mindfulness"] },
    { id: "confidence", label: "Build confidence", emoji: "🦁", topics: ["psychology", "communication"] },
    { id: "wealth", label: "Get smarter with money", emoji: "📈", topics: ["money", "productivity"] },
    { id: "calm", label: "Reduce stress & anxiety", emoji: "🌿", topics: ["mindfulness", "health"] },
    { id: "career", label: "Grow my career", emoji: "🚀", topics: ["leadership", "communication"] },
    { id: "habits", label: "Build better habits", emoji: "🔁", topics: ["productivity", "health"] },
    { id: "create", label: "Be more creative", emoji: "💡", topics: ["creativity", "psychology"] }
  ],

  sources: [
    { id: "s1", title: "The Compound Habit", author: "Brightbits Editors", type: "Book", topic: "productivity", minutes: 6 },
    { id: "s2", title: "Deep Work in a Shallow World", author: "Brightbits Editors", type: "Article", topic: "productivity", minutes: 5 },
    { id: "s3", title: "Stillness on Demand", author: "Brightbits Editors", type: "Book", topic: "mindfulness", minutes: 5 },
    { id: "s4", title: "How Your Brain Fools You", author: "Brightbits Editors", type: "Book", topic: "psychology", minutes: 7 },
    { id: "s5", title: "Money Without the Jargon", author: "Brightbits Editors", type: "Book", topic: "money", minutes: 6 },
    { id: "s6", title: "Conversations That Land", author: "Brightbits Editors", type: "Article", topic: "communication", minutes: 5 },
    { id: "s7", title: "The Energy Basics", author: "Brightbits Editors", type: "Podcast", topic: "health", minutes: 5 },
    { id: "s8", title: "Leading Small Teams", author: "Brightbits Editors", type: "Book", topic: "leadership", minutes: 6 },
    { id: "s9", title: "Making Things Anyway", author: "Brightbits Editors", type: "Video", topic: "creativity", minutes: 5 },
    { id: "s10", title: "Worry, Examined", author: "Brightbits Editors", type: "Article", topic: "psychology", minutes: 4 }
  ],

  ideas: [
    // Productivity — s1
    { id: "i1", source: "s1", topic: "productivity", title: "Tiny gains compound", body: "Improving by 1% a day barely registers this week, but it stacks. Over a year, small consistent upgrades beat occasional heroic efforts because each gain becomes the base for the next one." },
    { id: "i2", source: "s1", topic: "productivity", title: "Make the habit obvious", body: "Put the cue where you can't miss it. Leave the book on your pillow, the running shoes by the door. Most habits fail not from lack of willpower but because the trigger never shows up." },
    { id: "i3", source: "s1", topic: "productivity", title: "The two-minute version", body: "Shrink any new habit until it takes two minutes: 'read one page', 'put on gym clothes'. Showing up daily matters more than the size of the rep. You can scale once the routine is automatic." },
    { id: "i4", source: "s1", topic: "productivity", title: "Identity beats outcomes", body: "Instead of 'I want to run a marathon', try 'I'm a runner'. Every small action becomes a vote for who you're becoming, and people protect identities far more fiercely than goals." },
    { id: "i5", source: "s1", topic: "productivity", title: "Habit stacking", body: "Attach a new habit to an existing one: 'After I pour my coffee, I'll write my top three tasks.' The old habit acts as a reliable trigger for the new one." },
    // Productivity — s2
    { id: "i6", source: "s2", topic: "productivity", title: "Attention residue", body: "When you switch tasks, part of your mind stays stuck on the last one. Checking email 'just for a second' taxes the next hour of work. Batch shallow tasks so deep work gets your full attention." },
    { id: "i7", source: "s2", topic: "productivity", title: "Schedule your focus", body: "Deep work rarely happens by accident. Block it in your calendar like a meeting, protect it like one, and treat it as the most important appointment of your day." },
    { id: "i8", source: "s2", topic: "productivity", title: "Embrace boredom", body: "If you reach for your phone at every idle moment, your brain forgets how to sit with a hard problem. Practice waiting without stimulation and your concentration muscle gets stronger." },
    { id: "i9", source: "s2", topic: "productivity", title: "A shutdown ritual", body: "End work with a short checklist: review open loops, plan tomorrow, then say 'done'. Closing the day deliberately stops unfinished tasks from following you into the evening." },
    // Mindfulness — s3
    { id: "i10", source: "s3", topic: "mindfulness", title: "The 3-breath reset", body: "Before reacting, take three slow breaths and make each exhale longer than the inhale. It's short enough to do mid-conversation and long enough to shift you out of autopilot." },
    { id: "i11", source: "s3", topic: "mindfulness", title: "Name it to tame it", body: "Quietly labeling an emotion — 'this is frustration' — creates a little distance from it. You stop being the feeling and start observing it, which makes it easier to choose a response." },
    { id: "i12", source: "s3", topic: "mindfulness", title: "One thing at a time", body: "Wash the dish while washing the dish. Single-tasking ordinary moments trains the same attention you need for demanding work, and it turns chores into small rests." },
    { id: "i13", source: "s3", topic: "mindfulness", title: "Thoughts are not facts", body: "A thought like 'I'll never get this right' is a mental event, not a verdict. Notice it, let it pass like a car on the street, and return to what you're doing." },
    // Psychology — s4
    { id: "i14", source: "s4", topic: "psychology", title: "Two speeds of thinking", body: "Your mind runs a fast, intuitive system and a slow, deliberate one. The fast one is usually fine, but for big or unfamiliar decisions, deliberately slow down and check its shortcuts." },
    { id: "i15", source: "s4", topic: "psychology", title: "Anchoring", body: "The first number you hear drags your estimate toward it, even when it's random. In negotiations, set the anchor yourself — and when someone else does, consciously reset it." },
    { id: "i16", source: "s4", topic: "psychology", title: "Loss aversion", body: "Losing $50 feels roughly twice as bad as gaining $50 feels good. That's why we hold bad investments and avoid healthy risks. Ask: would I choose this today if I didn't already own it?" },
    { id: "i17", source: "s4", topic: "psychology", title: "Confirmation bias", body: "We seek evidence that agrees with us and skim past what doesn't. Before a big decision, spend five minutes arguing the other side as convincingly as you can." },
    { id: "i18", source: "s4", topic: "psychology", title: "The spotlight effect", body: "People notice your mistakes far less than you think — they're busy worrying about their own. Remembering this makes it easier to speak up and try new things." },
    // Psychology — s10
    { id: "i19", source: "s10", topic: "psychology", title: "Schedule your worry", body: "Give worries a 15-minute appointment each day. When one pops up outside that window, jot it down and postpone it. Many shrink by the time their slot arrives." },
    { id: "i20", source: "s10", topic: "psychology", title: "Control, influence, accept", body: "Sort a worry into three buckets: what you control, what you can influence, and what you must accept. Put your energy into the first two and practice letting go of the third." },
    // Money — s5
    { id: "i21", source: "s5", topic: "money", title: "Pay yourself first", body: "Move savings out automatically on payday, before you can spend it. What's left is your real budget. Automation beats discipline because you only decide once." },
    { id: "i22", source: "s5", topic: "money", title: "Compound interest is patient", body: "Money invested early does most of the work. The difference between starting at 25 and 35 is often larger than the difference between saving a little and saving a lot." },
    { id: "i23", source: "s5", topic: "money", title: "The emergency buffer", body: "Keep three to six months of essential expenses in cash you can reach quickly. It turns crises into inconveniences and stops you from selling investments at the worst time." },
    { id: "i24", source: "s5", topic: "money", title: "Wait 48 hours", body: "For non-essential purchases above a set amount, wait two days. If you still want it, buy it guilt-free. Most impulse wants fade faster than you'd expect." },
    { id: "i25", source: "s5", topic: "money", title: "Low fees, long horizons", body: "A 1% annual fee sounds small but can eat a big share of long-term returns. Broad, low-cost index funds held for years quietly beat most attempts to time the market." },
    // Communication — s6
    { id: "i26", source: "s6", topic: "communication", title: "Listen to understand", body: "Most of us listen while loading our reply. Try summarizing what the other person said before responding. They'll feel heard, and you'll catch misunderstandings early." },
    { id: "i27", source: "s6", topic: "communication", title: "Lead with the point", body: "In emails and updates, put the conclusion or request in the first line. Details go after. Busy readers decide in seconds whether to keep reading." },
    { id: "i28", source: "s6", topic: "communication", title: "Curious questions", body: "Swap 'why did you do that?' for 'what led you to that?'. The second invites a story instead of a defense, and keeps hard conversations collaborative." },
    { id: "i29", source: "s6", topic: "communication", title: "Use the pause", body: "A short silence after a question often draws out the most honest answer. Resist filling it. Pauses also make your own key points land harder." },
    { id: "i30", source: "s6", topic: "communication", title: "Feedback: situation, behavior, impact", body: "Describe the specific situation, the observable behavior, and its impact. 'In yesterday's demo, you skipped the intro, and the client looked lost' is actionable; 'you were sloppy' isn't." },
    // Health — s7
    { id: "i31", source: "s7", topic: "health", title: "Anchor your wake time", body: "A consistent wake-up time, even on weekends, does more for sleep quality than a consistent bedtime. Your body clock syncs to morning light and routine." },
    { id: "i32", source: "s7", topic: "health", title: "Morning light", body: "Get outdoor light within an hour of waking, even on cloudy days. It helps set your circadian rhythm, lifts alertness, and makes falling asleep at night easier." },
    { id: "i33", source: "s7", topic: "health", title: "Movement snacks", body: "You don't need an hour at the gym to benefit. Short bursts — stairs, a brisk walk, ten squats — spread through the day improve energy and blood sugar." },
    { id: "i34", source: "s7", topic: "health", title: "Protein at breakfast", body: "A breakfast with solid protein tends to keep you fuller and steadier than one built on sugar. Fewer mid-morning crashes means better focus." },
    // Leadership — s8
    { id: "i35", source: "s8", topic: "leadership", title: "Psychological safety", body: "Teams perform best when people can admit mistakes and ask 'dumb' questions without fear. Leaders build that by admitting their own mistakes first." },
    { id: "i36", source: "s8", topic: "leadership", title: "Delegate outcomes, not tasks", body: "Instead of listing steps, describe what success looks like and why it matters. People bring more ownership and creativity when they get to choose the how." },
    { id: "i37", source: "s8", topic: "leadership", title: "Regular 1:1s", body: "A short weekly one-on-one, driven by the other person's agenda, catches problems early and builds trust faster than any all-hands meeting." },
    { id: "i38", source: "s8", topic: "leadership", title: "Praise specifically", body: "'Great job' fades instantly. 'The way you simplified that chart made the decision easy' tells people exactly what to repeat." },
    // Creativity — s9
    { id: "i39", source: "s9", topic: "creativity", title: "Quantity breeds quality", body: "Aim for many rough versions rather than one perfect one. Volume gives you practice and more raw material, and the good ideas tend to show up somewhere in the pile." },
    { id: "i40", source: "s9", topic: "creativity", title: "Constraints spark ideas", body: "A blank page is paralyzing. Limit yourself — one color, 100 words, a 20-minute timer — and your brain starts solving instead of stalling." },
    { id: "i41", source: "s9", topic: "creativity", title: "Steal like a collector", body: "Keep a swipe file of things that move you. New ideas are usually remixes of old ones; the more inputs you collect, the more interesting your combinations become." },
    { id: "i42", source: "s9", topic: "creativity", title: "Walk on it", body: "When stuck, step away and walk. Relaxed, unfocused attention lets your mind connect distant ideas — which is why insights so often arrive in the shower." }
  ]
};
