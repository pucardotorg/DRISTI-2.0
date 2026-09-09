import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CASE_REVIEW_STATUS,
  FILING_WINDOW_DAYS,
  NOTICE_WINDOW_DAYS,
  PAYMENT_WINDOW_DAYS,
  PRESENTATION_WINDOW_DAYS,
  caseChainFor,
  caseReviewFor,
  daysBetween,
  type CaseGroup,
} from "./case-review";
import { REGISTER_QUEUE, registerCaseById } from "./register-cases";

/* A fixed day, so a test asserting on dates is not a test about when it ran. */
const TODAY = "2026-09-09";

function review(id: string) {
  const found = caseReviewFor(id, TODAY);
  assert.ok(found, `no file for ${id}`);
  return found;
}

function groups(id: string): CaseGroup[] {
  return review(id).sections.flatMap((section) => section.groups);
}

function groupById(id: string, groupId: string): CaseGroup | undefined {
  return groups(id).find((group) => group.id === groupId);
}

describe("caseReviewFor", () => {
  it("opens a file for every complaint in the queue", () => {
    /* The reason the particulars are derived rather than transcribed: a cause title
       that is now a link must not be a dead one on thirty of thirty-five rows. */
    for (const complaint of REGISTER_QUEUE) {
      const file = caseReviewFor(complaint.id, TODAY);
      assert.ok(file, `${complaint.id} has no file`);
      assert.equal(file.caseNumber, complaint.caseNumber);
      assert.ok(file.title.includes(complaint.parties.complainant));
      assert.ok(file.title.includes(complaint.parties.accused));
    }
  });

  it("has nothing for an id the queue does not hold", () => {
    assert.equal(caseReviewFor("r-nope", TODAY), undefined);
    assert.equal(caseReviewFor("h-241", TODAY), undefined);
    assert.equal(caseReviewFor("", TODAY), undefined);
  });

  it("dates the complaint from the wait the queue row carries", () => {
    for (const id of ["r-1840", "r-714", "r-401"]) {
      const complaint = registerCaseById(id);
      assert.ok(complaint);
      assert.equal(
        daysBetween(review(id).submittedOn, TODAY),
        complaint.daysSinceSubmitted,
      );
    }
  });

  it("gives the same row the same file every time", () => {
    /* Nothing here is random, and it matters: a clerk who reloads a complaint must
       not be shown a different cheque. */
    assert.deepEqual(caseReviewFor("r-1654", TODAY), caseReviewFor("r-1654", TODAY));
  });

  it("is the five numbered sections, in reading order", () => {
    assert.deepEqual(
      review("r-1840").sections.map((section) => section.id),
      [
        "litigants",
        "case-specific",
        "additional",
        "accused-submissions",
        "payment",
      ],
    );
  });

  it("states the queue's one status", () => {
    assert.equal(CASE_REVIEW_STATUS, "Waiting to be registered");
  });
});

describe("the §138 chain", () => {
  it("runs oldest to newest on every complaint", () => {
    for (const complaint of REGISTER_QUEUE) {
      const chain = caseChainFor(complaint.id, TODAY);
      assert.ok(chain);
      const order = [
        chain.chequeOn,
        chain.depositedOn,
        chain.returnedOn,
        chain.noticeSentOn,
        chain.noticeServedOn,
        chain.accruedOn,
        chain.submittedOn,
      ];
      assert.deepEqual(
        order,
        [...order].sort(),
        `${complaint.id} has its chain out of order`,
      );
    }
  });

  it("keeps every complaint inside the windows the Act fixes", () => {
    for (const complaint of REGISTER_QUEUE) {
      const chain = caseChainFor(complaint.id, TODAY);
      assert.ok(chain);

      /* §138(a) — the cheque is presented within three months of its date. */
      const presentation = daysBetween(chain.chequeOn, chain.depositedOn);
      assert.ok(
        presentation > 0 && presentation <= PRESENTATION_WINDOW_DAYS,
        `${complaint.id} deposited the cheque after ${presentation} days`,
      );

      /* §138(b) — the demand notice goes out within thirty days of the return. */
      const notice = daysBetween(chain.returnedOn, chain.noticeSentOn);
      assert.ok(
        notice > 0 && notice <= NOTICE_WINDOW_DAYS,
        `${complaint.id} sent the notice after ${notice} days`,
      );

      /* §138(c) — the offence is complete fifteen days after service, exactly. */
      assert.equal(
        daysBetween(chain.noticeServedOn, chain.accruedOn),
        PAYMENT_WINDOW_DAYS,
        `${complaint.id} accrues at the wrong distance from service`,
      );
    }
  });

  it("files in time unless the file carries an application to condone the delay", () => {
    for (const complaint of REGISTER_QUEUE) {
      const chain = caseChainFor(complaint.id, TODAY);
      assert.ok(chain);
      const condonation = groupById(complaint.id, "delay-condonation");
      const late = chain.sinceAccrual > FILING_WINDOW_DAYS;

      /* The two have to agree in both directions: a late complaint with no
         application would be a file the court could not entertain, and an
         application on a complaint filed in time would be answering a question
         nobody asked. */
      assert.equal(
        late,
        condonation !== undefined,
        `${complaint.id} is ${late ? "late" : "in time"} and ${
          condonation ? "has" : "has no"
        } delay condonation`,
      );
    }
  });

  it("reports the delay as the days past the month, not the whole gap", () => {
    const chain = caseChainFor("r-1840", TODAY);
    const condonation = groupById("r-1840", "delay-condonation");
    assert.ok(chain);
    assert.ok(condonation);
    const beyond = condonation.facts?.find(
      (fact) => fact.term === "Days beyond the one month",
    );
    assert.equal(beyond?.value, String(chain.sinceAccrual - FILING_WINDOW_DAYS));
  });
});

describe("the states a file can be in", () => {
  it("says so when no witness was named", () => {
    assert.equal(groupById("r-1490", "witnesses")?.empty, "No witness added");
    assert.equal(groupById("r-1490", "witnesses")?.records?.length, 0);
  });

  it("lists the witnesses when there are some", () => {
    assert.equal(groupById("r-1840", "witnesses")?.records?.length, 2);
    assert.equal(groupById("r-1840", "witnesses")?.empty, undefined);
  });

  it("keeps a document slot on the page when it was left empty", () => {
    /* The partial file: delayed, and the application itself never uploaded. The slot
       has to survive — a court deciding on a late complaint needs to see that the
       thing excusing the delay is missing, not to be shown a shorter list. */
    const condonation = groupById("r-1588", "delay-condonation");
    assert.equal(condonation?.documents?.length, 1);
    const application = condonation?.documents?.[0];
    assert.equal(application?.label, "Delay condonation application");
    assert.equal(application?.state, "absent");
    /* No upload to name. A filename on a document nobody sent is the kind of detail
       that makes a demo lie, so the absence is carried by `file` being missing rather
       than by a string saying so. */
    assert.equal(application?.file, undefined);
  });

  it("does not cite an application that is not on the file", () => {
    /* `r-1588` is late and never uploaded the application, so the grounds cannot be
       "set out in the application on record". `r-1840` is late and did. */
    const missing = groupById("r-1588", "delay-condonation")?.facts?.find(
      (fact) => fact.term === "Grounds stated",
    );
    assert.match(missing?.value ?? "", /never uploaded/);

    const present = groupById("r-1840", "delay-condonation")?.facts?.find(
      (fact) => fact.term === "Grounds stated",
    );
    assert.match(present?.value ?? "", /application on record/);
  });

  it("marks a reply as absent when none came back", () => {
    const notice = groupById("r-1722", "demand-notice");
    const reply = notice?.documents?.find(
      (document) => document.label === "Reply to the notice",
    );
    assert.equal(reply?.state, "absent");
    assert.equal(
      notice?.facts?.find((fact) => fact.term === "Date of reply to the notice")
        ?.value,
      "No reply received",
    );
  });

  it("carries the reason the bank gave, and repeats it in what was sworn", () => {
    const cheque = groupById("r-1722", "cheque")?.records?.[0];
    assert.equal(
      cheque?.facts.find(
        (fact) => fact.term === "Reason for the return of the cheque",
      )?.value,
      "Payment stopped by drawer",
    );
    /* The same fact in the register a sentence needs — not the memo phrase dropped
       into one, which read "returned because of payment stopped by drawer". */
    assert.ok(
      cheque?.confirmed?.some((line) =>
        line.includes("payment having been stopped by the drawer"),
      ),
      "what the complainant swore to should name the same reason",
    );
  });

  it("claims more than the cheque only on a part-liability file", () => {
    const part = groupById("r-1654", "debt")?.facts ?? [];
    assert.equal(
      part.find((fact) => fact.term === "Cheque received for full or part liability")
        ?.value,
      "Part liability",
    );
    assert.ok(
      part.some((fact) => fact.term === "Total amount claimed to be owed"),
      "a part-liability file should say what the whole debt is",
    );

    const whole = groupById("r-714", "debt")?.facts ?? [];
    assert.equal(
      whole.find((fact) => fact.term === "Cheque received for full or part liability")
        ?.value,
      "Full liability",
    );
    assert.ok(
      !whole.some((fact) => fact.term === "Total amount claimed to be owed"),
      "a full-liability file has no second amount to state",
    );
  });

  it("says nothing has come from the accused unless something has", () => {
    assert.match(
      groupById("r-714", "accused-submissions")?.empty ?? "",
      /not been summoned/,
    );
    assert.equal(
      groupById("r-1104", "accused-submissions")?.empty,
      undefined,
    );
  });

  it("says the complainant appears in person when no vakalat is on record", () => {
    /* `r-1490` has an empty advocates cell on the queue too. The two readings of the
       same absence must not disagree. */
    assert.equal(registerCaseById("r-1490")?.counsel.length, 0);
    assert.match(
      groupById("r-1490", "advocates")?.empty ?? "",
      /appears in person/,
    );
    assert.equal(groupById("r-1588", "advocates")?.records?.length, 2);
  });
});

describe("the complaint's own account", () => {
  it("does not say the notice went unanswered on a file that carries the reply", () => {
    const replied = groups("r-1840")
      .find((group) => group.id === "complaint")
      ?.facts?.find((fact) => fact.term === "Synopsis")?.value;
    assert.ok(replied);
    assert.ok(!replied.includes("went unanswered"), replied);

    const silent = groups("r-714")
      .find((group) => group.id === "complaint")
      ?.facts?.find((fact) => fact.term === "Synopsis")?.value;
    assert.ok(silent?.includes("went unanswered"), silent);
  });
});

describe("derived numbers", () => {
  it("does not let one number turn up as another", () => {
    /* A single multiplier put a complaint's cheque number inside its complainant's
       mobile number, which is the tell that the whole file is generated. */
    for (const complaint of REGISTER_QUEUE) {
      const file = review(complaint.id);
      const parties = file.sections[0].groups.flatMap(
        (group) => group.records ?? [],
      );
      /* Matched rather than stripped: `replace(/\D/g, "")` swallows the country
         code too, and a ten-digit line then measures twelve. */
      const mobiles = parties
        .flatMap((record) => record.facts)
        .filter((fact) => fact.term === "Mobile number")
        .map((fact) => /^\+91 (\d{5}) (\d{5})$/.exec(fact.value ?? ""))
        .map((match) => {
          assert.ok(match, "a mobile number should be +91 then five and five");
          return `${match[1]}${match[2]}`;
        });
      const cheque = (
        file.sections[1].groups.find((group) => group.id === "cheque")
          ?.records?.[0].heading ?? ""
      ).replace(/\D/g, "");

      assert.ok(cheque.length === 6, cheque);
      assert.ok(mobiles.length > 0, `${complaint.id} states no mobile at all`);
      for (const mobile of mobiles) {
        assert.equal(mobile.length, 10, `${complaint.id}: ${mobile}`);
        assert.ok(
          !mobile.includes(cheque),
          `${complaint.id}: cheque ${cheque} appears in mobile ${mobile}`,
        );
      }
    }
  });
});

describe("documents", () => {
  it("names an upload on every filed slot and none on an empty one", () => {
    for (const complaint of REGISTER_QUEUE) {
      const docs = groups(complaint.id).flatMap((group) => group.documents ?? []);
      assert.ok(docs.length > 0, `${complaint.id} lists no documents at all`);
      for (const doc of docs) {
        if (doc.state === "filed") {
          assert.ok(doc.file, `${complaint.id}: ${doc.label} is filed with no file`);
          assert.match(doc.file.name, /^[a-z0-9][a-z0-9-]*\.pdf$/, doc.file.name);
          assert.ok(doc.file.pages >= 1);
          assert.match(doc.file.size, /^\d+(\.\d)? (KB|MB)$/, doc.file.size);
        } else {
          assert.equal(
            doc.file,
            undefined,
            `${complaint.id}: ${doc.label} is absent but names a file`,
          );
        }
      }
    }
  });

  it("names the scan of the cheque after the cheque", () => {
    /* The record heading and the filename are both built from the hoisted number, so
       a clerk reading "Cheque no. X" finds `cheque-X.pdf` under it. */
    const cheque = groupById("r-1840", "cheque");
    const number = (cheque?.records?.[0].heading ?? "").replace(/\D/g, "");
    const scan = cheque?.documents ?? cheque?.records?.[0].documents ?? [];
    const front = scan.find((doc) => doc.label === "Dishonoured cheque");
    assert.equal(front?.kind, "cheque");
    assert.equal(front?.file?.name, `cheque-${number}.pdf`);
  });

  it("dates a scan from the event it records", () => {
    const chain = caseChainFor("r-1840", TODAY);
    assert.ok(chain);
    const [day, month, year] = [
      chain.returnedOn.slice(8),
      chain.returnedOn.slice(5, 7),
      chain.returnedOn.slice(0, 4),
    ];
    const memo = groupById("r-1840", "cheque")
      ?.records?.[0].documents?.find((doc) => doc.label === "Cheque return memo");
    assert.equal(memo?.file?.name, `return-memo-${day}-${month}-${year}.pdf`);
  });

  it("gives each kind of page its own shape to draw", () => {
    const byLabel = new Map(
      groups("r-1840")
        .flatMap((group) => [
          ...(group.documents ?? []),
          ...(group.records ?? []).flatMap((record) => record.documents ?? []),
        ])
        .map((doc) => [doc.label, doc.kind]),
    );
    assert.equal(byLabel.get("Dishonoured cheque"), "cheque");
    assert.equal(byLabel.get("Cheque return memo"), "memo");
    assert.equal(byLabel.get("Legal demand notice"), "letter");
    assert.equal(byLabel.get("Vakalatnama"), "form");
    assert.equal(byLabel.get("ID proof"), "id");
    assert.equal(byLabel.get("Payment receipt"), "receipt");
  });
});

describe("the case timeline", () => {
  it("runs past steps, then the wait, then a decision not yet made", () => {
    for (const complaint of REGISTER_QUEUE) {
      const steps = review(complaint.id).timeline;
      const statuses = steps.map((step) => step.status);
      const currentAt = statuses.lastIndexOf("current");
      assert.ok(currentAt > 0, `${complaint.id} has no current step`);
      assert.deepEqual(
        statuses.slice(currentAt),
        ["current", "future"],
        `${complaint.id} does not end wait-then-decision`,
      );
      assert.ok(
        statuses.slice(0, currentAt).every((status) => status === "past"),
        `${complaint.id} has a non-past step before the wait`,
      );
      assert.equal(steps.at(-1)?.label, "Registration decision");
      assert.equal(steps.at(-1)?.detail, "Not made");
    }
  });

  it("counts the wait the queue row counts, on the current step", () => {
    const waiting = (id: string) =>
      review(id).timeline.find((step) => step.status === "current");
    assert.equal(waiting("r-714")?.detail, "1 day so far");
    assert.equal(waiting("r-1840")?.detail, "281 days so far");
    assert.equal(waiting("r-714")?.label, "Waiting to be registered");
  });

  it("keeps dated steps on or after the filing day, and before today", () => {
    for (const complaint of REGISTER_QUEUE) {
      const file = review(complaint.id);
      for (const step of file.timeline) {
        if (!step.on) continue;
        assert.ok(
          step.on >= file.submittedOn,
          `${complaint.id} ${step.label} is before the complaint was submitted`,
        );
        assert.ok(
          step.on < TODAY,
          `${complaint.id} ${step.label} lands on or after today`,
        );
      }
    }
  });

  it("follows the Kerala spine as far as the wait allows", () => {
    assert.deepEqual(
      review("r-714").timeline.map((step) => step.label),
      [
        "Complaint submitted",
        "Court fee received",
        "Waiting to be registered",
        "Registration decision",
      ],
    );
    assert.deepEqual(
      review("r-1840").timeline.map((step) => step.label),
      [
        "Complaint submitted",
        "Court fee received",
        "Delay condonation application filed",
        "Taken up for scrutiny",
        "Scrutiny completed",
        "Placed before the magistrate",
        "Waiting to be registered",
        "Registration decision",
      ],
    );
  });

  it("adds the events the file itself already carries", () => {
    assert.ok(
      review("r-1104").timeline.some(
        (step) => step.label === "Letter from the accused received",
      ),
    );
    /* The application was never uploaded, so the timeline must not claim it was filed. */
    assert.ok(
      !review("r-1588").timeline.some(
        (step) => step.label === "Delay condonation application filed",
      ),
    );
  });
});
