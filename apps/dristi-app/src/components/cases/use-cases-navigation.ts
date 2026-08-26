"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { buildCasesHref, type CasesQuery } from "@/lib/cases/query";

/**
 * Search and court changes write the URL. Crossing from the landing
 * onto a folder page (or back) is a real navigation so Back returns to the
 * landing. Court is a landing Select — a folder URL keeps it.
 */
export function useCasesNavigation(query: CasesQuery) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = React.useState(query.search);
  const pushed = React.useRef(query.search);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (query.search !== pushed.current) {
      pushed.current = query.search;
      setSearch(query.search);
    }
  }, [query.search]);

  const effective = React.useMemo<CasesQuery>(
    () => ({ ...query, search }),
    [query, search]
  );

  const goTo = React.useCallback(
    (href: string) => {
      const nextPath = href.split("?")[0];
      if (nextPath !== pathname) {
        router.push(href, { scroll: false });
        return;
      }
      router.replace(href, { scroll: false });
    },
    [pathname, router]
  );

  const go = React.useCallback(
    (patch: Partial<CasesQuery>) => {
      goTo(buildCasesHref(effective, patch));
    },
    [effective, goTo]
  );

  function onSearchChange(value: string) {
    setSearch(value);
    pushed.current = value;
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      goTo(buildCasesHref({ ...query, search: value }));
    }, 250);
  }

  return { search, effective, go, onSearchChange };
}
