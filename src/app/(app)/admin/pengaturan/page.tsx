import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { DatabaseZap } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./form";

export const metadata = { title: "Pengaturan alur" };

export default async function PengaturanPage() {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const settings = await getSettings();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Administrasi" title="Pengaturan alur" description="Jalur laporan, batas waktu, dan eskalasi. Setiap perubahan tercatat." />
      <SettingsForm settings={settings} isAdmin={user.role === "ADMIN"} />
      {user.role === "ADMIN" && (
        <Link href="/admin/data-uji" className="card card-hover mt-4 flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red/10 text-red"><DatabaseZap size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink-900">Data uji coba</span>
            <span className="block text-xs text-ink-500">Bersihkan data contoh dan data percobaan sebelum uji coba.</span>
          </span>
        </Link>
      )}
    </div>
  );
}
