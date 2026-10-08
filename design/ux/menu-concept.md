# Main Menu Concept: Wheatpaste Wall (source brief, from the user)

## Concept
The main menu presents the player at the edge of a fallen city block at dusk. Menu options are wheatpasted paper posters stuck to a brick wall. It supports the Rebellion tone: grassroots, hand-made, defiant, and still hopeful. It fits the GDD theme (lived-in, human, culturally rich) and palette (mustard yellow, brick red, forest green, warm browns).

## Scene layout
- **Left (about half the screen): brick wall.** Red brick with a dark ledge at the base, a boarded door, a fire escape on the building beside it, and green vines along the bottom. The posters and menu sit here.
- **Right: city street at dusk.** A mustard-and-orange sky with a low sun, layered building silhouettes, and a dark street with yellow lane dashes and a street lamp.
- **Buildings:** Window grids with a few lit in mustard. Rooftops carry a water tank, an antenna, a rooftop hut and vents, with wires strung between them. Ground floors have four shopfronts with striped awnings, one with a sign. A fire escape is drawn on one tower.

## Menu elements

| Element | Description |
|---|---|
| Title | "THE REBELLION" in heavy condensed type, cream on a black strip, tilted about 2 degrees. The subtitle "Fists of the Fallen City" sits beneath in mustard monospace. |
| Fight (selected) | Mustard torn-paper strip, leading ">" marker, straightens and slides right. Starts the game. |
| Controls | Cream paper strip |
| Options | Forest-green strip with cream text. |
| Quit | Warm-brown strip with cream text. |
| Footer hint | "W/S select / Enter confirm", bottom right. |

Each option is a separate torn-edge paper strip, tilted slightly. The selected option straightens, moves right and takes the brightest colour. Hover gives the same feedback.

## Background posters (non-interactive)
- "Local Heroes Benefit: Keep the Lights On": cream, forest-green text. Ties back to the original Local Heroes Mural idea.
- Rust Notice 114, "CURFEW" struck through: brick red. It shows the Rust security force's control and the community defacing it.

## Visual style
- Flat shapes with torn, uneven edges (clip-path style); no gradients or glow.
- Heavy condensed display type for titles and buttons, monospace for small print.
- Palette: brick red #9C3B2E / #7A2F25, mustard #E1A92B, forest green #2F5D3A, warm brown #6B4A2F, cream #E8DCC0, near-black #1D1A16.

## Implementation notes (Phaser)
- Background as 3 parallax layers: sky and sun, far and near buildings, brick wall foreground. The street strip can be reused as the arena floor backdrop.
- Posters and buttons as sprites with irregular alpha edges; a handful of torn-edge shapes can be tinted and reused.
- Selection: tween rotation to 0 and x +10px (about 100 ms); swap to the bright colour variant.
- Keyboard (W/S, Enter) is primary; mouse hover and click should match.
- Placeholder only: the mock up uses stand-in fonts and flat SVG shapes; final art comes from the Art Direction agent.
