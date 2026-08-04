// The AI Quest Generator prompt (architecture.md §7 extension point).
// Copy-paste content only — never sent from this app to any API. The
// user finalized this text elsewhere; it's embedded verbatim here, not
// authored by this codebase, and should be edited only at their
// direction, not "improved" opportunistically.

export const QUEST_GENERATOR_PROMPT = `You are designing quests for one domain inside a personal practice app called Inner Citadel. This is not a game to optimize — it's a tool for genuine skill and habit development. Quests here need to be **credible**, drawing on how someone who actually knows this domain would structure real practice, not generic filler.

## Step 1 — Interview me

Ask these one or two at a time, conversationally. Don't dump the whole list at once, and don't work through it mechanically — if my first message already answered something, skip it, and stop asking once you have enough to calibrate.

1. What's the domain, and what's pulling you toward it right now?
2. When did you last actually do this, and how often were you doing it then?
3. What currently feels easy in this, and what feels hard or intimidating?
4. Realistically, how much time can you give this in a week? Be honest, not aspirational.
5. What would a meaningful win look like in 3-6 months, in your own words?
6. Any constraints I should know about — equipment, access, physical limits — or anything already in place I should build on rather than replace?

Do not ask me to rate my own skill level ("beginner/intermediate/advanced"). Self-ratings are frequently wrong in both directions. Infer where I actually am from my answers above — especially Q2 and Q3 — and note that "never done it" and "did it regularly two years ago" lead somewhere very different.

**If my answers indicate I've never done this before (or effectively never):** before proposing anything, research how real beginners are actually guided into this specific domain, if you're able to search or browse. Look for established starting points, the first milestone a real instructor or curriculum would set, and common ways beginners overreach early. Ground the quests in what you find rather than a plausible-sounding guess. If you can't search, say so explicitly and ask me to paste in a couple of reputable beginner resources instead of inventing one.

## Step 2 — Explain your reasoning, then wait

Before generating any JSON, give me a short summary — a few sentences, not an essay — covering:
- Where you've placed me in this domain and what in my answers led you there
- How you landed on the specific numbers (targets, windows), especially anything you deliberately set low
- Anything you're uncertain about and would expect to correct after a week or two of real logging

Then stop and wait for my go-ahead. If I push back on a target or a framing, adjust and re-summarize. Do not emit the JSON until I've said to proceed.

## Design rules for every quest you generate

1. **Activity-framed, not count-framed.** Prefer "go for an evening walk" over "hit 10,000 steps." A quest should describe the real action, not an abstracted number that could be satisfied without actually doing the thing.
2. **Don't duplicate what dedicated apps already do well.** No native step-counting, no GPS-tracked routes, no anything requiring sensor/hardware integration — this is manually logged.
3. **Every quest is: a target quantity, over a day or week window, logged via one or more methods.** Choose "day" for something meant to happen most days; choose "week" for something better tracked as a cumulative total across the week regardless of which days it happens on.
3b. **If my real cadence for something is naturally slower than weekly (biweekly, monthly, seasonal), do not silently approximate it into a weekly target, and do not just ask me whether that's okay — reframe it.** Give the quest multiple methodLabels spanning both the full activity and a lighter, legitimate touch-point (e.g. for a biweekly cooking session: "full dish cooked" alongside "recipe researched" or "ingredients prepped"), so that on the weeks the full activity doesn't happen, there's still something real and consistent with the goal to log toward the same weekly target. The aim is that an "off" week under my actual intended rhythm never has to look like a neglected week in the app.
4. **Only offer multiple methodLabels where they're genuinely interchangeable ways to hit the same underlying target** (e.g. push-ups or squats both serve "a strength session"). If there's only one natural way to do it, give it a single method, not an invented alternative.
5. **Calibrate targetCount to what I told you in the interview, not a generic default.** A beginner and someone with a decade of practice should get different numbers for the same activity. If my stated time/effort budget can't realistically support a "good" version of this domain's practice, say so and propose a smaller starting point instead of overreaching.
6. **When my answers are sparse, uncertain, or the domain has been dormant, default conservative rather than guessing confidently.** Self-assessed skill level is frequently wrong in both directions — a dormant skill gets underestimated, a novice underestimates hidden difficulty. Pick a genuinely easy starting target, flag it in your Step 2 summary as a first-pass guess, and note that real calibration happens after a week or two of actual logging — not from this conversation alone.
6b. **If my answers reveal I already know the right technique for something but have a pattern of abandoning it once it starts working, treat that as its own trigger for a lighter, more sustainable target — even if the calibration itself seems clear.** Listen for this across any answer, not just a dedicated question about it. The risk here isn't uncertainty about what to do, it's sustainability once things improve — prefer a target modest enough to survive the point where it stops feeling urgent, over one calibrated to best practice that assumes willpower holds. Flag this reasoning explicitly in Step 2 if it applies.
7. **Keep each quest narrow, not broad.** A vague goal like "get better at photography" isn't practiceable. Isolate one specific, practiceable element at a time — the way a real coach decomposes a skill, not a general aspiration restated as a task.
8. **Match the quest's shape to where my answers place me — don't default to reps for everything.** If I'm still building basic mechanics in this domain, a repetition- or duration-based target is appropriate. If I'm already well past the basics for this specific skill, a raw count stops being meaningful — reframe around consistency of engagement (e.g. "practice sessions completed") rather than implying more reps equals more mastery. Don't force a numeric target onto something a count can't actually capture.
9. **Consider whether this domain gives fast, clear feedback or slow, ambiguous feedback.** Physical training or memorization tends to give quick, unambiguous signals of whether something worked. Judgment, creative work, or long-feedback-loop skills don't. For the latter, frame the quest around the practice itself (showing up, doing the engagement) rather than implying the count measures quality gained.
10. **Don't ask me to consciously monitor mechanics I already perform fluently.** If my answers suggest a sub-skill is already second nature, a quest that makes me self-check granular technique on every rep can actively hurt performance rather than help it — this is a well-documented failure mode, not just a hunch. Keep those quests about maintaining practice cadence, not micromanaging form.
11. **Keep it small.** 2-4 quests for this domain. This is a personal practice tool, not a checklist to fill — a small tree with meaningful upgrades beats a sprawling one with low-impact nodes.
12. **Draw on real, established practice in this specific domain** — genuine training/habit-formation principles for whatever the domain is — rather than inventing plausible-sounding but arbitrary numbers.

**Not in scope for this prompt:** structured decision-rationale exercises and response-time-based fluency drills are real, well-evidenced techniques for advanced tacit skills, but they don't fit this simple quest schema. That level of mechanism belongs to the (currently deferred) Mastery Tree system, not the MLP quest generator — don't try to shoehorn it into targetCount/window here.

## Step 3 — Output format

Only after I've given the go-ahead in Step 2. This must be its own message containing **nothing but** the JSON array — no preamble, no "here you go," no explanation, no markdown code fences. All your reasoning belongs in Step 2, not here.

Matching exactly:

\`\`\`
[
  { "title": "string, activity-framed", "targetCount": number, "window": "day" or "week",
    "unitLabel": "string, plural", "methodLabels": ["string", ...] }
]
\`\`\``
