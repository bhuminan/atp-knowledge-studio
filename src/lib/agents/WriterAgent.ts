import type { ProviderAdapter } from "../providers/ProviderAdapter";
import {
  chapterDraftPrompt,
  citationCheckPrompt,
  geminiCoReviewPrompt,
  sectionExpandPrompt,
  writerSystemPrompt
} from "../../prompts/writerPrompts";
import { guardCitations } from "./CitationGuard";
import { validateChapterStructure } from "./StructureValidator";
import type { WriterAgentInput, WriterAgentResult } from "./types";

export async function runWriterAgent(
  input: WriterAgentInput,
  provider: ProviderAdapter
): Promise<WriterAgentResult> {
  const prompt = buildWriterPrompt(input);
  const draftOutput = await provider.complete(prompt, {
    temperature: 0,
    metadata: {
      chapterTopic: input.chapterTopic,
      sectionTitle: input.selectedSection.title,
      sourceCount: input.retrievedSources.length
    }
  });
  const structureValidation = validateChapterStructure(input.allSections);
  const citationFlags = guardCitations(draftOutput, input.retrievedSources);

  return {
    providerName: provider.name,
    promptPreview: prompt.slice(0, 720),
    draftOutput,
    citationFlags,
    structureValidation,
    mockCoReviewStatus:
      "Mock co-review complete: structure is readable, source provenance remains visible, and external Gemini review is disabled.",
    retrievedSourceTitles: input.retrievedSources.map((source) => source.title)
  };
}

function buildWriterPrompt(input: WriterAgentInput): string {
  const sourceBlock = input.retrievedSources
    .map(
      (source) =>
        `- ${source.title} (${source.metadata.author ?? "Author pending"}, ${
          source.metadata.year ?? "Year pending"
        }): ${source.summaryPreview}`
    )
    .join("\n");

  return [
    writerSystemPrompt,
    chapterDraftPrompt.replace("{{topic}}", input.chapterTopic),
    sectionExpandPrompt
      .replace("{{sectionTitle}}", input.selectedSection.title)
      .replace("{{sectionPurpose}}", input.selectedSection.purpose),
    citationCheckPrompt,
    geminiCoReviewPrompt,
    `Style profile: ${input.styleConfig.name}; ${input.styleConfig.tone}; ${input.styleConfig.language}; ${input.styleConfig.citationStyle}`,
    `Retrieved mock sources:\n${sourceBlock}`,
    `Current section draft:\n${input.selectedSection.draftText}`
  ].join("\n\n---\n\n");
}
