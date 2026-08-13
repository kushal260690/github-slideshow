"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { SearchBox } from "@/components/SearchBox";
import { Stamp } from "@/components/ui";

/**
 * The homepage hero text, in the interface language.
 *
 * Split out as a client component so the language switcher visibly changes the
 * most-read text on the site. Archived *content* is a separate matter and is
 * never machine-translated — see docs/08.
 */
export function HeroCopy() {
  const { dict, definition } = useLocale();

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28">
      <div className="mb-5 flex items-center justify-center gap-4 text-gor-turmeric">
        <Stamp size={78} />
      </div>
      <p className="font-poster-sm mb-4 text-xs text-gor-turmeric">{dict.brand.tagline}</p>
      <h1 className="font-poster text-6xl text-ink-strong sm:text-8xl">
        {dict.home.headline}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base text-muted sm:text-lg">
        {dict.home.supporting}
      </p>

      <div className="mx-auto mt-8 max-w-xl">
        <SearchBox size="lg" placeholder={dict.home.searchPlaceholder} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/map"
          className="rounded-sm bg-terracotta px-6 py-3 text-sm font-semibold text-terracotta-ink transition-opacity hover:opacity-90"
        >
          {dict.home.ctaPrimary}
        </Link>
        <Link
          href="/contribute"
          className="rounded-sm border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-peacock hover:text-peacock"
        >
          {dict.home.ctaSecondary}
        </Link>
      </div>

      {definition.review === "needs_community_review" ? (
        <p className="mx-auto mt-6 max-w-xl text-[11px] text-muted">
          The {definition.englishLabel} interface was drafted for this prototype and has not yet
          been reviewed by a {definition.englishLabel}-speaking community editor. Untranslated
          strings fall back to English.
        </p>
      ) : null}

      <p className="mx-auto mt-8 max-w-2xl rounded-lg border border-line bg-surface-1/80 p-3 text-xs text-muted backdrop-blur">
        <strong className="text-ink">Prototype.</strong> This build contains five clearly labelled
        demonstration records and no verified settlement data. The glowing points above are
        decoration placed at state centroids — they are not settlements, because drawing thousands
        of invented dots would be the exact fabrication this archive exists to refuse.
      </p>
    </div>
  );
}
