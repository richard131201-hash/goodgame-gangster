/**
 * Vector SVG representations and muzzle coordinates for all 15 gangster weapons.
 * Designed in authentic 1920s-1940s noir gangster aesthetic with blued steel, polished brass, and rich walnut.
 */

export interface WeaponSpriteInfo {
  svg: string;
  barrelTip: { x: number; y: number }; // Relative to viewBox [0,0, 150, 100]
  chamber: { x: number; y: number };
  scale?: number;
}

export function getWeaponSprite(weaponId: string, side: 'A' | 'B' | 'preview'): WeaponSpriteInfo {
  switch (weaponId) {
    // ==========================================
    // 1. PISTOLAS
    // ==========================================
    case 'revolver_38':
      return {
        barrelTip: { x: 135, y: 38 },
        chamber: { x: 75, y: 40 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="steel-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4a4d56" />
                <stop offset="50%" stop-color="#2a2d34" />
                <stop offset="100%" stop-color="#181a1f" />
              </linearGradient>
              <linearGradient id="wood-rev" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#8d4f2a" />
                <stop offset="100%" stop-color="#4e2510" />
              </linearGradient>
            </defs>
            <!-- Wooden Grip -->
            <path d="M 40 50 C 35 60 25 80 32 92 C 38 98 48 96 52 90 C 56 80 54 62 50 52 Z" fill="url(#wood-rev)" stroke="#111" stroke-width="2" />
            <circle cx="42" cy="74" r="2.5" fill="#d4af37" />
            <!-- Trigger & Guard -->
            <path d="M 52 56 C 54 70 66 70 68 56" fill="none" stroke="#222" stroke-width="2.5" />
            <path d="M 60 56 Q 58 64 63 65" fill="none" stroke="#777" stroke-width="2" />
            <!-- Hammer -->
            <path d="M 45 42 Q 40 34 46 30 Q 50 35 48 42" fill="#555" stroke="#111" stroke-width="1.5" />
            <!-- Frame & Cylinder -->
            <rect x="58" y="32" width="28" height="20" rx="3" fill="url(#steel-rev)" stroke="#111" stroke-width="2" />
            <line x1="62" y1="36" x2="82" y2="36" stroke="#111" stroke-width="1.5" />
            <line x1="62" y1="42" x2="82" y2="42" stroke="#111" stroke-width="1.5" />
            <line x1="62" y1="48" x2="82" y2="48" stroke="#111" stroke-width="1.5" />
            <!-- Barrel & Front Sight -->
            <path d="M 86 35 L 135 35 L 135 44 L 86 44 Z" fill="url(#steel-rev)" stroke="#111" stroke-width="2" />
            <polygon points="128,35 133,31 135,35" fill="#222" />
            <!-- Ejector Rod -->
            <line x1="86" y1="47" x2="114" y2="47" stroke="#111" stroke-width="2.5" />
          </svg>
        `,
      };

    case 'colt_1911':
      return {
        barrelTip: { x: 140, y: 35 },
        chamber: { x: 85, y: 34 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="slide-colt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3b3e47" />
                <stop offset="40%" stop-color="#24262d" />
                <stop offset="100%" stop-color="#121317" />
              </linearGradient>
              <linearGradient id="grip-colt" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#6e3c1d" />
                <stop offset="100%" stop-color="#3d1e0c" />
              </linearGradient>
            </defs>
            <!-- Grip Frame -->
            <path d="M 45 46 L 36 86 C 36 92 46 95 52 94 L 64 54 Z" fill="url(#grip-colt)" stroke="#111" stroke-width="2" />
            <!-- Grip Screw & Texture -->
            <circle cx="43" cy="58" r="2.5" fill="#d4af37" stroke="#111" stroke-width="1" />
            <circle cx="48" cy="82" r="2.5" fill="#d4af37" stroke="#111" stroke-width="1" />
            <!-- Trigger Guard & Trigger -->
            <path d="M 64 50 C 65 65 78 65 79 50" fill="none" stroke="#222" stroke-width="2.5" />
            <rect x="68" y="50" width="5" height="10" rx="2" fill="#777" stroke="#111" stroke-width="1" />
            <!-- Beavertail & Hammer -->
            <path d="M 40 42 Q 32 38 42 35" fill="none" stroke="#222" stroke-width="3" />
            <circle cx="38" cy="33" r="3" fill="#666" stroke="#111" stroke-width="1.2" />
            <!-- Slide Receiver -->
            <rect x="44" y="27" width="96" height="22" rx="2" fill="url(#slide-colt)" stroke="#111" stroke-width="2" />
            <!-- Serrations -->
            <line x1="48" y1="30" x2="48" y2="44" stroke="#111" stroke-width="1.5" />
            <line x1="52" y1="30" x2="52" y2="44" stroke="#111" stroke-width="1.5" />
            <line x1="56" y1="30" x2="56" y2="44" stroke="#111" stroke-width="1.5" />
            <!-- Ejection Port -->
            <rect x="80" y="28" width="16" height="8" fill="#18181c" stroke="#333" stroke-width="1" />
            <!-- Sights -->
            <rect x="46" y="24" width="4" height="4" fill="#222" />
            <polygon points="134,27 138,23 140,27" fill="#222" />
          </svg>
        `,
      };

    case 'mauser_c96':
      return {
        barrelTip: { x: 145, y: 32 },
        chamber: { x: 80, y: 32 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="mauser-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#464952" />
                <stop offset="100%" stop-color="#1b1c20" />
              </linearGradient>
            </defs>
            <!-- Broomhandle Round Wood Grip -->
            <path d="M 38 48 C 30 58 22 84 32 94 C 40 96 46 90 48 78 C 50 64 48 52 46 48 Z" fill="#66381b" stroke="#111" stroke-width="2" />
            <circle cx="36" cy="72" r="3" fill="#d4af37" />
            <!-- Round Hammer -->
            <circle cx="38" cy="38" r="5" fill="#333" stroke="#111" stroke-width="1.5" />
            <circle cx="38" cy="38" r="2" fill="#fff" />
            <!-- Box Magazine in front of trigger -->
            <rect x="74" y="44" width="16" height="22" rx="2" fill="url(#mauser-steel)" stroke="#111" stroke-width="2" />
            <!-- Trigger & Guard -->
            <path d="M 50 50 C 50 64 64 64 66 50" fill="none" stroke="#222" stroke-width="2" />
            <path d="M 56 50 Q 54 58 59 60" fill="none" stroke="#666" stroke-width="2" />
            <!-- Main Upper Receiver -->
            <rect x="42" y="26" width="48" height="18" fill="url(#mauser-steel)" stroke="#111" stroke-width="2" />
            <!-- Tangent Rear Sight -->
            <polygon points="62,26 78,22 80,26" fill="#333" stroke="#111" stroke-width="1" />
            <!-- Thin Long Barrel & Sight -->
            <rect x="90" y="29" width="55" height="10" fill="url(#mauser-steel)" stroke="#111" stroke-width="2" />
            <polygon points="140,29 143,24 145,29" fill="#111" />
          </svg>
        `,
      };

    // ==========================================
    // 2. SHOTGUNS / ESPINGARDAS
    // ==========================================
    case 'double_barrel':
      return {
        barrelTip: { x: 148, y: 35 },
        chamber: { x: 65, y: 36 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="walnut-stock" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#5a2d16" />
                <stop offset="100%" stop-color="#2c1206" />
              </linearGradient>
              <linearGradient id="shotgun-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#3a3d45" />
                <stop offset="50%" stop-color="#1f2127" />
                <stop offset="100%" stop-color="#0f1013" />
              </linearGradient>
            </defs>
            <!-- Shoulder Stock -->
            <path d="M 8 78 C 6 62 14 50 32 46 L 56 46 L 52 64 C 40 70 20 84 8 78 Z" fill="url(#walnut-stock)" stroke="#111" stroke-width="2" />
            <!-- Trigger & Guard -->
            <path d="M 50 50 C 50 62 60 62 62 50" fill="none" stroke="#222" stroke-width="2" />
            <line x1="55" y1="50" x2="54" y2="58" stroke="#777" stroke-width="2" />
            <line x1="58" y1="50" x2="57" y2="58" stroke="#777" stroke-width="2" />
            <!-- Break-action Receiver -->
            <path d="M 52 38 L 68 38 L 66 52 L 52 50 Z" fill="#222" stroke="#111" stroke-width="2" />
            <!-- Wooden Forend -->
            <rect x="72" y="44" width="30" height="9" rx="2" fill="url(#walnut-stock)" stroke="#111" stroke-width="1.5" />
            <!-- Twin Double Barrels (Stacked look) -->
            <rect x="68" y="32" width="80" height="7" fill="url(#shotgun-steel)" stroke="#111" stroke-width="1.5" />
            <rect x="68" y="38" width="80" height="7" fill="url(#shotgun-steel)" stroke="#111" stroke-width="1.5" />
            <!-- Brass Bead Sight -->
            <circle cx="146" cy="31" r="2" fill="#d4af37" />
          </svg>
        `,
      };

    case 'pump_trench':
      return {
        barrelTip: { x: 148, y: 34 },
        chamber: { x: 65, y: 36 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="trench-steel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#4e5159" />
                <stop offset="100%" stop-color="#1c1d22" />
              </linearGradient>
            </defs>
            <!-- Stock -->
            <path d="M 10 74 C 8 60 16 50 34 46 L 54 46 L 50 62 C 38 68 20 80 10 74 Z" fill="#4d2c18" stroke="#111" stroke-width="2" />
            <!-- Trigger -->
            <path d="M 48 50 C 48 60 58 60 60 50" fill="none" stroke="#222" stroke-width="2" />
            <line x1="53" y1="50" x2="52" y2="57" stroke="#777" stroke-width="2" />
            <!-- Receiver -->
            <rect x="52" y="34" width="28" height="18" rx="2" fill="url(#trench-steel)" stroke="#111" stroke-width="2" />
            <rect x="60" y="36" width="12" height="6" fill="#111" />
            <!-- Ribbed Pump Slide -->
            <rect x="86" y="44" width="26" height="10" rx="3" fill="#693b1e" stroke="#111" stroke-width="1.5" />
            <line x1="92" y1="44" x2="92" y2="54" stroke="#111" stroke-width="1.2" />
            <line x1="98" y1="44" x2="98" y2="54" stroke="#111" stroke-width="1.2" />
            <line x1="104" y1="44" x2="104" y2="54" stroke="#111" stroke-width="1.2" />
            <!-- Magazine Tube -->
            <rect x="80" y="44" width="62" height="8" fill="url(#trench-steel)" stroke="#111" stroke-width="1.5" />
            <!-- Heat Shield Perforated Barrel -->
            <rect x="80" y="32" width="68" height="10" fill="url(#trench-steel)" stroke="#111" stroke-width="1.5" />
            <circle cx="95" cy="37" r="1.5" fill="#111" />
            <circle cx="105" cy="37" r="1.5" fill="#111" />
            <circle cx="115" cy="37" r="1.5" fill="#111" />
            <circle cx="125" cy="37" r="1.5" fill="#111" />
            <circle cx="135" cy="37" r="1.5" fill="#111" />
            <!-- Bayonet Lug -->
            <rect x="142" y="40" width="5" height="6" fill="#111" />
          </svg>
        `,
      };

    case 'sawed_off':
      return {
        barrelTip: { x: 125, y: 38 },
        chamber: { x: 65, y: 38 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Cut Pistol Grip -->
            <path d="M 32 48 C 24 60 20 76 28 86 C 36 90 42 82 44 70 L 52 48 Z" fill="#5c2e14" stroke="#111" stroke-width="2" />
            <!-- Twin Exposed Hammers -->
            <circle cx="48" cy="34" r="3" fill="#444" stroke="#111" stroke-width="1.2" />
            <circle cx="53" cy="32" r="3" fill="#444" stroke="#111" stroke-width="1.2" />
            <!-- Receiver -->
            <rect x="52" y="36" width="22" height="18" fill="#24262c" stroke="#111" stroke-width="2" />
            <!-- Trigger & Guard -->
            <path d="M 46 52 C 46 64 58 64 60 52" fill="none" stroke="#222" stroke-width="2" />
            <line x1="52" y1="52" x2="51" y2="60" stroke="#777" stroke-width="2" />
            <!-- Forend -->
            <rect x="74" y="45" width="22" height="10" rx="3" fill="#5c2e14" stroke="#111" stroke-width="1.5" />
            <!-- Short Cut Twin Barrels -->
            <rect x="74" y="34" width="50" height="7" fill="#383b42" stroke="#111" stroke-width="2" />
            <rect x="74" y="41" width="50" height="7" fill="#383b42" stroke="#111" stroke-width="2" />
            <!-- Rough Cut End -->
            <line x1="124" y1="33" x2="124" y2="49" stroke="#111" stroke-width="3" />
          </svg>
        `,
      };

    // ==========================================
    // 3. SUBMACHINE GUNS / SMGs
    // ==========================================
    case 'tommy_gun':
      return {
        barrelTip: { x: 148, y: 35 },
        chamber: { x: 65, y: 35 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="drum-metal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#34373e" />
                <stop offset="100%" stop-color="#141518" />
              </linearGradient>
            </defs>
            <!-- Wooden Rear Stock -->
            <path d="M 12 70 C 10 56 18 46 34 44 L 48 44 L 46 58 C 36 64 22 76 12 70 Z" fill="#6a3818" stroke="#111" stroke-width="2" />
            <!-- Rear Pistol Grip -->
            <path d="M 44 48 C 40 60 38 74 44 82 C 48 84 54 80 54 70 L 56 48 Z" fill="#6a3818" stroke="#111" stroke-width="1.8" />
            <!-- Trigger & Guard -->
            <path d="M 54 48 C 55 58 64 58 65 48" fill="none" stroke="#222" stroke-width="2" />
            <line x1="59" y1="48" x2="58" y2="55" stroke="#777" stroke-width="2" />
            <!-- Receiver -->
            <rect x="48" y="30" width="46" height="18" rx="2" fill="#282a30" stroke="#111" stroke-width="2" />
            <line x1="78" y1="28" x2="84" y2="28" stroke="#777" stroke-width="3" />
            <!-- 50-Round Drum Magazine -->
            <circle cx="72" cy="56" r="16" fill="url(#drum-metal)" stroke="#111" stroke-width="2.5" />
            <circle cx="72" cy="56" r="6" fill="#1a1b1f" stroke="#d4af37" stroke-width="1.5" />
            <line x1="72" y1="40" x2="72" y2="72" stroke="#111" stroke-width="1.2" />
            <!-- Front Vertical Wooden Foregrip -->
            <path d="M 96 46 C 94 56 94 66 98 74 C 102 76 106 72 106 64 L 104 46 Z" fill="#6a3818" stroke="#111" stroke-width="1.8" />
            <!-- Ribbed Barrel Cooling Fins -->
            <rect x="94" y="33" width="44" height="7" fill="#32353c" stroke="#111" stroke-width="1.5" />
            <line x1="102" y1="30" x2="102" y2="43" stroke="#111" stroke-width="1.5" />
            <line x1="108" y1="30" x2="108" y2="43" stroke="#111" stroke-width="1.5" />
            <line x1="114" y1="30" x2="114" y2="43" stroke="#111" stroke-width="1.5" />
            <line x1="120" y1="30" x2="120" y2="43" stroke="#111" stroke-width="1.5" />
            <line x1="126" y1="30" x2="126" y2="43" stroke="#111" stroke-width="1.5" />
            <!-- Cutts Compensator & Sight -->
            <rect x="138" y="31" width="10" height="11" rx="1" fill="#18191c" stroke="#111" stroke-width="1.5" />
            <polygon points="144,31 146,27 148,31" fill="#fff" />
          </svg>
        `,
      };

    case 'mp40':
      return {
        barrelTip: { x: 146, y: 36 },
        chamber: { x: 70, y: 36 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Folded Wire Stock -->
            <path d="M 16 66 L 36 50 L 50 50" fill="none" stroke="#555" stroke-width="2.5" />
            <circle cx="16" cy="66" r="3" fill="#222" />
            <!-- Bakelite Pistol Grip -->
            <path d="M 44 48 C 38 60 36 74 42 82 C 48 84 52 78 52 68 L 54 48 Z" fill="#442211" stroke="#111" stroke-width="1.8" />
            <!-- Trigger & Guard -->
            <path d="M 52 48 C 53 58 62 58 63 48" fill="none" stroke="#222" stroke-width="2" />
            <line x1="57" y1="48" x2="56" y2="55" stroke="#777" stroke-width="2" />
            <!-- Tubular Receiver -->
            <rect x="46" y="30" width="54" height="16" rx="2" fill="#2c2e35" stroke="#111" stroke-width="2" />
            <line x1="60" y1="28" x2="68" y2="28" stroke="#888" stroke-width="3" />
            <!-- Straight 32-Round Stick Mag -->
            <rect x="74" y="44" width="10" height="44" rx="2" fill="#181a1f" stroke="#111" stroke-width="2" transform="rotate(6 74 44)" />
            <!-- Thin Barrel & Under-barrel Rest -->
            <rect x="100" y="34" width="44" height="7" fill="#3a3d46" stroke="#111" stroke-width="1.8" />
            <path d="M 120 41 L 138 41 L 138 46 Z" fill="#222" />
            <polygon points="140,34 143,29 145,34" fill="#111" />
          </svg>
        `,
      };

    case 'grease_gun':
      return {
        barrelTip: { x: 142, y: 35 },
        chamber: { x: 75, y: 35 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Wire Stock Collapsible -->
            <path d="M 18 52 L 46 52 M 18 52 L 20 68" fill="none" stroke="#666" stroke-width="3" />
            <!-- Stamped Metal Grip -->
            <path d="M 48 46 L 42 78 C 42 84 50 86 54 80 L 58 46 Z" fill="#303238" stroke="#111" stroke-width="2" />
            <!-- Trigger -->
            <path d="M 58 46 C 59 56 68 56 69 46" fill="none" stroke="#222" stroke-width="2" />
            <line x1="63" y1="46" x2="62" y2="54" stroke="#888" stroke-width="2" />
            <!-- Cylindrical Body -->
            <rect x="46" y="28" width="56" height="20" rx="3" fill="#383a42" stroke="#111" stroke-width="2" />
            <!-- Crank Cocking Handle -->
            <circle cx="86" cy="38" r="4" fill="#111" />
            <!-- Straight .45 Mag -->
            <rect x="74" y="48" width="12" height="42" rx="2" fill="#1c1d22" stroke="#111" stroke-width="2" />
            <!-- Short Barrel -->
            <rect x="102" y="32" width="38" height="10" fill="#2b2d33" stroke="#111" stroke-width="2" />
            <polygon points="136,32 138,28 140,32" fill="#111" />
          </svg>
        `,
      };

    // ==========================================
    // 4. FUZIS DE ASSALTO / RIFLES
    // ==========================================
    case 'bar_1918':
      return {
        barrelTip: { x: 148, y: 32 },
        chamber: { x: 65, y: 32 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Large Walnut Stock -->
            <path d="M 8 72 C 6 56 16 46 32 44 L 54 44 L 52 62 C 38 68 20 78 8 72 Z" fill="#542c15" stroke="#111" stroke-width="2" />
            <!-- Trigger Guard -->
            <path d="M 52 46 C 53 58 64 58 65 46" fill="none" stroke="#222" stroke-width="2" />
            <line x1="58" y1="46" x2="57" y2="54" stroke="#777" stroke-width="2" />
            <!-- Box Magazine (.30-06) -->
            <path d="M 66 46 L 68 76 L 80 74 L 78 46 Z" fill="#1b1d22" stroke="#111" stroke-width="2" />
            <!-- Heavy Steel Receiver -->
            <rect x="52" y="28" width="42" height="20" rx="2" fill="#2d3038" stroke="#111" stroke-width="2" />
            <!-- Wooden Forend Guard -->
            <rect x="90" y="36" width="30" height="12" rx="3" fill="#542c15" stroke="#111" stroke-width="1.8" />
            <!-- Heavy Long Barrel -->
            <rect x="94" y="30" width="52" height="8" fill="#3b3e48" stroke="#111" stroke-width="1.8" />
            <!-- Flash Hider & Front Sight -->
            <rect x="142" y="28" width="6" height="12" fill="#111" />
            <polygon points="144,28 146,24 148,28" fill="#fff" />
          </svg>
        `,
      };

    case 'm1_garand':
      return {
        barrelTip: { x: 148, y: 34 },
        chamber: { x: 68, y: 34 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Full Length Walnut Stock -->
            <path d="M 10 74 C 8 58 16 48 34 46 L 62 46 L 70 48 L 130 46 L 130 42 L 62 40 L 52 46 Z" fill="#5a3118" stroke="#111" stroke-width="2" />
            <!-- Trigger -->
            <path d="M 52 48 C 52 58 62 58 63 48" fill="none" stroke="#222" stroke-width="2" />
            <line x1="57" y1="48" x2="56" y2="54" stroke="#777" stroke-width="2" />
            <!-- En-Bloc Receiver -->
            <rect x="58" y="30" width="28" height="16" fill="#2a2d34" stroke="#111" stroke-width="2" />
            <rect x="64" y="32" width="12" height="6" fill="#d4af37" />
            <!-- Upper Handguard Wood -->
            <rect x="86" y="30" width="42" height="7" fill="#693b20" stroke="#111" stroke-width="1.2" />
            <!-- Barrel & Gas Cylinder Tube -->
            <rect x="126" y="32" width="20" height="6" fill="#32353d" stroke="#111" stroke-width="1.5" />
            <rect x="124" y="38" width="18" height="5" fill="#24262c" stroke="#111" stroke-width="1.2" />
            <!-- Front Sight Wings -->
            <polygon points="142,32 144,26 146,32" fill="#111" />
          </svg>
        `,
      };

    case 'stg_44':
      return {
        barrelTip: { x: 148, y: 32 },
        chamber: { x: 68, y: 32 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Wood Buttstock -->
            <path d="M 10 70 C 8 56 16 48 32 46 L 50 46 L 46 62 C 34 68 18 76 10 70 Z" fill="#5a3016" stroke="#111" stroke-width="2" />
            <!-- Pistol Grip -->
            <path d="M 46 48 L 40 78 C 40 84 48 84 52 76 L 54 48 Z" fill="#30180a" stroke="#111" stroke-width="1.8" />
            <!-- Curved Banana Magazine -->
            <path d="M 68 46 C 70 65 62 82 52 92 L 62 94 C 74 82 82 65 80 46 Z" fill="#1c1e22" stroke="#111" stroke-width="2" />
            <!-- Stamped Metal Receiver -->
            <rect x="50" y="26" width="46" height="22" rx="2" fill="#30333b" stroke="#111" stroke-width="2" />
            <!-- Ribbed Handguard -->
            <rect x="94" y="34" width="28" height="12" rx="2" fill="#202226" stroke="#111" stroke-width="1.8" />
            <line x1="98" y1="34" x2="98" y2="46" stroke="#444" stroke-width="1.5" />
            <line x1="104" y1="34" x2="104" y2="46" stroke="#444" stroke-width="1.5" />
            <line x1="110" y1="34" x2="110" y2="46" stroke="#444" stroke-width="1.5" />
            <line x1="116" y1="34" x2="116" y2="46" stroke="#444" stroke-width="1.5" />
            <!-- Barrel & Gas Tube -->
            <rect x="96" y="28" width="50" height="6" fill="#3a3d46" stroke="#111" stroke-width="1.8" />
            <!-- Hooded Sight -->
            <circle cx="144" cy="27" r="4" fill="none" stroke="#111" stroke-width="1.5" />
            <line x1="144" y1="27" x2="144" y2="31" stroke="#fff" stroke-width="1.5" />
          </svg>
        `,
      };

    // ==========================================
    // 5. ARMAS ESPECIAIS / DIVERSAS
    // ==========================================
    case 'molotov':
      return {
        barrelTip: { x: 105, y: 15 },
        chamber: { x: 80, y: 55 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Amber Glass Bottle -->
            <rect x="62" y="42" width="36" height="48" rx="8" fill="#a0521d" stroke="#221105" stroke-width="2" opacity="0.9" />
            <rect x="72" y="24" width="16" height="20" rx="3" fill="#8b4513" stroke="#221105" stroke-width="2" />
            <!-- Liquid Level Inside -->
            <rect x="65" y="55" width="30" height="32" rx="4" fill="#e67e22" opacity="0.85" />
            <!-- Rag Cloth Wick -->
            <path d="M 76 26 C 74 18 84 14 82 6 L 88 8 C 88 18 80 20 82 26 Z" fill="#ecf0f1" stroke="#333" stroke-width="1.5" />
            <!-- Burning Animated Fire at Wick -->
            <path d="M 80 12 C 70 -2 95 -6 90 8 C 96 2 102 12 90 14 Z" fill="#ff4400" filter="drop-shadow(0 0 6px #ffcc00)">
              <animate attributeName="d" 
                values="M 80 12 C 70 -2 95 -6 90 8 C 96 2 102 12 90 14 Z;
                        M 80 12 C 75 -6 100 -2 88 10 C 100 4 96 15 88 14 Z;
                        M 80 12 C 70 -2 95 -6 90 8 C 96 2 102 12 90 14 Z" 
                dur="0.3s" repeatCount="indefinite" />
            </path>
            <circle cx="85" cy="6" r="4" fill="#ffff00" opacity="0.8" />
          </svg>
        `,
      };

    case 'navalha_taco':
      return {
        barrelTip: { x: 140, y: 22 },
        chamber: { x: 70, y: 55 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- Ash Wood Baseball Bat -->
            <path d="M 24 82 L 32 74 L 138 22 C 146 18 148 28 142 34 L 40 88 C 34 92 20 90 24 82 Z" fill="#d2a679" stroke="#111" stroke-width="2" />
            <!-- Wrapped Grip Handle -->
            <path d="M 25 80 L 48 68" stroke="#111" stroke-width="3" />
            <path d="M 30 84 L 54 72" stroke="#fff" stroke-width="2" stroke-dasharray="3,2" />
            <!-- Nails & Spikes Protruding -->
            <line x1="110" y1="28" x2="114" y2="16" stroke="#444" stroke-width="2.5" />
            <circle cx="114" cy="16" r="2" fill="#8b0000" />
            <line x1="125" y1="22" x2="128" y2="10" stroke="#444" stroke-width="2.5" />
            <circle cx="128" cy="10" r="2" fill="#8b0000" />
            <line x1="128" y1="36" x2="135" y2="44" stroke="#444" stroke-width="2.5" />
            <!-- Barbed Wire Wrap -->
            <path d="M 100 42 Q 115 25 130 35" fill="none" stroke="#222" stroke-width="2" />
            <path d="M 112 36 Q 128 20 140 28" fill="none" stroke="#8b0000" stroke-width="1.8" />
          </svg>
        `,
      };

    case 'dinamite':
      return {
        barrelTip: { x: 120, y: 20 },
        chamber: { x: 70, y: 55 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <!-- 3 Red Dynamite Sticks Bundle -->
            <!-- Bottom Stick -->
            <rect x="42" y="52" width="68" height="18" rx="4" fill="#c0392b" stroke="#111" stroke-width="2" />
            <text x="56" y="65" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#111" letter-spacing="1">TNT</text>
            <!-- Middle Stick -->
            <rect x="44" y="38" width="68" height="18" rx="4" fill="#e74c3c" stroke="#111" stroke-width="2" />
            <text x="58" y="51" font-family="Arial, sans-serif" font-weight="900" font-size="9" fill="#111" letter-spacing="1">TNT</text>
            <!-- Top Stick -->
            <rect x="42" y="26" width="68" height="18" rx="4" fill="#c0392b" stroke="#111" stroke-width="2" />
            <!-- Black Tape Binding -->
            <rect x="52" y="24" width="10" height="48" fill="#111" opacity="0.9" />
            <rect x="88" y="24" width="10" height="48" fill="#111" opacity="0.9" />
            <!-- Sizzling Fuse Rope -->
            <path d="M 110 35 Q 122 30 118 20 Q 114 12 125 10" fill="none" stroke="#333" stroke-width="2.5" />
            <!-- Sparking Fire Ember -->
            <circle cx="125" cy="10" r="4" fill="#f39c12">
              <animate attributeName="r" values="3;6;3" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="125" cy="10" r="2" fill="#ffffff" />
          </svg>
        `,
      };

    case 'fists':
      return {
        barrelTip: { x: 118, y: 52 },
        chamber: { x: 80, y: 58 },
        svg: `
          <svg viewBox="0 0 150 100" class="weapon-sprite-svg" xmlns="http://www.w3.org/2000/svg">
            <path d="M 46 62 C 44 42 66 34 90 38 C 112 36 128 48 124 66 C 120 84 96 90 72 86 C 54 84 48 74 46 62 Z" fill="#e2b38f" stroke="#111" stroke-width="2.5" />
            <path d="M 84 40 L 84 62 M 98 40 L 98 62 M 112 44 L 112 64" stroke="#8a5a3a" stroke-width="2" fill="none" stroke-linecap="round" />
            <path d="M 70 40 C 76 34 92 32 104 36" stroke="rgba(255,255,255,0.35)" stroke-width="2.4" fill="none" stroke-linecap="round" />
            <path d="M 46 66 C 38 70 36 86 42 92 L 70 92 L 72 86" fill="#c9966d" stroke="#111" stroke-width="2.2" />
          </svg>
        `,
      };

    case 'springfield_1903':
      return getWeaponSprite('m1_garand', side); // rifle de ferrolho: usa o desenho do rifle até haver o próprio

    default:
      return getWeaponSprite('colt_1911', side);
  }
}

