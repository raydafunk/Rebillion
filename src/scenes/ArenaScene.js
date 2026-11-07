// ArenaScene: lead-owned integration. Wires Zed + Arena (enemies/waves/bounds) + combat + round state
// together over game.events and renders them. HudScene and ResultScene run on top.
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { createHitResolver } from '../combat/hitResolver.js';
import { hitStopMs, mergeHitStop } from '../combat/hitStop.js';
import { MOVE_FEEDBACK, shakeScale } from '../shared/hitFeedback.js';
import { loadSettings } from '../ui/optionsData.js';
import RageEntryFlash from '../ui/RageEntryFlash.js';
import { RageImpactFx } from '../player/RageImpactFx.js';
import { RAGE_EVENTS } from '../player/rageConfig.js';
import { levelMusicFor, levelMusicVolume, bossMusicFor, isBossWave, BOSS_FADE_MS } from '../levels/levelMusic.js';
import { telegraphCue, TELEGRAPH_CUE, RING_CENTER_ABOVE_FEET } from '../enemies/telegraphCueData.js';
import { loadingLine } from '../ui/loadingData.js';
import { createRoundState, RoundStatus } from '../state/roundState.js';
import { createScore } from '../state/score.js';
import { Zed, PLAYER_THROW } from '../player/Zed.js';
import { HEAVY_HIT_SOUND_KEY, HEAVY_HIT_SOUND_PATH, LIGHT_HIT_SOUND_KEY, LIGHT_HIT_SOUND_PATH, KICK_HIT_SOUND_KEY, KICK_HIT_SOUND_PATH, SWING_SOUND_KEY, SWING_SOUND_PATH, RUN_SOUND_KEY, RUN_SOUND_PATH, OWW_SOUND_KEY, OWW_SOUND_PATH, DEATH_SOUND_KEY, DEATH_SOUND_PATH } from '../player/heavyHit.js';
import { ZedVisual, loadZedSprites } from '../player/zedVisual.js';
import { Arena } from '../arena/Arena.js';
import { WORLD, LANE, VIEW } from '../arena/arenaData.js';
import { legacyLevel, nextLevelIndex } from '../levels/levelData.js';
import { PICKUP, LOW_HEALTH_DROP, pickupDrop, finishDrops, canCollect, createLowHealthDrop, lowHealthDrop } from '../items/pickups.js';
import { WEAPON, ThrownWeapon, isThrowHit } from '../items/thrownWeapon.js';
import showLevelCard from '../ui/LevelCard.js';
import showRageIntroCard from '../ui/RageIntroCard.js';
import showBossIntroCard from '../ui/BossIntroCard.js';
import { bossIntroFor, introPortraitAssets, introTriggered } from '../ui/bossIntroData.js';
import { RAGE_INTRO_ASSET, shouldShowRageIntro } from '../ui/rageIntroData.js';
import showVictoryCard from '../ui/VictoryCard.js';
import { VICTORY, victoryFor } from '../ui/victoryData.js';
import addAmbient from '../levels/ambient.js';
import { COLORS, CSS, FONTS } from '../config/assetKeys.js';

const SPARK_KEY = 'fx.spark';
import { GRUNT_SPRITE_KEY, GRUNT } from '../enemies/gruntData.js';
import { EnemyHitFx } from '../enemies/EnemyHitFx.js';
import { MegaStompFx } from '../enemies/MegaStompFx.js';
import { RoyceFx } from '../enemies/RoyceFx.js';
import { SpecialistBoltFx } from '../enemies/SpecialistBoltFx.js';
import { KaneFx } from '../enemies/KaneFx.js';
import { ZedShockFx } from '../player/ZedShockFx.js';
import { WallSlamFx } from '../enemies/WallSlamFx.js';
import { GrabBreakCueFx } from '../enemies/GrabBreakCueFx.js';
import { specialistStep } from '../enemies/specialistSound.js';
import { GRUNT_HIT_SOUND_KEY, GRUNT_HIT_SOUND_PATH, GRUNT_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_PATH, GRUNT_STEP_SOUND_KEY, GRUNT_STEP_SOUND_PATH, pickStepper } from '../enemies/gruntSound.js';
import { DUGAN_ID } from '../enemies/duganData.js';
import { ROYCE_ID } from '../enemies/royceData.js';
import { royceAssets, royceAnimDefs, roycePose, royceRotationKey, royceFitScale } from '../enemies/royceSprites.js';
import { GlitchFx } from '../enemies/GlitchFx.js';
import { GLITCH_ID } from '../enemies/glitchData.js';
import { GLITCH_HIT_VOICE_KEY, GLITCH_HIT_VOICE_PATH, GLITCH_HIT_THUD_KEY, GLITCH_HIT_THUD_PATH, GLITCH_DEATH_SOUND_KEY, GLITCH_DEATH_SOUND_PATH } from '../enemies/glitchSound.js';
import { glitchAssets, glitchAnimDefs, glitchPose, glitchRotationKey, glitchFitScale } from '../enemies/glitchSprites.js';
import { RaptorFx } from '../enemies/RaptorFx.js';
import { RAPTOR_ID } from '../enemies/raptorData.js';
import { RAPTOR_HIT_VOICE_KEY, RAPTOR_HIT_VOICE_PATH, RAPTOR_HIT_THUD_KEY, RAPTOR_HIT_THUD_PATH, RAPTOR_DEATH_SOUND_KEY, RAPTOR_DEATH_SOUND_PATH, RAPTOR_SLAM_KEY, RAPTOR_SLAM_PATH, RAPTOR_SLAM_VOLUME, RAPTOR_SLAM_RATE } from '../enemies/raptorSound.js';
import { raptorAssets, raptorAnimDefs, raptorPose, raptorRotationKey, raptorFitScale } from '../enemies/raptorSprites.js';
import { Subject88Fx } from '../enemies/Subject88Fx.js';
import { SUBJECT88_ID } from '../enemies/subject88Data.js';
import { SUBJECT88_HIT_VOICE_KEY, SUBJECT88_HIT_VOICE_PATH, SUBJECT88_HIT_THUD_KEY, SUBJECT88_HIT_THUD_PATH, SUBJECT88_DEATH_SOUND_KEY, SUBJECT88_DEATH_SOUND_PATH } from '../enemies/subject88Sound.js';
import { subject88Assets, subject88AnimDefs, subject88Pose, subject88RotationKey, subject88FitScale } from '../enemies/subject88Sprites.js';
import { VarrFx } from '../enemies/VarrFx.js';
import { VARR_ID } from '../enemies/varrData.js';
import { VARR_AUDIO, VARR_CUES } from '../enemies/varrSound.js';
import { varrAssets, varrAnimDefs, varrPose, varrRotationKey, varrFitScale } from '../enemies/varrSprites.js';
import { KANE_ID } from '../enemies/kaneData.js';
import { kaneAssets, kaneAnimDefs, kanePose, kaneRotationKey, kaneFitScale } from '../enemies/kaneSprites.js';
import { isDugan, duganSoundReady, duganImpactVolume, DUGAN_HIT_VOICE_KEY, DUGAN_HIT_VOICE_PATH, DUGAN_DEATH_SOUND_KEY, DUGAN_DEATH_SOUND_PATH,
  DUGAN_IMPACT_SOUND_KEY, DUGAN_IMPACT_SOUND_PATH, DUGAN_IMPACT_COOLDOWN_MS } from '../enemies/duganSound.js';
import {
  duganAssets, duganAnimDefs, duganPose, duganRotationKey, duganFitScale, DUGAN_SINK_PX, DUGAN_SINK_FROM_FRAME,
} from '../enemies/duganSprites.js';
import {
  BREAKER_SOURCE_ID, BREAKER_SPRITE_KEY, BREAKER_FRAMES, BREAKER_WALK_FPS, BREAKER_DISPLAY_SIZE,
  DIRECTIONS as BREAKER_DIRS, breakerPose, breakerRotationKey, breakerFrameKey, breakerWalkAnimKey,
  breakerRotationPath, breakerFramePath,
  BREAKER_ATTACK_FRAMES, BREAKER_ATTACK_MS, breakerAttackFrameKey, breakerAttackAnimKey, breakerAttackFramePath,
  BREAKER_DEATH_HALF_WIDTH, BREAKER_HIT_FRAMES, BREAKER_HIT_DIRS, breakerHitFrameKey, breakerHitAnimKey, breakerHitFramePath,
  BREAKER_DEATH_FRAMES, BREAKER_DEATH_DIRS, breakerDeathFrameKey, breakerDeathAnimKey, breakerDeathFramePath, breakerDeathTimeScale,
  BREAKER_DEATH_DEFAULT_FPS, deathViewPhase,
} from '../enemies/breakerData.js';
import {
  BREAKER2_DIRS, BREAKER2_WALK_FRAMES, BREAKER2_WALK_FPS, BREAKER2_ATTACK_FRAMES, BREAKER2_ATTACK_MS, BREAKER2_HIT_DIRS, BREAKER2_HIT_FRAMES,
  BREAKER2_DEATH_FRAMES, BREAKER2_DEATH_DEFAULT_FPS, BREAKER2_SKIN, isBreaker2, breaker2Pose, breaker2RotationKey, breaker2RotationPath,
  breaker2WalkFrameKey, breaker2WalkAnimKey, breaker2WalkFramePath, breaker2AttackFrameKey, breaker2AttackAnimKey, breaker2AttackFramePath,
  breaker2HitFrameKey, breaker2HitAnimKey, breaker2HitFramePath, breaker2DeathFrameKey, breaker2DeathAnimKey, breaker2DeathFramePath,
  BREAKER2_FLIP_FRAMES, BREAKER2_FLIP_FPS, breaker2FlipFrameKey, breaker2FlipAnimKey, breaker2FlipFramePath, breaker2FlipPose,
} from '../enemies/breakerType2Data.js';
import {
  RANGER_DIRS, RANGER_WALK_DIRS, RANGER_WALK_FRAMES, RANGER_WALK_FPS, RANGER_ATTACK_FRAMES, RANGER_ATTACK_MS, RANGER_HIT_FRAMES, RANGER_DEATH_FRAMES, RANGER_DEATH_DEFAULT_FPS,
  RANGER_ART_SKINS, isRanger, rangerPose, rangerRotationKey, rangerRotationPath, rangerWalkFrameKey, rangerWalkAnimKey, rangerWalkFramePath,
  rangerAttackFrameKey, rangerAttackAnimKey, rangerAttackFramePath, rangerHitFrameKey, rangerHitAnimKey, rangerHitFramePath,
  rangerDeathFrameKey, rangerDeathAnimKey, rangerDeathFramePath, rangerFallState, RANGER_FRAME_PX,
} from '../enemies/rangerData.js';
import {
  SPECIALIST_DIRS, SPECIALIST_HIT_DIRS, SPECIALIST_HIT_FRAMES, SPECIALIST_DEATH_FRAMES, SPECIALIST_DEATH_DEFAULT_FPS, SPECIALIST_SKIN,
  isSpecialist, specialistPose, specialistIdleKey, specialistIdlePath, SPECIALIST_WALK_DIRS, SPECIALIST_WALK_FRAMES, SPECIALIST_WALK_FPS, specialistWalkFrameKey, specialistWalkAnimKey, specialistWalkFramePath,
  specialistStrikeKey, specialistStrikePath, specialistWindupKey, specialistWindupPath, specialistHitFrameKey, specialistHitAnimKey, specialistHitFramePath,
  specialistDeathFrameKey, specialistDeathAnimKey, specialistDeathFramePath,
  SPECIALIST_BATON_DIRS, SPECIALIST_BATON_FRAMES, SPECIALIST_BATON_FPS, specialistBatonFrameKey, specialistBatonAnimKey, specialistBatonFramePath,
  SPECIALIST_TASER_DIRS, SPECIALIST_TASER_FRAMES, SPECIALIST_TASER_FPS, specialistTaserFrameKey, specialistTaserAnimKey, specialistTaserFramePath,
  SPECIALIST_RANGED_DIRS, SPECIALIST_RANGED_FRAMES, SPECIALIST_RANGED_FIRE_ORDER, SPECIALIST_RANGED_AIM_FRAMES, specialistRangedAimKey, SPECIALIST_RANGED_FPS, specialistRangedFrameKey, specialistRangedAnimKey, specialistRangedFramePath,
  SPECIALIST_BOLT_DIRS, SPECIALIST_BOLT_FRAMES, specialistBoltFrameKey, specialistBoltFramePath,
} from '../enemies/specialistData.js';

const GROUND_Y = LANE.maxY - 40;      // Zed's feet line (physics floor)
const END_DELAY_MS = 700;             // let the KO / final hit play before the result screen
const FINISHER_DAMAGE = 12;           // damage at/above which a hit gets screen shake
const HIT_FX_FINISHER_DAMAGE = 18;    // damage at/above which a hit gets the finisher particle tier (Zed's heavy1)

const levelHasRanger = (level) => level.waves.some((w) => RANGER_ART_SKINS.includes(w.enemy) || (w.mix || []).some((k) => RANGER_ART_SKINS.includes(k)));
const levelHasSpecialist = (level) => level.waves.some((w) => w.enemy === SPECIALIST_SKIN || (w.mix || []).includes(SPECIALIST_SKIN));
const levelHasBreaker2 = (level) => level.waves.some((w) => w.eliteSkin === BREAKER2_SKIN || (w.mix || []).includes(BREAKER2_SKIN));
const levelHasDugan = (level) => level.waves.some((w) => w.leader && w.leader.enemy === DUGAN_ID);
const levelHasRoyce = (level) => level.waves.some((w) => w.leader && w.leader.enemy === ROYCE_ID);
const levelHasKane = (level) => level.waves.some((w) => w.leader && w.leader.enemy === KANE_ID);
const levelHasGlitch = (level) => level.waves.some((w) => w.leader && w.leader.enemy === GLITCH_ID);
const levelHasRaptor = (level) => level.waves.some((w) => w.leader && w.leader.enemy === RAPTOR_ID);
const levelHasSubject88 = (level) => level.waves.some((w) => w.leader && w.leader.enemy === SUBJECT88_ID);
const levelHasVarr = (level) => level.waves.some((w) => w.leader && w.leader.enemy === VARR_ID);

const swallowLoadError = () => {};

/** Queue every asset the level's first load needs on `scene.load` (any scene's loader works: the caches are game-wide).
 *  MenuScene calls this while the story card is up so the arena opens with nothing left to load. Returns the background key (or null). */
export function queueArenaAssets(scene, level, startWave = 0) {
  // One shared no-op, removed first: the scene loader outlives restarts (retry, next level, back to menu), so a fresh closure each call would pile up listeners.
  scene.load.off('loaderror', swallowLoadError);
  scene.load.on('loaderror', swallowLoadError);
  let bgKey = null;
    // Per-level background from content/levels/styles/<id>.json.
    const bgPath = level.style.background.path;
    if (bgPath) {
      bgKey = `bg.${level.id}`;
      if (/.svg$/i.test(bgPath)) scene.load.svg(bgKey, bgPath, { scale: 1 }); // intrinsic size: art may be 1920x720 or a wider multiple
      else scene.load.image(bgKey, bgPath);
    }
    loadZedSprites(scene, ['Idle', 'Jumping']);
    scene.load.audio(HEAVY_HIT_SOUND_KEY, HEAVY_HIT_SOUND_PATH);
    scene.load.audio(LIGHT_HIT_SOUND_KEY, LIGHT_HIT_SOUND_PATH);
    scene.load.audio(KICK_HIT_SOUND_KEY, KICK_HIT_SOUND_PATH);
    scene.load.audio(SWING_SOUND_KEY, SWING_SOUND_PATH);
    scene.load.audio(RUN_SOUND_KEY, RUN_SOUND_PATH);
    scene.load.audio(OWW_SOUND_KEY, OWW_SOUND_PATH);
    scene.load.audio(DEATH_SOUND_KEY, DEATH_SOUND_PATH);
    scene.load.audio(GRUNT_HIT_SOUND_KEY, GRUNT_HIT_SOUND_PATH);
    scene.load.audio(GRUNT_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_PATH);
    scene.load.audio(GRUNT_STEP_SOUND_KEY, GRUNT_STEP_SOUND_PATH);
    if (levelHasGlitch(level)) {
      scene.load.audio(GLITCH_HIT_VOICE_KEY, GLITCH_HIT_VOICE_PATH);
      scene.load.audio(GLITCH_HIT_THUD_KEY, GLITCH_HIT_THUD_PATH);
      scene.load.audio(GLITCH_DEATH_SOUND_KEY, GLITCH_DEATH_SOUND_PATH);
    }
    if (levelHasRaptor(level)) {
      scene.load.audio(RAPTOR_HIT_VOICE_KEY, RAPTOR_HIT_VOICE_PATH);
      scene.load.audio(RAPTOR_HIT_THUD_KEY, RAPTOR_HIT_THUD_PATH);
      scene.load.audio(RAPTOR_DEATH_SOUND_KEY, RAPTOR_DEATH_SOUND_PATH);
      scene.load.audio(RAPTOR_SLAM_KEY, RAPTOR_SLAM_PATH);
    }
    if (levelHasSubject88(level)) {
      scene.load.audio(SUBJECT88_HIT_VOICE_KEY, SUBJECT88_HIT_VOICE_PATH);
      scene.load.audio(SUBJECT88_HIT_THUD_KEY, SUBJECT88_HIT_THUD_PATH);
      scene.load.audio(SUBJECT88_DEATH_SOUND_KEY, SUBJECT88_DEATH_SOUND_PATH);
    }
    if (levelHasVarr(level)) for (const a of VARR_AUDIO) scene.load.audio(a.key, a.path);
    if (levelHasDugan(level)) {
      scene.load.audio(DUGAN_HIT_VOICE_KEY, DUGAN_HIT_VOICE_PATH);
      scene.load.audio(DUGAN_DEATH_SOUND_KEY, DUGAN_DEATH_SOUND_PATH);
      scene.load.audio(DUGAN_IMPACT_SOUND_KEY, DUGAN_IMPACT_SOUND_PATH);
    }
    scene.load.svg(RAGE_INTRO_ASSET.key, RAGE_INTRO_ASSET.path, { width: RAGE_INTRO_ASSET.w, height: RAGE_INTRO_ASSET.h }); // Level 2 Rage explainer card frame (text is live)
    scene.load.svg(VICTORY.frameKey, 'assets/ui/victory-card-frame.svg', { width: VICTORY.frameW, height: VICTORY.frameH }); // boss victory card frame (text is live)
    for (const a of introPortraitAssets(level.waves.filter((w) => w.leader).map((w) => w.leader.enemy))) scene.load.svg(a.key, a.path, { width: 420, height: 560 }); // boss intro story card portraits (placeholders)
    const lm = levelMusicFor(level.id);
    const bm = bossMusicFor(level.id);
    // Boss + results music are not needed until late in the round: ArenaScene.create() streams them in afterwards (loadDeferredArenaAudio).
  // A ?wave=N test start on the boss wave begins on the boss track, so that one stays in the first load.
  if (isBossWave(startWave, level.waves.length)) scene.load.audio(bm.key, bm.path);
    if (lm) scene.load.audio(lm.key, lm.path); // level BGM; a missing file just means no music (loaderror is swallowed above)
        // Rust Bruisers PNGs (8 directions) are the art for every grunt/breaker.
    for (const d of BREAKER_DIRS) {
      scene.load.image(breakerRotationKey(d), breakerRotationPath(d));
      for (let i = 0; i < BREAKER_FRAMES; i++) scene.load.image(breakerFrameKey(d, i), breakerFramePath(d, i));
      for (let i = 0; i < BREAKER_ATTACK_FRAMES; i++) scene.load.image(breakerAttackFrameKey(d, i), breakerAttackFramePath(d, i));
    }
    for (const d of Object.keys(BREAKER_HIT_DIRS)) {
      for (let i = 0; i < BREAKER_HIT_FRAMES; i++) scene.load.image(breakerHitFrameKey(d, i), breakerHitFramePath(d, i));
    }
    for (const d of Object.keys(BREAKER_DEATH_DIRS)) {
      for (let i = 0; i < BREAKER_DEATH_FRAMES; i++) scene.load.image(breakerDeathFrameKey(d, i), breakerDeathFramePath(d, i));
    }
    // Rust Ranger art ('Rust Rangers — The Watchers' folder), only for levels whose waves send Rangers.
    if (levelHasRanger(level)) {
      for (const d of RANGER_DIRS) {
        scene.load.image(rangerRotationKey(d), rangerRotationPath(d));
        for (let i = 0; i < RANGER_ATTACK_FRAMES; i++) scene.load.image(rangerAttackFrameKey(d, i), rangerAttackFramePath(d, i));
        for (let i = 0; i < RANGER_DEATH_FRAMES; i++) scene.load.image(rangerDeathFrameKey(d, i), rangerDeathFramePath(d, i));
      }
      for (const d of RANGER_WALK_DIRS) for (let i = 0; i < RANGER_WALK_FRAMES; i++) scene.load.image(rangerWalkFrameKey(d, i), rangerWalkFramePath(d, i));
      for (const d of ['east', 'west']) for (let i = 0; i < RANGER_HIT_FRAMES; i++) scene.load.image(rangerHitFrameKey(d, i), rangerHitFramePath(d, i));
    }
    // Rust Specialist art ('Rust Specialists — The Copper Fangs' folder), only for levels whose waves send Specialists (Level 4).
    if (levelHasSpecialist(level)) {
      for (const d of SPECIALIST_DIRS) {
        scene.load.image(specialistIdleKey(d), specialistIdlePath(d));
        scene.load.image(specialistStrikeKey(d), specialistStrikePath(d));
        scene.load.image(specialistWindupKey(d), specialistWindupPath(d));
        for (let i = 0; i < SPECIALIST_DEATH_FRAMES; i++) scene.load.image(specialistDeathFrameKey(d, i), specialistDeathFramePath(d, i));
      }
      for (const d of SPECIALIST_WALK_DIRS) for (let i = 0; i < SPECIALIST_WALK_FRAMES; i++) scene.load.image(specialistWalkFrameKey(d, i), specialistWalkFramePath(d, i));
      for (const d of SPECIALIST_HIT_DIRS) for (let i = 0; i < SPECIALIST_HIT_FRAMES; i++) scene.load.image(specialistHitFrameKey(d, i), specialistHitFramePath(d, i));
      for (const d of SPECIALIST_BATON_DIRS) for (let i = 0; i < SPECIALIST_BATON_FRAMES; i++) scene.load.image(specialistBatonFrameKey(d, i), specialistBatonFramePath(d, i));
      for (const d of SPECIALIST_TASER_DIRS) for (let i = 0; i < SPECIALIST_TASER_FRAMES; i++) scene.load.image(specialistTaserFrameKey(d, i), specialistTaserFramePath(d, i));
      for (const d of SPECIALIST_RANGED_DIRS) for (let i = 0; i < SPECIALIST_RANGED_FRAMES; i++) scene.load.image(specialistRangedFrameKey(d, i), specialistRangedFramePath(d, i));
      for (const d of SPECIALIST_BOLT_DIRS) for (let i = 0; i < SPECIALIST_BOLT_FRAMES; i++) scene.load.image(specialistBoltFrameKey(d, i), specialistBoltFramePath(d, i));
    }
    // Breaker Type 2 art (Rust-BreakerType2 folder), only for levels whose waves send it in (Level 2 elites).
    if (levelHasBreaker2(level)) {
      for (const d of BREAKER2_DIRS) {
        scene.load.image(breaker2RotationKey(d), breaker2RotationPath(d));
        for (let i = 0; i < BREAKER2_WALK_FRAMES; i++) scene.load.image(breaker2WalkFrameKey(d, i), breaker2WalkFramePath(d, i));
        for (let i = 0; i < BREAKER2_ATTACK_FRAMES; i++) scene.load.image(breaker2AttackFrameKey(d, i), breaker2AttackFramePath(d, i));
        for (let i = 0; i < BREAKER2_DEATH_FRAMES; i++) scene.load.image(breaker2DeathFrameKey(d, i), breaker2DeathFramePath(d, i));
        for (let i = 0; i < BREAKER2_FLIP_FRAMES; i++) scene.load.image(breaker2FlipFrameKey(d, i), breaker2FlipFramePath(d, i));
      }
      for (const d of BREAKER2_HIT_DIRS) for (let i = 0; i < BREAKER2_HIT_FRAMES; i++) scene.load.image(breaker2HitFrameKey(d, i), breaker2HitFramePath(d, i));
    }
    // Dugan's own art (BrickDugan folder), only for levels that send him in.
    if (levelHasDugan(level)) for (const a of duganAssets()) scene.load.image(a.key, a.path);
    // Railgun Royce's own art (Railgun Royce folder), only for levels whose waves send him in (Level 2 wave 5).
    if (levelHasRoyce(level)) for (const a of royceAssets()) scene.load.image(a.key, a.path);
    // Crusher Kane's own art (Crusher Kane folder), only for levels whose waves send him in (Level 3 wave 5).
    if (levelHasKane(level)) for (const a of kaneAssets()) scene.load.image(a.key, a.path);
    // Glitch's own art (Glitch folder), only for levels whose waves send him in (Level 4 wave 5).
    if (levelHasGlitch(level)) for (const a of glitchAssets()) scene.load.image(a.key, a.path);
    // Raptor (Level 5 wave 5) and Subject 88 (Level 6 wave 5): their own art folders, only for levels that send them in.
    if (levelHasRaptor(level)) for (const a of raptorAssets()) scene.load.image(a.key, a.path);
    if (levelHasSubject88(level)) for (const a of subject88Assets()) scene.load.image(a.key, a.path);
    // Overseer Halden Varr (Level 8 final boss): both phases' art, only for the level that sends him in.
    if (levelHasVarr(level)) for (const a of varrAssets()) scene.load.image(a.key, a.path);
    scene.load.image(PICKUP.spriteKey, PICKUP.spritePath);
    scene.load.image(WEAPON.spriteKey, WEAPON.spritePath);
  return bgKey;
}

/** Boss + results music: streamed in after the fight has started (they are needed minutes later). Safe to call twice. */
export function loadDeferredArenaAudio(scene, level) {
  const bm = bossMusicFor(level.id);
  if (!scene.cache.audio.exists(bm.key)) scene.load.audio(bm.key, bm.path);
  if (!scene.cache.audio.exists('result.sting')) scene.load.audio('result.sting', 'assets/sound/level-complete-sting.mp3'); // "Level Complete Splash" by GreyFrogGames, CC0
  if (!scene.cache.audio.exists('result.music')) scene.load.audio('result.music', 'assets/sound/results-funky-house.mp3'); // "Funky House" by Of Far Different Nature, CC0
  if (scene.load.list.size > 0 && !scene.load.isLoading()) scene.load.start();
}

export default class ArenaScene extends Phaser.Scene {
  constructor() { super('ArenaScene'); }

  // data.levelIndex picks the level (ResultScene's NEXT LEVEL passes it); ?level=N does the same for testing.
  init(data) {
    this.levels = this.game.registry.get('levels') || [legacyLevel()];
    const q = Number(new URLSearchParams(globalThis.location?.search).get('level')) - 1;
    const want = data && Number.isInteger(data.levelIndex) ? data.levelIndex : Number.isInteger(q) && q >= 0 ? q : 0;
    this.levelIndex = Math.min(Math.max(0, want), this.levels.length - 1);
    this.level = this.levels[this.levelIndex];
    // ?wave=N (1-based) drops straight into wave N of the level, for testing one fight (e.g. /?level=1&wave=5 is the Dugan wave).
    const wq = Number(new URLSearchParams(globalThis.location?.search).get('wave')) - 1;
    this.startWave = Number.isInteger(wq) && wq > 0 ? Math.min(wq, this.level.waves.length - 1) : 0;
    this.bgKey = null; // set in preload from the level's own background art
  }

  preload() {
    this.bgKey = queueArenaAssets(this, this.level, this.startWave);
    this._showLoadingScreen();
  }

  // Hit spark drawn in code (4-point star, cream with mustard rim); no image file needed.
  _ensureSparkTexture() {
    if (this.textures.exists(SPARK_KEY)) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const pts = [24, 1, 30, 18, 47, 24, 30, 30, 24, 47, 18, 30, 1, 24, 18, 18];
    g.fillStyle(0xfff6d6, 1).lineStyle(3, COLORS.mustard, 1);
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.fillPath(); g.strokePath();
    g.generateTexture(SPARK_KEY, 48, 48); g.destroy();
  }

  // The first entry loads hundreds of sprite frames; without this the player sees a blank screen after FIGHT.
  // Skipped when everything is already cached (later levels), so it never flashes for one frame.
  _showLoadingScreen() {
    if (this.load.list.size === 0) return;
    const D = 9000, name = (this.level && this.level.name ? this.level.name : 'The Arena').toUpperCase();
    const txt = (y, s, size, family, color) => this.add.text(640, y, s, { fontFamily: family, fontSize: `${size}px`, color, stroke: CSS.darkBrown, strokeThickness: size > 30 ? 6 : 3 }).setOrigin(0.5).setDepth(D + 1);
    const status = txt(352, loadingLine(0), 22, FONTS.body, CSS.cream);
    const bar = this.add.rectangle(400, 400, 480, 8, COLORS.mustard).setOrigin(0, 0.5).setScale(0, 1).setDepth(D + 2);
    const ui = [
      this.add.rectangle(640, 360, 1280, 720, COLORS.darkBrown).setDepth(D),
      txt(290, `LEVEL ${this.levelIndex + 1}: ${name}`, 44, FONTS.button, CSS.mustard),
      status,
      this.add.rectangle(640, 400, 480, 8, 0x3a2418).setDepth(D + 1),
      bar,
    ];
    this.load.on('progress', (v) => { bar.setScale(v, 1); status.setText(loadingLine(v)); });
    this.load.once('complete', () => { this.load.off('progress'); ui.forEach((o) => o.destroy()); });
  }

  create() {
    const ev = this.game.events;
    this.ev = ev;
    this.simNow = 0;           // scene clock (ms); stops while the scene is paused
    this.ended = false;
    this.victoryHold = false; this._victoryPending = false; this._victoryTimer = null; this._victoryCard = null; this._afterVictoryFn = null; this.endMode = null; this.bossProfiles = new Map();
    this.stats = this._freshStats();
    this._registerBreakerAnims();
    this._registerBreakerHitAnims();
    this._registerBreakerDeathAnims();
    this._registerBreaker2Anims();
    this._registerRangerAnims();
    this._registerSpecialistAnims();
    this._registerDuganAnims();
    this._registerRoyceAnims();
    this._registerKaneAnims();
    this._registerGlitchAnims();
    this._registerRaptorAnims();
    this._registerSubject88Anims();
    this._registerVarrAnims();
    this.dying = [];           // views of removed (already dead) enemies still playing their death anim
    this.sprites = new Map();  // enemy id -> { body, shadow, ring }
    this._lowDrop = createLowHealthDrop(); // boss mercy-drop limiter
    this._phase2Dropped = new Set();       // bosses that already threw out their phase-2 health items
    this.thrown = [];          // weapons in flight (thrownWeapon.js)
    this.pickups = [];         // health items lying in the breather between waves
    this.score = createScore(); // kills, parry streak + boost, flawless waves (HUD and result screen read it)
    this.hitStopLeft = 0;      // ms of hit-stop remaining; only the attacker and target freeze, the round timer keeps ticking
    this.hitStopIds = new Set();

    this.roundStarted = false;
    const bgKey = this.bgKey && this.textures.exists(this.bgKey) ? this.bgKey : null;
    // The level is wider than one screen: the background art (1920x720, or a wider multiple) repeats along it.
    this.world = { w: this.level.worldWidth, h: WORLD.h };
    this.scrolling = !!this.level.scrolling;
    if (bgKey) this.add.tileSprite(0, 0, this.world.w, this.world.h, bgKey).setOrigin(0, 0).setDepth(-1000);
    else this.add.rectangle(0, 0, this.world.w, this.world.h, COLORS.darkBrown).setOrigin(0, 0).setDepth(-1000); // level art failed to load
    this._ensureSparkTexture();
    const ov = this.level.style.background.overlay;
    if (ov && ov.alpha > 0) {
      this.add.rectangle(0, 0, this.world.w, this.world.h, Phaser.Display.Color.HexStringToColor(ov.color).color, ov.alpha).setOrigin(0, 0).setDepth(-999);
    }
    addAmbient(this, this.level.style, this.world.w);
    this.physics.world.setBounds(0, 0, this.world.w, GROUND_Y);
    this.cameras.main.setBounds(0, 0, this.world.w, this.world.h);
    if (this.startWave) this.cameras.main.scrollX = this.level.waves[this.startWave].lockX; // testing one wave: start on its screen, no pan across the level
    this.levelDone = false;
    if (this.scrolling) this._buildExit();
    this.cameras.main.fadeIn(250, 0, 0, 0);

    // Order matters: combat and state listen before anything emits.
    this.resolver = createHitResolver(ev, () => this.simNow);
    this.state = createRoundState(ev, { seconds: this.level.timeLimitSec });
    this.zed = new Zed(this, this.startWave ? this.level.waves[this.startWave].lockX + 360 : 200, GROUND_Y - 36);
    this.zed.getXRange = () => this.arena.bounds.xRange; // lets Zed stop his run animation when pushed against a wall
    this.zed.setLevel(this.levelIndex + 1);            // Rage meter: hidden on level 1, active from level 2
    this.rageWaveHold = false;                         // Rage drain pauses between waves (wave-cleared -> wave-started)
    this.zed.sprite.setAlpha(0);                       // physics body only; the visual below is the art
    this.zedShadow = this.add.ellipse(0, 0, 54, 14, 0x000000, 0.25);
    this.zedVisual = new ZedVisual(this);

    this.arena = new Arena({
      events: ev,
      waves: this.level.waves,
      world: this.world,
      hold: this.scrolling,
      getPlayer: () => ({ x: this.zed.x, facing: this.zed.facing }),   // spawn patterns react to where Zed is and faces
      getTarget: () => ({ x: this.zed.x, y: this.zed.laneY, lift: Math.max(0, GROUND_Y - (this.zed.y + 36)) }),   // enemies chase Zed's floor line (depth), so jumping still dodges; lift = jump height (Dugan's Ground Stomp reads it)
      getScrollX: () => this.cameras.main.scrollX,
    });
    this.arena.enemies.onRemoved = (id) => this._removeEnemyView(id);
    this.hitFx = new EnemyHitFx(this, ev, { getEnemy: (id) => this.arena.enemies.get(id), maxHp: GRUNT.maxHp, hurtbox: GRUNT.hurtbox, heavyAt: FINISHER_DAMAGE, finisherAt: HIT_FX_FINISHER_DAMAGE });
    // Rage entry: whole-world freeze on activation (spec: design/art/rage-entry-flash.md). The overlay animates on real time.
    this.rageImpactFx = new RageImpactFx(this, { reduceFlash: () => this._reduceFlash() }); // Rage hits: red/white punch + burst, kill dust
    this.rageFx = new RageEntryFlash(this, {
      getAnchor: () => { const cam = this.cameras.main; return { x: (this.zed.x - cam.worldView.x) * cam.zoom, y: (this.zed.y + this.zed.depthOffset - cam.worldView.y) * cam.zoom }; },
      reduceFlash: () => this._reduceFlash(),
      shake: (ms, intensity) => this._shake(ms, intensity),
      onFreeze: () => { this._clearHitStop(); this.zed._setRunSound(false); this.anims.pauseAll(); this.physics.world.pause(); },
      onThaw: () => { this.anims.resumeAll(); this.physics.world.resume(); },
    });
    this.royceFx = new RoyceFx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.traps), onSlam: () => this._shake(220, 0.006), reduceFlash: () => this._reduceFlash() }); // Royce: slam circle, rail-trap strips, taser bolt
    this.kaneFx = new KaneFx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.patches), onHammer: () => this._shake(420, this._reduceFlash() ? 0.009 : 0.016), reduceFlash: () => this._reduceFlash() }); // Kane: hammer circle, hook chain, steam cone and patches
    this.raptorFx = new RaptorFx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.skin === RAPTOR_ID), onSlam: (b, kind) => { if (kind === 'falcon') this._shake(560, this._reduceFlash() ? 0.012 : 0.028); else this._shake(200, 0.005); /* Falcon Drop is his big move: mega shake, same class as Zed's heavy finisher (0.024) */ if (this.cache.audio.exists(RAPTOR_SLAM_KEY)) this.sound.play(RAPTOR_SLAM_KEY, { volume: RAPTOR_SLAM_VOLUME, rate: RAPTOR_SLAM_RATE }); }, reduceFlash: () => this._reduceFlash() }); // Raptor: ground marker, falcon shadow, dust
    this.subject88Fx = new Subject88Fx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.hazards !== undefined), onBurst: () => this._shake(220, 0.006), reduceFlash: () => this._reduceFlash() }); // Subject 88: gas, puddles, spit mark, charge lane, explosion ring
    this.varrFx = new VarrFx(this, {
      getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.shieldHp !== undefined && g.collapseDone !== undefined),
      getXRange: () => this.arena.bounds.xRange,
      onCue: (name) => { const c = VARR_CUES[name]; if (c && this.cache.audio.exists(c.key)) this.sound.play(c.key, { volume: c.volume, rate: c.rate }); },
      onShake: (ms, intensity) => this._shake(ms, intensity),
      reduceFlash: () => this._reduceFlash(),
    }); // Varr: shield bubble, call ring, slam circle, taser line, control sweep, drone lasers, collapse ring, electrified walls, phase 2 flash + banner
    this.glitchFx = new GlitchFx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.miniBoss && g.decoys), getScale: (g) => (BREAKER_DISPLAY_SIZE / 48) * (g.visualScale || 1), getFeetFrac: (k) => this._feetFrac(k), reduceFlash: () => this._reduceFlash() }); // Glitch: disk line, drone lanes, hologram decoys, data-spike line, teleport flash
    this.megaStompFx = new MegaStompFx(this, { getBosses: () => this.arena.enemies.list().filter((g) => g.isBoss), onSlam: (g) => this._startHitStop('megaStomp', [g.id]), reduceFlash: () => this._reduceFlash() });
    this.wallSlamFx = new WallSlamFx(this, { events: ev, getZed: () => ({ x: this.zed.x, feetY: this.zed.laneY, vx: this.zed.sprite.body.velocity.x }), getXRange: () => this.arena.bounds.xRange, reduceFlash: () => this._reduceFlash() });
    this.grabCue = new GrabBreakCueFx(this, { events: ev, getZed: () => this.zed, getHeadTop: () => this.zedVisual.image.getBounds().top, reduceFlash: () => this._reduceFlash() });

    this.boltFx = new SpecialistBoltFx(this, { getBolts: () => this.arena.enemies.bolts, reduceFlash: () => this._reduceFlash(), scale: 2 }); // Copper Fang Taser volley: muzzle flash, dart, trail, impact
    this.zedShockFx = new ZedShockFx(this, { events: ev, getAttackerSkin: (id) => this.arena.enemies.get(id)?.skin ?? null, getImage: () => this.zedVisual.image, reduceFlash: () => this._reduceFlash() }); // Zed's electrified body after a Copper Fang taser hit
    this._listen(EVENTS.DAMAGE_APPLIED, (d) => this._onDamage(d));
    this._listen(EVENTS.ENTITY_REGISTERED, (p) => { if (p.boss && p.bossProfile) (this.bossProfiles ||= new Map()).set(p.id, p.bossProfile); });
    // Boss intro story card: the boss walks in, stops in idle, the card plays, then the fight goes on (see _updateBossIntro). Shown once per round start, not on retry.
    this._introSeen = new Set(); this._introPending = null; this._introCard = null;
    this._listen(EVENTS.ENTITY_REGISTERED, (p) => { const prof = p.boss ? p.bossProfile : p.leader ? p.enemy : null; if (prof && bossIntroFor(prof) && !this._introSeen.has(prof)) this._introPending = { id: p.id, profile: prof }; }); // bosses, and wave leaders that are plain grunts (Level 5 Raptor, Level 6 Subject 88)
    this._listen(EVENTS.ENTITY_DIED, (d) => {
      if (d.team !== 'rust') return;
      this._onBossDied(d.id);
      this.stats.defeated++;
      const g = this.arena.enemies.get(d.id);
      this._award(this.score.onKill(g ? g.maxHp / GRUNT.maxHp : 1, this.simNow), g);
    });
    this._listen(EVENTS.PARRY_STUN, () => this._award(this.score.onParry(this.simNow), this.zed));
    this._listen(EVENTS.DAMAGE_APPLIED, (d) => { if (d.targetId === PLAYER_ID && d.amount > 0) this.score.onDamage(); });
    this._listen(EVENTS.WAVE_STARTED, () => this.score.onWaveStart());
    this._listen(EVENTS.WAVE_STARTED, ({ index }) => { if (this.level.restartTimerOnBoss && this.level.waves[index]?.leader) this.state.restart(); }); // boss battle gets a fresh clock
    this._listen(EVENTS.WAVE_CLEARED, ({ index }) => {
      this.stats.wavesCleared++;
      if (this.scrolling && index + 1 >= this.level.waves.length) this._showExit();
      if (this.scrolling) this._dropPickup(index);
      if (index + 1 >= this.level.waves.length) this._dropFinishLoot(this.level.waves[index]);
      this._award(this.score.onWaveCleared(this.simNow), null);
    });
    this._listen(PLAYER_THROW, (t) => this._throwWeapon(t));
    this._listen(EVENTS.PLAYER_SLAMMED, (p) => { this._startHitStop('gripSlam', [p.attackerId]); }); // the camera shake and impact picture come from WallSlamFx // Dugan's Wall Slam lands on Zed
    this._listen(RAGE_EVENTS.ACTIVATED, () => { if (!this.ended && !this.victoryHold) this.rageFx.start(); }); // start() ignores a second call mid-freeze
    this._listen(EVENTS.WAVE_CLEARED, () => { this.rageWaveHold = true; });
    this._listen(EVENTS.WAVE_STARTED, () => { this.rageWaveHold = false; });
    this._listen(EVENTS.ROUND_WON, (p) => this._endRound('win', p.reason));
    this._listen(EVENTS.ROUND_LOST, (p) => this._endRound('lose', p.reason));
    this._listen(EVENTS.RETRY, () => { this.ended = false; this.levelDone = false; this.rageWaveHold = false; this._hideExit(); this.stats = this._freshStats(); this.rageFx.cancel(); this._clearHitStop(); this.megaStompFx.reset(); this.royceFx.reset(); this.boltFx.reset(); this.kaneFx.reset(); this.glitchFx.reset(); this.raptorFx.reset(); this.subject88Fx.reset(); this.varrFx.reset(); this.wallSlamFx.reset(); this.grabCue.reset(); this.zedShockFx.reset(); this._destroyDying(); this._clearPickups(); this._clearThrown(); this._lowDrop = createLowHealthDrop(); this._phase2Dropped = new Set(); this.score.reset(); this._resetVictory(); });

    // Start the round only once the HUD exists, or it misses the first wave-started / timer-tick.
    this.scene.launch('HudScene', { level: this.level, number: this.levelIndex + 1, total: this.levels.length });
    // ?sandbox: empty arena for testing Zed's moves; no waves, timer or lose condition.
    this.sandbox = new URLSearchParams(globalThis.location?.search).has('sandbox');
    // The round begins when both the HUD exists and the level intro card is dismissed.
    let hudReady = false, introDone = this.sandbox;
    const begin = () => {
      if (!hudReady || !introDone || this.sandbox) return;
      this.roundStarted = true; this.arena.start(this.startWave); this.state.start();
    };
    this.scene.get('HudScene').events.once('create', () => { hudReady = true; begin(); });
    if (!this.sandbox) {
      showLevelCard(this, { number: this.levelIndex + 1, total: this.levels.length, name: this.level.name, text: this.level.intro },
        () => {
          // Level 2 only: the Rage explainer card follows the level card, before the first wave.
          if (shouldShowRageIntro(this.levelIndex + 1)) showRageIntroCard(this, () => { introDone = true; begin(); });
          else { introDone = true; begin(); }
        });
    }

    this.keys = this.input.keyboard.addKeys({ esc: 'ESC', p: 'P' });
    // Pause spec: auto-pause on tab blur, gamepad Start opens pause.
    this._onBlur = () => { if (!this.ended && this.scene.isActive()) this._pause(); };
    this.game.events.on('blur', this._onBlur);
    this.padStartPrev = false;
    this._startLevelMusic();
    loadDeferredArenaAudio(this, this.level); // boss + results music stream in while the fight is already running
    this.events.once('shutdown', () => { this.game.events.off('blur', this._onBlur); this._teardown(); });
  }

  // Looping level BGM. Pauses with the scene, stops when the round ends (the results music takes over).
  // The last wave is the end boss wave: the level track fades out and the boss track fades in.
  _musicVol() { return levelMusicVolume(this.registry.get('options')?.musicVolume ?? loadSettings(globalThis.localStorage)?.musicVolume ?? 70); }

  _startLevelMusic() {
    const lm = levelMusicFor(this.level.id);
    const bm = bossMusicFor(this.level.id);
    const total = this.level.waves.length;
    // The track a round starts on: a test start at the boss wave (?wave=N) begins on the boss track.
    const startTrack = () => (isBossWave(this.startWave || 0, total) ? bm : lm);
    this._playBgm(startTrack());
    this._listen(EVENTS.WAVE_STARTED, ({ index }) => { if (isBossWave(index, total)) this._crossfadeTo(bm); });
    // Retry: the spawner restarts first (and may announce the boss wave), then this resets the music for the new round.
    this._listen(EVENTS.RETRY, () => this._playBgm(startTrack()));
    const onPause = () => this.bgm?.pause();
    const onResume = () => { if (this.bgm && !this.ended) this.bgm.resume(); };
    this.events.on('pause', onPause);
    this.events.on('resume', onResume);
    this.events.once('shutdown', () => { this.events.off('pause', onPause); this.events.off('resume', onResume); this._dropBgm(); });
  }

  _dropBgm() {
    if (this._fadingOld) { this._fadingOld.stop(); this._fadingOld.destroy(); this._fadingOld = null; }
    if (this.bgm) { this.bgm.stop(); this.bgm.destroy(); this.bgm = null; }
    this._bgmKey = null;
  }

  _playBgm(track) {
    this._dropBgm();
    if (!track || !this.cache.audio.exists(track.key)) return;
    this.bgm = this.sound.add(track.key, { loop: true, volume: this._musicVol() });
    this._bgmKey = track.key;
    this.bgm.play();
  }

  _crossfadeTo(track) {
    if (!track || this._bgmKey === track.key || !this.cache.audio.exists(track.key)) return;
    const old = this.bgm, vol = this._musicVol();
    this.bgm = this.sound.add(track.key, { loop: true, volume: 0 });
    this._bgmKey = track.key;
    this.bgm.play();
    const next = this.bgm;
    this.tweens.add({ targets: next, volume: vol, duration: BOSS_FADE_MS });
    if (old) {
      this._fadingOld = old;
      this.tweens.add({ targets: old, volume: 0, duration: BOSS_FADE_MS, onComplete: () => { old.stop(); old.destroy(); if (this._fadingOld === old) this._fadingOld = null; } });
    }
  }

  /** Fraction of the texture height where the lowest opaque pixel sits (cached); keeps feet on the shadow for any frame size. */
  _feetFrac(key) {
    this._feet = this._feet || new Map();
    if (this._feet.has(key)) return this._feet.get(key);
    // Glitch clips: some frames carry sparks / disks / drones below the boots, so a per-frame lowest pixel makes him hop off the floor.
    // Use the median foot line of the whole clip instead (death falls keep per-frame feet: he really drops).
    // Raptor: every clip is drawn on the same 80px canvas with the idle floor line at row 67. Dive Kick / Falcon Drop frames are airborne art (feet at row 59),
    // so per-frame feet (or a clip median) shoved the body up and down and sank the crouch frames under the floor. One fixed floor line for all clips.
    if (/^rust\.raptor\.(?!death|rot)/.test(key) && this.textures.exists('rust.raptor.idle.east.0')) {
      const f = this._rawFeetFrac('rust.raptor.idle.east.0'); this._feet.set(key, f); return f;
    }
    const gm = /^(rust\.glitch\.(?!death)[a-z_]+\.(?:east|west|north|south))\.(\d+)$/.exec(key);
    if (gm) {
      const fracs = [];
      for (let i = 0; this.textures.exists(`${gm[1]}.${i}`); i++) fracs.push(this._rawFeetFrac(`${gm[1]}.${i}`));
      fracs.sort((a, b) => a - b);
      const med = fracs[Math.floor(fracs.length / 2)];
      this._feet.set(key, med);
      return med;
    }
    const frac = this._rawFeetFrac(key);
    this._feet.set(key, frac);
    return frac;
  }

  /** Lowest opaque pixel of one texture as a fraction of its height (uncached by clip; see _feetFrac). */
  _rawFeetFrac(key) {
    let frac = 0.94;
    try {
      const img = this.textures.get(key).getSourceImage();
      const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
      const px = cx.getImageData(0, 0, w, h).data;
      let bot = -1;
      for (let y = h - 1; y >= 0 && bot < 0; y--) for (let x = 0; x < w; x++) if (px[(y * w + x) * 4 + 3] > 20) { bot = y; break; }
      if (bot >= 0) frac = (bot + 1) / h;
    } catch { /* keep default */ }
    return frac;
  }

  _registerBreakerAnims() {
    for (const d of BREAKER_DIRS) {
      const key = breakerWalkAnimKey(d);
      if (this.anims.exists(key) || !this.textures.exists(breakerFrameKey(d, 0))) continue;
      this.anims.create({
        key, frameRate: BREAKER_WALK_FPS, repeat: -1,
        frames: Array.from({ length: BREAKER_FRAMES }, (_, i) => ({ key: breakerFrameKey(d, i) })),
      });
      const atk = breakerAttackAnimKey(d);
      if (!this.anims.exists(atk) && this.textures.exists(breakerAttackFrameKey(d, 0))) {
        this.anims.create({
          key: atk, repeat: 0, duration: BREAKER_ATTACK_MS,
          frames: Array.from({ length: BREAKER_ATTACK_FRAMES }, (_, i) => ({ key: breakerAttackFrameKey(d, i) })),
        });
      }
    }
  }

  _registerBreakerHitAnims() {
    for (const d of Object.keys(BREAKER_HIT_DIRS)) {
      const key = breakerHitAnimKey(d);
      if (this.anims.exists(key) || !this.textures.exists(breakerHitFrameKey(d, 0))) continue;
      // Frame rate is a default only; each play sets timeScale to fit the grunt's actual hit-stun.
      this.anims.create({
        key, repeat: 0, frameRate: 30,
        frames: Array.from({ length: BREAKER_HIT_FRAMES }, (_, i) => ({ key: breakerHitFrameKey(d, i) })),
      });
    }
  }

  _hasRanger() { return levelHasRanger(this.level); }

  _registerRangerAnims() {
    if (!this.textures.exists(rangerRotationKey('east'))) return;
    const mk = (key, n, frameKey, cfg) => {
      if (this.anims.exists(key) || !this.textures.exists(frameKey(0))) return;
      this.anims.create({ key, ...cfg, frames: Array.from({ length: n }, (_, i) => ({ key: frameKey(i) })) });
    };
    for (const d of RANGER_DIRS) {
      mk(rangerAttackAnimKey(d), RANGER_ATTACK_FRAMES, (i) => rangerAttackFrameKey(d, i), { repeat: 0, duration: RANGER_ATTACK_MS });
      mk(rangerDeathAnimKey(d), RANGER_DEATH_FRAMES, (i) => rangerDeathFrameKey(d, i), { repeat: 0, frameRate: RANGER_DEATH_DEFAULT_FPS });
    }
    for (const d of RANGER_WALK_DIRS) mk(rangerWalkAnimKey(d), RANGER_WALK_FRAMES, (i) => rangerWalkFrameKey(d, i), { frameRate: RANGER_WALK_FPS, repeat: -1 });
    for (const d of ['east', 'west']) mk(rangerHitAnimKey(d), RANGER_HIT_FRAMES, (i) => rangerHitFrameKey(d, i), { repeat: 0, frameRate: 30 });
  }

  _hasSpecialist() { return levelHasSpecialist(this.level); }

  _registerSpecialistAnims() {
    if (!this.textures.exists(specialistIdleKey('east'))) return;
    const mk = (key, n, frameKey, cfg) => {
      if (this.anims.exists(key) || !this.textures.exists(frameKey(0))) return;
      this.anims.create({ key, ...cfg, frames: Array.from({ length: n }, (_, i) => ({ key: frameKey(i) })) });
    };
    for (const d of SPECIALIST_DIRS) mk(specialistDeathAnimKey(d), SPECIALIST_DEATH_FRAMES, (i) => specialistDeathFrameKey(d, i), { repeat: 0, frameRate: SPECIALIST_DEATH_DEFAULT_FPS });
    for (const d of SPECIALIST_WALK_DIRS) mk(specialistWalkAnimKey(d), SPECIALIST_WALK_FRAMES, (i) => specialistWalkFrameKey(d, i), { frameRate: SPECIALIST_WALK_FPS, repeat: -1 });
    for (const d of SPECIALIST_HIT_DIRS) mk(specialistHitAnimKey(d), SPECIALIST_HIT_FRAMES, (i) => specialistHitFrameKey(d, i), { repeat: 0, frameRate: 30 });
    for (const d of SPECIALIST_BATON_DIRS) mk(specialistBatonAnimKey(d), SPECIALIST_BATON_FRAMES, (i) => specialistBatonFrameKey(d, i), { repeat: 0, frameRate: SPECIALIST_BATON_FPS });
    for (const d of SPECIALIST_TASER_DIRS) mk(specialistTaserAnimKey(d), SPECIALIST_TASER_FRAMES, (i) => specialistTaserFrameKey(d, i), { repeat: 0, frameRate: SPECIALIST_TASER_FPS });
    for (const d of SPECIALIST_RANGED_DIRS) {
      mk(specialistRangedAnimKey(d), SPECIALIST_RANGED_FIRE_ORDER.length, (i) => specialistRangedFrameKey(d, SPECIALIST_RANGED_FIRE_ORDER[i]), { repeat: 0, frameRate: SPECIALIST_RANGED_FPS });
      mk(specialistRangedAimKey(d), SPECIALIST_RANGED_AIM_FRAMES, (i) => specialistRangedFrameKey(d, i), { repeat: 0, frameRate: SPECIALIST_RANGED_FPS });
    }
  }

  _hasBreaker2() { return levelHasBreaker2(this.level); }

  _registerBreaker2Anims() {
    if (!this.textures.exists(breaker2RotationKey('east'))) return;
    const mk = (key, n, frameKey, cfg) => {
      if (this.anims.exists(key) || !this.textures.exists(frameKey(0))) return;
      this.anims.create({ key, ...cfg, frames: Array.from({ length: n }, (_, i) => ({ key: frameKey(i) })) });
    };
    for (const d of BREAKER2_DIRS) {
      mk(breaker2WalkAnimKey(d), BREAKER2_WALK_FRAMES, (i) => breaker2WalkFrameKey(d, i), { frameRate: BREAKER2_WALK_FPS, repeat: -1 });
      mk(breaker2AttackAnimKey(d), BREAKER2_ATTACK_FRAMES, (i) => breaker2AttackFrameKey(d, i), { repeat: 0, duration: BREAKER2_ATTACK_MS });
      mk(breaker2FlipAnimKey(d), BREAKER2_FLIP_FRAMES, (i) => breaker2FlipFrameKey(d, i), { repeat: 0, frameRate: BREAKER2_FLIP_FPS });
      mk(breaker2DeathAnimKey(d), BREAKER2_DEATH_FRAMES, (i) => breaker2DeathFrameKey(d, i), { repeat: 0, frameRate: BREAKER2_DEATH_DEFAULT_FPS });
    }
    // One hit anim (east frames); a west-facing hit mirrors it (pose.flipX). Frame rate is a default; each play fits the stun via timeScale.
    mk(breaker2HitAnimKey('east'), BREAKER2_HIT_FRAMES, (i) => breaker2HitFrameKey('east', i), { repeat: 0, frameRate: 30 });
  }

  _hasDugan() { return levelHasDugan(this.level); }

  _hasRoyce() { return levelHasRoyce(this.level); }

  _hasKane() { return levelHasKane(this.level); }

  _hasGlitch() { return levelHasGlitch(this.level); }

  _registerGlitchAnims() {
    if (!this.textures.exists(glitchRotationKey('east'))) return;
    for (const d of glitchAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerRaptorAnims() {
    if (!this.textures.exists(raptorRotationKey('east'))) return;
    for (const d of raptorAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerSubject88Anims() {
    if (!this.textures.exists(subject88RotationKey('east'))) return;
    for (const d of subject88AnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerVarrAnims() {
    if (!this.textures.exists(varrRotationKey('east'))) return;
    for (const d of varrAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerKaneAnims() {
    if (!this.textures.exists(kaneRotationKey('east'))) return;
    for (const d of kaneAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerRoyceAnims() {
    if (!this.textures.exists(royceRotationKey('east'))) return;
    for (const d of royceAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerDuganAnims() {
    if (!this.textures.exists(duganRotationKey('east'))) return;
    for (const d of duganAnimDefs()) {
      if (this.anims.exists(d.key) || !this.textures.exists(d.frames[0])) continue;
      this.anims.create({ key: d.key, frameRate: d.frameRate, repeat: d.repeat, frames: d.frames.map((key) => ({ key })) });
    }
  }

  _registerBreakerDeathAnims() {
    for (const d of Object.keys(BREAKER_DEATH_DIRS)) {
      const key = breakerDeathAnimKey(d);
      if (this.anims.exists(key) || !this.textures.exists(breakerDeathFrameKey(d, 0))) continue;
      // Default rate only; the play sets timeScale to fit BREAKER_DEATH_MS (play({duration}) is ignored in this build).
      this.anims.create({
        key, repeat: 0, frameRate: BREAKER_DEATH_DEFAULT_FPS,
        frames: Array.from({ length: BREAKER_DEATH_FRAMES }, (_, i) => ({ key: breakerDeathFrameKey(d, i) })),
      });
    }
  }

  /**
   * Death view of one enemy. Gameplay already counts it dead; the view waits until its health bar has emptied (drain + fade),
   * then plays the collapse once, holds the last frame and fades. Returns true when the view is finished and can be destroyed.
   */
  _driveDeath(v, id, pose, dt, force = false) {
    const d = (v.death ||= { t: null });
    if (d.t === null && (force || this.hitFx.barEmptied(id))) {
      d.t = 0;
      d.gy = v.body.y; // floor line the Ranger falls onto
      if (pose.rangerFall) v.body.anims.stop();
      else if (this.anims.exists(pose.anim)) {
        v.body.play(pose.anim);
        v.body.anims.timeScale = pose.deathTimeScale ?? breakerDeathTimeScale();
      } else v.body.setTexture(pose.rotation);
    }
    if (d.t === null) return false;   // bar still draining: keep showing whatever the enemy was doing
    d.t += dt;
    if (pose.rangerFall) { // the Ranger's clip never lands: step through its knock-back frames and seat the lowest pixel on the floor
      const f = rangerFallState(d.t, pose.dir);
      v.body.setTexture(rangerDeathFrameKey('east', f.frame)).setFlipX(f.flipX).setOrigin(0.5, f.bottom / RANGER_FRAME_PX);
      v.body.y = d.gy - f.lift * v.body.scaleY;
    }
    const ph = deathViewPhase(d.t);
    v.body.setAlpha(ph.alpha); v.shadow.setAlpha(ph.alpha);
    // The collapsed pile is ~140px wide and centred on the enemy: nudge it inside the visible screen so it is not cropped at the edge.
    if (d.t > 0) {
      const cam = this.cameras.main, half = BREAKER_DEATH_HALF_WIDTH;
      const x = Phaser.Math.Clamp(v.body.x, cam.scrollX + half, cam.scrollX + cam.width - half);
      v.body.x = x; v.shadow.x = x;
    }
    // Dugan's fall is drawn on a 96px canvas whose lowest pixel rises as he goes down (standing 76, collapsed 61-65): keep re-seating the feet row
    // of the frame on screen. After he leaves the enemy list nothing else does it, so he used to stay at his standing origin and float.
    if (v.duganArt && d.t > 0) {
      const flat = (v.body.anims.currentFrame?.index ?? 1) >= DUGAN_SINK_FROM_FRAME; // lying flat: sink the body onto its shadow
      v.body.setOrigin(0.5, this._feetFrac(v.body.texture.key) - (flat ? DUGAN_SINK_PX / Math.max(1, v.body.displayHeight) : 0));
    }
    return ph.phase === 'done';
  }

  _freshStats() { return { defeated: 0, wavesCleared: 0 }; }

  _listen(name, fn) {
    this.ev.on(name, fn);
    (this._listeners ||= []).push([name, fn]);
  }

  _teardown() {
    for (const [n, f] of this._listeners || []) this.ev.off(n, f);
    this._listeners = [];
    this.rageFx.destroy(); this.rageImpactFx.destroy(); this.megaStompFx.destroy(); this.royceFx.destroy(); this.boltFx.destroy(); this.kaneFx.destroy(); this.glitchFx.destroy(); this.raptorFx.destroy(); this.subject88Fx.destroy(); this.varrFx.destroy(); this.wallSlamFx.destroy(); this.grabCue.destroy(); this.zedShockFx.destroy(); this.hitFx.destroy(); this.state.destroy(); this.resolver.destroy(); this.arena.dispose(); this.zed.destroy();
    this.sprites.clear(); this.dying.length = 0;
    this.scene.stop('HudScene'); this.scene.stop('ResultScene');
  }

  update(_t, dt) {
    // Rage entry freeze: real-time countdown first. Knockout / round end cancels it at once.
    if (this.rageFx.frozen) { if (this.ended || this.zed.dead) this.rageFx.cancel(); else this.rageFx.tick(dt); }
    this.rageImpactFx.tick(dt);
    const rageFrozen = this.rageFx.frozen;
    const escHit = Phaser.Input.Keyboard.JustDown(this.keys.esc) || Phaser.Input.Keyboard.JustDown(this.keys.p); // always consumed, so a press during the freeze does not pause afterwards
    if (escHit && !rageFrozen) {
      if (!this.ended && !this.victoryHold) return this._pause();
    }
    const pad = this.input.gamepad && this.input.gamepad.total ? this.input.gamepad.getPad(0) : null;
    const start = !!(pad && pad.buttons[9] && pad.buttons[9].pressed);
    if (start && !this.padStartPrev && !this.ended && !this.victoryHold && !rageFrozen) { this.padStartPrev = true; return this._pause(); }
    this.padStartPrev = start;
    if (!rageFrozen) { this.simNow += dt; this._tickHitStop(dt); } // sim clock stops during the freeze
    const zedFrozen = this.hitStopIds.has(PLAYER_ID) || this.victoryHold || rageFrozen;
    if (!zedFrozen && (this.roundStarted || this.sandbox)) this.zed.update(this.simNow, dt);
    else if (!this.roundStarted || this.victoryHold) this.zed._setRunSound(false);
    // Rage clocks: frozen by intro card/cutscene (round not started), wave transitions and round end. The pause menu stops this update entirely.
    // Rage activating this very frame (inside zed.update) also holds, so the 9 s starts after the freeze.
    this.zed.tickRage(dt, !(this.roundStarted || this.sandbox) || this.ended || this.rageWaveHold || this.victoryHold || this.rageFx.frozen);
    const simFrozen = this.rageFx.frozen;
    const c = this.arena.bounds.clamp({ x: this.zed.x, y: GROUND_Y });
    if (c.x !== this.zed.x) { this.zed.sprite.x = c.x; this.zed.sprite.body.setVelocityX(0); }

    if (!this.ended && !this.sandbox && this.roundStarted && !this.victoryHold && !simFrozen) {
      this.arena.update(dt, this.hitStopIds);
      this.state.tick(dt);
      this._updateBossIntro();
    }
    if (this.scrolling && this.roundStarted && !this.ended && !this.victoryHold && !simFrozen) this._scrollProgress();
    if (this.roundStarted && !this.ended && !this.victoryHold && !simFrozen) { this._glitchPhase2Drops(); this._collectPickups(); this._updateThrown(dt); } // pickups work on non-scrolling levels too
    this.arena.applyToCamera(this.cameras.main, this.zed.x);
    this._render(simFrozen ? 0 : dt, zedFrozen || simFrozen);
  }

  // ---- side-scroller progress: clear a wave, walk right, next wave locks the screen; after the last, reach the exit ----
  _scrollProgress() {
    const next = this.arena.nextLockX;
    // The camera follows Zed once a wave is cleared; when it reaches the next lock position the wave begins.
    if (this.arena.holding && next !== null && this.zed.x >= next + VIEW.w / 2) this.arena.advance();
    if (this.arena.finished && !this.levelDone && this.zed.x >= this.level.exitX - 30) {
      this.levelDone = true;
      this.ev.emit(EVENTS.ARENA_CLEARED, {}); // round state turns this into round-won
    }
  }

  // ---- score: tell the HUD, and float the points above whoever earned them ----
  _award(r, at) {
    if (!r || r.delta <= 0) return;
    this.ev.emit(EVENTS.SCORE_CHANGED, r);
    if (r.reason === 'kill') return; // kills show in the running total only; parries and flawless waves get a popup
    const cam = this.cameras.main;
    const x = at ? at.x : cam.scrollX + 640, y = at ? (at.y ?? GROUND_Y) - 150 : 300;
    const label = r.reason === 'parry' ? `PARRY${r.streak > 1 ? ` x${r.streak}` : ''}  +${r.delta}` : `FLAWLESS${r.run > 1 ? ` x${r.run}` : ''}  +${r.delta}`;
    const t = this.add.text(x, y, label, { fontFamily: FONTS.button, fontSize: r.reason === 'flawless' ? '52px' : '38px', color: r.reason === 'flawless' ? CSS.mustard : CSS.cream, stroke: CSS.darkBrown, strokeThickness: 7 })
      .setOrigin(0.5).setDepth(6500);
    this.tweens.add({ targets: t, y: y - 70, alpha: 0, delay: 500, duration: 700, onComplete: () => t.destroy() });
  }

  // ---- breather: a cleared wave may leave a health item on the walk to the next fight ----
  _dropPickup(waveIndex) {
    const waves = this.level.waves;
    const drop = pickupDrop(waves[waveIndex], waves[waveIndex + 1], GROUND_Y);
    if (drop) this._spawnPickup(drop);
  }

  /** Level-end loot after the final wave: health items and throwable weapons across the cleared screen. */
  _dropFinishLoot(wave) { for (const d of finishDrops(wave, GROUND_Y)) this._spawnPickup(d); }

  _spawnPickup(drop) {
    const weapon = drop.kind === 'weapon', size = weapon ? WEAPON.displaySize : PICKUP.displaySize;
    const fly = drop.fromX !== undefined;   // boss drop: launched out of the boss and lands far away
    const img = this.add.image(fly ? drop.fromX : drop.x, fly ? drop.fromY - 110 : drop.y - 150, weapon ? WEAPON.spriteKey : PICKUP.spriteKey).setOrigin(0.5, 1).setDepth(fly ? 5000 : drop.y);
    img.setDisplaySize(size, size);
    const shadow = this.add.ellipse(drop.x, drop.y, 44, 12, 0x000000, fly ? 0 : 0.25).setDepth(drop.y - 1);
    const settle = () => { if (img.active) this.tweens.add({ targets: img, y: drop.y - 10, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' }); };
    if (fly) {
      const dur = 650, peak = Math.min(drop.fromY, drop.y) - 260;
      this.tweens.add({ targets: img, x: drop.x, duration: dur, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: img, angle: 360 * (drop.x >= drop.fromX ? 1 : -1), duration: dur });
      this.tweens.add({ targets: img, y: peak, duration: dur * 0.45, ease: 'Quad.easeOut', onComplete: () => {
        if (!img.active) return;
        this.tweens.add({ targets: img, y: drop.y, duration: dur * 0.55, ease: 'Bounce.easeOut', onComplete: () => { if (img.active) { img.setAngle(0).setDepth(drop.y); shadow.setAlpha(0.25); settle(); } } });
      } });
    } else {
      this.tweens.add({ targets: img, y: drop.y, duration: 320, ease: 'Bounce.easeOut', onComplete: settle });
    }
    this.pickups.push({ ...drop, img, shadow });
  }

  /** Boss mercy drop: when Zed is low and he HITS the boss, the boss drops a health item where he stands. */
  _bossHealthDrop(targetId) {
    const hp = this.resolver.getHealth(PLAYER_ID);
    const boss = this.arena.enemies.get(targetId);
    if (!hp || !boss || !(boss.isBoss || boss.miniBoss) || !boss.alive) return;
    const heal = lowHealthDrop(this._lowDrop, hp.hp, hp.maxHp, this.simNow, true);
    if (!heal) return;
    const r = this.arena.bounds.xRange;
    const FLY_PX = 300;   // thrown clear of the fight, towards Zed's side (the other way if the boss is cornered)
    const clamp = (x) => Math.round(Math.max(r.min + 80, Math.min(r.max - 80, x)));
    let dir = this.zed.x >= boss.x ? 1 : -1;
    if (clamp(boss.x + dir * FLY_PX) === clamp(boss.x + dir * 40)) dir = -dir;
    this._spawnPickup({ x: clamp(boss.x + dir * FLY_PX), y: boss.y, heal, fromX: boss.x, fromY: boss.y });
  }

  /** Glitch overclocks (phase 2): he throws out two health items, one each way, so the harder half of the fight is winnable. Once per boss. */
  _glitchPhase2Drops() {
    for (const g of this.arena.enemies.list()) {
      if (!(g.miniBoss && g.decoys && g.phase2 && g.alive) || this._phase2Dropped.has(g.id)) continue;
      this._phase2Dropped.add(g.id);
      const r = this.arena.bounds.xRange;
      const clamp = (x) => Math.round(Math.max(r.min + 80, Math.min(r.max - 80, x)));
      for (const dir of [-1, 1]) this._spawnPickup({ x: clamp(g.x + dir * 320), y: g.y, heal: LOW_HEALTH_DROP.heal, fromX: g.x, fromY: g.y });
    }
  }

  _collectPickups() {
    if (!this.pickups.length) return;
    const hp = this.resolver.getHealth(PLAYER_ID);
    if (!hp) return;
    const z = this.zed, airborne = Math.max(0, GROUND_Y - (z.y + 36));
    for (const p of [...this.pickups]) {
      if (!canCollect(p, z.x, airborne) || Math.abs(p.y - z.laneY) > 60) continue; // must also be on the same floor depth
      if (p.kind === 'weapon') { // weapons: grab one if empty-handed, otherwise it waits
        if (z.carrying || z.dead) continue;
        this.pickups.splice(this.pickups.indexOf(p), 1);
        z.startPickup(); z.carrying = true;
        this._destroyPickup(p);
        continue;
      }
      if (hp.hp >= hp.maxHp) continue; // full health: health items wait on the ground
      const gained = this.resolver.heal(PLAYER_ID, p.heal);
      if (gained <= 0) continue; // already at full health: leave it for later
      this.pickups.splice(this.pickups.indexOf(p), 1);
      this.zed.startPickup(); // crouch-and-grab clip; the heal above already applied
      const t = this.add.text(p.x, p.y - 110, `+${gained}`, { fontFamily: FONTS.button, fontSize: '36px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 6 })
        .setOrigin(0.5).setDepth(6000);
      this.tweens.add({ targets: t, y: t.y - 60, alpha: 0, duration: 800, onComplete: () => t.destroy() });
      this._destroyPickup(p);
    }
  }

  _destroyPickup(p) { this.tweens.killTweensOf(p.img); p.img.destroy(); p.shadow.destroy(); }
  // ---- thrown weapons: fly along Zed's lane, hit the first enemy, vanish ----
  _throwWeapon({ x, y, lane, facing }) {
    const w = new ThrownWeapon({ x: x + facing * 40, y, lane, facing });
    w.img = this.add.image(w.x, y - 60, WEAPON.spriteKey).setDisplaySize(WEAPON.displaySize, WEAPON.displaySize).setDepth(lane + 1);
    this.thrown.push(w);
  }
  _updateThrown(dt) {
    for (const w of [...this.thrown]) {
      const req = w.update(dt);
      if (req) {
        const onHit = (d) => { if (isThrowHit(w, d)) w.kill(); };
        this.ev.on(EVENTS.DAMAGE_APPLIED, onHit);
        this.ev.emit(EVENTS.HIT_REQUEST, req); // the resolver answers synchronously
        this.ev.off(EVENTS.DAMAGE_APPLIED, onHit);
      }
      if (!w.alive) { this._destroyThrown(w); continue; }
      w.img.x = w.x; w.img.angle += WEAPON.spinDegPerSec * dt / 1000 * w.facing;
    }
  }
  _destroyThrown(w) { const i = this.thrown.indexOf(w); if (i >= 0) this.thrown.splice(i, 1); w.img?.destroy(); }
  _clearThrown() { for (const w of [...this.thrown]) this._destroyThrown(w); }

  _clearPickups() { for (const p of this.pickups.splice(0)) this._destroyPickup(p); }

  _buildExit() {
    const x = this.level.exitX, top = LANE.minY - 150, bottom = LANE.maxY + 10;
    const post = (px) => this.add.rectangle(px, (top + bottom) / 2, 14, bottom - top, COLORS.mustard).setDepth(LANE.minY);
    const glow = this.add.rectangle(x, (top + bottom) / 2, 120, bottom - top, COLORS.mustardLight, 0.22).setDepth(LANE.minY - 1);
    const label = this.add.text(x, top - 24, 'EXIT', { fontFamily: FONTS.button, fontSize: '40px', color: CSS.mustard, stroke: CSS.darkBrown, strokeThickness: 6 })
      .setOrigin(0.5).setDepth(LANE.minY);
    this.exitGate = [post(x - 60), post(x + 60), glow, label];
    this.tweens.add({ targets: glow, alpha: 0.4, yoyo: true, repeat: -1, duration: 600 });
    this._hideExit();
  }
  _showExit() { (this.exitGate || []).forEach((o) => o.setVisible(true)); }
  _hideExit() { (this.exitGate || []).forEach((o) => o.setVisible(false)); }

  // ---- hit-stop: freeze the attacker and target for a few ms; everything else (timer, waves, other enemies) keeps running ----
  _startHitStop(type, ids) {
    const ms = mergeHitStop(this.hitStopLeft, type);
    if (ms <= 0) return;
    this.hitStopLeft = ms;
    for (const id of ids) this.hitStopIds.add(id);
    if (this.hitStopIds.has(PLAYER_ID)) this.zed.sprite.body.moves = false; // no gravity or drift while frozen
  }

  _tickHitStop(dt) {
    if (this.hitStopLeft <= 0) return;
    this.hitStopLeft -= dt;
    if (this.hitStopLeft <= 0) this._clearHitStop();
  }

  _clearHitStop() {
    this.hitStopLeft = 0;
    this.hitStopIds.clear();
    if (this.zed?.sprite?.body) this.zed.sprite.body.moves = true;
  }

  _pause() {
    this.scene.launch('ResultScene', { mode: 'pause' });
    this.scene.pause();
  }

  _endRound(mode, reason) {
    if (this.ended) return;
    this.ended = true;
    this.bgm?.stop();
    // round-won fires inside the final entity-died dispatch, before our own counters update.
    const total = this.level.totalEnemies, waves = this.level.waves;
    if (mode === 'win') { this.stats.defeated = total; this.stats.wavesCleared = waves.length; }
    const payload = {
      mode, reason,
      wavesCleared: this.stats.wavesCleared, totalWaves: waves.length,
      levelName: this.level.name, levelNumber: this.levelIndex + 1, totalLevels: this.levels.length,
      outro: this.level.outro, nextLevelIndex: nextLevelIndex(this.levels, this.levelIndex),
      defeated: this.stats.defeated,
      secondsLeft: this.state.secondsLeft, totalSeconds: this.level.timeLimitSec,
      enemiesLeft: total - this.stats.defeated,
      hp: this.resolver.getHealth(PLAYER_ID)?.hp ?? 0,
      score: this.score.state.total, parries: this.score.state.parries, bestStreak: this.score.state.bestStreak, flawlessWaves: this.score.state.flawlessWaves,
    };
    this.endMode = mode;
    this.time.delayedCall(END_DELAY_MS, () => this._afterVictory(() => { // a boss victory card, if one is up or coming, goes first
      const s = this.score.state; // read now: the boss-kill points land after round-won fires
      Object.assign(payload, { score: s.total, parries: s.parries, bestStreak: s.bestStreak, flawlessWaves: s.flawlessWaves });
      this.scene.launch('ResultScene', payload);
      this.scene.pause();
    }));
  }

  // ---- boss victory card (design/art/victory-card.md; copy in ui/victoryData.js) ----
  /** A boss died: after its fall plays, freeze play and drop the card in. Bosses with no line in victoryData.js get no card. */
  _onBossDied(id) {
    const v = victoryFor(this.bossProfiles?.get(id));
    if (!v || this._victoryTimer || this.victoryHold) return;
    this._victoryPending = true;
    this._victoryTimer = this.time.delayedCall(VICTORY.showDelayMs, () => {
      this._victoryTimer = null;
      if (this.endMode === 'lose') { this._victoryDone(); return; } // Zed fell too: straight to the lose screen
      this.victoryHold = true;
      this._clearHitStop();
      this._victoryCard = showVictoryCard(this, v, () => { this._victoryCard = null; this._victoryDone(); },
        { reduceMotion: this._reduceFlash(), sound: () => this.cache.audio.exists('result.sting') && this.sound.play('result.sting', { volume: 0.6 }) });
    });
  }

  // ---- boss intro story card (copy and art slots in ui/bossIntroData.js) ----
  /** Once the pending boss has walked far enough in, freeze play (same hold as the victory card), stand him in idle and open the card. */
  _updateBossIntro() {
    const p = this._introPending;
    if (!p || this._introCard) return;
    const boss = this.arena.enemies.get(p.id);
    if (!boss || !boss.alive) { this._introPending = null; return; }
    const v = this.cameras.main.worldView;
    if (!introTriggered({ bossX: boss.x, zedX: this.zed.x, viewLeft: v.x, viewRight: v.right })) return;
    this._introPending = null; this._introSeen.add(p.profile);
    this.victoryHold = true; this._clearHitStop();
    boss.holdIdle?.();
    this.scene.setVisible(false, 'HudScene'); // the HUD sits above this scene: hide it so the card is clean
    this._introCard = showBossIntroCard(this, bossIntroFor(p.profile), () => {
      this._introCard = null; this.victoryHold = false; this.scene.setVisible(true, 'HudScene');
      boss.releaseIdle?.();
    }, { reduceMotion: this._reduceFlash() });
  }

  _victoryDone() {
    this.victoryHold = false; this._victoryPending = false;
    const fn = this._afterVictoryFn; this._afterVictoryFn = null;
    if (fn) fn();
  }

  /** Run fn now, or as soon as the victory card is closed. */
  _afterVictory(fn) {
    if (this._victoryPending) this._afterVictoryFn = fn; else fn();
  }

  _resetVictory() {
    if (this._introCard) { this._introCard.cancel(); this._introCard = null; this.scene.setVisible(true, 'HudScene'); }
    this._introPending = null;
    if (this._victoryTimer) { this._victoryTimer.remove(false); this._victoryTimer = null; }
    if (this._victoryCard) { this._victoryCard.cancel(); this._victoryCard = null; }
    this.victoryHold = false; this._victoryPending = false; this._afterVictoryFn = null; this.endMode = null;
  }

  // ---- rendering ----
  _render(dt, zedFrozen = false) {
    const z = this.zed;
    const feetY = z.laneY;                                  // Zed's floor line (depth)
    const airborne = Math.max(0, GROUND_Y - (z.y + 36));    // jump height comes from the physics body
    this.zedVisual.update(z, zedFrozen ? 0 : dt, z.x, z.feetY, feetY);
    this.zedShockFx.update(zedFrozen ? 0 : dt); // after the sprite is posed, so its tint and jitter win
    this.zedShadow.setPosition(z.x, feetY).setDepth(feetY - 1).setScale(1 - Math.min(0.4, airborne / 400));

    const walkers = [];
    for (const g of this.arena.enemies.list()) {
      let v = this.sprites.get(g.id);
      if (!v) {
        const breaker = true; // Rust Bruiser art is used for every enemy in levels 1-8
        const duganArt = !!g.isBoss && this.textures.exists(duganRotationKey('east'));
        const royceArt = !duganArt && g.skin === ROYCE_ID && this.textures.exists(royceRotationKey('east')); // Level 2 mini-boss
        const kaneArt = !duganArt && !royceArt && g.skin === KANE_ID && this.textures.exists(kaneRotationKey('east')); // Level 3 mini-boss
        const glitchArt = !duganArt && !royceArt && !kaneArt && g.skin === GLITCH_ID && this.textures.exists(glitchRotationKey('east')); // Level 4 mini-boss
        const raptorArt = !duganArt && g.skin === RAPTOR_ID && this.textures.exists(raptorRotationKey('east')); // Level 5 mini-boss
        const subject88Art = !duganArt && g.skin === SUBJECT88_ID && this.textures.exists(subject88RotationKey('east')); // Level 6 mini-boss
        const varrArt = !duganArt && g.skin === VARR_ID && this.textures.exists(varrRotationKey('east')); // Level 8 final boss
        const type2 = !duganArt && !royceArt && !kaneArt && !glitchArt && isBreaker2(g.skin) && this.textures.exists(breaker2RotationKey('east')); // Level 2 elites
        const specialist = !duganArt && !royceArt && !kaneArt && !glitchArt && isSpecialist(g.skin) && this.textures.exists(specialistIdleKey('east')); // Rust Specialists, the Copper Fangs (Level 4 waves 1 and 3)
        const ranger = !specialist && !duganArt && !royceArt && !kaneArt && !glitchArt && !type2 && isRanger(g.skin) && this.textures.exists(rangerRotationKey('east')); // Rust Rangers (Level 3 wave 2, Level 4)
        const hasArt = breaker && (duganArt || royceArt || kaneArt || glitchArt || raptorArt || subject88Art || varrArt || type2 || ranger || specialist || this.textures.exists(breakerRotationKey('east')));
        const body = !breaker
          ? this.add.sprite(0, 0, breakerRotationKey('east')).setOrigin(0.5, 0.94).setDisplaySize(112, 112)
          : hasArt
            ? this.add.sprite(0, 0, duganArt ? duganRotationKey('east') : royceArt ? royceRotationKey('east') : kaneArt ? kaneRotationKey('east') : glitchArt ? glitchRotationKey('east') : raptorArt ? raptorRotationKey('east') : subject88Art ? subject88RotationKey('east') : varrArt ? varrRotationKey('east') : specialist ? specialistIdleKey('east') : ranger ? rangerRotationKey('east') : type2 ? breaker2RotationKey('east') : breakerRotationKey('east')).setOrigin(0.5, 0.94).setDisplaySize(BREAKER_DISPLAY_SIZE, BREAKER_DISPLAY_SIZE)
            : this.add.image(0, 0, breakerRotationKey('east')).setOrigin(0.5, 0.94).setDisplaySize(144, 144);
        v = {
          shadow: this.add.ellipse(0, 0, 54, 14, 0x000000, 0.25),
          body, breakerArt: hasArt, duganArt, royceArt, kaneArt, glitchArt, raptorArt, subject88Art, varrArt, type2, ranger, specialist, bornAt: this.simNow,
          ring: this.add.ellipse(0, 0, 10, 10).setStrokeStyle(TELEGRAPH_CUE.ringStrokePx, 0xffa41c).setVisible(false).setDepth(3999), // parry cue: closes as the attack starts
          strip: (g.isBoss || g.chargeWarning !== undefined) ? this.add.rectangle(0, 0, 10, 70, 0xd23a2e, 0.28).setVisible(false).setDepth(LANE.minY) : null, // Dugan's charge lane: a red strip along the floor while he winds up
        };
        this.sprites.set(g.id, v);
      }
      if (v.breakerArt) {
        // The art has real west-facing frames, so no flip: walk anim by movement direction, rotation pose otherwise.
        let pose = v.duganArt ? duganPose(g) : v.royceArt ? roycePose(g) : v.kaneArt ? kanePose(g) : v.glitchArt ? glitchPose(g) : v.raptorArt ? raptorPose(g) : v.subject88Art ? subject88Pose(g) : v.varrArt ? varrPose(g) : v.specialist ? specialistPose(g) : v.ranger ? rangerPose(g) : v.type2 ? breaker2Pose(g) : breakerPose(g);
        if (v.type2 && g.alive) pose = breaker2FlipPose(g, this.simNow - v.bornAt) || pose; // Type 2 entrance: a front flip, then the normal walk
        if (g.alive && (pose.walk || pose.anim === (v.ranger ? rangerWalkAnimKey(pose.dir) : v.type2 ? breaker2WalkAnimKey(pose.dir) : breakerWalkAnimKey(pose.dir)))) walkers.push({ id: g.id, dist: Math.abs(g.x - z.x), lastStepMs: v.stepAt, v });
        v.body.setPosition(g.x, g.y).setDepth(g.y).setFlipX(!!pose.flipX); // real west frames exist, except Type 2's hit (east mirrored)
        if (pose.death) { v.deathPose = pose; this._driveDeath(v, g.id, pose, dt); } // death view drives its own sprite state
        else if (pose.hit && this.anims.exists(pose.anim)) {
          // Fit the 9 frames to this stun; restart on every new hit, otherwise let it run out.
          if (v.hitSeq !== g.hitSeq || v.body.anims.currentAnim?.key !== pose.anim) {
            v.hitSeq = g.hitSeq;
            // play({ duration }) is ignored by this Phaser build, so scale the 30fps default (BREAKER_HIT_FRAMES/30 s) to the stun.
            v.body.play(pose.anim);
            v.body.anims.timeScale = ((pose.frames ?? BREAKER_HIT_FRAMES) * 1000 / 30) / g.hitstunMs;
          }
        } else if (pose.strike && this.anims.exists(pose.anim)) {
          // Specialist baton strike: plays once from frame 0 each time the attack state is entered, the last frame holds; missing frames fall through to the rotation pose.
          if (!v.strikeOn || v.body.anims.currentAnim?.key !== pose.anim) { v.body.anims.timeScale = 1; v.body.play(pose.anim); }
        } else if (pose.still && this.textures.exists(pose.still)) {
          v.body.anims.stop(); v.moveSeq = null; v.body.setTexture(pose.still); // grab: still frames, he has Zed in his hands
        } else if (pose.move && this.anims.exists(pose.anim)) {
          // Dugan's move clips: one run across wind-up + strike, restarted whenever a new move begins; the last frame holds.
          if (v.moveSeq !== pose.seq || v.body.anims.currentAnim?.key !== pose.anim) {
            v.moveSeq = pose.seq;
            v.body.play(pose.anim);
            v.body.anims.timeScale = v.royceArt ? royceFitScale(pose.clip, pose.totalMs) : v.kaneArt ? kaneFitScale(pose.clip, pose.totalMs) : v.glitchArt ? glitchFitScale(pose.clip, pose.totalMs) : v.raptorArt ? raptorFitScale(pose.clip, pose.totalMs) : v.subject88Art ? subject88FitScale(pose.clip, pose.totalMs) : v.varrArt ? varrFitScale(pose.clip, pose.totalMs) : duganFitScale(pose.clip, pose.totalMs);
          }
        } else if (pose.anim && this.anims.exists(pose.anim)) {
          v.body.anims.timeScale = 1;
          v.body.play(pose.anim, true); // attack plays once, restarts only when the state changes
        } else { v.body.anims.timeScale = 1; v.body.anims.stop(); v.body.setTexture(pose.rotation); }
        v.strikeOn = !!pose.strike; // specialist baton strike: next attack restarts the clip
        // Frames come in different canvas sizes (48 rotations, 64-68 walk): fixed pixel scale + origin at the frame's real feet row.
        const key = v.body.texture.key;
        v.body.setScale((BREAKER_DISPLAY_SIZE / 48) * (v.duganArt ? 1 : g.visualScale || 1));
        if (!(pose.rangerFall && v.death?.t != null)) v.body.setOrigin(0.5, this._feetFrac(key)); // a falling Ranger seats its own foot line in _driveDeath
        if (v.varrArt && g.alive) { // Varr: poses drawn from a single rotation frame still need life (phase 1 walk has no clip; Control Pulse and Rust Collapse wind-up are rotation-only)
          if (pose.bob) v.body.y -= Math.abs(Math.sin(this.simNow / 110)) * 5;
          if (pose.pulse && !this._reduceFlash()) { const k = 1 + 0.045 * Math.sin(this.simNow / 60); v.body.setScale(v.body.scaleX * k, v.body.scaleY * (2 - k)); }
          if (pose.stagger) v.body.x += Math.sin(this.simNow / 22) * 2;
        }
      } else v.body.setPosition(g.x, g.y).setDepth(g.y).setFlipX(g.facing < 0);
      v.shadow.setPosition(g.x, g.y).setDepth(g.y - 1);
      if (v.raptorArt) { // Raptor: sprite rides above the floor, shadow stays put and shrinks; gone entirely while he is off-screen during Falcon Drop
        const lift = g.alive ? Math.max(0, g.lift || 0) : 0;
        v.body.setY(g.y - lift).setVisible(!g.offscreen);
        // His idle/walk art has no boots (the legs end as a flat column), so a stronger, wider floor shadow is what plants his feet.
        const sh = 1 - Math.min(0.5, lift / 400); v.shadow.setScale(sh * 1.35, sh * 1.2).setAlpha(g.offscreen ? 0 : 0.5);
      }
      // Parry timing cue: a ring that closes on the enemy as the attack starts.
      // The ring keeps running through the attack for variants whose key hit lands later (finisher); each grunt tells us its clock and mark.
      const clock = g.alive ? g.cueClockMs : null;
      const cue = clock !== null ? telegraphCue({ clockMs: clock, markMs: g.parryMarkMs, kind: g.variant.kind, reduce: this._reduceFlash(), telegraphMs: GRUNT.telegraphMs }) : null;
      if (cue && cue.ring) v.ring.setPosition(g.x, g.y - RING_CENTER_ABOVE_FEET * (v.duganArt ? 1.3 : g.visualScale || 1)).setSize(cue.ring.r * 2, cue.ring.r * 2).setStrokeStyle(TELEGRAPH_CUE.ringStrokePx, cue.ring.color).setAlpha(cue.ring.alpha).setVisible(true);
      else v.ring.setVisible(false);
      // Single hit flash (spec 7.2): white for 66/83/100 ms, steel under reduce-flash; beats the telegraph tint.
      const sq = this.hitFx.staggerScale(g.id);
      if (v.breakerArt) v.body.setScale(v.body.scaleX * sq.x, v.body.scaleY * sq.y); // scale is reset every frame on the art path
      v.body.clearTint();
      const fl = this.hitFx.flashTint(g.id);
      if (fl) { if (fl.fill) v.body.setTintFill(fl.tint); else v.body.setTint(fl.tint); }
      else if (g.data.tint && !v.duganArt && !v.royceArt && !v.kaneArt && !v.glitchArt && !v.raptorArt && !v.subject88Art && !v.varrArt && !v.ranger && !v.specialist) v.body.setTint(g.data.tint); // Breaker art standing in for Dugan: gunmetal wash so he reads as a different unit
      if (v.varrArt && !fl && g.alive && g.state === 'transform') v.body.setTint(this._reduceFlash() ? 0xcdb5ff : (Math.floor(this.simNow / 90) % 2 ? 0xcdb5ff : 0xffffff)); // phase change: violet rebuild
      if (v.strip) this._drawChargeStrip(v, g);
      if (!g.alive && !v.breakerArt) { v.body.setAlpha(0.4).setAngle(80 * g.facing); v.shadow.setAlpha(0.1); }
    }

    for (const dv of this.dying.splice(0)) { // removed enemies whose corpse view is still animating
      if (this._driveDeath(dv.v, dv.id, dv.pose, dt)) this._destroyView(dv.v);
      else this.dying.push(dv);
    }

    // Footsteps: one shared step voice for the whole scene (see pickStepper), so crowds don't stack into a glitchy rattle.
    const step = this.cache.audio.exists(GRUNT_STEP_SOUND_KEY) ? pickStepper(walkers, this.simNow, this.lastStepMs) : null;
    if (step) {
      const walker = walkers.find((w) => w.id === step.id);
      const tone = walker.v.specialist ? specialistStep(step) : step; // Copper Fangs: heavier boots, same shared step voice
      this.sound.play(GRUNT_STEP_SOUND_KEY, { volume: tone.volume, rate: tone.rate }); this.lastStepMs = this.simNow; walker.v.stepAt = this.simNow;
    }

    this.hitFx.update(dt, this.sprites);
    this.megaStompFx.update(dt);
    this.royceFx.update(dt);
    this.boltFx.update(dt);
    this.kaneFx.update(dt);
    this.glitchFx.update(dt);
    this.raptorFx.update(dt);
    this.subject88Fx.update(dt);
    this.varrFx.update(dt);
    this.wallSlamFx.update(dt);
    this.grabCue.update(dt);
  }

  _removeEnemyView(id) {
    const v = this.sprites.get(id);
    if (!v) return;
    this.hitFx.remove(id);
    this.sprites.delete(id);
    v.ring.setVisible(false);
    // A dead breaker keeps its view until the death anim finishes (gameplay has already dropped it from the list and wave counts).
    if (v.breakerArt && v.death) {
      this._driveDeath(v, id, v.deathPose, 0, true);
      this.dying.push({ id, v, pose: v.deathPose });
    } else this._destroyView(v);
  }

  _destroyView(v) { v.body.destroy(); v.shadow.destroy(); v.ring.destroy(); if (v.strip) v.strip.destroy(); }

  // Running Shoulder Charge: a red strip from Dugan to the screen edge he is facing while he winds up; a wall crash shakes the screen.
  _drawChargeStrip(v, g) {
    if (g.crashSeq !== (v.crashSeq ?? 0)) { v.crashSeq = g.crashSeq; this._shake(260, 0.006); }
    if (!g.alive || !g.chargeWarning) { v.strip.setVisible(false); return; }
    const cam = this.cameras.main, edge = g.telegraphDir >= 0 ? cam.scrollX + cam.width : cam.scrollX;
    v.strip.setPosition((g.x + edge) / 2, g.y - 25).setSize(Math.abs(edge - g.x), 70).setAlpha(0.18 + 0.3 * g.telegraphProgress).setVisible(true);
  }

  _destroyDying() { for (const dv of this.dying.splice(0)) this._destroyView(dv.v); }

  // Hit Flash "Low" or Reduced Motion: the parry cue drops its white pop and softens the ring (the red ramp stays; it is not a flash).
  _reduceFlash() {
    const now = this.time.now;
    if (this._rfAt === undefined || now - this._rfAt > 500) { // cached: called per enemy per frame
      this._rfAt = now;
      try { const st = loadSettings(globalThis.localStorage); this._rf = st.hitFlash === 'Low' || st.reducedMotion === true; } catch (e) { this._rf = false; }
    }
    return this._rf;
  }

  // ---- hit feedback (hit-feedback-spec.md) ----
  _shake(ms, intensity) { // honours the Options "Screen Shake" setting (Off/Light/Full)
    let setting; try { setting = loadSettings(globalThis.localStorage).screenShake; } catch (e) { /* no storage: Full */ }
    const k = shakeScale(setting);
    if (k > 0) this.cameras.main.shake(ms, intensity * k);
  }

  // Heavy thud when one of Dugan's blows lands on Zed (softer if he is blocking, silent if parried).
  _duganImpactSound(d) {
    if (!isDugan(this.arena.enemies.get(d.attackerId)) || !this.cache.audio.exists(DUGAN_IMPACT_SOUND_KEY)) return;
    const vol = duganImpactVolume(this.zed.machine.guardType);
    const now = this.time ? this.time.now : Date.now();
    if (vol === null || !duganSoundReady(this._duganImpactMs, now, DUGAN_IMPACT_COOLDOWN_MS)) return;
    this._duganImpactMs = now;
    this.sound.play(DUGAN_IMPACT_SOUND_KEY, { volume: vol });
  }

  _onDamage(d) {
    if (d.amount <= 0) return;
    if (d.targetId !== PLAYER_ID) this._bossHealthDrop(d.targetId); // Zed low and he hit the boss: the boss drops health
    const guarded = d.targetId === PLAYER_ID && this.zed.machine.guardType;
    if (!guarded) {
      const fb = d.attackerId === PLAYER_ID ? MOVE_FEEDBACK[this.zed.machine.moveId] : null; // damage-applied is synchronous with Zed's active frame
      const type = d.targetId === PLAYER_ID ? 'playerHurt' : fb ? fb.hitStop : d.amount >= FINISHER_DAMAGE ? 'heavy' : 'light';
      this._startHitStop(type, [d.attackerId, d.targetId]);
    }
    let x, y;
    if (d.targetId === PLAYER_ID) this._duganImpactSound(d);
    if (d.targetId === PLAYER_ID) { x = this.zed.x; y = this.zed.y + this.zed.depthOffset - 10; this._shake(100, 0.0023); }
    else {
      const g = this.arena.enemies.get(d.targetId);
      if (!g) return;
      x = g.x; y = g.y - 50;
      if (d.attackerId === PLAYER_ID) {
        const fb = MOVE_FEEDBACK[this.zed.machine.moveId];
        if (fb) this._shake(fb.shake.ms, fb.shake.intensity);
        if (fb && this.zed.machine.rage) { // Rage move: contact burst + screen punch; a kill also throws a big dust cloud at his feet
          this.rageImpactFx.hit(this.zed.machine.moveId, x, y);
          if (d.hpAfter <= 0) this.rageImpactFx.killDust(g.x, g.y);
        }
        else if (d.amount >= FINISHER_DAMAGE) this._shake(140, 0.004);
        else this._shake(90, 0.0025); // light hits: smaller, shorter shake than heavy
      }
    }
    if (d.targetId !== PLAYER_ID) return; // enemy hits use EnemyHitFx (burst, chips, sparks)
    const heavy = d.amount >= FINISHER_DAMAGE;
    const s = this.add.image(x, y, SPARK_KEY).setDepth(6000).setScale(heavy ? 1 : 0.6).setAngle(Phaser.Math.Between(0, 90));
    this.tweens.add({ targets: s, alpha: 0, scale: s.scale * 1.5, duration: heavy ? 180 : 120, onComplete: () => s.destroy() });
  }
}
