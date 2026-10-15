import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { AdapterUser } from "next-auth/adapters";
import { OAuth2Client } from "google-auth-library";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";
import { envBool, envList, googleClientId, oneTapClientId } from "@/lib/env";

function adminEmails() {
  return envList("ADMIN_EMAILS");
}

function allowedDomains() {
  return envList("ALLOWED_EMAIL_DOMAINS").map((d) => d.replace(/^@/, ""));
}

export function isDemoMode() {
  return envBool("DEMO_MODE");
}

/** Email boleh masuk bila: admin, sudah didaftarkan admin (ada di basis data), atau sesuai domain yang diizinkan */
async function emailAllowed(email?: string | null) {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (adminEmails().includes(e)) return true;
  const domains = allowedDomains();
  if (domains.length === 0) return true;
  if (domains.some((d) => e.endsWith(`@${d}`))) return true;
  const registered = await db.user.findUnique({ where: { email: e }, select: { status: true } });
  return !!registered && registered.status !== "INACTIVE";
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

const baseAdapter = PrismaAdapter(db);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: {
    ...baseAdapter,
    // Profil awal hanya untuk pengguna yang benar-benar baru. Akun yang sudah ada (dibuat admin atau lewat One Tap)
    // hanya ditautkan, sehingga peran dan statusnya tidak tertimpa. Email disimpan dalam huruf kecil.
    createUser: async ({ id: _ignored, ...data }) => {
      void _ignored;
      const email = data.email.trim().toLowerCase();
      return (await db.user.create({ data: { ...data, email, ...initialProfile(email) } })) as AdapterUser;
    },
    getUserByEmail: async (email) => (await db.user.findUnique({ where: { email: email.trim().toLowerCase() } })) as AdapterUser | null,
  },
  providers: [
    ...authConfig.providers,
    // Google One Tap: klien mengirim ID token, server memverifikasi ke Google
    Credentials({
      id: "google-onetap",
      name: "Google One Tap",
      credentials: { credential: { type: "text" } },
      async authorize(creds) {
        const credential = typeof creds?.credential === "string" ? creds.credential : "";
        const clientId = googleClientId() || oneTapClientId();
        if (!credential || !clientId) return null;
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) return null;
        if (!(await emailAllowed(payload.email))) return null;
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
        if (!(await emailAllowed(email))) return "/masuk?error=domain";
      }
      return true;
    },
  },
  events: {
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
