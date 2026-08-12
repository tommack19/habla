export const PRACTICE_VERBS = Object.freeze([
  verb("ser", "to be (identity)", ["soy", "eres", "es", "somos", "sois", "son"], ["Yo ____ Tom.", "Tú ____ de Madrid.", "Ella ____ mi amiga."]),
  verb("estar", "to be (state/location)", ["estoy", "estás", "está", "estamos", "estáis", "están"], ["Yo ____ en Madrid.", "Tú ____ bien.", "La taza ____ en la mesa."]),
  verb("tener", "to have", ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"], ["Yo ____ un café.", "Tú ____ tiempo.", "Carlos ____ una hermana."]),
  verb("llamarse", "to be called", ["me llamo", "te llamas", "se llama", "nos llamamos", "os llamáis", "se llaman"], ["Yo ____ Tom.", "¿Cómo ____ tú?", "Ella ____ Ana."]),
  verb("ir", "to go", ["voy", "vas", "va", "vamos", "vais", "van"], ["Yo ____ al mercado.", "Tú ____ a casa.", "Nosotros ____ al café."]),
  verb("hacer", "to do / make", ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"], ["Yo ____ café.", "¿Qué ____ tú?", "Ellos ____ la cena."]),
]);

export const VERB_SUBJECTS = Object.freeze(["yo", "tú", "él / ella / usted", "nosotros", "vosotros", "ellos / ellas / ustedes"]);

export function getVerb(id) {
  return PRACTICE_VERBS.find(item => item.id === id) || PRACTICE_VERBS[0];
}

export function buildVerbQuestion(verb, index = 0) {
  const subjectIndex = index % VERB_SUBJECTS.length;
  const answer = verb.present[subjectIndex];
  const example = index < verb.examples.length
    ? verb.examples[index]
    : `${capitalize(VERB_SUBJECTS[subjectIndex])} ____ (${verb.infinitive}).`;
  const alternatives = PRACTICE_VERBS.flatMap(item => item.present).filter(item => item !== answer);
  return {
    id: `${verb.id}-${index}`,
    verbId: verb.id,
    infinitive: verb.infinitive,
    subject: VERB_SUBJECTS[subjectIndex],
    prompt: example || `${capitalize(VERB_SUBJECTS[subjectIndex].split(" ")[0])} ____`,
    answer,
    options: stableOptions(answer, alternatives, `${verb.id}-${index}`),
    type: ["multiple", "fill", "conjugation", "match"][index % 4],
  };
}

function verb(infinitive, english, present, examples) {
  return { id: infinitive, infinitive, english, tense: "Present", present, examples };
}

function stableOptions(answer, alternatives, seed) {
  const selected = [...new Set(alternatives)].sort((a, b) => hash(`${seed}-${a}`) - hash(`${seed}-${b}`)).slice(0, 3);
  return [answer, ...selected].sort((a, b) => hash(`${seed}-order-${a}`) - hash(`${seed}-order-${b}`));
}

function hash(value) {
  return [...String(value)].reduce((sum, character) => ((sum * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
}

function capitalize(value) { return value.charAt(0).toUpperCase() + value.slice(1); }
