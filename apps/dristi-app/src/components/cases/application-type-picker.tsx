"use client";

import { useId, useMemo, useState } from "react";
import { ArrowRightIcon, SearchIcon, XIcon } from "lucide-react";

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
  ItemActions,
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
 * take a type off the screen with no way to tell it had.
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
      <Field className="max-w-2xl">
        <FieldLabel htmlFor={searchId} className="text-body">
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
        <FieldDescription className="text-body-compact">
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
          {typed ? (
            <p className="text-body text-muted-foreground">
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
    <div className="grid gap-4 sm:grid-cols-2">
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
  );
}

/**
 * One card, one chip at most: which type you already chose outranks which one
 * the search liked, since only the first is a fact about your filing.
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
  return (
    <Item asChild variant="outline" className="h-full items-start gap-3 p-4">
      <button
        type="button"
        aria-label={`${guide.label}: ${guide.description}`}
        onClick={() => onChoose(guide.id)}
      >
        <ItemContent className="min-w-0 gap-1.5 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <ItemTitle className="line-clamp-none text-body font-semibold text-foreground">
              {guide.label}
            </ItemTitle>
            {chosen ? (
              <Badge variant="outline">Chosen</Badge>
            ) : lead ? (
              <Badge variant="secondary">Closest match</Badge>
            ) : null}
          </div>
          <ItemDescription className="line-clamp-none text-body-compact text-muted-foreground">
            {guide.description}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="self-center">
          <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden />
        </ItemActions>
      </button>
    </Item>
  );
}
