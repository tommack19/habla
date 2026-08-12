# Lesson 1 schema audit

Audited against `HABLA_TEACHING_PHILOSOPHY.md`, `content/CONTENT_REVIEW_CHECKLIST.md`, `content/schema.md`, and the current lesson renderers.

## Executive decision

Lesson 1 conforms to the production lesson structure. The redundant standalone mission transcript has been removed because guided production now lives in Talk with Carlos. Its concise success summary is rendered on Episode Complete. Stable IDs, progression links, quiz mappings, memory hooks, and rewards remain preserved.

The learner-facing flow is frozen at ten screens and uses `lessonFlowVersion: 3` with stable `rendererStepId` restoration. The canonical contract is recorded in `LESSON_01_PRODUCTION_FREEZE.md`.

## Field ownership

### Core lesson fields

Rendered directly by the lesson experience: `story`, `essentialPhrases`, `vocabulary`, `grammar`, `dialogue`, `listening`, `pronunciation`, `speaking`, and `quiz`. `realLifeMission` supplies mission framing and the compact completion summary; it no longer creates a standalone step.

### Practice and Carlos support

Consumed outside the main lesson flow or used as compatibility fallbacks: `listeningPhrases`, `speakingChallenge`, `nativeSpeech`, and `commonMistakes`.

### Reviewed reference content

Pedagogically reviewed but not currently shown in the primary lesson renderer: `greetings`, `politeExpressions`, `supplementalDialogueExamples`, `supplementalPronunciation`, and `supplementalQuizBank`.

These fields remain in place because the frozen schema explicitly supports supplemental banks and future renderers may consume them. Keeping them avoids throwing away reviewed content.

## Intentional compatibility fields

- `canDo` and `objectives` currently contain the same outcomes. Both remain because `canDo` is required by the frozen schema while current UI fallbacks read `objectives`.
- `achievement` contains the display metadata for the lesson reward. `achievementsUnlocked` preserves the stable ID consumed by the global achievement system.
- `realLifeMission.xpReward` is the challenge reward. Root `xpReward` remains the legacy lesson-completion reward. The new `rewards` object makes the distinction explicit while renderers retain backward-compatible fallbacks for Lessons 2–30.

## Safe cleanup completed

- Added `contentRoles` so future maintainers can distinguish core, support, reference, and compatibility fields without guessing.
- Added optional `sectionIntros` presentation metadata so Lesson 1 can use concise, emotional headings without hardcoding lesson-specific copy in the renderer.
- Added `rewards.challengeXp` and `rewards.lessonCompletionXp` as explicit reward semantics.
- Kept `¿Cómo está?` and `¿Y usted?` as Tier 2, **Good to know** vocabulary rather than required production language.
- Normalized `lesson-01-greetings.png.png` to `lesson-01-greetings.png` in the content and all known runtime references.
- Removed the duplicate `miniConversation` transcript from Lesson 1 and moved its useful outcome summary into Episode Complete.
- Redirected removed `conversation`, `your-turn`, and `mission` saved positions to Talk with Carlos.
- Connected Saved Words, Saved Questions, and difficult flashcards to persistent Practice collections.
- Preserved `contentVersion` at `1.3` because quiz content and stable lesson identifiers did not change; existing learner progress remains valid.

## Deferred migration

Removing compatibility fields or moving reviewed reference banks into separate files would be a repository-wide schema migration. It should only happen after every renderer, practice surface, validator, and content file has moved to one canonical contract. That migration is deliberately out of scope for this safe Lesson 1 cleanup.
