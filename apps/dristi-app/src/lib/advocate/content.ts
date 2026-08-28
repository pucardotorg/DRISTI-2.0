import type { Locale } from "@/lib/onboarding/content";
import { DEMO_JOIN_CASE, type CaseParty, type JoinCase } from "@/lib/join/content";

export { fill as fillCopy } from "@/lib/join/content";

/**
 * Advocate portal — content model.
 *
 * The advocate join flow (Aug 14 brief) mirrors the litigant one but answers a
 * different question: not "which party am I" but "which party do I act for". Role
 * is known from sign-in, so the legacy "are you an advocate or a litigant?" question
 * is gone. The flow is: find case → check details → prove possession of the summons
 * code → declare side, litigants and any replacement → confirm litigant details →
 * attach the vakalatnama → outcome.
 *
 * Outcomes follow the access rules: an accused's advocate (not replacing anyone)
 * joins immediately; a complainant's advocate, or any replacement, raises a request
 * that an approver must clear first.
 */

type Copy = Record<Locale, string>;
const t = (en: string, ml: string): Copy => ({ en, ml });

/* ------------------------------------------------------------------- demo data */

export const ADVOCATE_PROFILE_NAME = "Adv. Anjali Nair";

/** Same demo case as the litigant flow — the advocate joins the other side of it. */
export const ADVOCATE_JOIN_CASE: JoinCase = DEMO_JOIN_CASE;

/** The complainant side as joinable parties (JoinCase only carries a display string). */
export const COMPLAINANT_PARTIES: CaseParty[] = [
  { id: "comp-1", name: "South Indian Bank Ltd." },
];

/** Advocates already on record per side — drives the replacement questions. */
export const SIDE_ADVOCATES: Record<"complainant" | "accused", string[]> = {
  complainant: ["Adv. Meera Pillai"],
  accused: [],
};

export type LitigantPrefill = {
  first: string;
  middle: string;
  last: string;
  father: string;
};

/** Stand-in for the litigant-details endpoint, keyed by party id. */
export const LITIGANT_PREFILL: Record<string, LitigantPrefill> = {
  "comp-1": { first: "South Indian Bank Ltd.", middle: "", last: "", father: "" },
  "acc-1": { first: "Rajan", middle: "Krishnan", last: "Nair", father: "Krishnan Nair" },
  "acc-2": { first: "Suresh", middle: "", last: "Babu P", father: "Babu Pillai" },
};

export const LITIGANT_MOBILE = "+91 60000 00000";

export type Vakalatnama = {
  id: string;
  /** The advocate's own label for the generated vakalatnama. */
  name: string;
  /** The litigants the vakalatnama covers, as it was generated. */
  parties: string;
  caseRef: string;
  generatedOn: string;
  advocates: string[];
};

/** Stand-in for the advocate's generated-vakalatnama library. Generation itself lives
 *  elsewhere in the portal — the join flow only selects from here or uploads a file.
 *  `caseRef`/`generatedOn` are kept for the document preview but no longer surface in
 *  the picker list, where a vakalatnama is identified by its name and litigants. */
export const VAKALATNAMAS: Vakalatnama[] = [
  {
    id: "vk-1",
    name: "South Indian Bank cheque matter",
    parties: "Rajan Krishnan Nair and Suresh Babu P",
    caseRef: "CC 847 / 2026",
    generatedOn: "12-08-2026",
    advocates: ["Adv. Anjali Nair", "Adv. Anil George"],
  },
  {
    id: "vk-2",
    name: "Anitha Joseph — cheque bounce",
    parties: "Anitha Joseph",
    caseRef: "ST 112 / 2026",
    generatedOn: "08-08-2026",
    advocates: ["Adv. Anjali Nair"],
  },
  {
    id: "vk-3",
    name: "Fathima Beevi — cheque bounce",
    parties: "Fathima Beevi",
    caseRef: "CMP 210 / 2026",
    generatedOn: "01-08-2026",
    advocates: ["Adv. Anjali Nair"],
  },
  {
    id: "vk-4",
    name: "Vismaya Traders recovery",
    parties: "Vismaya Traders",
    caseRef: "CC 412 / 2025",
    generatedOn: "28-07-2026",
    advocates: ["Adv. Anjali Nair", "Adv. Joseph Mathew"],
  },
  {
    id: "vk-5",
    name: "Latheef M — cheque bounce",
    parties: "Latheef M.",
    caseRef: "ST 198 / 2026",
    generatedOn: "24-07-2026",
    advocates: ["Adv. Anjali Nair"],
  },
  {
    id: "vk-6",
    name: "Naveen Chandra — cheque bounce",
    parties: "Naveen Chandra",
    caseRef: "CMP 176 / 2026",
    generatedOn: "19-07-2026",
    advocates: ["Adv. Anjali Nair"],
  },
  {
    id: "vk-7",
    name: "Rahman brothers matter",
    parties: "Amina Rahman and Sameer Rahman",
    caseRef: "CC 365 / 2026",
    generatedOn: "14-07-2026",
    advocates: ["Adv. Anjali Nair", "Adv. Anil George"],
  },
];

export type BarAdvocate = { barId: string; name: string };

/** Stand-in for the Bar roll lookup — used when a new vakalatnama names co-advocates.
 *  The advocate searches by Bar registration ID (or name) and adds them. */
export const BAR_DIRECTORY: BarAdvocate[] = [
  { barId: "K/1123/2011", name: "Adv. Anil George" },
  { barId: "K/2048/2015", name: "Adv. Joseph Mathew" },
  { barId: "K/0876/2009", name: "Adv. Meera Pillai" },
  { barId: "K/3321/2018", name: "Adv. Reena Thomas" },
  { barId: "K/1590/2013", name: "Adv. Sunil Kumar" },
  { barId: "K/2765/2016", name: "Adv. Fathima Latheef" },
  { barId: "K/0442/2007", name: "Adv. Rajesh Menon" },
  { barId: "K/3104/2019", name: "Adv. Divya Nair" },
];

/* ------------------------------------------------------------------- app shell */

export const advShell = {
  navHome: t("Home", "ഹോം"),
  navCases: t("Your cases", "നിങ്ങളുടെ കേസുകൾ"),
  navFilings: t("Make filings", "ഫയലിംഗുകൾ ചെയ്യുക"),
  navJoin: t("Join a case", "കേസിൽ ചേരുക"),
  navTasks: t("Pending tasks", "ബാക്കിയുള്ള ജോലികൾ"),
  navCalendar: t("Calendar", "കലണ്ടർ"),
  navTeam: t("Team case access", "ടീം കേസ് ആക്‌സസ്"),
  role: t("Advocate", "അഭിഭാഷക"),
} as const;

/* ----------------------------------------------------------------------- home */

/**
 * The advocate hearings dashboard. Chrome copy only — everything derived from data
 * (parties, stages, due phrases) comes through `lib/tasks/format` and stays English,
 * exactly as it does on /tasks: bilingual rendering is the citizen screens' rule.
 */
export const advHome = {
  greetingMorning: t("Good morning, {name}", "സുപ്രഭാതം, {name}"),
  greetingAfternoon: t("Good afternoon, {name}", "നമസ്കാരം, {name}"),
  greetingEvening: t("Good evening, {name}", "ശുഭ സന്ധ്യ, {name}"),
  mattersOne: t("1 matter listed", "1 വിഷയം പട്ടികയിൽ"),
  mattersMany: t("{n} matters listed", "{n} വിഷയങ്ങൾ പട്ടികയിൽ"),
  mattersNone: t("Nothing listed", "ഒന്നും പട്ടികയിലില്ല"),
  today: t("Today", "ഇന്ന്"),

  /* Board */
  inSession: t("in session", "സെഷനിൽ"),
  nowLabel: t("Now — item {n}", "ഇപ്പോൾ — ഇനം {n}"),
  upNext: t("Up next", "അടുത്തത്"),
  inListOrder: t("In list order", "പട്ടിക ക്രമത്തിൽ"),
  concludedStrip: t(
    "{n} concluded earlier — items {items}",
    "നേരത്തെ തീർന്നത് {n} — ഇനം {items}",
  ),
  ready: t("Ready", "തയ്യാർ"),
  viewCases: t("View cases", "കേസുകൾ കാണുക"),
  layoutCards: t("Cards", "കാർഡുകൾ"),
  layoutList: t("List", "പട്ടിക"),
  layoutLabel: t("Cause list layout", "കോസ് ലിസ്റ്റ് രൂപം"),
  joinCourtroom: t("Join this courtroom", "ഈ കോടതിമുറിയിൽ ചേരുക"),
  emptyDayTitle: t("Nothing listed this day", "ഈ ദിവസം ഒന്നും പട്ടികയിലില്ല"),
  emptyDayBody: t(
    "No matters are listed in this court on the selected day.",
    "തിരഞ്ഞെടുത്ത ദിവസം ഈ കോടതിയിൽ വിഷയങ്ങളൊന്നും പട്ടികയിലില്ല.",
  ),
  emptyFilterTitle: t("No matters match this filter", "ഈ ഫിൽട്ടറിന് വിഷയങ്ങളൊന്നുമില്ല"),
  emptyFilterBody: t(
    "No listed items for the advocates you selected. Clear a chip to see the full cause list.",
    "തിരഞ്ഞെടുത്ത അഭിഭാഷകർക്ക് ഇനങ്ങളൊന്നുമില്ല. മുഴുവൻ പട്ടിക കാണാൻ ഒരു ചിപ്പ് മാറ്റുക.",
  ),
  jumpNext: t("Next hearing day: {day} — {n} listed", "അടുത്ത ഹിയറിംഗ് ദിവസം: {day} — {n} ഇനം"),

  /* Week strip */
  prevWeek: t("Previous week", "കഴിഞ്ഞ ആഴ്ച"),
  nextWeek: t("Next week", "അടുത്ത ആഴ്ച"),
  pickDate: t("Pick a date", "തീയതി തിരഞ്ഞെടുക്കുക"),

  /* Access */
  filterAll: t("All matters", "എല്ലാ വിഷയങ്ങളും"),
  filterMine: t("My vakalatnama", "എന്റെ വക്കാലത്ത്"),
  filterLabel: t("Which matters", "ഏതെല്ലാം വിഷയങ്ങൾ"),
  viewOnly: t("View only", "കാണാൻ മാത്രം"),
  emptyMineTitle: t("No matters on your vakalatnama", "നിങ്ങളുടെ വക്കാലത്തിൽ വിഷയങ്ങളില്ല"),
  emptyMineBody: t(
    "Nothing listed this day where you hold the vakalatnama. Switch to all matters to see the full cause list.",
    "ഈ ദിവസം നിങ്ങളുടെ വക്കാലത്തിലുള്ള വിഷയങ്ങളില്ല. മുഴുവൻ പട്ടികയ്ക്ക് എല്ലാ വിഷയങ്ങളിലേക്കും മാറുക.",
  ),

  /* Pending-tasks rail */
  railTitle: t("Pending tasks", "ബാക്കിയുള്ള ജോലികൾ"),
  groupOverdue: t("Overdue", "സമയം കഴിഞ്ഞു"),
  groupToday: t("Due today", "ഇന്ന് അവസാനം"),
  groupTomorrow: t("Due tomorrow", "നാളെ അവസാനം"),
  groupOn: t("Due {day}", "{day} അവസാനം"),
  railResize: t("Resize the pending tasks rail", "പാനലിന്റെ വീതി ക്രമീകരിക്കുക"),
  railOpen: t("Open pending tasks, {n} need action", "ബാക്കിയുള്ള ജോലികൾ തുറക്കുക, {n} എണ്ണം"),
  railCollapse: t("Collapse pending tasks", "ജോലികളുടെ പാനൽ ചുരുക്കുക"),
  railViewAll: t("View all {n} tasks", "എല്ലാ {n} ജോലികളും കാണുക"),
  railEmptyTitle: t("Nothing needs you", "ഒന്നും ബാക്കിയില്ല"),
  railEmptyBody: t(
    "Every task is done or waiting on the court.",
    "എല്ലാം തീർന്നു, അല്ലെങ്കിൽ കോടതിയുടെ ഊഴം.",
  ),
  open: t("Open", "തുറക്കുക"),
  blocksHearing: t("blocks the hearing", "ഹിയറിംഗ് തടയുന്നു"),

  /* Case peek */
  peekLabel: t("Case peek", "കേസ് ഒറ്റനോട്ടം"),
  peekClose: t("Close", "അടയ്ക്കുക"),
  peekStage: t("Stage", "ഘട്ടം"),
  peekHearing: t("This hearing", "ഈ ഹിയറിംഗ്"),
  peekAdvocates: t("On the vakalatnama", "വക്കാലത്തിൽ"),
  peekTeam: t("Also on the case", "കേസിൽ ഒപ്പം"),
  peekTasks: t("Pending on this case", "ഈ കേസിൽ ബാക്കി"),
  peekNoTasks: t("Nothing pending", "ഒന്നും ബാക്കിയില്ല"),
  peekNoTasksBody: t(
    "This matter is ready for the hearing.",
    "ഈ വിഷയം ഹിയറിംഗിന് തയ്യാറാണ്.",
  ),
} as const;

/* -------------------------------------------------------------- join stub page */

export const advJoinPage = {
  title: t("Join a case", "കേസിൽ ചേരുക"),
  body: t(
    "Find a case by its number and request access to act in it. Keep the six-digit code from the summons — or from a party already on the case — ready.",
    "കേസ് നമ്പർ ഉപയോഗിച്ച് കേസ് കണ്ടെത്തി അതിൽ പ്രവർത്തിക്കാൻ ആക്‌സസ് അഭ്യർത്ഥിക്കുക. സമൻസിലെ — അല്ലെങ്കിൽ കേസിൽ ഇതിനകം ചേർന്ന കക്ഷിയുടെ പക്കലുള്ള — ആറക്ക കോഡ് കൈയിൽ കരുതുക.",
  ),
  cta: t("Join a case", "കേസിൽ ചേരുക"),
  recentHeading: t("Recent join requests", "സമീപകാല അപേക്ഷകൾ"),
  statusJoined: t("Joined", "ചേർന്നു"),
  statusPending: t("Approval pending", "അനുമതി ബാക്കി"),
} as const;

/* ----------------------------------------------------------------- join dialog */

export const advDialog = {
  title: t("Join a case", "കേസിൽ ചേരുക"),

  /* summons auto-modal (unique URL, advocate account) */
  summonsHeading: t(
    "Review this cheque bounce case",
    "ഈ ചെക്ക് മടക്ക കേസ് പരിശോധിക്കുക",
  ),
  summonsBody: t(
    "This summons was sent to a party in this case. Check the details, then join to act for them online.",
    "ഈ കേസിലെ ഒരു കക്ഷിക്കാണ് ഈ സമൻസ് അയച്ചത്. വിവരങ്ങൾ പരിശോധിച്ച്, അവർക്ക് വേണ്ടി ഓൺലൈനായി പ്രവർത്തിക്കാൻ കേസിൽ ചേരുക.",
  ),

  /* lookup */
  lookupBody: t(
    "Enter the case number or filing number.",
    "കേസ് നമ്പർ അല്ലെങ്കിൽ ഫയലിംഗ് നമ്പർ നൽകുക.",
  ),
  findAndJoin: t("Find case and join", "കേസ് കണ്ടെത്തി ചേരുക"),

  /* details */
  detailsBody: t(
    "Check that this is the case you are joining before you continue.",
    "തുടരുന്നതിന് മുൻപ് നിങ്ങൾ ചേരുന്ന കേസ് ഇതാണെന്ന് ഉറപ്പാക്കുക.",
  ),

  /* profile used for this case */
  accountTitle: t("How are you joining this case?", "ഈ കേസിൽ നിങ്ങൾ എങ്ങനെയാണ് ചേരുന്നത്?"),
  accountBody: t(
    "Choose the profile that matches your role in this case.",
    "ഈ കേസിലെ നിങ്ങളുടെ പങ്കിന് അനുയോജ്യമായ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക.",
  ),
  accountLabel: t("Join this case as", "ഈ കേസിൽ ചേരുന്നത്"),
  accountAdvocate: t("Advocate", "അഭിഭാഷകൻ"),
  accountLitigant: t("Litigant", "കക്ഷി"),
  accountNote: t(
    "If you choose Litigant, we'll switch to your litigant profile before you continue. You can switch profiles at any time from the profile menu.",
    "കക്ഷി തിരഞ്ഞെടുക്കുകയാണെങ്കിൽ, തുടരുന്നതിന് മുൻപ് നിങ്ങളുടെ കക്ഷി പ്രൊഫൈലിലേക്ക് മാറും. പ്രൊഫൈൽ മെനുവിൽ നിന്ന് എപ്പോൾ വേണമെങ്കിലും പ്രൊഫൈൽ മാറ്റാം.",
  ),
  accountSwitchTitle: t("Switching to your litigant profile", "നിങ്ങളുടെ കക്ഷി പ്രൊഫൈലിലേക്ക് മാറുന്നു"),
  accountSwitchBody: t(
    "We'll continue this case from your litigant home.",
    "നിങ്ങളുടെ കക്ഷി ഹോമിൽ നിന്ന് ഈ കേസ് തുടരും.",
  ),
  accountSwitchStatus: t("Switching profile…", "പ്രൊഫൈൽ മാറ്റുന്നു…"),

  /* secret code */
  codeBody: t(
    "Enter the six-digit code for this case.",
    "ഈ കേസിന്റെ ആറക്ക കോഡ് നൽകുക.",
  ),
  codeLabel: t("Access code", "ആക്‌സസ് കോഡ്"),
  codeNote: t(
    "The code is printed on the summons. Parties who have already joined the case can also share it with you.",
    "കോഡ് സമൻസിൽ അച്ചടിച്ചിട്ടുണ്ട്. കേസിൽ ഇതിനകം ചേർന്ന കക്ഷികൾക്കും ഇത് നിങ്ങളുമായി പങ്കിടാം.",
  ),
  codeError: t("Enter the six-digit access code.", "ആറക്ക ആക്‌സസ് കോഡ് നൽകുക."),
  codeVerify: t("Verify access code", "ആക്‌സസ് കോഡ് പരിശോധിക്കുക"),

  /* who you represent */
  roleBody: t(
    "Tell us who you represent in this case.",
    "ഈ കേസിൽ നിങ്ങൾ ആർക്ക് വേണ്ടിയാണ് ഹാജരാകുന്നതെന്ന് പറയുക.",
  ),
  sideLegend: t(
    "Are you representing a complainant or an accused?",
    "പരാതിക്കാരനെയാണോ പ്രതിയെയാണോ നിങ്ങൾ പ്രതിനിധീകരിക്കുന്നത്?",
  ),
  sideComplainant: t("Complainant", "പരാതിക്കാരൻ"),
  sideAccused: t("Accused", "പ്രതി"),
  sideError: t("Choose which side you represent.", "ഏത് ഭാഗത്തിന് വേണ്ടിയാണെന്ന് തിരഞ്ഞെടുക്കുക."),
  accusedAckNote: t(
    "By joining for the accused, you confirm that the summons has reached them.",
    "പ്രതിക്ക് വേണ്ടി ചേരുന്നതിലൂടെ, സമൻസ് അവർക്ക് ലഭിച്ചു എന്ന് നിങ്ങൾ സ്ഥിരീകരിക്കുന്നു.",
  ),
  whichLegend: t(
    "Which litigant(s) are you representing?",
    "ഏത് കക്ഷിക്ക് (കക്ഷികൾക്ക്) വേണ്ടിയാണ് നിങ്ങൾ ഹാജരാകുന്നത്?",
  ),
  whichPlaceholder: t("Choose litigant(s)", "കക്ഷികളെ തിരഞ്ഞെടുക്കുക"),
  whichEmpty: t("No litigants found.", "കക്ഷികളെ കണ്ടെത്തിയില്ല."),
  whichError: t("Choose at least one litigant.", "കുറഞ്ഞത് ഒരു കക്ഷിയെ തിരഞ്ഞെടുക്കുക."),
  replaceLegend: t(
    "Are you replacing an existing advocate or a party in person?",
    "നിലവിലുള്ള അഭിഭാഷകനെയോ സ്വയം ഹാജരാകുന്ന കക്ഷിയെയോ മാറ്റിയാണോ നിങ്ങൾ വരുന്നത്?",
  ),
  replaceHint: t(
    "Choose yes if you are taking over from an advocate on record, or from a litigant who has been appearing in person.",
    "രേഖയിലുള്ള അഭിഭാഷകനിൽ നിന്നോ സ്വയം ഹാജരായിരുന്ന കക്ഷിയിൽ നിന്നോ ചുമതല ഏറ്റെടുക്കുകയാണെങ്കിൽ അതെ തിരഞ്ഞെടുക്കുക.",
  ),
  yes: t("Yes", "അതെ"),
  no: t("No", "അല്ല"),
  replaceError: t("Choose yes or no.", "അതെ അല്ലെങ്കിൽ അല്ല തിരഞ്ഞെടുക്കുക."),
  replacedWhoLabel: t(
    "Which advocate are you replacing?",
    "ഏത് അഭിഭാഷകനെയാണ് നിങ്ങൾ മാറ്റുന്നത്?",
  ),
  replacedWhoPlaceholder: t("Choose an advocate", "ഒരു അഭിഭാഷകനെ തിരഞ്ഞെടുക്കുക"),
  replacedWhoError: t(
    "Choose the advocate you are replacing.",
    "നിങ്ങൾ മാറ്റുന്ന അഭിഭാഷകനെ തിരഞ്ഞെടുക്കുക.",
  ),
  approverLegend: t(
    "Who should approve the replacement?",
    "മാറ്റം ആരാണ് അംഗീകരിക്കേണ്ടത്?",
  ),
  approverJudge: t("Judge", "ജഡ്ജി"),
  approverAdvocates: t("Existing advocate(s)", "നിലവിലുള്ള അഭിഭാഷകർ"),
  approverError: t("Choose an approver.", "അംഗീകരിക്കേണ്ട ആളെ തിരഞ്ഞെടുക്കുക."),
  approverNoAdvocates: t(
    "No advocate is on record for this side, so the judge approves the change.",
    "ഈ ഭാഗത്തിന് രേഖയിൽ അഭിഭാഷകനില്ല; അതിനാൽ ജഡ്ജിയാണ് മാറ്റം അംഗീകരിക്കുന്നത്.",
  ),
  reasonLabel: t("Reason for replacement", "മാറ്റത്തിനുള്ള കാരണം"),
  reasonError: t("Give the reason for the replacement.", "മാറ്റത്തിനുള്ള കാരണം നൽകുക."),
  supportLabel: t("Supporting document", "സഹായ രേഖ"),
  supportHelp: t(
    "Optional. A no-objection or consent letter helps the approver decide. JPG, JPEG, PNG or PDF up to 10 MB.",
    "നിർബന്ധമല്ല. എതിർപ്പില്ലാ പത്രമോ സമ്മതപത്രമോ തീരുമാനത്തിന് സഹായിക്കും. 10 MB വരെ JPG, JPEG, PNG അല്ലെങ്കിൽ PDF.",
  ),

  /* enter litigant contact details (only for litigants not yet on the case) */
  verifyTitle: t("Enter litigant contact details", "കക്ഷിയുടെ ബന്ധപ്പെടാനുള്ള വിവരങ്ങൾ നൽകുക"),
  verifyBody: t(
    "We don't have a mobile number for these litigants yet. Enter it so they receive case updates and can open the case file.",
    "ഈ കക്ഷികളുടെ മൊബൈൽ നമ്പർ ഞങ്ങളുടെ പക്കൽ ഇപ്പോൾ ഇല്ല. കേസ് അപ്‌ഡേറ്റുകൾ ലഭിക്കാനും കേസ് ഫയൽ തുറക്കാനും അത് നൽകുക.",
  ),
  contactAlreadyNote: t(
    "{names} already joined this case, so we have their number.",
    "{names} ഇതിനകം ഈ കേസിൽ ചേർന്നു, അതിനാൽ അവരുടെ നമ്പർ ഞങ്ങളുടെ പക്കലുണ്ട്.",
  ),
  contactMobileError: t(
    "Enter a valid 10-digit mobile number.",
    "സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക.",
  ),

  /* vakalatnama */
  vkTitle: t("Vakalatnama", "വക്കാലത്ത്"),
  vkBody: t(
    "Attach the vakalatnama that authorises you to act for these litigants.",
    "ഈ കക്ഷികൾക്ക് വേണ്ടി പ്രവർത്തിക്കാൻ അധികാരം നൽകുന്ന വക്കാലത്ത് ചേർക്കുക.",
  ),
  vkAnotherLegend: t(
    "Has another advocate already uploaded a vakalatnama that you are a part of?",
    "നിങ്ങൾ ഉൾപ്പെടുന്ന ഒരു വക്കാലത്ത് മറ്റൊരു അഭിഭാഷകൻ ഇതിനകം അപ്‌ലോഡ് ചെയ്തിട്ടുണ്ടോ?",
  ),
  vkAnotherError: t("Choose yes or no.", "അതെ അല്ലെങ്കിൽ അല്ല തിരഞ്ഞെടുക്കുക."),
  vkFeeNote: t(
    "The vakalatnama fee will appear in your pending tasks after you join.",
    "ചേർന്നതിന് ശേഷം വക്കാലത്ത് ഫീസ് നിങ്ങളുടെ ബാക്കിയുള്ള ജോലികളിൽ വരും.",
  ),
  vkCountLabel: t(
    "How many advocates are part of this vakalatnama?",
    "ഈ വക്കാലത്തിൽ എത്ര അഭിഭാഷകർ ഉൾപ്പെടുന്നു?",
  ),
  vkCountError: t(
    "Enter how many advocates are on the vakalatnama.",
    "വക്കാലത്തിലെ അഭിഭാഷകരുടെ എണ്ണം നൽകുക.",
  ),
  vkAddLegend: t(
    "Add the advocates on this vakalatnama",
    "ഈ വക്കാലത്തിലെ അഭിഭാഷകരെ ചേർക്കുക",
  ),
  vkAddPlaceholder: t(
    "Search by Bar registration ID or name",
    "ബാർ രജിസ്‌ട്രേഷൻ ID അല്ലെങ്കിൽ പേര് ഉപയോഗിച്ച് തിരയുക",
  ),
  vkAddEmpty: t("No advocates found.", "അഭിഭാഷകരെ കണ്ടെത്തിയില്ല."),
  vkAddHint: t(
    "Add {n} advocate(s), matching the number above.",
    "മുകളിലെ എണ്ണത്തിന് അനുസൃതമായി {n} അഭിഭാഷകരെ ചേർക്കുക.",
  ),
  vkAddCap: t(
    "Only {n} advocate(s) can be added — that is the number you entered above.",
    "{n} അഭിഭാഷകരെ മാത്രമേ ചേർക്കാനാകൂ — അതാണ് നിങ്ങൾ മുകളിൽ നൽകിയ എണ്ണം.",
  ),
  vkAddError: t(
    "Add {n} advocate(s) to match the number above.",
    "മുകളിലെ എണ്ണത്തിന് അനുസൃതമായി {n} അഭിഭാഷകരെ ചേർക്കുക.",
  ),
  tabUpload: t("Upload a file", "ഫയൽ അപ്‌ലോഡ് ചെയ്യുക"),
  tabSaved: t("Generated vakalatnamas", "തയ്യാറാക്കിയ വക്കാലത്തുകൾ"),
  vkSearchLabel: t(
    "Search your generated vakalatnamas",
    "തയ്യാറാക്കിയ വക്കാലത്തുകൾ തിരയുക",
  ),
  vkSearchPlaceholder: t(
    "Search by name or litigant",
    "പേര് അല്ലെങ്കിൽ കക്ഷി ഉപയോഗിച്ച് തിരയുക",
  ),
  vkSearchEmpty: t(
    "No vakalatnamas match your search.",
    "നിങ്ങളുടെ തിരയലുമായി പൊരുത്തപ്പെടുന്ന വക്കാലത്തുകളില്ല.",
  ),
  vkGeneratePrompt: t("Don't have a vakalatnama yet?", "ഇനിയും വക്കാലത്ത് ഇല്ലേ?"),
  vkGenerateAction: t("Generate one in the portal", "പോർട്ടലിൽ തയ്യാറാക്കുക"),
  vkGeneratePrototype: t(
    "The vakalatnama generator will open here. This flow will be added next.",
    "വക്കാലത്ത് ജനറേറ്റർ ഇവിടെ തുറക്കും. ഈ പ്രവാഹം അടുത്തതായി ചേർക്കും.",
  ),
  vkDocLabel: t("Vakalatnama", "വക്കാലത്ത്"),
  vkDocHelp: t(
    "Upload a JPG, JPEG, PNG or PDF up to 10 MB.",
    "10 MB വരെ വലുപ്പമുള്ള JPG, JPEG, PNG അല്ലെങ്കിൽ PDF അപ്‌ലോഡ് ചെയ്യുക.",
  ),
  vkAttachError: t(
    "Upload or choose a vakalatnama before continuing.",
    "തുടരുന്നതിന് മുൻപ് വക്കാലത്ത് അപ്‌ലോഡ് ചെയ്യുക അല്ലെങ്കിൽ തിരഞ്ഞെടുക്കുക.",
  ),
  preview: t("Preview", "പ്രിവ്യൂ"),
  changeFile: t("Change file", "ഫയൽ മാറ്റുക"),
  removeFile: t("Remove", "നീക്കം ചെയ്യുക"),
  docPreviewTitle: t("Document preview", "രേഖയുടെ പ്രിവ്യൂ"),
  docPreviewBody: t(
    "Check the uploaded document before continuing.",
    "തുടരുന്നതിന് മുൻപ് അപ്‌ലോഡ് ചെയ്ത രേഖ പരിശോധിക്കുക.",
  ),
  docPreviewAlt: t(
    "Preview of the uploaded document",
    "അപ്‌ലോഡ് ചെയ്ത രേഖയുടെ പ്രിവ്യൂ",
  ),
  previewTitle: t("Vakalatnama preview", "വക്കാലത്ത് പ്രിവ്യൂ"),
  previewBody: t(
    "Check that this is the right vakalatnama before selecting it.",
    "തിരഞ്ഞെടുക്കുന്നതിന് മുൻപ് ഇത് ശരിയായ വക്കാലത്താണെന്ന് ഉറപ്പാക്കുക.",
  ),
  generatedOn: t("Generated on", "തയ്യാറാക്കിയ തീയതി"),
  advocatesLabel: t("Advocates", "അഭിഭാഷകർ"),
  partiesLabel: t("Litigants", "കക്ഷികൾ"),
  advocatesCount: t("{count} advocates", "{count} അഭിഭാഷകർ"),

  /* outcomes */
  joinedTitle: t("You have joined this case", "നിങ്ങൾ ഈ കേസിൽ ചേർന്നു"),
  joinedBody: t(
    "You can now act for the litigant(s) in this case.",
    "ഇനി ഈ കേസിൽ കക്ഷിക്ക് (കക്ഷികൾക്ക്) വേണ്ടി പ്രവർത്തിക്കാം.",
  ),
  requestTitle: t(
    "Your request to join has been sent",
    "ചേരാനുള്ള നിങ്ങളുടെ അപേക്ഷ അയച്ചു",
  ),
  requestReplacementBody: t(
    "The {approver} must approve the replacement before you get access. You will be told by SMS when a decision is made.",
    "ആക്‌സസ് ലഭിക്കും മുൻപ് {approver} മാറ്റം അംഗീകരിക്കണം. തീരുമാനമാകുമ്പോൾ SMS വഴി അറിയിക്കും.",
  ),
  requestComplainantBody: t(
    "An advocate already on the case must approve your request. You will be told by SMS when a decision is made.",
    "കേസിൽ ഇതിനകം ഉള്ള ഒരു അഭിഭാഷകൻ അപേക്ഷ അംഗീകരിക്കണം. തീരുമാനമാകുമ്പോൾ SMS വഴി അറിയിക്കും.",
  ),
  approverTheJudge: t("judge", "ജഡ്ജി"),
  approverTheAdvocates: t("existing advocate(s)", "നിലവിലുള്ള അഭിഭാഷകർ"),
  viewCaseFile: t("View case file", "കേസ് ഫയൽ കാണുക"),
  prototypeCaseFile: t(
    "This action will open the case file.",
    "ഈ പ്രവർത്തനം കേസ് ഫയൽ തുറക്കും.",
  ),

  /* add subordinates on the success screen */
  teamTitle: t("Add your team (optional)", "നിങ്ങളുടെ ടീമിനെ ചേർക്കുക (നിർബന്ധമല്ല)"),
  teamBody: t(
    "You can add your subordinates to this case (clerks or junior advocates, etc).",
    "നിങ്ങളുടെ കീഴിലുള്ളവരെ (ക്ലർക്കുമാർ അല്ലെങ്കിൽ ജൂനിയർ അഭിഭാഷകർ മുതലായവ) ഈ കേസിൽ ചേർക്കാം.",
  ),
  teamPlaceholder: t("Mobile number", "മൊബൈൽ നമ്പർ"),
  teamAdd: t("Add number", "നമ്പർ ചേർക്കുക"),
  teamSendInvite: t("Send invite", "ക്ഷണം അയക്കുക"),
  teamRemove: t("Remove", "നീക്കം ചെയ്യുക"),
  teamError: t("Enter a valid 10-digit mobile number.", "സാധുവായ 10 അക്ക മൊബൈൽ നമ്പർ നൽകുക."),
  teamAddedNote: t(
    "They'll get a text inviting them to help on this case.",
    "ഈ കേസിൽ സഹായിക്കാൻ ക്ഷണിച്ചുകൊണ്ട് അവർക്ക് ഒരു സന്ദേശം ലഭിക്കും.",
  ),
  teamInviteSentNote: t("Invitation sent to", "ഇവർക്ക് ക്ഷണം അയച്ചു"),
  viewCaseFileWithTeam: t("Add members and view case file", "അംഗങ്ങളെ ചേർത്ത് കേസ് ഫയൽ കാണുക"),

  /* notifications */
  notifJoinedTitle: t("You joined {caseNumber}", "{caseNumber} കേസിൽ ചേർന്നു"),
  notifJoinedBody: t(
    "You can now act for {names} in this case.",
    "ഇനി ഈ കേസിൽ {names}-ന് വേണ്ടി പ്രവർത്തിക്കാം.",
  ),
  notifRequestTitle: t(
    "Join request sent for {caseNumber}",
    "{caseNumber} കേസിൽ ചേരാനുള്ള അപേക്ഷ അയച്ചു",
  ),
  notifRequestBody: t(
    "You will be told by SMS when a decision is made.",
    "തീരുമാനമാകുമ്പോൾ SMS വഴി അറിയിക്കും.",
  ),
} as const;
