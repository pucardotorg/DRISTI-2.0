"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRightIcon, SearchIcon, XIcon } from "lucide-react";

import { PANEL_CLASS } from "@/components/shell/panel";
import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  APPLICATION_TYPE_MATCH_FLOOR,
  searchApplicationTypes,
  type ApplicationTypeGuide,
} from "@/lib/cases/application-type-guide";
import { type ApplicationTypeId } from "@/lib/cases/applications";
import { cn } from "@/lib/utils";

/**
 * Step one of Raise application: pick what you are asking the court for.
 *
 * The eight types are cards, not a list of names, because the name alone is
 * not the choice — "Condonation of delay" tells a first-time filer nothing,
 * and picking wrong costs them a whole form. Each card says what that type
 * asks for; choosing one is what advances to its fields.
 *
 * The search reads a plain sentence and ranks the cards against it, rather
 * than filtering: it re-orders, it never hides. A wrong guess would otherwise
 * take a type off the screen with no way to tell it had. It sits centred above
 * the grid because it is the screen's one entry point — everything below it is
 * the same eight cards in a different order.
 */
export function ApplicationTypePicker({
  value,
  onChoose,
}: {
  /** The type already chosen, when returning here to change it. */
  value: ApplicationTypeId | "";
  onChoose: (type: ApplicationTypeId) => void;
}) {
  const searchId = useId();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchApplicationTypes(query), [query]);
  const matched = results.filter(
    (result) => result.score >= APPLICATION_TYPE_MATCH_FLOOR
  );
  const others = results.filter(
    (result) => result.score < APPLICATION_TYPE_MATCH_FLOOR
  );
  const typed = query.trim().length > 0;
  const ranked = typed && matched.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <Field className="mx-auto max-w-2xl">
        <FieldLabel
          htmlFor={searchId}
          className="w-full justify-center text-center text-body"
        >
          What do you need from the court?
        </FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            id={searchId}
            value={query}
            placeholder="I want to settle this case"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
          {typed ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="Clear what you typed"
                onClick={() => setQuery("")}
              >
                <XIcon aria-hidden />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <FieldDescription className="text-center text-body-compact">
          Say it in your own words. The closest application type moves to the
          top — every type stays listed.
        </FieldDescription>
      </Field>

      {/* The re-ordering is visual; this is how it reaches a screen reader. */}
      <p aria-live="polite" className="sr-only">
        {typed
          ? ranked
            ? `${matched.length} of ${results.length} application types match what you typed. ${matched[0].guide.label} is the closest.`
            : "No application type matches what you typed. All types are listed."
          : ""}
      </p>

      {ranked ? (
        <>
          <TypeSection
            title={matched.length === 1 ? "Closest match" : "Closest matches"}
            guides={matched.map((result) => result.guide)}
            value={value}
            leadId={matched[0].guide.id}
            onChoose={onChoose}
          />
          {others.length > 0 ? (
            <TypeSection
              title="Other types"
              guides={others.map((result) => result.guide)}
              value={value}
              onChoose={onChoose}
            />
          ) : null}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Centred with the search: this is the search answering back. */}
          {typed ? (
            <p className="mx-auto max-w-2xl text-center text-body text-muted-foreground">
              Nothing matched that. Pick a type below — Others takes anything
              the seven before it do not cover.
            </p>
          ) : null}
          <TypeGrid
            guides={results.map((result) => result.guide)}
            value={value}
            onChoose={onChoose}
          />
        </div>
      )}
    </div>
  );
}

function TypeSection({
  title,
  guides,
  value,
  leadId,
  onChoose,
}: {
  title: string;
  guides: ApplicationTypeGuide[];
  value: ApplicationTypeId | "";
  /** The one card the search puts first, chipped so the order is legible. */
  leadId?: ApplicationTypeId;
  onChoose: (type: ApplicationTypeId) => void;
}) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className="text-body font-semibold">
        {title}
      </h2>
      <TypeGrid
        guides={guides}
        value={value}
        leadId={leadId}
        onChoose={onChoose}
      />
    </section>
  );
}

/**
 * Three up, two, then one — measured against the column the cards actually
 * get, not the viewport. The nav rail takes 256px off this screen and folds
 * on its own schedule, so a viewport breakpoint reads the wrong number: at a
 * 900px tablet the rail is still open and the cards have 672px, which a `md:`
 * rule would call desktop. The thresholds below are the widths at which a card
 * still holds its title on one line.
 */
function TypeGrid({
  guides,
  value,
  leadId,
  onChoose,
}: {
  guides: ApplicationTypeGuide[];
  value: ApplicationTypeId | "";
  leadId?: ApplicationTypeId;
  onChoose: (type: ApplicationTypeId) => void;
}) {
  return (
    <div className="@container">
      <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
        {guides.map((guide) => (
          <TypeCard
            key={guide.id}
            guide={guide}
            chosen={guide.id === value}
            lead={guide.id === leadId}
            onChoose={onChoose}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * One card: the ask pictured, then named, then explained.
 *
 * The whole card is the button, so the top line carries no second control —
 * only marks. The icon says which ask this is before the title is read; the
 * arrow says the card goes somewhere, at rest rather than on hover, since a
 * filer on a phone has no hover to discover it with. Between them sits at most
 * one chip: which type you already chose outranks which one the search liked,
 * since only the first is a fact about your filing.
 *
 * Cards lift off the page — hairline edge, raised shadow — rather than sitting
 * as bordered white boxes on white. Height comes from the grid row, so a long
 * label and a short one still square up beside each other.
 */
function TypeCard({
  guide,
  chosen,
  lead,
  onChoose,
}: {
  guide: ApplicationTypeGuide;
  chosen: boolean;
  lead: boolean;
  onChoose: (type: ApplicationTypeId) => void;
}) {
  const Icon = guide.icon;

  return (
    <Item
      asChild
      variant="outline"
      className={cn(
        PANEL_CLASS,
        "h-full flex-col flex-nowrap items-start gap-3 rounded-xl p-6"
      )}
    >
      <button
        type="button"
        aria-label={`${guide.label}: ${guide.description}`}
        onClick={() => onChoose(guide.id)}
      >
        <div className="flex w-full items-center gap-2">
          <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          {chosen ? (
            <Badge variant="outline">Chosen</Badge>
          ) : lead ? (
            <Badge variant="secondary">Closest match</Badge>
          ) : null}
          <ArrowRightIcon
            className="ml-auto size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </div>

        <ItemContent className="w-full min-w-0 gap-2 text-left">
          <ItemTitle className="line-clamp-none w-full text-body font-semibold break-words text-foreground">
            {guide.label}
          </ItemTitle>
          <ItemDescription className="line-clamp-none text-body text-muted-foreground">
            {guide.description}
          </ItemDescription>
        </ItemContent>
      </button>
    </Item>
  );
}
