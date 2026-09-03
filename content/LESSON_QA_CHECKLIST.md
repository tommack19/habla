# Habla Lesson QA Checklist

Version 1.0 — Frozen production baseline

Every lesson must pass this gate before it is considered production-ready.

This checklist is the approval gate in `content/CONTENT_PRODUCTION_PIPELINE.md`. Lessons 10, 20, and 30 must also pass its Chapter Review policy.

## Story and mission

- [ ] The lesson has one clear mission beginning with “Today you’ll learn to…”
- [ ] The mission describes a real communication outcome.
- [ ] The scene continues naturally from the previous lesson.
- [ ] The scene does not contradict `HABLA_CANON.md`.
- [ ] The title, story event, mission, grammar, stamp, achievement, and handoff match `content/A1/A1_CURRICULUM_MAP.md`.
- [ ] Established characters keep their canonical identity and relationships.
- [ ] The ending creates a natural handoff into the next lesson.
- [ ] The lesson delivers the emotional destination declared in the curriculum map.
- [ ] Carlos’s final response celebrates the real communication success, not merely completion.
- [ ] A short micro-cliffhanger creates curiosity and is paid off by the next lesson.

## Teaching design

- [ ] The lesson introduces exactly one grammar concept.
- [ ] Grammar explains language already encountered in the story.
- [ ] Vocabulary contains 15–30 useful words or chunks.
- [ ] Vocabulary is grouped by communication purpose.
- [ ] Most vocabulary is Tier 1; Tier 2 appears only when the scene needs it.
- [ ] Essential phrases are natural, neutral, and immediately useful.
- [ ] Earlier language returns naturally without feeling like a review worksheet.

## Activities

- [ ] The dialogue is one coherent scene rather than disconnected examples.
- [ ] Listening supports normal and slow playback.
- [ ] Every listening answer exactly matches one option.
- [ ] Pronunciation focuses only on sounds or rhythm needed in this lesson.
- [ ] Speaking progresses through repeat → recall → personalize.
- [ ] Flashcards include only the most important vocabulary and chunks.
- [ ] The quiz contains 15–20 questions.
- [ ] Every multiple-choice answer appears exactly once in its options.
- [ ] Quiz distractors are plausible, unique, and based on introduced language.
- [ ] Every quiz question has a useful explanation.
- [ ] The Carlos mini-conversation requires learner production.
- [ ] Meaningful branches share one learning objective and equivalent success criteria.
- [ ] Each offered choice receives a relevant Carlos response and rejoins the canonical ending.
- [ ] One optional Living World interaction adds atmosphere without blocking completion.
- [ ] Memory writes record only explicit choices or demonstrated facts, not unsupported assumptions.
- [ ] Any delayed Carlos recap acknowledges the lesson or choice without XP, buttons, or another task.

## Completion and rewards

- [ ] The final challenge represents a real communication success.
- [ ] Challenge criteria are observable and achievable.
- [ ] Carlos celebrates communication before correcting one important issue.
- [ ] The cultural note is short, useful, and avoids stereotypes.
- [ ] Passport stamp metadata is present and consistent with the story.
- [ ] Achievement metadata uses a registered, stable achievement ID.
- [ ] XP does not exceed the configured lesson reward.

## Safety and release

- [ ] Stable lesson IDs and route IDs have not changed.
- [ ] `prerequisiteLesson` resolves, when present.
- [ ] `nextLesson` resolves, or is `null` for the final lesson.
- [ ] Required canonical and compatibility fields are present.
- [ ] No duplicate top-level JSON keys exist.
- [ ] Spanish accents, punctuation, translations, and names are correct.
- [ ] The lesson JSON parses successfully.
- [ ] The lesson loads through the app’s content loader.
- [ ] Existing progress, achievements, and practice modes remain compatible.
- [ ] The lesson passes `content/CONTENT_REVIEW_CHECKLIST.md`.
- [ ] The lesson passes Habla’s golden rule: it helps the learner confidently speak Spanish in a real conversation.

## Approval

- Content review: [ ] Passed
- Canon review: [ ] Passed
- Technical validation: [ ] Passed
- End-to-end app check: [ ] Passed
- Production status: [ ] Approved

## Lesson Definition of Done

A lesson is not complete until every item below passes. This is the final release gate; a partial pass remains production-incomplete.

### Narrative

- [ ] Continues the previous story naturally.
- [ ] Ends with anticipation for the next lesson.
- [ ] Carlos speaks in his established warm, concise, encouraging voice.

### Learning

- [ ] Has one clear grammar objective, or explicitly introduces no new grammar when it is a chapter capstone.
- [ ] Vocabulary is tied directly to the mission.
- [ ] Every tested phrase appears in context before assessment.
- [ ] Earlier language returns through invisible spiral review.

### Experience

- [ ] Listening uses the three-pass flow: listen, follow along, understand.
- [ ] Speaking uses five coached stages ending in personalization.
- [ ] Flashcards prioritize the learner’s relevant choices or progress when adaptive context exists.
- [ ] Every quiz answer includes a useful explanation.
- [ ] A passport reward marks the real communication success.
- [ ] Carlos gives a personal closing that celebrates the learner and hands off to the next episode.

### Technical

- [ ] JSON parses and passes structural validation.
- [ ] Branch choices are valid, equivalent in learning value, and rejoin the canonical story.
- [ ] Memory writes use only the frozen A1 memory architecture and record explicit facts or choices.
- [ ] Every spoken Spanish item resolves to an audio reference or the app’s supported speech-synthesis path.
- [ ] The lesson renderer remains usable at supported mobile and desktop widths without covered content or horizontal scrolling.
- [ ] Controls, labels, focus order, contrast, transcripts, and non-audio alternatives pass accessibility review.
