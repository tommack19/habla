# A1 Beginner

## Production standard freeze

Habla A1 Production Standard **Version 1.0** is frozen as of July 18, 2026. It includes the teaching philosophy, canon, curriculum map, lesson schema, review and QA gates, production pipeline, emotional arcs, micro-cliffhangers, grammar progression, spiral review, and Choice Rule.

The standard changes only when production or learner evidence reveals a real problem. New ideas are tested inside upcoming lessons without reopening approved foundations.

### Lesson and chapter freeze policy

- A lesson becomes **Production v1.0** after content review, canon review, technical validation, and approval.
- Lessons 1–10 become **Chapter 1 Frozen** together after the Madrid chapter passes continuity and learner testing.
- Frozen lesson rewrites require a new content version such as v1.1.
- Factual corrections, safety issues, broken progression, malformed content, and technical defects may be fixed without waiting for a feature release.
- Wording or activity changes driven by preference alone wait for the next version.
- Feedback and analytics must be evaluated against `contentVersion` so learners are compared on the same course material.

### Frozen lesson experience reference

`lesson-01-greetings.json` **Version 1.2** is the canonical A1 learner experience and is frozen as of July 19, 2026.

New lessons must reuse its established rhythm instead of introducing new lesson chrome:

1. One story and one real-life mission.
2. Situation-based vocabulary and one supporting grammar concept.
3. One continuous dialogue.
4. Listening in three passes: listen, follow along, understand.
5. Pronunciation limited to mission language.
6. Carlos-led speaking turns with optional models.
7. Focused flashcards and a safe 15–20 question quiz.
8. A final Carlos challenge, cultural context, personal closing, passport stamp, achievement, and next-episode handoff.

Lesson 1 may now change only for factual corrections, accessibility failures, broken progression, malformed content, or verified learner evidence. Preference-driven design changes belong in a later content version.

The canonical course sequence is [CURRICULUM.md](./CURRICULUM.md), and the detailed production plan is [A1_CURRICULUM_MAP.md](./A1_CURRICULUM_MAP.md). Every lesson moves through `content/CONTENT_PRODUCTION_PIPELINE.md` and follows the shared contract in `content/schema.md` and `content/lesson-template.json`.

The product philosophy is `HABLA_TEACHING_PHILOSOPHY.md`. Story facts and character continuity are governed by `HABLA_CANON.md`.

Every completed lesson must pass both `content/CONTENT_REVIEW_CHECKLIST.md` and `content/LESSON_QA_CHECKLIST.md`.

Content is upgraded one lesson at a time. Lessons 1–10 now form the production-ready Madrid chapter. Lesson 1 v1.2 is the frozen UX and pacing reference, Lesson 3 remains the structural content-pack reference, Lesson 5 demonstrates the advanced renderer capabilities, Lesson 6 closes the full memory loop, Lessons 7–9 gradually transfer responsibility from Carlos to the learner, and Lesson 10 is the first chapter finale: a connected day with no new grammar lesson and a personal passport ceremony.

Chapter 1 is **production complete but not frozen**. It becomes `Chapter 1 Frozen` only after the uninterrupted first-time learner playthrough in [CHAPTER_01_PLAYTHROUGH.md](./CHAPTER_01_PLAYTHROUGH.md) passes and its small corrective fixes are verified. Lesson 11 production must wait until that gate is complete.

A1 teaches survival Spanish for absolute beginners.

Learners focus on greetings, numbers, days, months, colors, family words, food basics, and simple phrases for asking for help. Grammar introduces gender with `el` and `la`, basic articles, `ser` vs `estar`, `tener` phrases, and regular present-tense verbs.

By the end of A1, learners should be able to introduce themselves, talk about family, order simple food, ask basic questions, and understand slow, clear Spanish in familiar situations.
