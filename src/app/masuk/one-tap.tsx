"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { usePwa } from "@/components/pwa/pwa-provider";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          prompt: (cb?: (n: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean; getNotDisplayedReason?: () => string }) => void) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
          cancel: () => void;
        };
      };
    };
  }
}

/**
 * Google One Tap: di smartphone, otomatis menawarkan akun Google yang sudah ada di perangkat.
 * ID token diverifikasi di server melalui provider credentials "google-onetap".
 */
export function GoogleOneTap({ clientId }: { clientId: string }) {
  const { isMobile } = usePwa();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const btnRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: true,
        cancel_on_tap_outside: false,
        context: "signin",
        itp_support: true,
        use_fedcm_for_prompt: true,
        callback: async (resp: { credential: string }) => {
          setBusy(true);
          setError(null);
          const r = await signIn("google-onetap", { credential: resp.credential, redirect: false });
          if (r?.error) {
            setBusy(false);
            setError("Akun Google tidak dikenali atau tidak diizinkan.");
            return;
          }
          window.location.href = "/beranda";
        },
      });
      if (btnRef.current) {
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: btnRef.current.offsetWidth || 320,
          locale: "id",
        });
      }
      // Otomatis tawarkan akun Google perangkat
      window.google.accounts.id.prompt();
    };
    document.head.appendChild(script);
  }, [clientId, isMobile]);

  return (
    <div className="space-y-2">
      <div ref={btnRef} className="flex justify-center min-h-[44px]" />
      {busy && <p className="text-center text-xs text-ink-500">Memverifikasi akun Google...</p>}
      {error && <p className="text-center text-xs text-red">{error}</p>}
    </div>
  );
}
