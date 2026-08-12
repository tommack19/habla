export const GRAMMAR_TOPICS = Object.freeze([
  topic("articles", "Articles", "Choose el, la, los, or las.", "blue", [
    drill("___ casa", "la", ["el", "la"], "Casa is feminine: la casa."),
    drill("___ libros", "los", ["los", "las"], "Libros is masculine plural: los libros."),
    drill("___ mesas", "las", ["los", "las"], "Mesas is feminine plural: las mesas."),
  ]),
  topic("ser-estar", "Ser vs Estar", "Identity, state, and location.", "purple", [
    drill("Yo ___ de Canadá.", "soy", ["soy", "estoy"], "Use ser for origin."),
    drill("Madrid ___ en España.", "está", ["es", "está"], "Use estar for location."),
    drill("Ana ___ cansada.", "está", ["es", "está"], "Use estar for a temporary state."),
  ]),
  topic("agreement", "Adjective Agreement", "Make descriptions match.", "green", [
    drill("una casa ___", "bonita", ["bonito", "bonita"], "Casa is feminine, so bonita agrees."),
    drill("dos cafés ___", "pequeños", ["pequeño", "pequeños"], "The adjective agrees in number."),
    drill("unas manzanas ___", "frescas", ["frescos", "frescas"], "Manzanas is feminine plural."),
  ]),
  topic("possessives", "Possessives", "Use mi, tu, su, and nuestro.", "gold", [
    drill("Carlos es ___ amigo.", "mi", ["mi", "mis"], "Amigo is singular: mi amigo."),
    drill("Marta es ___ esposa.", "su", ["su", "sus"], "Esposa is singular: su esposa."),
    drill("Madrid es ___ ciudad.", "nuestra", ["nuestro", "nuestra"], "Ciudad is feminine: nuestra ciudad."),
  ]),
  topic("questions", "Question Words", "Ask who, what, where, and when.", "blue", [
    drill("¿___ vives?", "Dónde", ["Dónde", "Quién", "Cuándo"], "Dónde asks about a place."),
    drill("¿___ es Ana?", "Quién", ["Qué", "Quién", "Cómo"], "Quién asks about a person."),
    drill("¿___ te llamas?", "Cómo", ["Cómo", "Por qué", "Cuándo"], "Cómo appears in ¿Cómo te llamas?"),
  ]),
  topic("conjugation", "Verb Conjugation", "Match the subject and verb form.", "purple", [
    drill("Yo ___ español.", "hablo", ["hablo", "hablas", "habla"], "Yo uses hablo."),
    drill("Tú ___ en Madrid.", "vives", ["vivo", "vives", "vive"], "Tú uses vives."),
    drill("Nosotros ___ café.", "tomamos", ["tomo", "tomas", "tomamos"], "Nosotros uses tomamos."),
  ]),
]);

export function getGrammarTopic(id) {
  return GRAMMAR_TOPICS.find(item => item.id === id) || GRAMMAR_TOPICS[0];
}

function topic(id, title, subtitle, accent, drills) { return { id, title, subtitle, accent, drills }; }
function drill(prompt, answer, options, explanation) { return { prompt, answer, options, explanation }; }
