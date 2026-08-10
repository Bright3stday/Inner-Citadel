# Inner Citadel — MLP Design Specification
*(formerly RPGify Habits — rebrand reflects a shift away from RPG-stat framing toward Stoic, practice-based capability building)*

> **Superseded.** This document is a snapshot of the original design pass and is kept for history, not maintained. For current decisions and roadmap status, see [`decision-log-and-roadmap.md`](./decision-log-and-roadmap.md).

---

## 1. Name & Framing

**Working name:** Inner Citadel, after Marcus Aurelius / Pierre Hadot's reading of the *Meditations* — a fortified inner self built through daily, disciplined practice rather than defended by walls.

**Vision (unchanged from the original brief, restated under the new name):** Inner Citadel is not a habit tracker. It's a capability-building practice tool. Success is not engagement or daily active use — it's the user eventually no longer needing it. Every feature must answer "does this help the user become more capable in real life?" rather than "does this increase engagement?"

**Progression model:** Identity → Intentional Practice → Mastery → A Citadel Built From It. The citadel is not a game avatar to optimize — it's a visual record of what's actually been practiced.

---

## 2. Visual Identity

- 8-bit pixel art retained from the earlier build, but stripped of RPG-vibrant colour.
- Palette: black-and-white / greyscale — calming and reflective rather than game-like.
- Primary visual metaphor: a citadel made of spires, one per domain (see Section 4).

---

## 3. Core Quest Primitive

A single unified primitive replaces the earlier routine/pool/reflective quest split:

**Quest = target quantity + time window (day or week) + one or more valid logging methods.**

- Contributions can be logged on any day within the window; the window's total is cumulative, not a daily pass/fail gate.
- Quests stay visible every day regardless of due status. A subtle visual affordance (greyed out, or showing applicable days/frequency) indicates a quest isn't "due" today — but logging against it early, or banking extra progress toward the week's target, is always allowed and simply adds to the running tally. No separate mechanic is needed for this.
- Quests should be **activity-framed, not count-framed** where possible (e.g. "go for an evening walk," not "10,000 steps"). This avoids the proxy-metric gaming risk observed directly in comparable step-tracking apps, where a countable target got satisfied without the real behavior it was meant to represent.
- Where a domain naturally supports interchangeable ways to hit the same target (e.g. a strength goal fulfillable by push-ups or squats), any combination of valid methods can contribute to the same weekly total. Where it doesn't (e.g. a reading habit), there's a single recurring instance instead — the goal is the habit of reading, not finishing a specific book.
- Inner Citadel does not duplicate tracking that other apps already do well (e.g. native step counting). Manual logging is the default; no auto-sync is in scope for the MLP.

---

## 4. Domain Structure — Spires, Not Stats

Attributes are **not** abstract JRPG stats. Each domain the user actually cares about (e.g. Fitness, Reading, Photography, Knowledge) is its own structure — closer to a branch of a Civilization-style tech tree than a generic stat pool. Quests belong directly to the domain they serve, with no translation layer.

Each domain is visually represented as its own **spire** within the citadel:

- **Scaffolding** — actively under construction; quests contributing to this domain are being worked on.
- **Completed** — the spire stands finished when progress is strong / close to a mastery threshold.
- **Crumbling** — visual decay when the domain has been neglected.

The spire's physical state **is** the status signal — it replaces a standalone colour-coded indicator entirely, so there's one visual system to read, not two. (If physical state alone proves insufficient in real use, a separate indicator can be reinstated or the spire mechanic revamped — this is a deliberate, reversible simplification, not a permanent commitment.)

Deeper detail — proximity to a specific mastery threshold, node-level progress — lives within a domain's own expanded view, not on the citadel skyline itself.

---

## 5. Daily Loop

- **Trigger:** one anchored session per day, tied to a stable routine moment (commute, or before bed) — not a push notification. The moment varies day to day but the ritual is consistent: a mental dump to close the day.
- **Core action:** review and close out the day's quests. Ticking a routine contribution is quick, near-zero friction. No reflection is required for simple logging.
- **Optional:** a short, capped reflection — not a journal, not mandatory.
- **Planning is explicitly not part of the daily session** — see Section 6.
- **Low-energy days:** quests stay visible, nothing is hidden, nothing is penalized. Touching only the easiest routine quests (or none at all) is a fine outcome for a given day; the spire only shows real neglect over time, not a single off day.

---

## 6. Weekly Loop

- Planning happens separately from the daily session, roughly once or twice a week.
- This is where quests get adjusted, added, or retired if they're miscalibrated. Spontaneous mid-week quest changes are allowed if something specific calls for it, but frequent ad-hoc adding is itself a signal — either quests aren't challenging enough, or existing ones aren't being done properly.
- The MLP does not require a formal weekly-planning ritual UI — an informal weekly check-in is sufficient at this stage.

---

## 7. Re-Entry & Neglect Handling (Included in MLP)

If a domain has **zero contributing quests completed across two consecutive weekly planning cycles**, this becomes a prompt for reflection — not a penalty. The question it raises: should this goal, or its difficulty, change? This is scoped at the domain/goal level, not per individual quest — a single quest lapsing isn't the trigger; a whole domain going untouched for two full cycles is.

This mechanic doesn't depend on Mastery Trees or Growth Points (both deferred — see Section 9), so it's cheap to include now: it only needs quest-completion history per domain, which the MLP already tracks by definition.

---

## 8. Onboarding (Placeholder, Not Built in MLP)

Deferred in build order, but not neglected conceptually. Even as the sole user, the first-run experience deserves a deliberate, symbolic moment marking the start of the practice — not a functional onboarding flow (there's no stranger user to walk through mechanics), but something intentional. This is the natural place for the identity anchor — the future self being built toward, and the self being avoided — to get its first concrete moment, rather than remaining pure underlying philosophy. Design this deliberately when it's time, rather than skipping it by default.

---

## 9. Explicitly Deferred (Not in MLP Scope)

- **Mastery Tree depth** — node-level dependencies, self-authored completion criteria beyond a skeleton domain/spire structure.
- **Growth Points** — the event-triggered progression currency (earned via level-up, node unlock, achievement, or streak; spent on eligible nodes). Node cost/scarcity design needs revisiting before build, given a documented risk of point-hoarding when costs aren't differentiated.
- **Formal weekly planning ritual UI** — informal planning is enough for now.
- **AI Quest Generator** — scoped as a future scaffolding tool to help author quests, not a content engine. Not needed for the MLP's small, manually-curated quest set.
- **Sentinel Mode** (doomscrolling detection) — requires native Android APIs (Usage Stats / Accessibility) that a PWA cannot access. This is the *only* MLP-adjacent feature that structurally requires the Android APK; everything else in this spec works as a pure PWA.
- **The Inn / full recovery system** — the 2-week reflection trigger (Section 7) is a lightweight piece of this philosophy included now; the fuller Inn concept (an active recovery hub, not just a passive state) is deferred.

---

## 10. Platform Scope

The entire MLP as specified above is buildable as an offline-first PWA — local storage, no live sync, export/import for backup. No native wrapper is needed unless and until Sentinel Mode is built, at which point a thin native shell (as the earlier Capacitor-based build used) would wrap the same PWA rather than requiring a separate app.

---

## 11. Design Principle Carried Through All of the Above

Every decision above was tested against one question: **does this help the user become more capable in real life, or does it just make the app more engaging?** Where research (practitioner case studies, behavioral literature, direct field observation) supported a mechanic, it's noted inline; where it didn't, the mechanic was simplified or cut for this pass. Real usage — not further research — is what should validate or overturn anything in this document going forward.
