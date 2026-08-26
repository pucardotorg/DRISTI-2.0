/**
 * Case file — the court's compiled documentary record.
 *
 * The nine categories are fixed. Documents inside them accumulate as the
 * case proceeds. This tree is the current QA file: categories that exist
 * but have nothing filed yet still appear, so the spine does not change
 * from case to case.
 *
 * Leaves point at the dummy Section 138 PDF pack under /case-file/. Each
 * category PDF starts with a cover page; child documents follow in order.
 *
 * Labels follow Laws sentence case. Statutory short forms (BNSS, PW-1)
 * stay as written.
 */
import { caseSectionHref } from "./sections";

export type CaseFileNode = {
  id: string;
  /** Outline number: "1", "2.1", "5.1.1". */
  number: string;
  label: string;
  children?: CaseFileNode[];
  /** Public URL of the filed PDF. Absent on folders. */
  href?: string;
  /** 1-based page in `href`. Absent on folders and on whole-file leaves. */
  page?: number;
};

const CASE_FILE_PDF = {
  complaint: "/case-file/01-complaint.pdf",
  initialFilings: "/case-file/02-initial-filings.pdf",
  affidavits: "/case-file/03-affidavits.pdf",
  vakalats: "/case-file/04-vakalats.pdf",
  evidenceComplainant: "/case-file/05-evidence-of-complainant.pdf",
  evidenceAccused: "/case-file/06-evidence-of-accused.pdf",
  paymentReceipts: "/case-file/07-payment-receipts.pdf",
  examinationAccused: "/case-file/08-examination-of-accused.pdf",
  orders: "/case-file/09-orders.pdf",
} as const;

export function isCaseFileFolder(node: CaseFileNode): boolean {
  return node.children !== undefined;
}

export function fileNumberLabel(number: string): string {
  return number.includes(".") ? number : `${number}.`;
}

export function flattenLeaves(nodes: CaseFileNode[]): CaseFileNode[] {
  const leaves: CaseFileNode[] = [];
  for (const node of nodes) {
    if (isCaseFileFolder(node)) {
      leaves.push(...flattenLeaves(node.children ?? []));
    } else {
      leaves.push(node);
    }
  }
  return leaves;
}

export function findNode(
  nodes: CaseFileNode[],
  id: string
): CaseFileNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/** Root-to-node path, including the node itself. */
export function findPath(
  nodes: CaseFileNode[],
  id: string,
  trail: CaseFileNode[] = []
): CaseFileNode[] | undefined {
  for (const node of nodes) {
    const next = [...trail, node];
    if (node.id === id) return next;
    if (node.children) {
      const found = findPath(node.children, id, next);
      if (found) return found;
    }
  }
  return undefined;
}

export function ancestorIds(nodes: CaseFileNode[], id: string): string[] {
  const path = findPath(nodes, id);
  if (!path || path.length < 2) return [];
  return path.slice(0, -1).map((node) => node.id);
}

export function firstLeaf(nodes: CaseFileNode[]): CaseFileNode | undefined {
  return flattenLeaves(nodes)[0];
}

export function parseCaseFileDoc(
  value: string | string[] | undefined,
  tree: CaseFileNode[] = CASE_FILE_TREE
): string {
  const raw = Array.isArray(value) ? value[0] : value;
  const leaves = flattenLeaves(tree);
  if (raw && leaves.some((node) => node.id === raw)) return raw;
  return firstLeaf(tree)?.id ?? "";
}

export type CaseFileView = "pdf" | "digital";

export function parseCaseFileView(
  value: string | string[] | undefined
): CaseFileView {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "digital" ? "digital" : "pdf";
}

export function caseFileDocHref(
  caseId: string,
  docId: string,
  view: CaseFileView = "pdf"
): string {
  const base = caseSectionHref(caseId, "case-file");
  const join = base.includes("?") ? "&" : "?";
  const href = `${base}${join}doc=${docId}`;
  return view === "digital" ? `${href}&view=digital` : href;
}

/** Viewer URL, including a page fragment when the leaf is a child document. */
export function caseFilePdfSrc(node: CaseFileNode): string | undefined {
  if (!node.href) return undefined;
  return node.page ? `${node.href}#page=${node.page}` : node.href;
}

function filed(
  sectionNumber: string,
  href: string,
  items: { id: string; label: string }[]
): CaseFileNode[] {
  return items.map((item, index) => ({
    id: item.id,
    number: `${sectionNumber}.${index + 1}`,
    label: item.label,
    href,
    page: index + 2,
  }));
}

/**
 * QA case file. The nine-category spine is fixed. Child labels match the
 * dummy PDF pack filed under each category.
 */
export const CASE_FILE_TREE: CaseFileNode[] = [
  {
    id: "complaint",
    number: "1",
    label: "Complaint",
    href: CASE_FILE_PDF.complaint,
  },
  {
    id: "initial-filings",
    number: "2",
    label: "Initial filings",
    children: filed("2", CASE_FILE_PDF.initialFilings, [
      { id: "legal-demand-notice", label: "Legal demand notice" },
      {
        id: "proof-of-dispatch",
        label: "Proof of dispatch of legal demand notice",
      },
      { id: "dishonoured-cheque", label: "Dishonoured cheque" },
      { id: "cheque-return-memo", label: "Cheque return memo" },
    ]),
  },
  {
    id: "affidavits",
    number: "3",
    label: "Affidavits",
    children: filed("3", CASE_FILE_PDF.affidavits, [
      {
        id: "affidavit-223-bnss",
        label:
          "Affidavit relating to examination of complainant under section 223 BNSS",
      },
      {
        id: "affidavit-225-bnss",
        label: "Affidavit supporting inquiry under section 225 BNSS",
      },
      {
        id: "pw1-chief-affidavit-145",
        label:
          "PW-1 chief affidavit under section 145 of the Negotiable Instruments Act",
      },
    ]),
  },
  {
    id: "vakalats",
    number: "4",
    label: "Vakalats",
    children: filed("4", CASE_FILE_PDF.vakalats, [
      { id: "pip-affidavit-1", label: "Party-in-person affidavit 1" },
      { id: "vakalatnama-1", label: "Vakalatnama 1 (complainant)" },
      { id: "vakalatnama-2", label: "Vakalatnama 2 (accused)" },
    ]),
  },
  {
    id: "evidence-complainant",
    number: "5",
    label: "Evidence of complainant",
    children: filed("5", CASE_FILE_PDF.evidenceComplainant, [
      { id: "witness-deposition-pw1", label: "PW-1 deposition" },
      { id: "witness-deposition-pw2", label: "PW-2 deposition" },
      {
        id: "exhibit-index-p1-p6",
        label: "Complainant exhibit index P1-P6",
      },
      { id: "cross-examination-record", label: "Cross-examination record" },
    ]),
  },
  {
    id: "evidence-accused",
    number: "6",
    label: "Evidence of accused",
    children: filed("6", CASE_FILE_PDF.evidenceAccused, [
      { id: "defence-witness-list", label: "Defence witness list" },
      { id: "witness-deposition-dw1", label: "DW-1 deposition" },
      { id: "exhibit-index-d1-d3", label: "Defence exhibit index D1-D3" },
    ]),
  },
  {
    id: "payment-receipts",
    number: "7",
    label: "Payment receipts",
    children: filed("7", CASE_FILE_PDF.paymentReceipts, [
      { id: "case-filing-payment", label: "Case filing payment receipt" },
      { id: "summons-payment-receipt", label: "Summons process fee receipt" },
      { id: "witness-process-fee", label: "Witness process fee receipt" },
      {
        id: "partial-compensation-deposit",
        label: "Partial compensation deposit receipt",
      },
    ]),
  },
  {
    id: "examination-accused",
    number: "8",
    label: "Examination of accused",
    children: filed("8", CASE_FILE_PDF.examinationAccused, [
      { id: "plea", label: "Plea record" },
      {
        id: "questionnaire-351-bnss",
        label: "Questionnaire under section 351 BNSS",
      },
      {
        id: "signed-statement-accused",
        label: "Signed statement of accused",
      },
      {
        id: "defence-evidence-election",
        label: "Defence evidence election memo",
      },
    ]),
  },
  {
    id: "orders",
    number: "9",
    label: "Orders",
    children: filed("9", CASE_FILE_PDF.orders, [
      { id: "order-cognizance", label: "Order taking cognizance" },
      { id: "order-issuing-summons", label: "Order issuing summons" },
      {
        id: "order-appearance-plea-bail",
        label: "Order on appearance, plea and bail",
      },
      {
        id: "order-day-evidence-complainant",
        label: "Order of the day - evidence of complainant",
      },
      {
        id: "order-closing-complainant-evidence",
        label: "Order closing complainant evidence",
      },
      {
        id: "order-day-351-examination",
        label: "Order of the day - section 351 examination",
      },
      {
        id: "order-closing-defence-evidence",
        label: "Order closing defence evidence",
      },
      { id: "order-reserving-judgment", label: "Order reserving judgment" },
      { id: "judgment", label: "Judgment and sentence order" },
    ]),
  },
];
