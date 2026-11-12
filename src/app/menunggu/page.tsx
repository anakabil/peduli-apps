import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/auth";
import { PeduliLogo, Credit } from "@/components/brand";
import { ILLUSTRATION } from "@/lib/icons";
import { LangSwitch } from "@/components/i18n/lang-switch";
import { getTr } from "@/lib/i18n-server";

export async function generateMetadata() {
  const { tr } = await getTr();
  return { title: tr("Menunggu persetujuan", "Awaiting approval") };
}

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.status === "ACTIVE") redirect("/beranda");
  const { tr } = await getTr();
  return (
    <main className="relative min-h-dvh flex items-center justify-center px-6 pb-6 pt-16">
      <div className="absolute right-4 top-4 z-20 md:right-6 md:top-6">
        <LangSwitch />
      </div>
      <div className="card w-full max-w-md p-8 text-center anim-scale-in">
        <div className="flex justify-center">
          <PeduliLogo height={44} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ILLUSTRATION.menungguPersetujuan} alt="" aria-hidden width={240} height={180} className="mx-auto mt-4 h-auto w-52 anim-float" />
        <h1 className="mt-5 text-xl font-bold">{user.status === "INACTIVE" ? tr("Akun dinonaktifkan", "Account deactivated") : tr("Menunggu persetujuan admin", "Awaiting admin approval")}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {user.status === "INACTIVE"
            ? tr("Akun Anda tidak aktif. Hubungi tim pengelola program PEDULI untuk mengaktifkan kembali.", "Your account is inactive. Contact the PEDULI program team to reactivate it.")
            : tr("Akun Google Anda sudah terdaftar. Admin program akan menetapkan peran dan area kerja Anda. Setelah disetujui, menu akan muncul otomatis sesuai peran.", "Your Google account has been registered. The program admin will assign your role and work area. Once approved, the menu will appear automatically according to your role.")}
        </p>
        <div className="mt-4 rounded-xl bg-ink-50 px-4 py-3 text-sm">
          <div className="font-semibold text-ink-800">{user.name}</div>
          <div className="text-ink-500">{user.email}</div>
        </div>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/masuk" });
          }}
        >
          <button className="btn-secondary w-full">
            <LogOut size={16} /> {tr("Keluar", "Sign out")}
          </button>
        </form>
        <Credit className="mt-6" />
      </div>
    </main>
  );
}
