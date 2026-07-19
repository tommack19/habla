const item = (id, title, options = {}) => ({ id, title, ...options });
const section = (title, items) => ({ title, items });
const collection = (id, title, plannedCount, unit, items = [], options = {}) => ({
  id, title, plannedCount, unit, items, ...options,
});

const namedItems = values => values.map(title => item(slugify(title), title));
const lessonItem = (id, title, sourceLessonIds, options = {}) => item(id, title, { sourceLessonIds, ...options });
const verbItem = (id, title, english, forms, examples, note, mistake) => item(id, title, {
  libraryContent: {
    kind: "verb", english, forms,
    examples: examples.map(([spanish, translation]) => ({ spanish, english: translation })),
    explanation: note,
    commonMistake: mistake,
  },
});

const CORE_VERBS = [
  verbItem("ser", "Ser", "to be (identity)", ["soy", "eres", "es", "somos", "son"], [["Soy estudiante.", "I am a student."], ["Ella es de México.", "She is from Mexico."], ["Somos amigos.", "We are friends."]], "Use ser for identity, origin, profession, time, and defining characteristics.", "Use estar—not ser—for temporary location and many temporary states."),
  verbItem("estar", "Estar", "to be (state/location)", ["estoy", "estás", "está", "estamos", "están"], [["Estoy cansado.", "I am tired."], ["Madrid está en España.", "Madrid is in Spain."], ["Estamos en casa.", "We are at home."]], "Use estar for location and states that can change.", "Location uses estar even when the location is permanent."),
  verbItem("tener", "Tener", "to have", ["tengo", "tienes", "tiene", "tenemos", "tienen"], [["Tengo dos hermanos.", "I have two brothers."], ["Tenemos hambre.", "We are hungry."], ["¿Tienes tiempo?", "Do you have time?"]], "Tener also appears in common expressions such as tener hambre and tener años.", "Say tengo veinte años, not soy veinte años."),
  verbItem("ir", "Ir", "to go", ["voy", "vas", "va", "vamos", "van"], [["Voy al trabajo.", "I am going to work."], ["Vamos a comer.", "We are going to eat."], ["¿Adónde vas?", "Where are you going?"]], "Use ir a plus an infinitive for near-future plans.", "Use al before a masculine singular destination: voy al banco."),
  verbItem("hacer", "Hacer", "to do / to make", ["hago", "haces", "hace", "hacemos", "hacen"], [["Hago la cena.", "I make dinner."], ["¿Qué haces?", "What are you doing?"], ["Hace frío.", "It is cold."]], "Hacer covers both doing and making and appears in weather expressions.", "Weather expressions use hace: hace calor, not está calor."),
  verbItem("poder", "Poder", "can / to be able to", ["puedo", "puedes", "puede", "podemos", "pueden"], [["Puedo ayudarte.", "I can help you."], ["¿Puede repetir?", "Can you repeat?"], ["No podemos ir.", "We cannot go."]], "Poder plus an infinitive expresses ability or a polite request.", "The stem changes o→ue except in nosotros."),
  verbItem("querer", "Querer", "to want / to love", ["quiero", "quieres", "quiere", "queremos", "quieren"], [["Quiero un café.", "I want a coffee."], ["¿Quieres venir?", "Do you want to come?"], ["Te quiero.", "I love you."]], "Querer plus a noun or infinitive expresses what someone wants.", "The stem changes e→ie except in nosotros."),
  verbItem("venir", "Venir", "to come", ["vengo", "vienes", "viene", "venimos", "vienen"], [["Vengo de Canadá.", "I come from Canada."], ["¿Vienes conmigo?", "Are you coming with me?"], ["Venimos mañana.", "We are coming tomorrow."]], "Venir often uses de for origin and a for destination.", "The yo form is vengo; the other singular forms change e→ie."),
  verbItem("decir", "Decir", "to say / to tell", ["digo", "dices", "dice", "decimos", "dicen"], [["Digo la verdad.", "I tell the truth."], ["¿Cómo se dice?", "How do you say it?"], ["Me dicen Ana.", "They call me Ana."]], "Decir can mean say or tell depending on context.", "Use digo for yo and dicen—not dicen—with ustedes/ellos."),
  verbItem("dar", "Dar", "to give", ["doy", "das", "da", "damos", "dan"], [["Te doy mi número.", "I give you my number."], ["¿Me da la cuenta?", "Will you give me the bill?"], ["Damos las gracias.", "We give thanks."]], "Dar is common in requests and fixed expressions.", "The yo form is doy; the other present forms are regular."),
];
const regularVerb = (title, english, ending, examples) => {
  const stem = title.toLowerCase().slice(0, -2);
  const endings = ending === "ar" ? ["o", "as", "a", "amos", "an"] : ending === "er" ? ["o", "es", "e", "emos", "en"] : ["o", "es", "e", "imos", "en"];
  return verbItem(slugify(title), title, english, endings.map(suffix => `${stem}${suffix}`), examples, `Regular -${ending.toUpperCase()} verbs use a predictable set of present-tense endings.`, `Remove -${ending} before adding the matching ending.`);
};
const REGULAR_AR = [
  regularVerb("Hablar", "to speak", "ar", [["Hablo español.", "I speak Spanish."], ["¿Hablas inglés?", "Do you speak English?"]]),
  regularVerb("Trabajar", "to work", "ar", [["Trabajo en casa.", "I work at home."], ["Trabajamos mañana.", "We work tomorrow."]]),
  regularVerb("Estudiar", "to study", "ar", [["Estudio español.", "I study Spanish."], ["Ellos estudian mucho.", "They study a lot."]]),
  regularVerb("Comprar", "to buy", "ar", [["Compro pan.", "I buy bread."], ["¿Compras ropa?", "Do you buy clothes?"]]),
];
const REGULAR_ER = [
  regularVerb("Comer", "to eat", "er", [["Como arroz.", "I eat rice."], ["Comemos a las seis.", "We eat at six."]]),
  regularVerb("Beber", "to drink", "er", [["Bebo agua.", "I drink water."], ["¿Bebes café?", "Do you drink coffee?"]]),
  regularVerb("Aprender", "to learn", "er", [["Aprendo español.", "I learn Spanish."], ["Aprenden rápido.", "They learn quickly."]]),
  regularVerb("Leer", "to read", "er", [["Leo un libro.", "I read a book."], ["Leemos el menú.", "We read the menu."]]),
];
const REGULAR_IR = [
  regularVerb("Vivir", "to live", "ir", [["Vivo en Canadá.", "I live in Canada."], ["Vivimos aquí.", "We live here."]]),
  regularVerb("Escribir", "to write", "ir", [["Escribo un mensaje.", "I write a message."], ["Escribes muy bien.", "You write very well."]]),
  regularVerb("Abrir", "to open", "ir", [["Abro la puerta.", "I open the door."], ["Abrimos a las nueve.", "We open at nine."]]),
  regularVerb("Recibir", "to receive", "ir", [["Recibo un correo.", "I receive an email."], ["Reciben visitas.", "They receive visitors."]]),
];
const MORE_IRREGULAR = [
  verbItem("salir", "Salir", "to leave / go out", ["salgo", "sales", "sale", "salimos", "salen"], [["Salgo a las ocho.", "I leave at eight."], ["Salimos esta noche.", "We are going out tonight."]], "Salir has an irregular yo form but otherwise follows regular -IR endings.", "The yo form is salgo, not salo."),
  verbItem("poner", "Poner", "to put", ["pongo", "pones", "pone", "ponemos", "ponen"], [["Pongo la mesa.", "I set the table."], ["¿Dónde pones la llave?", "Where do you put the key?"]], "Poner is irregular only in the present yo form.", "The yo form is pongo, not pono."),
  verbItem("saber", "Saber", "to know (facts/how)", ["sé", "sabes", "sabe", "sabemos", "saben"], [["Sé la respuesta.", "I know the answer."], ["¿Sabes nadar?", "Do you know how to swim?"]], "Use saber for facts, information, and knowing how to do something.", "Use conocer for familiarity with people and places."),
  verbItem("conocer", "Conocer", "to know / be familiar with", ["conozco", "conoces", "conoce", "conocemos", "conocen"], [["Conozco Madrid.", "I know Madrid."], ["¿Conoces a Carlos?", "Do you know Carlos?"]], "Use conocer for people, places, and things you are familiar with.", "Use personal a before a person: conozco a Ana."),
];
const PAST_STARTERS = [
  verbItem("hablar-preterite", "Hablar · Preterite", "spoke / talked", ["hablé", "hablaste", "habló", "hablamos", "hablaron"], [["Hablé con Ana ayer.", "I spoke with Ana yesterday."], ["Hablamos por teléfono.", "We talked by phone."]], "The preterite presents a completed action in the past.", "The yo ending carries an accent: hablé."),
  verbItem("comer-preterite", "Comer · Preterite", "ate", ["comí", "comiste", "comió", "comimos", "comieron"], [["Comí temprano.", "I ate early."], ["Comieron en casa.", "They ate at home."]], "Regular -ER and -IR verbs share preterite endings.", "The third-person singular ending carries an accent: comió."),
];
const FUTURE_STARTERS = [
  verbItem("hablar-future", "Hablar · Future", "will speak", ["hablaré", "hablarás", "hablará", "hablaremos", "hablarán"], [["Hablaré mañana.", "I will speak tomorrow."], ["Hablaremos después.", "We will talk later."]], "Add future endings to the complete infinitive.", "Keep the full infinitive: hablaré, not hableré."),
  verbItem("ir-a-infinitive", "Ir a + Infinitive", "going to do something", ["voy a", "vas a", "va a", "vamos a", "van a"], [["Voy a viajar.", "I am going to travel."], ["Vamos a comer.", "We are going to eat."]], "Use a present form of ir + a + infinitive for a near-future plan.", "Do not conjugate the second verb: voy a comer, not voy a como."),
];

const EXPRESSION_LESSONS = {
  greetings: ["a1-lesson-01-greetings"], goodbyes: ["a1-lesson-01-greetings"], "please-thank-you": ["a1-lesson-01-greetings", "lesson-23-asking-for-help"],
  "polite-expressions": ["lesson-23-asking-for-help"], apologies: ["lesson-23-asking-for-help"], questions: ["a1-lesson-02-introductions"], responses: ["a1-lesson-02-introductions"],
  "ordering-coffee": ["lesson-06-food-drinks"], restaurant: ["lesson-06-food-drinks"], "fast-food": ["lesson-06-food-drinks"], bar: ["lesson-06-food-drinks"], paying: ["lesson-05-shopping", "lesson-06-food-drinks"], reservations: ["lesson-27-hotels"],
  airport: ["lesson-28-airport"], hotel: ["lesson-27-hotels"], taxi: ["lesson-07-travel-basics"], directions: ["lesson-21-directions"], train: ["lesson-22-transportation"], bus: ["lesson-22-transportation"],
  parents: ["lesson-03-family"], children: ["lesson-03-family"], partner: ["lesson-03-family"], "visiting-family": ["lesson-03-family"], "phone-calls": ["lesson-25-phone-conversations"],
  dating: ["a1-lesson-02-introductions", "lesson-15-hobbies"], friends: ["a1-lesson-02-introductions"], parties: ["a1-lesson-02-introductions"], "small-talk": ["lesson-11-weather", "lesson-15-hobbies"], sports: ["lesson-16-sports"], hobbies: ["lesson-15-hobbies"],
  "text-messages": ["lesson-25-phone-conversations"], "social-media": ["lesson-25-phone-conversations"], email: ["lesson-14-work"], slang: ["lesson-20-everyday-life-review"], mexico: ["lesson-20-everyday-life-review"], spain: ["lesson-20-everyday-life-review"], "latin-america": ["lesson-20-everyday-life-review"],
};
const expressionItems = titles => titles.map(title => lessonItem(slugify(title), title, EXPRESSION_LESSONS[slugify(title)] || ["lesson-20-everyday-life-review"]));

export const PRACTICE_LIBRARY_CONTENT_SCHEMAS = {
  verb: { fields: ["infinitive", "english", "conjugations", "examples", "audio", "level", "tags"] },
  grammar: { fields: ["title", "explanation", "examples", "commonMistake", "level", "tags"] },
  expression: { fields: ["spanish", "english", "exampleSpanish", "exampleEnglish", "category", "favorite", "audio", "conversationPrompt"] },
  smartReview: { fields: ["sourceId", "sourceType", "dueAt", "difficulty", "lastResult", "lastPracticedAt"] },
};

export const PRACTICE_LIBRARY_CATEGORIES = [
  {
    id: "topics", title: "Topics", description: "Practice real-life situations.", accent: "green", icon: "topics",
    sections: [section("Real-life Spanish", [
      item("greetings", "Greetings", { practiceTopic: "greetings", lessonIds: ["a1-lesson-01-greetings", "a1-lesson-02-introductions"] }),
      item("family", "Family", { practiceTopic: "family", lessonIds: ["lesson-03-family", "lesson-08-vacation"] }),
      item("restaurants", "Restaurants", { practiceTopic: "food-restaurants", lessonIds: ["lesson-06-food-drinks"] }),
      item("travel", "Travel", { practiceTopic: "travel", lessonIds: ["lesson-07-travel-basics"] }),
      item("shopping", "Shopping", { practiceTopic: "shopping", lessonIds: ["lesson-05-shopping"] }),
      item("work", "Work", { practiceTopic: "work", lessonIds: ["lesson-14-work"] }),
      item("small-talk", "Small Talk", { practiceTopic: "phrases", lessonIds: ["a1-lesson-02-introductions"] }),
      item("numbers", "Numbers", { practiceTopic: "numbers", lessonIds: ["lesson-04-numbers-time"] }),
      item("time", "Time", { practiceTopic: "time", lessonIds: ["lesson-04-numbers-time"] }),
      item("weather", "Weather", { practiceTopic: "weather", lessonIds: ["lesson-11-weather"] }),
      item("directions", "Directions", { practiceTopic: "directions", lessonIds: ["lesson-21-directions"] }),
      item("health", "Health", { practiceTopic: "health", lessonIds: ["lesson-17-health"] }),
      item("hobbies", "Hobbies", { practiceTopic: "hobbies", lessonIds: ["lesson-15-hobbies"] }),
      item("school", "School", { practiceTopic: "school", lessonIds: ["lesson-13-school"] }),
      item("phone-calls", "Phone Calls", { practiceTopic: "phone-calls", lessonIds: ["lesson-25-phone-conversations"] }),
      item("airport", "Airport", { practiceTopic: "airport", lessonIds: ["lesson-28-airport"] }),
      item("hotel", "Hotel", { practiceTopic: "hotel", lessonIds: ["lesson-27-hotels"] }),
      item("emergency", "Emergency", { practiceTopic: "emergency", lessonIds: ["lesson-24-emergencies"] }),
      item("dating", "Dating"), item("culture", "Culture"),
    ])],
  },
  {
    id: "verbs", title: "Verbs", description: "Master the most important Spanish verbs.", accent: "gold", icon: "verbs", contentSchema: "verb",
    featured: { eyebrow: "Featured", title: "The 10 Verbs You'll Use Every Day", description: "Build your Spanish around the verbs that matter most.", collectionId: "core-verbs" },
    launcherActions: ["mini-lessons", "flashcards", "quiz", "conjugation"],
    collections: [
      collection("core-verbs", "Core Verbs", 10, "verbs", CORE_VERBS),
      collection("regular-ar", "Regular -AR Verbs", 24, "verbs", REGULAR_AR),
      collection("regular-er", "Regular -ER Verbs", 22, "verbs", REGULAR_ER),
      collection("regular-ir", "Regular -IR Verbs", 20, "verbs", REGULAR_IR),
      collection("irregular-verbs", "Irregular Verbs", 32, "verbs", MORE_IRREGULAR),
      collection("past-tense", "Past Tense", 18, "lessons", PAST_STARTERS),
      collection("future-tense", "Future Tense", 12, "lessons", FUTURE_STARTERS),
      collection("subjunctive", "Subjunctive", 0, "lessons", [], { locked: true, level: "A2+" }),
    ],
  },
  {
    id: "grammar", title: "Grammar", description: "Build your Spanish foundation.", accent: "purple", icon: "grammar", contentSchema: "grammar",
    featured: { eyebrow: "Featured", title: "Master Ser vs Estar", description: "Learn when Spanish uses each form of ‘to be.’", collectionId: "present-tense", itemId: "ser-vs-estar" },
    launcherActions: ["mini-lesson", "examples", "flashcards", "conversation", "quiz"],
    collections: [
      collection("sentence-basics", "Sentence Basics", 5, "lessons", [
        lessonItem("articles-basics", "Articles", ["lesson-18-body-parts"]), lessonItem("gender-basics", "Gender", ["lesson-12-clothing"]), lessonItem("plural-basics", "Plural", ["lesson-03-family"]), lessonItem("word-order", "Word Order", ["a1-lesson-02-introductions"]), lessonItem("sentence-structure", "Sentence Structure", ["lesson-20-everyday-life-review"]),
      ]),
      collection("nouns-gender", "Nouns & Gender", 3, "lessons", [lessonItem("noun-gender", "Masculine & Feminine Nouns", ["lesson-12-clothing"], { libraryContent: { kind: "grammar", explanation: "Every Spanish noun has grammatical gender. Learn the noun together with its article: el libro, la mesa. Endings are useful clues, but the article is the reliable guide.", examples: [{ spanish: "el libro", english: "the book" }, { spanish: "la mesa", english: "the table" }, { spanish: "la mano", english: "the hand" }], commonMistake: "Do not assume every noun ending in -o is masculine or every noun ending in -a is feminine; la mano and el día are common exceptions." } }), lessonItem("people-gender", "People & Family Words", ["lesson-03-family"]), lessonItem("gender-agreement", "Gender Agreement", ["lesson-12-clothing"])]),
      collection("articles", "Articles", 2, "lessons", [lessonItem("definite-articles", "El, La, Los & Las", ["lesson-18-body-parts"]), lessonItem("indefinite-articles", "Un, Una, Unos & Unas", ["lesson-05-shopping"])]),
      collection("question-words", "Question Words", 2, "lessons", [lessonItem("question-word-basics", "Qué, Quién, Dónde & Cómo", ["a1-lesson-02-introductions"]), lessonItem("asking-follow-ups", "Asking Follow-up Questions", ["a1-lesson-02-introductions", "lesson-23-asking-for-help"])]),
      collection("pronouns", "Pronouns", 3, "lessons", [lessonItem("subject-pronouns", "Subject Pronouns", ["a1-lesson-02-introductions"]), lessonItem("possessives", "Possessives", ["lesson-03-family"]), lessonItem("object-pronouns", "Object Pronouns", ["lesson-17-health"])]),
      collection("present-tense", "Present Tense", 3, "lessons", [lessonItem("regular-present", "Regular Present Tense", ["lesson-09-around-the-house", "lesson-14-work"]), lessonItem("ser-vs-estar", "Ser vs Estar", ["a1-lesson-02-introductions", "lesson-19-emotions"], { libraryContent: { kind: "grammar", explanation: "Use ser for identity, origin, profession, time, and defining traits. Use estar for location and states or conditions that can change.", examples: [{ spanish: "Soy canadiense.", english: "I am Canadian." }, { spanish: "Estoy cansado.", english: "I am tired." }, { spanish: "La tienda está aquí.", english: "The store is here." }], commonMistake: "Location normally uses estar—even for permanent locations: Madrid está en España." } }), lessonItem("stem-changing-verbs", "Stem-changing Verbs", ["lesson-05-shopping"])]),
      collection("past-tense", "Past Tense", 2, "lessons", [], { locked: true, level: "A2" }),
      collection("future", "Future", 0, "lessons", [], { locked: true, level: "A2" }),
      collection("comparisons", "Comparisons", 1, "lesson", [lessonItem("basic-comparisons", "Más, Menos & Tan", ["lesson-05-shopping"])]),
      collection("existence-location", "Existence & Location", 1, "lesson", [lessonItem("hay-vs-estar", "Hay vs Estar", ["lesson-08-vacation"], { libraryContent: { kind: "grammar", explanation: "Use hay to introduce what exists and está to locate a known singular object.", examples: [{ spanish: "Hay una foto.", english: "There is a photo." }, { spanish: "La foto está en la estantería.", english: "The photo is on the bookshelf." }], commonMistake: "Say Hay un sofá to introduce it, then El sofá está junto a la ventana to locate it." } })]),
      collection("prepositions", "Prepositions", 2, "lessons", [lessonItem("location-prepositions", "Location Words", ["lesson-08-vacation"]), lessonItem("a-de-en", "A, De & En", ["lesson-07-travel-basics"])]),
      collection("reflexive-verbs", "Reflexive Verbs", 1, "lesson", [lessonItem("daily-reflexives", "Daily Routine Reflexives", ["lesson-10-daily-routine"])]),
      collection("commands", "Commands", 2, "lessons", [lessonItem("direction-commands", "Direction Commands", ["lesson-21-directions"]), lessonItem("polite-commands", "Polite Commands", ["lesson-23-asking-for-help"])]),
      collection("advanced-grammar", "Advanced Grammar", 0, "lessons", [], { locked: true, level: "A2+" }),
    ],
  },
  {
    id: "expressions", title: "Common Expressions", shortTitle: "Expressions", description: "Everyday Spanish people actually use.", accent: "pink", icon: "expressions", contentSchema: "expression",
    capabilities: ["Spanish", "English", "Example", "Favorite", "Audio", "Conversation"],
    featured: { eyebrow: "Featured", title: "Sound Like a Local", description: "A growing collection of natural, everyday Spanish.", collectionId: "everyday" },
    collections: [
      collection("everyday", "Everyday", 7, "collections", expressionItems(["Greetings", "Goodbyes", "Please & Thank You", "Polite Expressions", "Apologies", "Questions", "Responses"])),
      collection("eating-out", "Eating Out", 6, "collections", expressionItems(["Ordering Coffee", "Restaurant", "Fast Food", "Bar", "Paying", "Reservations"])),
      collection("travel", "Travel", 6, "collections", expressionItems(["Airport", "Hotel", "Taxi", "Directions", "Train", "Bus"])),
      collection("family", "Family", 5, "collections", expressionItems(["Parents", "Children", "Partner", "Visiting Family", "Phone Calls"])),
      collection("social", "Social", 6, "collections", expressionItems(["Dating", "Friends", "Parties", "Small Talk", "Sports", "Hobbies"])),
      collection("modern-spanish", "Modern Spanish", 8, "collections", expressionItems(["Text Messages", "Social Media", "Phone Calls", "Email", "Slang", "Mexico", "Spain", "Latin America"])),
    ],
  },
  {
    id: "smart-review", title: "Smart Review", description: "Automatically generated from your Habla progress.", accent: "blue", icon: "smart-review", dynamic: true, contentSchema: "smartReview",
    sections: [section("Your Review", [
      item("due-today", "Due Today", { smartKey: "dueToday" }), item("weak-words", "Weak Words", { smartKey: "weakWords" }),
      item("recently-missed", "Recently Missed", { smartKey: "recentlyMissed" }), item("favorites", "Favorites", { smartKey: "favorites" }),
      item("recently-practiced", "Recently Practiced", { smartKey: "recentlyPracticed" }), item("daily-review", "Daily Review", { smartKey: "dailyReview" }),
      item("difficult-verbs", "Most Difficult Verbs", { smartKey: "difficultVerbs" }), item("difficult-expressions", "Most Difficult Expressions", { smartKey: "difficultExpressions" }),
    ])],
  },
];

export function findPracticeLibraryCategory(id) {
  return PRACTICE_LIBRARY_CATEGORIES.find(category => category.id === id) || null;
}

export function findPracticeLibraryCollection(categoryId, collectionId) {
  const category = findPracticeLibraryCategory(categoryId);
  const found = category?.collections?.find(entry => entry.id === collectionId);
  return found ? { category, collection: found } : null;
}

export function findPracticeLibraryItem(categoryId, itemId, collectionId = "") {
  const category = findPracticeLibraryCategory(categoryId);
  if (!category) return null;
  const groups = collectionId
    ? (category.collections || []).filter(entry => entry.id === collectionId)
    : [...(category.sections || []), ...(category.collections || [])];
  for (const group of groups) {
    const found = group.items.find(entry => entry.id === itemId);
    if (found) return { category, collection: category.collections?.includes(group) ? group : null, section: category.sections?.includes(group) ? group : null, item: found };
  }
  return null;
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
