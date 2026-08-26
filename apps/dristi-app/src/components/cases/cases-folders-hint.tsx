"use client";

import * as React from "react";
import { XIcon } from "lucide-react";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";

/** Middle of the 15–20s window. Remounting this (selecting Folders again) restarts it. */
const HINT_MS = 18_000;

/**
 * Explains the folder tiles. Auto-hides; the close control dismisses sooner.
 */
export function CasesFoldersHint() {
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), HINT_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (!visible) return null;

  return (
    <Banner
      variant="info"
      action={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Dismiss folders explanation"
          onClick={() => setVisible(false)}
        >
          <XIcon aria-hidden />
        </Button>
      }
    >
      Each folder holds the cases at that stage or outcome. Open a folder to
      see those cases.
    </Banner>
  );
}
