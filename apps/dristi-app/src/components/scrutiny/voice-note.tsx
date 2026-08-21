"use client";

/**
 * The officer's spoken remark, as a single row.
 *
 * The design system has no audio primitive — verified against the whole of
 * `src/components/ui` (68 components: no `audio`, no `media`, no `player`). So this is
 * *composed* from what the system does have, per the brief's D10, and deliberately not
 * generalised: `Attachment` for the row, an icon `Button` for the transport, `Slider` as
 * the scrub track, `tabular-nums` for the times, `Collapsible` for the transcript. The
 * DS request to systematise it is filed (brief §13, request 1).
 *
 * Accessibility, which is why the transcript is not optional furniture: WCAG 2.1 AA
 * requires a text alternative for prerecorded audio-only content (1.2.1). A voice note
 * therefore never carries a defect's meaning alone — the written note sits above it, and
 * the transcript is one disclosure away. The transport is a real button at the DS 40px
 * metric, and the scrub is the DS Slider, so both are keyboard-operable.
 *
 * Sandbox: no audio file is fetched. Playback is simulated on a timer at real speed, so
 * the row behaves — and can be tested — exactly as it will when a file is behind it.
 */

import * as React from "react";
import { ChevronDownIcon, MicIcon, PauseIcon, PlayIcon } from "lucide-react";

import type { VoiceNote as VoiceNoteData } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import {
  Attachment,
  AttachmentContent,
  AttachmentMedia,
} from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";

const TICK_MS = 100;

function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VoiceNoteRow({ note, className }: { note: VoiceNoteData; className?: string }) {
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((ms) => {
        const next = ms + TICK_MS;
        if (next >= note.durationMs) {
          setPlaying(false);
          return note.durationMs;
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, note.durationMs]);

  const toggle = () => {
    if (!playing && elapsed >= note.durationMs) setElapsed(0);
    setPlaying((p) => !p);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* A flat card on the tinted feedback well — the well is already the recessed
          layer, so this does not lift again. */}
      <Attachment
        size="sm"
        className="w-full min-w-0 rounded-md border-hairline shadow-none has-data-[slot=attachment-content]:py-1.5"
      >
        <AttachmentMedia className="bg-surface-sunken text-muted-foreground">
          <MicIcon aria-hidden />
        </AttachmentMedia>
        <AttachmentContent className="min-w-0 flex-1 gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label={playing ? "Pause the spoken remark" : "Play the spoken remark"}
              className="-ml-1 shrink-0"
            >
              {playing ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
            </Button>
            <Slider
              value={[Math.min(elapsed, note.durationMs)]}
              max={note.durationMs}
              step={TICK_MS}
              onValueChange={([v]) => setElapsed(v ?? 0)}
              aria-label="Position in the spoken remark"
              className="min-w-16 flex-1"
            />
            <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
              {clock(elapsed)} / {clock(note.durationMs)}
            </span>
          </div>
        </AttachmentContent>
      </Attachment>

      {note.transcript ? (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="group/tr w-fit text-muted-foreground hover:text-foreground"
            >
              <ChevronDownIcon
                data-icon="inline-start"
                aria-hidden
                className="transition-transform group-data-[state=open]/tr:rotate-180"
              />
              Read the transcript
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="px-2 pt-2 text-body-compact text-muted-foreground">
              {note.transcript}
            </p>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </div>
  );
}
