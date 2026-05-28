import { auth } from "@/lib/auth";
import Game from "@/components/Game";
import Leaderboard from "@/components/Leaderboard";
import SignInGate from "@/components/SignInGate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="page">
        <SignInGate />
        <Leaderboard />
      </main>
    );
  }

  return (
    <main className="page">
      <div>
        <a href="/trivia" className="trivia-cta">
          <div>
            <span className="trivia-cta-eyebrow">NEW · LIVE EVENT</span>
            <span>Two Truths &amp; a Lie — L&amp;D Trivia</span>
          </div>
          <span className="trivia-cta-arrow">→</span>
        </a>
        <div className="game">
          <Game user={{ name: session.user.name ?? session.user.email, email: session.user.email }} />
          <div className="footer">
            <span className="wordmark-sm">okta</span> · Finance L&amp;D · Built for warm-ups before sessions
          </div>
        </div>
      </div>
      <Leaderboard />
    </main>
  );
}
