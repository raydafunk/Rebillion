# Level style guides

One style guide and one agent per level. The owner gives each agent the look of its level; the agent writes the guide, the style file and the art.

| # | Level | Agent | Guide |
|---|---|---|---|
| 1 | Brick-Red Alley | `level-style-01-brick-red-alley-agent` | [level-01-brick-red-alley.md](level-01-brick-red-alley.md) |
| 2 | Mustard Row | `level-style-02-mustard-row-agent` | [level-02-mustard-row.md](level-02-mustard-row.md) |
| 3 | Greenline Courts | `level-style-03-greenline-courts-agent` | [level-03-greenline-courts.md](level-03-greenline-courts.md) |
| 4 | Stewpot Gardens | `level-style-04-stewpot-gardens-agent` | [level-04-stewpot-gardens.md](level-04-stewpot-gardens.md) |
| 5 | Songwindow Heights | `level-style-05-songwindow-heights-agent` | [level-05-songwindow-heights.md](level-05-songwindow-heights.md) |
| 6 | The Iron Line Push | `level-style-06-iron-line-push-agent` | [level-06-iron-line-push.md](level-06-iron-line-push.md) |
| 7 | Copper Fang at the Courts | `level-style-07-copper-fang-courts-agent` | [level-07-copper-fang-courts.md](level-07-copper-fang-courts.md) |
| 8 | The Overseer's Tower | `level-style-08-overseer-tower-agent` | [level-08-overseer-tower.md](level-08-overseer-tower.md) |

## How a level's style reaches the game
1. `content/levels/styles/<level-id>.json` holds `background.path` (1920x720 SVG/PNG, or null for the shared placeholder) and an optional colour `overlay`.
2. The menu loads these with the level files; the arena loads the background for the level being played.
3. Levels are side-scrolling: the background repeats along the whole level, so art should tile left to right.
4. Until an agent sets a style, each level shows the placeholder arena with a faint wash of its first palette colour.

## Using an agent
Start the agent for the level and give it your direction, for example: "Level 2, Mustard Row: late-afternoon gold light, striped awnings, busy market, record shop." Check a level in the browser at `/?level=N`.

Shared rules live in `design/art/style-guide.md`; the agents follow them.
