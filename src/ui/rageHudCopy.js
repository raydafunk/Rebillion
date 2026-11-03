// All Rage HUD wording in one place. Later each entry can be swapped for a dialogue content id
// so the scene only ever reads this module. The Level 2 explainer card has its own copy in rageIntroData.js.
export const RAGE_COPY = {
  meterLabel: 'RAGE',
  stateLabels: { BUILDING: 'RAGE', READY: 'READY!', ACTIVE: 'RAGE!' },
  prompt: 'L',
  promptHint: 'PRESS L',
  endText: 'RAGE SPENT',
  entryTitle: 'RAGE', // big title on the activation flash (no lore line fits a 1-word banner)
  gain: (amount, bonus) => `+${amount}${bonus ? '!' : ''}`,
  seconds: (s) => `${Math.ceil(s)}s`,
};
