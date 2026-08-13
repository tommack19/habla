param(
  [switch]$SkipBranchCheck
)

$ErrorActionPreference = "Stop"

function Fail($message) {
  throw "Habla recovery pass 1: $message"
}

$repoRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
if (-not $repoRoot) {
  Fail "Run this script from inside the Habla repository."
}

Set-Location $repoRoot

$branch = (& git branch --show-current).Trim()
if (-not $SkipBranchCheck -and $branch -ne "recovery/habla-clean") {
  Fail "Expected branch 'recovery/habla-clean' but found '$branch'. Switch branches before running."
}

$lessonPath = Join-Path $repoRoot "js/ui/lesson.js"
if (-not (Test-Path $lessonPath)) {
  Fail "Could not find js/ui/lesson.js."
}

$lesson = Get-Content -Raw -Encoding UTF8 $lessonPath

function Replace-Literal {
  param(
    [string]$Text,
    [string]$Old,
    [string]$New,
    [string]$Label
  )
  if (-not $Text.Contains($Old)) {
    Fail "Could not find expected source block for '$Label'. No changes were written."
  }
  return $Text.Replace($Old, $New)
}

# ---------------------------------------------------------------------------
# 1. Freeze Lesson 1 as the canonical recovery lesson.
# ---------------------------------------------------------------------------

$oldVersion = @'
const recordedLineUrls = new WeakMap();
const speakingRecordingUrls = new Map();
const LESSON_FLOW_VERSION = 2;
'@

$newVersion = @'
const recordedLineUrls = new WeakMap();
const speakingRecordingUrls = new Map();
const LESSON_FLOW_VERSION = 3;
const CANONICAL_LESSON_ID = "a1-lesson-01-greetings";
'@

$lesson = Replace-Literal $lesson $oldVersion $newVersion "lesson flow version"

# ---------------------------------------------------------------------------
# 2. Count Episode Complete as screen 10 for Lesson 1.
#    Other lessons keep their existing progress behavior until Lesson 1 is approved.
# ---------------------------------------------------------------------------

$oldProgress = @'
  const steps = buildLessonSteps(lesson);
  const stepIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  const step = steps[stepIndex];
  const visibleStepCount = steps.filter(item => !item.legacyCombined).length;
  const visibleStepIndex = Math.max(
    0,
    steps.slice(0, stepIndex + 1).filter(item => !item.legacyCombined).length - 1,
  );
  const isReplay = Boolean(progress.completed && progress.replayStartedAt && !progress.showCompletion);
  const completedStepCount = step?.type === "story" ? 0 : visibleStepIndex;
  const percent = progress.completed && !isReplay
    ? 100
    : Math.round((completedStepCount / Math.max(visibleStepCount, 1)) * 100);
'@

$newProgress = @'
  const steps = buildLessonSteps(lesson);
  const stepIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  const step = steps[stepIndex];
  const visibleFlowStepCount = steps.filter(item => !item.legacyCombined).length;
  const visibleStepIndex = Math.max(
    0,
    steps.slice(0, stepIndex + 1).filter(item => !item.legacyCombined).length - 1,
  );
  const isCanonicalLesson = lesson.id === CANONICAL_LESSON_ID;
  const displayedStepCount = isCanonicalLesson ? visibleFlowStepCount + 1 : visibleFlowStepCount;
  const isReplay = Boolean(progress.completed && progress.replayStartedAt && !progress.showCompletion);
  const completedStepCount = step?.type === "story" ? 0 : visibleStepIndex;
  const percent = progress.completed && !isReplay
    ? 100
    : Math.round((completedStepCount / Math.max(displayedStepCount, 1)) * 100);
'@

$lesson = Replace-Literal $lesson $oldProgress $newProgress "Lesson 1 progress denominator"
$lesson = Replace-Literal $lesson `
  '${renderLessonHeader(lesson, step, visibleStepIndex, visibleStepCount, percent, progress)}' `
  '${renderLessonHeader(lesson, step, visibleStepIndex, displayedStepCount, percent, progress)}' `
  "Lesson 1 header screen count"

# ---------------------------------------------------------------------------
# 3. Replace the flow builder/migration block.
#    Lesson 1 now has only the approved learner-facing screens.
#    Messages, choice, listening pass, and old conversation/mission positions
#    are migration-only and can no longer appear as standalone Lesson 1 pages.
# ---------------------------------------------------------------------------

$flowPattern = '(?s)function buildLessonSteps\(lesson, \{ includeRemovedConversation = false \} = \{\}\) \{.*?\r?\n\}\r?\n\r?\nfunction migrateRemovedConversationStep\(lesson, progress\) \{.*?\r?\n\}\r?\n\r?\n(?=function renderLessonHeader)'

$newFlow = @'
function buildLessonSteps(lesson) {
  const isCanonicalLesson = lesson.id === CANONICAL_LESSON_ID;
  const steps = [{
    id: "story",
    label: isCanonicalLesson ? "Episode Opening" : "Introduction",
    type: "story",
  }];
  const dialogue = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  const messageThread = dialogue.find(scene => scene.presentation?.type === "messageThread");
  const standardDialogue = dialogue.find(scene => scene !== messageThread);

  // Lesson 1 recovery rule:
  // message/choice/listening content may support the canonical screens, but none
  // of them may create an extra learner-facing page.
  if (!isCanonicalLesson && messageThread) {
    steps.push({
      id: "messages",
      label: "A Message from Carlos",
      type: "dialogue",
      data: messageThread,
      legacyCombined: true,
    });
  }
  if (!isCanonicalLesson && lesson.learnerChoices?.options?.length) {
    steps.push({ id: "choice", label: "Choose the Moment", type: "choice" });
  }

  if (lesson.vocabulary?.length) steps.push({ id: "vocabulary", label: "Words You’ll Need", type: "vocabulary" });
  if (lesson.grammar) steps.push({ id: "grammar", label: "Carlos’ Advice", type: "grammar" });
  if (standardDialogue) steps.push({ id: "dialogue", label: "Watch Carlos", type: "dialogue", data: standardDialogue });

  // On the canonical Lesson 1 flow, the dialogue screen itself is the
  // "Watch Carlos" experience. The old standalone listening pass is removed.
  if ((lesson.listening || lesson.listeningPhrases?.length) && (!isCanonicalLesson || !standardDialogue)) {
    steps.push({
      id: "listening",
      label: "Watch Carlos",
      type: "listening",
      data: standardDialogue || messageThread,
      legacyCombined: Boolean(standardDialogue),
    });
  }

  if (lesson.pronunciation || lesson.pronunciationExercises?.length) {
    steps.push({ id: "pronunciation", label: "Say It Naturally", type: "pronunciation" });
  }
  if (lesson.speaking || lesson.speakingChallenge?.length) {
    steps.push({ id: "speaking", label: "Talk with Carlos", type: "speaking" });
  }
  if (getFlashcardItems(lesson).length) {
    steps.push({ id: "flashcards", label: "Keep It Fresh", type: "flashcards" });
  }
  if (lesson.quiz?.length) {
    steps.push({ id: "quiz", label: "Can You Remember?", type: "quiz" });
  }
  if (lesson.culture || lesson.worldBuilding?.length || lesson.livingWorldInteractions?.length) {
    steps.push({ id: "culture", label: "Madrid Moment", type: "culture" });
  }
  return steps;
}

function buildLegacyLessonSteps(lesson, { includeRemovedConversation = false } = {}) {
  const steps = [{ id: "story", label: "Introduction", type: "story" }];
  const dialogue = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  const messageThread = dialogue.find(scene => scene.presentation?.type === "messageThread");
  if (messageThread) {
    steps.push({
      id: "messages",
      label: "A Message from Carlos",
      type: "dialogue",
      data: messageThread,
      legacyCombined: true,
    });
  }
  if (lesson.learnerChoices?.options?.length) steps.push({ id: "choice", label: "Choose the Moment", type: "choice" });
  if (lesson.vocabulary?.length) steps.push({ id: "vocabulary", label: "Words You’ll Need", type: "vocabulary" });
  if (lesson.grammar) steps.push({ id: "grammar", label: "Carlos’ Advice", type: "grammar" });
  const standardDialogue = dialogue.find(scene => scene !== messageThread);
  if (standardDialogue) steps.push({ id: "dialogue", label: "Watch Carlos", type: "dialogue", data: standardDialogue });
  if (lesson.listening || lesson.listeningPhrases?.length) {
    steps.push({
      id: "listening",
      label: "Watch Carlos",
      type: "listening",
      data: standardDialogue || messageThread,
      legacyCombined: Boolean(standardDialogue),
    });
  }
  if (lesson.pronunciation || lesson.pronunciationExercises?.length) steps.push({ id: "pronunciation", label: "Say It Naturally", type: "pronunciation" });
  if (lesson.speaking || lesson.speakingChallenge?.length) steps.push({ id: "speaking", label: "Talk with Carlos", type: "speaking" });
  if (getFlashcardItems(lesson).length) steps.push({ id: "flashcards", label: "Keep It Fresh", type: "flashcards" });
  if (lesson.quiz?.length) steps.push({ id: "quiz", label: "Can You Remember?", type: "quiz" });
  if (includeRemovedConversation && (lesson.miniConversation || lesson.realLifeMission)) {
    steps.push({ id: "conversation", label: "Removed conversation", type: "conversation" });
  }
  if (lesson.culture || lesson.worldBuilding?.length || lesson.livingWorldInteractions?.length) {
    steps.push({ id: "culture", label: "Madrid Moment", type: "culture" });
  }
  return steps;
}

function mapLegacyStepId(lesson, stepId) {
  if (lesson.id !== CANONICAL_LESSON_ID) {
    return stepId === "conversation" ? "speaking" : stepId;
  }

  if (stepId === "messages") return "story";
  if (stepId === "choice") return "vocabulary";
  if (stepId === "listening") return "dialogue";
  if (stepId === "conversation" || stepId === "your-turn" || stepId === "mission") return "speaking";
  return stepId;
}

function migrateRemovedConversationStep(lesson, progress) {
  const previousVersion = Number(progress.lessonFlowVersion || 0);
  if (previousVersion >= LESSON_FLOW_VERSION) return progress;

  const newSteps = buildLessonSteps(lesson);
  const legacySteps = buildLegacyLessonSteps(lesson, {
    includeRemovedConversation: previousVersion < 2,
  });
  const oldIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(legacySteps.length - 1, 0));
  const oldStep = legacySteps[oldIndex];
  const targetId = mapLegacyStepId(lesson, oldStep?.id);
  let mappedIndex = newSteps.findIndex(step => step.id === targetId);
  if (mappedIndex < 0) mappedIndex = 0;

  const migrated = {
    ...progress,
    lessonFlowVersion: LESSON_FLOW_VERSION,
    rendererStep: mappedIndex,
  };
  const hasSavedSession = Boolean(
    progress.updatedAt
      || progress.completed
      || progress.completedSections?.length
      || Number(progress.rendererStep || 0),
  );
  if (hasSavedSession) {
    updateLessonProgress(lesson.id, {
      lessonFlowVersion: LESSON_FLOW_VERSION,
      rendererStep: mappedIndex,
    });
  }
  return migrated;
}

'@

$regex = [regex]::new($flowPattern)
$matches = $regex.Matches($lesson)
if ($matches.Count -ne 1) {
  Fail "Expected exactly one lesson-flow block, found $($matches.Count). No changes were written."
}
$lesson = $regex.Replace($lesson, $newFlow, 1)

# ---------------------------------------------------------------------------
# 4. Remove the old standalone-listening gate from canonical Lesson 1.
# ---------------------------------------------------------------------------

$oldControlBlock = @'
  const conversationBlocked = (step?.type === "dialogue" || step?.type === "listening")
    && Boolean(lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete;
'@

$newControlBlock = @'
  const conversationBlocked = lesson.id !== CANONICAL_LESSON_ID
    && (step?.type === "dialogue" || step?.type === "listening")
    && Boolean(lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete;
'@

$lesson = Replace-Literal $lesson $oldControlBlock $newControlBlock "lesson-control listening gate"

$oldAdvanceBlock = @'
  if ((step.type === "dialogue" || step.type === "listening")
    && (lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete) return;
'@

$newAdvanceBlock = @'
  if (lesson.id !== CANONICAL_LESSON_ID
    && (step.type === "dialogue" || step.type === "listening")
    && (lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete) return;
'@

$lesson = Replace-Literal $lesson $oldAdvanceBlock $newAdvanceBlock "advance listening gate"

# Write lesson.js only after every expected source block has been found.
Set-Content -Path $lessonPath -Value $lesson -Encoding UTF8

# ---------------------------------------------------------------------------
# 5. Add a product contract so we do not drift into another patch cycle.
# ---------------------------------------------------------------------------

$contractPath = Join-Path $repoRoot "content/A1/LESSON_01_RECOVERY_CONTRACT.md"
$contract = @'
# Lesson 1 recovery contract

Lesson 1 is rebuilt and approved before the same patterns are propagated to later lessons.

## Canonical learner flow

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

There are no standalone **Your Turn**, **Today’s Mission**, **Carlos Challenge**, **A Message from Carlos**, **Choose the Moment**, or separate listening-pass screens in the approved Lesson 1 flow. Useful content from those concepts must be folded into one of the ten canonical screens instead of creating another progress step.

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
- New visual experiments stay out of Lessons 2–10 until Lesson 1 is approved.

## Recovery sequence

1. Freeze and simplify Lesson 1 structure.
2. Normalize Lesson 1 card and CTA styling in `css/lesson.css`.
3. Finish the dedicated Talk with Carlos experience.
4. Validate progress, Back/Next navigation, refresh restoration, audio, and microphone states.
5. Review Lesson 1 on an actual phone.
6. Only after approval, propagate the system to Lessons 2–10 and then Practice.
'@
Set-Content -Path $contractPath -Value $contract -Encoding UTF8

Write-Host ""
Write-Host "Recovery pass 1 applied." -ForegroundColor Green
Write-Host "Changed:"
Write-Host "  - js/ui/lesson.js"
Write-Host "  - content/A1/LESSON_01_RECOVERY_CONTRACT.md"
Write-Host ""
Write-Host "Lesson 1 learner-facing flow is now:"
Write-Host "  Opening -> Vocabulary -> Carlos' Advice -> Watch Carlos -> Say It Naturally"
Write-Host "  -> Talk with Carlos -> Flashcards -> Quiz -> Madrid Moment -> Episode Complete"
Write-Host ""

if (Get-Command node -ErrorAction SilentlyContinue) {
  Write-Host "Running JavaScript syntax check..."
  & node --check $lessonPath
  if ($LASTEXITCODE -ne 0) {
    Fail "node --check failed. Review the error before committing."
  }
  Write-Host "JavaScript syntax check passed." -ForegroundColor Green
} else {
  Write-Host "Node was not found, so the syntax check was skipped." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Running git diff --check..."
& git diff --check
if ($LASTEXITCODE -ne 0) {
  Fail "git diff --check found whitespace errors."
}
Write-Host "git diff --check passed." -ForegroundColor Green

Write-Host ""
Write-Host "Review with:"
Write-Host "  git diff -- js/ui/lesson.js content/A1/LESSON_01_RECOVERY_CONTRACT.md"
Write-Host ""
Write-Host "If it looks right, commit with:"
Write-Host '  git add js/ui/lesson.js content/A1/LESSON_01_RECOVERY_CONTRACT.md'
Write-Host '  git commit -m "Freeze clean Lesson 1 recovery flow"'
Write-Host '  git push'
