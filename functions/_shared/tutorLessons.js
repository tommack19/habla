// Import canonical lesson JSON directly so tutor context cannot drift from Learn.
import lesson1 from "../../content/A1/lesson-01-greetings.json" with { type: "json" };
import lesson2 from "../../content/A1/lesson-02-introductions.json" with { type: "json" };
import lesson3 from "../../content/A1/lesson-03-family.json" with { type: "json" };
import lesson4 from "../../content/A1/lesson-04-numbers-time.json" with { type: "json" };
import lesson5 from "../../content/A1/lesson-05-shopping.json" with { type: "json" };
import lesson6 from "../../content/A1/lesson-06-food-drinks.json" with { type: "json" };
import lesson7 from "../../content/A1/lesson-07-travel-basics.json" with { type: "json" };
import lesson8 from "../../content/A1/lesson-08-vacation.json" with { type: "json" };
import lesson9 from "../../content/A1/lesson-09-around-the-house.json" with { type: "json" };
import lesson10 from "../../content/A1/lesson-10-daily-routine.json" with { type: "json" };
import lesson11 from "../../content/A1/lesson-11-weather.json" with { type: "json" };
import lesson12 from "../../content/A1/lesson-12-clothing.json" with { type: "json" };
import lesson13 from "../../content/A1/lesson-13-school.json" with { type: "json" };
import lesson14 from "../../content/A1/lesson-14-work.json" with { type: "json" };
import lesson15 from "../../content/A1/lesson-15-hobbies.json" with { type: "json" };
import lesson16 from "../../content/A1/lesson-16-sports.json" with { type: "json" };
import lesson17 from "../../content/A1/lesson-17-health.json" with { type: "json" };
import lesson18 from "../../content/A1/lesson-18-body-parts.json" with { type: "json" };
import lesson19 from "../../content/A1/lesson-19-emotions.json" with { type: "json" };
import lesson20 from "../../content/A1/lesson-20-everyday-life-review.json" with { type: "json" };
import lesson21 from "../../content/A1/lesson-21-directions.json" with { type: "json" };
import lesson22 from "../../content/A1/lesson-22-transportation.json" with { type: "json" };
import lesson23 from "../../content/A1/lesson-23-asking-for-help.json" with { type: "json" };
import lesson24 from "../../content/A1/lesson-24-emergencies.json" with { type: "json" };
import lesson25 from "../../content/A1/lesson-25-phone-conversations.json" with { type: "json" };
import lesson26 from "../../content/A1/lesson-26-banking.json" with { type: "json" };
import lesson27 from "../../content/A1/lesson-27-hotels.json" with { type: "json" };
import lesson28 from "../../content/A1/lesson-28-airport.json" with { type: "json" };
import lesson29 from "../../content/A1/lesson-29-travel-review.json" with { type: "json" };
import lesson30 from "../../content/A1/lesson-30-a1-final-challenge.json" with { type: "json" };

const lessons = [lesson1, lesson2, lesson3, lesson4, lesson5, lesson6, lesson7, lesson8, lesson9, lesson10, lesson11, lesson12, lesson13, lesson14, lesson15, lesson16, lesson17, lesson18, lesson19, lesson20, lesson21, lesson22, lesson23, lesson24, lesson25, lesson26, lesson27, lesson28, lesson29, lesson30];

export function getTutorLesson(id) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return null;
  const pair = item => ({ spanish: item.spanish || "", english: item.english || "" });
  return {
    id: lesson.id, title: lesson.title, level: lesson.level,
    scene: lesson.story?.scene || lesson.story?.setting || "",
    location: lesson.story?.location || "",
    mission: lesson.story?.mission || lesson.miniConversation?.goal || "",
    objectives: (lesson.objectives || lesson.canDo || []).slice(0, 6),
    phrases: (lesson.essentialPhrases || lesson.vocabulary || []).slice(0, 12).map(pair),
    grammar: { topic: lesson.grammar?.topic || "", explanation: lesson.grammar?.explanation || "",
      examples: (lesson.grammar?.examples || []).slice(0, 4).map(pair) },
  };
}
