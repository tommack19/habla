import { completeLesson, getActiveLesson } from "../core/content.js";

const PRACTICE_TOPIC_KEY = "habla_selected_practice_topic_v1";
const PRACTICE_TOPICS = {
  greetings: {
    title: "Greetings",
    description: "Practice hellos, goodbyes, introductions, and polite everyday openers.",
    count: "8 / 15",
    icon: "topic-greetings",
    progress: 40,
    xp: 120,
  },
  family: {
    title: "Family",
    description: "Talk naturally about relatives, relationships, and the people close to you.",
    count: "10 / 20",
    icon: "topic-family",
    progress: 52,
    xp: 130,
  },
  "food-restaurants": {
    title: "Restaurants",
    description: "Order food and drinks, ask simple questions, and speak politely with staff.",
    count: "12 / 20",
    icon: "topic-restaurants",
    progress: 48,
    xp: 140,
  },
  travel: {
    title: "Travel",
    description: "Practice airport, hotel, transport, and direction phrases for real trips.",
    count: "14 / 20",
    icon: "topic-travel",
    progress: 44,
    xp: 140,
  },
  shopping: {
    title: "Shopping",
    description: "Ask prices, sizes, quantities, and checkout questions in shops and markets.",
    count: "9 / 15",
    icon: "topic-shopping",
    progress: 42,
    xp: 120,
  },
  work: {
    title: "Work",
    description: "Use simple Spanish for schedules, jobs, meetings, and workplace small talk.",
    count: "8 / 15",
    icon: "topic-work",
    progress: 32,
    xp: 120,
  },
  phrases: {
    title: "Small Talk",
    description: "Build relaxed conversation with useful phrases, follow-ups, and quick replies.",
    count: "11 / 15",
    icon: "topic-smalltalk",
    progress: 58,
    xp: 130,
  },
  conversation: {
    title: "Free Chat",
    description: "Open Carlos and practice any conversation you want in natural Spanish.",
    count: "Unlimited",
    icon: "topic-freechat",
    progress: 0,
    xp: 0,
  },
};

const practiceWords = [
  ["hola", "hello"], ["adiós", "goodbye"], ["gracias", "thank you"], ["por favor", "please"],
  ["buenos días", "good morning"], ["buenas tardes", "good afternoon"], ["buenas noches", "good evening"],
  ["familia", "family"], ["esposa", "wife"], ["hermano", "brother"], ["casa", "house"], ["trabajo", "work"],
  ["agua", "water"], ["café", "coffee"], ["comida", "food"], ["pan", "bread"], ["pollo", "chicken"],
  ["uno", "one"], ["dos", "two"], ["tres", "three"], ["diez", "ten"], ["lunes", "Monday"],
  ["viernes", "Friday"], ["enero", "January"], ["mayo", "May"], ["rojo", "red"], ["azul", "blue"],
  ["hablar", "to speak"], ["comer", "to eat"], ["vivir", "to live"], ["quiero", "I want"], ["no entiendo", "I don't understand"],
];

const quizQuestions = practiceWords.slice(0, 10).map(([es, en], index) => ({
  es,
  en,
  options: buildOptions(en, index),
}));

const pronunciationItems = [
  "hola",
  "buenos días",
  "gracias",
  "mi familia",
  "quiero agua",
  "no entiendo",
  "más despacio",
  "la cuenta, por favor",
];

function getPracticeContent() {
  const lesson = getActiveLesson();

  if (!lesson) {
    return {
      words: practiceWords,
      quiz: quizQuestions,
      pronunciation: pronunciationItems.map(text => ({ text, note: "" })),
    };
  }

  const words = lesson.vocabulary?.length
    ? lesson.vocabulary.map(item => [item.spanish, item.english])
    : practiceWords;

  const quiz = lesson.quiz?.length
    ? lesson.quiz.map((question, index) => ({
        prompt: question.prompt || "Choose the correct answer.",
        es: getQuizDisplayText(question),
        en: question.answer,
        options: question.options?.length ? question.options : buildLessonOptions(question.answer, index, words),
      }))
    : quizQuestions;

  const pronunciation = lesson.pronunciation?.items?.length
    ? lesson.pronunciation.items.map(item => ({
        text: typeof item === "string" ? item : item.text,
        note: typeof item === "string" ? "" : item.note,
      }))
    : pronunciationItems.map(text => ({ text, note: "" }));

  return { words, quiz, pronunciation };
}

if (typeof window !== "undefined") {
  window.hablaPractice = {
    answerQuiz(button) {
      const panel = button.closest(".quiz-panel");
      const question = button.closest(".quiz-question");
      if (!panel || !question || question.dataset.answered === "true") return;

      question.dataset.answered = "true";
      const isCorrect = button.dataset.answer === question.dataset.correct;
      button.classList.add(isCorrect ? "correct" : "wrong");

      question.querySelectorAll(".quiz-option").forEach(option => {
        option.disabled = true;
        if (option.dataset.answer === question.dataset.correct) option.classList.add("reveal");
      });

      if (isCorrect) panel.dataset.score = String(Number(panel.dataset.score || "0") + 1);
      panel.querySelector(".practice-score strong").textContent = panel.dataset.score || "0";
      const feedback = question.querySelector(".quiz-feedback");
      feedback.textContent = isCorrect ? "Correct! Nice work." : `Not quite. The answer is "${question.dataset.correct}".`;
      feedback.className = `quiz-feedback ${isCorrect ? "ok" : "bad"}`;
    },

    nextQuiz(button) {
      const panel = button.closest(".quiz-panel");
      const current = panel?.querySelector(".quiz-question.active");
      if (!panel || !current) return;

      if (current.dataset.answered !== "true") {
        current.querySelector(".quiz-feedback").textContent = "Choose an answer first.";
        return;
      }

      const questions = [...panel.querySelectorAll(".quiz-question")];
      const currentIndex = questions.indexOf(current);
      current.classList.remove("active");

      if (currentIndex + 1 >= questions.length) {
        const completeMessage = panel.querySelector(".quiz-complete");
        if (completeMessage) {
          completeMessage.textContent = completeCurrentLesson();
          completeMessage.hidden = false;
        }
        button.disabled = true;
        panel.querySelector(".practice-progress span").textContent = `${questions.length}/${questions.length}`;
        panel.querySelector(".practice-progress-bar").style.width = "100%";
        return;
      }

      const next = questions[currentIndex + 1];
      next.classList.add("active");
      panel.querySelector(".practice-progress span").textContent = `${currentIndex + 2}/${questions.length}`;
      panel.querySelector(".practice-progress-bar").style.width = `${((currentIndex + 2) / questions.length) * 100}%`;
    },

    flipCard(button) {
      button.closest(".flashcard-panel")?.querySelector(".flash-slide.active")?.classList.toggle("flipped");
    },

    nextCard(button) {
      const panel = button.closest(".flashcard-panel");
      const slides = [...(panel?.querySelectorAll(".flash-slide") || [])];
      const current = panel?.querySelector(".flash-slide.active");
      if (!panel || !current) return;

      const nextIndex = (slides.indexOf(current) + 1) % slides.length;
      current.classList.remove("active", "flipped");
      slides[nextIndex].classList.add("active");
      panel.querySelector(".flash-count").textContent = `${nextIndex + 1}/${slides.length}`;
    },

    speakFrom(button, selector) {
      const text = button.closest(".practice-mode-panel")?.querySelector(selector)?.textContent?.trim();
      speakSpanish(text);
    },

    speakText(text) {
      speakSpanish(text);
    },

    nextPronunciation(button) {
      const panel = button.closest(".pronunciation-panel");
      const slides = [...(panel?.querySelectorAll(".pron-slide") || [])];
      const current = panel?.querySelector(".pron-slide.active");
      if (!panel || !current) return;

      const nextIndex = (slides.indexOf(current) + 1) % slides.length;
      current.classList.remove("active");
      slides[nextIndex].classList.add("active");
      panel.querySelector(".pron-output").textContent = "Tap the microphone and repeat the phrase.";
      panel.querySelector(".pron-feedback").textContent = "";
      panel.querySelector(".pron-count").textContent = `${nextIndex + 1}/${slides.length}`;
    },

    listen(button) {
      const panel = button.closest(".pronunciation-panel");
      const active = panel?.querySelector(".pron-slide.active");
      const output = panel?.querySelector(".pron-output");
      const feedback = panel?.querySelector(".pron-feedback");
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        output.textContent = "SpeechRecognition is not available in this browser.";
        feedback.textContent = "Try Chrome or use the pronunciation audio.";
        feedback.className = "pron-feedback close";
        return;
      }

      const target = active.dataset.phrase;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-ES";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      output.textContent = "Listening...";
      feedback.textContent = "";

      recognition.onresult = event => {
        const said = event.results[0][0].transcript;
        output.textContent = `You said: ${said}`;
        const score = compareSpeech(target, said);
        feedback.textContent = score === "great" ? "Great try" : score === "close" ? "Close" : "Try again";
        feedback.className = `pron-feedback ${score}`;
      };

      recognition.onerror = () => {
        output.textContent = "Microphone did not catch that.";
        feedback.textContent = "Try again";
        feedback.className = "pron-feedback retry";
      };

      recognition.start();
    },
  };
}

function completeCurrentLesson() {
  const lesson = getActiveLesson();

  if (!lesson) {
    return "Quiz complete. Great session.";
  }

  const event = completeLesson(lesson.id);

  if (event.type === "lesson:already-completed") {
    return "Lesson already completed. Great review session.";
  }

  if (event.type === "lesson:completed") {
    return `Lesson complete! You earned ${event.progress?.xpAwarded || lesson.xpReward || 0} XP.`;
  }

  return "Quiz complete. Great session.";
}

export function renderPractice() {
  const content = getPracticeContent();
  const lesson = getActiveLesson();
  const selectedTopic = getSelectedPracticeTopic();

  return `
    <section class="practice-screen" aria-label="Practice">
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-quiz" checked>
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-flashcards">
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-pronunciation">

      ${renderPracticeHeader()}

      <div class="practice-mode-grid" role="tablist" aria-label="Practice modes">
        ${modeCard("mode-quiz", "quiz", "practice-icon-quiz", "Quiz Mode")}
        ${modeCard("mode-flashcards", "flashcards", "practice-icon-cards", "Flashcards")}
        ${modeCard("mode-pronunciation", "pronunciation", "practice-icon-mic", "Pronunciation")}
        <button class="practice-mode-card conversation" type="button" data-page="carlos">
          <div class="practice-mode-icon practice-icon-chat" aria-hidden="true"></div>
          <h2>Conversation</h2>
        </button>
      </div>

      ${renderPracticeFocus(lesson, content.quiz.length, selectedTopic)}
      ${renderPracticeTopics(selectedTopic?.slug)}
      ${renderTopicLanding(selectedTopic)}
      ${renderWeeklyGoal()}
      ${renderRecentActivity()}

      <div class="practice-panels">
        ${renderQuiz(content.quiz)}
        ${renderFlashcards(content.words)}
        ${renderPronunciation(content.pronunciation)}
      </div>
    </section>
  `;
}

function renderPracticeHeader() {
  return `
    <header class="practice-header">
      <div class="practice-title-row">
        <div>
          <h1>Practice</h1>
          <p>Practice speaking, listening and more.</p>
        </div>
        <button class="practice-level-pill" type="button">A1 Beginner <span aria-hidden="true">&rsaquo;</span></button>
      </div>
    </header>
  `;
}

function modeCard(id, key, icon, title) {
  const iconClass = `practice-icon-${key === "flashcards" ? "cards" : key === "pronunciation" ? "mic" : "quiz"}`;
  return `
    <label class="practice-mode-card ${key}" for="${id}" role="tab">
      <div class="practice-mode-icon ${iconClass}" aria-hidden="true"></div>
      <h2>${title}</h2>
    </label>
  `;
}

function renderPracticeFocus(lesson, questionCount = 15, selectedTopic = null) {
  const title = selectedTopic?.title || (lesson?.title ? shortLessonTitle(lesson.title) : "Greetings & Introductions");
  const objective = selectedTopic?.description || lesson?.objective || lesson?.objectives?.[0] || "Warm hellos, goodbyes, and introducing yourself in Spanish.";
  const xp = Number(selectedTopic?.xp || lesson?.xpReward || 150);

  return `
    <section class="practice-focus-card">
      <div class="practice-focus-copy">
        <p>Today&rsquo;s Focus</p>
        <h2>${escapeHtml(title)}</h2>
        <span>${escapeHtml(objective)}</span>
        <div class="practice-focus-meta">
          <span><i class="meta-check" aria-hidden="true"></i>${questionCount} Questions</span>
          <span><i class="meta-clock" aria-hidden="true"></i>10 Min</span>
          <span><i class="meta-star" aria-hidden="true"></i>${xp} XP</span>
        </div>
        <button type="button" class="practice-start-quiz" onclick="document.getElementById('mode-quiz').checked=true;document.querySelector('.quiz-panel')?.scrollIntoView({behavior:'smooth',block:'start'});">
          Start Quiz <span aria-hidden="true">&rsaquo;</span>
        </button>
      </div>
      <div class="practice-focus-art" aria-hidden="true">
        <span class="practice-girl"></span>
        <img src="assets/images/carlos-home.png" alt="">
        <em class="bubble-green">&iexcl;Hola!<small>Hello!</small></em>
        <em class="bubble-gold">&iquest;C&oacute;mo est&aacute;s?<small>How are you?</small></em>
      </div>
    </section>
  `;
}

function shortLessonTitle(title) {
  return String(title || "Lesson").replace(/^.*?:\s*/, match => match.length > 18 ? "" : match);
}

function getSelectedPracticeTopic() {
  try {
    const slug = localStorage.getItem(PRACTICE_TOPIC_KEY);
    if (!slug || !PRACTICE_TOPICS[slug]) return null;
    return { slug, ...PRACTICE_TOPICS[slug] };
  } catch (error) {
    return null;
  }
}

function renderPracticeTopics(selectedSlug = "") {
  const topics = Object.entries(PRACTICE_TOPICS);

  return `
    <section class="practice-topic-section">
      <div class="practice-section-head">
        <h2>Practice by Topic</h2>
        <button type="button" data-page="learn">View all <span aria-hidden="true">&rsaquo;</span></button>
      </div>
      <div class="practice-topic-grid">
        ${topics.map(([slug, topic]) => `
          <button class="practice-topic-tile${selectedSlug === slug ? " selected" : ""}" type="button" data-page="${slug === "conversation" ? "carlos" : "practice"}" data-practice-topic="${escapeAttr(slug)}">
            <span class="topic-icon ${topic.icon}" aria-hidden="true">${renderTopicSvg(topic.icon)}</span>
            <strong>${escapeHtml(topic.title)}</strong>
            <small>${escapeHtml(topic.count)}</small>
            ${topic.progress ? `<i class="topic-progress"><b style="width:${topic.progress}%"></b></i>` : ""}
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTopicLanding(topic) {
  if (!topic || topic.slug === "conversation") return "";

  return `
    <section class="practice-topic-active-card">
      <span class="topic-icon ${topic.icon}" aria-hidden="true">${renderTopicSvg(topic.icon)}</span>
      <div>
        <p>Selected Topic</p>
        <h2>${escapeHtml(topic.title)}</h2>
        <span>${escapeHtml(topic.description)}</span>
      </div>
      <button type="button" onclick="document.getElementById('mode-quiz').checked=true;document.querySelector('.quiz-panel')?.scrollIntoView({behavior:'smooth',block:'start'});">
        Start Practice <span aria-hidden="true">&rsaquo;</span>
      </button>
    </section>
  `;
}

function renderTopicSvg(iconClass) {
  const icons = {
    "topic-greetings": `<svg viewBox="0 0 48 48"><path d="M8 23c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2.5 0-5-.5-7-1.5L9 40l2.2-8C9.2 29.5 8 26.4 8 23Z"/><circle cx="18" cy="23" r="2.3"/><circle cx="24" cy="23" r="2.3"/><circle cx="30" cy="23" r="2.3"/></svg>`,
    "topic-family": `<svg viewBox="0 0 48 48"><circle cx="18" cy="16" r="6"/><circle cx="31" cy="16" r="6"/><path d="M8 37c1.5-8 6-12 12-12s10.5 4 12 12H8Z"/><path d="M24 37c1.2-7 5-11 10-11 4.5 0 8 3.6 9 11H24Z"/></svg>`,
    "topic-restaurants": `<svg viewBox="0 0 48 48"><path d="M14 7v17M20 7v17M11 7v10c0 5 12 5 12 0V7M17 24v17"/><path d="M34 7c-4 4-6 9-6 15h8v19"/></svg>`,
    "topic-travel": `<svg viewBox="0 0 48 48"><path d="M4 28 43 9c1.4-.7 2.8.8 2 2.2L25 44l-5-16-16 0Z"/><path d="M20 28 43 10"/></svg>`,
    "topic-shopping": `<svg viewBox="0 0 48 48"><path d="M12 18h24l3 24H9l3-24Z"/><path d="M18 18c0-6 12-6 12 0"/></svg>`,
    "topic-work": `<svg viewBox="0 0 48 48"><path d="M16 15v-5h16v5"/><rect x="8" y="15" width="32" height="25" rx="4"/><path d="M8 26h32M21 26h6"/></svg>`,
    "topic-smalltalk": `<svg viewBox="0 0 48 48"><path d="M8 23c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2.5 0-5-.5-7-1.5L9 40l2.2-8C9.2 29.5 8 26.4 8 23Z"/><circle cx="18" cy="23" r="2.3"/><circle cx="24" cy="23" r="2.3"/><circle cx="30" cy="23" r="2.3"/></svg>`,
    "topic-freechat": `<svg viewBox="0 0 48 48"><rect x="18" y="6" width="12" height="24" rx="6"/><path d="M11 22c0 8 5 13 13 13s13-5 13-13M24 35v7M18 42h12"/></svg>`
  };
  return icons[iconClass] || "";
}

function renderWeeklyGoal() {
  return `
    <section class="weekly-goal-card">
      <div>
        <p>Weekly Goal</p>
        <h2>4 of 7</h2>
        <span>Lessons Completed</span>
        <i class="weekly-progress"><b style="width:57%"></b></i>
      </div>
      <div class="weekly-days" aria-label="Weekly activity">
        <strong><span>★</span> +350 XP</strong>
        ${["M", "T", "W", "T", "F", "S", "S"].map((day, index) => `
          <span class="${index < 2 ? "done" : index === 2 ? "today" : index === 6 ? "miss" : ""}">${day}<i></i></span>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRecentActivity() {
  const rows = [
    ["activity-quiz", "Quiz: Greetings & Introductions", "15 questions &bull; 10 min", "+150 XP", "Today, 9:30 PM"],
    ["activity-mic", "Pronunciation: Basic Phrases", "Completed 10 exercises", "+80 XP", "Today, 7:15 PM"],
    ["activity-chat", "Conversation: Ordering Coffee", "Spoke for 8 minutes", "+120 XP", "Today, 5:45 PM"],
  ];

  return `
    <section class="recent-activity-section">
      <div class="practice-section-head">
        <h2>Recent Activity</h2>
        <button type="button" data-page="profile">View all activity <span aria-hidden="true">&rsaquo;</span></button>
      </div>
      <div class="recent-activity-card">
        ${rows.map(([icon, title, detail, xp, time]) => `
          <button type="button" data-page="practice">
            <span class="${icon}" aria-hidden="true"></span>
            <span><strong>${title}</strong><small>${detail}</small></span>
            <em>${xp}<small>${time}</small></em>
            <i aria-hidden="true">&rsaquo;</i>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderQuiz(questions = quizQuestions) {
  return `
    <section class="practice-mode-panel quiz-panel" data-score="0" aria-label="Quiz Mode">
      <div class="practice-panel-head">
        <div><span class="practice-eyebrow">Multiple choice</span><h2>Spanish to English</h2></div>
        <div class="practice-score">Score <strong>0</strong></div>
      </div>
      <div class="practice-progress"><div><div class="practice-progress-bar" style="width:${100 / questions.length}%"></div></div><span>1/${questions.length}</span></div>
      ${questions.map((question, index) => `
        <article class="quiz-question${index === 0 ? " active" : ""}" data-correct="${escapeAttr(question.en)}">
          <p>${escapeHtml(question.prompt || "What does this mean?")}</p>
          <h3>${escapeHtml(question.es)}</h3>
          <div class="quiz-options">
            ${question.options.map(option => `<button class="quiz-option" type="button" data-answer="${escapeAttr(option)}" onclick="hablaPractice.answerQuiz(this)">${escapeHtml(option)}</button>`).join("")}
          </div>
          <div class="quiz-feedback"></div>
        </article>
      `).join("")}
      <div class="quiz-complete" hidden>Quiz complete. Great session.</div>
      <button class="practice-primary" type="button" onclick="hablaPractice.nextQuiz(this)">Next</button>
    </section>
  `;
}

function renderFlashcards(words = practiceWords) {
  return `
    <section class="practice-mode-panel flashcard-panel" aria-label="Flashcards">
      <div class="practice-panel-head">
        <div><span class="practice-eyebrow">Recall</span><h2>Flashcards</h2></div>
        <div class="flash-count">1/${words.length}</div>
      </div>
      <div class="flash-stage">
        ${words.map(([es, en], index) => `
          <article class="flash-slide${index === 0 ? " active" : ""}">
            <div class="flash-face flash-front"><span>Spanish</span><strong class="flash-es">${escapeHtml(es)}</strong></div>
            <div class="flash-face flash-back"><span>English</span><strong>${escapeHtml(en)}</strong></div>
          </article>
        `).join("")}
      </div>
      <div class="practice-actions">
        <button type="button" onclick="hablaPractice.speakFrom(this, '.flash-slide.active .flash-es')"><span class="ui-icon ui-icon-sound" aria-hidden="true"></span> Hear</button>
        <button type="button" onclick="hablaPractice.flipCard(this)">Flip</button>
        <button type="button" onclick="hablaPractice.nextCard(this)">Next Card</button>
      </div>
    </section>
  `;
}

function renderPronunciation(items = pronunciationItems.map(text => ({ text, note: "" }))) {
  return `
    <section class="practice-mode-panel pronunciation-panel" aria-label="Pronunciation Practice">
      <div class="practice-panel-head">
        <div><span class="practice-eyebrow">Speech</span><h2>Pronunciation Practice</h2></div>
        <div class="pron-count">1/${items.length}</div>
      </div>
      <div class="pron-stage">
        ${items.map((item, index) => `
          <article class="pron-slide${index === 0 ? " active" : ""}" data-phrase="${escapeAttr(item.text)}">
            <span>Repeat this</span>
            <strong>${escapeHtml(item.text)}</strong>
            ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
          </article>
        `).join("")}
      </div>
      <div class="practice-actions">
        <button type="button" onclick="hablaPractice.speakFrom(this, '.pron-slide.active strong')"><span class="ui-icon ui-icon-sound" aria-hidden="true"></span> Hear</button>
        <button type="button" onclick="hablaPractice.listen(this)"><span class="ui-icon ui-icon-mic" aria-hidden="true"></span> Start Microphone</button>
        <button type="button" onclick="hablaPractice.nextPronunciation(this)">Next Phrase</button>
      </div>
      <div class="pron-output">Tap the microphone and repeat the phrase.</div>
      <div class="pron-feedback"></div>
    </section>
  `;
}

function buildOptions(answer, index) {
  const wrong = practiceWords
    .map(([, en]) => en)
    .filter(option => option !== answer);
  const options = [answer, wrong[(index + 3) % wrong.length], wrong[(index + 11) % wrong.length], wrong[(index + 19) % wrong.length]];
  return options.sort((a, b) => (a.length + index) % 3 - (b.length + index) % 3);
}

function buildLessonOptions(answer, index, words) {
  const wrong = words
    .map(([, en]) => en)
    .filter(option => option !== answer);
  const options = [answer, wrong[(index + 2) % wrong.length], wrong[(index + 7) % wrong.length], wrong[(index + 13) % wrong.length]];
  return options.sort((a, b) => (a.length + index) % 3 - (b.length + index) % 3);
}

function getQuizDisplayText(question) {
  if (question.type === "translation") {
    return question.prompt.replace(/^Translate:\s*/i, "");
  }

  if (question.type === "fillBlank") {
    return question.prompt;
  }

  return question.prompt;
}

function speakSpanish(text) {
  if (!text || typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-ES";
  utterance.rate = 0.85;
  utterance.pitch = 1.05;
  speechSynthesis.speak(utterance);
}

function compareSpeech(target, said) {
  const normalizedTarget = normalize(target);
  const normalizedSaid = normalize(said);
  if (normalizedSaid === normalizedTarget || normalizedSaid.includes(normalizedTarget)) return "great";
  const targetWords = normalizedTarget.split(" ");
  const saidWords = normalizedSaid.split(" ");
  if (targetWords.some(word => saidWords.includes(word)) || normalizedTarget[0] === normalizedSaid[0]) return "close";
  return "retry";
}

function normalize(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,]/g, "").trim();
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
