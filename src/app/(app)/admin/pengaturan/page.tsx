import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./form";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Pengaturan alur", "Workflow settings") };
}

export default async function PengaturanPage() {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const settings = await getSettings();
  const { tr } = await getTr();
  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Pengaturan alur", "Workflow settings")}
        description={tr("Jalur laporan, batas waktu, dan eskalasi. Setiap perubahan tercatat.", "Report routes, deadlines, and escalation. Every change is recorded.")}
      />
      <SettingsForm settings={settings} isAdmin={user.role === "ADMIN"} />
      {user.role === "ADMIN" && (
        <Link href="/admin/data-uji" className="card card-hover mt-4 flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red"><DatabaseZap size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink-900">{tr("Data uji coba", "Trial data")}</span>
            <span className="block text-xs text-ink-500">{tr("Bersihkan data contoh dan data percobaan sebelum uji coba.", "Clear sample and test data before the trial.")}</span>
          </span>
        </Link>
      )}
    </div>
  );
}
