// Story intro sequence: three cards shown once between the menu and the arena.
//   1. HOME   - Zed's mother, Elena, waiting; his father has not come home.
//   2. ANGRY  - Zed, fed up with the Rust and Halden Varr, decides to act.
//   3. RUN    - Zed runs into the city to find his father; the four original story lines play here. Then level 1.
// Copy for the four STORY.lines is lifted or lightly trimmed from content/lore (canon-world: fallen-city,
// the-rust, rust-takeover; canon-more: goal; canon-people: zeds-father). The home / angry dialogue is NEW.
// PLACEHOLDER: the home / angry dialogue, the titles and the prompt are not GDD wording; owner to confirm.
// ART: PixelLab sprites (48x48) in assets/sprites/. Backgrounds are drawn in code (no image files), so the cards
// show instantly and the sprites pop in as soon as their few small PNGs arrive. See StoryCard.js.

export const STORY = {
  title: 'THE FALLEN CITY',
  lines: [
    'Before the Rust, the city was loud, hopeful and full of people who looked out for each other.',
    'Then the Rust swept through the districts. They shut the courts, fenced the gardens and tore down the murals.',
    "Zed's father, a muralist, disappeared confronting the Rust at a mural teardown.",
    'Zed means to take the city back one district at a time, and find out what happened to his father.',
  ],
  prompt: 'Enter / click to continue',
  skipHint: 'Esc to skip',
  autoMs: 12000, // each beat closes itself after this long so the story never blocks the player
};

const SAD = 'assets/sprites/Elena Vance/Sad_State/animations/The_character_slowly_slumps_their_shoulders_forwar/south';
const ANGRY = 'assets/sprites/zed/Angry_State/animations/The_character_clenches_both_fists_tightly_against/south';
const RUN = 'assets/sprites/zed/Angry_walk/animations/The_subject_surges_forward_with_a_furious_aggressi/east';
const frames = (key, dir, n = 9) => Array.from({ length: n }, (_, i) => ({ key: `${key}.${i}`, path: `${dir}/frame_${String(i).padStart(3, '0')}.png` }));

// Each scene: `bg` picks the code-drawn background, `art` the looping sprite (frames + where it stands), `beats` the text
// (name: speaker tag, omitted = narration). The last scene's beats are STORY.lines.
export const STORY_SCENES = [
  {
    id: 'home', bg: 'home', title: 'HOME',
    art: { key: 'story.elena', frames: frames('story.elena', SAD), x: 640, y: 482, scale: 8, fps: 5 },
    beats: [
      { text: "At the kitchen table, Zed's mother waits. The lamp is still lit. His father's chair is still empty." },
      { name: 'Elena', text: "He said he'd be back before dark, Zed. The Rust and Halden Varr have taken so much from this city. I can't lose him too." },
    ],
  },
  {
    id: 'angry', bg: 'alley', title: 'ENOUGH',
    art: { key: 'story.zed.angry', frames: frames('story.zed.angry', ANGRY), x: 640, y: 482, scale: 8, fps: 9 },
    beats: [
      { name: 'Zed', text: "They shut the courts, fenced the gardens, tore down every mural. Now Dad's gone, and Varr and the Rust are still standing." },
      { name: 'Zed', text: "I'm done waiting. Whatever it takes, I'm bringing him home." },
    ],
  },
  {
    id: 'run', bg: 'city', title: STORY.title,
    art: { key: 'story.zed.run', frames: frames('story.zed.run', RUN), x: 440, y: 488, scale: 6, fps: 12 },
    beats: STORY.lines.map((text) => ({ text })),
  },
];

/** Every PNG the sequence needs: [{ key, path }]. Loaded by preloadStoryArt (StoryCard.js). */
export function storyAssets(scenes = STORY_SCENES) {
  return scenes.flatMap((s) => (s.art ? s.art.frames : []));
}

// True when every line is a non-empty string and the required story beats are present.
export function storyIsValid(s = STORY) {
  const text = s.lines.join(' ');
  return s.lines.length > 0 && s.lines.every((l) => typeof l === 'string' && l.trim().length > 0)
    && /Fallen City/i.test(`${s.title} ${text}`) && /Rust/.test(text) && /father/i.test(text);
}

/** Problems found in the scene list (empty array = fine). Used by the unit test. */
export function storySceneProblems(scenes = STORY_SCENES) {
  const out = [];
  if (!Array.isArray(scenes) || scenes.length === 0) return ['no scenes'];
  const keys = new Set();
  for (const s of scenes) {
    if (!['home', 'alley', 'city'].includes(s.bg)) out.push(`${s.id}: unknown bg '${s.bg}'`);
    if (!Array.isArray(s.beats) || s.beats.length === 0) out.push(`${s.id}: no beats`);
    else s.beats.forEach((b, i) => {
      if (!b || typeof b.text !== 'string' || !b.text.trim()) out.push(`${s.id}: beat ${i + 1} has no text`);
      else if (b.text.length > 230) out.push(`${s.id}: beat ${i + 1} is over 230 characters`);
    });
    if (!s.art || !Array.isArray(s.art.frames) || s.art.frames.length === 0) out.push(`${s.id}: no art frames`);
    else for (const f of s.art.frames) {
      if (!f.key || !f.path) out.push(`${s.id}: frame needs a key and a path`);
      else if (keys.has(f.key)) out.push(`${s.id}: duplicate key ${f.key}`); else keys.add(f.key);
    }
  }
  return out;
}
