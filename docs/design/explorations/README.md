# Design explorations

Standalone, interactive HTML prototypes used to try a direction — a layout, a colour ramp, a
typeface, an interaction — **before** it becomes app code.

**Everything in this folder except this README is deliberately untracked** (see the rule in
`.gitignore`). The files stay on your disk so they remain openable; they are never pushed.

## Why they are not in the repo

An exploration is working material, not the product:

- it hand-copies DS tokens instead of consuming them, so it **bypasses the token gates on
  purpose** — `check:tokens` / `check:typography` would rightly fail it;
- it re-implements components as plain HTML/CSS, so it is not bound by `check:ui-sync`;
- it goes stale the moment the real screen moves, and a stale prototype in a repo is worse
  than no prototype, because someone will read it as intent.

## Where the intent actually lives

The **decisions** an exploration settles belong in the feature's brief under
[`../proposals/`](../proposals/), which *is* tracked — with the reasoning, the measurements,
and what was rejected. If a finding from an exploration matters, write it into the brief; do
not point a reader at a file they will not have.

If a colour or token change survives exploration, it is **upstream DS feedback** — raise it
against `neer-ideasbeforenoon/pucar-design-system`, per `.claude/rules/pucar-design-system.md`.

## Working here

- One file per exploration; name it `<feature>-<version>-<what-it-tries>.html`.
- Open it directly in a browser (`file://…`) — no build step, no server.
- Keep it self-contained: no imports from `apps/`, so it can never drift the app.
