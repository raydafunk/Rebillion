// Story intro card copy. Lines are lifted or lightly trimmed from content/lore (canon-world: fallen-city,
// the-rust, rust-takeover; canon-more: goal; canon-people: zeds-father). No new lore.
// PLACEHOLDER: the trimming and the title/prompt strings are not GDD wording; owner to confirm.
export const STORY = {
  title: 'THE FALLEN CITY',
  lines: [
    'Before the Rust, the city was loud, hopeful and full of people who looked out for each other.',
    'Then the Rust swept through the districts. They shut the courts, fenced the gardens and tore down the murals.',
    "Zed's father, a muralist, disappeared confronting the Rust at a mural teardown.",
    'Zed means to take the city back one district at a time, and find out what happened to his father.',
  ],
  prompt: 'Enter / click to continue',
  autoMs: 12000, // card closes itself after this long so it never blocks the player
};

// True when every line is a non-empty string and the required story beats are present.
export function storyIsValid(s = STORY) {
  const text = s.lines.join(' ');
  return s.lines.length > 0 && s.lines.every((l) => typeof l === 'string' && l.trim().length > 0)
    && /Fallen City/i.test(`${s.title} ${text}`) && /Rust/.test(text) && /father/i.test(text);
}
