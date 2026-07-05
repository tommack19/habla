import { getCurrentLesson } from "../core/content.js";

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
  const lesson = getCurrentLesson();

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
        panel.querySelector(".quiz-complete").hidden = false;
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

export function renderPractice() {
  const content = getPracticeContent();

  return `
    <section class="practice-screen" aria-label="Practice">
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-quiz" checked>
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-flashcards">
      <input class="practice-tab-input" type="radio" name="practice-mode" id="mode-pronunciation">

      <div class="practice-header">
        <span class="practice-eyebrow">Training room</span>
        <h1>Practice</h1>
        <p>Test recall, flip through cards, and train pronunciation with browser tools.</p>
      </div>

      <div class="practice-mode-grid" role="tablist" aria-label="Practice modes">
        ${modeCard("mode-quiz", "quiz", "🎯", "Quiz Mode", "Choose the English meaning.")}
        ${modeCard("mode-flashcards", "flashcards", "▣", "Flashcards", "Flip and review words.")}
        ${modeCard("mode-pronunciation", "pronunciation", "🎤", "Pronunciation", "Listen, speak, and compare.")}
      </div>

      <div class="practice-panels">
        ${renderQuiz(content.quiz)}
        ${renderFlashcards(content.words)}
        ${renderPronunciation(content.pronunciation)}
      </div>
    </section>
  `;
}

function modeCard(id, key, icon, title, copy) {
  return `
    <label class="practice-mode-card ${key}" for="${id}" role="tab">
      <div class="practice-mode-icon">${icon}</div>
      <div><h2>${title}</h2><p>${copy}</p></div>
    </label>
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
        <button type="button" onclick="hablaPractice.speakFrom(this, '.flash-slide.active .flash-es')">🔊 Hear</button>
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
        <button type="button" onclick="hablaPractice.speakFrom(this, '.pron-slide.active strong')">🔊 Hear</button>
        <button type="button" onclick="hablaPractice.listen(this)">🎤 Start Microphone</button>
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
