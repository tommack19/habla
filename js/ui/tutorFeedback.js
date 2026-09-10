function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Model output is always textContent, never executable markup.
export function attachTutorFeedback(bubble, turn, { speak, save, hint }) {
  const body = bubble?.querySelector(".bub-body");
  if (!body || !turn) return;
  const feedback = element("div", "tutor-feedback");
  if (turn.translation) {
    const translation = element("p", "tutor-translation", turn.translation);
    translation.lang = "en";
    feedback.append(translation);
  }
  const actions = element("div", "tutor-reply-actions");
  for (const [label, rate] of [["Listen", 0.96], ["Slower", 0.76]]) {
    const button = element("button", "", label);
    button.type = "button";
    button.addEventListener("click", () => speak(turn.reply, rate));
    actions.append(button);
  }
  feedback.append(actions);
  if (turn.correction?.corrected) {
    const correction = element("aside", "tutor-correction");
    correction.setAttribute("aria-label", "A useful correction");
    correction.append(element("strong", "tutor-correction-title", "One small improvement"));
    correction.append(element("span", "tutor-original", turn.correction.original));
    const better = element("span", "tutor-corrected", turn.correction.corrected);
    better.lang = "es";
    correction.append(better, element("p", "tutor-translation", turn.correction.translation), element("p", "", turn.correction.explanation));
    feedback.append(correction);
  }
  const vocabulary = Array.isArray(turn.vocabulary) ? turn.vocabulary.slice(0, 3) : [];
  if (vocabulary.length) {
    const phrases = element("details", "tutor-phrases");
    phrases.append(element("summary", "", "Keep a useful phrase"));
    vocabulary.forEach(phrase => {
      const row = element("div", "tutor-phrase");
      const copy = element("div");
      const spanish = element("strong", "", phrase.spanish);
      spanish.lang = "es";
      copy.append(spanish, element("span", "", phrase.english));
      const button = element("button", "", "Save");
      button.type = "button";
      button.setAttribute("aria-label", `Save ${phrase.spanish} to Practice`);
      button.addEventListener("click", () => {
        if (save(phrase)) { button.textContent = "Saved"; button.disabled = true; }
      });
      row.append(copy, button);
      phrases.append(row);
    });
    feedback.append(phrases);
  }
  const suggestions = Array.isArray(turn.suggestions) ? turn.suggestions.slice(0, 2) : [];
  if (suggestions.length) {
    const hints = element("div", "tutor-hints");
    hints.setAttribute("aria-label", "Response starters");
    suggestions.forEach(suggestion => {
      const button = element("button");
      button.type = "button";
      const spanish = element("span", "", suggestion.spanish);
      spanish.lang = "es";
      button.append(spanish, element("small", "", suggestion.english));
      button.addEventListener("click", () => hint(suggestion.spanish));
      hints.append(button);
    });
    feedback.append(hints);
  }
  body.querySelector("time")?.before(feedback);
}
