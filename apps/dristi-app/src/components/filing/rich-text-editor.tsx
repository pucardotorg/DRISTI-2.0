"use client";

import * as React from "react";
import {
  AlignLeftIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Command = "bold" | "italic" | "insertOrderedList" | "insertUnorderedList" | "justifyLeft";

const TOOLS: { cmd: Command; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { cmd: "bold", label: "Bold", icon: BoldIcon },
  { cmd: "italic", label: "Italic", icon: ItalicIcon },
  { cmd: "insertOrderedList", label: "Numbered list", icon: ListOrderedIcon },
  { cmd: "insertUnorderedList", label: "Bulleted list", icon: ListIcon },
  { cmd: "justifyLeft", label: "Align left", icon: AlignLeftIcon },
];

/**
 * Small rich text editor for prayer / affidavit / other-details copy. Stores HTML.
 * Uses the browser's editing commands — enough for bold, italic and lists.
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here",
  ariaLabel,
  minHeightClassName = "min-h-40",
  className,
  id,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  minHeightClassName?: string;
  className?: string;
  id?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const lastValue = React.useRef<string>("");

  // Only write into the DOM when the incoming value differs from what we last emitted,
  // so the caret is not reset on every keystroke.
  React.useEffect(() => {
    if (!ref.current) return;
    if (value !== lastValue.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value || "";
    }
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    lastValue.current = html;
    onChange(html);
  };

  const run = (cmd: Command) => {
    ref.current?.focus();
    document.execCommand(cmd, false);
    emit();
  };

  const empty = !value || value === "<br>" || value === "<p></p>";

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-input bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        className
      )}
    >
      {/* Five packed controls: the buttons stay 36px so the strip reads as chrome, and
          `after:-inset-1` grows each hit area to 44px. The gap is 8px so those boxes
          meet rather than overlap. */}
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex items-center gap-2 border-b border-hairline bg-surface-sunken px-2 py-1"
      >
        {TOOLS.map((t) => (
          <Button
            key={t.cmd}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(t.cmd)}
            className="relative after:absolute after:-inset-1"
          >
            <t.icon className="size-4" aria-hidden />
          </Button>
        ))}
      </div>
      <div className="relative">
        {empty ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-4 top-3 text-body-compact text-muted-foreground"
          >
            {placeholder}
          </span>
        ) : null}
        <div
          id={id}
          ref={ref}
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          className={cn(
            "prose-p:my-2 px-4 py-3 text-body-compact leading-relaxed text-foreground outline-none [&_li]:ml-4 [&_ol]:list-decimal [&_p]:mb-3 [&_p:last-child]:mb-0 [&_ul]:list-disc",
            minHeightClassName
          )}
        />
      </div>
    </div>
  );
}
