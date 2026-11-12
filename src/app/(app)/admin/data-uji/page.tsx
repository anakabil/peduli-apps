import { TriangleAlert } from "lucide-react";
import { requireUser } from "@/lib/session";
import { isDemoMode } from "@/auth";
import { previewReset } from "@/lib/reset";
import { DEMO_DOMAIN } from "@/lib/demo-accounts";
import { PageHeader, Alert } from "@/components/ui";
import { ResetForm } from "./form";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Data uji coba", "Trial data") };
}
export const dynamic = "force-dynamic";

export default async function DataUjiPage() {
  const user = await requireUser(["ADMIN"]);
  const { tr } = await getTr();
  const p = await previewReset();
  const asDemo = !!user.email?.endsWith(DEMO_DOMAIN);
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        eyebrow={tr("Administrasi", "Administration")}
        title={tr("Data uji coba", "Trial data")}
        description={tr(
          "Bersihkan data contoh dan data percobaan sebelum uji coba lapangan. Akun nyata, pengaturan, dan katalog yang sudah disesuaikan tetap utuh.",
          "Clear sample and test data before the field trial. Real accounts, settings, and the customised catalogue remain intact.",
        )}
      />
      {isDemoMode() && (
        <Alert tone="warn" title={tr("Mode demo masih aktif", "Demo mode is still active")}>
          {tr(
            "Login demo akan membuat ulang akun dan area contoh. Matikan DEMO_MODE di pengaturan Vercel sebelum uji coba dimulai.",
            "Demo sign-in will recreate the sample accounts and areas. Turn off DEMO_MODE in the Vercel settings before the trial begins.",
          )}
        </Alert>
      )}
      {asDemo && (
        <Alert tone="danger" title={tr("Anda masuk dengan akun demo", "You are signed in with a demo account")}>
          {tr("Akun demo ikut terhapus. Masuk dengan akun Google admin untuk menjalankan pembersihan.", "Demo accounts are deleted too. Sign in with the admin Google account to run the cleanup.")}
        </Alert>
      )}
      <div className="flex items-start gap-2 rounded-xl bg-red/5 px-4 py-3 text-sm text-ink-800 ring-1 ring-red/20">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red" />
        {tr("Penghapusan permanen dan tidak dapat dibatalkan.", "Deletion is permanent and cannot be undone.")}
      </div>
      <ResetForm preview={p} disabled={asDemo} />
    </div>
  );
}
