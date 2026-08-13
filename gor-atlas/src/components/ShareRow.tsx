"use client";

import { useEffect, useState } from "react";

/**
 * Share and offline controls.
 *
 * Two deliberate choices:
 *  - WhatsApp is a first-class share target, not an afterthought. It is how
 *    this material will actually circulate among the people it concerns.
 *  - A demo record's share text carries the demo warning in the message body,
 *    so the label survives being forwarded away from this page. A warning that
 *    only exists on screen is a warning that gets screenshotted off.
 */
export function ShareRow({
  title,
  path,
  isDemo = false,
  storageKey,
}: {
  title: string;
  path: string;
  isDemo?: boolean;
  storageKey?: string;
}) {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}${path}`);
    if (storageKey) {
      try {
        setSaved(localStorage.getItem(`gor-atlas-saved:${storageKey}`) !== null);
      } catch {
        /* ignore */
      }
    }
  }, [path, storageKey]);

  const message = isDemo
    ? `${title} — DEMONSTRATION RECORD, not historically verified. Gor Atlas: ${url}`
    : `${title} — Gor Atlas: ${url}`;

  const btn =
    "rounded-sm border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-peacock hover:text-peacock";

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  function toggleSave() {
    if (!storageKey) return;
    const key = `gor-atlas-saved:${storageKey}`;
    try {
      if (saved) {
        localStorage.removeItem(key);
        setSaved(false);
      } else {
        localStorage.setItem(key, new Date().toISOString());
        setSaved(true);
      }
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button type="button" onClick={share} className={btn}>
        {copied ? "Link copied" : "Share"}
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noreferrer noopener"
        className={btn}
      >
        WhatsApp
      </a>
      {storageKey ? (
        <button type="button" onClick={toggleSave} className={btn} aria-pressed={saved}>
          {saved ? "Saved for offline ✓" : "Save for offline"}
        </button>
      ) : null}
      <a href="#sources" className={btn}>
        Jump to sources
      </a>
    </div>
  );
}
