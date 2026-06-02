# DOCX Export QA Hardening 4D-2

## Purpose

Sprint 4D-2 hardens the DOCX Export MVP without expanding scope. The export remains an MVP draft-only artifact, not final manuscript approval, not APA-final output, and not publication-ready.

## Test Coverage Added

Rust tests now validate:

- generated file has a `.docx` extension
- generated file is written under the controlled export directory supplied to the exporter
- generated ZIP contains `[Content_Types].xml`
- generated ZIP contains `_rels/.rels`
- generated ZIP contains `word/document.xml`
- `word/document.xml` contains the document title
- `word/document.xml` contains the draft-only notice
- `word/document.xml` contains section heading and body text
- `word/document.xml` contains citation placeholder notes
- `word/document.xml` contains the evidence trace appendix
- `word/document.xml` contains export metadata
- blocked packages return `exported: false`
- blocked packages do not write a `.docx` file
- XML special characters are escaped
- unsafe or empty titles fall back to a safe filename
- empty optional section arrays do not crash the exporter

## Blocked Export Behavior

When the export package is blocked, the Rust command returns a blocked result with readable blockers and does not create a DOCX file.

## XML Escaping And Filename Safety

The MVP writer escapes XML-sensitive characters in title, heading, paragraph, warning, and metadata text. File names are created from a conservative ASCII slug plus timestamp. If the title cannot produce a safe slug, ATP uses `atp-draft-export`.

## UI QA

Playwright continues to verify:

- DOCX Export Package Preview renders
- MVP export action appears
- MVP-only notice is visible
- export result appears in QA mode
- exported file path is displayed without relying on OS-specific paths
- prior Source Library persistence QA remains stable

## Known Limitations

- DOCX styling remains minimal.
- Citation placeholders are not final APA citations.
- DOCX page numbers remain untrusted.
- No save dialog exists yet.
- No export artifact registry exists yet.
- No citation manager integration exists yet.

## Next Recommended Sprint

Sprint 4D-3 should perform manual/open-file QA on the generated DOCX and decide whether to add an export artifact registry, a save dialog, or a richer WordprocessingML styling layer. APA finalization should remain a separate sprint.
