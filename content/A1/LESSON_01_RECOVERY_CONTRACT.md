# Lesson 1 recovery contract

Lesson 1 is rebuilt and approved before the same patterns are propagated to later lessons.

## Canonical learner flow

1. Arrive
2. Encounter
3. Discover the Pattern
4. Rehearse
5. Speak
6. Converse with Carlos
7. Madrid Moment
8. Accomplishment

The Learn V2 arc is:

**arrive → encounter → discover → rehearse → speak → converse → connect to Madrid → recognise capability**

Learn is experience and discovery. The learner encounters Spanish in the café before the interface explains it, learns three whole conversational moves, rehearses only the interaction required for the scene, says one phrase aloud, and then completes a tightly scaffolded conversation with Carlos.

Flashcards, the 15-question quiz, and deep pronunciation work remain in the reviewed Lesson 1 content pack for Practice. They are not rendered as primary Learn scenes. Talk with Carlos remains a separate open-ended product; the conversation inside Learn is deliberately constrained to the language taught in this episode.

## Design rules

- Mobile is the primary layout target.
- One clear primary action per screen.
- Editorial Newsreader headings carry story and emotional hierarchy; Inter remains the body/UI face.
- Primary CTA: polished Habla green gradient. Gold is reserved for travel, audio, culture, and premium detail.
- Photography returns at arrival, encounter, the Carlos conversation, Madrid Moment, and accomplishment so the environment is not abandoned after the opening.
- Use open editorial rows, whitespace, and dividers before introducing a rounded container. Only interactive choices, controls, and meaningful grouped moments receive borders.
- Carlos is present throughout through scene photography, a registered production portrait, or concise coaching.
- The learner should always understand what to do next.
- Recorded audio is not presented as automatically understood or corrected until real speech evaluation exists.
- Speaking always offers a quiet continuation path when recording is unavailable.
- Madrid Moment is contextual culture, not a trivia module.
- Completion leads with observable capability, then the Practice handoff and next episode. XP remains secondary.

## Architecture rules

- Lesson JSON is the content source of truth. Do not rewrite lesson content at runtime.
- `learnExperience` defines the reusable scene order and presentation copy. It does not replace the canonical reviewed content pack.
- `conversationBuilder` remains the Lesson 1 source of truth for the three pattern moves, rehearsal, and guided Carlos conversation.
- `css/lesson.css` is the lesson visual source of truth. Do not add an override stylesheet for recovery fixes.
- Lesson flow is defined once inside the lesson renderer until it is deliberately extracted into a shared module.
- Removed routes/screens migrate safely to the closest surviving screen.
- Lesson 1 progress is based on seven learner scenes plus Accomplishment and reaches exactly 100% only on Accomplishment.
- The full Lesson 1 vocabulary, quiz, flashcard, pronunciation, and review data remains available to Practice.
- Service-worker shell assets use network-first refresh with cached offline fallback; artwork uses stale-while-revalidate.
- New lesson-layout experiments stay out of Lessons 2–10 until Lesson 1 is approved.

## V25.1 frozen-structure visual refinement

The eight-scene Learn V2 structure is frozen:

**Arrive → Encounter → Discover → Rehearse → Speak → Converse → Culture → Accomplishment**

V25.1 changes presentation only. It establishes three deliberate editorial
scales for hero, narrative, and interactive language; fixes the medium-width
Encounter collapse; standardizes the lesson column and vertical rhythm; keeps
rehearsal turns in one continuous stage; lowers the visual weight of answer
choices and progress; separates the Madrid cultural thought from its supporting
explanation; and makes the next episode unmistakably primary on completion.

The teaching sequence, reviewed Practice material, stable IDs, state migration,
recording, audio, answer mappings, completion, rewards, and Lesson 2 handoff do
not change. Motion and transition polish remains a later approval pass after the
390px and 720px static layouts pass review.

## Superseded V5 review history

## V5.1b stable-polish review sequence

1. Verify the 10-screen flow and V5 progress migration.
2. Verify Essential Words is concise and uses category-level icons only.
3. Verify Build Your First Conversation clearly teaches Start → Introduce → Close.
4. Verify Say It Naturally appears before the conversation and uses the key conversation phrases.
5. Verify Practice the Pattern gives a short controlled rehearsal before microphone use.
6. Verify Talk with Carlos is a focused three-turn conversation with no bottom navigation, no challenge mode, and no stats screen.
7. Verify Spanish and English flashcard capitalization and the existing quiz answer states.
8. Verify only Episode Opening uses the cinematic hero.
9. Verify Episode Complete has no XP tile, adapts when speaking was skipped, and keeps the repaired Back to Learn button.
10. Only after phone approval, decide what parts of the V5 learning arc should propagate to Lessons 2–10.

## V5.2 design-system polish (uncommitted review pass)

V5.2 is a visual-only refinement of the approved Lesson 1 learning arc.

- Product tone: quiet, cinematic, and confident.
- Typography: Manrope throughout canonical Lesson 1; 700 maximum display weight;
  large headings use a restrained responsive scale; body and helper copy remain
  readable at phone widths.
- Palette: warm near-black canvas, two neutral green-black surfaces, warm white
  text, one emerald action colour, and gold reserved for Madrid, culture, and
  episode ceremony.
- Components: one card radius, one inner radius, one control radius, neutral
  borders, restrained shadows, and a single solid primary-button treatment.
- Layout: sticky lesson header remains in flow with safe-area clearance and
  section scroll offsets; canonical content is capped at 720px and verified at
  390px and approximately 720px.
- Pedagogy and behavior are unchanged. Stable IDs, lesson data, progression,
  personalization, audio, recording, quiz mappings, saved state, rewards, and
  navigation logic remain the V5/V5.1b implementation.

V5.2 must be visually reviewed at the opening, essentials, build, pronunciation,
pattern rehearsal, Carlos conversation, flashcards, recall quiz, Madrid Moment,
and Episode Complete screens before any commit.

### V5.2.1 screenshot and identity corrections (uncommitted)

The first V5.2 phone/compact-desktop review exposed three visual defects and
showed that the all-green treatment had flattened Habla's identity. V5.2.1
corrects those defects and restores gold with a specific semantic role:

- the sticky header now hides the redundant episode eyebrow and keeps its title,
  progress, and back control inside a compact 56–58px frame;
- the canonical page wash matches Lesson 1 regardless of wrapper depth, replacing
  the legacy floating band with a controlled cinematic gold atmosphere;
- pronunciation actions become a full-width two-button row through 760px, and
  long lesson-navigation labels receive the available width without cramped
  wrapping.
- green remains the language of action, progress, and success; gold now marks
  story context, listening controls, section labels, and key learning frames.

No lesson content, assessment mapping, recording behavior, progression, saved
state, or navigation logic changes in V5.2.1.

### V5.2a final visual refinement

- Gold is lifted to a warmer, brighter value but remains reserved for Madrid,
  episode ceremony, cultural context, and small navigational accents.
- Primary green actions use a restrained two-stop tonal gradient with a faint
  inset highlight. The treatment adds depth without gloss, neon, or gamified
  shine; secondary controls remain flat.
- Screen-title scale, supporting-copy leading, muted-text contrast, card
  padding, section gaps, and navigation separation use one quieter rhythm at
  390px and approximately 720px.
- Teaching sequence, content, state, audio, recording, quiz behavior, rewards,
  and navigation remain unchanged.

### V5.2b learning UI and progression correction

- Say It Naturally is now a complete canonical screen with an introduction,
  clearer instructions, a balanced phrase-and-actions layout, and responsive
  two-button controls that use the available width at both 390px and 720px.
- Practice the Pattern reveals only the learner's selected state. Incorrect
  choices use an amber coaching response and must be retried; the correct option
  is no longer exposed as a simultaneous green answer.
- Can You Remember now has its own screen introduction, calmer option hierarchy,
  sentence-capitalized display answers, clearer score language, and no redundant
  disabled lesson-level Next button.
- Replaying an already-completed Lesson 1 no longer sends Madrid Moment directly
  back to Learn. Madrid always opens Episode Complete, whose existing primary
  action activates the configured Lesson 2.
- Source quiz answers remain unchanged; capitalization is presentation-only.
