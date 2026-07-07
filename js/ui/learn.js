import { getCourseProgress, getCurrentLesson, getLessonProgress, getNextAvailableLessonStatus } from "../core/content.js";

const vocabulary = [
  ["Greetings", "hola", "hello", "greeting", "Use any time of day.", "Hola, ¿cómo estás?", "Hello, how are you?"],
  ["Greetings", "buenos días", "good morning", "greeting", "Use before midday.", "Buenos días, señora.", "Good morning, ma'am."],
  ["Greetings", "buenas tardes", "good afternoon", "greeting", "Use after midday.", "Buenas tardes, Carlos.", "Good afternoon, Carlos."],
  ["Greetings", "buenas noches", "good evening / good night", "greeting", "Works as hello or goodbye at night.", "Buenas noches, familia.", "Good evening, family."],
  ["Greetings", "adiós", "goodbye", "greeting", "A simple farewell.", "Adiós, hasta mañana.", "Goodbye, see you tomorrow."],
  ["Greetings", "gracias", "thank you", "greeting", "Add muchas for emphasis.", "Gracias por la comida.", "Thank you for the food."],
  ["Greetings", "de nada", "you're welcome", "greeting", "The standard reply to gracias.", "Gracias. De nada.", "Thank you. You're welcome."],
  ["Verbs", "ser", "to be", "verb", "Use for identity and lasting traits.", "Soy de Canadá.", "I am from Canada."],
  ["Verbs", "estar", "to be", "verb", "Use for location and temporary states.", "Estoy en casa.", "I am at home."],
  ["Verbs", "tener", "to have", "verb", "Also used for age and feelings.", "Tengo una pregunta.", "I have a question."],
  ["Verbs", "hablar", "to speak", "verb", "A regular -ar verb.", "Quiero hablar español.", "I want to speak Spanish."],
  ["Verbs", "comer", "to eat", "verb", "A regular -er verb.", "Me gusta comer tacos.", "I like to eat tacos."],
  ["Verbs", "vivir", "to live", "verb", "A regular -ir verb.", "Vivo en Winnipeg.", "I live in Winnipeg."],
  ["Verbs", "ir", "to go", "verb", "Voy means I go.", "Voy al restaurante.", "I am going to the restaurant."],
  ["Verbs", "querer", "to want", "verb", "Quiero means I want.", "Quiero agua.", "I want water."],
  ["Verbs", "poder", "to be able to", "verb", "Puedo means I can.", "Puedo practicar hoy.", "I can practice today."],
  ["Nouns", "la familia", "the family", "noun", "A key word for your goal.", "Mi familia es grande.", "My family is big."],
  ["Nouns", "la casa", "the house", "noun", "Usually feminine because it ends in -a.", "La casa es bonita.", "The house is pretty."],
  ["Nouns", "el trabajo", "work / job", "noun", "Usually masculine because it ends in -o.", "Voy al trabajo.", "I am going to work."],
  ["Nouns", "el tiempo", "time / weather", "noun", "Context tells the meaning.", "No tengo tiempo.", "I don't have time."],
  ["Nouns", "la ciudad", "the city", "noun", "Words ending in -dad are often feminine.", "La ciudad es tranquila.", "The city is calm."],
  ["Nouns", "el dinero", "money", "noun", "Used as singular in Spanish.", "Necesito dinero.", "I need money."],
  ["Nouns", "el amigo", "the friend", "noun", "Use la amiga for a female friend.", "Mi amigo habla inglés.", "My friend speaks English."],
  ["Phrases", "por favor", "please", "phrase", "Put it at the end of requests.", "Un café, por favor.", "A coffee, please."],
  ["Phrases", "lo siento", "I'm sorry", "phrase", "Useful for apologies.", "Lo siento mucho.", "I am very sorry."],
  ["Phrases", "no entiendo", "I don't understand", "phrase", "Essential when speech is fast.", "Lo siento, no entiendo.", "Sorry, I don't understand."],
  ["Phrases", "más despacio", "more slowly", "phrase", "Pair with por favor.", "Más despacio, por favor.", "More slowly, please."],
  ["Phrases", "mucho gusto", "nice to meet you", "phrase", "Use when meeting someone.", "Mucho gusto en conocerte.", "Nice to meet you."],
  ["Phrases", "estoy aprendiendo español", "I'm learning Spanish", "phrase", "A friendly explanation.", "Estoy aprendiendo español para mi familia.", "I am learning Spanish for my family."],
  ["Phrases", "no hablo bien español", "I don't speak Spanish well", "phrase", "Honest and useful.", "No hablo bien español todavía.", "I don't speak Spanish well yet."],
  ["Numbers", "cero", "zero", "number", "Used in phone numbers.", "Tengo cero dólares.", "I have zero dollars."],
  ["Numbers", "uno", "one", "number", "Changes to un before masculine nouns.", "Tengo un hermano.", "I have one brother."],
  ["Numbers", "dos", "two", "number", "Does not change for gender.", "Tengo dos hijos.", "I have two children."],
  ["Numbers", "tres", "three", "number", "Useful for time.", "Son las tres.", "It is three o'clock."],
  ["Numbers", "cuatro", "four", "number", "Easy classroom word.", "Somos cuatro personas.", "We are four people."],
  ["Numbers", "cinco", "five", "number", "You may know Cinco de Mayo.", "Tengo cinco minutos.", "I have five minutes."],
  ["Numbers", "diez", "ten", "number", "A building block number.", "Necesito diez minutos.", "I need ten minutes."],
  ["Months", "enero", "January", "month", "Months are not capitalized.", "Mi cumpleaños es en enero.", "My birthday is in January."],
  ["Months", "febrero", "February", "month", "Similar to English.", "Febrero es corto.", "February is short."],
  ["Months", "marzo", "March", "month", "Think spring.", "Viajo en marzo.", "I travel in March."],
  ["Months", "abril", "April", "month", "Very close to English.", "Llueve en abril.", "It rains in April."],
  ["Months", "mayo", "May", "month", "Familiar from Cinco de Mayo.", "Mayo es bonito.", "May is beautiful."],
  ["Months", "junio", "June", "month", "Sounds like June.", "Trabajo en junio.", "I work in June."],
  ["Months", "julio", "July", "month", "Julio is also a name.", "Hace calor en julio.", "It is hot in July."],
  ["Days", "lunes", "Monday", "day", "Days are not capitalized.", "Trabajo el lunes.", "I work on Monday."],
  ["Days", "martes", "Tuesday", "day", "Use el before a day for on.", "Estudio el martes.", "I study on Tuesday."],
  ["Days", "miércoles", "Wednesday", "day", "Notice the accent.", "Practico el miércoles.", "I practice on Wednesday."],
  ["Days", "jueves", "Thursday", "day", "Common planning word.", "Nos vemos el jueves.", "See you on Thursday."],
  ["Days", "viernes", "Friday", "day", "A useful weekend marker.", "Salgo el viernes.", "I go out on Friday."],
  ["Days", "sábado", "Saturday", "day", "Notice the accent.", "Descanso el sábado.", "I rest on Saturday."],
  ["Days", "domingo", "Sunday", "day", "Often family day.", "Como con mi familia el domingo.", "I eat with my family on Sunday."],
  ["Colors", "rojo", "red", "color", "Often changes to roja for feminine nouns.", "La camisa es roja.", "The shirt is red."],
  ["Colors", "azul", "blue", "color", "Usually same for masculine and feminine.", "El coche es azul.", "The car is blue."],
  ["Colors", "verde", "green", "color", "Usually same for masculine and feminine.", "La casa es verde.", "The house is green."],
  ["Colors", "negro", "black", "color", "Changes with gender and number.", "El café es negro.", "The coffee is black."],
  ["Colors", "blanco", "white", "color", "Changes to blanca for feminine.", "La mesa es blanca.", "The table is white."],
  ["Colors", "amarillo", "yellow", "color", "Changes like regular adjectives.", "El taxi es amarillo.", "The taxi is yellow."],
  ["Family", "mi esposa", "my wife", "family", "Useful for introductions.", "Mi esposa habla español.", "My wife speaks Spanish."],
  ["Family", "el esposo", "the husband", "family", "Use mi esposo for my husband.", "Su esposo es amable.", "Her husband is kind."],
  ["Family", "la madre", "the mother", "family", "Mamá is more informal.", "Mi madre vive aquí.", "My mother lives here."],
  ["Family", "el padre", "the father", "family", "Papá is more informal.", "Mi padre trabaja hoy.", "My father works today."],
  ["Family", "el hermano", "the brother", "family", "Use la hermana for sister.", "Tengo un hermano.", "I have a brother."],
  ["Family", "los hijos", "the children", "family", "Can mean sons or children.", "Tengo dos hijos.", "I have two children."],
  ["Food", "el agua", "water", "food", "Uses el but is feminine.", "Quiero agua fría.", "I want cold water."],
  ["Food", "el café", "coffee", "food", "Accent on the final syllable.", "Quiero un café.", "I want a coffee."],
  ["Food", "la comida", "food", "food", "Also means meal.", "La comida está rica.", "The food is tasty."],
  ["Food", "el pan", "bread", "food", "Simple restaurant word.", "Necesito pan.", "I need bread."],
  ["Food", "el pollo", "chicken", "food", "Common menu item.", "Como pollo con arroz.", "I eat chicken with rice."],
  ["Food", "la cuenta", "the bill", "food", "Essential in restaurants.", "La cuenta, por favor.", "The bill, please."],
  ["Travel", "el hotel", "the hotel", "travel", "Nearly the same as English.", "El hotel está cerca.", "The hotel is nearby."],
  ["Travel", "el aeropuerto", "the airport", "travel", "A practical travel word.", "Voy al aeropuerto.", "I am going to the airport."],
  ["Travel", "el taxi", "the taxi", "travel", "Easy to recognize.", "Necesito un taxi.", "I need a taxi."],
  ["Travel", "la estación", "the station", "travel", "Useful for buses and trains.", "La estación está aquí.", "The station is here."],
  ["Travel", "el pasaporte", "the passport", "travel", "A must-know travel noun.", "Tengo mi pasaporte.", "I have my passport."],
  ["Travel", "la maleta", "the suitcase", "travel", "Feminine noun.", "Mi maleta es grande.", "My suitcase is big."],
  ["Questions", "¿qué?", "what?", "question", "Use for things or actions.", "¿Qué quieres?", "What do you want?"],
  ["Questions", "¿dónde?", "where?", "question", "Use for location.", "¿Dónde está el baño?", "Where is the bathroom?"],
  ["Questions", "¿cuándo?", "when?", "question", "Use for time.", "¿Cuándo es la fiesta?", "When is the party?"],
  ["Questions", "¿quién?", "who?", "question", "Use for people.", "¿Quién es Carlos?", "Who is Carlos?"],
  ["Questions", "¿cómo?", "how?", "question", "Also appears in ¿cómo estás?", "¿Cómo se dice esto?", "How do you say this?"],
  ["Questions", "¿cuánto cuesta?", "how much does it cost?", "question", "Very useful when shopping.", "¿Cuánto cuesta este libro?", "How much does this book cost?"],
];

const categories = ["All", "Greetings", "Verbs", "Nouns", "Phrases", "Numbers", "Months", "Days", "Colors", "Family", "Food", "Travel", "Questions"];

const roadmap = [
  {
    level: "A1 Beginner",
    goal: "Build survival Spanish and confidence with family basics.",
    modules: [
      ["Weeks 1-2", "Greetings, numbers, days, months, and polite phrases"],
      ["Weeks 3-4", "Family introductions, ser vs estar, el/la, un/una"],
      ["Weeks 5-6", "Present tense -ar verbs and simple daily sentences"],
      ["Weeks 7-8", "Restaurants, food, asking for help, and basic questions"],
    ],
  },
  {
    level: "A2 Elementary",
    goal: "Create real sentences for daily routines, travel, and small talk.",
    modules: [
      ["Weeks 9-12", "Present tense -er/-ir verbs, tener phrases, and gustar"],
      ["Weeks 13-16", "Travel Spanish: hotels, taxis, airports, directions"],
      ["Weeks 17-20", "Work, hobbies, weather, and weekend small talk"],
      ["Weeks 21-24", "Past tense introductions and telling simple stories"],
    ],
  },
  {
    level: "B1 Intermediate",
    goal: "Hold conversations with more detail and less hesitation.",
    modules: [
      ["Weeks 25-30", "Family conversations, opinions, plans, and preferences"],
      ["Weeks 31-36", "Restaurant conversations, problem solving, and requests"],
      ["Weeks 37-42", "Work stories, travel experiences, and follow-up questions"],
      ["Weeks 43-48", "Conversation repair: clarifying, repeating, and rephrasing"],
    ],
  },
  {
    level: "B2 Upper Intermediate",
    goal: "Speak naturally across familiar topics and understand native-speed context.",
    modules: [
      ["Weeks 49-56", "Longer opinions, comparisons, and cultural topics"],
      ["Weeks 57-64", "Podcasts, shows, news, and family storytelling"],
      ["Weeks 65-72", "Advanced question flow and smoother conversation transitions"],
      ["Weeks 73-80", "30-minute unscripted conversations and personal fluency goals"],
    ],
  },
];

const grammar = [
  {
    title: "Ser vs Estar",
    explanation: "Use ser for identity and origin. Use estar for location or how someone feels right now.",
    spanish: "Soy de Canada. Estoy en casa.",
    english: "I am from Canada. I am at home.",
    prompt: "Say where you are from with soy de."
  },
  {
    title: "Gender: el/la",
    explanation: "Spanish nouns use el or la. Many words ending in -o use el, and many words ending in -a use la.",
    spanish: "el libro, la casa",
    english: "the book, the house",
    prompt: "Choose el or la: ___ familia."
  },
  {
    title: "Articles un/una",
    explanation: "Un and una mean a or one. Use un with masculine nouns and una with feminine nouns.",
    spanish: "Tengo una pregunta.",
    english: "I have a question.",
    prompt: "Say: I have a coffee."
  },
  {
    title: "Present tense -ar verbs",
    explanation: "For regular -ar verbs, drop -ar and add -o for I.",
    spanish: "Hablo espanol.",
    english: "I speak Spanish.",
    prompt: "Say: I practice Spanish."
  },
  {
    title: "Present tense -er/-ir verbs",
    explanation: "For many -er and -ir verbs, use -o for I and -es for you.",
    spanish: "Vivo en Canada.",
    english: "I live in Canada.",
    prompt: "Say: I eat bread."
  },
  {
    title: "Tener phrases",
    explanation: "Spanish uses tener, meaning to have, for hunger, thirst, age, and some feelings.",
    spanish: "Tengo sed.",
    english: "I am thirsty.",
    prompt: "Say: I am hungry."
  },
  {
    title: "Gustar",
    explanation: "Use me gusta for one thing you like. Use me gustan for more than one thing.",
    spanish: "Me gusta el cafe.",
    english: "I like coffee.",
    prompt: "Say: I like Spanish."
  },
  {
    title: "Asking questions",
    explanation: "Use question words like que, donde, como, and cuando to ask for basic information.",
    spanish: "¿Donde esta el hotel?",
    english: "Where is the hotel?",
    prompt: "Ask: Where is the restaurant?"
  },
  {
    title: "Negation with no",
    explanation: "Put no before the verb to make a sentence negative.",
    spanish: "No entiendo.",
    english: "I do not understand.",
    prompt: "Make this negative: Hablo espanol."
  },
  {
    title: "Adjective agreement",
    explanation: "Many adjectives change to match the noun. Use -a with many feminine nouns.",
    spanish: "La casa es bonita.",
    english: "The house is pretty.",
    prompt: "Complete: La camisa es ___."
  },
];

export function renderLearn() {
  const currentLesson = getCurrentLesson();

  return `
    <section class="learn-screen" aria-label="Learn">
      <input class="learn-tab-input" type="radio" name="learn-section" id="learn-vocab" checked>
      <input class="learn-tab-input" type="radio" name="learn-section" id="learn-roadmap">
      <input class="learn-tab-input" type="radio" name="learn-section" id="learn-grammar">
      ${categories.map(category => `<input class="vocab-filter-input" type="radio" name="vocab-category" id="cat-${slug(category)}"${category === "All" ? " checked" : ""}>`).join("")}

      <div class="learn-header">
        <span class="learn-eyebrow">Spanish course</span>
        <h1>Learn</h1>
        <p>A practical Spanish course for building vocabulary, grammar, and real-world confidence.</p>
      </div>

      ${renderCurrentLesson(currentLesson)}

      <div class="learn-card-grid" role="tablist" aria-label="Learn sections">
        ${sectionCard("learn-vocab", "learn-card-vocab", "learn-icon-vocab", "Vocabulary", "Filter and study A1 words.")}
        ${sectionCard("learn-roadmap", "learn-card-roadmap", "learn-icon-roadmap", "Roadmap", "Follow the full course path.")}
        ${sectionCard("learn-grammar", "learn-card-grammar", "learn-icon-grammar", "Grammar Basics", "Practice beginner patterns.")}
      </div>

      <div class="learn-panels">
        ${renderVocabularyPanel()}
        ${renderRoadmapPanel()}
        ${renderGrammarPanel()}
      </div>
    </section>
  `;
}

function renderCurrentLesson(lesson) {
  if (!lesson) {
    return `
      <section class="current-lesson-card" aria-label="Current Lesson">
        <span class="learn-eyebrow">Current Lesson</span>
        <h2>Loading lesson...</h2>
        <p>Your next Habla lesson is being prepared.</p>
      </section>
    `;
  }

  const progress = getLessonProgress(lesson.id);
  const mission = lesson.realLifeMission;
  const vocabularyPreview = lesson.vocabulary?.slice(0, 6) || [];
  const greetingCount = lesson.greetings?.length || 0;
  const politeCount = lesson.politeExpressions?.length || 0;
  const lessonStatus = getLessonStatus(progress);
  const xpEarned = progress.xpAwarded || lesson.xpReward || 0;
  const nextLessonStatus = getNextAvailableLessonStatus();
  const nextLessonMissing = nextLessonStatus.type === "next-lesson-missing";
  const courseProgress = getCourseProgress();

  return `
    <section class="current-lesson-card" aria-label="Current Lesson">
      <div class="current-lesson-topline">
        <span class="learn-eyebrow">Current Lesson</span>
        <span class="lesson-status ${lessonStatus.className}">${lessonStatus.label}</span>
      </div>
      <h2>${lesson.title}</h2>
      <p>${lesson.objectives?.[0] || "Practice a real Spanish conversation."}</p>

      ${progress.completed ? `
        <div class="lesson-complete-badge">
          <span>Completed</span>
          <strong>${xpEarned} XP earned</strong>
        </div>
      ` : ""}

      ${nextLessonMissing ? `
        <div class="lesson-next-soon">
          <span>You're caught up</span>
          <strong>${nextLessonStatus.message || "Next lesson coming soon."}</strong>
          <small>Keep reviewing this lesson while the next course step is being built.</small>
        </div>
      ` : ""}

      <div class="lesson-course-progress">
        <div>
          <span>Lesson ${courseProgress.currentLessonNumber} of ${courseProgress.totalLoadedLessons}</span>
          <strong>${courseProgress.completedCount} / ${courseProgress.totalLoadedLessons} completed</strong>
        </div>
        <div class="lesson-course-bar" aria-hidden="true">
          <i style="width:${courseProgress.percent}%"></i>
        </div>
      </div>

      <div class="lesson-metrics">
        <div><strong>${lesson.estimatedMinutes}</strong><small>Minutes</small></div>
        <div><strong>${lesson.vocabulary?.length || 0}</strong><small>Words</small></div>
        <div><strong>${greetingCount}</strong><small>Greetings</small></div>
        <div><strong>${politeCount}</strong><small>Polite phrases</small></div>
      </div>

      ${mission ? `
        <div class="lesson-mission">
          <span>${mission.title}</span>
          <strong>${mission.mission}</strong>
        </div>
      ` : ""}

      <div class="lesson-preview-list" aria-label="Lesson vocabulary preview">
        ${vocabularyPreview.map(item => `
          <div>
            <strong>${item.spanish}</strong>
            <span>${item.english}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function getLessonStatus(progress) {
  if (progress?.completed) {
    return { label: "Completed", className: "completed" };
  }

  if (progress?.startedAt || progress?.updatedAt || progress?.completedAt || progress?.xpAwarded > 0) {
    return { label: "In Progress", className: "active" };
  }

  return { label: "Not Started", className: "not-started" };
}

function sectionCard(id, className, icon, title, copy) {
  const iconClass = className.replace("learn-card-", "learn-icon-");
  return `
    <label class="learn-card ${className}" for="${id}" role="tab">
      <div class="learn-card-icon ${iconClass}" aria-hidden="true"></div>
      <div><h2>${title}</h2><p>${copy}</p></div>
    </label>
  `;
}

function renderVocabularyPanel() {
  return `
    <section class="learn-panel vocab-panel" aria-label="Vocabulary">
      <div class="section-heading">
        <span class="learn-eyebrow">A1 word bank</span>
        <h2>Vocabulary</h2>
        <p>Filter by category, read the tip, then hear the word or example in Spanish.</p>
      </div>
      <div class="vocab-category-row" aria-label="Vocabulary categories">
        ${categories.map(category => `<label for="cat-${slug(category)}">${category}</label>`).join("")}
      </div>
      <div class="learn-vocab-grid">
        ${vocabulary.map(([category, es, en, pos, tip, example, exampleEn]) => `
          <article class="learn-vocab-card vocab-item cat-${slug(category)}">
            <div class="word-topline"><span>${category}</span><small>${pos}</small></div>
            <div class="speak-row">
              <h3>${es}</h3>
              ${speakButton(es, `Hear ${es}`)}
            </div>
            <p class="word-meaning">${en}</p>
            <p class="word-tip">${tip}</p>
            <div class="example-row">
              <div><strong>${example}</strong><span>${exampleEn}</span></div>
              ${speakButton(example, "Hear example")}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRoadmapPanel() {
  return `
    <section class="learn-panel roadmap-panel" aria-label="Roadmap">
      <div class="section-heading">
        <span class="learn-eyebrow">Course path</span>
        <h2>Roadmap</h2>
        <p>Move from first words to confident conversations with family, restaurants, travel, work, and small talk.</p>
      </div>
      <div class="roadmap-list">
        ${roadmap.map(level => `
          <article class="roadmap-card">
            <h3>${level.level}</h3>
            <p>${level.goal}</p>
            <div class="module-list">
              ${level.modules.map(([weeks, goal]) => `<div><strong>${weeks}</strong><span>${goal}</span></div>`).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderGrammarPanel() {
  return `
    <section class="learn-panel grammar-panel" aria-label="Grammar Basics">
      <div class="section-heading">
        <span class="learn-eyebrow">Beginner grammar</span>
        <h2>Grammar Basics</h2>
        <p>Short lessons with an example and a tiny practice prompt.</p>
      </div>
      <div class="grammar-grid">
        ${grammar.map(({ title, explanation, spanish, english, prompt }) => `
          <article class="grammar-card">
            <h3>${title}</h3>
            <p>${explanation}</p>
            <div class="grammar-example"><strong>${spanish}</strong><span>${english}</span></div>
            <small>${prompt}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function speakButton(text, label) {
  return `<button class="pronounce-btn" type="button" aria-label="${label}" onclick="speechSynthesis.cancel(); speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance('${escapeForAttribute(text)}'), { lang: 'es-ES', rate: 0.85, pitch: 1.05 }))"><span class="ui-icon ui-icon-sound" aria-hidden="true"></span></button>`;
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function escapeForAttribute(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, "&quot;");
}
