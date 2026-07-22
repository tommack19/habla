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

## Season 1 content validation

Run the frozen Chapter 1 quality gate before shipping lesson or renderer changes:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\validate-season1.ps1
```

The validator checks Lessons 1–10, progression links, artwork, quiz and listening answers, rewards, cliffhangers, and every data-driven learner-choice icon against the central registry in `js/components/choiceIcons.js`.
