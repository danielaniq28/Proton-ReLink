"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone iOS (installed to Home Screen as PWA)
    const ua = navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    const isStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;

    if (isIOS && isStandalone) {
      document.documentElement.classList.add("standalone-ios");
    } else {
      document.documentElement.classList.remove("standalone-ios");
    }

    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // Service worker registration can fail in some strict iframe/preview setups
        console.warn("[PWA] Service worker registration notice:", err);
      });
  }, []);
  return null;
}
