# Lesson 1 recovery contract

Lesson 1 is rebuilt and approved before the same patterns are propagated to later lessons.

## Canonical learner flow

1. Episode Opening
2. Words You’ll Need
3. Carlos’ Advice
4. Talk with Carlos
5. Say It Naturally
6. Keep It Fresh
7. Can You Remember?
8. Madrid Moment
9. Episode Complete

**Talk with Carlos** now includes the useful Watch Carlos behavior: the learner can hear the full conversation first, then complete the guided five-exchange conversation and the no-model conversation challenge on the same screen.

There are no standalone **Watch Carlos listening passes**, **Talk with Carlos duplicate screen**, **Your Turn**, **Today’s Mission**, **Carlos Challenge**, **A Message from Carlos**, or **Choose the Moment** screens in the approved Lesson 1 flow. Useful content from those concepts must be folded into one of the nine canonical screens instead of creating another progress step.

## Design rules

- Mobile is the primary layout target.
- One clear primary action per screen.
- Primary CTA: polished Habla green gradient.
- Secondary CTA: restrained gold outline or dark neutral.
- No large filled-yellow primary CTAs.
- Carlos uses one consistent avatar treatment.
- Vocabulary icons use one consistent outlined icon treatment.
- Lesson cards share one spacing, radius, border, and surface system.
- Manrope is the display typeface; Inter is the body/UI typeface.
- Artwork supports the lesson instead of dominating the viewport.
- The learner should always understand what to do next.

## Architecture rules

- Lesson JSON is the content source of truth. Do not rewrite lesson content at runtime.
- `css/lesson.css` is the lesson visual source of truth. Do not add an override stylesheet for recovery fixes.
- Lesson flow is defined once inside the lesson renderer until it is deliberately extracted into a shared module.
- Removed routes/screens migrate safely to the closest surviving screen.
- Lesson 1 progress is based on the nine canonical screens and reaches exactly 100% on Episode Complete.
- The old standalone speaking step migrates into the combined Talk with Carlos screen.
- New lesson-layout experiments stay out of Lessons 2–10 until Lesson 1 is approved.

## V3 review sequence

1. Verify the 9-screen flow and progress migration.
2. Verify Carlos’ Advice compact handoff.
3. Verify Talk with Carlos: preview, five guided exchanges, microphone recovery, challenge, completion.
4. Verify Say It Naturally final-practice density.
5. Verify flashcard English side stays concise.
6. Verify typography on Home, Learn, Lesson, Carlos, Practice, and Me.
7. Verify polished green primary buttons on an actual phone.
8. Only after approval, propagate the Lesson 1 system to Lessons 2–10.
