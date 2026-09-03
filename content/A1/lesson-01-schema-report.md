# Lesson 1 schema audit

Audited against `HABLA_TEACHING_PHILOSOPHY.md`, `content/CONTENT_REVIEW_CHECKLIST.md`, `content/schema.md`, and the current lesson renderers.

## Executive decision

Lesson 1 already conforms to the production lesson structure. This pass does not delete or merge lesson content. It documents field ownership, clarifies XP semantics, marks formal address as optional beginner exposure, and fixes the duplicated artwork extension. Stable IDs, progression links, quiz mappings, memory hooks, rewards, and the visible lesson sequence are preserved.

## Field ownership

### Core lesson fields

Rendered directly by the lesson experience: `story`, `essentialPhrases`, `vocabulary`, `grammar`, `dialogue`, `listening`, `pronunciation`, `speaking`, `quiz`, `miniConversation`, and `realLifeMission`.

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
- Preserved `contentVersion` at `1.3` because no rendered questions or lesson steps changed; existing learner progress remains valid.

## Deferred migration

Removing compatibility fields or moving reviewed reference banks into separate files would be a repository-wide schema migration. It should only happen after every renderer, practice surface, validator, and content file has moved to one canonical contract. That migration is deliberately out of scope for this safe Lesson 1 cleanup.
