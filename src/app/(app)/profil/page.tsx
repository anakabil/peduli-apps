import { LogOut, Shield, MapPin, Briefcase, Mail, Smartphone } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { signOut } from "@/auth";
import { getSettings } from "@/lib/settings";
import { pointBalance, pointEarned, levelFor } from "@/lib/points";
import { PageHeader, Card, CardBody, Avatar, Field, Badge } from "@/components/ui";
import { ROLE_LABEL, ROLE_DESC, type Role } from "@/lib/constants";
import { fmtDateTime } from "@/lib/format";
import { InstallButton } from "@/components/pwa/install-prompt";

export const metadata = { title: "Profil" };

export default async function ProfilPage() {
  const user = await requireUser();
  const settings = await getSettings();
  const role = user.role as Role;
  const [balance, earned, logs] = await Promise.all([pointBalance(user.id), pointEarned(user.id), db.auditLog.findMany({ where: { actorId: user.id, action: { in: ["MASUK", "KELUAR"] } }, orderBy: { createdAt: "desc" }, take: 8 })]);
  const level = levelFor(earned, settings.levels);

  async function save(fd: FormData) {
    "use server";
    const u = await requireUser();
    await db.user.update({ where: { id: u.id }, data: { phone: String(fd.get("phone") ?? "").trim() || null, jabatan: u.role === "ADMIN" ? String(fd.get("jabatan") ?? "").trim() || null : u.jabatan } });
    revalidatePath("/profil");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader eyebrow="Akun" title="Profil saya" />
      <Card className="anim-fade-up">
        <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar name={user.name} image={user.image} size={72} />
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <div className="mt-1 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="brand">{ROLE_LABEL[role]}</Badge>
              <Badge tone="success">Aktif</Badge>
              {settings.eligibleRoles.includes(role) && <span className="badge" style={{ background: `${level.color}22`, color: level.color }}>Level {level.name}</span>}
            </div>
            <p className="mt-2 text-sm text-ink-500">{ROLE_DESC[role]}</p>
            <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-2 text-ink-700"><Mail size={14} className="text-ink-400" /> {user.email}</div>
              <div className="flex items-center gap-2 text-ink-700"><Briefcase size={14} className="text-ink-400" /> {user.jabatan ?? "-"}{user.departemen ? `, ${user.departemen}` : ""}</div>
              <div className="flex items-center gap-2 text-ink-700"><MapPin size={14} className="text-ink-400" /> Area: {user.area?.name ?? "-"}</div>
              <div className="flex items-center gap-2 text-ink-700"><Shield size={14} className="text-ink-400" /> Atasan: {user.atasan?.name ?? "-"}</div>
            </dl>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="anim-fade-up">
          <CardBody>
            <h3 className="font-bold">Data kontak</h3>
            <form action={save} className="mt-3 space-y-3">
              <Field label="Nomor telepon">
                <input name="phone" className="input" defaultValue={user.phone ?? ""} placeholder="08xxxxxxxxxx" />
              </Field>
              {role === "ADMIN" && (
                <Field label="Jabatan">
                  <input name="jabatan" className="input" defaultValue={user.jabatan ?? ""} />
                </Field>
              )}
              <p className="text-xs text-ink-500">Peran, area, dan atasan ditetapkan oleh admin program.</p>
              <button className="btn-primary btn-sm">Simpan</button>
            </form>
          </CardBody>
        </Card>
        <Card className="anim-fade-up">
          <CardBody>
            <h3 className="font-bold">Poin</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold">{balance}</span>
              <span className="text-sm text-ink-500">saldo, {earned} total diperoleh</span>
            </div>
            <h3 className="mt-5 font-bold">Jejak akses terakhir</h3>
            <ul className="mt-2 space-y-1 text-xs text-ink-600">
              {logs.map((l) => (
                <li key={l.id} className="flex justify-between"><span>{l.action === "MASUK" ? "Masuk" : "Keluar"}</span><span className="text-ink-400">{fmtDateTime(l.createdAt)}</span></li>
              ))}
              {logs.length === 0 && <li className="text-ink-400">Belum ada catatan.</li>}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="anim-fade-up">
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-600"><Smartphone size={16} className="text-brand-600" /> Pasang PEDULI di layar utama untuk akses cepat dan mode luring.</div>
          <div className="flex gap-2">
            <InstallButton />
            <form action={async () => { "use server"; await signOut({ redirectTo: "/masuk" }); }}>
              <button className="btn-secondary btn-sm"><LogOut size={14} /> Keluar</button>
            </form>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
