import { LogOut, LogIn, Shield, MapPin, Briefcase, Mail, Smartphone, History, Award, BellRing } from "lucide-react";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { logoutAction } from "@/app/actions/session";
import { getSettings } from "@/lib/settings";
import { pointBalance, pointEarned, levelFor } from "@/lib/points";
import { PageHeader, Card, CardBody, CardHeader, Avatar, Field, Badge } from "@/components/ui";
import { NOTIF_TYPES, NOTIF_TYPE_ROLES, labels, type Role, type NotifType } from "@/lib/constants";
import { getTr } from "@/lib/i18n-server";
import { PushDeviceCard, PushEndpointInput } from "@/components/pwa/push-setup";
import { fmtDateTime } from "@/lib/format";
import { InstallButton } from "@/components/pwa/install-prompt";
import { levelImg } from "@/lib/icons";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Profil", "Profile") };
}

export default async function ProfilPage() {
  const user = await requireUser();
  const { lang, tr } = await getTr();
  const L = labels(lang);
  const settings = await getSettings();
  const role = user.role as Role;
  const [balance, earned, logs] = await Promise.all([pointBalance(user.id), pointEarned(user.id), db.auditLog.findMany({ where: { actorId: user.id, action: { in: ["MASUK", "KELUAR"] } }, orderBy: { createdAt: "desc" }, take: 8 })]);
  const level = levelFor(earned, settings.levels, lang);
  const eligible = settings.eligibleRoles.includes(role);

  async function save(fd: FormData) {
    "use server";
    const u = await requireUser();
    await db.user.update({ where: { id: u.id }, data: { phone: String(fd.get("phone") ?? "").trim() || null, jabatan: u.role === "ADMIN" ? String(fd.get("jabatan") ?? "").trim() || null : u.jabatan } });
    revalidatePath("/profil");
  }

  // Pilihan jenis notifikasi ponsel; yang tidak dicentang disimpan sebagai daftar yang dimatikan
  const myTypes = NOTIF_TYPES.filter((t) => NOTIF_TYPE_ROLES[t].includes(role));
  const muted = new Set(user.pushMuted ?? []);
  async function savePush(fd: FormData) {
    "use server";
    const u = await requireUser();
    const mine = NOTIF_TYPES.filter((t) => NOTIF_TYPE_ROLES[t].includes(u.role as Role));
    const off: NotifType[] = mine.filter((t) => fd.get(`n_${t}`) !== "on");
    await db.user.update({ where: { id: u.id }, data: { pushMuted: off } });
    revalidatePath("/profil");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader eyebrow={tr("Akun", "Account")} title={tr("Profil saya", "My profile")} />
      <Card className="anim-fade-up">
        <CardBody className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Avatar name={user.name} image={user.image} size={72} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-ink-900">{user.name}</h2>
            <div className="mt-1.5 flex flex-wrap justify-center gap-2 sm:justify-start">
              <Badge tone="brand">{L.ROLE_LABEL[role]}</Badge>
              <Badge tone="success">{tr("Aktif", "Active")}</Badge>
              {eligible && (
                <span className="badge gap-1" style={{ background: `${level.color}22`, color: level.color }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={levelImg(level.name)} alt="" aria-hidden width={18} height={18} className="-my-1 size-[18px]" />
                  Level {level.label}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-ink-500">{L.ROLE_DESC[role]}</p>
            <dl className="mt-4 grid grid-cols-1 gap-2.5 text-left text-sm sm:grid-cols-2">
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Mail size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{user.email}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Briefcase size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{user.jabatan ?? "-"}{user.departemen ? `, ${user.departemen}` : ""}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><MapPin size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{tr("Area", "Area")}: {user.area?.name ?? "-"}</span></div>
              <div className="flex min-w-0 items-center gap-2 text-ink-700"><Shield size={14} className="shrink-0 text-ink-400" /> <span className="truncate">{tr("Atasan", "Reports to")}: {user.atasan?.name ?? "-"}</span></div>
            </dl>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card className="anim-fade-up">
          <CardHeader title={tr("Data kontak", "Contact details")} subtitle={tr("Peran, area, dan atasan ditetapkan oleh admin program.", "Role, area, and reporting line are set by the program admin.")} />
          <CardBody className="pt-4">
            <form action={save} className="space-y-3">
              <Field label={tr("Nomor telepon", "Phone number")}>
                <input name="phone" className="input min-h-11 md:min-h-0" inputMode="tel" defaultValue={user.phone ?? ""} placeholder="08xxxxxxxxxx" />
              </Field>
              {role === "ADMIN" && (
                <Field label={tr("Jabatan", "Job title")}>
                  <input name="jabatan" className="input min-h-11 md:min-h-0" defaultValue={user.jabatan ?? ""} />
                </Field>
              )}
              <div className="pt-1">
                <button className="btn-primary min-h-11 w-full sm:w-auto md:min-h-0">{tr("Simpan", "Save")}</button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="anim-fade-up">
          <CardHeader title={tr("Poin", "Points")} action={<Award size={18} className="shrink-0 text-gold" />} />
          <CardBody className="pt-4">
            <div className="text-[13px] font-medium text-ink-600">{tr("Saldo saat ini", "Current balance")}</div>
            <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-ink-900">{balance.toLocaleString("id-ID")}</div>
            <dl className="mt-4 divide-y divide-ink-100 border-t border-ink-100 text-sm">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink-500">{tr("Total diperoleh", "Total earned")}</dt>
                <dd className="font-semibold tabular-nums text-ink-800">{earned.toLocaleString("id-ID")}</dd>
              </div>
              {eligible && (
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="text-ink-500">Level</dt>
                  <dd className="font-semibold text-ink-800">{level.label}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      </div>

      <Card className="anim-fade-up" id="notifikasi">
        <CardHeader title={tr("Notifikasi ponsel", "Mobile notifications")} subtitle={tr("Muncul di ponsel meski aplikasi tertutup.", "Shown on your phone even when the app is closed.")} action={<BellRing size={18} className="shrink-0 text-brand-600" />} />
        <CardBody className="space-y-4 pt-3">
          <PushDeviceCard />
          <form action={savePush} className="border-t border-ink-100 pt-4">
            <div className="mb-2 text-[13px] font-medium text-ink-700">{tr("Jenis yang ingin diterima", "Types you want to receive")}</div>
            <div className="divide-y divide-ink-100">
              {myTypes.map((t) => {
                const off = !settings.push[t];
                return (
                  <label key={t} className={`flex min-h-12 cursor-pointer items-start gap-3 py-2.5 ${off ? "opacity-60" : ""}`}>
                    <input type="checkbox" name={`n_${t}`} defaultChecked={!muted.has(t)} disabled={off} className="mt-0.5 size-5 shrink-0 accent-[var(--brand-600)]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-ink-800">{L.NOTIF_TYPE_LABEL[t]}</span>
                      <span className="block text-xs text-ink-500">{off ? tr("Dimatikan oleh pengelola program.", "Turned off by the program team.") : L.NOTIF_TYPE_DESC[t]}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <button className="btn-secondary mt-3 min-h-11 md:min-h-0">{tr("Simpan pilihan", "Save preferences")}</button>
          </form>
        </CardBody>
      </Card>

      <Card className="anim-fade-up">
        <CardHeader title={tr("Jejak akses terakhir", "Recent access history")} subtitle={tr("Catatan masuk dan keluar akun Anda.", "Sign-in and sign-out records for your account.")} action={<History size={18} className="shrink-0 text-brand-600" />} />
        <CardBody className="pt-3">
          {logs.length === 0 ? (
            <p className="text-sm text-ink-500">{tr("Belum ada catatan.", "No records yet.")}</p>
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
                      {masuk ? tr("Masuk", "Sign in") : tr("Keluar", "Sign out")}
                    </span>
                    <span className="text-right text-xs tabular-nums text-ink-500">{fmtDateTime(l.createdAt, false, lang)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 [&>*]:min-w-0">
        <Card className="flex flex-col anim-fade-up">
          <CardHeader title={tr("Aplikasi di perangkat", "App on this device")} action={<Smartphone size={18} className="shrink-0 text-brand-600" />} />
          <CardBody className="flex flex-1 flex-col gap-4 pt-3">
            <p className="text-sm text-ink-600">{tr("Pasang PEDULI di layar utama untuk akses cepat dan mode luring.", "Install PEDULI on your home screen for quick access and offline mode.")}</p>
            <div className="mt-auto empty:hidden">
              <InstallButton className="min-h-11 md:min-h-0" />
            </div>
          </CardBody>
        </Card>

        <Card className="flex flex-col anim-fade-up">
          <CardHeader title={tr("Sesi", "Session")} action={<LogOut size={18} className="shrink-0 text-ink-400" />} />
          <CardBody className="flex flex-1 flex-col gap-4 pt-3">
            <p className="text-sm text-ink-600">{tr("Keluar dari akun PEDULI di perangkat ini.", "Sign out of your PEDULI account on this device.")}</p>
            <form className="mt-auto" action={logoutAction}>
              <PushEndpointInput />
              <button className="btn-secondary min-h-11 w-full sm:w-auto md:min-h-0"><LogOut size={16} /> {tr("Keluar", "Sign out")}</button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
