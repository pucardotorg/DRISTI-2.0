/**
 * The firm directory — people who belong to the practice before and
 * independent of any case — and the groups that grant them office access
 * in bulk (Bulk People & Access concept, PRD 2, Sept 2026).
 *
 * The spine: two access lanes. OFFICE ACCESS is ours: DRISTI is the source
 * of truth, so it is granted and removed instantly, in bulk, through groups
 * or one at a time. VAKALATNAMA is the court's: we only reflect it, one case
 * at a time, through the flows that already exist. Groups live only in the
 * fast lane. A person's access to a case is the union of every source that
 * grants it; to take access away you act on the source, never on one piece
 * of a group.
 */

export type CaseSide = "complainant" | "accused";

/** A party on a case, with the number they sign in with. The import's
    security guard matches office numbers against these. */
export type CaseParty = { name: string; phone: string };

/**
 * One of the firm's cases as the directory needs it. `counsel` is the
 * advocates on the vakalatnama on the viewer's side; the viewer appears
 * there unless the case only reached them through office access.
 */
export type DirectoryCase = {
  id: string;
  /** "Complainant vs accused", as the court titles it. */
  title: string;
  caseNumber: string;
  court: string;
  /** The side the firm acts for. */
  side: CaseSide;
  /** Names on the vakalatnama for `side`, "Adv." prefix included. */
  counsel: string[];
  /**
   * How the signed-in advocate reaches the case. Office access always comes
   * from a named vakalatnama holder — the person a sign-later request
   * routes to.
   */
  viewer: { kind: "vakalatnama" } | { kind: "office"; via: string };
  parties: { complainant: CaseParty; accused: CaseParty };
  /**
   * Office staff already on the case record, shared by a vakalatnama holder
   * before the directory existed. Linked to a directory person by phone
   * when they are imported; they surface as direct grants with the sharer's
   * name, never as something the viewer granted.
   */
  officeStaff?: Array<{ name: string; phone: string; addedBy: string; since: string }>;
};

export type PersonStatus = "registered" | "invited";

export type Person = {
  id: string;
  name: string;
  /** Ten digits, no formatting. Identity is the phone number. */
  phone: string;
  /** Bar Council enrolment. Present ⇒ advocate; absent ⇒ office staff. */
  barId?: string;
  status: PersonStatus;
  /** Display date the person joined the directory. */
  addedOn: string;
};

export type Group = {
  id: string;
  name: string;
  memberIds: string[];
  /** Cases the group grants office access to. */
  caseIds: string[];
  createdOn: string;
};

/** A one-off office grant: manual, or granted back after a group removal. */
export type DirectGrant = {
  personId: string;
  caseId: string;
  since: string;
  /** Who shared it; absent means the signed-in advocate. */
  addedBy?: string;
};

export type GrantSource =
  | { kind: "group"; groupId: string }
  | { kind: "direct"; addedBy?: string }
  | { kind: "vakalatnama" };

/**
 * A person's effective standing on one case: every source that grants it,
 * and the access type they add up to. Vakalatnama always wins; co-existing
 * office sources are kept (never deleted) and render grayed.
 */
export type EffectiveGrant = {
  personId: string;
  caseId: string;
  accessType: "office" | "vakalatnama";
  sources: GrantSource[];
};

/**
 * Something the viewer authored but cannot finalize, because they hold only
 * office access on the case. It waits on the vakalatnama holder who gave
 * them that access. Nothing changes until that person signs.
 */
export type PendingRequest =
  | {
      id: string;
      kind: "remove-person";
      personId: string;
      caseId: string;
      /** The vakalatnama holder the request went to. */
      holder: string;
      note?: string;
      requestedOn: string;
    }
  | {
      id: string;
      kind: "assign-group";
      groupId: string;
      caseId: string;
      holder: string;
      requestedOn: string;
    }
  | {
      id: string;
      kind: "grant-person";
      personId: string;
      caseId: string;
      holder: string;
      requestedOn: string;
    };

/** Everything the derivations read. The provider holds one of these. */
export type DirectoryWorld = {
  people: Person[];
  groups: Group[];
  directGrants: DirectGrant[];
  pending: PendingRequest[];
  cases: DirectoryCase[];
};
