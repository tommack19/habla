# Habla Lesson Schema

Version 1.0 — Frozen production baseline

This data contract is used inside the staged workflow in `content/CONTENT_PRODUCTION_PIPELINE.md`. Schema validity is necessary but does not replace content QA or the final canon check.

## Canonical A1 lesson contract

The A1 curriculum is situation-first. Every production lesson must contain these sections in this order:

1. `carlosIntroduction`
2. `vocabulary`
3. `essentialPhrases`
4. `grammar`
5. `listening`
6. `speaking`
7. `miniConversation`
8. `culture`
9. `realLifeMission`
10. `review`

### Complete content pack

The canonical teaching sections are the lesson core, but a production lesson is delivered as one complete content pack:

1. Story and mission
2. Real-life objective and `canDo` outcomes
3. Vocabulary grouped by communication purpose
4. Essential phrases
5. One grammar concept
6. Listening at natural and slow speed
7. Pronunciation
8. Speaking from repeat to recall to personalization
9. Focused flashcards
10. A 15–20 question quiz
11. A mini conversation with Carlos
12. One practical cultural note
13. A Carlos Challenge
14. Passport stamp and achievement metadata where applicable
15. Invisible review hooks using earlier language

`content/A1/lesson-03-family.json` is the gold-standard reference content pack. It demonstrates how the canonical lesson core, current UI compatibility fields, and progression rewards fit together without turning the lesson into a collection of unrelated activities.

Legacy fields such as `listeningPhrases`, `speakingChallenge`, `dialogue`, and `quiz` remain supported by the current UI. While lessons are migrated, canonical sections should reference or duplicate the same learning targets rather than introduce different material.

Optional `supplementalDialogueExamples` and `supplementalQuizBank` fields may preserve additional reviewed practice material, but they are not part of the primary lesson flow and must never contradict the canonical story or teach a future lesson’s central concept early.

### Required quality metadata

- `story.chapter`: Chapter number from 1–3.
- `story.city`: Madrid, Granada, or Valencia.
- `story.scene`: The concrete situation Carlos is guiding.
- `emotionalArc`: The learner’s starting feeling, ending feeling, and the experience that creates the change.
- `microCliffhanger`: Carlos’s short final story beat and the lesson where it pays off.
- `canDo`: Three to five observable learner outcomes.
- `recycledLanguage`: At least three earlier words or phrases that return naturally. Lesson 1 uses an empty array.
- `vocabulary[].tier`: Primarily `1`; use `2` only when required by the situation.
- `vocabulary[].group`: A short functional group such as Openers, Responses, or Repair.
- `essentialPhrases[].usage`: When or why a learner would use the phrase.
- `listening.items[].answer`: Must exactly match one provided option.
- `realLifeMission.successCriteria`: Clear, observable completion requirements.
- `review.canDo`: A short self-check based on the lesson outcomes.

The complete A1 sequence is defined in `content/A1/CURRICULUM.md`. Lesson titles, story events, grammar coverage, missions, rewards, review hooks, and handoffs are planned in `content/A1/A1_CURRICULUM_MAP.md`.

All content decisions follow `HABLA_TEACHING_PHILOSOPHY.md`. Before a lesson is marked production-ready, review it against `content/CONTENT_REVIEW_CHECKLIST.md`.

Story details must follow `HABLA_CANON.md`, and production approval requires the complete gate in `content/LESSON_QA_CHECKLIST.md`.

### Teaching behavior

- Neutral Spanish is the default; regional differences are optional context.
- Previously learned language should return naturally in later situations.
- Carlos celebrates successful communication before correcting one important mistake.
- Every lesson ends with an observable communication success.
- The final experience should feel like an enjoyable conversation with Carlos, not a completed worksheet.

Every Habla lesson should follow this standard format.

## Metadata

- `id`: Unique lesson identifier. Use a stable lowercase pattern such as `a1-greetings-01`.
- `contentVersion`: Released content version used for feedback and analytics comparisons.
- `title`: Lesson name
- `level`: A1, A2, B1, or B2
- `module`: Course module or topic group
- `estimatedMinutes`: Expected completion time in minutes
- `xpReward`: XP awarded for completion
- `skills`: Vocabulary, grammar, listening, speaking, reading, or writing
- `nextLesson`: The `id` of the recommended next lesson, or `null` if none exists.
- `learnerChoices`: Optional branches that teach the same objective. Each choice includes an ID, learner-facing option, Carlos response, and canonical rejoin point.
- `memory`: Optional declarative writes into Carlos’s durable learner profile. Use `onChoice` for a selected branch and `onComplete` only for facts the learner actually established.
- `memoryCallbacks`: An optional, brief acknowledgment of a stored earlier lesson choice. Use `sourceLessonId` with either one `message` or restrained `byChoice` variants.
- `livingWorldInteractions`: One optional, non-assessed discovery that makes the lesson location feel inhabited. It may write a collectible story memory but cannot block completion.
- `eveningRecap`: An optional delayed Carlos message. It contains no XP or CTA and may vary through `byChoice` to acknowledge learner agency.

## Template Fields

- `id`: Unique string used by routing, progress tracking, and prerequisites.
- `title`: Human-readable lesson title shown in the UI.
- `level`: Course level: `A1`, `A2`, `B1`, or `B2`.
- `module`: The course unit this lesson belongs to, such as Greetings, Family, Travel, or Restaurants.
- `estimatedMinutes`: Approximate lesson length for planning and mission estimates.
- `objectives`: List of learner outcomes. Each objective should describe something the learner can do after the lesson.
- `vocabulary`: List of lesson vocabulary objects. Each item should include Spanish, English, part of speech, tip, Spanish example, and English translation.
- `grammar`: The main pattern or grammar point. Include topic, explanation, examples, and a short practice prompt.
- `dialogue`: Short conversational exchange using the lesson vocabulary and grammar.
- `pronunciation`: Sound, stress, rhythm, or phrase practice for the lesson.
- `culture`: Practical cultural note that helps the learner use Spanish naturally.
- `nativeSpeech`: Notes about how native speakers may shorten, phrase, or pronounce the lesson content.
- `commonMistakes`: Common learner errors with correction and explanation.
- `quiz`: Knowledge-check questions. Types can include multiple choice, matching, fill-in-the-blank, or translation.
- `speakingChallenge`: Prompt for the learner to say something out loud or practice with Carlos.
- `realLifeMission`: Final applied task that asks the learner to use the lesson in a realistic scenario. Include title, mission, success criteria, suggested partner or setting, and optional XP reward.
- `achievementsUnlocked`: Achievement IDs that this lesson may unlock when completed.
- `xpReward`: XP awarded when the lesson is completed.
- `nextLesson`: Lesson ID to recommend after completion.

## Lesson Structure

1. Objective
   - A short statement of what the learner will be able to do by the end.

2. Warmup
   - A simple recall or recognition activity.

3. Core Vocabulary
   - Spanish word or phrase
   - English meaning
   - Part of speech or category
   - Pronunciation note when useful
   - Example sentence in Spanish
   - English translation

4. Grammar or Pattern
   - Beginner-friendly explanation
   - One or two model sentences
   - Common mistake or tip

5. Guided Practice
   - Multiple choice, fill-in-the-blank, matching, or short translation.

6. Speaking Practice
   - A prompt the learner can say out loud or use with Carlos.

7. Real Life Mission
   - A practical task that gives the learner a reason to apply the lesson immediately.
   - Should name the setting or partner, such as Carlos, a restaurant, family member, or travel situation.
   - Should include clear success criteria so the learner knows what counts as complete.

8. Review
   - Quick recap of new words and patterns.

9. Completion
   - Mission or XP outcome
   - Suggested next lesson

## Content Rules

- Keep explanations short and practical.
- Use everyday scenarios: family, food, travel, work, and small talk.
- Include Spanish punctuation where appropriate.
- Prefer useful phrases over abstract grammar drills.
- Make every lesson usable on a phone.
