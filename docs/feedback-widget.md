# Feedback widget (FasterFixes)

Lets reviewers comment **on the running app** instead of in a chat thread. A reviewer
clicks any element, types what's wrong, and the tool captures the screenshot, the URL,
the CSS selector, the React component path, console logs and network activity — then
files it as a GitHub issue on `Pucar-Dristi-2.0`. An agent (Claude Code, Cursor) can
read those items over MCP and work the fix.

Product: <https://www.faster-fixes.com> · Source: <https://github.com/manucoffin/faster-fixes>

---

## What is already wired

| Change | File |
|---|---|
| Widget mount, disabled unless a key is present | `apps/dristi-app/src/components/feedback-provider.tsx` |
| Mounted inside `ThemeProvider`, wrapping the app | `apps/dristi-app/src/app/layout.tsx` |
| Dependency `@fasterfixes/react` | `apps/dristi-app/package.json` |
| Key documented | `apps/dristi-app/.env.example` |

**The widget is off by default, twice over.** It renders only when
`NEXT_PUBLIC_FASTERFIXES_PROJECT_ID` is set at build time **and** the visitor carries a
reviewer token. With no project ID there is no button, no capture, and no requests to
FasterFixes — local dev is untouched.

### How a reviewer actually gets the widget (verified by reading the package)

The widget is not visible to everyone who opens the site. On mount it calls
`resolveReviewerToken()`:

1. It looks for a **`?ff_token=...`** query parameter.
2. If present, it saves the token to `localStorage` under **`ff_reviewer_token`** and
   strips the parameter back out of the URL.
3. Otherwise it reads that same `localStorage` key.
4. With no token — or if the project config it then fetches is missing or has
   `enabled: false` — it renders its children **and nothing else**. No button, no
   annotation layer, no capture.

So the flow is: **invite a reviewer in the FasterFixes dashboard, send them their
tokenised link once.** The token persists in their browser, so afterwards they can browse
the app normally and the widget follows them. Anyone without a token — including real
users — sees the plain app.

That is a useful property: the capture surface only exists for people you invited.

Install the dependency once:

```bash
npm install
```

---

## Setup — the parts only you can do

These need an account and repository permissions, so they can't be scripted here.

**1. Create the account and project**
Sign up at <https://www.faster-fixes.com>, create an organisation, create a project for
Dristi 2.0. Copy the **project ID** (`proj_...`) from project settings.

**The project asks for a domain. Register `pucar.org`.** The API checks the browser's
`Origin`/`Referer` against that value, and the rules (from
`server/api/validate-origin.ts` and `normalize-domain.ts`) are:

- **`localhost`, `127.0.0.1` and `::1` are always allowed**, deliberately, so the widget
  can be tested before anything is deployed. You do **not** need a live site to start.
- **Any subdomain of the registered domain matches** — `pucar.org` covers
  `dristi-demo.pucar.org`, `staging.pucar.org`, and anything else we stand up later, so
  the domain never needs changing.
- Scheme, port, path and a leading `www.` are ignored; the value is normalised to a bare
  hostname. Look-alikes (`pucar.org.evil.com`, `evil-pucar.org`) do not match.

One project is meant to be one website, so don't try to make a single project span
unrelated domains.

**If you register a Netlify domain instead**, enter the full site host
(`<site>.netlify.app`), never bare `netlify.app` — that would match every site on
Netlify. Two things to know:

- **Netlify deploy previews and branch deploys will not match.** Those URLs are
  `deploy-preview-42--<site>.netlify.app` and `<branch>--<site>.netlify.app` — the `--`
  sits *inside* one DNS label, so the host does not end in `.<site>.netlify.app` and the
  subdomain rule above does not apply. Only the production URL will carry the widget.
- Localhost still works regardless, so local review is unaffected.

When it stops being a stopgap, put a `pucar.org` subdomain on the Netlify site and
register `pucar.org` as the project domain — then previews, staging and production all
match under one project and the domain never needs changing again.

(The widget also accepts a deprecated `apiKey` prop. We use `projectId`, which is what
the current package expects.)

**2. Connect GitHub**
In the project's integrations, connect GitHub and authorise it against
`neer-ideasbeforenoon/Pucar-Dristi-2.0`. Point it at the repo and label new issues so
widget-filed issues are separable from hand-written ones (`feedback` works).

This step grants a third party write access to the repository's issues. Grant it to the
one repo, not the whole account.

**3. Set the key on the deployment reviewers will use**
In the hosting provider's environment variables:

```
NEXT_PUBLIC_FASTERFIXES_PROJECT_ID=proj_xxx
```

Rebuild. `NEXT_PUBLIC_*` is inlined at build time, so setting the variable without a
rebuild does nothing.

For local testing: `cp apps/dristi-app/.env.example apps/dristi-app/.env.local`, fill in
the project ID, `npm run dev`.

**Console logs and network requests are attached to every feedback item by default.** To
turn that off for a given deployment:

```
NEXT_PUBLIC_FASTERFIXES_CAPTURE_DIAGNOSTICS=false
```

**4. (Optional) Let an agent read the feedback**

```bash
claude mcp add faster-fixes -s local --env FASTER_FIXES_TOKEN=ff_agent_xxx --env FASTER_FIXES_PROJECT=proj_xxx -- npx -y @fasterfixes/mcp
```

Use `-s local`, not `-s project`. `-s project` writes the token into `.mcp.json` in the
repo, which is not git-ignored — the token would be committed.

---

## Before you point this at anything real

The widget's value is that it captures a lot of context. That is also the risk.

A screenshot of a part-filled e-filing form contains **whatever the person typed** —
complainant name, address, cheque details, document images — and it leaves our
infrastructure for a third-party service, along with console logs and network requests.
The programme's DPDP and PII constraints apply to that.

The package does redact URL query parameters that look like credentials (`token`, `key`,
`secret`, `password`, `session`, and similar) from captured diagnostics. It does **not**
redact anything in screenshots, console messages, or request bodies — there is no
personal-data redaction, only credential-shaped-parameter redaction.

The reviewer-token gate above limits the exposure to people you invited, which helps.
It does not change what is captured once an invited reviewer files an item.

So: **enable it on a preview/demo deployment used with test data.** Do not set the key on
anything carrying real filer data. Reviewers should be told that their screenshots are
part of the feedback item.

Two levers if that constraint is too tight: set
`NEXT_PUBLIC_FASTERFIXES_CAPTURE_DIAGNOSTICS=false` to drop console and network capture
(screenshots still go), or self-host — see below.

---

## Open / unverified

- **Self-hosting cost**: documented (below), but it is a deployment, not a container.
- **Maturity**: `@fasterfixes/react` is at **0.0.10**, ten releases, single maintainer,
  last published June 2026. Fine for internal design review; not a dependency to build on.
- **Exact GitHub permission scope** requested at authorisation time is not documented —
  read the consent screen before accepting, and record what it asked for.
- **Design system**: the widget draws its own UI, which does not come from
  pucar-design-system. It is review tooling layered over the app rather than product UI,
  so it sits outside the DS gate — but it will be visible in screenshots, and it should
  not be enabled on anything shown as a finished design.
- **Data retention** on the FasterFixes side has not been checked.

---

## Who can see what

Two different kinds of people, and only one of them needs an account. Taken from the
upstream data model (`packages/database/schema/project.prisma`, `organization.prisma`).

**Reviewers — the people giving feedback.** A `Reviewer` is a row on the project with a
name, a unique token, and an active flag. **No account, no email, no password.** You add
them in the dashboard and send them their `?ff_token=...` link once. Every feedback item
is attributed to that reviewer, so you always know who filed what, and switching them off
(`isActive`) revokes access without touching anyone else.

**Team members — the people reading feedback.** These are real accounts: a `User` joined
to the `Organization` as a `Member` with a role, invited by email through an `Invitation`
that expires. Members see the dashboard, triage, and can be set as the `assignee` on any
feedback item.

**Everyone else in PUCAR.** They don't need FasterFixes at all — feedback links out to
GitHub issues (also Linear, Jira, Slack). Anyone with access to the repo reads and
discusses the item there. For most of the team this is the only surface they will touch.

## Does self-hosting change that?

No. It is the same application against your own database, so reviewers, invitations,
roles, assignment and the GitHub link all work identically. Three practical differences:

- **Screenshots land in your own object store**, and the console/network trail is a column
  on your own `feedback` table. This is the actual reason to self-host — it is what moves
  the captured personal data back inside our boundary.
- **Team invitations need working transactional email.** Reviewer links do not — you copy
  those out of the dashboard yourself — so reviewers keep working even on an instance with
  no mail provider configured. Member invites will not.
- **Billing is skipped entirely**; no Stripe, no seat limits to think about.

---

## Self-hosting

FasterFixes is AGPL-3.0 and can run on our own infrastructure; the widget packages stay
MIT. Upstream guide: <https://github.com/manucoffin/faster-fixes> →
`apps/web/src/content/docs/self-hosting.mdx`.

Our side is already ready for it — set the origin and nothing else changes:

```
NEXT_PUBLIC_FASTERFIXES_API_ORIGIN=https://feedback.internal.example
```

**What self-hosting actually requires.** It is a Next.js app deployment, not a container
you drop in. There is no Docker Compose in the repo. You need:

| Piece | Note |
|---|---|
| Node host running `apps/web` | Vercel recommended; anything running Next.js works |
| PostgreSQL 14+ | Prisma migrations committed; `migrate:deploy` in the pipeline |
| S3-compatible object store | Cloudflare R2 or AWS S3 — holds the screenshots |
| **Inngest** account | Background jobs (screenshot processing, GitHub sync). *Required in production* — so "self-hosted" still depends on a third-party SaaS |
| Resend or Plunk | Transactional email; sign-up confirmation and password reset need it |
| GitHub App | Optional, only for the GitHub integration |

Stripe is not needed — billing code is cloud-only.

**Recommendation.** Start on their hosted free tier to see whether the tool earns its
place, with a test-data deployment as described above. Self-host only if we decide to
point it at anything carrying real filer data — at which point the object store is the
part to think hardest about, because that is where the screenshots live.
