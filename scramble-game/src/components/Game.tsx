"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WORDS: { word: string; hint: string }[] = [
  { word: "FEEDBACK",    hint: "What you receive after every June presentation — the engine of growth." },
  { word: "RUBRIC",      hint: "A scoring framework that turns vague impressions into specific signals." },
  { word: "COACHING",    hint: "1:1 guidance from a more experienced colleague, focused on a specific skill." },
  { word: "WORKSHOP",    hint: "Interactive, hands-on session where you learn by doing, not just listening." },
  { word: "CAPSTONE",    hint: "The culminating project that ties everything together — August's deliverable." },
  { word: "COHORT",      hint: "A group of learners who progress through the program together." },
  { word: "MENTOR",      hint: "An experienced colleague who invests in your long-term development." },
  { word: "REFLECTION",  hint: "The deliberate pause where learning gets consolidated into insight." },
  { word: "SHOWCASE",    hint: "Where the best examples come back for an encore — our June 30 finale." },
  { word: "ONBOARDING",  hint: "The structured ramp that turns new hires into productive team members." },
  { word: "FACILITATOR", hint: "The session lead — not the teacher, but the conductor of the experience." },
  { word: "PRACTICE",    hint: "The unglamorous, repeated reps where real skill actually gets built." },
];

const SECONDS_PER_WORD = 60;
const WARN_THRESHOLD = 20;
const DANGER_THRESHOLD = 10;

type Status = "solved" | "skipped" | "timeout";
type HistoryEntry = { word: string; status: Status };
type Tile = { char: string; used: boolean };
type AnswerEntry = { char: string; scrambleIdx: number };

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function scrambleChars(w: string): string[] {
  let chars: string[];
  do {
    chars = shuffle(w.split(""));
  } while (chars.join("") === w && w.length > 1);
  return chars;
}

type Props = {
  user: { name: string; email: string };
  onScoreSubmitted?: () => void;
};

export default function Game({ user, onScoreSubmitted }: Props) {
  // Initial deck is the source order (deterministic on server + client to avoid
  // SSR/hydration mismatch). We shuffle once on the client after mount.
  const [deck, setDeck] = useState<typeof WORDS>(() => WORDS);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [answer, setAnswer] = useState<AnswerEntry[]>([]);
  const [remaining, setRemaining] = useState(SECONDS_PER_WORD);
  const [feedback, setFeedback] = useState<{ msg: string; type: "" | "correct" | "wrong" | "timeout" }>({ msg: "", type: "" });
  const [answerState, setAnswerState] = useState<"" | "correct" | "wrong" | "timeout">("");
  const [revealUsed, setRevealUsed] = useState(false);
  const [roundLocked, setRoundLocked] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setRemaining(SECONDS_PER_WORD);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          // schedule timeout outside setState
          setTimeout(() => handleTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const startRound = useCallback(() => {
    if (idx >= deck.length) return;
    const w = deck[idx].word;
    setTiles(scrambleChars(w).map((c) => ({ char: c, used: false })));
    setAnswer([]);
    setFeedback({ msg: "", type: "" });
    setAnswerState("");
    setRevealUsed(false);
    setRoundLocked(false);
    startTimer();
  }, [idx, deck, startTimer]);

  // Shuffle the deck once on mount (client-only — avoids SSR hydration mismatch).
  const shuffledRef = useRef(false);
  useEffect(() => {
    if (shuffledRef.current) return;
    shuffledRef.current = true;
    setDeck(shuffle(WORDS));
  }, []);

  // start the first round, on idx change, or when the deck shuffles
  useEffect(() => {
    if (!done && idx < deck.length) startRound();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done, deck]);

  // submit final score once when done
  useEffect(() => {
    if (!done || submittedRef.current) return;
    submittedRef.current = true;
    const wordsSolved = history.filter((h) => h.status === "solved").length;
    setSubmitting(true);
    fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, wordsSolved }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || "submit_failed");
        return r.json();
      })
      .then((data) => {
        if (data?.me?.rank) setMyRank(data.me.rank);
        onScoreSubmitted?.();
      })
      .catch((e) => setSubmitErr(String(e.message ?? e)))
      .finally(() => setSubmitting(false));
  }, [done, history, score, onScoreSubmitted]);

  function nextRound() {
    if (idx + 1 >= deck.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  }

  function pickTile(i: number) {
    if (roundLocked) return;
    setTiles((prev) => {
      if (prev[i].used) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], used: true };
      return next;
    });
    setAnswer((prev) => [...prev, { char: tiles[i].char, scrambleIdx: i }]);
  }
  function unpickTile(j: number) {
    if (roundLocked) return;
    const entry = answer[j];
    setTiles((prev) => {
      const next = prev.slice();
      next[entry.scrambleIdx] = { ...next[entry.scrambleIdx], used: false };
      return next;
    });
    setAnswer((prev) => prev.filter((_, k) => k !== j));
  }

  function submitAnswer() {
    if (roundLocked) return;
    const guess = answer.map((e) => e.char).join("");
    const target = deck[idx].word;
    if (!guess) return;

    if (guess === target) {
      stopTimer();
      const bonus = Math.floor(remaining / 10);
      const total = 10 + bonus;
      setScore((s) => s + total);
      setHistory((h) => [...h, { word: target, status: "solved" }]);
      setFeedback({ msg: `Nailed it. +${total}${bonus ? ` (${bonus} time bonus)` : ""}`, type: "correct" });
      setAnswerState("correct");
      setRoundLocked(true);
      setTimeout(nextRound, 1100);
    } else if (guess.length < target.length) {
      setFeedback({ msg: "Use all the letters first.", type: "wrong" });
    } else {
      setFeedback({ msg: "Not quite — try rearranging.", type: "wrong" });
      setAnswerState("wrong");
      setTimeout(() => setAnswerState(""), 500);
    }
  }

  function revealFirst() {
    if (roundLocked || revealUsed) return;
    const target = deck[idx].word;
    const firstChar = target[0];
    // reset answer first
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    const fresh = tiles.map((t) => ({ ...t, used: false }));
    const idx0 = fresh.findIndex((t) => t.char === firstChar);
    if (idx0 !== -1) {
      const next = fresh.slice();
      next[idx0] = { ...next[idx0], used: true };
      setTiles(next);
      setAnswer([{ char: firstChar, scrambleIdx: idx0 }]);
    } else {
      setAnswer([]);
    }
    setScore((s) => Math.max(0, s - 2));
    setRevealUsed(true);
    setFeedback({ msg: "First letter placed. −2", type: "wrong" });
  }

  function skip() {
    if (roundLocked) return;
    stopTimer();
    setScore((s) => Math.max(0, s - 5));
    setHistory((h) => [...h, { word: deck[idx].word, status: "skipped" }]);
    setFeedback({ msg: "Skipped. −5", type: "wrong" });
    setRoundLocked(true);
    setTimeout(nextRound, 600);
  }

  function handleTimeout() {
    setHistory((h) => [...h, { word: deck[idx].word, status: "timeout" }]);
    setFeedback({ msg: "Time! Moving on.", type: "timeout" });
    setAnswerState("timeout");
    setRoundLocked(true);
    setTimeout(nextRound, 1000);
  }

  // keyboard: Enter to submit
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") submitAnswer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answer, idx, roundLocked]);

  const timerClasses = (() => {
    const base: string[] = [];
    if (remaining <= DANGER_THRESHOLD) base.push("timer-danger");
    else if (remaining <= WARN_THRESHOLD) base.push("timer-warn");
    return base.join(" ");
  })();
  const fillClasses = (() => {
    if (remaining <= DANGER_THRESHOLD) return "danger";
    if (remaining <= WARN_THRESHOLD) return "warn";
    return "";
  })();
  const fillPct = Math.max(0, (remaining / SECONDS_PER_WORD) * 100);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  if (done) {
    const solved = history.filter((h) => h.status === "solved").length;
    let blurb = "";
    if (solved === deck.length) blurb = "Every word, no skips. That's mastery.";
    else if (solved >= deck.length * 0.75) blurb = "Strong run — most words solved.";
    else if (solved >= deck.length / 2) blurb = "Solid effort. Replay to push it higher.";
    else blurb = "Good warm-up. The hints sharpen with another round.";

    return (
      <>
        <BrandHeader user={user} />
        <div className="end-screen">
          <div className="end-eyebrow">FINAL SCORE</div>
          <div className="end-title">Round complete</div>
          <div className="end-score">{score}</div>
          {myRank && (
            <div className="rank-pill">
              You ranked <span className="num">#{myRank}</span> on the leaderboard
            </div>
          )}
          {submitting && <div className="end-detail">Saving your score…</div>}
          {submitErr && <div className="end-detail" style={{ color: "var(--red)" }}>Couldn&apos;t save: {submitErr}</div>}
          {!submitting && !submitErr && (
            <div className="end-detail">{solved} of {deck.length} words solved · {blurb}</div>
          )}
          <div className="end-summary">
            <div className="end-summary-title">YOUR ROUND</div>
            <ul>
              {history.map((h, i) => {
                const label = h.status === "solved" ? "Solved" : h.status === "timeout" ? "Timed out" : "Skipped";
                return (
                  <li key={i}>
                    <span className="word">{h.word}</span>
                    <span className={`result ${h.status}`}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <button className="btn btn-primary btn-large" onClick={() => location.reload()}>
            Play again
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <BrandHeader
        user={user}
        score={score}
        timer={`${mm}:${ss}`}
        timerClass={timerClasses}
        currentIdx={idx + 1}
        total={deck.length}
      />
      <div className="timer-track"><div className={`timer-fill ${fillClasses}`} style={{ width: fillPct + "%" }} /></div>
      <div className="deck-progress">
        {deck.map((_, i) => {
          const h = history[i];
          let cls = "dot";
          if (h) cls += " " + h.status;
          else if (i === idx) cls += " current";
          return <div className={cls} key={i} />;
        })}
      </div>
      <div className="body">
        <div className="hint-card">
          <div className="hint-label">HINT</div>
          <div className="hint-text">{deck[idx].hint}</div>
        </div>

        <div className="section-label">Your answer</div>
        <div className={`answer-row ${answerState}`}>
          {answer.map((entry, j) => (
            <button
              key={j}
              className="tile answer"
              onClick={() => unpickTile(j)}
              disabled={roundLocked}
              type="button"
            >
              {entry.char}
            </button>
          ))}
        </div>

        <div className="section-label">Tap letters to build the word</div>
        <div className="scramble-row">
          {tiles.map((t, i) => (
            <button
              key={i}
              className="tile scramble"
              onClick={() => pickTile(i)}
              disabled={t.used || roundLocked}
              type="button"
            >
              {t.char}
            </button>
          ))}
        </div>

        <div className="controls">
          <button className="btn btn-primary" onClick={submitAnswer} disabled={roundLocked}>Submit</button>
          <button className="btn btn-secondary" onClick={revealFirst} disabled={roundLocked || revealUsed}>
            Reveal first letter (−2)
          </button>
          <button className="btn btn-secondary" onClick={skip} disabled={roundLocked}>Skip (−5)</button>
        </div>
        <div className={`feedback-msg ${feedback.type}`}>{feedback.msg}</div>
      </div>
    </>
  );
}

function BrandHeader(props: {
  user: { name: string; email: string };
  score?: number;
  timer?: string;
  timerClass?: string;
  currentIdx?: number;
  total?: number;
}) {
  return (
    <div className="header">
      <div className="brand-row">
        <svg className="aura-mark" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="auraGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF6217" />
              <stop offset="60%" stopColor="#9921FE" />
              <stop offset="100%" stopColor="#7398FF" />
            </linearGradient>
          </defs>
          <circle cx="16" cy="16" r="11" fill="none" stroke="url(#auraGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray="56 100" transform="rotate(-30 16 16)" />
        </svg>
        <span className="wordmark">okta</span>
        <span className="brand-divider"></span>
        <span className="brand-context">L&amp;D Warm-up</span>
        <span className="user-chip">
          {props.user.name} · <a href="/api/auth/signout">sign out</a>
        </span>
      </div>
      {props.score !== undefined && (
        <div className="header-main">
          <div className="header-left">
            <div className="eyebrow">WORD SCRAMBLE</div>
            <h1>L&amp;D Edition</h1>
          </div>
          <div className="header-right">
            <div className="stat">
              <div className="stat-label">Score</div>
              <div className="stat-value">{props.score}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Time</div>
              <div className={`stat-value ${props.timerClass ?? ""}`}>{props.timer}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Word</div>
              <div className="stat-value">{props.currentIdx}/{props.total}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
