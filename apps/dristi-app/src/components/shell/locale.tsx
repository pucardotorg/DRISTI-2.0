"use client";

import * as React from "react";

import type { Locale } from "@/lib/onboarding/content";

/**
 * App-wide language. The old Portal shell carried locale as a prop pair; on the one
 * shared shell it is context, so the top-bar toggle and every screen read the same
 * source. Citizen-facing screens (home, join, bond) render bilingual copy; professional
 * screens simply ignore it.
 */
type LocaleValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = React.createContext<LocaleValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = React.useState<Locale>(initialLocale);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = React.useMemo<LocaleValue>(() => ({ locale, setLocale }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleValue {
  const value = React.useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside <LocaleProvider>");
  return value;
}
