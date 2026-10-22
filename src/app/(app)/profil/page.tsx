import { LogOut, LogIn, Shield, MapPin, Briefcase, Mail, Smartphone, History, Award } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { signOut } from "@/auth";
import { getSettings } from "@/lib/settings";
import { pointBalance, pointEarned, levelFor } from "@/lib/points";
import { PageHeader, Card, CardBody, CardHeader, Avatar, Field, Badge } from "@/components/ui";
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
  const eligible = settings.eligibleRoles.includes(role);

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
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-ink-900">{user.name}</h2>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="brand">{ROLE_LABEL[role]}</Badge>
              <Badge tone="success">Aktif</Badge>
              {eligible && <span className="badge" style={{ background: `${level.color}22`, color: level.color }}>Level {level.name}</span>}
            </div>
            <p className="mt-2 text-sm text-ink-500">{ROLE_DESC[role]}</p>
            <dl className="mt-4 grid grid-cols-1 gap-2.5 text-left text-sm sm:grid-cols-2">
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Mail size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{user.email}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Briefcase size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{user.jabatan ?? "-"}{user.departemen ? `, ${user.departemen}` : ""}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><MapPin size={14} className="shrink-0 text-ink-400" /> <span className="truncate">Area: {user.area?.name ?? "-"}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Shield size={14} className="shrink-0 text-ink-400" /> <span className="truncate">Atasan: {user.atasan?.name ?? "-"}</span></div>
            </dl>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title="Data kontak" subtitle="Peran, area, dan atasan ditetapkan oleh admin program." />
          <CardBody className="pt-4">
            <form action={save} className="space-y-3">
              <Field label="Nomor telepon">
                <input name="phone" className="input min-h-11 md:min-h-0" inputMode="tel" defaultValue={user.phone ?? ""} placeholder="08xxxxxxxxxx" />
              </Field>
              {role === "ADMIN" && (
                <Field label="Jabatan">
                  <input name="jabatan" className="input min-h-11 md:min-h-0" defaultValue={user.jabatan ?? ""} />
                </Field>
              )}
              <div className="pt-1">
                <button className="btn-primary min-h-11 w-full sm:w-auto md:min-h-0">Simpan</button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="anim-fade-up">
          <CardHeader title="Poin" action={<Award size={18} className="shrink-0 text-gold" />} />
          <CardBody className="pt-4">
            <div className="text-[13px] font-medium text-ink-600">Saldo saat ini</div>
            <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">{balance.toLocaleString("id-ID")}</div>
            <dl className="mt-4 divide-y divide-ink-100 border-t border-ink-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">Total diperoleh</dt>
                <dd className="font-semibold tabular-nums text-ink-800">{earned.toLocaleString("id-ID")}</dd>
              </div>
              {eligible && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-500">Level</dt>
                  <dd className="font-semibold text-ink-800">{level.name}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card className="anim-fade-up">
        <CardHeader title="Jejak akses terakhir" subtitle="Catatan masuk dan keluar akun Anda." action={<History size={18} className="shrink-0 text-brand-600" />} />
        <CardBody className="pt-3">
          {logs.length === 0 ? (
            <p className="text-sm text-ink-500">Belum ada catatan.</p>
          ) : (
            <ul className="-my-1 divide-y divide-ink-100">
              {logs.map((l) => {
                const masuk = l.action === "MASUK";
                const Icon = masuk ? LogIn : LogOut;
                return (
                  <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="inline-flex items-center gap-2.5 text-ink-800">
                      <span className={masuk ? "rounded-lg bg-brand-50 p-1.5 text-brand-600" : "rounded-lg bg-ink-100 p-1.5 text-ink-500"}>
                        <Icon size={14} />
                      </span>
                      {masuk ? "Masuk" : "Keluar"}
                    </span>
                    <span className="text-right text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card className="flex flex-col anim-fade-up">
          <CardHeader title="Aplikasi di perangkat" action={<Smartphone size={18} className="shrink-0 text-brand-600" />} />
          <CardBody className="flex flex-1 flex-col gap-4 pt-3">
            <p className="text-sm text-ink-600">Pasang PEDULI di layar utama untuk akses cepat dan mode luring.</p>
            <div className="mt-auto empty:hidden">
              <InstallButton className="min-h-11 md:min-h-0" />
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col anim-fade-up">
          <CardHeader title="Sesi" action={<LogOut size={18} className="shrink-0 text-ink-400" />} />
          <CardBody className="flex flex-1 flex-col gap-4 pt-3">
            <p className="text-sm text-ink-600">Keluar dari akun PEDULI di perangkat ini.</p>
            <form className="mt-auto" action={async () => { "use server"; await signOut({ redirectTo: "/masuk" }); }}>
              <button className="btn-secondary min-h-11 w-full sm:w-auto md:min-h-0"><LogOut size={16} /> Keluar</button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
