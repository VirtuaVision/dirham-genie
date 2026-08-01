// Save as: components/InstallPrompt.jsx
"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "dg_install_prompt_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari's own flag
  );
}

function isIOS() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [dismissed, setDismissed] = useState(true); // default hidden until checks pass

  useEffect(() => {
    if (isStandalone()) return; // already installed — never nag
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    setDismissed(false);

    if (isIOS()) {
      // iOS never fires beforeinstallprompt and can't be triggered
      // programmatically — the only path is Share -> Add to Home Screen,
      // so just show instructions instead of a button.
      setShowIOSBanner(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (dismissed) return null;
  if (!showIOSBanner && !deferredPrompt) return null; // nothing to offer yet

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md card-surface rounded-lg border border-gold/30 p-4 shadow-lg flex items-start gap-3">
      <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-cream/90">Add Dirham Genie to your Home Screen</p>
        {showIOSBanner ? (
          <p className="text-xs text-cream/60 mt-1">
            Tap the Share icon <span className="inline-block">⬆️</span> below, then &quot;Add to Home
            Screen&quot; — for one-tap access to today&apos;s deals.
          </p>
        ) : (
          <p className="text-xs text-cream/60 mt-1">
            Get one-tap access to today&apos;s deals, no browser bar needed.
          </p>
        )}
        {!showIOSBanner && (
          <button
            onClick={install}
            className="mt-2 rounded-md bg-gold hover:bg-gold-bright text-ink font-semibold px-3 py-1.5 text-xs"
          >
            Install
          </button>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-cream/40 hover:text-cream/80 text-lg leading-none shrink-0"
      >
        &times;
      </button>
    </div>
  );
}
