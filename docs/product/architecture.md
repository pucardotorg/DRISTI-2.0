# Architecture of the domain

Snapshot: 2026-07-30. Source: [domain model site](https://dristidomain.netlify.app/).

Three things are kept apart, and all three move through time:

## 1. Rules

What you must legally obey: the Constitution, the case type's core Act plus shared
procedure/evidence/penal codes, binding judgments. This is the **national** layer.

## 2. Systems

What you plug into: eCourts (national programme), CIS (court's own case-management
software), NJDG (national judicial data grid), NSTEP (summons delivery, CNR/case-type
codes). DRISTI is one more system in this list — the vendor's platform.

## 3. Context

What you adapt to per state: High Court practice rules, e-filing portals/formats,
practice directions, unwritten local habits, filer profile/volume, court language and UI.

## Point-in-time law

Most visibly, **1 July 2024**, when the old CrPC/IPC/Indian Evidence Act gave way to the
new Sanhitas (BNSS/BNS/BSA). Which set of law applies to a case depends on *when the
cheque bounced* (the **cause-of-action date**), not when the case is filed or processed.
The model is point-in-time aware throughout, not just “current law.”

See [sources.md](sources.md) for the pre/post pairing and [terminology.md](terminology.md)
for cause-of-action date.
