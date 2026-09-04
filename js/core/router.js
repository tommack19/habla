import { state } from "./state.js";

import { renderHome } from "../ui/home.js";
import { renderCarlos } from "../ui/carlos.js";
import { renderLearn } from "../ui/learn.js";
import { renderPractice } from "../ui/practice.js";
import { renderProfile } from "../ui/profile.js";
import { renderJourney } from "../ui/journey.js";
import { renderLesson } from "../ui/lesson.js";

export function renderPage(page) {

    const dashboard = document.getElementById("dashboard");

    if (!dashboard) return;

    dashboard.className = `${page}-page`;

    switch(page){

        case "home":
            dashboard.innerHTML = renderHome(state);
            break;

        case "carlos":
            dashboard.innerHTML = renderCarlos(state);
            break;

        case "learn":
            dashboard.innerHTML = renderLearn(state);
            break;

        case "lesson":
            dashboard.innerHTML = renderLesson(state);
            break;

        case "practice":
            dashboard.innerHTML = renderPractice(state);
            break;

        case "profile":
            dashboard.innerHTML = renderProfile(state);
            break;

        case "journey":
            dashboard.innerHTML = renderJourney(state);
            break;

        default:
            dashboard.innerHTML = renderHome(state);

    }

}
