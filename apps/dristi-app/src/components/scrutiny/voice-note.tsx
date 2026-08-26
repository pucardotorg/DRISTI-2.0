"use client";

/**
 * The officer's spoken remark — a play control, a waveform, and the transcript.
 *
 * The design system has no audio primitive (verified across `src/components/ui`: no
 * `audio`, no `media`, no `player`), so this is *composed* from what the system does have,
 * per the brief's D10: `Button` for the transport, `Slider` for the scrub, `tabular-nums`
 * for the times. The DS request to systematise it is filed (brief §13, request 1).
 *
 * The waveform is the scrub's *track*, not a control of its own. The DS `Slider` is laid
 * over the bars with its own track and range made transparent — so every keyboard and
 * screen-reader behaviour still comes from the primitive, and the bars are `aria-hidden`
 * decoration showing where in the remark you are. Forking the Slider to draw bars inside
 * it would have meant owning a primitive; this borrows one.
 *
 * Accessibility, which is why the transcript is not furniture: WCAG 2.1 AA requires a text
 * alternative for prerecorded audio-only content (1.2.1). A voice remark and a typed note
 * are alternatives to each other — an officer leaves one or the other — so when the remark
 * is the message, its transcript is shown *inline and always*, never behind a disclosure.
 *
 * Sandbox: no audio file is fetched. Playback is simulated on a timer at real speed, so the
 * row behaves — and can be tested — exactly as it will when a file is behind it.
 */

import * as React from "react";
import { PauseIcon, PlayIcon } from "lucide-react";

import type { VoiceNote as VoiceNoteData } from "@/lib/tasks/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const TICK_MS = 100;

/** How many bars the waveform draws. Enough to read as speech, few enough to stay crisp. */
const BARS = 56;

function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * A speech-shaped envelope, derived from the remark itself so it is stable across renders
 * and honest per note — the same remark always draws the same wave.
 *
 * Real speech is neither a flat block nor white noise: it runs in syllables, so the height
 * is a smoothed random walk (the neighbour average is what removes the spiky, "generated"
 * look) held off the floor and dipped at the very ends, where a recording opens and closes
 * on near-silence.
 */
function envelope(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const next = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };

  const raw = Array.from({ length: BARS }, () => next());
  return raw.map((_, i) => {
    /* Smooth against both neighbours: syllables, not static. */
    const window = [raw[i - 1] ?? raw[i], raw[i], raw[i + 1] ?? raw[i]];
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    /* Fade the first and last few bars — a recording starts and ends quiet. */
    const edge = Math.min(i, BARS - 1 - i);
    const fade = edge < 4 ? 0.4 + edge * 0.15 : 1;
    return Math.round((0.22 + mean * 0.78) * fade * 100);
  });
}

export function VoiceNoteRow({ note, className }: { note: VoiceNoteData; className?: string }) {
  const [playing, setPlaying] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const scrub = React.useRef<HTMLDivElement>(null);

  const bars = React.useMemo(() => envelope(note.id), [note.id]);

  /**
   * The scrub reports milliseconds, so a screen reader would announce "26000" for
   * twenty-six seconds. `aria-valuetext` is what turns a raw number into the thing it
   * measures — and it has to go on the thumb, which is where the `slider` role lives. The
   * DS `Slider` owns its thumbs, so this sets the attribute on the rendered node rather
   * than forking the primitive to add a prop.
   */
  React.useEffect(() => {
    const thumb = scrub.current?.querySelector<HTMLElement>("[data-slot=slider-thumb]");
    if (!thumb) return;
    thumb.setAttribute("aria-valuetext", `${clock(elapsed)} of ${clock(note.durationMs)}`);
    thumb.setAttribute("aria-label", "Position in the spoken remark");
  }, [elapsed, note.durationMs]);

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

  const played = note.durationMs ? Math.min(elapsed / note.durationMs, 1) : 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3 rounded-md bg-surface-sunken p-2.5">
        <Button
          type="button"
          variant="default"
          size="icon"
          onClick={toggle}
          aria-label={playing ? "Pause the spoken remark" : "Play the spoken remark"}
          className="size-9 shrink-0 rounded-full"
        >
          {playing ? <PauseIcon aria-hidden /> : <PlayIcon aria-hidden />}
        </Button>

        {/* The waveform and the scrub occupy the same box: bars behind, DS Slider over. */}
        <div className="relative min-w-16 flex-1">
          <div aria-hidden className="flex h-8 items-center gap-px">
            {bars.map((height, i) => (
              <span
                key={i}
                style={{ height: `${height}%` }}
                className={cn(
                  "min-w-0 flex-1 rounded-full transition-colors",
                  i / BARS < played ? "bg-primary" : "bg-track"
                )}
              />
            ))}
          </div>
          <Slider
            ref={scrub}
            value={[Math.min(elapsed, note.durationMs)]}
            max={note.durationMs}
            step={TICK_MS}
            onValueChange={([v]) => setElapsed(v ?? 0)}
            /* The bars *are* the track, so the primitive's own track and range stand
               down. Everything else about it — roles, keys, focus — is untouched. */
            className={cn(
              "absolute inset-0 h-full w-full",
              "[&_[data-slot=slider-track]]:h-full [&_[data-slot=slider-track]]:bg-transparent",
              "[&_[data-slot=slider-range]]:bg-transparent"
            )}
          />
        </div>

        <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
          {clock(elapsed)} / {clock(note.durationMs)}
        </span>
      </div>

      {/* Always present, never disclosed: when the remark is the message, the words are
          the alternative to it (WCAG 1.2.1) and most people read faster than they listen. */}
      {note.transcript ? (
        <p className="border-l-2 border-hairline pl-3 text-body-compact text-muted-foreground">
          {note.transcript}
        </p>
      ) : null}
    </div>
  );
}
