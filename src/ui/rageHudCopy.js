// All Rage HUD wording in one place. Later each entry can be swapped for a dialogue content id
// (the intro-prompt wording is pending from the content pipeline), so the scene only ever reads this module.
export const RAGE_COPY = {
  meterLabel: 'RAGE',
  stateLabels: { BUILDING: 'RAGE', READY: 'READY!', ACTIVE: 'RAGE!' },
  prompt: 'L',
  promptHint: 'PRESS L',
  introTitle: 'RAGE',
  introLines: ['Land clean blows to fill the meter.', 'When it is READY, press L to unleash Rage.'],
  introDismiss: 'Fight on',
  endText: 'RAGE SPENT',
  gain: (amount, bonus) => `+${amount}${bonus ? '!' : ''}`,
  seconds: (s) => `${Math.ceil(s)}s`,
};
