import NextAuth from "next-auth";
import Okta from "next-auth/providers/okta";
import Credentials from "next-auth/providers/credentials";

const isDev = process.env.NODE_ENV !== "production";
const hasOktaSso = !!(
  process.env.AUTH_OKTA_ID &&
  process.env.AUTH_OKTA_SECRET &&
  process.env.AUTH_OKTA_ISSUER &&
  // accept anything except the placeholder values used during local dev
  !process.env.AUTH_OKTA_ID.startsWith("local-")
);

// Allow-listed email domains. @okta.com only by default. Override via env.
const ALLOWED_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS ?? "okta.com")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);

function isValidEmail(email: string): boolean {
  // simple but strict: one @, no spaces, has a dot in the domain
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAllowedDomain(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.includes(domain);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Okta SSO. Only enabled if env vars are set with real values.
    ...(hasOktaSso
      ? [
          Okta({
            clientId: process.env.AUTH_OKTA_ID!,
            clientSecret: process.env.AUTH_OKTA_SECRET!,
            issuer: process.env.AUTH_OKTA_ISSUER!,
          }),
        ]
      : []),
    // Trust-based email entry. Validates email format + allowed domain.
    // Used in production until SSO credentials land. In dev, also accepts any email.
    Credentials({
      id: "email",
      name: "Email sign-in",
      credentials: {
        email: { label: "Work email", type: "email" },
        name: { label: "Display name", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        if (!email || !isValidEmail(email)) return null;
        if (!isDev && !isAllowedDomain(email)) return null;
        const name = String(credentials?.name ?? "").trim() || email;
        return { id: email, email, name };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
