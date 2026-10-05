# Agent system diagrams (Mermaid)

Sources: `design/team/agent-team-setups.md`, `design/team/contracts.md`, `gdd-review-kit-main/`.

## 1. Agent roster and ownership

```mermaid
flowchart TB
    Lead["Team Lead (main session)<br/>src/scenes/ArenaScene.js, index.html"]

    subgraph A["Setup A: Gameplay Build"]
        combat["combat-agent<br/>Health & Hitbox, Game State<br/>src/combat, src/state, src/shared"]
        player["player-agent<br/>Mechanics, Combos<br/>src/player"]
        encounter["encounter-agent<br/>Enemy, Waves, Camera & Bounds<br/>src/enemies, src/waves, src/arena"]
    end

    subgraph B["Setup B: Presentation Polish"]
        ux["ux-flow-designer<br/>design/ux"]
        art["art-direction-agent<br/>design/art, assets"]
        ui["menu-ui-agent<br/>src/ui"]
    end

    subgraph C["Setup C: GDD Review (read-only)"]
        gaps["gaps"]
        scope["scope"]
        skeptic["skeptic"]
    end

    Lead --> A
    Lead --> B
    Lead --> C
```

## 2. Dependencies and run order

```mermaid
flowchart LR
    C["Setup C<br/>GDD review"] -->|resolves GDD gaps| A
    subgraph A["Setup A"]
        direction LR
        contract["combat: finalize contracts"] --> player["player: move, jump, combos, block"]
        contract --> encounter["encounter: grunt, spawner, camera"]
        player --> hp["combat: hp/hitbox, game state"]
        encounter --> hp
    end
    A -->|real events exist| B
    subgraph B["Setup B"]
        direction LR
        ux["ux: review vs contracts"] --> ui["ui: wire HUD/Result scenes"]
        art["art: hit feedback, animations"] --> ui
    end
    B --> wire["Lead: ArenaScene wiring + playtest"]
```

## 3. Event contract (`game.events`)

```mermaid
flowchart LR
    player((player))
    enemy((enemy))
    combat{{combat}}
    waves{{waves}}
    state{{state}}
    ui[ui / HUD]
    arena[arena / camera]
    fx[fx]

    player -- "entity-registered, hit-request" --> combat
    enemy -- "entity-registered, hit-request" --> combat
    combat -- "damage-applied" --> player
    combat -- "damage-applied" --> enemy
    combat -- "damage-applied" --> fx
    combat -- "entity-died" --> waves
    combat -- "entity-died" --> state
    combat -- "entity-died" --> enemy
    combat -- "entity-died" --> player
    combat -- "player-health-changed" --> ui
    waves -- "wave-started" --> ui
    waves -- "wave-started, wave-cleared" --> arena
    waves -- "wave-cleared, arena-cleared" --> state
    state -- "timer-tick, round-won, round-lost" --> ui
    ui -- "retry" --> state
    ui -- "retry" --> combat
    ui -- "retry" --> waves
    ui -- "retry" --> player
```

## 4. Round lifecycle (game state)

```mermaid
stateDiagram-v2
    [*] --> Playing: retry / start
    Playing --> Playing: wave-cleared (next wave)
    Playing --> Won: arena-cleared, round-won(cleared)
    Playing --> Lost: player dies, round-lost(ko)
    Playing --> Lost: timer hits 0, round-lost(timeout)
    Won --> Playing: retry
    Lost --> Playing: retry
    note right of Won: combat ignores hit-request until retry
    note right of Lost: combat ignores hit-request until retry
```

## 5. Hit resolution sequence

```mermaid
sequenceDiagram
    participant P as player/enemy (attacker)
    participant C as combat
    participant T as target
    participant W as waves/state
    P->>C: hit-request (attackId, hitbox, damage)
    C->>C: dedupe (attackId, target), mirror by facing
    alt target invulnerable/dead
        C--xP: ignored, no event
    else dodge/parry
        C->>T: damage-applied (amount 0)
    else block or normal
        C->>T: damage-applied (scaled damage, knockback, hitstun)
    end
    opt hpAfter = 0
        C->>W: entity-died
        C->>T: entity-died
        T->>C: entity-unregistered
    end
```

## 6. GDD Review Kit pipeline (`gdd-review-kit-main`)

```mermaid
flowchart TB
    gdd[/gdd.txt/] --> R1

    subgraph R1["Round 1: parallel review"]
        sd[systems-designer]
        nc[narrative-critic]
        pp[player-psychologist]
        fl[feasibility-lead]
        aq[adversarial-qa]
        ba[business-analyst]
    end

    R1 --> files[(reviews/*.md)]
    files --> R2["Round 2: cross-examination<br/>(same six, read all files)"]
    R2 --> files
    files --> R3["Round 3: moderator synthesis<br/>(main session)"]
    R3 --> syn[/SYNTHESIS.md/]
    syn --> R4["Round 4: review-board.html"]

    files --> R5
    subgraph R5["Round 5: visualization"]
        direction TB
        de[data-extractor] --> hb[html-builder]
        vd[viz-designer] --> hb
        hb --> vr[viz-reviewer]
    end
    R5 --> viz[/review-viz.html + viz-audit.md/]
```
