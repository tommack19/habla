export const state = {
user: {
  name: "Tom",
  level: "A1",
  goal: "Become conversational with my wife's family",
  dialect: "Mexican Spanish",
  dailyTargetMinutes: 15,
  xp: 0,
  streak: 0
},

  tutor: {
    name: "Carlos",
    speaking: false,
    listening: false,
    thinking: false
  },

  conversation: [],

  vocabulary: {
    learned: [],
    weakWords: []
  }
};

export function addXP(amount) {
  state.user.xp += amount;
}

export function setTutorStatus(status) {
  state.tutor.speaking = status === "speaking";
  state.tutor.listening = status === "listening";
  state.tutor.thinking = status === "thinking";
}