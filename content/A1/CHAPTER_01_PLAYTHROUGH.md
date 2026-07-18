# Chapter 1 Playthrough Gate

## Purpose

Chapter 1 is production complete, not yet frozen. This sprint evaluates Lessons 1–10 as one learner experience before Chapter 2 begins. Do not redesign lessons during the run. Record observations first; make only focused corrections after the complete playthrough.

## Test setup

- Use a clean first-time learner profile.
- Clear lesson choices, explicit preferences, discoveries, delayed recaps, progress, stamps, and achievements.
- Use one consistent learner name and learning goal.
- Play on a 390px mobile viewport first, then spot-check 430px.
- Keep normal audio speed enabled; test every slow-speed alternative once.
- Record the start time, end time, and active completion time for every lesson.

## Uninterrupted learner run

Complete Lessons 1–10 in order without editing content between lessons.

For every lesson, record:

- Start and completion time
- Mission clarity within the first minute
- Story continuity from the previous lesson
- Emotional beat and whether it feels earned
- New grammar load and vocabulary load
- Repeated wording or instructions
- Dialogue naturalness
- Listening clarity at natural and slow speed
- Speaking progression: repeat, recall, personalize
- Quiz length, distractor quality, and explanation usefulness
- Callback accuracy and whether the memory feels subtle
- Optional discovery behavior
- Cliffhanger strength
- Any rendering, mobile, audio, state, or console issue

## Chapter-level review

After Lesson 10, review the chapter as one complete arc.

- Total active playtime and per-lesson variance
- Café → Ana → family dinner → plans → market → café → Plaza Mayor → apartment → routine → finale continuity
- Carlos's progression from teacher to observer/coach
- Learner responsibility increasing without a sudden difficulty spike
- Recurring landmarks feeling familiar rather than repeated
- Every stored choice being explicit, useful, and used sparingly
- Every callback being true and earned
- Emotional pacing across Curiosity, Confidence, Belonging, Excitement, Discovery, Relaxation, Independence, Comfort, Routine, and Achievement
- Lesson 10 feeling like a payoff rather than a review worksheet
- Passport ceremony feeling distinct from an ordinary reward screen
- Granada handoff creating anticipation without beginning Lesson 11 early

## Technical acceptance

- All ten lesson files parse and satisfy the content schema.
- Every quiz answer has four distinct options, one valid answer, and an explanation.
- Natural and slow listening variants work.
- Choices, discoveries, callbacks, and completion memory persist correctly.
- No duplicate delayed recap is scheduled.
- Lesson progression, XP, stamps, and achievements update exactly once.
- Back/forward navigation does not lose state.
- Layout works at 390px and 430px with no horizontal overflow or covered content.
- No broken images, missing audio controls, or console errors.

## Correction policy

After the full run, group findings into:

1. Factual, canon, progression, or technical defects — fix before freeze.
2. Clarity, pacing, repetition, or uneven-length issues — make the smallest correction that solves the observed problem.
3. Preference-only redesign ideas — defer to Chapter 1 v1.1.

Run one focused regression pass after corrections. Do not replay and rewrite the chapter indefinitely.

## Freeze and milestone

Chapter 1 may be marked frozen only when the playthrough and regression pass meet every required acceptance item. At that point:

- Update the A1 README status to `Chapter 1 Frozen`.
- Record the tested content versions.
- Commit the verified milestone.
- Tag the repository `v1.0.0-alpha-chapter1`.
- Begin Lesson 11 only after the tag exists.
