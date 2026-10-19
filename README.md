# GOAL-ORIENTED CODING AGENT

set up the blackboard that runs the  Shared workspace for the goal-oriented agents. Agents never message each other. They read the board, claim a goal they own, post a fact, and mark the goal done.


## Goal chain

G1 read-gdd ----\
                 >-- G3 find-gaps -- G4 prioritise -- G5 generate-code -- G6 review
G2 scan-code ---/                                          ^                  |
                                                           +---- fail --------+
