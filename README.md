# Habla 🇪🇸

An AI-powered Spanish tutor designed to help me become conversational through realistic voice conversations.

## Goals

- AI Tutor (Carlos)
- Voice Conversations
- Vocabulary Builder
- Quizzes
- Personalized Learning
- Progress Tracking
- Installable PWA

Built with HTML, CSS, JavaScript, and OpenAI.

## AI tutor setup

See [AI_TUTOR_SETUP.md](AI_TUTOR_SETUP.md) to connect Carlos's conversation and
microphone endpoints on Cloudflare, retain the existing character voice, and
verify the complete tutor flow. AI provider keys belong only in server secrets.

## Season 1 content validation

Run the frozen Chapter 1 quality gate before shipping lesson or renderer changes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-season1.ps1
```

The validator checks Lessons 1–10, progression links, artwork, quiz and listening answers, rewards, cliffhangers, and every data-driven learner-choice icon against the central registry in `js/components/choiceIcons.js`.
