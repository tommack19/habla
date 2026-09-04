export const CHARACTER_VOICES = Object.freeze({
  carlos: "NhUo7cJi70nyU8yfCimA",
  ana: "yiWEefwu5z3DQCM79clN",
  marta: "1eHrpOW5l98cxiSRjbzJ",
  elena: "gD1IexrzCvsXPHUuT0s3",
  javier: "y6WtESLj18d0diFRruBs",
  lucia: "TVZcExm6tc18D9qo57y7",
  diego: "iJQjCIhyynnZMKT6NN3H",
  nico: "uU1QvfOppdkePeLtG9pI",
  vendor: "7ilYbYb99yBZGMUUKSaf",
  model: "E4aVOlWL5DGbFy7TWmZA",
});

const SPEAKER_ALIASES = Object.freeze({
  learner: "model",
  student: "model",
  you: "model",
  customer: "model",
  child: "nico",
  laura: "ana",
  tia: "elena",
  vecina: "marta",
  vecino: "javier",
  server: "vendor",
  waiter: "vendor",
  waitress: "vendor",
  camarero: "vendor",
  camarera: "vendor",
  vendedor: "vendor",
  vendedora: "vendor",
  shopkeeper: "vendor",
});

export function resolveCharacterVoice(speaker = "Carlos") {
  const normalized = String(speaker)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  let character = SPEAKER_ALIASES[normalized] || normalized;
  if (normalized.startsWith("senora ")) character = "elena";
  if (normalized.startsWith("senor ")) character = "javier";

  return {
    character: CHARACTER_VOICES[character] ? character : "carlos",
    voiceId: CHARACTER_VOICES[character] || CHARACTER_VOICES.carlos,
  };
}
