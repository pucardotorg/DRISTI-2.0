"use client";

import * as React from "react";

type Handoff = "sign" | "read" | "dismiss" | null;

/**
 * Two Dialog roots, one at a time, sequenced so the second plays the DS enter
 * animation instead of swapping content inside an already-open overlay.
 *
 * The individual sign path used to keep one Dialog open and replace a tall document
 * with the narrow Add-signature form. That skipped `data-open:animate-in` — the
 * overlay was already open — and jumped the box from `sm:max-w-4xl` / `md:h-[85dvh]`
 * to `sm:max-w-lg` in one frame. The method choice therefore came up with no
 * entrance at all, on every queue that shares this path.
 *
 * Closing the document first, then opening Add signature from `onCloseAutoFocus`
 * (after Radix Presence has finished the exit), keeps one focus scope at a time
 * and lets the method dialog fade and zoom in the way every other overlay in the
 * product does.
 *
 * `onCloseAutoFocus` always `preventDefault`s: the next dialog takes focus when we
 * are handing off, and the screen's `onReturnFocus` takes it when we are dismissing.
 * Leaving Radix to restore would land on the search field between the two overlays.
 */
export function useSignStepHandoff(isOpen: boolean) {
  const [readOpen, setReadOpen] = React.useState(false);
  const [signOpen, setSignOpen] = React.useState(false);
  const pending = React.useRef<Handoff>(null);
  const signOpenRef = React.useRef(false);
  const readOpenRef = React.useRef(false);
  signOpenRef.current = signOpen;
  readOpenRef.current = readOpen;

  React.useEffect(() => {
    if (isOpen) {
      pending.current = null;
      setReadOpen(true);
      setSignOpen(false);
      return;
    }
    pending.current = null;
    setReadOpen(false);
    setSignOpen(false);
  }, [isOpen]);

  const goToSign = React.useCallback(() => {
    pending.current = "sign";
    setReadOpen(false);
  }, []);

  const goToRead = React.useCallback(() => {
    pending.current = "read";
    setSignOpen(false);
  }, []);

  const onReadOpenChange = React.useCallback((open: boolean, onDismiss: () => void) => {
    if (open) return;
    if (pending.current === "sign") {
      setReadOpen(false);
      return;
    }
    pending.current = "dismiss";
    setReadOpen(false);
    onDismiss();
  }, []);

  const onSignOpenChange = React.useCallback((open: boolean, onDismiss: () => void) => {
    if (open) return;
    if (pending.current === "read") {
      setSignOpen(false);
      return;
    }
    pending.current = "dismiss";
    setSignOpen(false);
    onDismiss();
  }, []);

  const onReadCloseAutoFocus = React.useCallback(
    (event: Event, onReturnFocus: () => void) => {
      event.preventDefault();
      if (pending.current === "sign") {
        pending.current = null;
        setSignOpen(true);
        return;
      }
      /* The next overlay is already up — do not send focus back to the page. */
      if (signOpenRef.current) return;
      pending.current = null;
      onReturnFocus();
    },
    [],
  );

  const onSignCloseAutoFocus = React.useCallback(
    (event: Event, onReturnFocus: () => void) => {
      event.preventDefault();
      if (pending.current === "read") {
        pending.current = null;
        setReadOpen(true);
        return;
      }
      if (readOpenRef.current) return;
      pending.current = null;
      onReturnFocus();
    },
    [],
  );

  return {
    readOpen,
    signOpen,
    goToSign,
    goToRead,
    onReadOpenChange,
    onSignOpenChange,
    onReadCloseAutoFocus,
    onSignCloseAutoFocus,
  };
}

/**
 * The item the overlays are showing, kept after the parent has cleared it so the
 * closing dialog still has something to render through its exit animation.
 */
export function useHeld<T>(value: T | null): T | null {
  const ref = React.useRef(value);
  if (value !== null) ref.current = value;
  return value ?? ref.current;
}
