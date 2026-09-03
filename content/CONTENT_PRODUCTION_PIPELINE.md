# Habla Lesson Production Pipeline

Version 1.0 — Frozen production baseline, July 18, 2026

Every production lesson follows this lifecycle in order. A lesson may move forward only when the output and gate for the current stage are complete.

```text
Curriculum Map
      ↓
Story Outline
      ↓
Carlos Introduction
      ↓
Vocabulary
      ↓
Grammar
      ↓
Dialogue
      ↓
Listening
      ↓
Pronunciation
      ↓
Speaking
      ↓
Flashcards
      ↓
Quiz
      ↓
Mini Conversation
      ↓
Culture
      ↓
Passport & Achievement
      ↓
QA Checklist
      ↓
Canon Check
      ↓
Merge
```

## Production stages

| Stage | Required output | Release gate |
|---|---|---|
| Curriculum Map | Stable ID, title, story event, mission, one grammar concept, rewards, review hooks, and handoff | The row adds no progression conflict or duplicate teaching target. |
| Story Outline | Setting, reason to communicate, opening beat, learner action, resolution, emotional destination, and next-lesson hook | The scene follows `HABLA_CANON.md`, makes the language necessary, and gives the learner a feeling worth remembering. |
| Carlos Introduction | A brief, warm explanation of what is happening and what the learner will accomplish | It sounds like a tutor, not a software instruction. |
| Vocabulary | 15–30 useful words or chunks, grouped by purpose and tiered | Every core item is used by an activity or the mission. |
| Grammar | Exactly one small pattern already encountered in the story | The explanation is accurate, mobile-readable, and sufficient for the mission. |
| Dialogue | One coherent, natural scene with a successful outcome | The learner participates rather than only observing. |
| Listening | The canonical scene or message at natural and slow speed | Slow audio preserves natural phrasing and both versions test the same meaning. |
| Pronunciation | Only the mission-critical words and phrases | Practice prepares the learner to speak in this lesson’s challenge. |
| Speaking | Repeat → recall → personalize | The final prompt requires an original, achievable response. |
| Flashcards | Tier 1 vocabulary and essential chunks only | Cards reinforce the mission rather than reproduce the whole word list. |
| Quiz | 15–20 varied questions with plausible distractors and explanations | Every answer is unique, introduced, and exactly present in its options. |
| Mini Conversation | A short adaptive exchange with Carlos | The learner must produce language and make at least one meaningful choice. |
| Culture | One useful behavior or regional note | It helps the learner communicate and avoids stereotypes. |
| Passport & Achievement | Canonical stamp plus a registered achievement | IDs are stable and rewards match the curriculum map. |
| QA Checklist | Completed content and technical checklists | All required boxes pass; failures return to the relevant stage. |
| Canon Check | Character, place, timeline, relationship, and handoff review | No contradiction with the world bible or adjacent lessons. |
| Merge | Validated lesson content and any necessary registry update | Stable routes, progression, content loading, and existing user data remain safe. |

## Emotional Arc standard

Every lesson must leave the learner feeling something, not only knowing something. The curriculum map declares one primary emotional destination, and the lesson records how the opening state changes by mission completion.

The emotional arc must:

- arise from the story and communication success rather than generic praise;
- become stronger as the learner gains more independence;
- shape Carlos’s introduction, feedback, final celebration, and reward;
- remain achievable for an A1 learner;
- end with a micro-cliffhanger that creates curiosity about the next story event.

Micro-cliffhangers should be one or two natural lines, reveal no future lesson content, and pay off near the beginning of the next lesson. They create momentum without withholding information the learner needs now.

## Choice Rule gate

When multiple choices can achieve the same mission, the lesson must offer meaningful learner choice.

- Every branch practices the same target language and remains equally valid.
- Carlos acknowledges the selected option with a specific, natural response.
- Branches may add personality or world-building, but not unannounced core vocabulary or grammar.
- All branches rejoin the canonical story before the lesson ends.
- A forced choice is not added when one authentic response is more natural.

## Living World and Memory gate

Every standard lesson includes one optional discovery that makes its location feel real without becoming another exercise.

The A1 memory architecture is frozen at Version 1.0. Lessons must use the existing facts, choices, locations, discoveries, callbacks, and recap structures rather than introducing new memory mechanisms.

- The discovery is never required for lesson completion, XP, or progression.
- Carlos shares one memorable observation, story, or local detail in natural A1-friendly language.
- A discovered moment may be saved as a story memory and referenced later, but callbacks stay occasional.
- Memory writes record demonstrated facts and explicit choices; they never infer a preference from a single accidental tap.
- If an evening recap is present, it arrives later, acknowledges the learner’s actual choice, and contains no button, quiz, or reward.
- Later lessons use remembered details sparingly enough that each callback still feels surprising.
- Store at most one meaningful learner choice per lesson.
- Include at most one optional discovery when the environment supports one.
- Use a remembered callback only every few lessons, not as constant proof of storage.
- Add a delayed recap only when the story genuinely continues after the lesson.

## Recurring Landmark Rule

Each chapter reuses two or three anchor locations for different communication goals. A return visit must deepen familiarity or reveal a new side of the place; it must not repeat the earlier exercise with different vocabulary.

- Establish the chapter landmarks in the curriculum map before producing the chapter.
- Revisit an anchor naturally through story continuity rather than sending the learner there only for review.
- Let earlier people, objects, and language reappear without announcing a review section.
- Keep new locations purposeful so the learner develops a mental map instead of moving through disconnected sets.
- Chapter 1 anchors are Mercado de San Miguel, Plaza Mayor, and Carlos and Marta’s apartment.
- A chapter capstone should connect its anchor locations into one coherent journey.

## Chapter Review policy

Lessons 10, 20, and 30 are mission-based chapter reviews.

- They introduce almost no new language and no new grammar system.
- They reuse the chapter’s vocabulary and conversation patterns inside one connected scenario.
- They measure whether learners can understand, respond, recover, and complete a real-life goal—not whether they can recall isolated facts.
- Carlos gives support only when needed, then reduces that support across the mission.
- Completion earns a meaningful chapter reward and creates a narrative transition into the next destination.

Lesson 10 closes Madrid, Lesson 20 closes Granada, and Lesson 30 is the complete A1 journey capstone.

## Source of truth

- Teaching: `HABLA_TEACHING_PHILOSOPHY.md`
- Story: `HABLA_CANON.md`
- Scope and sequence: `content/A1/A1_CURRICULUM_MAP.md`
- Data contract: `content/schema.md` and `content/lesson-template.json`
- Approval: `content/CONTENT_REVIEW_CHECKLIST.md` and `content/LESSON_QA_CHECKLIST.md`
