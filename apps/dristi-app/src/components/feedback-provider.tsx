"use client";

import * as React from "react";
import { FeedbackProvider as FasterFixesProvider } from "@fasterfixes/react";

/**
 * FasterFixes feedback widget — reviewers annotate the running app and each
 * comment becomes a GitHub issue. See docs/feedback-widget.md.
 *
 * Renders only when NEXT_PUBLIC_FASTERFIXES_PROJECT_ID is set at build time, so
 * normal local dev and any build without it are completely unaffected: no
 * button, no capture, no network calls. Set it only on the deployment
 * reviewers are commenting on.
 *
 * captureDiagnostics (console logs + network requests) is on by default
 * upstream. It is stated explicitly here because those payloads leave our
 * infrastructure — set NEXT_PUBLIC_FASTERFIXES_CAPTURE_DIAGNOSTICS=false on any
 * deployment where that is not acceptable.
 *
 * apiOrigin defaults to FasterFixes' cloud. Set
 * NEXT_PUBLIC_FASTERFIXES_API_ORIGIN to move to a self-hosted instance without
 * touching this file.
 */
const projectId = process.env.NEXT_PUBLIC_FASTERFIXES_PROJECT_ID;
const captureDiagnostics =
  process.env.NEXT_PUBLIC_FASTERFIXES_CAPTURE_DIAGNOSTICS !== "false";
const apiOrigin = process.env.NEXT_PUBLIC_FASTERFIXES_API_ORIGIN;

export function FeedbackProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!projectId) {
    return <>{children}</>;
  }

  return (
    <FasterFixesProvider
      projectId={projectId}
      captureDiagnostics={captureDiagnostics}
      {...(apiOrigin ? { apiOrigin } : {})}
    >
      {children}
    </FasterFixesProvider>
  );
}
