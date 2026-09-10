import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COURT_HOME, courtTrail } from "./navigation";

describe("courtTrail", () => {
  it("is empty on the court home — the heading already names it", () => {
    assert.deepEqual(courtTrail(COURT_HOME.href), []);
  });

  it("on a queue, names the section as context, not a destination", () => {
    assert.deepEqual(courtTrail("/employee/hearings"), [
      { label: "Court home", href: "/employee" },
      { label: "Hearings" },
    ]);
    assert.deepEqual(courtTrail("/employee/sign-orders"), [
      { label: "Court home", href: "/employee" },
      { label: "Sign" },
    ]);
  });

  it("on a listing nested under today's list, makes Hearings a way back", () => {
    const back = [
      { label: "Court home", href: "/employee" },
      { label: "Hearings", href: "/employee/hearings" },
      { label: "Today’s hearings", href: "/employee/hearings" },
    ];
    assert.deepEqual(courtTrail("/employee/hearings/h-241"), back);
    assert.deepEqual(courtTrail("/employee/hearings/h-241/order"), back);
  });

  it("on a complaint nested under the register queue, makes Actions a way back", () => {
    assert.deepEqual(courtTrail("/employee/register-cases/r-1840"), [
      { label: "Court home", href: "/employee" },
      { label: "Actions", href: "/employee/register-cases" },
      { label: "Register cases", href: "/employee/register-cases" },
    ]);
  });

  it("does not treat an unknown complaint id as nested", () => {
    /* The nested segment resolves against the queue, so a stale link matches no row
       at all and gets the way home and nothing else — rather than claiming to sit
       under a complaint that is not there. The screen behind it says the same thing
       in its own words. */
    assert.deepEqual(courtTrail("/employee/register-cases/r-nope"), [
      { label: "Court home", href: "/employee" },
    ]);
  });

  it("does not treat a hearings sibling as a nested listing", () => {
    assert.deepEqual(courtTrail("/employee/hearings/schedule"), [
      { label: "Court home", href: "/employee" },
      { label: "Hearings" },
    ]);
  });

  it("still offers the way home on a route the rail does not know", () => {
    assert.deepEqual(courtTrail("/employee/not-a-queue"), [
      { label: "Court home", href: "/employee" },
    ]);
  });
});
