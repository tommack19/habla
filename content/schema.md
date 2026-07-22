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
- `rewards`: Optional explicit reward roles. `lessonCompletionXp` is the canonical completion award and `challengeXp` is the applied mission award; legacy `xpReward` fields remain supported during migration.
- `skills`: Vocabulary, grammar, listening, speaking, reading, or writing
- `nextLesson`: The `id` of the recommended next lesson, or `null` if none exists.
- `contentRoles`: Optional maintenance metadata that classifies core, support, reviewed-reference, and compatibility fields without changing the rendered lesson order.
- `sectionIntros`: Optional presentation copy for short section eyebrows, titles, and supporting lines. It may refine tone but must not replace teaching content or introduce unlearned Spanish.
- `sectionTransitions`: Optional brief Carlos lines that bridge completed sections. They should maintain story momentum without adding new teaching content.
- `dialogue[].presentation.status`: Optional presence copy for message-thread headers, such as `Active now` or a story-specific last-seen time.
- `realLifeMission.presentationBody`: Optional short setup copy for the example conversation.
- `realLifeMission.livePracticeCopy`: Optional timeless Carlos invitation shown before opening Carlos chat. Do not reference unreleased implementation details.
- `microCliffhanger.confirmationSpanish` / `confirmationEnglish`: Optional final message shown before the next-episode tease.
- `vocabularyPresentation.showPriorityLabels`: Optional presentation flag that labels Tier 1 vocabulary as required and Tier 2 vocabulary as good to know without changing assessment or progression.
- `vocabularyPresentation.collapseOptional`: Optional presentation flag that keeps Tier 2 vocabulary available in a collapsed shelf so the core mission remains concise.
- `vocabularyPresentation.collapseGroups`: Optional presentation flag that turns vocabulary groups into compact disclosures without changing vocabulary priority or assessment.
- `vocabularyPresentation.openFirstGroup`: When grouped vocabulary is collapsed, optionally open the first adaptive group so the learner’s selected item remains prominent.
- `vocabularyPresentation.groupIcons`: Optional mapping from vocabulary group labels to existing semantic renderer icons.
- `culturePresentation.collapseWorldBuilding`: Keeps optional environmental observations behind a lightweight discovery disclosure.
- `culturePresentation.collapseNativeSpeech`: Keeps recognition-only native phrasing available without interrupting the core path.
- `culturePresentation.collapseCommonMistakes`: Keeps corrective reference material available on demand; it must not introduce assessed content.
- `culturePresentation.nativeSpeechLabel`: Optional warmer label for recognition-only local phrasing, such as `What locals really say`.
- `culturePresentation.worldBuildingLabel`: Optional story-specific label for collapsed environmental moments, such as `Apartment moments`.
- `dialoguePresentation.compactChoicePreview`: A compact reminder that the learner's earlier choice is used in the scene; it avoids repeating the full branch before the dialogue.
- `dialogue.languageNote`: Optional short, visible explanation for a useful form heard in the scene but not required for production.
- `speaking.items[].responseFromChoice`: Replaces the model response with the learner's stored choice and canonical order during personalized speaking.
- `speaking.items[].byChoice`: Optional per-choice prompt, cue, model, or translation overrides. Use it to carry a selected story path through guided speaking before all paths deliberately rejoin.
- `listening.soundscape`: Optional non-interactive scene-atmosphere copy with a short `label` and `description`. It must not claim playable ambient audio exists unless a real audio asset is supplied.
- `chapterCeremony`: Optional chapter-finale presentation. `title`, `subtitle`, and Carlos’s bilingual reflection replace a standard lesson-summary tone without changing completion logic.
- `chapterCeremony.hideXp` / `hideAchievement`: Presentation-only flags for a finale where the emotional chapter reward should take priority. XP and achievement evaluation may still occur in the progress engine; these flags only remove them from the ceremony UI.
- `chapterCeremony.postcard`: Optional cinematic next-chapter reveal with a project-local `image`, descriptive `alt`, Carlos’s bilingual setup, the next speaker’s bilingual voice line, destination, chapter label, and `comingNext` copy.
- `pronunciation.presentation`: Optional presentation mode. Use `dayTimeline` only when pronunciation phrases intentionally trace a day from morning to night; items may provide semantic `moment` and `icon` fields.
- `realLifeMission.successPresentation`: Use `emotional` to replace a repeated success checklist with one outcome, a short Carlos response, and optional `successMoments`.
- `livingWorldInteractions[].savedLabel`: Optional completion wording for a collected discovery, such as `Madrid Memory Added`.
- `livingWorldInteractions[].eyebrow` / `savedEyebrow`: Optional emotional labels before and after discovery, such as `Hidden memory` and `Travel journal moment`.
- `worldBuilding[].icon`: Optional semantic renderer icon for a story observation.
- `carlosClosingByChoice`: Optional closing lines keyed by learner choice ID. Always provide `carlosClosing` as the safe fallback.
- `learnerChoices.options[].vocabularyFocus`: Optional vocabulary terms that should be promoted after a choice, especially when the choice uses a different singular or plural form.
- `learnerChoices.options[].icon`: Required for production choice cards. Use a semantic key from `js/components/choiceIcons.js`; never embed emoji, letters, dots, or lesson-specific SVG markup in content.
- Choice renderers must call `renderChoiceIcon(choice.icon || choice.id)`. The ID fallback preserves older content, while `scripts/validate-season1.ps1` requires every production choice to declare its icon explicitly.
- `learnerChoices.responseLabel` / `memoryLabel`: Optional warmer Carlos-response and stored-memory labels without changing choice persistence.
- `completionLabel`: Optional learner-facing completion wording, such as `Episode complete`, without changing completion behavior or progression.
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
