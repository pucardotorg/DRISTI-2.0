# Pending tasks — the ask (verbatim, product)

Recorded: 2026-08-18. Source: the product owner (Abhiram), in conversation, when the
`feature/pending-task` branch was opened. This is **product input**, kept verbatim so
research memos and the design brief can cite it rather than paraphrase it. Where a
memo or brief goes beyond these words, it must say so.

---

> So if you look into the current work in progress that's happening across this
> project, you will understand that we are building a flow for the advocates and
> everyone to manage their tasks that need to be done with the court, right?
>
> So now there are two things that need to be built out properly, and I want you to
> help me reach it home.
>
> The pending tasks essentially are the things that are pending in a case that need
> to be done by the advocate to move the case forward. These can include things like:
>
> * a pending signature
> * a payment that needs to be made for a process
> * submitting a certain document, if necessary, etc.
>
> Currently, the only element of the pending task that is done is that when you click
> on the entire pending tasks on the home screen, you see a list of pending tasks in
> descending order of urgency. The pending task that's blocking and is coming up will
> be shown first. On the all pending task view which you will build now, we need to
> treat this in multiple levels. One filter would be urgency, of course, but there
> should be other filters as well. This is what I want the researcher to do research
> on and understand: what these kinds of filters and everything could be like.
>
> I want you to spin up two agents to do research first on pending tasks and
> understand from the advocate to court interface what all they need to take care of.
> Then, based on that research a UX designer will step in and then build out these
> screens according to our design system.
>
> Make sure it's built out properly end to end, where all the edge cases and logic
> are taken care of. Once a first draft is done, then we can look into [it further].
>
> I have attached some screenshots for your reference on how our system is currently
> dealing with layouts and just the general design language.
>
> Please remember that there is an element of sharing case access with people that is
> not just for one advocate, but for my juniors and seniors. When you look at the home
> screen, you will understand what that means.
>
> Essentially, what that means is that when I have case access, I have access to the
> pending tasks that are not just mine but relevant to other people as well. Depending
> upon the kind of permission that I have, I will be able to act on it or not.
>
> The permission is defined by whether I am signed on the vakalatnama or not signed.
> If I am signed on the vakalatnama, then I can put a signature and take the final
> action and do things like make payments and all of those things. If I am not on the
> vakalatnama, then I cannot do such finalising actions. Probably what I can do is
> make an application and send the signature for approval, so that becomes a separate
> flow. You can still act on the pending task, just that it gets done halfway through,
> and the senior needs to approve the signature so that it is his signature that gets
> put and not the person who is acting on behalf of the person. That probably means we
> need a small section for pending tasks that are in the draft stage as well.
>
> These are all the first-level ideas that I have about this. Let's build this out and
> then take it up further.

---

## What this settles (product-confirmed, 2026-08-18)

- **Who this is for:** advocates and their teams (juniors and seniors who share case
  access). This is the owner's statement for *this feature*; the wider who-logs-in
  question in [docs/product/open-questions.md](../../product/open-questions.md) is
  unchanged for other screens.
- **What a pending task is:** something pending in a case that the advocate must do to
  move the case forward — e.g. a signature, a payment for a process, a document to
  submit.
- **What exists today:** on the home screen (local branch `feature/advocate-home-screen-v3`),
  a rail listing pending tasks in descending urgency — blocking-and-upcoming first —
  with a "View all N tasks" link that goes nowhere yet.
- **What is being built:** the *all pending tasks* view, "treated in multiple levels":
  urgency is one filter; research decides the others.
- **Permission model:** signed on the vakalatnama → can take finalising actions (sign,
  pay). Not signed → cannot finalise; can prepare the task and send it for the
  senior's approval, whose signature is the one applied. This implies a **drafts /
  awaiting-approval** section.
- **Screenshots** referenced in the ask did not reach the agent; the local branches
  (`feature/advocate-home-screen-v3`, `feature/e-filing-new`) stand in as the layout and
  design-language reference.

## What this leaves open

Everything the memos and the brief mark as *inferred* or *open* — see
[pending-tasks-domain.md](pending-tasks-domain.md), [pending-tasks-ux.md](pending-tasks-ux.md)
and the brief at [../proposals/pending-tasks.md](../proposals/pending-tasks.md).
