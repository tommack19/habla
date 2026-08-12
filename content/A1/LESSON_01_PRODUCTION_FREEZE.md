# Lesson 1 production freeze

Lesson 1 is the canonical Habla episode template. Structural changes to this flow require an explicit product decision and a new flow-version migration.

## Frozen learner-facing sequence

1. Episode Opening
2. Words You’ll Need
3. Carlos’ Advice
4. Watch Carlos
5. Say It Naturally
6. Talk with Carlos
7. Keep It Fresh
8. Can You Remember?
9. Madrid Moment
10. Episode Complete

The listening passes remain inside Watch Carlos. The former standalone Your Turn and Today’s Mission screens are not routes or progress steps. Their useful guided-speaking content lives in Talk with Carlos, and the mission outcome appears on Episode Complete.

## Progress contract

- `lessonFlowVersion` is `3`.
- `rendererStepId` is the stable restoration key; `rendererStep` remains as a compatibility index.
- Removed IDs (`conversation`, `your-turn`, and `mission`) resolve to `speaking`.
- Episode Opening is `0/10` and `0%`.
- Madrid Moment is `80%`; Episode Complete is `100%`.
- Replaying a completed episode resets to `story` without revoking earned rewards or completion.

## Shared behavior contract

- Audio is coordinated by the global audio controller and stops during navigation.
- Pronunciation and guided speaking use the same lesson recording controller and recovery states.
- Carlos uses approved character assets; learner portraits resolve through the shared profile avatar helper.
- Saved Words, Saved Questions, and Needs Practice are persistent Practice collections.
- Secondary heroes use one shared structure with section-specific crops.

## Freeze validation

Before release, run `scripts/validate-season1.ps1`, JavaScript syntax checks, `git diff --check`, and mobile-width checks. Physical iPhone Safari remains required for microphone permission, browser-chrome resizing, sticky positioning, and gesture verification.
