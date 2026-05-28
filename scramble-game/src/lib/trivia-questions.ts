// REVIEW: Please verify each item before going live with the finance team.
// I drafted these as plausible L&D trivia in your voice, but I do not actually
// know your team's history — swap any "lie" or "truth" that's wrong for a real
// one you know. The player's job is to pick which of the three is the lie.

export type TriviaQuestion = {
  id: number;
  topic: string;
  statements: [string, string, string];
  lieIndex: 0 | 1 | 2;
  reveal: string;
};

export const TRIVIA: TriviaQuestion[] = [
  {
    id: 1,
    topic: "The 70-20-10 Model",
    statements: [
      "70% of development comes from on-the-job experience and stretch assignments.",
      "20% comes from learning through others — coaching, mentoring, peer feedback.",
      "The model was first published by Goldman Sachs' L&D team in 1994.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. The 70-20-10 model was popularized by researchers at the Center for Creative Leadership (Lombardo & Eichinger), not Goldman Sachs.",
  },
  {
    id: 2,
    topic: "The Pyramid Principle",
    statements: [
      "It was created by Barbara Minto at McKinsey in the 1970s.",
      "It tells you to lead with the answer, then group supporting ideas underneath.",
      "It's banned at McKinsey today because it's been replaced by the SCR framework.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. The Pyramid Principle is still core to how McKinsey teaches structured communication. There is no \"SCR\" replacement.",
  },
  {
    id: 3,
    topic: "Kirkpatrick's Four Levels",
    statements: [
      "The four levels are Reaction, Learning, Behavior, and Results.",
      "Don Kirkpatrick first published the model in the 1950s.",
      "Level 4 (Results) is the most commonly measured because it's the easiest.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Level 4 is actually the LEAST commonly measured — most programs stop at Level 1 (smile sheets) because Results is the hardest to attribute.",
  },
  {
    id: 4,
    topic: "The Forgetting Curve",
    statements: [
      "Hermann Ebbinghaus discovered it by memorizing nonsense syllables in the 1880s.",
      "Without reinforcement, learners forget about 50% of new information within an hour.",
      "Spaced repetition was invented at Stanford in the 1990s to counter the curve.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Spaced repetition has roots in Ebbinghaus's own work and was systematized by Sebastian Leitner in 1972 — long before the 1990s and not at Stanford.",
  },
  {
    id: 5,
    topic: "Bloom's Taxonomy",
    statements: [
      "The original 1956 version had six levels, from Knowledge to Evaluation.",
      "It was revised in 2001 to use verbs and put Create at the top.",
      "Benjamin Bloom developed it as part of his work at IBM's training division.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Bloom was a professor at the University of Chicago. He had nothing to do with IBM.",
  },
  {
    id: 6,
    topic: "Active Recall",
    statements: [
      "Testing yourself on material is more effective for retention than re-reading it.",
      "Roediger and Karpicke (2006) called this the \"testing effect.\"",
      "Active recall works for facts but not for skills like presentation delivery.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Retrieval practice works for skill-based learning too — recording a practice presentation and critiquing it from memory is itself a form of active recall.",
  },
  {
    id: 7,
    topic: "The 5 Whys",
    statements: [
      "It originated at Toyota as part of the Toyota Production System.",
      "It was developed by Sakichi Toyoda, the founder of Toyota Industries.",
      "The technique requires asking exactly five \"why\" questions — no more, no less.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Five is the typical number, but the real rule is to keep asking until you reach the root cause — sometimes it's three whys, sometimes seven.",
  },
  {
    id: 8,
    topic: "The Dunning-Kruger Effect",
    statements: [
      "It describes how novices often overestimate their competence.",
      "It was first published in 1999 by David Dunning and Justin Kruger at Cornell.",
      "Their original study tested participants on humor, grammar, and tax accounting.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. The original study tested humor, grammar, and LOGIC — not tax accounting. (Though tax accounting would have been a great fit for a finance team.)",
  },
  {
    id: 9,
    topic: "The Feynman Technique",
    statements: [
      "Step one is to explain the concept as if to a 12-year-old.",
      "It's named for physicist Richard Feynman, who used it as a study method.",
      "Feynman wrote a book in 1972 called \"The Feynman Technique\" describing all four steps.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. Feynman never wrote a book by that name. The \"technique\" was reverse-engineered from his teaching style after his death and codified by others.",
  },
  {
    id: 10,
    topic: "The Pomodoro Technique",
    statements: [
      "It uses 25-minute focused work intervals separated by 5-minute breaks.",
      "It was created by Francesco Cirillo in the late 1980s.",
      "\"Pomodoro\" means \"break\" in Italian — the timer signals when to rest.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. \"Pomodoro\" means \"tomato\" in Italian. Cirillo used a tomato-shaped kitchen timer when he invented it as a university student.",
  },
  {
    id: 11,
    topic: "Q3 Finance L&D Priorities",
    statements: [
      "Our three priorities this quarter are communications, problem-solving, and strategic thinking.",
      "The June sprint is focused on presentation skills, with a showcase at the end of the month.",
      "Strategic thinking was added to the Q3 plan because it scored highest on the team's request survey.",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3 (assuming you wrote the strategy yourself, Prachi — adjust to match your real reasoning). Strategic thinking is on the plan, but the rationale is yours to fill in.",
  },
  {
    id: 12,
    topic: "Okta's Brand Refresh",
    statements: [
      "The refreshed identity uses a lowercase \"okta\" wordmark.",
      "The new brand mark features a gradient that fades from orange to purple to blue.",
      "The internal codename for the rebrand was \"Project Pumpkin Spice.\"",
    ],
    lieIndex: 2,
    reveal:
      "The lie is #3. The lowercase wordmark and the gradient mark are real elements of the refreshed identity. \"Project Pumpkin Spice\" is fictional — though it does sound like a fun codename.",
  },
];

export const TOTAL_QUESTIONS = TRIVIA.length;
export const SECONDS_PER_QUESTION = 60;
export const MAX_PER_QUESTION = 16; // 10 base + up to 6 time bonus
export const MAX_TOTAL_SCORE = TOTAL_QUESTIONS * MAX_PER_QUESTION;
