import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { signOut } from "@/auth";
import { PeduliLogo, Credit } from "@/components/brand";
import { ILLUSTRATION } from "@/lib/icons";

export const metadata = { title: "Menunggu persetujuan" };

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/masuk");
  if (user.status === "ACTIVE") redirect("/beranda");
  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="card w-full max-w-md p-8 text-center anim-scale-in">
        <div className="flex justify-center">
          <PeduliLogo height={44} />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ILLUSTRATION.menungguPersetujuan} alt="" aria-hidden width={240} height={180} className="mx-auto mt-4 h-auto w-52 anim-float" />
        <h1 className="mt-5 text-xl font-bold">{user.status === "INACTIVE" ? "Akun dinonaktifkan" : "Menunggu persetujuan admin"}</h1>
        <p className="mt-2 text-sm text-ink-500">
          {user.status === "INACTIVE"
            ? "Akun Anda tidak aktif. Hubungi tim pengelola program PEDULI untuk mengaktifkan kembali."
            : "Akun Google Anda sudah terdaftar. Admin program akan menetapkan peran dan area kerja Anda. Setelah disetujui, menu akan muncul otomatis sesuai peran."}
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
            <LogOut size={16} /> Keluar
          </button>
        </form>
        <Credit className="mt-6" />
      </div>
    </main>
  );
}
