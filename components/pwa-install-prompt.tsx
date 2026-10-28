"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Share,
  PlusSquare,
  X,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "pl_pwa_dismissed_time";
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours snooze if dismissed

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("android");
  const [showPrompt, setShowPrompt] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect if already installed as standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.startsWith("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Detect platform
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);

    if (isIOSDevice) {
      setPlatform("ios");
    } else if (isAndroidDevice) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // 3. Check dismissal history
    try {
      const dismissedAt = window.localStorage.getItem(DISMISS_KEY);
      if (dismissedAt) {
        const timeElapsed = Date.now() - parseInt(dismissedAt, 10);
        if (timeElapsed < DISMISS_DURATION_MS) {
          // Temporarily suppressed
          setShowPrompt(false);
        } else {
          setShowPrompt(true);
        }
      } else {
        // First time on dashboard: reveal after a brief 1.5s delay for smooth entrance
        const timer = setTimeout(() => setShowPrompt(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      setShowPrompt(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setShowPrompt(false), 3500);
    };

    const handleOpenPrompt = () => {
      setShowPrompt(true);
      setExpandedGuide(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pl_open_pwa_prompt", handleOpenPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pl_open_pwa_prompt", handleOpenPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setInstallSuccess(true);
          setDeferredPrompt(null);
          setTimeout(() => setShowPrompt(false), 3000);
        }
      } catch (err) {
        console.warn("[PWA] Install prompt error:", err);
      }
    } else {
      // If no native prompt available, toggle the step-by-step guidance
      setExpandedGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {}
  };

  // If already installed as a PWA, hide completely
  if (isInstalled && !installSuccess) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt ? (
        <motion.div
          key="pwa-install-popup"
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-6 xl:inset-x-auto xl:right-8 xl:bottom-8 z-[60] max-w-lg xl:w-[410px] pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#121216]/95 p-4 text-white shadow-2xl shadow-black/80 backdrop-blur-2xl">
            {/* Subtle top ambient glow */}
            <div className="pointer-events-none absolute -top-12 inset-x-0 h-24 bg-gradient-to-b from-white/10 to-transparent blur-xl" />

            {/* Header / Main Row */}
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] p-1.5 shadow-md shadow-black/30">
                  <img
                    src="/icon-192.png"
                    alt="Proton Re-Link Icon"
                    className="h-full w-full object-contain rounded-lg"
                  />
                  <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black shadow-sm">
                    {platform === "ios" ? (
                      <Share className="h-2.5 w-2.5" />
                    ) : (
                      <Download className="h-2.5 w-2.5" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white tracking-tight truncate">
                      Install Proton Re-Link
                    </span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-zinc-300 uppercase tracking-wider">
                      {platform === "ios" ? "iOS Web App" : platform === "android" ? "Android App" : "PWA"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                    {platform === "ios"
                      ? "Add to Home Screen for fullscreen control"
                      : "Instant access & fullscreen vehicle cockpit"}
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss install prompt"
                className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Success state if just installed */}
            {installSuccess ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Installed! You can now open Re-Link directly from your home screen.</span>
              </div>
            ) : (
              <>
                {/* Action buttons */}
                <div className="mt-3.5 flex items-center gap-2">
                  {platform === "ios" ? (
                    <button
                      type="button"
                      onClick={() => setExpandedGuide((curr) => !curr)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-black" />
                      <span>{expandedGuide ? "Hide How-To" : "How to Install (iOS)"}</span>
                      {expandedGuide ? (
                        <ChevronUp className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      )}
                    </button>
                  ) : deferredPrompt ? (
                    <button
                      type="button"
                      onClick={handleInstallClick}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5 text-black" />
                      <span>Install App Now</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpandedGuide((curr) => !curr)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      <Smartphone className="h-3.5 w-3.5 text-black" />
                      <span>{expandedGuide ? "Hide Steps" : "How to Add to Home Screen"}</span>
                      {expandedGuide ? (
                        <ChevronUp className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 ml-0.5 opacity-60" />
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-white transition cursor-pointer"
                  >
                    Later
                  </button>
                </div>

                {/* iOS Step-by-Step Guide Accordion */}
                <AnimatePresence>
                  {expandedGuide && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3.5 border-t border-white/10 pt-3 text-xs">
                        {platform === "ios" ? (
                          <div className="space-y-2.5">
                            <p className="font-semibold text-zinc-200">
                              3 simple steps to install on iPhone & iPad:
                            </p>
                            <div className="space-y-2 text-zinc-300">
                              <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-2 border border-white/5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                                  1
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium text-white">Tap the Share icon</span>
                                  <span className="text-zinc-400 block text-[11px] mt-0.5">
                                    In Safari toolbar at the bottom of the screen (
                                    <Share className="inline h-3 w-3 text-cyan-400 mx-0.5" />).
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-2 border border-white/5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                                  2
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium text-white">Scroll down & choose</span>
                                  <span className="text-zinc-400 block text-[11px] mt-0.5">
                                    Tap <strong className="text-white">“Add to Home Screen”</strong> (
                                    <PlusSquare className="inline h-3 w-3 text-zinc-200 mx-0.5" />).
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-2 border border-white/5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
                                  3
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium text-white">Confirm</span>
                                  <span className="text-zinc-400 block text-[11px] mt-0.5">
                                    Tap <strong className="text-white">“Add”</strong> in the top-right
                                    corner. Re-Link will appear on your Home Screen!
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 text-zinc-300">
                            <p className="font-semibold text-zinc-200">
                              How to install on Android / Chrome:
                            </p>
                            <div className="rounded-xl bg-white/[0.04] p-2 border border-white/5 space-y-1.5 text-[11px]">
                              <p>
                                1. Tap the browser menu (<strong className="text-white">⋮</strong>) in the
                                upper or lower corner.
                              </p>
                              <p>
                                2. Select <strong className="text-white">“Install app”</strong> or{" "}
                                <strong className="text-white">“Add to Home screen”</strong>.
                              </p>
                              <p>3. Confirm the prompt to enjoy fullscreen app performance.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
