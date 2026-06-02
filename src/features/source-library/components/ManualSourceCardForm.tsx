import type { FormEvent } from "react";
import { useState } from "react";
import type { SourceCard } from "../../../types/domain";
import {
  EditorField,
  EditorSelect,
  EditorTextarea
} from "./SourceLibraryPrimitives";

type ManualSourceFormState = Pick<
  SourceCard,
  | "title"
  | "year"
  | "sourceType"
  | "publisherOrJournal"
  | "citationText"
  | "apa7Status"
  | "reliabilityLevel"
  | "notes"
> & {
  authorsInput: string;
};

const manualSourceDefaults: ManualSourceFormState = {
  title: "",
  authorsInput: "",
  year: "",
  sourceType: "PDF",
  publisherOrJournal: "",
  citationText: "[DRAFT - manual source, verification required]",
  apa7Status: "needs_review",
  reliabilityLevel: "unknown",
  notes:
    "Local manual source card. No persistence, no file parsing, no verified citation."
};

export function ManualSourceCardForm({
  onAddSourceCard
}: {
  onAddSourceCard: (sourceCard: SourceCard) => void;
}) {
  const [formState, setFormState] =
    useState<ManualSourceFormState>(manualSourceDefaults);

  function updateFormField<Key extends keyof ManualSourceFormState>(
    field: Key,
    value: ManualSourceFormState[Key]
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [field]: value
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const sourceId = `manual-source-${Date.now()}`;
    const title = formState.title.trim() || "Untitled manual source card";
    const authors = splitAuthorsInput(formState.authorsInput);
    const manualSourceCard: SourceCard = {
      sourceId,
      title,
      authors,
      year: formState.year.trim(),
      sourceType: formState.sourceType,
      publisherOrJournal: formState.publisherOrJournal.trim(),
      citationText:
        formState.citationText.trim() ||
        "[DRAFT - manual source, verification required]",
      apa7Status: formState.apa7Status,
      reliabilityLevel: formState.reliabilityLevel,
      notes:
        formState.notes.trim() ||
        "Local manual source card. No persistence, no file parsing, no verified citation."
    };

    onAddSourceCard(manualSourceCard);
    setFormState(manualSourceDefaults);
  }

  return (
    <form
      className="mt-4 border-t-2 border-studio-line pt-4"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-studio-blue">
            Add Manual Source Card
          </p>
          <p className="mt-1 text-xs font-black uppercase text-studio-gold">
            Local mock only
          </p>
        </div>
        <span className="mock-badge">No persistence</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Creates a local SourceCard only. It is not indexed, parsed, stored, or
        citation-verified.
      </p>

      <div className="mt-4 grid gap-3">
        <EditorField
          label="Title"
          onChange={(value) => updateFormField("title", value)}
          value={formState.title}
        />
        <EditorField
          label="Authors"
          onChange={(value) => updateFormField("authorsInput", value)}
          value={formState.authorsInput}
        />
        <EditorField
          label="Year"
          onChange={(value) => updateFormField("year", value)}
          value={formState.year}
        />
        <EditorSelect
          label="Source type"
          onChange={(value) =>
            updateFormField("sourceType", value as SourceCard["sourceType"])
          }
          options={["PDF", "DOCX", "MD"]}
          value={formState.sourceType}
        />
        <EditorField
          label="Publisher / Journal"
          onChange={(value) => updateFormField("publisherOrJournal", value)}
          value={formState.publisherOrJournal}
        />
        <EditorTextarea
          label="Citation text"
          onChange={(value) => updateFormField("citationText", value)}
          value={formState.citationText}
        />
        <EditorSelect
          label="APA7 status"
          onChange={(value) =>
            updateFormField("apa7Status", value as SourceCard["apa7Status"])
          }
          options={["needs_review", "needs_metadata", "mock", "ready"]}
          value={formState.apa7Status}
        />
        <EditorSelect
          label="Reliability"
          onChange={(value) =>
            updateFormField(
              "reliabilityLevel",
              value as SourceCard["reliabilityLevel"]
            )
          }
          options={["unknown", "low", "medium", "high"]}
          value={formState.reliabilityLevel}
        />
        <EditorTextarea
          label="Notes"
          onChange={(value) => updateFormField("notes", value)}
          value={formState.notes}
        />
      </div>

      <button
        className="mt-4 w-full border-2 border-studio-teal bg-studio-teal/15 px-3 py-3 text-xs font-black uppercase text-studio-teal shadow-pixel"
        type="submit"
      >
        Add local source card
      </button>
    </form>
  );
}

function splitAuthorsInput(value: string): string[] {
  return value
    .split(",")
    .map((author) => author.trim())
    .filter(Boolean);
}
