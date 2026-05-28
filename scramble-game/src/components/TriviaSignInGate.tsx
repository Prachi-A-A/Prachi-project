"use client";

import { signIn } from "next-auth/react";

export default function TriviaSignInGate() {
  return (
    <div className="game">
      <div className="header">
        <div className="brand-row">
          <svg
            className="aura-mark"
            viewBox="0 0 32 32"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="auraGradTriviaGate" x1="0" y1="0" x2="1" y2="1">
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
              stroke="url(#auraGradTriviaGate)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="56 100"
              transform="rotate(-30 16 16)"
            />
          </svg>
          <span className="wordmark">okta</span>
          <span className="brand-divider"></span>
          <span className="brand-context">L&amp;D Trivia · Two Truths &amp; a Lie</span>
        </div>
      </div>
      <div className="gate">
        <div className="gate-eyebrow">FINANCE L&amp;D · TWO TRUTHS &amp; A LIE</div>
        <h2>Spot the lie. Win the leaderboard.</h2>
        <p>
          Sign in with Okta to play. 12 rounds of L&amp;D trivia, 60 seconds
          each, time bonus for being quick. Top scores show on the live
          leaderboard for everyone to see.
        </p>
        <button className="btn btn-primary btn-large" onClick={() => signIn("okta")}>
          Sign in with Okta
        </button>
      </div>
      <div className="footer">
        <span className="wordmark-sm">okta</span> · Finance L&amp;D · Q3 2026
      </div>
    </div>
  );
}
