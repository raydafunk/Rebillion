The Evaluator & Refiner Loop 

systems using 

the Critic Log 

Changes applied (design/lore only)




file                         Line            Before                                                   After                             Rule
1.design/lore/menu-copy.md     menu.footer     "W/S select / Enter confirm" (menu-concept.md:20)        "W/S to choose / Enter to go"     Tone drift: terse, system-speak 
                                                                                                                                        ("confirm") on Zed's side; prefer plain neighbourhood voice


# GOAL-ORIENTED CODING AGENT

set up the blackboard that runs the  Shared workspace for the goal-oriented agents. Agents never message each other. They read the board, claim a goal they own, post a fact, and mark the goal done.


## Goal chain

G1 read-gdd ----\
                 >-- G3 find-gaps -- G4 prioritise -- G5 generate-code -- G6 review
G2 scan-code ---/                                          ^                  |
                                                           +---- fail --------+

Goal | Agent | Reads | Publishes |
|---|---|---|---|
| G1 | `gdd-reader-agent` | `pipeline/corpus/`, GDD docs | `facts/gdd-requirements.json` |
| G2 | `code-scanner-agent` | `src/`, tests, `assets/asset-keys.json` | `facts/code-inventory.json` |
| G3 | `gap-analyst-agent` | G1 + G2 facts | `facts/gaps.json` |
| G4 | `prioritiser-agent` | `facts/gaps.json` | `facts/priorities.json` |
| G5 | `code-generator-agent` | `facts/priorities.json`, `design/team/contracts.md` | code in `src/`, `facts/generated.json` |
| G6 | `reviewer-agent` | `facts/generated.json`, the diff, `npm test` | `facts/review.json` |

FEATURE DOCUMENTATION

Rank 2: GAP-009, menu parallax (menu-ui-agent) 

 i ran the blackboard and the goal agent said i need to  build because the main menu lack animations to it 
 i made changes to the speed and the movement of the backgrounds before accepting the change 

 Rank 3 GAP-027: story intro card
 it find my lore and added a story intro to the fight section from the lore documents i created 
 which comes from the content/lore/ this feature was asked for me to review it then i have it approve then the agent build it 
 the agent suggest it because there was not intro to the story 
