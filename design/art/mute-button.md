# Mute button (main menu) - art spec

Owner: art-direction-agent. Implemented by: menu-ui-agent (`src/ui/MenuScene.js`, `src/ui/audioSettings.js`).
Status: PLACEHOLDER art, flat vector per `style-guide.md`. Pending owner approval.

## What it is
One round button that switches ALL game sound (music and effects) off and on. It is separate from the Options sliders and does not change them: un-muting restores the previous levels.

## States
| State | File | Look |
|---|---|---|
| Sound on | `assets/ui/icon-sound-on.svg` | Mustard #E3A92B disc, speaker with two sound waves, Dark Brown #2E1F16 |
| Muted | `assets/ui/icon-sound-off.svg` | Cream #F4E6C8 disc (drained), Warm Brown #6B4423 speaker, Brick Red #A8402E cross |
| Hover / focus | same art, drawn 8 percent larger with a Mustard Light #F2C04D ring | |

Muted reads differently by shape (cross) AND by colour (cream vs mustard), so it does not rely on colour alone.

## Size and position
- Art 64x64 px, drawn at 56x56 on the 1280x720 menu.
- Centre at (1226, 52): top-right corner, clear of the strips (left) and the footer hint (bottom-right).
- 3 px Dark Brown outline (4 px at 64 px art), no gradients, light from top left. A flat 25 percent black ellipse is not used here (it is a UI icon, not a character).

## Keyboard
Q (for quiet) toggles mute on the main menu and the pause screen. Q is not bound to any gameplay action (M is Parry, so it is not used). The key letter is drawn under the button label.

## Keys (assetKeys.js, MENU_ASSETS)
`menu.icon.sound-on`, `menu.icon.sound-off`

## Open questions
1. Final art for the speaker glyph (currently simple shapes).
2. Should the button also appear on the pause screen and HUD? Not done: the request was for the main menu only.
