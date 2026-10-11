# Content pipeline

content-director-agent
description: Orchestrator for The Rebellion's content pipeline. Reads every doc in the project (GDD docx, PDFs, design specs), builds the retrieval corpus and per-type briefs, runs the writer agents (lore, enemies, levels, dialogue) in dependency order, gates on the validator, runs the critic, and reports what needs owner approval. Use when asked to generate or refresh game content from the GDD.

1. Add menu
   after content-director-agent it

Implemented
Move: A/D and arrow keys.
Jump: W, Space or Up, with coyote time and input buffering.
Light attack: J or Z, with a 3-hit chain.
Heavy attack: K or X, cancelable from light 1 and light 2.
Parry: the first 8 frames of a fresh block. The docx gives it no key of its own.
Menu and pause controls: navigation, confirm, mouse, gamepad, Esc/Backspace to close the Controls panel, and restart/main-menu with a confirm step.
RAG Implementation 

told me bout  what is 
the conflict 

The docx binds Dodge to L/C and Block to I/V. The code binds Block to L/C and Dodge to ShiftLeft/V. I is unbound, and V does the opposite of what the docx says.
The fix is in the KEY_MAP in input.js and the WATCHED list in Zed.js.




