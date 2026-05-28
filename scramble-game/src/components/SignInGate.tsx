"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignInGate() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasOkta, setHasOkta] = useState(false);

  useEffect(() => {
    getProviders().then((p) => {
      setHasOkta(!!p?.okta);
    });
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter your work email.");
      return;
    }
    signIn("email", { email: trimmed, name: name.trim(), redirectTo: "/" }).catch((err) => {
      setError(String(err?.message ?? err));
    });
  }

  return (
    <div className="game">
      <div className="header">
        <div className="brand-row">
          <svg className="aura-mark" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="auraGradGate" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF6217" />
                <stop offset="60%" stopColor="#9921FE" />
                <stop offset="100%" stopColor="#7398FF" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="11" fill="none" stroke="url(#auraGradGate)" strokeWidth="6" strokeLinecap="round" strokeDasharray="56 100" transform="rotate(-30 16 16)" />
          </svg>
          <span className="wordmark">okta</span>
          <span className="brand-divider"></span>
          <span className="brand-context">L&amp;D Warm-up</span>
        </div>
      </div>
      <div className="gate">
        <div className="gate-eyebrow">FINANCE L&amp;D · WARM-UP</div>
        <h2>Word Scramble</h2>
        <p>
          12 L&amp;D terms, 60 seconds each, time bonus for being quick.
          Sign in with your <strong>@okta.com</strong> email to play and post your score.
        </p>

        <form
          onSubmit={onSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            maxWidth: 400,
            margin: "0 auto",
          }}
        >
          <input
            type="email"
            placeholder="you@okta.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "2px solid var(--neutral-300)",
              fontSize: 15,
              fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--orange)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--neutral-300)")}
          />
          <input
            type="text"
            placeholder="Display name (e.g. Prachi A.)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "2px solid var(--neutral-300)",
              fontSize: 15,
              fontFamily: "inherit",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--orange)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--neutral-300)")}
          />
          {error && (
            <div style={{ color: "var(--red)", fontSize: 13, fontWeight: 600 }}>{error}</div>
          )}
          <button type="submit" className="btn btn-primary btn-large" style={{ marginTop: 4 }}>
            Start playing
          </button>
        </form>

        {hasOkta && (
          <>
            <div style={{
              margin: "24px auto 16px",
              maxWidth: 400,
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--neutral-500)",
              fontSize: 12,
              letterSpacing: 1,
            }}>
              <span style={{ flex: 1, height: 1, background: "var(--neutral-300)" }} />
              <span>OR</span>
              <span style={{ flex: 1, height: 1, background: "var(--neutral-300)" }} />
            </div>
            <button className="btn btn-secondary" onClick={() => signIn("okta")}>
              Sign in with Okta SSO
            </button>
          </>
        )}
      </div>
      <div className="footer">
        <span className="wordmark-sm">okta</span> · Finance L&amp;D · Q3 2026
      </div>
    </div>
  );
}
