# V2 artwork and fonts

The built-in image generation tool created the new assets; no paid API key or external image hotlink is required. Files are bundled in `public/art`.

| Asset | Purpose |
|---|---|
| `mountain-island-v2.png` | Complete mountain island background, rendered across the expanded world |
| `treasures-v2.png` | Transparent 4 × 2 atlas: doubloon, diamond, chest, boots, shield, relic, magnet, pearl |
| `explorers-v2.png` | Transparent 3 × 2 atlas: fox, frog, raccoon, cat, bear, rabbit |

Atlas frames are extracted by Phaser at runtime. Transparent alpha was checked on both atlas files. Character motion, coin spin, floating rewards, particles, storm effects and waves are animated in code.

## Final prompt set

**Mountain island, using the original cover as a style reference:** An expansive detailed tropical mountain adventure island world map, high near-overhead camera, landscape 8:5. Preserve the cover's turquoise sea, golden sunlight, weathered jungle temples, rocky cliffs and waterfalls. The interior must contain connected broad golden stone trails, temple courtyards, sandy canyons, carved stairs, rocky plateaus, rope bridges, cave mouths and cascades, with no large empty grass plain. Three compact mountain obstacles around normalized positions (32%,39%), (67%,55%), (50%,25%). Broad connected walkable terraces around them. Landing plaza at (50%,81%), accessible relic shrine at (50%,50%), ancient arch in the north, coral coast and southern dock. No characters, treasure, labels or UI, because collectibles are rendered dynamically. Premium painterly 3D-cartoon style.

**Treasure atlas:** Exactly four columns and two rows of equally sized square cells, transparent background, no text/borders. Center each object separately with padding. Premium stylized 3D cartoon pirate adventure art, golden upper-left light, glossy materials, legible small silhouettes. Row 1: embossed star doubloon with small coin stack, turquoise diamond, open ornate gold-trimmed chest overflowing with jewels, leather winged boots. Row 2: ornate teal/gold shield, sun idol with violet gem, red/gold horseshoe magnet, luminous shell holding an iridescent pearl. No overlap, UI, watermark or items outside cells.

**Explorer atlas:** Exactly three columns and two rows of equal square cells, transparent background. Six full-body animal adventurers, consistent scale, overhead three-quarter front, warm golden lighting, friendly faces, running-ready poses. Row 1: orange fox with coral jacket and teal scarf; green frog with teal scarf and tan backpack; gray raccoon pirate with purple tricorn/vest. Row 2: golden explorer cat with ochre hat/turquoise vest; brown bear with green jacket/leather satchel; white rabbit with purple scarf/rose jacket. Each complete silhouette fits its own cell. No text, panels, grids or watermark.

**Final explorer transparency edit:** Remove all colored backgrounds, gradients and backdrop shadows to fully transparent alpha. Retain each complete character's appearance, pose, size and position, including ears, hats and feet. Preserve the existing 3 × 2 grid. No replacement background or checkerboard pixels. Clean antialiased cutouts only.

## Fonts

DM Sans and Outfit are downloaded from Google Fonts and served from `public/fonts`. The corresponding SIL Open Font License files are bundled in that directory. The game no longer requests Google Fonts from players' browsers.
