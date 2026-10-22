import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { authSecret, googleClientId, googleClientSecret } from "@/lib/env";

// Konfigurasi ringan yang aman untuk middleware (tanpa Prisma)
export const authConfig = {
  pages: { signIn: "/masuk", error: "/masuk" },
  // Sesi tidak diperpanjang otomatis (middleware tidak menulis cookie), maka masa berlaku dibuat 30 hari
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  trustHost: true,
  secret: authSecret() || undefined,
  providers: [
    Google({
      clientId: googleClientId() || undefined,
      clientSecret: googleClientSecret() || undefined,
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { prompt: "select_account", access_type: "offline" } },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/masuk") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/cron") ||
        pathname.startsWith("/manifest") ||
        pathname.startsWith("/sw.js") ||
        pathname.startsWith("/offline") ||
        pathname.startsWith("/brand") ||
        pathname.startsWith("/icons");
      if (isPublic) return true;
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token?.id && session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
