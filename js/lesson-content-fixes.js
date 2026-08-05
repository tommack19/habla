(() => {
  const originalFetch = window.fetch.bind(window);

  const normalize = value => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  function walk(value, visitor) {
    if (Array.isArray(value)) {
      value.forEach(item => walk(item, visitor));
      visitor(value);
      return;
    }
    if (!value || typeof value !== "object") return;
    visitor(value);
    Object.values(value).forEach(item => walk(item, visitor));
  }

  function dedupeQuiz(lesson) {
    if (!Array.isArray(lesson.quiz)) return;
    const seen = new Set();
    lesson.quiz = lesson.quiz.filter(question => {
      const prompt = normalize(question.prompt || question.question || question.text);
      const options = Array.isArray(question.options)
        ? question.options.map(option => normalize(
            typeof option === "string" ? option : option.text || option.label || option.value
          )).sort().join("|")
        : "";
      const key = `${prompt}::${options}`;
      if (!prompt || !seen.has(key)) {
        seen.add(key);
        return true;
      }
      return false;
    });
  }

  function patchLesson(lesson, url) {
    const isLesson1 = /lesson-01-greetings\.json/i.test(url);
    const isLesson2 = /lesson-02-introductions\.json/i.test(url);
    const isLesson3 = /lesson-03-family\.json/i.test(url);

    if (!(isLesson1 || isLesson2 || isLesson3)) return lesson;

    dedupeQuiz(lesson);

    walk(lesson, object => {
      if (Array.isArray(object)) return;
      const spanish = normalize(object.spanish || object.text || object.phrase);
      const english = normalize(object.english || object.meaning || object.translation);

      if (isLesson2 && spanish === "soy de") {
        if ("english" in object) object.english = "I am from";
        if ("meaning" in object) object.meaning = "I am from";
        if ("translation" in object) object.translation = "I am from";
      }

      if (spanish === "encantado") {
        object.tip = "Used by a male speaker to say pleased to meet you.";
        object.usage = object.usage || object.tip;
      }

      if (spanish === "encantada") {
        object.tip = "Used by a female speaker to say pleased to meet you.";
        object.usage = object.usage || object.tip;
      }

      if (isLesson3 && english === "he" && /padre|papa/.test(spanish)) {
        if ("spanish" in object) object.spanish = "él";
        if ("text" in object) object.text = "él";
        if ("phrase" in object) object.phrase = "él";
        object.exampleSpanish = "Él es mi padre.";
        object.exampleEnglish = "He is my father.";
      }

      if (isLesson3 && spanish === "el") {
        object.exampleSpanish = "Él es mi hermano.";
        object.exampleEnglish = "He is my brother.";
      }

      if (isLesson3 && spanish === "ella") {
        object.exampleSpanish = "Ella es mi hermana.";
        object.exampleEnglish = "She is my sister.";
      }

      if (isLesson3 && spanish === "este") {
        object.exampleSpanish = "Este es mi padre.";
        object.exampleEnglish = "This is my father.";
      }

      if (isLesson3 && spanish === "esta") {
        object.exampleSpanish = "Esta es mi hermana.";
        object.exampleEnglish = "This is my sister.";
      }

      const prompt = String(object.prompt || object.carlosPrompt || "").trim();
      if (prompt === "¿Y tú?") {
        if ("prompt" in object) object.prompt = "¿Tienes hermanos?";
        if ("carlosPrompt" in object) object.carlosPrompt = "Yo tengo una hermana. ¿Y tú?";
        if ("promptEnglish" in object) object.promptEnglish = "Do you have siblings?";
        if ("carlosPromptEnglish" in object) {
          object.carlosPromptEnglish = "I have one sister. And you?";
        }
      }

      const line = String(object.spanish || object.text || "");
      if (/Mucho gusto a todos\. Carlos, ¿y ella\?/i.test(line)) {
        const replacement = "Mucho gusto a todos. Carlos, ¿quién es ella?";
        if ("spanish" in object) object.spanish = replacement;
        if ("text" in object) object.text = replacement;
        if ("english" in object) {
          object.english = "Nice to meet everyone. Carlos, who is she?";
        }
        if ("meaning" in object) {
          object.meaning = "Nice to meet everyone. Carlos, who is she?";
        }
      }
    });

    return lesson;
  }

  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const request = args[0];
    const url = typeof request === "string" ? request : request?.url || "";

    if (!/content\/A1\/lesson-0[123]-.*\.json(?:\?|$)/i.test(url) || !response.ok) {
      return response;
    }

    try {
      const lesson = patchLesson(await response.clone().json(), url);
      const headers = new Headers(response.headers);
      headers.set("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify(lesson), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.warn("Habla lesson content patch skipped", error);
      return response;
    }
  };
})();
