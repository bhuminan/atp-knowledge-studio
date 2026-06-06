# ATP Dashboard Asset Integration 4M2

## Purpose

4M-2 replaces the dashboard's temporary artwork-slot placeholders with real PNG room assets. The dashboard remains desktop-first, calm, input-dominant, and focused on helping users understand where daily source intake starts.

## Relationship To 4M-1

4M-1 established the four-room hierarchy and demoted technical dashboard content. 4M-2 keeps that structure but stops relying on CSS-drawn placeholder scenes. Real room artwork now carries the visual mood.

## Assets Integrated

- `src/assets/dashboard/dashboard_input_room.png`
- `src/assets/dashboard/room_cabinet.png`
- `src/assets/dashboard/room_writer.png`
- `src/assets/dashboard/room_art.png`

## Dashboard Structure

- INPUT remains the dominant hero room and routes to Source Library.
- CABINET remains a secondary room and routes to Source Library as a safe temporary path.
- WRITER remains a secondary room and routes to Writer Studio.
- ART remains a secondary planned room and routes to the Visual Studio placeholder.

## Visual Rules

- The PNG assets are the main visual surfaces.
- Overlay content is minimal: room label, one short description, and one compact action.
- The room grid stretches to fill the desktop viewport so the dashboard does not end in an empty lower area.
- Image panels use the available room-card height so INPUT reads as a full main room and secondary rooms still show meaningful artwork.
- Header counters remain compact and sample-based.
- System details remain collapsed.
- Provider cards, workflow board, and long agent rail do not return to the first viewport.

## Scope Protection

No backend, Rust, schema, migration, persistence, parser, DOCX export, AI/API, provider/network, dependency, package, Cargo, citationText, APA-final, or Source Library behavior changed.

## Remaining Limitations

- CABINET still routes to Source Library until a dedicated Knowledge Vault view exists.
- ART still routes to the existing Visual Studio placeholder.
- The room images are static visual surfaces; they do not imply live automation or new backend behavior.
