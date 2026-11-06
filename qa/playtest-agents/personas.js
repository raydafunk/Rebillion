// Playtest personas: one goal-oriented brain (agent.js), different goal weights and habits.
// "Competent" personas try to WIN, so their videos show how the level plays. "Adversarial" personas try to BREAK it:
// they hunt soft-locks, bound leaks, stun-locks and timer bugs, and the invariant monitor reports what they find.
// No Phaser here; tune freely.

export const PERSONAS = Object.freeze({
  // Baseline: plays like a decent first-time player. Goal: clear the level.
  brawler: {
    kind: 'competent', label: 'Brawler',
    blurb: 'Keeps the crowd on one side, clears waves with light combos, parries the ring it sees, heals between waves, walks to the exit.',
    weights: { breakFree: 100, evadeStomp: 95, sidestepCharge: 90, avoidGrab: 85, parry: 80, reposition: 72, heal: 50, attack: 60, advance: 40 },
    parrySkill: 0.55, reactionMs: 140, heavyChance: 0.2, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0,
  },
  // Boss specialist: reads every Dugan tell (charge strip, stomp, grab reach) and punishes recovery.
  'boss-hunter': {
    kind: 'competent', label: 'Boss Hunter',
    blurb: 'Learns boss tells: sidesteps the charge, jumps the Mega Stomp wave, back-steps grabs, parries punches, punishes recovery.',
    weights: { breakFree: 100, evadeStomp: 98, sidestepCharge: 96, avoidGrab: 92, parry: 85, reposition: 74, heal: 55, attack: 60, advance: 40 },
    parrySkill: 0.85, reactionMs: 90, heavyChance: 0.35, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, punishRecovery: true, kaneStyle: 'parry', steamAware: true,   // vs Kane: parries his melee, dodges hook/vent, leaves steam
  },
  // Defence-first: waits for the ring and parries; tests telegraph readability and the parry window.
  'parry-master': {
    kind: 'competent', label: 'Parry Master',
    blurb: 'Waits for the telegraph ring, parries, then counters. Tests that every parry cue is readable and fair.',
    weights: { breakFree: 100, evadeStomp: 95, sidestepCharge: 90, avoidGrab: 85, parry: 99, reposition: 70, heal: 50, attack: 45, advance: 40 },
    parrySkill: 0.97, reactionMs: 60, heavyChance: 0.5, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, waitForCue: true, kaneStyle: 'parry', steamAware: true,
  },
  // First-timer: the Brawler without crowd control (never steps out of a sandwich) and with slower, weaker parries.
  // Measures whether a level is survivable for someone who has not learned the technique yet.
  rookie: {
    kind: 'competent', label: 'Rookie',
    blurb: 'A first-time player: fights whoever is closest, parries late and rarely, never repositions out of a crowd.',
    weights: { breakFree: 100, evadeStomp: 70, sidestepCharge: 70, avoidGrab: 60, parry: 80, heal: 50, attack: 60, advance: 40 },
    parrySkill: 0.3, reactionMs: 220, heavyChance: 0.2, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0,
  },
  // Control for Kane: never parries, never dodges, ignores steam. Shows what a non-parry player can do to him.
  trader: {
    kind: 'competent', label: 'Trader (no parry, no dodge)',
    blurb: 'Stands and trades blows: never parries, never dodges, ignores steam. Measures whether a non-parry player can interrupt a boss.',
    weights: { breakFree: 100, parry: 0, heal: 55, attack: 70, advance: 40 },
    parrySkill: 0, reactionMs: 150, heavyChance: 0.35, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, punishRecovery: true, kaneStyle: 'none',
  },
  // Evades every Kane move incl. melee (no parry) and leaves steam. Isolates dodgeability.
  dodger: {
    kind: 'competent', label: 'Dodger (evade only)',
    blurb: 'Back-steps, sidesteps and jump-times every Kane move, leaves steam; never parries.',
    weights: { breakFree: 100, parry: 0, heal: 55, attack: 60, advance: 40 },
    parrySkill: 0, reactionMs: 90, heavyChance: 0.35, useRage: true, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, punishRecovery: true, kaneStyle: 'evade', steamAware: true,
  },
  // Measurement personas: never swing, so the boss lives long enough to show every move many times (dodgeability and parry rates over a big sample).
  'kiter-dodge': {
    kind: 'competent', label: 'Kiter (dodge only, never attacks)',
    blurb: 'Stays in the boss face, evades every move, never swings. Measures per-move evade rate over a long fight.',
    weights: { breakFree: 100, parry: 0, heal: 55, attack: 60, advance: 40 },
    parrySkill: 0, reactionMs: 90, heavyChance: 0, useRage: false, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, kaneStyle: 'evade', steamAware: true, passive: true,
  },
  'kiter-parry': {
    kind: 'competent', label: 'Kiter (parry + dodge, never attacks)',
    blurb: 'Parries Kane melee, dodges hook/vent, never swings. Measures parry success and unparryable damage over a long fight.',
    weights: { breakFree: 100, parry: 85, heal: 55, attack: 60, advance: 40 },
    parrySkill: 0.85, reactionMs: 90, heavyChance: 0, useRage: false, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0, kaneStyle: 'parry', steamAware: true, passive: true,
  },
  // ADVERSARIAL: input fuzzer. Random key storms over a working brain: stun-locks, stuck states, double-inputs.
  'button-masher': {
    kind: 'adversarial', label: 'Button Masher',
    blurb: 'Fuzzes the controls: random key storms, every button at once, direction flips mid-combo. Hunts stuck states.',
    weights: { breakFree: 100, evadeStomp: 30, sidestepCharge: 30, avoidGrab: 20, parry: 30, heal: 40, attack: 60, advance: 45 },
    parrySkill: 0.2, reactionMs: 250, heavyChance: 0.5, useRage: true, chaos: 0.45, edgeHug: false, jumpSpam: 0.15, blockHold: 0,
  },
  // ADVERSARIAL: geometry abuser. Fights from corners and lane edges, walks back against the lock, jump-spams.
  'edge-exploiter': {
    kind: 'adversarial', label: 'Edge Exploiter',
    blurb: 'Fights from screen corners and lane edges, walks back into the camera lock, jump-spams. Hunts bound leaks and off-screen enemies.',
    weights: { breakFree: 100, evadeStomp: 80, sidestepCharge: 80, avoidGrab: 70, parry: 50, heal: 40, attack: 55, advance: 40 },
    parrySkill: 0.4, reactionMs: 160, heavyChance: 0.3, useRage: true, chaos: 0.05, edgeHug: true, jumpSpam: 0.25, blockHold: 0,
  },
  // ADVERSARIAL: staller. Holds block, rarely swings. Drives the timeout path and checks enemies can't soft-lock a guard.
  turtle: {
    kind: 'adversarial', label: 'Turtle',
    blurb: 'Holds block and barely attacks. Drives the timeout/lose path and checks a guarding player cannot soft-lock a wave.',
    weights: { breakFree: 100, evadeStomp: 60, sidestepCharge: 60, avoidGrab: 60, parry: 40, heal: 50, attack: 15, advance: 40 },
    parrySkill: 0.3, reactionMs: 200, heavyChance: 0.1, useRage: false, chaos: 0, edgeHug: false, jumpSpam: 0, blockHold: 0.85,
  },
});

export const personaOf = (name) => PERSONAS[name] || PERSONAS.brawler;
