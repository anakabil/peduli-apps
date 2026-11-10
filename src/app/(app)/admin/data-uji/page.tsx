import { TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/session";
import { isDemoMode } from "@/auth";
import { previewReset } from "@/lib/reset";
import { DEMO_DOMAIN } from "@/lib/demo-accounts";
import { PageHeader, Alert } from "@/components/ui";
import { ResetForm } from "./form";

export const metadata = { title: "Data uji coba" };
export const dynamic = "force-dynamic";

export default async function DataUjiPage() {
  const user = await requireUser(["ADMIN"]);
  const p = await previewReset();
  const asDemo = !!user.email?.endsWith(DEMO_DOMAIN);
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader eyebrow="Administrasi" title="Data uji coba" description="Bersihkan data contoh dan data percobaan sebelum uji coba lapangan. Akun nyata, pengaturan, dan katalog yang sudah disesuaikan tetap utuh." />
      {isDemoMode() && (
        <Alert tone="warn" title="Mode demo masih aktif">
          Login demo akan membuat ulang akun dan area contoh. Matikan DEMO_MODE di pengaturan Vercel sebelum uji coba dimulai.
        </Alert>
      )}
      {asDemo && (
        <Alert tone="danger" title="Anda masuk dengan akun demo">
          Akun demo ikut terhapus. Masuk dengan akun Google admin untuk menjalankan pembersihan.
        </Alert>
      )}
      <div className="flex items-start gap-2 rounded-xl bg-red/5 px-4 py-3 text-sm text-ink-800 ring-1 ring-red/20">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red" />
        Penghapusan permanen dan tidak dapat dibatalkan.
      </div>
      <ResetForm preview={p} disabled={asDemo} />
    </div>
  );
}
