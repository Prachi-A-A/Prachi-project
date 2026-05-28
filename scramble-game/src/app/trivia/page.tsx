import { auth } from "@/lib/auth";
import TriviaGame from "@/components/TriviaGame";
import TriviaLeaderboard from "@/components/TriviaLeaderboard";
import TriviaSignInGate from "@/components/TriviaSignInGate";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Two Truths & a Lie · L&D Trivia · okta",
  description:
    "Live L&D trivia for the Okta finance team. Tap the lie, beat the leaderboard.",
};

export default async function TriviaPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return (
      <main className="page">
        <TriviaSignInGate />
        <TriviaLeaderboard myEmail={null} />
      </main>
    );
  }

  return (
    <main className="page">
      <div className="game">
        <TriviaGame
          user={{
            name: session.user.name ?? session.user.email,
            email: session.user.email,
          }}
        />
        <div className="footer">
          <span className="wordmark-sm">okta</span> · Finance L&amp;D · Two Truths
          &amp; a Lie
        </div>
      </div>
      <TriviaLeaderboard myEmail={session.user.email} />
    </main>
  );
}
