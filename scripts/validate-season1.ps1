[CmdletBinding()]
param(
    [switch]$WarningsAsErrors
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$contentRoot = Join-Path $root "content\A1"

$lessonFiles = @(
    "lesson-01-greetings.json",
    "lesson-02-introductions.json",
    "lesson-03-family.json",
    "lesson-04-numbers-time.json",
    "lesson-05-shopping.json",
    "lesson-06-food-drinks.json",
    "lesson-07-travel-basics.json",
    "lesson-08-vacation.json",
    "lesson-09-around-the-house.json",
    "lesson-10-daily-routine.json"
)

$expectedIds = @(
    "a1-lesson-01-greetings",
    "a1-lesson-02-introductions",
    "lesson-03-family",
    "lesson-04-numbers-time",
    "lesson-05-shopping",
    "lesson-06-food-drinks",
    "lesson-07-travel-basics",
    "lesson-08-vacation",
    "lesson-09-around-the-house",
    "lesson-10-daily-routine"
)

$errors = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$lessons = @()

$componentPath = Join-Path $root "js\components\choiceIcons.js"
$choiceIconIds = @()
if (-not (Test-Path -LiteralPath $componentPath)) {
    $errors.Add("Missing centralized choice icon registry")
} else {
    $componentSource = Get-Content -LiteralPath $componentPath -Raw -Encoding UTF8
    $registryEnd = $componentSource.IndexOf("const CHOICE_ICON_ALIASES")
    $registrySource = if ($registryEnd -gt 0) { $componentSource.Substring(0, $registryEnd) } else { $componentSource }
    $choiceIconIds = @([regex]::Matches($registrySource, '(?m)^\s*(?:"([a-z][a-z0-9-]*)"|([a-z][a-z0-9-]*)):\s*`') | ForEach-Object {
        if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
    } | Where-Object { $_ -ne "choice" } | Sort-Object -Unique)
    if ($choiceIconIds.Count -eq 0) {
        $errors.Add("Centralized choice icon registry contains no semantic icons")
    }
}

function Add-ValidationError([string]$message) {
    $script:errors.Add($message)
}

function Add-ValidationWarning([string]$message) {
    $script:warnings.Add($message)
}

function Has-Text($value) {
    return $null -ne $value -and -not [string]::IsNullOrWhiteSpace([string]$value)
}

function Assert-Text($value, [string]$label, [string]$lessonId) {
    if (-not (Has-Text $value)) {
        Add-ValidationError "${lessonId}: missing $label"
    }
}

function Test-AnswerSet($questions, [string]$label, [string]$lessonId, [bool]$requirePrompt = $true, [bool]$requireExplanation = $false) {
    if ($null -eq $questions) { return }
    $index = 0
    foreach ($question in @($questions)) {
        $index++
        if ($requirePrompt) {
            Assert-Text $question.prompt "$label[$index].prompt" $lessonId
        }
        Assert-Text $question.answer "$label[$index].answer" $lessonId
        $options = @($question.options)
        if ($options.Count -gt 0) {
            $matches = @($options | Where-Object { [string]$_ -ceq [string]$question.answer }).Count
            if ($matches -ne 1) {
                Add-ValidationError "${lessonId}: $label[$index] answer must occur exactly once in options (found $matches)"
            }
            if (@($options | Group-Object | Where-Object Count -gt 1).Count -gt 0) {
                Add-ValidationError "${lessonId}: $label[$index] contains duplicate options"
            }
        }
        if ($requireExplanation) {
            Assert-Text $question.explanation "$label[$index].explanation" $lessonId
        }
    }
}

for ($i = 0; $i -lt $lessonFiles.Count; $i++) {
    $file = Join-Path $contentRoot $lessonFiles[$i]
    if (-not (Test-Path -LiteralPath $file)) {
        Add-ValidationError "Missing lesson file: $($lessonFiles[$i])"
        continue
    }

    try {
        $raw = Get-Content -LiteralPath $file -Raw -Encoding UTF8
        $lesson = $raw | ConvertFrom-Json
    } catch {
        Add-ValidationError "$($lessonFiles[$i]): invalid JSON - $($_.Exception.Message)"
        continue
    }

    $topLevelKeys = @([regex]::Matches($raw, '(?m)^  "([^"]+)"\s*:') | ForEach-Object { $_.Groups[1].Value })
    foreach ($duplicateKey in @($topLevelKeys | Group-Object | Where-Object Count -gt 1)) {
        Add-ValidationError "$($lessonFiles[$i]): duplicate top-level key '$($duplicateKey.Name)'"
    }
    $allowedTokens = @("learnerName", "learnerCity", "learnerCountry", "learnerCountryEnglish", "questionCount", "questionNumber")
    foreach ($tokenMatch in [regex]::Matches($raw, '\{\{([A-Za-z0-9_]+)\}\}')) {
        if ($allowedTokens -cnotcontains $tokenMatch.Groups[1].Value) {
            Add-ValidationError "$($lessonFiles[$i]): unknown personalization token '$($tokenMatch.Value)'"
        }
    }

    $lessons += $lesson
    $id = [string]$lesson.id
    if ($id -cne $expectedIds[$i]) {
        Add-ValidationError "$($lessonFiles[$i]): stable ID changed; expected '$($expectedIds[$i])', found '$id'"
    }

    foreach ($field in @("id", "contentVersion", "title", "image", "level", "module", "estimatedMinutes", "story", "carlosIntroduction", "microCliffhanger", "passportStamp", "achievement")) {
        if ($null -eq $lesson.$field -or ($lesson.$field -is [string] -and -not (Has-Text $lesson.$field))) {
            Add-ValidationError "${id}: missing required field '$field'"
        }
    }

    if ([string]$lesson.level -cne "A1") {
        Add-ValidationError "${id}: Season 1 level must be A1"
    }
    if (@($lesson.objectives).Count -eq 0 -and @($lesson.canDo).Count -eq 0) {
        Add-ValidationError "${id}: needs objectives or canDo outcomes"
    }
    if (@($lesson.vocabulary).Count -lt 15 -or @($lesson.vocabulary).Count -gt 30) {
        Add-ValidationWarning "${id}: vocabulary count is $(@($lesson.vocabulary).Count); production target is 15-30"
    }
    if (@($lesson.quiz).Count -lt 15 -or @($lesson.quiz).Count -gt 20) {
        Add-ValidationError "${id}: quiz count is $(@($lesson.quiz).Count); expected 15-20"
    }

    $expectedPrerequisite = if ($i -eq 0) { "" } else { $expectedIds[$i - 1] }
    $actualPrerequisite = [string]$lesson.prerequisiteLesson
    if ($actualPrerequisite -cne $expectedPrerequisite) {
        Add-ValidationError "${id}: prerequisiteLesson should be '$expectedPrerequisite', found '$actualPrerequisite'"
    }
    $expectedNext = if ($i -lt 9) { $expectedIds[$i + 1] } else { "lesson-11-weather" }
    if ([string]$lesson.nextLesson -cne $expectedNext) {
        Add-ValidationError "${id}: nextLesson should be '$expectedNext', found '$($lesson.nextLesson)'"
    }

    $imagePath = Join-Path $root ([string]$lesson.image -replace "/", "\")
    if (-not (Test-Path -LiteralPath $imagePath)) {
        Add-ValidationError "${id}: missing artwork '$($lesson.image)'"
    }
    if ([string]$lesson.image -match "\.png\.png$") {
        Add-ValidationError "${id}: artwork has a duplicate .png extension"
    }

    if ($raw -cmatch '\bTODO\b' -or $raw -match 'Lorem ipsum|placeholder copy') {
        Add-ValidationError "${id}: contains placeholder content"
    }
    if ($raw -match 'Optional Discovery') {
        Add-ValidationWarning "${id}: contains the internal phrase 'Optional Discovery'"
    }

    Test-AnswerSet $lesson.quiz "quiz" $id $true $true
    Test-AnswerSet $lesson.listening.comprehension "listening.comprehension" $id $true $false
    Test-AnswerSet $lesson.listening.items "listening.items" $id $false $false

    $choiceIds = @{}
    $choices = if ($null -ne $lesson.learnerChoices -and $null -ne $lesson.learnerChoices.options) { @($lesson.learnerChoices.options) } else { @() }
    foreach ($choice in $choices) {
        foreach ($field in @("id", "icon", "label", "learnerSpanish", "learnerEnglish", "carlosSpanish", "carlosEnglish")) {
            Assert-Text $choice.$field "learnerChoices.options.$field" $id
        }
        if ($choiceIds.ContainsKey([string]$choice.id)) {
            Add-ValidationError "${id}: duplicate learner choice ID '$($choice.id)'"
        } else {
            $choiceIds[[string]$choice.id] = $true
        }
        if ($choiceIconIds -cnotcontains [string]$choice.icon) {
            Add-ValidationError "${id}: learner choice '$($choice.id)' uses unknown centralized icon '$($choice.icon)'"
        }
    }
    if ($null -ne $lesson.memory.onChoice -and $choices.Count -eq 0) {
        Add-ValidationError "${id}: memory.onChoice exists without learner choices"
    }
    if ($null -ne $lesson.memory.onChoice -and [string]$lesson.memory.onChoice.valueFrom -cne "choice.id") {
        Add-ValidationError "${id}: memory.onChoice must record the explicit choice.id"
    }

    $discoveryIds = @{}
    $discoveries = if ($null -ne $lesson.livingWorldInteractions) { @($lesson.livingWorldInteractions) } else { @() }
    foreach ($discovery in $discoveries) {
        foreach ($field in @("id", "title", "prompt", "carlosSpanish", "carlosEnglish")) {
            Assert-Text $discovery.$field "livingWorldInteractions.$field" $id
        }
        if ($discoveryIds.ContainsKey([string]$discovery.id)) {
            Add-ValidationError "${id}: duplicate Living World interaction ID '$($discovery.id)'"
        } else {
            $discoveryIds[[string]$discovery.id] = $true
        }
    }

    Assert-Text $lesson.passportStamp.id "passportStamp.id" $id
    Assert-Text $lesson.passportStamp.title "passportStamp.title" $id
    Assert-Text $lesson.passportStamp.city "passportStamp.city" $id
    Assert-Text $lesson.achievement.id "achievement.id" $id
    Assert-Text $lesson.microCliffhanger.english "microCliffhanger.english" $id

    if (@($lesson.listening.playbackSpeeds) -notcontains "natural" -or @($lesson.listening.playbackSpeeds) -notcontains "slow") {
        Add-ValidationError "${id}: listening must support natural and slow playback"
    }
    foreach ($line in @($lesson.listening.transcript)) {
        Assert-Text $line.spanish "listening.transcript.spanish" $id
        Assert-Text $line.english "listening.transcript.english" $id
    }
}

$duplicateLessonIds = @($lessons | Group-Object id | Where-Object Count -gt 1)
foreach ($duplicate in $duplicateLessonIds) {
    Add-ValidationError "Duplicate lesson ID '$($duplicate.Name)'"
}
foreach ($duplicate in @($lessons | Group-Object { $_.passportStamp.id } | Where-Object Count -gt 1)) {
    Add-ValidationError "Duplicate passport stamp ID '$($duplicate.Name)'"
}
foreach ($duplicate in @($lessons | Group-Object { $_.achievement.id } | Where-Object Count -gt 1)) {
    Add-ValidationError "Duplicate achievement ID '$($duplicate.Name)'"
}

$rendererPath = Join-Path $root "js\ui\lesson.js"
if (-not (Test-Path -LiteralPath $rendererPath)) {
    Add-ValidationError "Missing lesson renderer"
} else {
    $rendererSource = Get-Content -LiteralPath $rendererPath -Raw -Encoding UTF8
    if ($rendererSource -notmatch 'renderChoiceIcon\(choice\.icon \|\| choice\.id\)') {
        Add-ValidationError "Lesson renderer must use renderChoiceIcon(choice.icon || choice.id)"
    }
}

Write-Host "Habla Season 1 validation" -ForegroundColor Cyan
Write-Host "Lessons parsed: $($lessons.Count)/10"
Write-Host "Choice icons registered: $($choiceIconIds.Count)"

foreach ($warning in $warnings) {
    Write-Host "WARNING: $warning" -ForegroundColor Yellow
}
foreach ($validationError in $errors) {
    Write-Host "ERROR: $validationError" -ForegroundColor Red
}

if ($errors.Count -gt 0 -or ($WarningsAsErrors -and $warnings.Count -gt 0)) {
    Write-Host "FAILED: $($errors.Count) error(s), $($warnings.Count) warning(s)." -ForegroundColor Red
    exit 1
}

Write-Host "PASSED: 0 errors, $($warnings.Count) warning(s)." -ForegroundColor Green
