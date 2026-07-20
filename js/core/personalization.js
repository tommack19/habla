import { state } from "./state.js";

export function personalizeText(value) {
  const user = state.user || {};
  const displayName = String(user.name || "Habla learner").trim().split(/\s+/)[0] || "Habla learner";
  const countryEnglish = String(user.country || "Canada").trim() || "Canada";
  const city = String(user.city || "Winnipeg").trim() || "Winnipeg";
  const countryNames = {
    canada: "Canadá",
    "united states": "Estados Unidos",
    usa: "Estados Unidos",
    "united kingdom": "Reino Unido",
    uk: "Reino Unido",
    england: "Inglaterra",
    spain: "España",
    mexico: "México",
    germany: "Alemania",
    france: "Francia",
    italy: "Italia",
    brazil: "Brasil",
    australia: "Australia",
    colombia: "Colombia",
    argentina: "Argentina",
    chile: "Chile",
    peru: "Perú",
  };
  const cityNames = {
    london: "Londres",
    munich: "Múnich",
    "new york": "Nueva York",
    sydney: "Sídney",
  };
  const spanishCountry = countryNames[normalizePlace(countryEnglish)] || countryEnglish;
  const spanishCity = cityNames[normalizePlace(city)] || city;

  return String(value ?? "")
    .replaceAll("{{learnerName}}", displayName)
    .replaceAll("{{learnerCountryEnglish}}", countryEnglish)
    .replaceAll("{{learnerCountry}}", spanishCountry)
    .replaceAll("{{learnerCity}}", spanishCity)
    .replaceAll("{{learnerNativeLanguage}}", String(user.nativeLanguage || "English"));
}

function normalizePlace(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
