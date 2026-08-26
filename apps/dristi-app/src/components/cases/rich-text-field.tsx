"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";

import { useFieldControlProps } from "@/components/ui/field";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * Formatted long-form input, composed at screen level.
 *
 * The design system has no rich text editor (see the escalation note in the
 * build report), so this borrows DS chrome rather than inventing any: an
 * InputGroup supplies the bordered well, focus ring and invalid state that
 * Textarea would have given, a block-start addon carries the toolbar, and the
 * toolbar controls are DS ToggleGroups. Nothing under components/ui is edited
 * or forked.
 *
 * The editing surface itself is the piece the DS cannot supply — a
 * contentEditable region driven by document.execCommand. That API is
 * deprecated but still the only dependency-free way to get bold, italic,
 * lists and alignment out of one surface.
 */

/** Both shapes are kept: html renders the formatting, text drives validation. */
export type RichTextValue = {
  html: string;
  text: string;
};

export const EMPTY_RICH_TEXT: RichTextValue = { html: "", text: "" };

type MarkCommand = "bold" | "italic";
type ListCommand = "insertUnorderedList" | "insertOrderedList";
type AlignCommand = "justifyLeft" | "justifyCenter" | "justifyRight";

const MARKS: { command: MarkCommand; label: string; Icon: typeof BoldIcon }[] = [
  { command: "bold", label: "Bold", Icon: BoldIcon },
  { command: "italic", label: "Italic", Icon: ItalicIcon },
];

const LISTS: { command: ListCommand; label: string; Icon: typeof BoldIcon }[] = [
  { command: "insertUnorderedList", label: "Bulleted list", Icon: ListIcon },
  { command: "insertOrderedList", label: "Numbered list", Icon: ListOrderedIcon },
];

const ALIGNMENTS: {
  command: AlignCommand;
  label: string;
  Icon: typeof BoldIcon;
}[] = [
  { command: "justifyLeft", label: "Align left", Icon: AlignLeftIcon },
  { command: "justifyCenter", label: "Align centre", Icon: AlignCenterIcon },
  { command: "justifyRight", label: "Align right", Icon: AlignRightIcon },
];

function commandState(command: string): boolean {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
}

/**
 * Toggling a formatting command is symmetric — execCommand flips it either
 * way — so run whichever entry differs between the old and new selection.
 */
function changedCommands(next: string[], current: string[]): string[] {
  return [...new Set([...next, ...current])].filter(
    (command) => next.includes(command) !== current.includes(command)
  );
}

export function RichTextField({
  value,
  onChange,
  labelId,
  className,
}: {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
  /** The FieldLabel's id — a contentEditable region is not labelable. */
  labelId: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialHtmlRef = useRef(value.html);
  const fieldProps = useFieldControlProps({});
  const [marks, setMarks] = useState<string[]>([]);
  const [lists, setLists] = useState<string[]>([]);
  const [alignment, setAlignment] = useState<AlignCommand>("justifyLeft");

  const syncToolbar = useCallback(() => {
    setMarks(MARKS.map((m) => m.command).filter(commandState));
    setLists(LISTS.map((l) => l.command).filter(commandState));
    setAlignment(
      ALIGNMENTS.find((item) => commandState(item.command))?.command ??
        "justifyLeft"
    );
  }, []);

  const emitChange = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange({ html: editor.innerHTML, text: editor.innerText });
  }, [onChange]);

  // Restore on mount only — rewriting innerHTML while typing eats the caret.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && initialHtmlRef.current) {
      editor.innerHTML = initialHtmlRef.current;
    }
  }, []);

  // Keep the pressed states honest as the caret moves through the content.
  useEffect(() => {
    function handleSelectionChange() {
      if (document.activeElement === editorRef.current) syncToolbar();
    }
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [syncToolbar]);

  function run(commands: string[]) {
    editorRef.current?.focus();
    for (const command of commands) document.execCommand(command);
    emitChange();
    syncToolbar();
  }

  return (
    <InputGroup className={className}>
      <InputGroupAddon
        align="block-start"
        className="flex-wrap gap-2 border-b border-border"
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          editorRef.current?.focus();
        }}
      >
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          value={marks}
          onValueChange={(next: string[]) => run(changedCommands(next, marks))}
          aria-label="Text style"
        >
          {MARKS.map(({ command, label, Icon }) => (
            <ToggleGroupItem
              key={command}
              value={command}
              aria-label={label}
              className="size-10"
            >
              <Icon aria-hidden />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          value={lists}
          onValueChange={(next: string[]) => run(changedCommands(next, lists))}
          aria-label="Lists"
        >
          {LISTS.map(({ command, label, Icon }) => (
            <ToggleGroupItem
              key={command}
              value={command}
              aria-label={label}
              className="size-10"
            >
              <Icon aria-hidden />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/*
          Multiple, not single: ToggleGroup's single mode claims radiogroup
          semantics but its arrow keys only move focus, never select. Toggle
          buttons in a toolbar are the honest reading — and execCommand's
          justify* commands set rather than toggle, so only the newly picked
          one runs and alignment can never be left unset.
        */}
        <ToggleGroup
          type="multiple"
          variant="outline"
          spacing={0}
          value={[alignment]}
          onValueChange={(next: string[]) => {
            const picked = next.find((command) => command !== alignment);
            if (picked) run([picked]);
          }}
          aria-label="Alignment"
        >
          {ALIGNMENTS.map(({ command, label, Icon }) => (
            <ToggleGroupItem
              key={command}
              value={command}
              aria-label={label}
              className="size-10"
            >
              <Icon aria-hidden />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </InputGroupAddon>

      <div
        {...fieldProps}
        ref={editorRef}
        data-slot="input-group-control"
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelId}
        contentEditable
        suppressContentEditableWarning
        className="w-full min-h-64 px-2.5 py-2 text-body outline-none [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
        onInput={emitChange}
        onFocus={syncToolbar}
        onPaste={(event) => {
          // Only ever hold markup this toolbar produced — paste arrives flat.
          event.preventDefault();
          document.execCommand(
            "insertText",
            false,
            event.clipboardData.getData("text/plain")
          );
          emitChange();
        }}
        onDrop={(event) => event.preventDefault()}
      />
    </InputGroup>
  );
}

/**
 * Read-only render of a RichTextField value. Safe because the value can only
 * contain execCommand output — the editor blocks HTML paste and drop.
 */
export function RichTextValueView({
  value,
  className,
}: {
  value: RichTextValue;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: value.html }}
    />
  );
}
