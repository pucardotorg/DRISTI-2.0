import { AdvocateHome } from "@/components/advocate/advocate-home";
import { ADVOCATE_PROFILE_NAME } from "@/lib/advocate/content";

/** The advocate home — placeholder body on the shared shell. */
const firstName = ADVOCATE_PROFILE_NAME.replace(/^Adv\.\s*/, "").split(" ")[0];

export default function Page() {
  return <AdvocateHome locale="en" profileFirstName={firstName} />;
}
