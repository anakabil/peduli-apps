import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui";
import { SettingsForm } from "./form";

export const metadata = { title: "Pengaturan alur" };

export default async function PengaturanPage() {
  const user = await requireUser(["ADMIN", "MANAGER"]);
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Pengaturan alur" title="Manager mengatur urutan dan batas waktu" description="Jalur laporan, batas waktu tiap tahap, dan aturan eskalasi otomatis. Setiap perubahan tercatat pada jejak audit." />
      <SettingsForm settings={settings} isAdmin={user.role === "ADMIN"} />
    </div>
  );
}
