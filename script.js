// =======================
// FirstRep — Full Feature Build (v3+)
// Includes: rotation, variation cycling, time-based sets, custom sets, rest guidance,
// alternatives, injury-aware substitutions, active recovery mode, warm-ups,
// history, PRs with congratulations, delete workout, export/import, clear all,
// offline chat coach with quick prompts, persistent chat.
// Change requested: "Save Workout" => "Complete Workout"
// =======================

// ---------- Storage keys
const STORE = {
  dayIndex: "firstrep_dayIndex_v3",
  history: "firstrep_history_v3",
  prs: "firstrep_prs_v3",
  splitVarIndex: "firstrep_splitVarIndex_v3",
  chat: "firstrep_chat_v3"
};

// ---------- Rest rules
const REST_RULES = [
  { min: 1,  max: 5,  rest: "3–5 min",   note: "Heavy strength work" },
  { min: 6,  max: 10, rest: "2–3 min",   note: "Strength / hypertrophy" },
  { min: 10, max: 12, rest: "1–2 min",   note: "Hypertrophy" },
  { min: 12, max: 20, rest: "45–90 sec", note: "Higher reps / conditioning" }
];

function restForRepRange(rangeStr) {
  const s = String(rangeStr);
  const m = s.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return { rest: "1–2 min", note: "" };

  const min = Number(m[1]);
  const max = Number(m[2]);

  for (const r of REST_RULES) {
    if (min >= r.min && max <= r.max) return { rest: r.rest, note: r.note };
  }
  for (const r of REST_RULES) {
    if (min >= r.min && min <= r.max) return { rest: r.rest, note: r.note };
  }
  return { rest: "1–2 min", note: "" };
}

// ---------- Split logic
function getSplit(days) {
  if (days === 6) return ["push", "pull", "legs"];
  if (days === 5) return ["upper", "lower", "arms"];
  if (days === 4) return ["upper", "lower"];
  return ["full"];
}

// ---------- Workout library (variations per split)
const LIB = {
  push: [
    [
      { name: "Barbell Bench Press", repRange: "6-10", alternatives: ["Dumbbell Bench Press", "Machine Chest Press", "Push-Ups"] },
      { name: "Seated Dumbbell Shoulder Press", repRange: "8-12", alternatives: ["Machine Shoulder Press", "Standing Dumbbell Press", "Landmine Press"] },
      { name: "Incline Dumbbell Press", repRange: "8-12", alternatives: ["Incline Machine Press", "Incline Barbell Press", "Push-Ups (feet elevated)"] },
      { name: "Cable Tricep Pushdown", repRange: "10-12", alternatives: ["Rope Pushdown", "Dips (assisted)", "Close-Grip Push-Ups"] }
    ],
    [
      { name: "Machine Chest Press", repRange: "8-12", alternatives: ["Barbell Bench Press", "Dumbbell Bench Press", "Push-Ups"] },
      { name: "Lateral Raises", repRange: "12-15", alternatives: ["Cable Lateral Raise", "Machine Lateral Raise", "Lean-Away DB Lateral Raise"] },
      { name: "Incline Machine Press", repRange: "10-12", alternatives: ["Incline DB Press", "Incline Barbell Press", "Push-Ups (feet elevated)"] },
      { name: "Overhead Tricep Extension", repRange: "10-12", alternatives: ["Cable OH Extension", "Skull Crushers", "Close-Grip Bench (light)"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Machine Chest Press", "Barbell Bench Press", "Push-Ups"] },
      { name: "Arnold Press", repRange: "8-12", alternatives: ["Seated DB Press", "Machine Shoulder Press", "Landmine Press"] },
      { name: "Cable Fly", repRange: "12-15", alternatives: ["Pec Deck", "DB Fly (light)", "Push-Up Plus"] },
      { name: "Tricep Dips (assisted)", repRange: "8-12", alternatives: ["Bench Dips", "Cable Pushdown", "Close-Grip Push-Ups"] }
    ]
  ],
  pull: [
    [
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "Band Pull-Downs", "High Row Machine"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Dumbbell Row", "Machine Row"] },
      { name: "Face Pull", repRange: "12-15", alternatives: ["Rear Delt Fly", "Band Face Pull", "Reverse Pec Deck"] },
      { name: "Dumbbell Curl", repRange: "10-12", alternatives: ["Cable Curl", "EZ-Bar Curl", "Hammer Curl"] }
    ],
    [
      { name: "Assisted Pull-Ups", repRange: "6-10", alternatives: ["Lat Pulldown", "Band-Assisted Pull-Ups", "High Row Machine"] },
      { name: "Chest-Supported Row", repRange: "8-12", alternatives: ["Seated Row", "Dumbbell Row", "Machine Row"] },
      { name: "Reverse Pec Deck", repRange: "12-15", alternatives: ["Rear Delt Fly", "Face Pull", "Band Pull-Aparts"] },
      { name: "Hammer Curl", repRange: "10-12", alternatives: ["Incline DB Curl", "Cable Curl", "EZ-Bar Curl"] }
    ],
    [
      { name: "High Row Machine", repRange: "8-12", alternatives: ["Lat Pulldown", "Assisted Pull-Ups", "Band Pull-Downs"] },
      { name: "One-Arm Dumbbell Row", repRange: "8-12", alternatives: ["Seated Row", "Machine Row", "Chest-Supported Row"] },
      { name: "Rear Delt Fly", repRange: "12-15", alternatives: ["Face Pull", "Reverse Pec Deck", "Band Pull-Aparts"] },
      { name: "Cable Curl", repRange: "10-12", alternatives: ["DB Curl", "EZ-Bar Curl", "Hammer Curl"] }
    ]
  ],
  legs: [
    [
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat Machine", "Smith Squat (light)"] },
      { name: "Goblet Squat", repRange: "8-12", alternatives: ["Leg Press", "Smith Squat", "Bodyweight Squat (slow)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["Romanian Deadlift (light)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Standing Calf Raise", repRange: "12-15", alternatives: ["Seated Calf Raise", "Leg Press Calf Press", "Single-Leg Calf Raise"] }
    ],
    [
      { name: "Hack Squat Machine", repRange: "6-10", alternatives: ["Leg Press", "Goblet Squat", "Smith Squat"] },
      { name: "Romanian Deadlift (DB)", repRange: "8-12", alternatives: ["Hamstring Curl", "Good Morning (light)", "Hip Hinge with KB"] },
      { name: "Walking Lunges", repRange: "10-12", alternatives: ["Split Squat", "Step-Ups", "Leg Press (higher reps)"] },
      { name: "Seated Calf Raise", repRange: "12-15", alternatives: ["Standing Calf Raise", "Single-Leg Calf Raise", "Leg Press Calf Press"] }
    ],
    [
      { name: "Smith Squat (light)", repRange: "8-12", alternatives: ["Leg Press", "Goblet Squat", "Hack Squat"] },
      { name: "Leg Extension", repRange: "10-12", alternatives: ["Split Squat", "Step-Ups", "Goblet Squat (slow)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["RDL (DB)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Calf Raises (any)", repRange: "12-15", alternatives: ["Standing Calf Raise", "Seated Calf Raise", "Single-Leg Calf Raise"] }
    ]
  ],
  upper: [
    [
      { name: "Chest Press", repRange: "8-12", alternatives: ["Bench Press", "DB Bench Press", "Push-Ups"] },
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "High Row Machine", "Band Pull-Downs"] },
      { name: "Seated Dumbbell Shoulder Press", repRange: "8-12", alternatives: ["Machine Shoulder Press", "Arnold Press", "Landmine Press"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Machine Row", "DB Row"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Chest Press Machine", "Bench Press", "Push-Ups"] },
      { name: "High Row Machine", repRange: "8-12", alternatives: ["Lat Pulldown", "Assisted Pull-Ups", "Band Pull-Downs"] },
      { name: "Lateral Raises", repRange: "12-15", alternatives: ["Cable Lateral Raise", "Machine Lateral Raise", "Lean-Away DB Raise"] },
      { name: "Chest-Supported Row", repRange: "8-12", alternatives: ["Seated Row", "Machine Row", "DB Row"] }
    ]
  ],
  lower: [
    [
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat", "Smith Squat (light)"] },
      { name: "Hamstring Curl", repRange: "10-12", alternatives: ["RDL (DB)", "Glute Bridge", "Swiss Ball Curl"] },
      { name: "Split Squat", repRange: "8-12", alternatives: ["Lunges", "Step-Ups", "Leg Press (higher reps)"] },
      { name: "Calf Raise", repRange: "12-15", alternatives: ["Seated Calf Raise", "Standing Calf Raise", "Single-Leg Calf Raise"] }
    ],
    [
      { name: "Hack Squat Machine", repRange: "6-10", alternatives: ["Leg Press", "Goblet Squat", "Smith Squat"] },
      { name: "Romanian Deadlift (DB)", repRange: "8-12", alternatives: ["Hamstring Curl", "Hip Hinge (KB)", "Glute Bridge"] },
      { name: "Leg Extension", repRange: "10-12", alternatives: ["Step-Ups", "Split Squat", "Goblet Squat (slow)"] },
      { name: "Seated Calf Raise", repRange: "12-15", alternatives: ["Standing Calf Raise", "Single-Leg Calf Raise", "Leg Press Calf Press"] }
    ]
  ],
  arms: [
    [
      { name: "EZ-Bar Curl", repRange: "8-12", alternatives: ["DB Curl", "Cable Curl", "Hammer Curl"] },
      { name: "Hammer Curl", repRange: "10-12", alternatives: ["Incline DB Curl", "Cable Curl", "DB Curl"] },
      { name: "Cable Tricep Pushdown", repRange: "10-12", alternatives: ["Rope Pushdown", "Dips (assisted)", "Close-Grip Push-Ups"] },
      { name: "Overhead Tricep Extension", repRange: "10-12", alternatives: ["Cable OH Extension", "Skull Crushers", "Tricep Pushdown"] }
    ],
    [
      { name: "Incline Dumbbell Curl", repRange: "10-12", alternatives: ["DB Curl", "Cable Curl", "EZ-Bar Curl"] },
      { name: "Cable Curl", repRange: "10-12", alternatives: ["DB Curl", "EZ-Bar Curl", "Hammer Curl"] },
      { name: "Skull Crushers (light)", repRange: "8-12", alternatives: ["Overhead Extension", "Cable Pushdown", "Close-Grip Push-Ups"] },
      { name: "Rope Pushdown", repRange: "10-12", alternatives: ["Cable Pushdown", "Dips (assisted)", "Overhead Extension"] }
    ]
  ],
  full: [
    [
      { name: "Chest Press", repRange: "8-12", alternatives: ["DB Bench Press", "Bench Press", "Push-Ups"] },
      { name: "Lat Pulldown", repRange: "8-12", alternatives: ["Assisted Pull-Ups", "High Row Machine", "Band Pull-Downs"] },
      { name: "Leg Press", repRange: "8-12", alternatives: ["Goblet Squat", "Hack Squat", "Smith Squat (light)"] },
      { name: "Plank", repRange: "30-60", alternatives: ["Dead Bug", "Pallof Press", "Side Plank"] }
    ],
    [
      { name: "Dumbbell Bench Press", repRange: "8-12", alternatives: ["Chest Press Machine", "Bench Press", "Push-Ups"] },
      { name: "Seated Cable Row", repRange: "8-12", alternatives: ["Chest-Supported Row", "Machine Row", "DB Row"] },
      { name: "Goblet Squat", repRange: "8-12", alternatives: ["Leg Press", "Smith Squat", "Bodyweight Squat"] },
      { name: "Dead Bug", repRange: "10-12", alternatives: ["Plank", "Pallof Press", "Bird Dog"] }
    ]
  ]
};

// ---------- Injury rules
const INJURY_RULES = {
  none: { label: "None", avoid: [], swap: {}, warmup: [], recovery: [] },

  shoulder: {
    label: "Shoulder",
    avoid: ["bench", "press", "overhead", "fly", "dip"],
    swap: {
      "barbell bench press": "Machine Chest Press",
      "dumbbell bench press": "Machine Chest Press",
      "seated dumbbell shoulder press": "Landmine Press",
      "arnold press": "Landmine Press",
      "cable fly": "Pec Deck (light)",
      "tricep dips (assisted)": "Cable Tricep Pushdown"
    },
    warmup: [
      "Band external rotations: 2×12",
      "Scapular wall slides: 2×8",
      "Band pull-aparts: 2×12",
      "1–2 light ramp-up sets on first press"
    ],
    recovery: [
      "Band external rotation: 3×12",
      "Face pulls (light): 3×12",
      "Serratus wall slides: 2×8",
      "Easy incline walk: 10–15 min"
    ]
  },

  elbow: {
    label: "Elbow",
    avoid: ["curl", "extension", "skull", "dip"],
    swap: {
      "ez-bar curl": "Cable Curl (light)",
      "skull crushers (light)": "Rope Pushdown (light)",
      "overhead tricep extension": "Cable Tricep Pushdown (light)"
    },
    warmup: [
      "Wrist flexor/extensor warm-up: 1–2 min each",
      "Very light curls: 1×15",
      "Tricep pushdowns (light): 1×15"
    ],
    recovery: [
      "Light band curls: 2×20",
      "Light band pushdowns: 2×20",
      "Forearm stretching: 2×30 sec each"
    ]
  },

  wrist: {
    label: "Wrist",
    avoid: ["push-up", "bench", "curl", "press"],
    swap: {
      "push-ups": "Machine Chest Press",
      "dumbbell curl": "Cable Curl (neutral grip if possible)",
      "dumbbell bench press": "Machine Chest Press"
    },
    warmup: [
      "Wrist circles: 60 sec",
      "Forearm extensor stretch: 2×20 sec",
      "Neutral-grip warm-up sets where possible"
    ],
    recovery: [
      "Light grip work (pain-free): 2×20 sec",
      "Forearm mobility: 5 min",
      "Easy bike: 10–15 min"
    ]
  },

  lowback: {
    label: "Lower back",
    avoid: ["deadlift", "rdl", "good morning", "row (unsupported)"],
    swap: {
      "romanian deadlift (db)": "Hamstring Curl",
      "one-arm dumbbell row": "Chest-Supported Row"
    },
    warmup: [
      "Cat-cow: 6 reps",
      "Hip hinge drill (bodyweight): 8 reps",
      "Glute bridge: 2×10",
      "Light ramp-up sets on legs"
    ],
    recovery: [
      "McGill curl-up (gentle): 2×6",
      "Side plank (short holds): 2×20 sec",
      "Bird dog: 2×6/side",
      "Easy walk: 10–20 min"
    ]
  },

  knee: {
    label: "Knee",
    avoid: ["lunge", "split squat", "deep squat"],
    swap: {
      "walking lunges": "Leg Press (shorter range)",
      "split squat": "Leg Press (shorter range)",
      "goblet squat": "Leg Press"
    },
    warmup: [
      "Quad activation (TKE band): 2×12",
      "Glute bridges: 2×10",
      "Bodyweight squat to a box: 2×6 (pain-free)"
    ],
    recovery: [
      "TKE band: 3×12",
      "Step-ups (very low box): 2×8/side",
      "Bike (easy): 10–15 min"
    ]
  },

  ankle: {
    label: "Ankle",
    avoid: ["lunge", "jump", "calf raise (heavy)"],
    swap: {
      "walking lunges": "Leg Press",
      "standing calf raise": "Seated Calf Raise (light)"
    },
    warmup: [
      "Ankle circles: 60 sec",
      "Calf stretch: 2×20 sec",
      "Tibialis raises (light): 2×12"
    ],
    recovery: [
      "Ankle dorsiflexion rocks: 2×10",
      "Seated calf raises (light): 2×15",
      "Easy bike: 10–15 min"
    ]
  },

  hip: {
    label: "Hip",
    avoid: ["deep squat", "lunge"],
    swap: {
      "walking lunges": "Hamstring Curl",
      "split squat": "Leg Press (shorter range)"
    },
    warmup: [
      "Hip flexor stretch: 2×20 sec",
      "Glute bridge: 2×10",
      "Side-lying clamshell: 2×12"
    ],
    recovery: [
      "Clamshell: 3×12",
      "Glute bridge (easy): 3×10",
      "Easy walk: 10–20 min"
    ]
  },

  neck: {
    label: "Neck",
    avoid: ["shrug", "heavy overhead"],
    swap: {
      "seated dumbbell shoulder press": "Landmine Press",
      "arnold press": "Machine Shoulder Press (light)"
    },
    warmup: [
      "Chin tucks: 2×8",
      "Neck mobility (gentle): 60 sec",
      "Band pull-aparts: 2×12"
    ],
    recovery: [
      "Chin tucks: 3×8",
      "Thoracic extension (gentle): 2×6",
      "Easy walk: 10–20 min"
    ]
  },

  cardio: {
    label: "Low cardio tolerance",
    avoid: [],
    swap: {},
    warmup: [
      "2–4 min easy bike or incline walk",
      "Nasal-breathing pace: keep it easy",
      "Use longer rest if needed"
    ],
    recovery: [
      "Easy bike or walk: 10–15 min",
      "Breathing: 2 min slow exhales"
    ]
  }
};

// ---------- DOM helpers
const $ = (id) => document.getElementById(id);

// Core elements
const form = $("workoutForm");
const outputEl = $("output");
const historyEl = $("history");
const prsEl = $("prs");
const statusEl = $("status");
const rotationHintEl = $("rotationHint");

// Controls
const resetRotationBtn = $("resetRotationBtn");
const clearAllBtn = $("clearAllBtn");
const exportBtn = $("exportBtn");
const importFile = $("importFile");
const setsModeEl = $("setsMode");
const customSetsEl = $("customSets");
const injuryProfileEl = $("injuryProfile");
const intensityModeEl = $("intensityMode");

// Chips
const rotationChip = $("rotationChip");
const variationChip = $("variationChip");

// Chat
const chatLogEl = $("chatLog");
const chatInputEl = $("chatInput");
const chatSendBtn = $("chatSendBtn");
const chatModeBadge = $("chatModeBadge");
const quickPromptsEl = $("quickPrompts");

// ---------- Utility
function setStatus(message = "", type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getDayIndex() {
  const v = Number(localStorage.getItem(STORE.dayIndex));
  return Number.isFinite(v) && v >= 0 ? v : 0;
}

function setDayIndex(v) {
  localStorage.setItem(STORE.dayIndex, String(v));
}

function nowISO() {
  return new Date().toISOString();
}

function prettyDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function uid() {
  return `w_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function sanitizeNumberOrNull(raw) {
  if (raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function isValidDays(d) {
  return Number.isFinite(d) && d >= 1 && d <= 6;
}

function isValidTime(t) {
  return Number.isFinite(t) && t >= 20 && t <= 180;
}

function setsForTime(minutes) {
  if (minutes <= 30) return 2;
  if (minutes <= 45) return 3;
  return 4;
}

// ---------- Variation rotation per split
function getSplitVarIndexMap() {
  const m = readJSON(STORE.splitVarIndex, {});
  return (m && typeof m === "object") ? m : {};
}

function setSplitVarIndexMap(map) {
  writeJSON(STORE.splitVarIndex, map);
}

function pickVariation(split) {
  const variations = LIB[split] || [];
  if (variations.length === 0) return { variationIndex: 0, session: [] };

  const map = getSplitVarIndexMap();
  const idx = Number(map[split] ?? 0);
  const session = variations[idx % variations.length];

  map[split] = idx + 1;
  setSplitVarIndexMap(map);

  return { variationIndex: idx % variations.length, session };
}

// ---------- Rotation hint + chip
function renderRotationHint(days) {
  const cycle = getSplit(days);
  const idx = getDayIndex();
  const nextSplit = cycle[idx % cycle.length];
  const variations = LIB[nextSplit]?.length ?? 1;

  if (rotationHintEl) {
    rotationHintEl.textContent = `Next in rotation: ${nextSplit.toUpperCase()} (has ${variations} workout variations)`;
  }
  if (rotationChip) {
    rotationChip.textContent = `Rotation: Day ${idx + 1}`;
  }
}

// ---------- Injury logic
function buildActiveRecoverySession(injuryKey) {
  const rules = INJURY_RULES[injuryKey] || INJURY_RULES.none;
  const recovery = (rules.recovery && rules.recovery.length)
    ? rules.recovery
    : ["Easy walk: 10–20 min", "Gentle mobility: 8–10 min", "Light core: 2 movements"];

  return recovery.map(item => ({
    name: item,
    repRange: "easy",
    alternatives: ["If anything hurts, skip it and do easy walking instead."]
  }));
}

function applyInjurySwaps(session, injuryKey, intensityMode) {
  const rules = INJURY_RULES[injuryKey] || INJURY_RULES.none;

  if (intensityMode === "recovery") {
    return { mode: "recovery", session: buildActiveRecoverySession(injuryKey) };
  }

  const swapMap = rules.swap || {};
  const avoidTokens = rules.avoid || [];
  const cautious = intensityMode === "cautious";

  const out = session.map(ex => {
    const n = String(ex.name).toLowerCase();
    const directSwap = swapMap[n];
    const isAvoid = avoidTokens.some(tok => n.includes(tok));

    if (directSwap) {
      return {
        ...ex,
        name: directSwap,
        repRange: cautious ? "10-12" : ex.repRange,
        alternatives: [...new Set([...(ex.alternatives || []), ex.name])]
      };
    }

    if (cautious && isAvoid) {
      const alt = (ex.alternatives && ex.alternatives.length > 0) ? ex.alternatives[0] : ex.name;
      return {
        ...ex,
        name: alt,
        repRange: "10-12",
        alternatives: [...new Set([...(ex.alternatives || []), ex.name])]
      };
    }

    return ex;
  });

  return { mode: "normal", session: out };
}

// ---------- Warm-up planner
function warmupPlan(split, injuryKey) {
  const base = [
    "2–4 min easy bike or incline walk",
    "Dynamic mobility: 3–4 min (controlled range)",
    "2 ramp-up sets for your first lift (light → moderate)"
  ];

  const splitPlans = {
    push: ["Band pull-aparts: 2×12", "Scapular push-ups: 2×8", "Light press warm-up: 1×12"],
    pull: ["Band rows: 2×12", "Shoulder external rotation (light): 2×10", "Scapular retractions: 2×8"],
    legs: ["Glute bridges: 2×10", "Bodyweight squat to box: 2×6", "Hip hinge drill: 8 reps"],
    upper: ["Band pull-aparts: 2×12", "Light push + pull warm-up sets", "Thoracic extension (gentle): 2×6"],
    lower: ["Glute bridges: 2×10", "Bodyweight squat: 2×6", "Calf pumps: 20 reps"],
    arms: ["Light curls: 1×15", "Light pushdowns: 1×15", "Shoulder circles: 60 sec"],
    full: ["Glute bridges: 2×10", "Band pull-aparts: 2×12", "Bodyweight squat: 2×6"]
  };

  const injury = (INJURY_RULES[injuryKey]?.warmup || []);
  const plan = [...base, ...(splitPlans[split] || []), ...injury];

  const seen = new Set();
  return plan.filter(x => (seen.has(x) ? false : (seen.add(x), true)));
}

// =======================
// Generate Workout
// =======================
if (setsModeEl && customSetsEl) {
  setsModeEl.addEventListener("change", () => {
    customSetsEl.disabled = (setsModeEl.value !== "custom");
  });
}

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    setStatus("");

    const days = Number($("days")?.value);
    const time = Number($("time")?.value);

    if (!isValidDays(days)) {
      setStatus("Days per week must be between 1 and 6.", "err");
      return;
    }
    if (!isValidTime(time)) {
      setStatus("Time must be at least 20 minutes (max 180).", "err");
      return;
    }

    // sets
    let sets = setsForTime(time);
    if (setsModeEl?.value === "custom") {
      const cs = Number(customSetsEl.value);
      if (!Number.isFinite(cs) || cs < 1 || cs > 6) {
        setStatus("Custom sets must be between 1 and 6.", "err");
        return;
      }
      sets = cs;
    }

    // split selection based on rotation
    const cycle = getSplit(days);
    const dayIndex = getDayIndex();
    const split = cycle[dayIndex % cycle.length];

    // advance day rotation
    setDayIndex(dayIndex + 1);
    renderRotationHint(days);

    // variation selection
    const workoutId = uid();
    const { variationIndex, session } = pickVariation(split);

    if (variationChip) {
      variationChip.textContent = `Variation: ${variationIndex + 1}`;
    }

    // injury aware swap or recovery mode
    const injuryKey = injuryProfileEl?.value || "none";
    const intensityMode = intensityModeEl?.value || "normal";
    const swapped = applyInjurySwaps(session, injuryKey, intensityMode);
    const finalSession = swapped.session;

    const warmup = warmupPlan(split, injuryKey);
    const injuryLabel = INJURY_RULES[injuryKey]?.label || "None";

    const headerSuffix =
      swapped.mode === "recovery"
        ? ` • Active Recovery (${injuryLabel})`
        : ` • Variation ${variationIndex + 1}`;

    // render workout
    outputEl.innerHTML = `
      <h2>Today's Workout (${escapeHtml(split).toUpperCase()}${escapeHtml(headerSuffix)})</h2>

      <div class="kv">
        <span>Sets: ${sets}</span>
        <span>Injury: ${escapeHtml(injuryLabel)}</span>
        <span>Mode: ${escapeHtml(intensityMode)}</span>
      </div>

      <div class="warmupGrid">
        <div class="warmupItem">
          <strong>Warm-up (5–10 minutes)</strong>
          <div class="mini">Do this before your first working set to reduce injury risk.</div>
          <ul class="altList">
            ${warmup.map(w => `<li>${escapeHtml(w)}</li>`).join("")}
          </ul>
        </div>
      </div>

      <p class="mini">
        Enter weight + reps for at least one exercise, then Complete Workout.
        Use “Show alternatives” if equipment is busy.
      </p>

      <div id="exerciseList"></div>

      <div class="row">
        <button type="button" id="completeBtn">Complete Workout</button>
        <button type="button" id="clearWorkoutBtn" class="secondary">Clear</button>
      </div>
    `;

    const list = $("exerciseList");
    if (!list) {
      setStatus("Internal error: exercise list container missing.", "err");
      return;
    }

    list.innerHTML = finalSession.map((ex, i) => {
      const rest = restForRepRange(ex.repRange);
      const repText = ex.repRange === "easy" ? "easy effort" : `${escapeHtml(ex.repRange)} reps`;
      const restText = ex.repRange === "easy" ? "as needed" : escapeHtml(rest.rest);

      return `
        <div class="exercise" data-name="${escapeHtml(ex.name)}" data-reprange="${escapeHtml(ex.repRange)}" data-i="${i}">
          <div class="exercise-title">
            <div>
              <strong>${escapeHtml(ex.name)}</strong><br>
              <small>${sets} sets × <strong>${repText}</strong></small>
            </div>
            <small>Rest: <strong>${restText}</strong></small>
          </div>

          <div class="mini">Tip: ${escapeHtml(rest.note || (ex.repRange === "easy" ? "Keep it pain-free." : "Focus on clean reps."))}</div>

          <div class="inputs">
            <label>
              Weight (lbs)
              <input type="number" min="0" step="0.5" inputmode="decimal" data-weight />
            </label>
            <label>
              Reps
              <input type="number" min="0" step="1" inputmode="numeric" data-reps />
            </label>
          </div>

          <div class="row">
            <button type="button" class="secondary" data-toggle-alt="${i}">Show alternatives</button>
          </div>

          <div class="details" id="alt_${i}" style="display:none;">
            <strong>Alternatives:</strong>
            <ul class="altList">
              ${(ex.alternatives || []).map(a => `<li>${escapeHtml(a)}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    }).join("");

    // toggle alternatives
    list.querySelectorAll("[data-toggle-alt]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = btn.getAttribute("data-toggle-alt");
        const box = $("alt_" + i);
        if (!box) return;

        const isOpen = box.style.display !== "none";
        box.style.display = isOpen ? "none" : "block";
        btn.textContent = isOpen ? "Show alternatives" : "Hide alternatives";
      });
    });

    // Complete Workout
    $("completeBtn")?.addEventListener("click", () => {
      completeWorkout({ id: workoutId, split, sets, variationIndex });
    });

    // Clear current (not saved)
    $("clearWorkoutBtn")?.addEventListener("click", () => {
      outputEl.innerHTML = "";
      setStatus("Workout cleared (not completed).", "ok");
    });

    setStatus("Workout generated. Rotation + variation advanced.", "ok");
  });
}

// =======================
// Complete Workout (save + PR update) — renamed from save
// =======================
function completeWorkout({ id, split, sets, variationIndex }) {
  setStatus("");

  const cards = Array.from(document.querySelectorAll(".exercise"));
  if (cards.length === 0) {
    setStatus("No workout to complete. Generate a workout first.", "err");
    return;
  }

  const history = readJSON(STORE.history, []);
  const prs = readJSON(STORE.prs, {});
  const exercises = [];

  let hasAnyEntry = false;
  const prHits = [];

  for (const card of cards) {
    const name = card.getAttribute("data-name") || "Exercise";
    const repRange = card.getAttribute("data-reprange") || "8-12";

    const wRaw = card.querySelector("[data-weight]")?.value ?? "";
    const rRaw = card.querySelector("[data-reps]")?.value ?? "";

    const weight = sanitizeNumberOrNull(wRaw);
    const reps = sanitizeNumberOrNull(rRaw);

    const hasWeight = weight !== null;
    const hasReps = reps !== null;

    if (hasWeight || hasReps) hasAnyEntry = true;

    exercises.push({ name, repRange, weight, reps, sets });

    // PR update requires both weight + reps
    if (hasWeight && hasReps) {
      const current = prs[name];
      const candidate = { weight, reps, achievedAt: nowISO() };

      const isBetter =
        !current ||
        candidate.weight > current.weight ||
        (candidate.weight === current.weight && candidate.reps > current.reps);

      if (isBetter) {
        prHits.push({ name, old: current || null, next: candidate });
        prs[name] = candidate;
      }
    }
  }

  if (!hasAnyEntry) {
    setStatus("Enter weight/reps for at least one exercise before completing.", "err");
    return;
  }

  const workout = {
    id,
    createdAt: nowISO(),
    split,
    variationIndex,
    sets,
    exercises
  };

  history.unshift(workout);

  writeJSON(STORE.history, history);
  writeJSON(STORE.prs, prs);

  renderHistory();
  renderPRs();

  if (prHits.length > 0) {
    setStatus("Completed. PRs updated—nice work.", "ok");
    alert(buildPRCongrats(prHits));
  } else {
    setStatus("Completed. History and PRs updated.", "ok");
  }

  // Optional: clear the current workout UI after completion
  // (Keeping as-is: we do NOT auto-clear unless you ask.)
}

function buildPRCongrats(prHits) {
  const lines = prHits.slice(0, 4).map(hit => {
    const oldTxt = hit.old ? `${hit.old.weight} lbs × ${hit.old.reps}` : "First record!";
    const newTxt = `${hit.next.weight} lbs × ${hit.next.reps}`;
    return `• ${hit.name}: ${oldTxt} → ${newTxt}`;
  });
  const more = prHits.length > 4 ? `\n(+${prHits.length - 4} more PRs)` : "";
  return `PR HIT. CONGRATS.\n\n${lines.join("\n")}${more}\n\nKeep going—small wins compound.`;
}

// =======================
// History
// =======================
function renderHistory() {
  if (!historyEl) return;

  const history = readJSON(STORE.history, []);
  if (!Array.isArray(history) || history.length === 0) {
    historyEl.innerHTML = `<p class="mini">No workouts completed yet.</p>`;
    return;
  }

  historyEl.innerHTML = history.map((w) => {
    const lines = (w.exercises || []).map(ex => {
      const wt = ex.weight === null ? "—" : `${ex.weight} lbs`;
      const rp = ex.reps === null ? "—" : `${ex.reps} reps`;
      const rest = restForRepRange(ex.repRange);
      const restTxt = ex.repRange === "easy" ? "as needed" : rest.rest;
      return `${escapeHtml(ex.name)}: ${wt} × ${rp} (${ex.sets} sets) • Rest ${escapeHtml(restTxt)}`;
    }).join("<br>");

    return `
      <div class="history-item">
        <div class="row space-between">
          <div>
            <strong>${prettyDate(w.createdAt)}</strong> — ${escapeHtml(w.split).toUpperCase()}
            <div class="mini">Variation: ${Number(w.variationIndex ?? 0) + 1} • Workout ID: ${escapeHtml(w.id)}</div>
          </div>
          <button class="secondary danger" data-del="${escapeHtml(w.id)}" type="button">Delete</button>
        </div>
        <hr class="sep" />
        <div class="mini">${lines}</div>
      </div>
    `;
  }).join("");

  historyEl.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      deleteWorkout(id);
    });
  });
}

function deleteWorkout(id) {
  const history = readJSON(STORE.history, []);
  const next = history.filter(w => w.id !== id);
  writeJSON(STORE.history, next);
  renderHistory();
  setStatus("Workout deleted. (PRs are not recalculated automatically.)", "ok");
}

// =======================
// PRs
// =======================
function renderPRs() {
  if (!prsEl) return;

  const prs = readJSON(STORE.prs, {});
  const keys = Object.keys(prs);

  if (keys.length === 0) {
    prsEl.innerHTML = `<p class="mini">No PRs yet. Complete workouts with weight + reps.</p>`;
    return;
  }

  keys.sort((a, b) => a.localeCompare(b));

  prsEl.innerHTML = keys.map((name) => {
    const pr = prs[name];
    const when = pr.achievedAt ? ` • ${prettyDate(pr.achievedAt)}` : "";
    return `
      <div class="pr-item">
        <strong>${escapeHtml(name)}</strong><br />
        Best: ${pr.weight} lbs × ${pr.reps} reps${escapeHtml(when)}
      </div>
    `;
  }).join("");
}

// =======================
// Reset rotation / Clear All
// =======================
resetRotationBtn?.addEventListener("click", () => {
  setDayIndex(0);
  renderRotationHint(Number($("days")?.value) || 3);
  setStatus("Rotation reset to the start.", "ok");
});

clearAllBtn?.addEventListener("click", () => {
  const ok = confirm("This will delete ALL FirstRep history, PRs, rotation, variations, and chat. Continue?");
  if (!ok) return;

  Object.values(STORE).forEach(k => localStorage.removeItem(k));
  if (outputEl) outputEl.innerHTML = "";

  renderHistory();
  renderPRs();
  renderChat();
  renderRotationHint(Number($("days")?.value) || 3);

  if (variationChip) variationChip.textContent = "Variation: Ready";
  if (rotationChip) rotationChip.textContent = "Rotation: Ready";

  setStatus("All data cleared.", "ok");
});

// =======================
// Export / Import
// =======================
exportBtn?.addEventListener("click", () => {
  const payload = {
    version: "firstrep-v3plus",
    exportedAt: nowISO(),
    dayIndex: getDayIndex(),
    splitVarIndex: readJSON(STORE.splitVarIndex, {}),
    history: readJSON(STORE.history, []),
    prs: readJSON(STORE.prs, {}),
    chat: readJSON(STORE.chat, [])
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "firstrep-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
  setStatus("Export downloaded.", "ok");
});

importFile?.addEventListener("change", async (e) => {
  setStatus("");
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (typeof data.dayIndex === "number") setDayIndex(data.dayIndex);
    if (data.splitVarIndex && typeof data.splitVarIndex === "object") writeJSON(STORE.splitVarIndex, data.splitVarIndex);
    if (Array.isArray(data.history)) writeJSON(STORE.history, data.history);
    if (data.prs && typeof data.prs === "object") writeJSON(STORE.prs, data.prs);
    if (Array.isArray(data.chat)) writeJSON(STORE.chat, data.chat);

    renderHistory();
    renderPRs();
    renderChat();

    const days = Number($("days")?.value) || 3;
    renderRotationHint(days);

    setStatus("Import complete.", "ok");
  } catch {
    setStatus("Import failed. Please upload a valid firstrep-export.json file.", "err");
  } finally {
    e.target.value = "";
  }
});

// =======================
// Chat (Offline Coach + Quick Prompts)
// =======================
const QUICK_PROMPTS = [
  "What muscles does lat pulldown work?",
  "Give me form cues for goblet squats.",
  "What should my rest time be for 8–10 reps?",
  "I have shoulder pain—what should I avoid?",
  "Give me a 10-min stretching routine.",
  "Beginner diet basics for fat loss.",
  "Cardio: zone 2 vs intervals—what should I do?",
  "How do I warm up for leg day?"
];

const MUSCLE_MAP = [
  { key: "lat pulldown", muscles: "Lats, upper back, biceps" },
  { key: "seated cable row", muscles: "Mid-back (rhomboids), lats, biceps" },
  { key: "face pull", muscles: "Rear delts, upper back, rotator cuff" },
  { key: "bench press", muscles: "Chest, triceps, front delts" },
  { key: "shoulder press", muscles: "Delts, triceps, upper chest (secondary)" },
  { key: "goblet squat", muscles: "Quads, glutes, core" },
  { key: "leg press", muscles: "Quads, glutes (hamstrings secondary)" },
  { key: "hamstring curl", muscles: "Hamstrings" },
  { key: "romanian deadlift", muscles: "Hamstrings, glutes, low back (secondary)" },
  { key: "lunge", muscles: "Quads, glutes, adductors" },
  { key: "curl", muscles: "Biceps, forearms" },
  { key: "tricep pushdown", muscles: "Triceps" },
  { key: "plank", muscles: "Core: abs, obliques, deep stabilizers" }
];

function findMuscles(text) {
  const t = text.toLowerCase();
  const hit = MUSCLE_MAP.find(m => t.includes(m.key));
  return hit ? hit.muscles : null;
}

function getChat() {
  const arr = readJSON(STORE.chat, []);
  return Array.isArray(arr) ? arr : [];
}

function setChat(arr) {
  writeJSON(STORE.chat, arr);
}

function addChatMsg(role, text) {
  const chat = getChat();
  chat.push({ id: uid(), at: nowISO(), role, text });
  setChat(chat);
  renderChat(true);
}

function renderChat(scrollToBottom = false) {
  if (!chatLogEl) return;

  const chat = getChat();
  if (chat.length === 0) {
    chatLogEl.innerHTML = `<div class="mini muted">No messages yet.</div>`;
    return;
  }

  chatLogEl.innerHTML = chat.map(m => `
    <div class="chatMsg ${m.role === "user" ? "user" : "bot"}">
      <div class="who">${m.role === "user" ? "You" : "Coach"}</div>
      <div class="txt">${escapeHtml(m.text)}</div>
      <div class="mini muted">${prettyDate(m.at)}</div>
    </div>
  `).join("");

  if (scrollToBottom) chatLogEl.scrollTop = chatLogEl.scrollHeight;
}

function renderQuickPrompts() {
  if (!quickPromptsEl) return;

  quickPromptsEl.innerHTML = QUICK_PROMPTS
    .map(p => `<span class="qp" data-q="${escapeHtml(p)}">${escapeHtml(p)}</span>`)
    .join("");

  quickPromptsEl.querySelectorAll("[data-q]").forEach(el => {
    el.addEventListener("click", () => {
      const q = el.getAttribute("data-q");
      if (!q || !chatInputEl) return;
      chatInputEl.value = q;
      chatInputEl.focus();
    });
  });
}

function offlineCoach(q) {
  const text = q.toLowerCase();

  // high-signal safety
  if (text.includes("sharp pain") || text.includes("numb") || text.includes("tingle")) {
    return [
      "If you have sharp pain, numbness, or tingling:",
      "• Stop that movement immediately.",
      "• Switch to a pain-free alternative and reduce load.",
      "• If symptoms persist, consider evaluation by a qualified clinician.",
      "",
      "Tell me the exercise + where it hurts and I’ll suggest safer swaps."
    ].join("\n");
  }

  // muscles worked
  if (text.includes("what muscles") || text.includes("muscles does") || text.includes("targets")) {
    const m = findMuscles(text);
    if (m) return `Muscles worked: ${m}\n\nIf you tell me your equipment options, I can suggest alternatives too.`;
    return "Tell me the exercise name and I’ll map the primary + secondary muscles.";
  }

  // rest
  if (text.includes("rest") || text.includes("how long")) {
    return [
      "Rest guidance:",
      "• 1–5 reps: 3–5 min",
      "• 6–10 reps: 2–3 min",
      "• 10–12 reps: 1–2 min",
      "• 12–20 reps: 45–90 sec",
      "",
      "If your last set was near-failure, use the high end."
    ].join("\n");
  }

  // warmup
  if (text.includes("warm up") || text.includes("warmup")) {
    return [
      "Quick warm-up template (5–10 min):",
      "1) 2–4 min easy cardio",
      "2) Dynamic mobility (hips/shoulders depending on day)",
      "3) 2 ramp-up sets on your first lift (light → moderate)",
      "",
      "If you tell me push/pull/legs + any injury, I’ll tailor it."
    ].join("\n");
  }

  // stretching/mobility
  if (text.includes("stretch") || text.includes("mobility")) {
    return [
      "10-minute mobility routine (general):",
      "• Hip flexor stretch: 2×20 sec/side",
      "• Thoracic rotations: 6/side",
      "• Calf stretch: 2×20 sec/side",
      "• Band external rotations (light): 2×10",
      "",
      "Tell me what feels tight (hips/hamstrings/shoulders) and I’ll narrow it."
    ].join("\n");
  }

  // diet basics
  if (text.includes("diet") || text.includes("calorie") || text.includes("protein") || text.includes("cut") || text.includes("bulk")) {
    return [
      "Diet basics (beginner-safe):",
      "• Protein: aim ~0.7–1.0g per lb of goal bodyweight (or start 120–160g/day for many adults).",
      "• Fat loss: small calorie deficit; muscle gain: small surplus.",
      "• Whole foods + fiber help adherence.",
      "",
      "Tell me your goal and I’ll give a simple plan."
    ].join("\n");
  }

  // cardio
  if (text.includes("cardio") || text.includes("zone 2") || text.includes("hiit") || text.includes("interval")) {
    return [
      "Cardio guidelines:",
      "• Zone 2 (easy conversational pace): best base fitness + recovery support.",
      "• Intervals/HIIT: time-efficient but higher fatigue.",
      "",
      "Beginner: 2–3x/week Zone 2 (20–30 min) + optional 0–1 interval day."
    ].join("\n");
  }

  // form cues
  if (text.includes("form") || text.includes("cue") || text.includes("how do i do")) {
    return [
      "Tell me the exercise name and I’ll give:",
      "• setup cues",
      "• execution cues",
      "• common mistakes",
      "• what it should feel like"
    ].join("\n");
  }

  // injury / substitutions
  if (text.includes("injury") || text.includes("hurt") || text.includes("pain") || text.includes("avoid")) {
    return [
      "Training around injury (general):",
      "• Avoid sharp pain and flare-up positions.",
      "• Use stable patterns (machines, supported rows).",
      "• Prefer moderate reps (10–12) and controlled tempo.",
      "",
      "Tell me the body area + movement that hurts and I’ll suggest swaps."
    ].join("\n");
  }

  // progression
  if (text.includes("progress") || text.includes("pr") || text.includes("add weight")) {
    return [
      "Progression options (choose ONE):",
      "1) Add 2.5–5 lb upper / 5–10 lb lower if reps stayed in-range",
      "2) Add 1 rep at same weight",
      "3) Improve form/tempo and keep reps",
      "",
      "Consistency > perfection."
    ].join("\n");
  }

  // fallback: list capabilities
  return [
    "I can help with:",
    "• muscles worked",
    "• form cues",
    "• substitutions",
    "• mobility/stretching",
    "• cardio programming",
    "• diet basics",
    "• injury-aware swaps",
    "• progression advice",
    "",
    "Ask your question with an exercise name if possible."
  ].join("\n");
}

function onChatSend() {
  if (!chatInputEl) return;
  const q = chatInputEl.value.trim();
  if (!q) return;

  chatInputEl.value = "";
  addChatMsg("user", q);

  const answer = offlineCoach(q);
  addChatMsg("bot", answer);
}

chatSendBtn?.addEventListener("click", onChatSend);
chatInputEl?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onChatSend();
});

// =======================
// Init
// =======================
if (chatModeBadge) chatModeBadge.textContent = "Offline Coach";

renderQuickPrompts();
renderChat();
renderHistory();
renderPRs();
renderRotationHint(Number($("days")?.value) || 3);
