import { QUEUE } from "@/lib/employee/scrutiny/fixtures";
import type { Ball, Filing, QueueOwner } from "@/lib/employee/scrutiny/types";

export function countByBall(queue: Filing[], ball: Ball): number {
  return queue.filter((r) => r.ball === ball).length;
}

/**
 * What the rail's row counts: filings sitting with the registry, i.e. the officer's
 * actual inbox. Filings out with an advocate are not this desk's work and would make
 * the number lie.
 *
 * A constant rather than a function, to match the other court-side queues — the rail
 * reads `count` as a number, and a count of the list behind it is what keeps the rail
 * and the screen from disagreeing.
 */
export const SCRUTINY_QUEUE_COUNT = countByBall(QUEUE, "registry");

/**
 * Longest-waiting first, then filing no. — the queue is a work list, so the thing that
 * has been waiting the longest is the thing to look at. The filing no. tie-break keeps
 * the order stable between renders when two filings share a day count.
 */
export function filterQueue(
  queue: Filing[],
  ball: Ball,
  owner: QueueOwner,
  text: string,
): Filing[] {
  const needle = text.trim().toLowerCase();
  return queue
    .filter((r) => r.ball === ball)
    .filter((r) =>
      owner === "anyone" ? true : owner === "me" ? !!r.self : r.who === "—",
    )
    .filter(
      (r) =>
        !needle ||
        `${r.no} ${r.parties} ${r.advocate}`.toLowerCase().includes(needle),
    )
    .sort((a, b) => b.days - a.days || a.no.localeCompare(b.no));
}

/*
 * There is no `stageVariant` any more. It keyed the badge off `filing.ball` — which is
 * exactly what the tab above the table already filters by — so within one tab every row
 * wore the same chip in the same colour, saying nothing thirty times over. The stage now
 * reads as plain text in its column.
 */

export type WaitTone = "plain" | "muted" | "warning" | "destructive";

/**
 * Escalation is asymmetric on purpose: the registry's clock is the registry's problem
 * from day 7 and urgent from day 14; the advocate's is not chased until day 21, because
 * chasing an advocate on day 8 is noise.
 */
export function waitTone(filing: Filing): WaitTone {
  if (filing.ball === "closed") return "muted";
  if (filing.ball === "registry") {
    if (filing.days >= 14) return "destructive";
    if (filing.days >= 7) return "warning";
  }
  if (filing.ball === "advocate" && filing.days >= 21) return "warning";
  return "plain";
}

/** The filing behind a route param, or `undefined` when the id is not a real one. */
export function findFiling(filingNo: string): Filing | undefined {
  return QUEUE.find((r) => r.no === filingNo);
}
