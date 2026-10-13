# Content pipeline

Generates game content (lore, enemies, levels, dialogue) from the Rebellion GDD and every other document in the project, grounded and validated.

```
every .docx/.pdf/.md/.txt in the repo
   -> 1 ingest    pipeline/ingest.mjs    -> pipeline/corpus/corpus.json + manifest.json
   -> 2 brief     pipeline/brief.mjs     -> pipeline/briefs/<type>.md   (RAG: retrieved GDD passages + schema + rules + engine files)
   -> 3 generate  writer agents          -> content/<type>/*.json
   -> 4 validate  pipeline/validate.mjs  -> errors fed back to the writer (repair loop)
   -> 5 report    content/REPORT.md + content/build/content.json
```

## Run it

| Goal | Command |
|---|---|
| Read all docs, build briefs, validate, report (no model calls) | `npm run content` |
| Same, plus run the four writer agents headlessly (uses `claude -p`) | `npm run content:generate` |
| Only some types, with a focus | `node pipeline/run.mjs --generate --types dialogue --focus "market district"` |
| Preview what would run | `node pipeline/run.mjs --generate --dry-run` |
| Search the GDD corpus | `npm run content:search -- "zed father mural" -k 5` |
| Validate and bundle | `node pipeline/validate.mjs --bundle` |
| Interactive, with the orchestrator agent | ask Claude Code: "use content-director-agent to generate content from the GDD" |

## Agents (`.claude/agents/`)

| Agent | Writes | Needs first |
|---|---|---|
| `content-director-agent` | nothing; runs the pipeline, routes errors, reports | |
| `lore-writer-agent` | `content/lore/` | |
| `enemy-designer-agent` | `content/enemies/` | |
| `level-designer-agent` | `content/levels/` | lore, enemies |
| `dialogue-agent` | `content/dialogue/` | lore, enemies |
| `critic-agent` (existing) | wording fixes only | any content |

## How grounding works

- **Reads everything.** Ingest walks the whole repo (skipping `.git`, `node_modules`, `.claude`, `pipeline`, `content`, `assets`), reads `.docx` (zip + XML, tables included), `.pdf` (needs `pdftotext`), `.md`, `.txt`. `manifest.json` lists every file and whether it was read or skipped, and why. Drop a new doc in the repo and the next run picks it up.
- **Authority.** `GameDesignDocument/` is *primary*, `design/` is *derived*, everything else is *reference* (`pipeline/config.mjs`). Retrieval ranks primary first, and briefs tell writers to prefer it.
- **Citations.** Every content item lists `sources` (chunk ids like `the-rebellion#8`). The validator rejects ids that are not in the corpus.
- **No silent invention.** Items are `canon` (stated in the GDD) or `proposed` (an extension, with a `gddGap` note). `content/REPORT.md` lists every proposal for the owner to approve.
- **Canon rules enforced in code.** `pipeline/schemas.mjs` bans "Rush", "Fallen" alone, Rust-as-a-place, gore, killing words, military and gloating copy, and bounds enemy stats and wave numbers. Level waves must reference real enemies; districts must reference real lore.

## Extending

- New content type: add an entry in `pipeline/config.mjs` (`CONTENT_TYPES`), a schema and validator in `schemas.mjs` / `validate.mjs`, and a writer agent.
- Tune house rules in `LORE_RULES` (`schemas.mjs`).
- The GDD pitch contains the typo "Rush". The corpus keeps the source verbatim; only generated content is checked.
- Generated content is data only. Adopting it into `src/` (e.g. `waveData.js`) is a separate, owner-approved step for the build agents.
