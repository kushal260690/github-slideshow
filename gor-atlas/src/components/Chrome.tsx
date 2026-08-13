"use client";

import Link from "next/link";
import { LOCALES, PLANNED_LOCALES, untranslatedKeyCount } from "@/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { PreferenceToggles } from "@/components/Preferences";
import { SearchBox } from "@/components/SearchBox";
import { TextileRule } from "@/components/ui";

const NAV = [
  { href: "/map", key: "map" as const },
  { href: "/states", key: "tandas" as const },
  { href: "/clans", key: "clans" as const },
  { href: "/migration", key: "history" as const },
  { href: "/encyclopedia", key: "encyclopedia" as const },
];

export function SiteHeader() {
  const { dict } = useLocale();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface-0/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-poster text-xl text-ink-strong">{dict.brand.name}</span>
          <span className="font-poster-sm hidden text-[10px] text-gor-turmeric xl:inline">
            Art · Culture · Memory · Maps
          </span>
        </Link>

        <nav aria-label="Primary" className="order-3 w-full sm:order-none sm:w-auto">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-muted transition-colors hover:text-peacock">
                  {dict.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto hidden w-44 shrink-0 xl:block">
          <SearchBox size="sm" placeholder={dict.nav.search} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          <LanguageSwitcher />
          <Link
            href="/contribute"
            className="rounded-sm bg-terracotta px-3 py-1.5 text-xs font-semibold text-terracotta-ink transition-opacity hover:opacity-90"
          >
            {dict.nav.contribute}
          </Link>
        </div>
      </div>
      <TextileRule variant="band" />
    </header>
  );
}

function LanguageSwitcher() {
  const { locale, definition, setLocale } = useLocale();

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-sm border border-line px-2 py-1 text-[11px] text-muted hover:border-peacock hover:text-peacock">
        {definition.label}
      </summary>
      <div className="absolute right-0 z-50 mt-1 w-72 rounded-lg border border-line-strong bg-surface-1 p-3 shadow-2xl">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-terracotta">
          Interface language
        </p>
        <ul className="space-y-1">
          {LOCALES.map((l) => {
            const missing = untranslatedKeyCount(l.code);
            const active = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  lang={l.code}
                  aria-current={active}
                  onClick={(e) => {
                    setLocale(l.code);
                    (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute(
                      "open",
                    );
                  }}
                  className={`flex w-full items-baseline justify-between gap-2 rounded-sm px-2 py-1 text-left text-sm hover:bg-surface-2 ${
                    active ? "text-peacock" : "text-ink"
                  }`}
                >
                  <span>
                    {l.label} <span className="text-[11px] text-muted">{l.englishLabel}</span>
                  </span>
                  {l.review === "needs_community_review" ? (
                    <span
                      className="shrink-0 text-[10px] text-muted"
                      title={`Drafted for the prototype and awaiting review by a community editor.${
                        missing > 0 ? ` ${missing} strings still fall back to English.` : ""
                      }`}
                    >
                      needs review
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 border-t border-line pt-2 text-[11px] text-muted">
          Interface strings only — archived content is not machine-translated. Planned:{" "}
          {PLANNED_LOCALES.map((l) => l.englishLabel).join(", ")}. Gor Boli is listed by script
          because orthography varies by region and none is treated as canonical.
        </p>
      </div>
    </details>
  );
}

export function SiteFooter() {
  const { dict } = useLocale();

  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/map", label: dict.nav.map },
        { href: "/directory", label: dict.footer.directory },
        { href: "/states", label: "State directory" },
        { href: "/clans", label: "Clan explorer" },
        { href: "/surnames", label: "Surname explorer" },
        { href: "/migration", label: "Migration map" },
        { href: "/timeline", label: "Historical timeline" },
      ],
    },
    {
      title: "Archive",
      links: [
        { href: "/encyclopedia", label: dict.nav.encyclopedia },
        { href: "/archive", label: "Media archive" },
        { href: "/oral-histories", label: "Oral histories" },
        { href: "/sources", label: dict.footer.sources },
      ],
    },
    {
      title: "Contribute",
      links: [
        { href: "/contribute", label: dict.contribute.title },
        { href: "/contribute/status", label: "Track a submission" },
        { href: "/admin", label: "Moderation dashboard" },
      ],
    },
    {
      title: "About",
      links: [
        { href: "/methodology", label: dict.footer.methodology },
        { href: "/about", label: dict.footer.about },
        { href: "/editorial-board", label: dict.footer.editorial },
        { href: "/privacy", label: dict.footer.privacy },
        { href: "/changelog", label: dict.footer.changelog },
      ],
    },
  ];

  return (
    <footer className="mt-16 border-t border-line bg-surface-1">
      <TextileRule variant="band" />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <p className="font-display text-lg text-ink-strong">{dict.brand.name}</p>
            <p className="mt-1 text-sm text-muted">{dict.brand.subtitle}</p>
            <p className="mt-3 text-sm italic text-terracotta">{dict.brand.tagline}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-terracotta">
                {col.title}
              </h3>
              <ul className="space-y-1.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-muted hover:text-peacock">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <p className="max-w-2xl text-xs text-muted">{dict.footer.independence}</p>
          <PreferenceToggles />
        </div>

        <p className="mt-4 text-xs text-muted">
          Prototype build. Contains five clearly labelled demonstration records and no verified
          settlement data. Base map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            className="text-peacock underline"
            rel="noreferrer noopener"
            target="_blank"
          >
            OpenStreetMap contributors
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
