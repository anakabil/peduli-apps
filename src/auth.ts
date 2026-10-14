import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function allowedDomains() {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

function emailAllowed(email?: string | null) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (adminEmails().includes(e)) return true;
  const domains = allowedDomains();
  if (domains.length === 0) return true;
  return domains.some((d) => e.endsWith(`@${d}`));
}

/** Menentukan peran dan status awal untuk akun baru */
function initialProfile(email?: string | null) {
  const e = (email ?? "").toLowerCase();
  if (adminEmails().includes(e)) return { role: "ADMIN", status: "ACTIVE" };
  return { role: "PENGAWAS", status: "PENDING" };
}

async function upsertGoogleUser(payload: { sub: string; email?: string; name?: string; picture?: string }) {
  const email = payload.email?.toLowerCase();
  if (!email) return null;
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    const data: { name?: string; image?: string } = {};
    if (!existing.name && payload.name) data.name = payload.name;
    if (!existing.image && payload.picture) data.image = payload.picture;
    if (Object.keys(data).length) await db.user.update({ where: { id: existing.id }, data });
    return existing;
  }
  const profile = initialProfile(email);
  return db.user.create({
    data: { email, name: payload.name, image: payload.picture, emailVerified: new Date(), ...profile },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    ...authConfig.providers,
    // Google One Tap: klien mengirim ID token, server memverifikasi ke Google
    Credentials({
      id: "google-onetap",
      name: "Google One Tap",
      credentials: { credential: { type: "text" } },
      async authorize(creds) {
        const credential = typeof creds?.credential === "string" ? creds.credential : "";
        const clientId = process.env.AUTH_GOOGLE_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        if (!credential || !clientId) return null;
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) return null;
        if (!emailAllowed(payload.email)) return null;
        const user = await upsertGoogleUser({ sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
    // Mode demo: masuk sebagai akun contoh tanpa Google (hanya bila DEMO_MODE=true)
    Credentials({
      id: "demo",
      name: "Akun demo",
      credentials: { email: { type: "text" } },
      async authorize(creds) {
        if (!isDemoMode()) return null;
        const email = typeof creds?.email === "string" ? creds.email.toLowerCase() : "";
        if (!email.endsWith("@demo.peduli.local")) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = (profile?.email ?? user.email ?? "").toLowerCase();
        if (!emailAllowed(email)) return "/masuk?error=domain";
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Dipanggil adapter saat akun Google baru dibuat
      const profile = initialProfile(user.email);
      await db.user.update({ where: { id: user.id! }, data: profile });
    },
    async signIn({ user, account }) {
      if (!user.id) return;
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
      await db.auditLog
        .create({ data: { actorId: user.id, action: "MASUK", detail: JSON.stringify({ provider: account?.provider }) } })
        .catch(() => {});
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null;
      const id = token?.id as string | undefined;
      if (id) await db.auditLog.create({ data: { actorId: id, action: "KELUAR" } }).catch(() => {});
    },
  },
});
