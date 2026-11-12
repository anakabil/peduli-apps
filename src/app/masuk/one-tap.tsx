"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { usePwa } from "@/components/pwa/pwa-provider";
import { useLang, useTr } from "@/components/i18n/lang-provider";

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
  const tr = useTr();
  const lang = useLang();
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
            setError(tr("Akun Google tidak dikenali atau tidak diizinkan.", "Google account not recognised or not permitted."));
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
          locale: lang,
        });
      }
      // Otomatis tawarkan akun Google perangkat
      window.google.accounts.id.prompt();
    };
    document.head.appendChild(script);
  }, [clientId, isMobile, tr, lang]);

  return (
    <div className="space-y-2">
      <div ref={btnRef} className="flex justify-center min-h-[44px]" />
      {busy && <p className="text-center text-xs text-ink-500">{tr("Memverifikasi akun Google...", "Verifying Google account...")}</p>}
      {error && <p className="text-center text-xs text-red">{error}</p>}
    </div>
  );
}
