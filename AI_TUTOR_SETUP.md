# Connect Carlos

Carlos now uses a real AI conversation endpoint, microphone transcription, the existing character voice, current-lesson context, gentle corrections, and saved-phrase review. This is a turn-based voice tutor: tap the mic, speak, then tap again to finish. It is not a continuous Realtime voice call.

The existing Cloudflare Pages Functions architecture is preserved. A basic static server or GitHub Pages cannot run these endpoints.

## Activate on the existing Cloudflare Pages project

1. Add `OPENAI_API_KEY` as an **encrypted secret** in Habla's Cloudflare Pages settings. Use an OpenAI API project with billing enabled and access to the models below. Never paste a key into chat, client code, Git, or local storage.
2. Keep the existing `ELEVENLABS_API_KEY` secret for Carlos's character voice. Without it, speech playback uses the device's Spanish voice when available.
3. Add secrets to the Preview environment to test this branch, and to Production when releasing it. Deploy through the existing Git integration or Wrangler, keeping framework preset **None**, no build command, and output directory **`.`**. Functions must be compiled by the Pages deployment; uploading static files alone is insufficient.
4. Open the deployed app, refresh it, and open Carlos. The status should become **Ready**. This confirms configuration, not provider billing or model access; send a real message to verify those.
5. Test a typed reply, voice recording, correction, phrase save, reset during a pending reply, and navigation during recording. Check the mobile layout with the keyboard open.

The repository is configured for **Pages** (`pages_build_output_dir = "."`). If the live app is instead served by a separately managed `workers.dev` Worker, these changes still need to be integrated with that Worker's routing/deployment; simply deploying the static folder to it will not add Functions. Establish the actual hosting target before a production release.

From a configured Codespace or local checkout, the relevant Pages commands are:

```sh
npx wrangler pages secret put OPENAI_API_KEY --project-name habla
npx wrangler pages dev .
```

For local development, create the already-ignored `.dev.vars` file containing the two secret values. Do not commit it. Use the HTTPS forwarded Codespaces URL for microphone access.

## Models and endpoints

| Endpoint | Purpose | Default model |
| --- | --- | --- |
| `POST /api/chat` | Bilingual tutor response and one correction | `gpt-4.1-mini` |
| `POST /api/transcribe` | Spanish, English, or mixed recorded speech | `gpt-4o-mini-transcribe` |
| `POST /api/tts` | Carlos's established voice | Existing ElevenLabs configuration |
| `GET /api/tutor-status` | Configuration readiness only | No model call |

Optional server variables `OPENAI_TUTOR_MODEL` and `OPENAI_TRANSCRIBE_MODEL` override the defaults. The tutor model must support the Responses API and strict structured output; the transcription model must support the existing file transcription request format. The implementation sends `store: false` for Responses. This setting does not eliminate the provider's separate operational/abuse-monitoring retention policies.

## What Carlos remembers

- The profile fields already used by Habla: name, city, country, level, goal, native language, and dialect.
- The current lesson's canonical JSON, including its scene, mission, phrases, and grammar. These files are imported directly; the AI does not rewrite lesson content.
- Explicit story memories and the learner's recorded lesson choice, read through the existing memory module.
- The most recent conversation turns, saved phrases, and corrections tied to text the learner actually sent.

Conversation history, preferences, and corrections are saved **on this device**, matching the current app. There is no new account system or cross-device sync. Reset conversation clears the chat; Clear correction history clears correction memory. Saved phrases remain in Practice. Neither action changes lesson progression, rewards, or story memories. Browser storage can be removed by the user or browser.

The backend receives text transcripts rather than acoustic evidence. Carlos can teach pronunciation and model phrases, but does not score a learner's actual pronunciation. Recording is capped at 45 seconds and 6 MB. Captured audio is sent to OpenAI for transcription; the app does not persist the recording. Generated fast tutor speech bypasses the shared edge cache. Existing lesson audio caching remains available.

## Deployment access and usage controls

The existing app has no user authentication. Same-origin checks protect browser requests but are not authentication. Before exposing a funded tutor endpoint publicly, protect the deployment with the existing access layer (for example, Cloudflare Access) or add authenticated users and enforced quotas. Apply Cloudflare rate limits to chat, transcription, and TTS and configure provider spending controls.

The code limits input/output size, request duration, and chat/transcription requests per IP within an isolate. That in-memory limiter resets and is **not** a global budget or reliable distributed quota. A compatible `HABLA_AI_RATE_LIMITER` binding is used when supplied by the hosting environment; no real resource is provisioned by this change. Configure infrastructure controls for the actual hosting target before wider release.

## Validation

```sh
node --test tests/carlos-tutor.test.mjs
npx wrangler pages functions build functions --outdir /tmp/habla-functions-build
```

The tests mock AI providers: they cover request validation, canonical lesson/profile context, error recovery contracts, correction evidence, transcription, private voice caching, saved phrases, and microphone cancellation. They do not claim to assess real model quality, microphone hardware, browser layout, or latency.

Run the existing Season 1 gate in a PowerShell environment before production integration:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-season1.ps1
```

Complete live browser checks at 390px and desktop widths with actual credentials before marking the release production-ready.

API references: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini), [OpenAI transcription](https://developers.openai.com/api/docs/guides/speech-to-text), [Cloudflare Pages local development](https://developers.cloudflare.com/pages/functions/local-development/), [Wrangler Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/).
