# Habla Lesson Schema

Every Habla lesson should follow this standard format.

## Metadata

- `id`: Unique lesson identifier. Use a stable lowercase pattern such as `a1-greetings-01`.
- `title`: Lesson name
- `level`: A1, A2, B1, or B2
- `module`: Course module or topic group
- `estimatedMinutes`: Expected completion time in minutes
- `xpReward`: XP awarded for completion
- `skills`: Vocabulary, grammar, listening, speaking, reading, or writing
- `nextLesson`: The `id` of the recommended next lesson, or `null` if none exists.

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
