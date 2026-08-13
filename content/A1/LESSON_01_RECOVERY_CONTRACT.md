# Lesson 1 recovery contract

Lesson 1 is rebuilt and approved before the same patterns are propagated to later lessons.

## Canonical learner flow

1. Episode Opening
2. Words Youâ€™ll Need
3. Carlosâ€™ Advice
4. Watch Carlos
5. Say It Naturally
6. Talk with Carlos
7. Keep It Fresh
8. Can You Remember?
9. Madrid Moment
10. Episode Complete

There are no standalone **Your Turn**, **Todayâ€™s Mission**, **Carlos Challenge**, **A Message from Carlos**, **Choose the Moment**, or separate listening-pass screens in the approved Lesson 1 flow. Useful content from those concepts must be folded into one of the ten canonical screens instead of creating another progress step.

## Design rules

- Mobile is the primary layout target.
- One clear primary action per screen.
- Primary CTA: Habla green.
- Secondary CTA: restrained gold outline or dark neutral.
- No large filled-yellow primary CTAs.
- Carlos uses one consistent avatar treatment.
- Lesson cards share one spacing, radius, border, and surface system.
- Artwork supports the lesson instead of dominating the viewport.
- The learner should always understand what to do next.

## Architecture rules

- Lesson JSON is the content source of truth. Do not rewrite lesson content at runtime.
- `css/lesson.css` is the lesson visual source of truth. Do not add an override stylesheet for recovery fixes.
- Lesson flow is defined once inside the lesson renderer until it is deliberately extracted into a shared module.
- Removed routes/screens migrate safely to the closest surviving screen.
- Lesson 1 progress is based on the ten canonical screens and reaches exactly 100% on Episode Complete.
- New visual experiments stay out of Lessons 2â€“10 until Lesson 1 is approved.

## Recovery sequence

1. Freeze and simplify Lesson 1 structure.
2. Normalize Lesson 1 card and CTA styling in `css/lesson.css`.
3. Finish the dedicated Talk with Carlos experience.
4. Validate progress, Back/Next navigation, refresh restoration, audio, and microphone states.
5. Review Lesson 1 on an actual phone.
6. Only after approval, propagate the system to Lessons 2â€“10 and then Practice.
