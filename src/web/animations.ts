import type { WeaponDef } from '../engine/weapons.js';
import { getWeaponSprite } from './weaponSprites.js';
import { sound } from './sound.js';

export interface AttackAnimOptions {
  attackerCard: HTMLElement | null;
  attackerHolder: HTMLElement | null; // The .avatar-weapon-holder of attacker
  defenderCard: HTMLElement | null;
  defenderFrame: HTMLElement | null; // The .gg-avatar-frame of defender
  weapon: WeaponDef;
  isCrit: boolean;
  isDodge: boolean;
  attackerSide: 'A' | 'B' | 'preview';
}

/**
 * Creates a detailed SVG for a realistic gangster bullet hole
 */
function createBulletHoleSVG(size: number = 24, variant: 'standard' | 'heavy' | 'incandescent' | 'pellet' = 'standard'): string {
  if (variant === 'pellet') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 20 20" class="bullet-hole-svg pellet">
        <circle cx="10" cy="10" r="5" fill="#08080a" />
        <circle cx="10" cy="10" r="7" fill="none" stroke="#252528" stroke-width="1.5" />
        <circle cx="10" cy="10" r="9" fill="none" stroke="rgba(255,160,50,0.4)" stroke-width="0.8" />
        <path d="M10,2 L10,5 M10,15 L10,18 M2,10 L5,10 M15,10 L18,10" stroke="#18181c" stroke-width="1" />
      </svg>
    `;
  }

  if (variant === 'incandescent') {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 40 40" class="bullet-hole-svg incandescent">
        <defs>
          <radialGradient id="hotHole-${Math.random()}" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#050508" />
            <stop offset="60%" stop-color="#2a0505" />
            <stop offset="85%" stop-color="#ff3b00" />
            <stop offset="100%" stop-color="rgba(255,180,0,0)" />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="16" fill="url(#hotHole)" />
        <circle cx="20" cy="20" r="9" fill="#050508" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="#ff5500" stroke-width="2" opacity="0.9" />
        <path d="M20,6 L18,11 L20,13 M20,27 L22,30 L20,35 M7,19 L12,20 L14,19 M26,20 L30,19 L34,22" stroke="#ff3300" stroke-width="1.5" />
        <path d="M10,10 L14,14 M26,26 L31,31 M11,29 L14,26 M26,14 L30,9" stroke="#330808" stroke-width="1.2" />
      </svg>
    `;
  }

  const rimStroke = variant === 'heavy' ? '#ff9900' : '#888899';
  const holeR = variant === 'heavy' ? 8 : 6;
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 36 36" class="bullet-hole-svg standard">
      <defs>
        <radialGradient id="standardHole-${Math.random()}" cx="45%" cy="45%" r="50%">
          <stop offset="0%" stop-color="#020205" />
          <stop offset="70%" stop-color="#121218" />
          <stop offset="100%" stop-color="#3a3a44" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="14" fill="rgba(0,0,0,0.6)" />
      <circle cx="18" cy="18" r="${holeR}" fill="#040407" />
      <circle cx="18" cy="18" r="${holeR + 1}" fill="none" stroke="${rimStroke}" stroke-width="1.2" opacity="0.8" />
      <path d="M18,4 L17,10 L18,12 M18,24 L19,27 L18,32 M4,18 L10,17 L12,18 M24,18 L28,19 L33,18" stroke="#101016" stroke-width="1.6" />
      <path d="M8,9 L13,13 M23,23 L29,28 M9,27 L13,23 M23,13 L28,7" stroke="#252530" stroke-width="1.2" />
    </svg>
  `;
}

/**
 * Executes a full weapon attack sequence:
 * 1. Attacker weapon animation (raise, fire recoil, muzzle flash, shell casing ejection)
 * 2. In-flight projectile / tracer across the arena
 * 3. Defender impact (bullet holes, shotgun spread, smg burst, flames, slash or explosion)
 */
export function playWeaponAttackVisual(opts: AttackAnimOptions): Promise<void> {
  const { attackerCard, attackerHolder, defenderCard, defenderFrame, weapon, isCrit, isDodge, attackerSide } = opts;

  return new Promise((resolve) => {
    const spriteInfo = getWeaponSprite(weapon.id, attackerSide);
    const effect = weapon.shotEffect;

    // ========================================================
    // 1. ATTACKER WEAPON ANIMATION (RECOIL, MUZZLE FLASH, SHELL)
    // ========================================================
    if (attackerHolder) {
      const isMelee = effect.type === 'slash';
      const isThrow = effect.type === 'molotov' || effect.type === 'dynamite';

      let animClass = 'anim-fire-kick';
      if (isMelee) animClass = 'anim-melee-swing';
      else if (isThrow) animClass = 'anim-throw';
      else if (effect.type === 'smg') animClass = 'anim-smg-burst';

      attackerHolder.classList.remove('anim-fire-kick', 'anim-melee-swing', 'anim-throw', 'anim-smg-burst');
      void attackerHolder.offsetWidth;
      attackerHolder.classList.add(animClass);

      setTimeout(() => {
        attackerHolder.classList.remove('anim-fire-kick', 'anim-melee-swing', 'anim-throw', 'anim-smg-burst');
      }, 500);

      // Muzzle Flash & Shell Casing for firearms
      if (!isMelee && !isThrow) {
        // Multi-flash for SMG or single flash for others
        const flashCount = effect.type === 'smg' ? Math.min(4, effect.bulletCount) : 1;
        const flashInterval = effect.type === 'smg' ? 60 : 0;

        for (let f = 0; f < flashCount; f++) {
          setTimeout(() => {
            spawnMuzzleFlash(attackerHolder, spriteInfo.barrelTip.x, spriteInfo.barrelTip.y, effect.type);
            spawnShellCasing(attackerHolder, spriteInfo.chamber.x, spriteInfo.chamber.y, attackerSide);
          }, f * flashInterval);
        }
      }
    }

    // Play Audio
    sound.playWeaponSound(effect.sound);

    // Attacker Card Recoil
    if (attackerCard) {
      attackerCard.classList.remove('recoil-kick');
      void attackerCard.offsetWidth;
      attackerCard.classList.add('recoil-kick');
      setTimeout(() => attackerCard.classList.remove('recoil-kick'), 300);
    }

    // ========================================================
    // 2. PROJECTILE / TRACER FLYING ACROSS ARENA
    // ========================================================
    spawnArenaProjectile(attackerSide, weapon);

    // Delay impact slightly so projectile visually travels to defender
    const travelDelayMs = 100;

    setTimeout(() => {
      // Handle Dodge
      if (isDodge) {
        if (defenderCard) {
          defenderCard.classList.remove('dodge-evade');
          void defenderCard.offsetWidth;
          defenderCard.classList.add('dodge-evade');
          setTimeout(() => defenderCard.classList.remove('dodge-evade'), 600);
        }
        resolve();
        return;
      }

      // Defender Card Shake
      if (defenderCard) {
        const shakeClass = effect.screenShake === 'heavy' ? 'shake-heavy' : 'shake';
        defenderCard.classList.remove('shake', 'shake-heavy');
        void defenderCard.offsetWidth;
        defenderCard.classList.add(shakeClass);
        setTimeout(() => defenderCard.classList.remove(shakeClass), 500);
      }

      if (!defenderFrame) {
        resolve();
        return;
      }

      // Ensure impact layer exists
      let impactLayer = defenderFrame.querySelector('.combat-impact-layer') as HTMLElement | null;
      if (!impactLayer) {
        impactLayer = document.createElement('div');
        impactLayer.className = 'combat-impact-layer';
        defenderFrame.appendChild(impactLayer);
      }

      const frameRect = defenderFrame.getBoundingClientRect();
      const width = frameRect.width > 50 ? frameRect.width : 280;
      const height = frameRect.height > 50 ? frameRect.height : 340;

      const centerX = width * 0.5;
      const centerY = height * 0.45;

      // ========================================================
      // 3. DEFENDER IMPACT (ACCORDING TO WEAPON TYPE)
      // ========================================================

      // EFFECT 1: PISTOL (1 Single Precise Bullet Hole)
      if (effect.type === 'pistol') {
        const offsetX = (Math.random() - 0.5) * effect.spreadRadius * 2;
        const offsetY = (Math.random() - 0.5) * effect.spreadRadius * 2;
        spawnBulletHole(impactLayer, centerX + offsetX, centerY + offsetY, {
          size: weapon.id === 'colt_1911' ? 34 : 28,
          variant: weapon.id === 'colt_1911' ? 'heavy' : 'standard',
          smoke: effect.smokeIntensity,
          isCrit,
        });
        resolve();
        return;
      }

      // EFFECT 2: SHOTGUN (Scattered Buckshot Pellets Blast)
      if (effect.type === 'shotgun') {
        spawnFlashExplosion(impactLayer, centerX, centerY, 140, 'rgba(255,140,40,0.7)');
        for (let i = 0; i < effect.bulletCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.sqrt(Math.random()) * effect.spreadRadius;
          const x = centerX + Math.cos(angle) * dist;
          const y = centerY + Math.sin(angle) * dist;

          setTimeout(() => {
            spawnBulletHole(impactLayer!, x, y, {
              size: 16 + Math.random() * 8,
              variant: 'pellet',
              smoke: i % 3 === 0 ? 'medium' : 'light',
              isCrit: isCrit && i === 0,
            });
          }, Math.random() * 80);
        }
        setTimeout(resolve, 300);
        return;
      }

      // EFFECT 3: SMG (Rapid-Fire Staccato Sequence)
      if (effect.type === 'smg') {
        const interval = effect.burstIntervalMs ?? 55;
        const total = effect.bulletCount;
        let currentX = centerX + (Math.random() - 0.5) * 30;
        let currentY = centerY - (total * 6);

        for (let i = 0; i < total; i++) {
          setTimeout(() => {
            const jitterX = (Math.random() - 0.5) * effect.spreadRadius;
            currentY += 12;

            spawnBulletHole(impactLayer!, currentX + jitterX, currentY, {
              size: 24,
              variant: 'standard',
              smoke: i === total - 1 ? 'medium' : 'light',
              isCrit: isCrit && i === total - 1,
            });

            if (defenderCard && i % 2 === 0) {
              defenderCard.classList.remove('micro-kick');
              void defenderCard.offsetWidth;
              defenderCard.classList.add('micro-kick');
            }

            if (i === total - 1) resolve();
          }, i * interval);
        }
        return;
      }

      // EFFECT 4: ASSAULT RIFLE (Heavy Piercing Shots)
      if (effect.type === 'rifle') {
        const interval = effect.burstIntervalMs ?? 80;
        const total = effect.bulletCount;

        for (let i = 0; i < total; i++) {
          setTimeout(() => {
            const offsetX = (Math.random() - 0.5) * effect.spreadRadius * 2;
            const offsetY = (i - total / 2) * 25 + (Math.random() - 0.5) * 15;
            spawnBulletHole(impactLayer!, centerX + offsetX, centerY + offsetY, {
              size: 36,
              variant: 'incandescent',
              smoke: 'heavy',
              isCrit,
            });
            if (i === total - 1) resolve();
          }, i * interval);
        }
        return;
      }

      // EFFECT 5: SPECIAL - MOLOTOV (Flames & Charring)
      if (effect.type === 'molotov') {
        spawnMolotovFlames(impactLayer, centerX, centerY, width, height);
        setTimeout(resolve, 400);
        return;
      }

      // EFFECT 6: SPECIAL - SLASH (Blade / Bat Slice)
      if (effect.type === 'slash') {
        spawnMeleeSlash(impactLayer, centerX, centerY, width, height);
        setTimeout(resolve, 350);
        return;
      }

      // EFFECT 7: SPECIAL - DYNAMITE (Explosion & Scorched Crater)
      if (effect.type === 'dynamite') {
        spawnDynamiteBlast(impactLayer, centerX, centerY, width, height);
        setTimeout(resolve, 500);
        return;
      }

      resolve();
    }, travelDelayMs);
  });
}

/**
 * Spawns a glowing muzzle flash at the tip of the weapon's barrel
 */
function spawnMuzzleFlash(holder: HTMLElement, barrelX: number, barrelY: number, weaponType: string) {
  const flash = document.createElement('div');
  flash.className = `weapon-muzzle-flash ${weaponType === 'shotgun' ? 'shotgun-flash' : ''}`;

  // Normalize coords based on holder's width (140px) and height (95px) vs viewBox 150x100
  const leftPct = (barrelX / 150) * 100;
  const topPct = (barrelY / 100) * 100;

  flash.style.left = `${leftPct}%`;
  flash.style.top = `${topPct}%`;

  flash.innerHTML = `
    <div class="muzzle-star"></div>
    <div class="muzzle-smoke-ring"></div>
  `;

  holder.appendChild(flash);
  setTimeout(() => flash.remove(), 200);
}

/**
 * Spawns an ejected brass shell casing that flips through the air
 */
function spawnShellCasing(holder: HTMLElement, chamberX: number, chamberY: number, side: 'A' | 'B' | 'preview') {
  const casing = document.createElement('div');
  casing.className = `ejected-casing side-${side}`;

  const leftPct = (chamberX / 150) * 100;
  const topPct = (chamberY / 100) * 100;

  casing.style.left = `${leftPct}%`;
  casing.style.top = `${topPct}%`;

  holder.appendChild(casing);
  setTimeout(() => casing.remove(), 650);
}

/**
 * Spawns an in-flight projectile or high-speed tracer across the arena stage
 */
function spawnArenaProjectile(attackerSide: 'A' | 'B' | 'preview', weapon: WeaponDef) {
  if (attackerSide === 'preview') return;

  const tracerLayer = document.getElementById('arena-tracer-layer');
  if (!tracerLayer) return;

  const isA = attackerSide === 'A';
  const effect = weapon.shotEffect.type;

  const proj = document.createElement('div');
  proj.className = `arena-flying-projectile ${isA ? 'from-a' : 'from-b'} ${effect}`;

  if (effect === 'molotov') {
    proj.innerHTML = `
      <div class="flying-molotov-bottle">🍾🔥</div>
    `;
  } else if (effect === 'dynamite') {
    proj.innerHTML = `
      <div class="flying-dynamite-bundle">🧨✨</div>
    `;
  } else if (effect === 'slash') {
    proj.innerHTML = `
      <div class="flying-slash-wave"></div>
    `;
  } else {
    // Tracer streak line
    proj.innerHTML = `
      <div class="tracer-streak-beam"></div>
    `;
  }

  tracerLayer.appendChild(proj);
  setTimeout(() => proj.remove(), 350);
}

/**
 * Spawns an individual bullet hole at (x, y) with spark and smoke
 */
function spawnBulletHole(
  container: HTMLElement,
  x: number,
  y: number,
  opts: { size: number; variant: 'standard' | 'heavy' | 'incandescent' | 'pellet'; smoke: string; isCrit: boolean }
) {
  const hole = document.createElement('div');
  hole.className = `combat-bullet-hole ${opts.variant}`;
  hole.style.left = `${x}px`;
  hole.style.top = `${y}px`;
  hole.style.width = `${opts.size}px`;
  hole.style.height = `${opts.size}px`;

  const rot = Math.floor(Math.random() * 360);
  hole.style.transform = `translate(-50%, -50%) rotate(${rot}deg)`;
  hole.innerHTML = createBulletHoleSVG(opts.size, opts.variant);

  const spark = document.createElement('div');
  spark.className = 'bullet-spark-burst';
  hole.appendChild(spark);

  const smoke = document.createElement('div');
  smoke.className = `bullet-smoke-puff ${opts.smoke}`;
  hole.appendChild(smoke);

  container.appendChild(hole);

  setTimeout(() => {
    hole.classList.add('fading');
    setTimeout(() => hole.remove(), 1200);
  }, 3500);
}

function spawnFlashExplosion(container: HTMLElement, x: number, y: number, radius: number, color: string) {
  const flash = document.createElement('div');
  flash.className = 'shotgun-flash-burst';
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  flash.style.width = `${radius * 2}px`;
  flash.style.height = `${radius * 2}px`;
  flash.style.background = `radial-gradient(circle, ${color} 0%, rgba(255,200,50,0.3) 40%, transparent 75%)`;
  container.appendChild(flash);
  setTimeout(() => flash.remove(), 450);
}

function spawnMolotovFlames(container: HTMLElement, x: number, y: number, w: number, h: number) {
  const molotovBox = document.createElement('div');
  molotovBox.className = 'molotov-flame-wrapper';

  molotovBox.innerHTML = `
    <div class="molotov-glass-shatter"></div>
    <div class="molotov-char-layer"></div>
    <div class="molotov-flames">
      <div class="flame-tongue f1"></div>
      <div class="flame-tongue f2"></div>
      <div class="flame-tongue f3"></div>
      <div class="flame-tongue f4"></div>
      <div class="flame-tongue f5"></div>
    </div>
  `;

  container.appendChild(molotovBox);

  setTimeout(() => {
    molotovBox.classList.add('fading');
    setTimeout(() => molotovBox.remove(), 1000);
  }, 2200);
}

function spawnMeleeSlash(container: HTMLElement, x: number, y: number, w: number, h: number) {
  const slash = document.createElement('div');
  slash.className = 'melee-slash-cut';

  const angle = (Math.random() > 0.5 ? 1 : -1) * (25 + Math.random() * 20);
  slash.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

  slash.innerHTML = `
    <div class="slash-blade-line"></div>
    <div class="blood-splatter b1"></div>
    <div class="blood-splatter b2"></div>
    <div class="blood-splatter b3"></div>
  `;

  container.appendChild(slash);

  setTimeout(() => {
    slash.classList.add('fading');
    setTimeout(() => slash.remove(), 800);
  }, 2500);
}

function spawnDynamiteBlast(container: HTMLElement, x: number, y: number, w: number, h: number) {
  const blast = document.createElement('div');
  blast.className = 'dynamite-blast-overlay';

  blast.innerHTML = `
    <div class="dynamite-white-flash"></div>
    <div class="dynamite-shockwave-ring"></div>
    <div class="dynamite-crater-scorch"></div>
  `;

  container.appendChild(blast);

  setTimeout(() => {
    blast.classList.add('fading');
    setTimeout(() => blast.remove(), 1000);
  }, 2800);
}

export function clearAllImpacts(container: HTMLElement | null) {
  if (!container) return;
  const layers = container.querySelectorAll('.combat-impact-layer');
  layers.forEach((l) => (l.innerHTML = ''));

  const tracers = document.getElementById('arena-tracer-layer');
  if (tracers) tracers.innerHTML = '';
}
