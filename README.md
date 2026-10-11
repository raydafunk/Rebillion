# Content pipeline

content-director-agent
description: Orchestrator for The Rebellion's content pipeline. Reads every doc in the project (GDD docx, PDFs, design specs), builds the retrieval corpus and per-type briefs, runs the writer agents (lore, enemies, levels, dialogue) in dependency order, gates on the validator, runs the critic, and reports what needs owner approval. Use when asked to generate or refresh game content from the GDD.

1. Add main for the menu
   after content-director-agent read the pipeline 
   
   <img width="940" height="607" alt="image" src="https://github.com/user-attachments/assets/5c155b38-60bf-435f-a943-cb8a2bd32314" />

   it generated the menu based on my game document and this was the outcome  

2.
 the content-director-agent read the and menu ui agent
made the opitions menu
<img width="400" height="383" alt="image" src="https://github.com/user-attachments/assets/2bde6eed-6979-4483-be17-6977e7f83f3f" />


RAG Implementation 

told me bout  what is 
the conflict 

The docx binds Dodge to L/C and Block to I/V. The code binds Block to L/C and Dodge to ShiftLeft/V. I is unbound, and V does the opposite of what the docx says.
The fix is in the KEY_MAP in input.js and the WATCHED list in Zed.js.




