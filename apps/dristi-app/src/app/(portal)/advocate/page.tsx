"use client";

import { AdvocateHome } from "@/components/advocate/advocate-home";
import { useLocale } from "@/components/shell/locale";
import { useProfile } from "@/components/shell/profile";

/** The advocate home — greets the signed-in account (not a fixed fixture name). */
export default function Page() {
  const { locale } = useLocale();
  const { accountName } = useProfile();
  const firstName = accountName.replace(/^Adv\.\s*/, "").split(" ")[0];
  return <AdvocateHome locale={locale} profileFirstName={firstName} />;
}
