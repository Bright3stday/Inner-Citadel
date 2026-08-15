// The Mastery Node authoring prompt (docs/decision-log-and-roadmap.md,
// Mastery Tree / Growth Points skeleton). Copy-paste content only —
// never sent from this app to any API, same rule as
// questGeneratorPrompt.ts. Stored verbatim as the author wrote it; the
// JSON field names below (title/criteria/practiceThreshold/
// thresholdUnit/contributingQuests) match
// storage/masteryNodeDraftImport.ts exactly — if either side's field
// names ever change, the other must change with it.

export const MASTERY_NODE_PROMPT = `You are helping me author mastery nodes for one domain in a personal practice app called Inner Citadel.

Context you need about how this works:
- A domain is a real area I'm building capability in (Fitness, Reading, Photography, etc.).
- Quests are recurring practice — a target quantity over a day or week, logged manually.
- Mastery nodes sit above quests. Each node is a real capability I'm working toward. Logging contributing quests accumulates toward a node's practice threshold; once met the node becomes eligible, and I then deliberately confirm I've genuinely met its criteria before unlocking it.
- Practice history earns the right to claim a node. It never makes the claim for me. The app never parses or judges the criteria — I do.

STEP 1 — INTERVIEW ME
Ask one or two questions at a time, conversationally. Skip anything I've already answered. Stop once you can calibrate.
1. Which domain, and what capability am I actually trying to build in it — in my own words, not a tidy goal statement?
2. Paste of my current quests for this domain (title, target, window). Thresholds are counted in completions of these, so you need to know what exists.
3. When did I last engage with this domain seriously, and how often? What currently feels easy, and what feels out of reach?
4. Is there a specific thing I want to be able to do that I can't do now? What would make it obvious to me — not to anyone else — that I could?
5. Is progress here something I can see quickly (physical training, memorisation) or slow and ambiguous (judgment, creative work, taste)?
Do not ask me to self-rate as beginner/intermediate/advanced. Infer where I am from the answers.

STEP 2 — EXPLAIN YOUR REASONING, THEN WAIT
Before any JSON, give me a short summary: the capability arc you've laid out and why, how you set each threshold, which nodes you deliberately made small, and anything you're unsure about. Then stop and wait for my go-ahead. If I push back, adjust and re-summarise.

DESIGN RULES
1. A node is a capability, not an activity. "Read 20 pages" is a quest. "Can hold the argument of a chapter in my head well enough to summarise it unprompted" is a node. If it reads like something I do rather than something I can do, it's a quest.
2. Narrow enough to be recognisable. "Get better at photography" isn't a node — nothing would tell me I'd arrived. Decompose the way a coach would: one specific, practiceable element per node.
3. Criteria must be self-confirmable, and honest. I confirm these myself, so they can't require an external judge — but they also can't be so vague I could talk myself into any of them on a good day. Prefer a concrete demonstration or a recognisable felt shift ("I do X without consciously thinking about Y", "I can produce Z on request, not by luck") over a number that only re-measures the practice.
4. For slow/tacit domains, don't fake objectivity. Judgment, taste and creative work resist explicit criteria — a lot of real skill genuinely can't be written down. There, prefer criteria framed as recognition ("I can tell in advance which of these will work"), a produced artifact, or the ability to explain a choice to someone else — not an invented metric.
5. Thresholds set eligibility, not proof. A threshold is "enough practice that claiming this is reasonable," not "this much practice means you've got it." Set it from the quest cadence I pasted, so it's reachable in a sensible stretch of real weeks.
6. The first node must be reachable soon — within a few weeks of ordinary practice. I'm testing whether this system feels like anything, and a first unlock months away tells me nothing. Make node one genuinely modest, even if it feels too easy on paper.
7. Keep the tree small: 3-5 nodes. A short arc with meaningful steps beats a long one with filler. Order them as a progression, but assume no branching or prerequisites — the app supports a flat ordered list.
8. Later nodes shouldn't just be "more of the same." Escalate in kind, not only in volume — from doing the thing, to doing it reliably, to adapting it, to being able to teach or transfer it. Volume-only escalation makes progression feel hollow.
9. Don't invent thresholds that ignore what I told you. If my stated practice cadence can't reach a threshold in reasonable time, lower the threshold or narrow the node.

STEP 3 — OUTPUT
Only after my go-ahead. Its own message, nothing but the JSON array — no preamble, no code fences.

[
  { "title": "string — the capability, not the activity",
    "criteria": "string — how I'll know I've genuinely met it",
    "practiceThreshold": number,
    "thresholdUnit": "quest completions" or "weeks meeting target",
    "contributingQuests": ["exact quest titles from what I pasted"] }
]

contributingQuests is a suggestion — I confirm the actual linking in the app.`
