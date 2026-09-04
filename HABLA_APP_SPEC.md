# Habla App Specification

## 1. Product Purpose

Habla is a conversational Spanish-learning app designed to help English speakers become confident speaking with family, friends, and people in real-world situations.

Primary differentiator:
Carlos, an AI tutor who understands the learner's current lesson, level, goals, relevant regional context, and learning history.

All lesson content and Carlos behavior must follow `HABLA_TEACHING_PHILOSOPHY.md`. Characters, relationships, locations, and course-story continuity must follow `HABLA_CANON.md`.

---

## 2. Core Navigation

Habla has five main tabs:

1. Home
2. Carlos
3. Learn
4. Practice
5. Me

Each tab has one primary purpose:

- Home: Tell the learner what to do next.
- Carlos: Hold a Spanish conversation.
- Learn: Progress through structured lessons.
- Practice: Review specific skills and topics.
- Me: View progress and manage preferences.

---

## 3. First-Time User Flow

1. Splash screen
2. Welcome screen
3. Meet Carlos
4. Choose learning goal
5. Choose daily study target
6. Optional placement check
7. Open Home

First-time setup is saved and should not repeat unless the profile is reset.

---

## 4. Returning User Flow

When the learner opens Habla:

1. Load saved profile and progress.
2. Determine the current unlocked incomplete lesson.
3. Load today's mission.
4. Show the Home page.
5. Highlight the next recommended action.

Home should never leave the learner wondering what to do next.

---

## 5. Home Page

### Purpose

Show the most important next action and a concise summary of progress.

### Sections

1. Greeting and Carlos hero
2. Today's lesson
3. Quick Practice
4. Progress summary
5. Carlos tip
6. Ask Carlos
7. Bottom navigation

### Start Lesson

- Opens the current lesson.
- Resumes at the first incomplete section.
- Does not restart completed lesson sections.

### Review Lesson

Available only when a lesson is complete.

Review options:

- Vocabulary
- Grammar
- Quiz
- Pronunciation
- Carlos conversation

Reviewing a completed lesson does not award the full completion XP again.

### Quick Practice

Buttons open Practice with a topic already selected.

Mappings:

- Greetings → greetings
- Family → family
- Restaurants → food-restaurants
- Travel → travel
- Shopping → shopping
- Work → work
- Small Talk → phrases
- Free Chat → Carlos conversation

---

## 6. Learn Page

### Purpose

Display the structured curriculum and lesson progression.

### Course Structure

A1:
- Chapter 1: Lessons 1–10
- Chapter 2: Lessons 11–20
- Chapter 3: Lessons 21–30

Future:
- A2
- B1
- B2

### Lesson States

- Locked
- Available
- In Progress
- Completed

### Progression Rules

- Lesson 1 starts unlocked.
- Completing a lesson unlocks the next lesson.
- Completed lessons remain reviewable.
- Locked lessons cannot be started.
- Full lesson XP is awarded only once.

### Learn Tabs

- Lessons
- Grammar
- Culture
- Vocabulary

Changing tabs preserves the selected lesson.

---

## 7. Lesson Flow

Every lesson follows this order:

1. Introduction
2. Vocabulary
3. Grammar
4. Dialogue
5. Listening
6. Pronunciation
7. Quiz
8. Carlos Challenge
9. Summary
10. Completion

### Lesson Introduction

Shows:

- Lesson title
- Objective
- Artwork
- Estimated time
- XP reward
- What the learner will learn

### Vocabulary

- Group vocabulary into useful categories.
- Show Spanish, English, example, and audio.
- Include natural or regional alternatives only when useful.
- Completion requires viewing required vocabulary and completing a short recognition check.

### Grammar

Each grammar topic contains:

- Simple explanation
- Spanish example
- Matching English translation
- Common mistake
- Mini exercise

Each lesson introduces no more than one new grammar concept. The communication situation comes first; grammar explains the pattern after the learner sees it in context.

### Dialogue

- Realistic conversation using current lesson content.
- Full audio and line-by-line audio.
- Optional translation.
- Short comprehension questions.

### Listening

Exercise types:

- Listen and choose meaning
- Listen and choose phrase
- Fill in missing word
- Slow and normal playback

### Pronunciation

Initial version:

- Hear phrase
- Record phrase
- Playback recording
- Retry
- Mark complete

Future version:

- AI pronunciation feedback
- Specific sound correction
- Confidence feedback

### Quiz

- At least 15 questions.
- Correct answer order must be randomized.
- Distractors must be plausible.
- Include mixed question types.
- Difficulty increases gradually.
- Explain incorrect answers.
- Recommended pass score: 80%.
- Learner may retry missed questions.

### Carlos Challenge

- Uses the current lesson's vocabulary and grammar.
- Has explicit completion goals.
- Carlos stays at the learner's level.
- Carlos corrects only important mistakes.
- Carlos provides English support when needed.
- Challenge completes when the goals are met.

### Lesson Completion

When complete:

- Mark lesson complete.
- Award XP once.
- Update mission progress.
- Update streak.
- Evaluate achievements.
- Unlock next lesson.
- Show summary and next action.

---

## 8. Practice Page

### Purpose

Allow focused review outside the main lesson flow.

### Modes

- Quiz
- Flashcards
- Pronunciation
- Conversation

### Topics

- Greetings
- Family
- Restaurants
- Travel
- Shopping
- Work
- Small Talk
- Numbers
- Other completed lesson topics

### Content Rules

Practice may use:

- Completed lessons
- Current lesson
- Previously encountered content

Practice must not use locked lesson content.

### Topic Navigation

When a topic is selected from Home, Practice opens with that topic already active.

---

## 9. Carlos Page

### Purpose

Provide a focused AI tutoring conversation.

### Interface

- Carlos portrait
- Conversation history
- Chat input
- Microphone
- Send button
- Optional translation controls
- Suggested prompts

### Carlos Knows

- Learner name
- Current level
- Current lesson
- Completed lessons
- Learning goal
- Relevant regional context when useful
- Recent mistakes
- Vocabulary already introduced

### Carlos Teaching Rules

- Spanish first.
- Use English only when useful.
- Stay at the learner's level.
- Keep replies concise.
- Correct one important mistake at a time.
- Celebrate successful communication before correcting accuracy.
- Ask natural follow-up questions.
- Avoid long grammar lectures.
- Never invent progress.
- Never complete a lesson without the required goals being met.

---

## 10. Profile Page

### Purpose

Show progress first and settings second.

### Progress

- Current level
- XP
- Streak
- Lessons completed
- Study time
- Words practiced
- Speaking time
- Achievements
- Next milestone

### Editable Preferences

- Learning goal
- Daily target
- Profile name
- Notifications

---

## 11. XP Rules

Example XP allocation:

- Vocabulary: 5 XP
- Grammar: 5 XP
- Dialogue: 5 XP
- Listening: 10 XP
- Pronunciation: 10 XP
- Quiz: 15 XP
- Carlos Challenge: 10 XP
- Lesson completion bonus: remaining lesson reward

Rules:

- Total XP must not exceed the lesson's configured reward.
- Full lesson XP is awarded only once.
- Review sessions may award smaller XP.
- XP changes must update Home and Profile immediately.

---

## 12. Daily Mission Rules

- One mission per calendar day.
- Mission should complete automatically from real activity.
- Mission types:
  - Complete a quiz
  - Practice vocabulary
  - Practice pronunciation
  - Speak with Carlos
  - Finish a lesson section
- Mission reward is awarded only once.

---

## 13. Streak Rules

A streak increases when the learner completes one meaningful activity during the day.

Meaningful activities include:

- Finish a lesson section
- Complete a quiz
- Complete daily mission
- Complete a Carlos conversation
- Complete a practice session

Opening the app alone does not count.

---

## 14. Achievement Rules

Achievements unlock automatically and only once.

Examples:

- First XP
- First lesson
- First Carlos conversation
- 3-day streak
- 7-day streak
- Perfect quiz
- 100 words practiced
- A1 complete

---

## 15. Saved Progress

Save after every meaningful activity.

Persist:

- Profile
- Current lesson
- Unlocked lessons
- Completed lessons
- Completed lesson sections
- Lesson progress
- XP
- Streak
- Mission state
- Achievements
- Quiz progress
- Practice statistics
- Carlos conversation history

If the learner leaves mid-lesson, resume at the next incomplete activity.

---

## 16. Content Rules

All lesson content must:

- Match the lesson schema.
- Use accurate Spanish and English.
- Avoid duplicate quiz options.
- Use plausible distractors.
- Include natural language.
- Include regional variants only when meaningful.
- Stay appropriate for the learner's level.
- Build on previous lessons.
- Preserve continuity with Carlos and the course journey.
- Begin with one real communication mission.
- Teach one new grammar concept at most.
- Recycle earlier language naturally.
- Use neutral Spanish by default.
- Introduce regional differences only when they are genuinely useful.

---

## 17. UI Rules

Use the Habla Design System.

- Playfair Display for major headings and key numbers.
- Inter for body text, buttons, labels, and navigation.
- 8px spacing system.
- Consistent card radius.
- Consistent button styles.
- Gold for primary actions.
- Green for progress and success.
- Dark premium background.
- Custom icons instead of random emoji.
- No horizontal scrolling.
- Bottom navigation must never cover content.

---

## 18. AI Integration Points

Carlos AI will be added after the app flow and lesson structure are stable.

AI receives:

- Learner profile
- Current lesson
- Current lesson content
- Completed lessons
- Current mission
- Relevant regional context when useful
- Learning goal
- Recent mistakes
- Conversation history

AI must not directly modify progress without validated app logic.

---

## 19. Error and Empty States

Every page must have a safe fallback.

Examples:

- Missing lesson image → gradient placeholder
- Missing lesson content → clear empty state
- AI connection unavailable → friendly offline message
- Microphone unsupported → text input remains usable
- No practice topic selected → default Practice screen
- Course complete → A1 completion state and review options

---

## 20. Definition of Done

A feature is complete only when:

- It matches this specification.
- It works on desktop and mobile.
- It persists after refresh.
- It does not break existing flows.
- It has a clear empty/error state.
- It has no red console errors.
- It uses real app data.
- It follows the Habla Design System.
