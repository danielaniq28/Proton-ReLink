"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        // Service worker registration can fail in some strict iframe/preview setups
        console.warn("[PWA] Service worker registration notice:", err);
      });
  }, []);
  return null;
}
