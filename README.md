
The Rebellion Fists of the Fallen City



Agent Role Clarity

art-direction-agent

description: Defines the visual style, palette, typography and asset list for The Rebellion (UI art, backgrounds, sprite requirements, hit feedback). Use to create the style guide and asset specs the UI and other agents build from.
tools: Read, Write, Edit, Glob, Grep, Bash
the Job
Produce the visual foundation in `design/art/` and `assets/`:
- **Style guide** (`design/art/style-guide.md`): palette with hex values, typography, UI component look (buttons, bars, panels), icon style, do/don't examples.
- **Asset manifest** (`design/art/asset-manifest.md`): every asset needed for Tier 0 with filename, size, format, frame count and owner. Covers UI (bar frames, buttons, panels), Zed animations (idle, walk, jump, light, heavy, hit, KO), one Rust enemy, and one arena background.
- **Hit feedback spec**: hit-stop duration, flash, screenshake and spark effects that make hits feel punchy; readable enemy telegraphs.
- **Placeholder assets**: simple generated shapes/SVG/PNG so other agents can build before final art exists. Use consistent keys so they can be swapped.


menu-ui-agent
the job
Implement the UI that the player sees outside the arena action:
- Main menu / start game
- HUD: player health bar, round timer, wave indicator
- Win and lose screens that show *why* the player won or lost (cleared arena, health depleted, time ran out), with a retry option
- Pause screen

player-agent
description: Builds Zed, the player character, for The Rebellion (Phaser): movement, jump, input handling, and the attack/combo state machine (light/heavy chains, cancel windows, hit stun, block/dodge/parry). Covers the GDD's Player Mechanics and Player Combos agents.
tools: Read, Write, Edit, Glob, Grep, Bash

the job
Own everything Zed does, in `src/player/`:
- **Mechanics**: idle, walk, jump, input handling (keyboard first, gamepad if cheap). Must feel responsive.
- **Combat state machine**: one state machine for light/heavy attacks, combo chains, cancel windows, hit stun, then block, dodge, parry. Tier 0 priority: light, heavy, one 3-hit combo, block. Dodge/parry/juggle go under "Later" unless time remains.
- Attack data (startup/active/recovery frames, damage, hitbox rects) lives in `src/player/moves.js` as plain data so it is tunable without touching logic.
 
 
 the working Crew Agents 
 
 Architeture Diagrams 
 
 Agent roster and ownership
 
<img width="8192" height="1567" alt="Agents Flow" src="https://github.com/user-attachments/assets/8667794c-b501-4399-97aa-3b94e981d49d" />

 This 3 Agent crew is built like Orchestrate of the agent that involved that will run the game. The team lead of the agents  will control the scenes and the main page of the game then the step of the team then controls 
 the flow on how the other agents are built for example Step A is reasonable for the gameplay build  and agents that for game mechanics  then Step B will be involved in the Presentation Polish deals with ui side of the game
 the Menu ui agen that deals with the ui of the menu and the backgrounds, ux-flow-designer looks at the ux of the game  then art direction agent looks assets and design of the whole game.
 then i created Gdd Review read-only to review the changes i will probably make in my gdd 

   Dependencies and run order
 <img width="8192" height="1417" alt="Br Agent Flow-2026-10-05-193155" src="https://github.com/user-attachments/assets/65c6416a-0567-4282-945f-03569c8c3aa4" />
 
 this show the Dependencies on how the agent are running for when you setp C is the GDD review that resolices the gdd gapes before running the agent that setups A. 
 when Setup a runs then setp b will run 


