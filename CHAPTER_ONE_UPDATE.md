# Chapter One integration on the cinematic Lesson 2 branch

Lessons 2–10 use the shared narrative renderer, green and gold styling, scene motion, and focused interaction pattern established by Lesson 1. This integration preserves the current `feature/lesson2-cinematic-flow` implementation rather than replacing it with the older package base.

The shared flow is Arrival → Encounter → Pattern → Rehearsal → Speak → Conversation → Culture → Completion. Each episode has its own scene copy, teaching examples, rehearsal, bilingual conversation, cultural moment, and handoff.

| Lesson | Episode | Communication outcome |
| --- | --- | --- |
| 2 | A New Friend | Meet Ana; exchange names, origins, and current homes. |
| 3 | Family Dinner | Identify Carlos’s family and ask about family relationships. |
| 4 | See You at Ten | Turn Carlos’s message into a Saturday market plan. |
| 5 | Fresh Fruit and Fresh Spanish | Choose a product, ask for it, check the price, and finish the purchase. |
| 6 | Coffee Break | Choose a drink, customize it, order food, and ask for the bill. |
| 7 | Walking Through Madrid | Ask for places, confirm route cues, and find Plaza Mayor. |
| 8 | An Afternoon at Home | Describe a selected room and locate familiar objects. |
| 9 | A Typical Day | Describe a real day and choose a genuine Spanish practice time. |
| 10 | Weekend Adventure | Connect the chapter’s language across one Madrid day, then reveal the Granada invitation. |

## Behavior

- The nine updated lessons contain 47 rehearsal turns; Lesson 2 retains its separate three-stage Ana conversation. Model playback supports normal and slow speeds, with English support, speaking hints, recording, and text replies.
- Existing market, drink, room, and practice-time choices appear in the encounter. Relevant teaching examples, rehearsal answers, and speaking prompts follow the chosen branch.
- Optional vocabulary reference and Living World discoveries remain available. Review buttons open the correct lesson’s existing flashcards, pronunciation, quiz, and conversation content.
- Lesson 10 introduces no new grammar. It retains six connected mini-missions, the Madrid chapter reward, and Elena’s Granada postcard. Madrid artwork is used until the next-chapter reveal.
- Conversation practice is guided and device-local. Open-ended AI tutoring remains on Carlos’s tutor page and uses the server setup in `AI_TUTOR_SETUP.md`.

## Compatibility

Lesson 1’s JSON is unchanged. Lesson IDs, prerequisite/next links, quiz answers, canonical dialogue, rewards, explicit story-memory rules, existing branch IDs, and the chapter ceremony are preserved. The plural price question in Lesson 5 is introduced as a useful fixed phrase for plural choices.

Saved sessions migrate once to the matching narrative screen. Completed lessons and XP remain complete; old exercise attempts reset because the prompts have changed. Replays do not award XP again. Skipping speech keeps the completion wording honest about practice still available.

The update extends the existing `lesson.css` and shared renderer; it adds no new framework or UI dependency. The service-worker cache advances to `habla-v32-chapter-one-cinematic-tutor` and includes all ten chapter JSON files and the tutor client modules. The existing artwork cache, network-first app resources, and route/offline handlers are preserved.

## Verification and release

Run:

```sh
node --test tests/chapter-one-lessons.test.mjs tests/carlos-tutor.test.mjs
npx wrangler pages functions build functions --outdir /tmp/habla-functions-build
```

The 23 package cases plus two Lesson 2 preservation cases pass (17 tutor, 8 chapter). Coverage includes all ten flows, every choice branch, legacy migration, reward idempotence, exact review routing, profile substitution, assets, tutor contracts, existing version-7 sessions, and completion-gated Lesson 2 Practice. Client bundling and Cloudflare Functions compilation pass. The existing PowerShell Season 1 gate passes with 0 errors and 0 warnings.

Browser validation uses Chromium at 390px and 720px. Home, Learn, Lessons 1/2/3/10, Practice, and Carlos load and retain their routes after refresh, without horizontal page overflow or JavaScript errors. Live microphone hardware, provider credentials, latency, and deployed Cloudflare behavior still require preview testing.

All changes are uncommitted on the existing branch. No reset, installer rerun, commit, push, or deployment was performed. Secret setup remains covered by `AI_TUTOR_SETUP.md`.


## Semantic merge decisions

The installer required exact hashes for all affected files. Seven files already had uncommitted production changes, so its refusal protected that work. Package results were reconstructed in a temporary directory for inspection; the checkout was never reset to the package base.

- Lesson 1 JSON, route module, and current motion module are unchanged by this integration.
- Lesson 2 retains its cinematic scenes, artwork, speaker/avatar settings, stable rehearsal IDs, separate Ana conversation stages, version-7 progress contract, typed speaking, completion rewards, and completion-gated Practice. Only optional model/reference/discovery flags and the exact `introductions` review topic were added to its existing JSON.
- The shared renderer retains current scene configuration and adds choice-specific models, examples, speech prompts, explicit discoveries, chapter ceremony/postcard support, and one-time progress migration. Changing a choice resets dependent exercises without changing rewards or story history.
- Lesson 3–10 content matches the package, retaining canonical IDs, quizzes, prerequisites, next links, choices, and rewards. Lesson 10 remains in Madrid until Elena’s Granada postcard.
- Existing files that matched the package base received the reviewed package changes, including Carlos UI/app wiring, server TTS, asset mappings, and secret names. Overlapping renderer/CSS, Practice, schema, and service-worker files were merged with the current work.
- OpenAI calls occur only in Cloudflare Functions. The browser uses `/api/chat`, `/api/transcribe`, `/api/tts`, and `/api/tutor-status`; no secret values were added. `ELEVENLABS_API_KEY` remains required alongside `OPENAI_API_KEY`.
