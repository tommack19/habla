# Carlos Character Guide

Carlos has one canonical appearance. The visual reference belongs at:

`assets/reference/carlos-character-sheet.png`

The character sheet is a design and image-generation reference only. Never render the full sheet in the app, crop production artwork from it, or use it as a runtime fallback.

The character sheet is the single source of truth for Carlos's identity. New
artwork must use it as the primary identity reference rather than averaging
faces from multiple episode images. Existing scene artwork may be used only as
a composition, lighting, or wardrobe reference.

All production artwork must use an individual PNG or WebP file and be registered in `js/data/carlosAssets.js`.

New Carlos artwork must preserve:

- Thick, dark, wavy hair with a slightly tousled shape.
- Warm brown eyes, expressive brows, and the canonical face shape.
- The same warm skin tone and late-twenties appearance.
- A dark green, cream, navy, and neutral wardrobe palette.
- A friendly, patient, encouraging presence.
- The same premium 3D animated visual style.

Identity-sensitive generation or editing must preserve the scene and change
only Carlos when correcting drift. Other named characters, props, camera
framing, and story actions should remain unchanged.

Use WebP for opaque production artwork where practical. Keep PNG for transparent character cutouts. Use consistent dimensions for assets serving the same UI role.
