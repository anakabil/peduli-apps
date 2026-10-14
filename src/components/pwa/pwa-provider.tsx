"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PwaState = {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isMobile: boolean;
  online: boolean;
  promptInstall: () => Promise<boolean>;
};

const PwaContext = createContext<PwaState>({
  canInstall: false,
  isStandalone: false,
  isIos: false,
  isMobile: false,
  online: true,
  promptInstall: async () => false,
});

export function usePwa() {
  return useContext(PwaContext);
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setStandalone] = useState(false);
  const [isIos, setIos] = useState(false);
  const [isMobile, setMobile] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIos(/iphone|ipad|ipod/i.test(ua));
    setMobile(/android|iphone|ipad|ipod|mobile/i.test(ua) || window.matchMedia("(max-width: 768px)").matches);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(standalone);
    setOnline(navigator.onLine);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    return choice.outcome === "accepted";
  }, [deferred]);

  const value = useMemo(
    () => ({ canInstall: !!deferred, isStandalone, isIos, isMobile, online, promptInstall }),
    [deferred, isStandalone, isIos, isMobile, online, promptInstall]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
