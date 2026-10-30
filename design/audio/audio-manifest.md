# Audio Manifest - The Rebellion: Fists of the Fallen City

Status: only `menu_theme` researched so far. Nothing downloaded. Licences read on the source pages (opened 2026-10-25). Tracks were NOT played; fit is judged from description/tags.

Existing code loads audio via `this.load.audio(KEY, PATH)` in `src/scenes/ArenaScene.js` (existing assets in `assets/sound/`). Wiring is for the code agents.

## Slot: menu_theme

### Primary: Funked Up
- Title: Funked Up
- Creator: Joth
- Source page: https://opengameart.org/content/funked-up
- Licence: CC0 1.0 Universal (Public Domain Dedication)
- Attribution required: No (author says appreciated, not required)
- Loopable: Yes (per description "very groovy looping track" and `loop` tag)
- Length: not stated on page
- Format / size: MP3, `Funked Up.mp3`, 1.3 MB
- Tags: loop, funk, rock, groove, guitar, bass, Rhodes, drumset, 70s
- Fit: funk/groove with a gritty-warm band feel; author suggests a pre-mission menu. Not chiptune. Judged from description/tags.
- Note: no .ogg offered; convert to .ogg later if wanted.

### Backup: Funky Chiptune (Looping)
- Title: Funky Chiptune (Looping)
- Creator: Eric Matyas (soundimage.org)
- Source page: https://opengameart.org/content/funky-chiptune-looping
- Licence: CC-BY 3.0 (Creative Commons Attribution 3.0)
- Attribution required: Yes. "Funky Chiptune" by Eric Matyas www.soundimage.org
- Loopable: Yes (tags `looping`, `seamless`)
- Length: 1:15
- Format / size: OGG, `funky_chiptune.ogg`, 4.5 MB (under the 5 MB flag, but close)
- Tags: arcade, fun, funky, chiptune, looping, retro, seamless
- Fit: high-energy retro arcade; may be too frantic/playful for a menu and better as an in-level track. Judged from description/tags.

## Not picked (seen, not opened for licence)
- "6 Chiptune Loops" (SuperGamersGames, CC-BY 4.0 per search snippet) contains a Menu.wav. UNVERIFIED, page not opened, excluded.

## Gaps
- None for menu_theme. All other slots not yet attempted.

---

## Slot: level_complete (researched 2026-10-30; nothing downloaded; nothing played)

Note: opengameart.org returned HTTP 403 to every page fetch in this session, so no OGA licence could be read on the source page. Per the hard rule, OGA candidates are UNVERIFIED and excluded from picks. Licence details below for them come only from search snippets.

### Primary: Kenney "Music Jingles"
- Title: Music Jingles (85 files, v1.0, 2014)
- Creator: Kenney
- Source page: https://kenney.nl/assets/music-jingles
- Licence: Creative Commons CC0 (read on the page; version not stated, treat as CC0 1.0)
- Attribution required: No
- Loopable: No (jingles/stingers, one-shot)
- Length: individual jingles, lengths not stated on page (expected a few seconds each; unconfirmed)
- Format / size: not stated on page. Check the zip contents after approval.
- Fit: generic short stingers, not funk-specific; pick a victory-sounding one by ear after download. Judged only from page title/tags.
- Action for owner: approve downloading the pack zip (size unknown) so one stinger can be chosen by ear.

### Backups (UNVERIFIED, excluded until a human opens the page)
- "Success Stinger" by SterlingRay (Jan 2024): https://opengameart.org/node/159529 . Snippet says free, credit appreciated; licence NOT confirmed (other SterlingRay stingers are CC0). Tags per snippet: happy, 8-bit, piano.
- "Level Complete Splash" by GreyFrogGames (2023): https://opengameart.org/content/level-complete-splash . Search snippet says CC0, MP3 and WAV. UNVERIFIED.
- "Level Complete!" by Umplix (2021): https://opengameart.org/content/level-complete . Snippet says CC0, tagged victory, includes vocals (may not suit). UNVERIFIED.
- Rejected: "Level finish fanfares" by jobromedia, CC-BY-SA 3.0 per snippet (share-alike, not on the allowed list).

## Slot: results_music

### Primary: none verified
### Candidates (all UNVERIFIED, OGA 403; licences from search snippets only, all said to be CC0)
- "lofi hip hop loop": https://opengameart.org/content/lofi-hip-hop-loop . Lo-fi/chill/hip hop/loop tags; short OGG. Best tonal fit for a calm results screen alongside "Funked Up".
- "Instrumental Hip Hop Theme": https://opengameart.org/content/instrumental-hip-hop-theme . Licence not seen.
- "Chill (Loopable)" by Pro Sensory: https://opengameart.org/content/chill-loopable . CC0 per snippet, short MP3 loop.
- "Funky House" by Of Far Different Nature: https://opengameart.org/content/funky-house . CC0 per snippet; house, not hip hop.
- Fallback with no new asset: reuse menu_theme "Funked Up" (CC0, verified) on the results screen, or the verified backup Funky Chiptune (CC-BY 3.0).

## Gaps (this pass)
- level_complete: only 1 verified candidate (Kenney Music Jingles, pack not a single file). Backups unverified. Tried: OGA search (blocked on page open), Kenney page.
- results_music: no verified candidate. Tried: OGA search for hip hop/chill/funk loops (pages 403), Kenney (no loop pack found; /music-loops is 404). Not yet tried: itch.io, Pixabay, FreePD, incompetech. Needs the owner to open the OGA links or retry later.

## Licence re-check (2026-10-30)
Page licence links read directly on each OpenGameArt page; all show CC0 1.0 (no attribution needed). Tracks not listened to.
- level_complete: Level Complete Splash (GreyFrogGames) mp3+wav; Success Stinger (SterlingRay) mp3; Level Complete! (Umplix) wav, has vocals
- results_music: Lofi Hip Hop Loop ogg; Chill (Loopable) mp3; Funky House (Of Far Different Nature) wav+mp3; Instrumental Hip-Hop theme mp3 (not confirmed loopable)

## In game (2026-10-30)
- `result.sting` -> assets/sound/level-complete-sting.mp3 ("Level Complete Splash", GreyFrogGames, CC0), plays on level clear (ResultScene win)
- `result.music` -> assets/sound/results-funky-house.mp3 ("Funky House", Of Far Different Nature, CC0), loops after the sting until the player leaves the screen
