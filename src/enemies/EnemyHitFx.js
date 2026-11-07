// Phaser view for enemy health bars, hit flash/stagger and hit particles (hit-feedback-spec.md section 7).
// Consumes the shared events only: `hit-request` (cached per attacker, for position/facing/overlap centre)
// and `damage-applied` (targetId, attackerId, amount, hpAfter, knockback). Does not redefine either.
//
// Gap in the contract: `damage-applied` carries no attacker position/facing or hit type. We read both from the
// preceding `hit-request` (origin, facing, hitbox) keyed by attackerId, fall back to the knockback sign, and derive
// light/heavy/ko from amount + hpAfter. No combat change needed.
import { EVENTS } from '../shared/events.js';
import { PLAYER_ID } from '../shared/combatData.js';
import { worldRect, rectsOverlap } from '../combat/hitResolver.js';
import {
  ENEMY_BAR, ENEMY_FLASH_MS, STAGGER, HIT_PARTICLES as P, REDUCE_FLASH_TINT,
  createBarState, barOnDamage, barUpdate, barView, barFillArea, barPosition, telegraphIconBottomY,
  hitClass, hitDir, buildHit, capParticles, stepParticle, renderModel, starPoints, slashPoints, sparkTrailColor, flashAllowed,
} from './hitFeedbackData.js';
import { GRUNT_HIT_SOUND_KEY, GRUNT_HIT_SOUND_VOLUME, isPlainGrunt, gruntSoundReady,
  GRUNT_DEATH_SOUND_KEY, GRUNT_DEATH_SOUND_VOLUME, gruntVoiceFor } from './gruntSound.js';
import { isDugan, duganSoundReady, duganVoiceFor, DUGAN_HIT_VOICE_KEY, DUGAN_HIT_VOICE_VOLUME, DUGAN_HIT_VOICE_RATE, DUGAN_HIT_VOICE_COOLDOWN_MS,
  DUGAN_DEATH_SOUND_KEY, DUGAN_DEATH_SOUND_VOLUME, DUGAN_DEATH_SOUND_RATE } from './duganSound.js';
import { isGlitchEnemy, glitchSoundReady, glitchVoiceFor, GLITCH_HIT_VOICE_KEY, GLITCH_HIT_VOICE_VOLUME, GLITCH_HIT_VOICE_RATE, GLITCH_HIT_VOICE_COOLDOWN_MS,
  GLITCH_HIT_THUD_KEY, GLITCH_HIT_THUD_VOLUME, GLITCH_HIT_THUD_RATE, GLITCH_DEATH_SOUND_KEY, GLITCH_DEATH_SOUND_VOLUME, GLITCH_DEATH_SOUND_RATE,
  GLITCH_DEATH_BOOM_RATE, GLITCH_DEATH_BOOM_VOLUME } from './glitchSound.js';
import { isRaptorEnemy, raptorSoundReady, raptorVoiceFor, RAPTOR_HIT_VOICE_KEY, RAPTOR_HIT_VOICE_VOLUME, RAPTOR_HIT_VOICE_RATE, RAPTOR_HIT_VOICE_COOLDOWN_MS,
  RAPTOR_HIT_THUD_KEY, RAPTOR_HIT_THUD_VOLUME, RAPTOR_HIT_THUD_RATE, RAPTOR_DEATH_SOUND_KEY, RAPTOR_DEATH_SOUND_VOLUME, RAPTOR_DEATH_SOUND_RATE } from './raptorSound.js';
import { isSubject88Enemy, subject88SoundReady, subject88VoiceFor, SUBJECT88_HIT_VOICE_KEY, SUBJECT88_HIT_VOICE_VOLUME, SUBJECT88_HIT_VOICE_RATE, SUBJECT88_HIT_VOICE_COOLDOWN_MS,
  SUBJECT88_HIT_THUD_KEY, SUBJECT88_HIT_THUD_VOLUME, SUBJECT88_HIT_THUD_RATE, SUBJECT88_DEATH_SOUND_KEY, SUBJECT88_DEATH_SOUND_VOLUME, SUBJECT88_DEATH_SOUND_RATE,
  SUBJECT88_DEATH_BOOM_RATE, SUBJECT88_DEATH_BOOM_VOLUME } from './subject88Sound.js';
import { isVarrEnemy, varrSoundReady, varrVoiceFor, varrHitVoiceRate, VARR_HIT_VOICE_KEY, VARR_HIT_VOICE_VOLUME, VARR_HIT_VOICE_COOLDOWN_MS,
  VARR_HIT_THUD_KEY, VARR_HIT_THUD_VOLUME, VARR_HIT_THUD_RATE, VARR_DEATH_SOUND_KEY, VARR_DEATH_SOUND_VOLUME, VARR_DEATH_SOUND_RATE,
  VARR_DEATH_BOOM_RATE, VARR_DEATH_BOOM_VOLUME } from './varrSound.js';
import { isBreaker2Enemy, breaker2SoundReady, breaker2VoiceFor, BREAKER2_HIT_SOUND_KEY, BREAKER2_HIT_SOUND_VOLUME, BREAKER2_HIT_SOUND_RATE,
  BREAKER2_DEATH_SOUND_KEY, BREAKER2_DEATH_SOUND_VOLUME, BREAKER2_DEATH_SOUND_RATE } from './breaker2Sound.js';
import { isRangerEnemy, rangerSoundReady, rangerVoiceFor, RANGER_HIT_SOUND_KEY, RANGER_HIT_SOUND_VOLUME, RANGER_HIT_SOUND_RATE,
  RANGER_DEATH_SOUND_KEY, RANGER_DEATH_SOUND_VOLUME, RANGER_DEATH_SOUND_RATE } from './rangerSound.js';
import { isWatcherEnemy, watcherSoundReady, watcherVoiceFor, WATCHER_HIT_SOUND_KEY, WATCHER_HIT_SOUND_VOLUME, WATCHER_HIT_SOUND_RATE,
  WATCHER_DEATH_SOUND_KEY, WATCHER_DEATH_SOUND_VOLUME, WATCHER_DEATH_SOUND_RATE } from './watcherSound.js';
import { isSpecialistEnemy, specialistSoundReady, specialistVoiceFor, SPECIALIST_HIT_SOUND_KEY, SPECIALIST_HIT_SOUND_VOLUME, SPECIALIST_HIT_SOUND_RATE,
  SPECIALIST_DEATH_SOUND_KEY, SPECIALIST_DEATH_SOUND_VOLUME, SPECIALIST_DEATH_SOUND_RATE } from './specialistSound.js';

export const BAR_DEPTH = 5100;       // above characters (depth = y) and the swing overlay, below sparks (6000)
export const SHAPE_DEPTH = P.layerDepth.shapes; // 5050: flash shapes above characters, BELOW the bar so they never cover it
export const PARTICLE_DEPTH = P.layerDepth.debris; // 5800: debris above the bar

export class EnemyHitFx {
  /**
   * @param {Phaser.Scene} scene
   * @param {object} events shared emitter (game.events)
   * @param {object} o { getEnemy(id) -> grunt|undefined, finisherDamage, reduceFlash: () => bool }
   */
  constructor(scene, events, { getEnemy, maxHp, hurtbox, heavyAt = 12, finisherAt = Infinity, reduceFlash = () => false }) {
    this.scene = scene; this.events = events; this.getEnemy = getEnemy;
    this.maxHp = maxHp; this.hurtbox = hurtbox; this.heavyAt = heavyAt; this.finisherAt = finisherAt; this.reduceFlash = reduceFlash;
    this.bars = new Map();      // id -> { s: barState, topY }
    this.flash = new Map();     // id -> { left, tint }
    this.stagger = new Map();   // id -> { left, total }
    this.lastReq = new Map();   // attackerId -> hit-request
    this.diedVoiced = new Set(); // ids whose death cry already played
    this.voiceAt = new Map();   // id -> last grunt voice time (ms), per-grunt cooldown
    this.parts = [];
    this.clockMs = 0; this.lastCoreMs = null; // rate limit clock (real time)
    this.barGfx = scene.add.graphics().setDepth(BAR_DEPTH);
    this.shapeGfx = scene.add.graphics().setDepth(SHAPE_DEPTH);
    this.partGfx = scene.add.graphics().setDepth(PARTICLE_DEPTH);
    this._onReq = (r) => this.lastReq.set(r.attackerId, r);
    // Queued: the resolver emits damage-applied from inside its own hit-request handler, which can run before ours
    // caches the request. Processing in update() guarantees the matching request is cached.
    this.pending = [];
    this._onDmg = (d) => this.pending.push(d);
    events.on(EVENTS.HIT_REQUEST, this._onReq);
    events.on(EVENTS.DAMAGE_APPLIED, this._onDmg);
  }

  _playVoice(id, g, killed) {
    const sc = this.scene;
    if (isDugan(g)) return this._playDuganVoice(id, killed);
    if (isGlitchEnemy(g)) return this._playGlitchVoice(id, killed);
    if (isRaptorEnemy(g)) return this._playRaptorVoice(id, killed);
    if (isSubject88Enemy(g)) return this._playSubject88Voice(id, killed);
    if (isVarrEnemy(g)) return this._playVarrVoice(id, g, killed);
    if (isBreaker2Enemy(g)) return this._playBreaker2Voice(id, killed);
    if (isRangerEnemy(g)) return this._playRangerVoice(id, killed);
    if (isWatcherEnemy(g)) return this._playWatcherVoice(id, killed);
    if (isSpecialistEnemy(g)) return this._playSpecialistVoice(id, killed);
    if (!isPlainGrunt(g)) return;
    const which = gruntVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(GRUNT_DEATH_SOUND_KEY)) sc.sound.play(GRUNT_DEATH_SOUND_KEY, { volume: GRUNT_DEATH_SOUND_VOLUME });
      return;
    }
    if (!sc.cache.audio.exists(GRUNT_HIT_SOUND_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!gruntSoundReady(this.voiceAt.get(id), now)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(GRUNT_HIT_SOUND_KEY, { volume: GRUNT_HIT_SOUND_VOLUME });
  }

  _playBreaker2Voice(id, killed) {
    const sc = this.scene;
    const which = breaker2VoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(BREAKER2_DEATH_SOUND_KEY)) sc.sound.play(BREAKER2_DEATH_SOUND_KEY, { volume: BREAKER2_DEATH_SOUND_VOLUME, rate: BREAKER2_DEATH_SOUND_RATE });
      return;
    }
    if (!sc.cache.audio.exists(BREAKER2_HIT_SOUND_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!breaker2SoundReady(this.voiceAt.get(id), now)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(BREAKER2_HIT_SOUND_KEY, { volume: BREAKER2_HIT_SOUND_VOLUME, rate: BREAKER2_HIT_SOUND_RATE });
  }

  _playRangerVoice(id, killed) {
    const sc = this.scene;
    const which = rangerVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(RANGER_DEATH_SOUND_KEY)) sc.sound.play(RANGER_DEATH_SOUND_KEY, { volume: RANGER_DEATH_SOUND_VOLUME, rate: RANGER_DEATH_SOUND_RATE });
      return;
    }
    if (!sc.cache.audio.exists(RANGER_HIT_SOUND_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!rangerSoundReady(this.voiceAt.get(id), now)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(RANGER_HIT_SOUND_KEY, { volume: RANGER_HIT_SOUND_VOLUME, rate: RANGER_HIT_SOUND_RATE });
  }

  _playWatcherVoice(id, killed) {
    const sc = this.scene;
    const which = watcherVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(WATCHER_DEATH_SOUND_KEY)) sc.sound.play(WATCHER_DEATH_SOUND_KEY, { volume: WATCHER_DEATH_SOUND_VOLUME, rate: WATCHER_DEATH_SOUND_RATE });
      return;
    }
    if (!sc.cache.audio.exists(WATCHER_HIT_SOUND_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!watcherSoundReady(this.voiceAt.get(id), now)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(WATCHER_HIT_SOUND_KEY, { volume: WATCHER_HIT_SOUND_VOLUME, rate: WATCHER_HIT_SOUND_RATE });
  }

  _playSpecialistVoice(id, killed) {
    const sc = this.scene;
    const which = specialistVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(SPECIALIST_DEATH_SOUND_KEY)) sc.sound.play(SPECIALIST_DEATH_SOUND_KEY, { volume: SPECIALIST_DEATH_SOUND_VOLUME, rate: SPECIALIST_DEATH_SOUND_RATE });
      return;
    }
    if (!sc.cache.audio.exists(SPECIALIST_HIT_SOUND_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!specialistSoundReady(this.voiceAt.get(id), now)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(SPECIALIST_HIT_SOUND_KEY, { volume: SPECIALIST_HIT_SOUND_VOLUME, rate: SPECIALIST_HIT_SOUND_RATE });
  }

  // Glitch: a deep thud under every hit plus a slowed grunt (rate-limited); the killing blow plays a long deep death cry and a final boom.
  _playGlitchVoice(id, killed) {
    const sc = this.scene;
    const which = glitchVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    const has = (k) => sc.cache.audio.exists(k);
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (has(GLITCH_DEATH_SOUND_KEY)) sc.sound.play(GLITCH_DEATH_SOUND_KEY, { volume: GLITCH_DEATH_SOUND_VOLUME, rate: GLITCH_DEATH_SOUND_RATE });
      if (has(GLITCH_HIT_THUD_KEY)) sc.sound.play(GLITCH_HIT_THUD_KEY, { volume: GLITCH_DEATH_BOOM_VOLUME, rate: GLITCH_DEATH_BOOM_RATE });
      return;
    }
    if (has(GLITCH_HIT_THUD_KEY)) sc.sound.play(GLITCH_HIT_THUD_KEY, { volume: GLITCH_HIT_THUD_VOLUME, rate: GLITCH_HIT_THUD_RATE });
    if (!has(GLITCH_HIT_VOICE_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!glitchSoundReady(this.voiceAt.get(id), now, GLITCH_HIT_VOICE_COOLDOWN_MS)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(GLITCH_HIT_VOICE_KEY, { volume: GLITCH_HIT_VOICE_VOLUME, rate: GLITCH_HIT_VOICE_RATE });
  }

  // Raptor: a light crack under each hit plus a sharp grunt (rate-limited); the killing blow plays a death cry. His landing slam is played by the scene (RaptorFx onSlam).
  _raptorGuardClang(id) {
    const g = this.getEnemy(id), sc = this.scene;
    if (!g || !isRaptorEnemy(g) || !sc.cache.audio.exists(RAPTOR_HIT_THUD_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!raptorSoundReady(this.voiceAt.get(`${id}:guard`), now, 120)) return;
    this.voiceAt.set(`${id}:guard`, now);
    sc.sound.play(RAPTOR_HIT_THUD_KEY, { volume: RAPTOR_HIT_THUD_VOLUME * 0.6, rate: 1.7 });   // reuses his thud, higher and softer
  }

  _playRaptorVoice(id, killed) {
    const sc = this.scene;
    const which = raptorVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    const has = (k) => sc.cache.audio.exists(k);
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (has(RAPTOR_DEATH_SOUND_KEY)) sc.sound.play(RAPTOR_DEATH_SOUND_KEY, { volume: RAPTOR_DEATH_SOUND_VOLUME, rate: RAPTOR_DEATH_SOUND_RATE });
      return;
    }
    if (has(RAPTOR_HIT_THUD_KEY)) sc.sound.play(RAPTOR_HIT_THUD_KEY, { volume: RAPTOR_HIT_THUD_VOLUME, rate: RAPTOR_HIT_THUD_RATE });
    if (!has(RAPTOR_HIT_VOICE_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!raptorSoundReady(this.voiceAt.get(id), now, RAPTOR_HIT_VOICE_COOLDOWN_MS)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(RAPTOR_HIT_VOICE_KEY, { volume: RAPTOR_HIT_VOICE_VOLUME, rate: RAPTOR_HIT_VOICE_RATE });
  }

  // Subject 88: a low thud under each hit plus a strained, slowed grunt; the killing blow is a long weary cry and a soft collapse boom.
  _playSubject88Voice(id, killed) {
    const sc = this.scene;
    const which = subject88VoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    const has = (k) => sc.cache.audio.exists(k);
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (has(SUBJECT88_DEATH_SOUND_KEY)) sc.sound.play(SUBJECT88_DEATH_SOUND_KEY, { volume: SUBJECT88_DEATH_SOUND_VOLUME, rate: SUBJECT88_DEATH_SOUND_RATE });
      if (has(SUBJECT88_HIT_THUD_KEY)) sc.sound.play(SUBJECT88_HIT_THUD_KEY, { volume: SUBJECT88_DEATH_BOOM_VOLUME, rate: SUBJECT88_DEATH_BOOM_RATE });
      return;
    }
    if (has(SUBJECT88_HIT_THUD_KEY)) sc.sound.play(SUBJECT88_HIT_THUD_KEY, { volume: SUBJECT88_HIT_THUD_VOLUME, rate: SUBJECT88_HIT_THUD_RATE });
    if (!has(SUBJECT88_HIT_VOICE_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!subject88SoundReady(this.voiceAt.get(id), now, SUBJECT88_HIT_VOICE_COOLDOWN_MS)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(SUBJECT88_HIT_VOICE_KEY, { volume: SUBJECT88_HIT_VOICE_VOLUME, rate: SUBJECT88_HIT_VOICE_RATE });
  }

  // Varr: a low thud under each hit plus a cold, slowed grunt (lower in phase 2); the killing blow is a long cry and a deep boom. Shield-absorbed blows deal 0 damage and never get here.
  _playVarrVoice(id, g, killed) {
    const sc = this.scene;
    const which = varrVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    const has = (k) => sc.cache.audio.exists(k);
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (has(VARR_DEATH_SOUND_KEY)) sc.sound.play(VARR_DEATH_SOUND_KEY, { volume: VARR_DEATH_SOUND_VOLUME, rate: VARR_DEATH_SOUND_RATE });
      if (has(VARR_HIT_THUD_KEY)) sc.sound.play(VARR_HIT_THUD_KEY, { volume: VARR_DEATH_BOOM_VOLUME, rate: VARR_DEATH_BOOM_RATE });
      return;
    }
    if (has(VARR_HIT_THUD_KEY)) sc.sound.play(VARR_HIT_THUD_KEY, { volume: VARR_HIT_THUD_VOLUME, rate: VARR_HIT_THUD_RATE });
    if (!has(VARR_HIT_VOICE_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!varrSoundReady(this.voiceAt.get(id), now, VARR_HIT_VOICE_COOLDOWN_MS)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(VARR_HIT_VOICE_KEY, { volume: VARR_HIT_VOICE_VOLUME, rate: varrHitVoiceRate(g.phase) });
  }

  _playDuganVoice(id, killed) {
    const sc = this.scene;
    const which = duganVoiceFor(killed, this.diedVoiced.has(id));
    if (!which) return;
    if (which === 'death') {
      this.diedVoiced.add(id);
      if (sc.cache.audio.exists(DUGAN_DEATH_SOUND_KEY)) sc.sound.play(DUGAN_DEATH_SOUND_KEY, { volume: DUGAN_DEATH_SOUND_VOLUME, rate: DUGAN_DEATH_SOUND_RATE });
      return;
    }
    if (!sc.cache.audio.exists(DUGAN_HIT_VOICE_KEY)) return;
    const now = sc.time ? sc.time.now : Date.now();
    if (!duganSoundReady(this.voiceAt.get(id), now, DUGAN_HIT_VOICE_COOLDOWN_MS)) return;
    this.voiceAt.set(id, now);
    sc.sound.play(DUGAN_HIT_VOICE_KEY, { volume: DUGAN_HIT_VOICE_VOLUME, rate: DUGAN_HIT_VOICE_RATE });
  }

  onDamage(d) {
    if (d.blocked && d.targetId !== PLAYER_ID) { this._raptorGuardClang(d.targetId); return; }   // Raptor's guard absorbed the hit: a dull clang, no flash, no bar
    if (d.targetId === PLAYER_ID || d.amount <= 0) return;
    const g = this.getEnemy(d.targetId);
    if (!g) return;
    const killed = d.hpAfter <= 0;
    this._playVoice(d.targetId, g, killed);
    const cls = hitClass(d.amount, killed, this.heavyAt, this.finisherAt);
    const reduce = this.reduceFlash();
    let bar = this.bars.get(d.targetId);
    if (!bar && !g.isBoss && !g.miniBoss) { bar = { s: createBarState(g.maxHp ?? this.maxHp), topY: g.y - 100 }; this.bars.set(d.targetId, bar); }
    if (bar) barOnDamage(bar.s, d.hpAfter, { killed, reduceFlash: reduce }); // bosses have the big HUD bar instead

    const flashMs = ENEMY_FLASH_MS[cls === 'ko' ? 'heavy' : cls] ?? ENEMY_FLASH_MS.light;
    this.flash.set(d.targetId, { left: flashMs, tint: reduce ? REDUCE_FLASH_TINT : 0xffffff, fill: !reduce });
    this.stagger.set(d.targetId, { left: STAGGER.returnMs, total: STAGGER.returnMs });

    const req = this.lastReq.get(d.attackerId);
    const attackerX = req ? req.origin.x : (d.knockback > 0 ? g.x - 1 : g.x + 1); // knockback is signed away from attacker
    const dir = hitDir(g.x, attackerX, req ? req.facing : (d.knockback < 0 ? -1 : 1));
    this.spawnHit(this._contact(g, req), dir, cls, reduce, g.y);
  }

  // Overlap centre of hitbox and hurtbox; fallback: target centre x, y - 60% of hurtbox height.
  _contact(g, req) {
    if (req) {
      const a = worldRect(req.hitbox, req.origin, req.facing);
      const b = worldRect(this.hurtbox, g, g.facing);
      if (rectsOverlap(a, b)) {
        const x0 = Math.max(a.x, b.x), x1 = Math.min(a.x + a.w, b.x + b.w);
        const y0 = Math.max(a.y, b.y), y1 = Math.min(a.y + a.h, b.y + b.h);
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      }
    }
    return { x: g.x, y: g.y - this.hurtbox.h * 0.6 };
  }

  /** floorY: target feet y (flakes and shards land/bounce there, KO dust spawns there). */
  spawnHit(pt, dir, cls, reduce, floorY = pt.y + 60) {
    const allowFlash = flashAllowed(this.clockMs, this.lastCoreMs);
    if (!reduce && allowFlash) this.lastCoreMs = this.clockMs;
    const made = buildHit(cls, pt, dir, floorY, { reduce, allowFlash });
    const { live, incoming } = capParticles(this.parts, made, P.cap);
    this.parts = live.concat(incoming);
  }

  /** True while the enemy should render white (or steel under reduce-flash). Returns tint colour or null. */
  flashTint(id) { const f = this.flash.get(id); return f && f.left > 0 ? f : null; }

  /** Multipliers for sprite scale during stagger, or {x:1,y:1}. Eases back over STAGGER.returnMs. */
  staggerScale(id) {
    const s = this.stagger.get(id);
    if (!s || s.left <= 0) return { x: 1, y: 1 };
    const k = s.left / s.total;
    return { x: 1 + (STAGGER.scaleX - 1) * k, y: 1 + (STAGGER.scaleY - 1) * k };
  }

  /** True once this enemy's health bar has fully drained and faded (or it never had one). False while a damage event is still queued. */
  barEmptied(id) {
    if (this.pending.some((d) => d.targetId === id)) return false;
    const bar = this.bars.get(id);
    if (!bar) return true;
    const s = bar.s;
    return !s.ko || s.koT >= s.koDelay + ENEMY_BAR.koFadeMs;
  }

  /** Y for the bottom of the telegraph icon (bar top - 4px) or null when this enemy has no bar. */
  telegraphBottomY(id) {
    const bar = this.bars.get(id);
    return bar ? telegraphIconBottomY(bar.topY) : null;
  }

  /** views: Map id -> { body } (sprite whose top defines the body top). dtMs real time. */
  update(dtMs, views) {
    for (const d of this.pending.splice(0)) this.onDamage(d);
    for (const [id, f] of this.flash) { f.left -= dtMs; if (f.left <= 0) this.flash.delete(id); }
    for (const [id, s] of this.stagger) { s.left -= dtMs; if (s.left <= 0) this.stagger.delete(id); }

    const g = this.barGfx; g.clear();
    const area = barFillArea(), [W, H] = ENEMY_BAR.size, bp = ENEMY_BAR.borderPx + ENEMY_BAR.padPx;
    for (const [id, bar] of this.bars) {
      const enemy = this.getEnemy(id), v = views.get(id);
      if (!enemy || !v) { this.bars.delete(id); continue; }
      barUpdate(bar.s, dtMs);
      const body = v.body;
      const spriteTop = body.y - body.displayHeight * body.originY; // sprite body top, not the hitbox
      const pos = barPosition(enemy.x, spriteTop);
      bar.topY = pos.y;
      const m = barView(bar.s);
      if (m.alpha <= 0.001) continue;
      const cx = pos.x + W / 2, cy = pos.y + H / 2;
      const X = (x) => cx + (x - cx) * m.scale, Y = (y) => cy + (y - cy) * m.scale; // pulse about the centre
      const rect = (c, x, y, w, h, a = m.alpha) => { if (w > 0) g.fillStyle(c, a).fillRect(X(x), Y(y), w * m.scale, h * m.scale); };
      rect(ENEMY_BAR.border, pos.x, pos.y, W, H);
      rect(ENEMY_BAR.bg, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, W - ENEMY_BAR.borderPx * 2, H - ENEMY_BAR.borderPx * 2);
      // 1px bevel highlight, top and left, just inside the border
      rect(ENEMY_BAR.bevel, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, W - ENEMY_BAR.borderPx * 2, 1);
      rect(ENEMY_BAR.bevel, pos.x + ENEMY_BAR.borderPx, pos.y + ENEMY_BAR.borderPx, 1, H - ENEMY_BAR.borderPx * 2);
      const fx = pos.x + bp, fy = pos.y + bp;
      rect(ENEMY_BAR.drain.color, fx, fy, area.w * m.drain, area.h);
      const fw = area.w * m.frac;
      rect(m.flashing ? ENEMY_BAR.flashColor : m.fill, fx, fy, fw, area.h);
      if (!m.flashing) rect(m.fillTop, fx, fy, fw, 1);
    }

    this.clockMs += dtMs;
    const pg = this.partGfx; pg.clear();
    const sg = this.shapeGfx; sg.clear();
    this.parts = this.parts.filter((p) => stepParticle(p, dtMs));
    for (const p of this.parts) {
      const m = renderModel(p);
      if (!m) continue;
      if (p.kind === 'core') sg.fillStyle(m.color, m.alpha).fillCircle(p.x, p.y, m.r);
      else if (p.kind === 'ring') sg.lineStyle(m.width, m.color, m.alpha).strokeCircle(p.x, p.y, m.r);
      else if (p.kind === 'slash') this._slash(sg, p, m);
      else if (p.kind === 'star') this._star(sg, p, m);
      else this._debris(pg, p, m);
    }
  }

  _slash(g, p, m) {
    if (m.thick <= 0.05) return;
    const pts = slashPoints(p, m.len, m.thick);
    g.fillStyle(m.fill, m.alpha).fillPoints(pts, true);
    if (m.outline != null) g.lineStyle(m.outlinePx, m.outline, m.alpha).strokePoints(pts, true);
  }

  _star(g, p, m) {
    const pts = starPoints(p, m.scale);
    g.fillStyle(m.back.fill, m.back.alpha).fillPoints(pts, true);
    if (m.back.outline != null && m.back.alpha > 0) g.lineStyle(m.back.outlinePx, m.back.outline, m.back.alpha).strokePoints(pts, true);
    if (m.front) g.fillStyle(m.front.fill, m.front.alpha).fillPoints(starPoints(p, m.scale, m.front.radiusRatio), true);
  }

  _debris(pg, p, m) {
    if (m.alpha <= 0) return;
    if (p.kind === 'spark') {
      const tr = P.sparks.trail, chain = [{ x: p.x, y: p.y }, ...p.hist];
      for (let i = 0; i < chain.length - 1; i++) {
        const w = Math.max(1, p.thick * (1 - i / tr.samples)); // tapers 3 -> ~1
        pg.lineStyle(w, sparkTrailColor(p.t, i, p.skipWhite), m.alpha).lineBetween(chain[i].x, chain[i].y, chain[i + 1].x, chain[i + 1].y);
      }
      pg.save(); pg.translateCanvas(p.x, p.y); pg.rotateCanvas(Math.atan2(p.vy, p.vx));
      pg.fillStyle(m.color, m.alpha).fillRect(-m.len / 2, -m.thick / 2, m.len, m.thick); pg.restore();
    } else if (p.kind === 'shard' || p.kind === 'flake') {
      const long = p.size, short = p.kind === 'shard' ? p.size / P.shards.aspect : p.size;
      pg.save(); pg.translateCanvas(p.x, p.y); pg.rotateCanvas((p.rot * Math.PI) / 180);
      pg.fillStyle(p.color, m.alpha);
      if (p.tri) pg.fillTriangle(-long / 2, short / 2, long / 2, short / 2, 0, -short / 2 - short / 2);
      else pg.fillRect(-long / 2, -short / 2, long, short);
      pg.restore();
    } else if (p.kind === 'smoke') {
      pg.fillStyle(p.color, m.alpha).fillCircle(p.x, p.y, m.r);
      pg.fillStyle(p.color, m.alpha / 2).fillCircle(p.x, p.y, m.r * 0.6);
    } else if (p.kind === 'groundDust') {
      pg.fillStyle(P.groundDust.color, m.alpha).fillCircle(p.x, p.y, m.r);
    }
  }

  remove(id) { this.voiceAt.delete(id); this.bars.delete(id); this.flash.delete(id); this.stagger.delete(id); }

  destroy() {
    this.events.off(EVENTS.HIT_REQUEST, this._onReq);
    this.events.off(EVENTS.DAMAGE_APPLIED, this._onDmg);
    this.barGfx.destroy(); this.shapeGfx.destroy(); this.partGfx.destroy();
    this.parts.length = 0; this.bars.clear();
  }
}
