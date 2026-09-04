/**
 * Adv. Anjali Nair's fifteen cases — the Demo World the concept is written
 * against. All NI-138, Kollam. Names, numbers and Bar IDs are invented.
 *
 * On fourteen she is on the vakalatnama. Canara Bank vs Deepak R. (c-778)
 * reaches her only through office access Ramesh Pillai shared, so it is the
 * case where anything she authors has to wait for his signature.
 *
 * The firm's own advocates on these namas — Ramesh Pillai, Meera Suresh,
 * Firoz Khan — also appear in her office list, so the import recognizes and
 * links them. K. Sabu, Latha Krishnan and George Mathew are external
 * co-counsel: never in her list, never hers to administer.
 */

import type { DirectoryCase } from "./types";

export const VIEWER = {
  name: "Adv. Anjali Nair",
  phone: "9846000000",
} as const;

const ON_NAMA = { kind: "vakalatnama" } as const;

export const DIRECTORY_CASES: DirectoryCase[] = [
  {
    id: "c-847",
    title: "South Indian Bank Ltd. vs Rajan Krishnan Nair and 1 other",
    caseNumber: "CC 847 / 2026",
    court: "JFCM I, Kollam · Court No. 3",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Ramesh Pillai", "Adv. Meera Suresh"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "South Indian Bank Ltd.", phone: "9447100201" },
      accused: { name: "Rajan Krishnan Nair", phone: "9447100202" },
    },
  },
  {
    id: "c-512",
    title: "Federal Bank Ltd. vs Anil Kumar M.",
    caseNumber: "CC 512 / 2026",
    court: "JFCM II, Kollam",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Ramesh Pillai"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Federal Bank Ltd.", phone: "9447100203" },
      accused: { name: "Anil Kumar M.", phone: "9447100204" },
    },
  },
  {
    id: "c-233",
    title: "Muthoot Fincorp Ltd. vs Sreejith Menon",
    caseNumber: "CC 233 / 2026",
    court: "JFCM I, Kollam · Court No. 3",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. K. Sabu"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Muthoot Fincorp Ltd.", phone: "9447100205" },
      accused: { name: "Sreejith Menon", phone: "9447100206" },
    },
  },
  {
    id: "c-690",
    title: "Kerala Gramin Bank vs Suresh Babu",
    caseNumber: "CC 690 / 2026",
    court: "JFCM II, Kollam",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Meera Suresh"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Kerala Gramin Bank", phone: "9447100207" },
      accused: { name: "Suresh Babu", phone: "9447100208" },
    },
  },
  {
    id: "c-401",
    title: "Kollam Traders Pvt. Ltd. vs Hari Gopan",
    caseNumber: "CC 401 / 2026",
    court: "JFCM I, Kollam · Court No. 1",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Latha Krishnan"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Kollam Traders Pvt. Ltd.", phone: "9447100209" },
      accused: { name: "Hari Gopan", phone: "9447100210" },
    },
  },
  {
    id: "c-155",
    title: "Ansar Rawther vs Bindu Mohan",
    caseNumber: "CC 155 / 2026",
    court: "JFCM II, Kollam",
    side: "accused",
    counsel: [VIEWER.name, "Adv. Firoz Khan"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Ansar Rawther", phone: "9447100211" },
      accused: { name: "Bindu Mohan", phone: "9447100212" },
    },
  },
  {
    id: "c-778",
    title: "Canara Bank vs Deepak R.",
    caseNumber: "CC 778 / 2026",
    court: "JFCM I, Kollam · Court No. 3",
    side: "complainant",
    /* Ramesh holds this vakalatnama alone and shared office access with the
       viewer — the one case where she cannot finalize a grant or removal. */
    counsel: ["Adv. Ramesh Pillai"],
    viewer: { kind: "office", via: "Adv. Ramesh Pillai" },
    parties: {
      complainant: { name: "Canara Bank", phone: "9447100213" },
      accused: { name: "Deepak R.", phone: "9447100214" },
    },
    /* Ramesh shared this case with two of the office before the directory
       existed. Once imported they show it as his direct grant, and taking
       them off it is his to sign. */
    officeStaff: [
      { name: "Suresh Kumar", phone: "9846778123", addedBy: "Adv. Ramesh Pillai", since: "11 Jul 2026" },
      { name: "Bindu Rajan", phone: "9744551209", addedBy: "Adv. Ramesh Pillai", since: "11 Jul 2026" },
    ],
  },
  {
    id: "c-289",
    title: "Vijay Finance vs Santhosh Kumar",
    caseNumber: "CC 289 / 2026",
    court: "JFCM I, Kollam · Court No. 1",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. George Mathew"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Vijay Finance", phone: "9447100215" },
      accused: { name: "Santhosh Kumar", phone: "9447100216" },
    },
  },
  {
    id: "c-330",
    title: "Thomas Varghese vs Rekha Nair",
    caseNumber: "CC 330 / 2026",
    court: "JFCM II, Kollam",
    side: "accused",
    counsel: [VIEWER.name, "Adv. Meera Suresh"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Thomas Varghese", phone: "9447100217" },
      accused: { name: "Rekha Nair", phone: "9447100218" },
    },
  },
  {
    id: "c-902",
    title: "HDFC Bank Ltd. vs Nisha Thomas",
    caseNumber: "CC 902 / 2026",
    court: "JFCM I, Kollam · Court No. 3",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. K. Sabu"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "HDFC Bank Ltd.", phone: "9447100219" },
      accused: { name: "Nisha Thomas", phone: "9447100220" },
    },
  },
  {
    id: "c-447",
    title: "Malabar Gold Pvt. Ltd. vs Rajeev Menon",
    caseNumber: "CC 447 / 2026",
    court: "JFCM II, Kollam",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Firoz Khan"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Malabar Gold Pvt. Ltd.", phone: "9447100221" },
      accused: { name: "Rajeev Menon", phone: "9447100222" },
    },
  },
  {
    id: "c-612",
    title: "State Bank of India vs Prakash Nair",
    caseNumber: "CC 612 / 2026",
    court: "JFCM I, Kollam · Court No. 1",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Ramesh Pillai", "Adv. Latha Krishnan"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "State Bank of India", phone: "9447100223" },
      accused: { name: "Prakash Nair", phone: "9447100224" },
    },
  },
  {
    id: "c-271",
    title: "Kosamattam Finance Ltd. vs Vinod Kumar",
    caseNumber: "CC 271 / 2026",
    court: "JFCM II, Kollam",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. Meera Suresh"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Kosamattam Finance Ltd.", phone: "9447100225" },
      accused: { name: "Vinod Kumar", phone: "9447100226" },
    },
  },
  {
    id: "c-823",
    title: "ESAF Small Finance Bank vs Aju Varghese",
    caseNumber: "CC 823 / 2026",
    court: "JFCM I, Kollam · Court No. 3",
    side: "complainant",
    counsel: [VIEWER.name, "Adv. George Mathew"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "ESAF Small Finance Bank", phone: "9447100227" },
      accused: { name: "Aju Varghese", phone: "9447100228" },
    },
  },
  {
    id: "c-198",
    title: "Priya Raghavan vs Manoj Pillai",
    caseNumber: "CC 198 / 2026",
    court: "JFCM II, Kollam",
    side: "accused",
    counsel: [VIEWER.name, "Adv. Firoz Khan"],
    viewer: ON_NAMA,
    parties: {
      complainant: { name: "Priya Raghavan", phone: "9447100229" },
      /* Row 50 of the office list carries this number — the import's
         security guard must refuse it. */
      accused: { name: "Manoj Pillai", phone: "9847556611" },
    },
  },
];

/**
 * People DRISTI already knows by number. The import links these instead of
 * inviting them: the firm's advocates on the namas above, and two staff who
 * registered earlier (the built product's frequent collaborators).
 */
export const KNOWN_ACCOUNTS: Record<
  string,
  { name: string; barId?: string; reason: "vakalatnama" | "account" }
> = {
  "9847034521": { name: "Adv. Ramesh Pillai", barId: "K/0894/2004", reason: "vakalatnama" },
  "9846521190": { name: "Adv. Meera Suresh", barId: "K/1567/2009", reason: "vakalatnama" },
  "9995471122": { name: "Adv. Firoz Khan", barId: "K/2231/2013", reason: "vakalatnama" },
  "9072055190": { name: "Sameer K.", reason: "account" },
  "8089074136": { name: "Akhil Krishnan", reason: "account" },
};

export function caseById(caseId: string): DirectoryCase | undefined {
  return DIRECTORY_CASES.find((c) => c.id === caseId);
}

/** Every party number across the firm's cases, for the import guard. */
export function partyByPhone(
  phone: string,
  cases: DirectoryCase[] = DIRECTORY_CASES,
): { party: string; caseId: string } | null {
  for (const c of cases) {
    if (c.parties.complainant.phone === phone) {
      return { party: c.parties.complainant.name, caseId: c.id };
    }
    if (c.parties.accused.phone === phone) {
      return { party: c.parties.accused.name, caseId: c.id };
    }
  }
  return null;
}
