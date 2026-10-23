import { requireUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
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
    </div>
  );
}
