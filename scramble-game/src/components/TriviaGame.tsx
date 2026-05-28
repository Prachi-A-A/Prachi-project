"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  TRIVIA,
  type TriviaQuestion,
  TOTAL_QUESTIONS,
  SECONDS_PER_QUESTION,
  MAX_PER_QUESTION,
} from "@/lib/trivia-questions";

const WARN_THRESHOLD = 20;
const DANGER_THRESHOLD = 10;
const REVEAL_HOLD_MS = 2200;

type Status = "correct" | "wrong" | "timeout" | "skipped";
type HistoryEntry = { topic: string; status: Status };
type AnswerState = "" | "correct" | "wrong" | "timeout";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = {
  user: { name: string; email: string };
  onScoreSubmitted?: () => void;
};

export default function TriviaGame({ user, onScoreSubmitted }: Props) {
  const [deck] = useState<TriviaQuestion[]>(() => shuffle(TRIVIA));
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [remaining, setRemaining] = useState(SECONDS_PER_QUESTION);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("");
  const [roundLocked, setRoundLocked] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
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

  const handleTimeout = useCallback(() => {
    setHistory((h) => [...h, { topic: deck[idx].topic, status: "timeout" }]);
    setAnswerState("timeout");
    setRoundLocked(true);
    setShowReveal(true);
    setTimeout(() => advance(), REVEAL_HOLD_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, deck]);

  const startTimer = useCallback(() => {
    stopTimer();
    setRemaining(SECONDS_PER_QUESTION);
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          stopTimer();
          setTimeout(() => handleTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer, handleTimeout]);

  const startRound = useCallback(() => {
    setSelectedIdx(null);
    setAnswerState("");
    setRoundLocked(false);
    setShowReveal(false);
    startTimer();
  }, [startTimer]);

  useEffect(() => {
    if (phase === "playing" && idx < deck.length) startRound();
    return () => stopTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, phase]);

  // Submit final score once when done
  useEffect(() => {
    if (phase !== "done" || submittedRef.current) return;
    submittedRef.current = true;
    const questionsAnswered = history.filter(
      (h) => h.status === "correct" || h.status === "wrong"
    ).length;
    setSubmitting(true);
    fetch("/api/trivia-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score,
        correctCount,
        questionsAnswered,
      }),
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
  }, [phase, history, score, correctCount, onScoreSubmitted]);

  function advance() {
    if (idx + 1 >= deck.length) {
      setPhase("done");
    } else {
      setIdx(idx + 1);
    }
  }

  function pickStatement(i: number) {
    if (roundLocked) return;
    stopTimer();
    setSelectedIdx(i);
    const q = deck[idx];
    if (i === q.lieIndex) {
      const bonus = Math.floor(remaining / 10);
      const total = 10 + bonus;
      setScore((s) => s + total);
      setCorrectCount((c) => c + 1);
      setHistory((h) => [...h, { topic: q.topic, status: "correct" }]);
      setAnswerState("correct");
    } else {
      setHistory((h) => [...h, { topic: q.topic, status: "wrong" }]);
      setAnswerState("wrong");
    }
    setRoundLocked(true);
    setShowReveal(true);
    setTimeout(() => advance(), REVEAL_HOLD_MS);
  }

  function skip() {
    if (roundLocked) return;
    stopTimer();
    setScore((s) => Math.max(0, s - 5));
    setHistory((h) => [...h, { topic: deck[idx].topic, status: "skipped" }]);
    setAnswerState("wrong");
    setRoundLocked(true);
    setTimeout(() => advance(), 700);
  }

  const timerClasses = (() => {
    if (remaining <= DANGER_THRESHOLD) return "timer-danger";
    if (remaining <= WARN_THRESHOLD) return "timer-warn";
    return "";
  })();
  const fillClasses = (() => {
    if (remaining <= DANGER_THRESHOLD) return "danger";
    if (remaining <= WARN_THRESHOLD) return "warn";
    return "";
  })();
  const fillPct = Math.max(0, (remaining / SECONDS_PER_QUESTION) * 100);
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  if (phase === "intro") {
    return (
      <>
        <BrandHeader user={user} />
        <div className="trivia-intro">
          <div className="trivia-intro-eyebrow">FINANCE L&amp;D · TWO TRUTHS &amp; A LIE</div>
          <h2>Spot the lie. Win the leaderboard.</h2>
          <p>
            {TOTAL_QUESTIONS} rounds of L&amp;D trivia. Each round shows three
            statements — two are true, one is a lie. Tap the lie. Faster
            answers earn bigger time bonuses.
          </p>
          <div className="trivia-rules">
            <div className="trivia-rule">
              <span className="trivia-rule-num">60s</span>
              <span className="trivia-rule-label">per round</span>
            </div>
            <div className="trivia-rule">
              <span className="trivia-rule-num">+10</span>
              <span className="trivia-rule-label">per correct</span>
            </div>
            <div className="trivia-rule">
              <span className="trivia-rule-num">+6</span>
              <span className="trivia-rule-label">max time bonus</span>
            </div>
            <div className="trivia-rule">
              <span className="trivia-rule-num">{TOTAL_QUESTIONS}</span>
              <span className="trivia-rule-label">questions</span>
            </div>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={() => setPhase("playing")}
          >
            Start the round
          </button>
        </div>
      </>
    );
  }

  if (phase === "done") {
    const correct = history.filter((h) => h.status === "correct").length;
    const total = deck.length;
    let blurb = "";
    if (correct === total) blurb = "Perfect round. The team has its champion.";
    else if (correct >= total * 0.75) blurb = "Sharp instincts — most lies caught.";
    else if (correct >= total / 2) blurb = "Solid run. The trickier ones got through.";
    else blurb = "Some clever lies got past you. Replay to push it higher.";

    return (
      <>
        <BrandHeader user={user} />
        <div className="end-screen trivia-end">
          <div className="end-eyebrow">FINAL SCORE</div>
          <div className="end-title">Round complete</div>
          <div className="end-score">{score}</div>
          {myRank && (
            <div className="rank-pill">
              You ranked <span className="num">#{myRank}</span> on the leaderboard
            </div>
          )}
          {submitting && <div className="end-detail">Saving your score…</div>}
          {submitErr && (
            <div className="end-detail" style={{ color: "var(--red)" }}>
              Couldn&apos;t save: {submitErr}
            </div>
          )}
          {!submitting && !submitErr && (
            <div className="end-detail">
              {correct} of {total} lies caught · {blurb}
            </div>
          )}
          <div className="end-summary">
            <div className="end-summary-title">YOUR ROUND</div>
            <ul>
              {history.map((h, i) => {
                const label =
                  h.status === "correct"
                    ? "Caught it"
                    : h.status === "wrong"
                    ? "Fell for it"
                    : h.status === "timeout"
                    ? "Timed out"
                    : "Skipped";
                const cls =
                  h.status === "correct"
                    ? "solved"
                    : h.status === "wrong"
                    ? "skipped"
                    : h.status === "timeout"
                    ? "timeout"
                    : "skipped";
                return (
                  <li key={i}>
                    <span className="word">{h.topic}</span>
                    <span className={`result ${cls}`}>{label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <button
            className="btn btn-primary btn-large"
            onClick={() => location.reload()}
          >
            Play again
          </button>
        </div>
      </>
    );
  }

  // phase === "playing"
  const q = deck[idx];
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
      <div className="timer-track">
        <div
          className={`timer-fill ${fillClasses}`}
          style={{ width: fillPct + "%" }}
        />
      </div>
      <div className="deck-progress">
        {deck.map((_, i) => {
          const h = history[i];
          let cls = "dot";
          if (h?.status === "correct") cls += " solved";
          else if (h?.status === "wrong") cls += " skipped";
          else if (h?.status === "timeout") cls += " timeout";
          else if (h?.status === "skipped") cls += " skipped";
          else if (i === idx) cls += " current";
          return <div className={cls} key={i} />;
        })}
      </div>
      <div className="body trivia-body">
        <div className="trivia-topic-card">
          <div className="trivia-topic-label">TOPIC</div>
          <div className="trivia-topic-text">{q.topic}</div>
        </div>

        <div className="section-label">Tap the lie</div>
        <div className="trivia-statements">
          {q.statements.map((statement, i) => {
            let cls = "trivia-statement";
            if (roundLocked) {
              if (i === q.lieIndex) cls += " is-lie";
              if (i === selectedIdx && i !== q.lieIndex) cls += " is-wrong";
              if (i !== q.lieIndex && i !== selectedIdx) cls += " is-faded";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => pickStatement(i)}
                disabled={roundLocked}
                type="button"
              >
                <span className="trivia-statement-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="trivia-statement-text">{statement}</span>
              </button>
            );
          })}
        </div>

        {showReveal && (
          <div className={`trivia-reveal ${answerState}`}>
            <div className="trivia-reveal-headline">
              {answerState === "correct"
                ? "Caught it. "
                : answerState === "timeout"
                ? "Time! "
                : "Not quite. "}
              <span>{q.reveal}</span>
            </div>
          </div>
        )}

        <div className="controls">
          <button className="btn btn-secondary" onClick={skip} disabled={roundLocked}>
            Skip (−5)
          </button>
        </div>
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
        <svg
          className="aura-mark"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="auraGradTrivia" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF6217" />
              <stop offset="60%" stopColor="#9921FE" />
              <stop offset="100%" stopColor="#7398FF" />
            </linearGradient>
          </defs>
          <circle
            cx="16"
            cy="16"
            r="11"
            fill="none"
            stroke="url(#auraGradTrivia)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="56 100"
            transform="rotate(-30 16 16)"
          />
        </svg>
        <span className="wordmark">okta</span>
        <span className="brand-divider"></span>
        <span className="brand-context">L&amp;D Trivia · Two Truths &amp; a Lie</span>
        <span className="user-chip">
          {props.user.name} · <a href="/api/auth/signout">sign out</a>
        </span>
      </div>
      {props.score !== undefined && (
        <div className="header-main">
          <div className="header-left">
            <div className="eyebrow">FINANCE L&amp;D</div>
            <h1>Two Truths &amp; a Lie</h1>
          </div>
          <div className="header-right">
            <div className="stat">
              <div className="stat-label">Score</div>
              <div className="stat-value">{props.score}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Time</div>
              <div className={`stat-value ${props.timerClass ?? ""}`}>
                {props.timer}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Round</div>
              <div className="stat-value">
                {props.currentIdx}/{props.total}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
