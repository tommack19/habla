# Lesson 1 recovery contract

Lesson 1 is rebuilt and approved before the same patterns are propagated to later lessons.

## Canonical learner flow

1. Episode Opening
2. Essential Words
3. Build Your First Conversation
4. Say It Naturally
5. Practice the Pattern
6. Talk with Carlos
7. Keep It Fresh
8. Can You Remember?
9. Madrid Moment
10. Episode Complete

The V5 learning arc is:

**see it → understand it → build it → say it → rehearse it → use it → reinforce it → recall it → connect it to Madrid → complete the episode**

**Talk with Carlos is the payoff, not the teaching screen.** The learner first sees the essential phrases, learns the three-part conversation pattern, practises pronunciation, and completes a short controlled rehearsal. Only then does the microphone-led conversation begin.

The canonical Talk with Carlos experience is one short, continuous three-turn café conversation. There is no separate Watch Carlos ladder, five-exchange exercise tracker, final no-model challenge, challenge stats dashboard, or duplicate speaking screen.

There are no standalone **A Message from Carlos**, **Choose the Moment**, **Carlos’ Advice**, **Watch Carlos listening passes**, **Your Turn**, **Today’s Mission**, or **Carlos Challenge** screens in the approved Lesson 1 flow. Useful content from those concepts must be folded into one of the ten canonical screens instead of creating another progress step.

## Design rules

- Mobile is the primary layout target.
- One clear primary action per screen.
- Primary CTA: polished Habla green gradient.
- Secondary CTA: restrained gold outline or dark neutral.
- No large filled-yellow primary CTAs.
- Manrope is the display typeface; Inter is the body/UI typeface.
- Internal card labels use normal title case where possible instead of stacking all-caps micro-headings.
- Episode Opening is the only repeated cinematic hero in the canonical Lesson 1 flow.
- Carlos appears as an avatar/character inside teaching and conversation content instead of being cropped into a hero on every screen.
- Essential vocabulary uses category-level icons; individual words do not receive repetitive decorative faces/icons.
- Lesson 1 flashcards display Spanish with sentence-style first-letter capitalization without changing the underlying source strings.
- The learner should always understand what to do next.

## Architecture rules

- Lesson JSON is the content source of truth. Do not rewrite lesson content at runtime.
- `conversationBuilder` is the Lesson 1 source of truth for the Build, Practice the Pattern, and Talk with Carlos stages.
- `css/lesson.css` is the lesson visual source of truth. Do not add an override stylesheet for recovery fixes.
- Lesson flow is defined once inside the lesson renderer until it is deliberately extracted into a shared module.
- Removed routes/screens migrate safely to the closest surviving screen.
- Lesson 1 progress is based on the nine learner steps plus Episode Complete and reaches exactly 100% only on Episode Complete.
- New lesson-layout experiments stay out of Lessons 2–10 until Lesson 1 is approved.

## V5 review sequence

1. Verify the 10-screen flow and V5 progress migration.
2. Verify Essential Words is concise and uses category-level icons only.
3. Verify Build Your First Conversation clearly teaches Start → Introduce → Close.
4. Verify Say It Naturally appears before the conversation and uses the key conversation phrases.
5. Verify Practice the Pattern gives a short controlled rehearsal before microphone use.
6. Verify Talk with Carlos is a focused three-turn conversation with no bottom navigation, no challenge mode, and no stats screen.
7. Verify flashcard first-letter capitalization and the existing quiz answer states.
8. Verify only Episode Opening uses the cinematic hero.
9. Verify Episode Complete and the repaired Back to Learn secondary button.
10. Only after phone approval, decide what parts of the V5 learning arc should propagate to Lessons 2–10.
