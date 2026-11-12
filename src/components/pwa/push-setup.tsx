"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, BellOff, Loader2, Send, X } from "lucide-react";
import { usePwa } from "./pwa-provider";
import { cn } from "@/lib/format";
import { useTr } from "@/components/i18n/lang-provider";

type State = "loading" | "unsupported" | "ios-install" | "denied" | "off" | "on";

function b64ToBytes(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration() {
  if (!("serviceWorker" in navigator)) return null;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 6000));
  return Promise.race([navigator.serviceWorker.ready, timeout]);
}

async function saveSub(sub: PushSubscription) {
  const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  return res.ok;
}

/** Status dan pengaturan notifikasi ponsel untuk perangkat ini */
export function usePush() {
  const { isIos, isStandalone } = usePwa();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const tr = useTr();

  const refresh = useCallback(async () => {
    const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    if (!supported) return setState(isIos && !isStandalone ? "ios-install" : "unsupported");
    if (Notification.permission === "denied") return setState("denied");
    const reg = await registration();
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    if (sub && Notification.permission === "granted") {
      // Perangkat ini mengikuti akun yang sedang masuk
      await saveSub(sub).catch(() => {});
      setState("on");
    } else setState("off");
  }, [isIos, isStandalone]);

  useEffect(() => {
    // Status izin dan langganan hanya bisa dibaca di peramban, setelah halaman tampil
    refresh();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await registration();
      if (!reg) throw new Error("Service worker belum siap.");
      const { publicKey } = await (await fetch("/api/push/key")).json();
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) }));
      if (!(await saveSub(sub))) throw new Error("Gagal menyimpan.");
      setState("on");
      setMsg(tr("Notifikasi aktif di perangkat ini.", "Notifications are on for this device."));
    } catch {
      setMsg(tr("Notifikasi belum dapat diaktifkan. Coba lagi beberapa saat.", "Notifications could not be turned on. Please try again shortly."));
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const reg = await registration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setState("off");
      setMsg(tr("Notifikasi dimatikan di perangkat ini.", "Notifications are off for this device."));
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/push/test", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      setMsg(res.ok && body.ok ? tr("Notifikasi uji dikirim. Periksa bilah notifikasi.", "Test notification sent. Check your notification bar.") : body.error ?? tr("Notifikasi uji gagal dikirim.", "The test notification could not be sent."));
    } finally {
      setBusy(false);
    }
  };

  return { state, busy, msg, enable, disable, test };
}

/** Kartu pengaturan notifikasi perangkat di halaman Profil */
export function PushDeviceCard() {
  const { state, busy, msg, enable, disable, test } = usePush();
  const tr = useTr();
  const text: Record<State, string> = {
    loading: tr("Memeriksa perangkat...", "Checking device..."),
    unsupported: tr("Peramban ini belum mendukung notifikasi. Pasang aplikasi PEDULI atau gunakan Chrome versi terbaru.", "This browser does not support notifications. Install the PEDULI app or use the latest version of Chrome."),
    "ios-install": tr("Di iPhone, notifikasi hanya berfungsi setelah PEDULI ditambahkan ke Layar Utama. Buka menu Bagikan, pilih Tambah ke Layar Utama, lalu buka PEDULI dari ikon tersebut.", "On iPhone, notifications only work after PEDULI is added to the Home Screen. Open the Share menu, select Add to Home Screen, then open PEDULI from that icon."),
    denied: tr("Izin notifikasi diblokir. Buka pengaturan situs atau aplikasi di ponsel, izinkan notifikasi, lalu muat ulang halaman ini.", "Notification permission is blocked. Open the site or app settings on your phone, allow notifications, then reload this page."),
    off: tr("Aktifkan agar tugas verifikasi, keputusan, dan tindak lanjut muncul di ponsel meski aplikasi tertutup.", "Turn this on so verification, decision, and follow-up tasks appear on your phone even when the app is closed."),
    on: tr("Perangkat ini menerima notifikasi.", "This device receives notifications."),
  };
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", state === "on" ? "bg-brand-100 text-brand-700" : "bg-ink-100 text-ink-500")}>
          {state === "on" ? <BellRing size={18} /> : <BellOff size={18} />}
        </div>
        <p className="text-sm text-ink-600">{text[state]}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {state === "off" && (
          <button type="button" onClick={enable} disabled={busy} className="btn-primary min-h-11 md:min-h-0">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <BellRing size={16} />} {tr("Aktifkan notifikasi", "Turn on notifications")}
          </button>
        )}
        {state === "on" && (
          <>
            <button type="button" onClick={test} disabled={busy} className="btn-secondary min-h-11 md:min-h-0">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {tr("Kirim uji", "Send test")}
            </button>
            <button type="button" onClick={disable} disabled={busy} className="btn-ghost min-h-11 md:min-h-0">
              <BellOff size={16} /> {tr("Matikan", "Turn off")}
            </button>
          </>
        )}
      </div>
      {msg && <p className="mt-2 text-sm text-brand-700" aria-live="polite">{msg}</p>}
    </div>
  );
}

/** Ajakan singkat di Beranda bila perangkat belum menerima notifikasi; dapat ditutup */
export function PushPrompt() {
  const { state, busy, enable } = usePush();
  const tr = useTr();
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("peduli-push-prompt") === "tutup";
    } catch {}
    // Pilihan menutup ajakan tersimpan di peramban, hanya terbaca setelah halaman tampil
    setHidden(dismissed);
  }, []);
  if (hidden || (state !== "off" && state !== "ios-install")) return null;
  const close = () => {
    try {
      localStorage.setItem("peduli-push-prompt", "tutup");
    } catch {}
    setHidden(true);
  };
  return (
    <div className="card flex items-start gap-3 border-brand-200 bg-brand-50/60 p-4 anim-fade-up">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
        <BellRing size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-ink-900">{tr("Terima notifikasi di ponsel", "Get notifications on your phone")}</div>
        <p className="mt-0.5 text-sm text-ink-600">
          {state === "ios-install" ? tr("Tambahkan PEDULI ke Layar Utama terlebih dahulu, lalu aktifkan notifikasi di Profil.", "Add PEDULI to your Home Screen first, then turn on notifications in Profile.") : tr("Tugas dan tindak lanjut untuk Anda akan langsung muncul di ponsel.", "Your tasks and follow-ups will appear on your phone right away.")}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {state === "off" ? (
            <button type="button" onClick={enable} disabled={busy} className="btn-primary btn-sm min-h-11 md:min-h-0">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />} {tr("Aktifkan", "Turn on")}
            </button>
          ) : (
            <Link href="/profil#notifikasi" className="btn-secondary btn-sm min-h-11 md:min-h-0">{tr("Buka Profil", "Open Profile")}</Link>
          )}
        </div>
      </div>
      <button type="button" onClick={close} className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-white" aria-label={tr("Tutup", "Close")}>
        <X size={16} />
      </button>
    </div>
  );
}

async function currentSub() {
  if (!("serviceWorker" in navigator) || !("Notification" in window) || Notification.permission !== "granted") return null;
  const reg = await registration();
  return reg ? reg.pushManager.getSubscription() : null;
}

/** Sinkronisasi diam-diam: bila perangkat sudah berlangganan, langganan diikatkan ke akun yang sedang masuk */
export function PushSync() {
  useEffect(() => {
    currentSub()
      .then((sub) => sub && saveSub(sub))
      .catch(() => {});
  }, []);
  return null;
}

/** Kolom tersembunyi pada formulir keluar: langganan perangkat ini dilepas dari akun saat keluar */
export function PushEndpointInput() {
  const [endpoint, setEndpoint] = useState("");
  useEffect(() => {
    currentSub()
      .then((sub) => sub && setEndpoint(sub.endpoint))
      .catch(() => {});
  }, []);
  return <input type="hidden" name="pushEndpoint" value={endpoint} />;
}
