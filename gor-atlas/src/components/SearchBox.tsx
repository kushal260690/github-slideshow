"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { search, type SearchResult } from "@/lib/repository";

const KIND_LABEL: Record<string, string> = {
  tanda: "Tanda",
  clan: "Clan",
  surname: "Surname",
  article: "Article",
  route: "Route",
  place: "Place",
};

/**
 * Universal search.
 *
 * Fuzzy by default and deliberately so: the same settlement is written six
 * ways across five scripts, and an exact-match box would be an accessibility
 * barrier disguised as a search feature. Matches against a variant spelling
 * show which spelling matched, so the user learns the record's other names.
 */
export function SearchBox({
  size = "md",
  placeholder = "Search a Tanda, clan, surname, district or state",
  autoFocus = false,
}: {
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = useMemo(
    () => (query.trim().length >= 2 ? search(query, 8) : []),
    [query],
  );

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const sizing =
    size === "lg"
      ? "h-14 text-base px-5"
      : size === "sm"
        ? "h-8 text-xs px-3"
        : "h-10 text-sm px-4";

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && results[active]) router.push(results[active].href);
      else if (query.trim()) router.push(`/search?q=${encodeURIComponent(query)}`);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <label className="sr-only" htmlFor="atlas-search">
        Search the atlas
      </label>
      <input
        id="atlas-search"
        type="search"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="atlas-search-results"
        aria-autocomplete="list"
        className={`w-full rounded-sm border border-line bg-surface-1 text-ink placeholder:text-muted focus:border-peacock ${sizing}`}
      />

      {open && query.trim().length >= 2 ? (
        <div
          id="atlas-search-results"
          role="listbox"
          className="absolute z-50 mt-1 max-h-96 w-full overflow-y-auto rounded-lg border border-line-strong bg-surface-1 shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="p-4 text-sm text-muted">
              Nothing matched. That may mean it is not documented yet —{" "}
              <Link href="/contribute" className="text-peacock underline">
                you can add it
              </Link>
              .
            </p>
          ) : (
            <ul>
              {results.map((r, i) => (
                <li key={`${r.kind}-${r.href}`}>
                  <Link
                    href={r.href}
                    role="option"
                    aria-selected={i === active}
                    onClick={() => setOpen(false)}
                    className={`flex items-baseline gap-3 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-surface-2 ${
                      i === active ? "bg-surface-2" : ""
                    }`}
                  >
                    <span className="w-16 shrink-0 text-[10px] uppercase tracking-wider text-terracotta">
                      {KIND_LABEL[r.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {r.title}
                        {r.isDemo ? (
                          <span className="ml-1.5 text-[10px] font-bold text-v-disputed">DEMO</span>
                        ) : null}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {r.subtitle}
                        {r.matchedOn ? ` · matched "${r.matchedOn}"` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-xs text-peacock hover:bg-surface-2"
                >
                  See all results for “{query}” →
                </Link>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
