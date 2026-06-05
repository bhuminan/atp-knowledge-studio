# ATP Next Sprint Priorities 4P-11X

## Recommended Must-Have Next Sprint

1. Source Library / navigation UX simplification plan.
2. 4-room frontstage IA: Library, Cabinet, Writer, Art.
3. Hide backend/audit/status panels by default.
4. Make Source Library a review desk, not a backend console.
5. Simplify Writer screen around one primary writing task.
6. Move backend trust details to progressive disclosure / Advanced details.
7. Preserve backend trust boundaries while reducing visual noise.

## Why This Should Come Next

The app now has a strong safety foundation, but the user-facing workflow is
hard to parse. Adding more functionality before simplifying IA will likely make
Source Library and Writer Studio feel even more complex.

The next sprint should produce an IA and screen hierarchy that answers:

- What is the user's primary task here?
- What object is currently selected?
- What is safe to do next?
- Where are advanced trust/audit details hidden?

## Can Wait

- Active metadata editing UI.
- Active metadata save from UI.
- SourceCard creation.
- Citation-ready verification.
- APA-final verification.
- Parser/classification integration.
- AI/provider lookup.
- KnowledgeCard generation.
- Writer DOCX export integration from this path.
- Visual polish details after IA is fixed.

## Safety Boundary To Preserve

Do not loosen these boundaries during UX simplification:

- SourceDocument-only intake save remains explicit.
- SourceCard creation remains deferred.
- Citation-ready and APA-final states are not inferred.
- Parser/classification/AI/provider work remains gated.
- Audit/read-back evidence remains available, but not frontstage by default.

## Suggested Sprint Output

A safe next sprint could produce:

- a 4-room navigation proposal
- Source Library review desk wireframe
- Writer Studio primary-task wireframe
- Advanced/Inspector disclosure model
- rules for what belongs frontstage vs backstage
- no runtime behavior changes until design is reviewed
