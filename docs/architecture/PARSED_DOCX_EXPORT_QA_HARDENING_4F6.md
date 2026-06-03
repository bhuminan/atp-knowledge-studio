# Parsed DOCX Export QA Hardening 4F-6

## Purpose

Sprint 4F-6 hardens parsed-DOCX DOCX MVP export verification without expanding export features. It adds explicit verification summary behavior for blocked, needs-review, and ready package states, plus QA coverage for MVP-only and manual verification warnings.

## Export Verification Rules

- Report parsed-DOCX export package status.
- Report whether export has not run, exported, or is blocked.
- Report file name, path, file size, and timestamp availability when an export result exists.
- Keep warning counts visible before and after export.
- Confirm citation placeholder warnings remain visible.
- Confirm DOCX page-number warnings remain visible.
- Keep manual verification warning visible: "Verify this DOCX manually before academic use."

## Blocked And Needs-Review Behavior

- Blocked packages must keep the export button disabled or return a blocked result.
- Blocked packages must not imply export success.
- Needs-review packages may only use existing DOCX MVP behavior for inspection output.
- Needs-review output still carries citation placeholder, page-number, and draft-only warnings.

## MVP-Only Limitation

Parsed-DOCX export remains an MVP inspection artifact. It is not polished prose, not APA-final, and not publication-ready.

## Manual Verification Requirement

Every parsed-DOCX export result requires manual review before academic use. File metadata alone is not academic validation, citation validation, page-number verification, or final manuscript approval.

## No Final Manuscript Rule

This sprint does not add final manuscript save, APA finalizer, citation manager, auto-export, AI/API generation, PDF/OCR, or database migrations.

## Next Recommended Step

Run Documentation Checkpoint 4F to update handoff, technical status, architecture decisions, and current export limitations before starting any new feature sprint.
