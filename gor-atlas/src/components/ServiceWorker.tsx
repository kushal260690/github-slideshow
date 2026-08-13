"use client";

import { useEffect } from "react";
import { usePrefs } from "@/components/Preferences";

/**
 * Registers the service worker.
 *
 * Registration is skipped in development, where a caching layer between the
 * editor and the browser is only ever a source of confusion.
 */
export function ServiceWorker() {
  const { lowData } = usePrefs();

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration is an enhancement; the site works without it */
      });
    };
    // Registering after load keeps the worker off the critical path on a slow
    // first visit, which is the visit that matters most here.
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  // Low-data mode is a hint to the worker as well as to the UI: it is the mode
  // in which serving a cached tile instead of a fresh one matters most.
  useEffect(() => {
    navigator.serviceWorker?.controller?.postMessage({ type: "low-data", value: lowData });
  }, [lowData]);

  return null;
}

/** Ask the worker to store a page and its API payload for offline reading. */
export function cacheForOffline(path: string, apiPath?: string) {
  navigator.serviceWorker?.controller?.postMessage({ type: "cache-profile", path, apiPath });
}
