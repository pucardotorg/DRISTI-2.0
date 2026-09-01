import { SIGN_QUEUES, SIGN_TOTAL, type SignQueue } from "@/lib/employee/sign";

/**
 * Sign — everything waiting for the bench's signature, broken down by kind.
 *
 * The rail's single Sign row says how much signing there is; this screen says of what.
 * Same page furniture as the other court screens — the title stands on the page, one
 * lifted panel holds the work — so the bench is not re-learning furniture between rows
 * of the rail.
 *
 * The rows are deliberately not controls. Opening a kind's queue to actually sign is
 * not part of this build, and a row that looks pressable but goes nowhere would be a
 * lie — the rail's own rule. When a queue is built, its row becomes a link and the
 * caption below the list goes. The counts come from `lib/employee/sign.ts`, the same
 * numbers the rail total is summed from, so the two surfaces cannot disagree.
 */
export function SignScreen() {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 p-6 md:p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title text-balance font-semibold sm:text-title-l">
          Sign
        </h1>
        {/* The total is the whole point of the row that led here, so the supporting
            line carries it — the same number the rail shows, said in words. */}
        <p className="text-body text-muted-foreground tabular-nums">
          {SIGN_TOTAL === 1
            ? "1 document is waiting for your signature."
            : `${SIGN_TOTAL.toLocaleString("en-IN")} documents are waiting for your signature.`}
        </p>
      </header>

      {/* One panel, one list: the breakdown is a single unit of work, so it gets the
          same lifted sheet as the cause list and the scheduling queue. */}
      <section
        aria-label="Documents waiting for signature, by kind"
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-hairline bg-card shadow-raised p-6"
      >
        <ul className="flex flex-col divide-y divide-hairline">
          {SIGN_QUEUES.map((queue) => (
            <SignQueueRow key={queue.id} queue={queue} />
          ))}
        </ul>
        <p className="text-caption text-muted-foreground">
          Opening a queue to sign is not part of this build.
        </p>
      </section>
    </div>
  );
}

/**
 * One kind of signing: its name, and how many wait.
 *
 * The count is the row's one emphasized thing — 500 and tabular, against a 400 label —
 * and an empty queue says so in words rather than showing a nought, the rail's own
 * answer: the count exists to report an obligation, and zero is the absence of one.
 */
function SignQueueRow({ queue }: { queue: SignQueue }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <span className="min-w-0 truncate text-body">{queue.label}</span>
      {queue.count > 0 ? (
        <span className="shrink-0 text-body font-medium tabular-nums">
          {queue.count.toLocaleString("en-IN")}
        </span>
      ) : (
        <span className="shrink-0 text-caption text-muted-foreground">
          Nothing waiting
        </span>
      )}
    </li>
  );
}
