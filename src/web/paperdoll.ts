export interface CharacterAppearance {
  name: string;
  gender: 'male' | 'female';
  skinTone: string;
  hairStyle: 'slick' | 'pompadour' | 'messy' | 'buzz' | 'bob' | 'wavy' | 'bald' | 'side_part' | 'curly' | 'updo';
  hairColor: string;
  eyeColor: string;
  facialHair: 'none' | 'mustache' | 'goatee' | 'stubble' | 'beard' | 'handlebar' | 'vandyke';
  facialHairColor: string;
  clothing: 'pinstripe_suit' | 'trenchcoat' | 'vest_suspenders' | 'leather_jacket' | 'classic_suit' | 'turtleneck' | 'flapper_dress';
  clothingColor: string;
  clothingSecondaryColor: string;
  accessory: 'none' | 'fedora' | 'sunglasses' | 'cigar' | 'scar' | 'gold_chain' | 'eyepatch' | 'monocle' | 'earring' | 'flower';
  /** Chapéu (separado do acessório). Saves antigos não têm este campo: o 'fedora' antigo continua valendo. */
  hat?: 'none' | 'fedora' | 'flat_cap' | 'bowler';
  cardBackground: 'alley' | 'bar' | 'bank' | 'dock';
}

export const SKIN_TONES = [
  { id: 'pale', name: 'Claro', value: '#fae0cd' },
  { id: 'tan', name: 'Bronzeado', value: '#e2b38f' },
  { id: 'olive', name: 'Oliva', value: '#c5926b' },
  { id: 'brown', name: 'Moreno', value: '#8f5c38' },
  { id: 'dark', name: 'Escuro', value: '#583620' },
  { id: 'porcelain', name: 'Porcelana', value: '#fdeee4' },
  { id: 'caramel', name: 'Caramelo', value: '#b07a4f' },
  { id: 'ebony', name: 'Ébano', value: '#3b2314' },
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Preto', value: '#1b1b1e' },
  { id: 'dark_brown', name: 'Castanho Escuro', value: '#3e2723' },
  { id: 'brown', name: 'Castanho', value: '#5d4037' },
  { id: 'blonde', name: 'Loiro', value: '#d4af37' },
  { id: 'ginger', name: 'Ruivo', value: '#b7410e' },
  { id: 'grey', name: 'Grisalho', value: '#9e9e9e' },
  { id: 'white', name: 'Branco', value: '#eceff1' },
  { id: 'chestnut', name: 'Castanha', value: '#8b5a2b' },
  { id: 'platinum', name: 'Platinado', value: '#e8dcb5' },
  { id: 'burgundy', name: 'Vinho', value: '#6b1d2a' },
];

export const EYE_COLORS = [
  { id: 'brown', name: 'Castanho', value: '#4e342e' },
  { id: 'blue', name: 'Azul', value: '#1e88e5' },
  { id: 'green', name: 'Verde', value: '#2e7d32' },
  { id: 'amber', name: 'Âmbar', value: '#f57c00' },
  { id: 'grey', name: 'Cinza', value: '#546e7a' },
  { id: 'hazel', name: 'Mel', value: '#8d6e3b' },
  { id: 'black', name: 'Preto', value: '#1a1a1a' },
  { id: 'ice', name: 'Azul Gelo', value: '#64b5f6' },
];

export const CLOTHING_COLORS = [
  { id: 'charcoal', name: 'Carvão', main: '#212121', sec: '#e74c3c' },
  { id: 'crimson', name: 'Bordô', main: '#5b1212', sec: '#d4af37' },
  { id: 'navy', name: 'Azul Noite', main: '#102a43', sec: '#3498db' },
  { id: 'forest', name: 'Verde Máfia', main: '#1b3a27', sec: '#2ecc71' },
  { id: 'cream', name: 'Creme', main: '#dcd6cd', sec: '#8d6e63' },
  { id: 'pure_black', name: 'Preto Total', main: '#121212', sec: '#333333' },
  { id: 'mustard', name: 'Mostarda', main: '#8a6d1d', sec: '#1b1b1e' },
  { id: 'steel', name: 'Aço', main: '#555b66', sec: '#e74c3c' },
  { id: 'teal', name: 'Petróleo', main: '#0e4a4f', sec: '#f1c40f' },
  { id: 'coffee', name: 'Café', main: '#4a2f1c', sec: '#d4af37' },
];

export const DEFAULT_CARRASCO: CharacterAppearance = {
  name: 'Vincenzo "O Carrasco"',
  gender: 'male',
  skinTone: '#fae0cd',
  hairStyle: 'slick',
  hairColor: '#1b1b1e',
  eyeColor: '#546e7a',
  facialHair: 'stubble',
  facialHairColor: '#1b1b1e',
  clothing: 'trenchcoat',
  clothingColor: '#212121',
  clothingSecondaryColor: '#e74c3c',
  accessory: 'scar',
  cardBackground: 'alley',
};

export const DEFAULT_MURALHA: CharacterAppearance = {
  name: 'Salvatore "A Muralha"',
  gender: 'male',
  skinTone: '#e2b38f',
  hairStyle: 'buzz',
  hairColor: '#5d4037',
  eyeColor: '#4e342e',
  facialHair: 'beard',
  facialHairColor: '#5d4037',
  clothing: 'pinstripe_suit',
  clothingColor: '#102a43',
  clothingSecondaryColor: '#3498db',
  accessory: 'cigar',
  cardBackground: 'bar',
};

export const DEFAULT_MALANDRO: CharacterAppearance = {
  name: 'Luciano "O Malandro"',
  gender: 'male',
  skinTone: '#c5926b',
  hairStyle: 'pompadour',
  hairColor: '#1b1b1e',
  eyeColor: '#2e7d32',
  facialHair: 'mustache',
  facialHairColor: '#1b1b1e',
  clothing: 'vest_suspenders',
  clothingColor: '#212121',
  clothingSecondaryColor: '#2ecc71',
  accessory: 'fedora',
  cardBackground: 'dock',
};

/**
 * Generates an SVG string representation of the character's vector avatar.
 * Stylized in clean 2D vector cartoon gangster aesthetic.
 */
export function renderPaperdollSVG(
  app: CharacterAppearance,
  options?: { pose?: 'idle' | 'attack' | 'hurt' | 'dodge' | 'dead'; /** em rem */ width?: number; /** em rem */ height?: number }
): string {
  const pose = options?.pose ?? 'idle';
  const width = options?.width ?? 17.5; // em rem (tudo proporcional à tela)
  const height = options?.height ?? 21.25;

  // Background gradients
  let bgGradient = `
    <radialGradient id="bg-grad" cx="50%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#2c303f" />
      <stop offset="100%" stop-color="#0e1017" />
    </radialGradient>
  `;

  if (app.cardBackground === 'alley') {
    bgGradient = `
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#2a1b1b" />
        <stop offset="60%" stop-color="#141014" />
        <stop offset="100%" stop-color="#080708" />
      </linearGradient>
    `;
  } else if (app.cardBackground === 'bar') {
    bgGradient = `
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#3d2716" />
        <stop offset="60%" stop-color="#1d130a" />
        <stop offset="100%" stop-color="#0a0704" />
      </linearGradient>
    `;
  } else if (app.cardBackground === 'dock') {
    bgGradient = `
      <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#122738" />
        <stop offset="60%" stop-color="#0c1622" />
        <stop offset="100%" stop-color="#05090f" />
      </linearGradient>
    `;
  }

  // Animation pose offsets
  let headY = 85;
  let headX = 140;
  let bodyY = 175;
  let rotBody = 0;

  if (pose === 'attack') {
    headX += 15;
    bodyY -= 5;
    rotBody = 4;
  } else if (pose === 'hurt') {
    headX -= 15;
    headY += 5;
    rotBody = -6;
  } else if (pose === 'dodge') {
    headY -= 15;
    headX -= 25;
    rotBody = -10;
  } else if (pose === 'dead') {
    rotBody = -35;
    headY += 40;
    headX -= 30;
  }

  // Generate SVG layers
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 340" style="width:${width}rem;height:${height}rem" class="paperdoll-svg ${pose}">
      <defs>
        ${bgGradient}
        <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.6"/>
        </filter>
        <filter id="soft-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- CARD BACKGROUND -->
      <rect width="280" height="340" rx="14" fill="url(#bg-grad)" />

      <!-- BACKGROUND SCENERY DETAILS -->
      ${renderBackgroundDetails(app.cardBackground)}

      <!-- CHARACTER GROUP (WITH POSE TRANSFORM) -->
      <g transform="rotate(${rotBody} 140 260)">
        <!-- TORSO / SHOULDERS -->
        ${renderClothing(app, headX, bodyY)}

        <!-- HEAD & NECK -->
        <g transform="translate(${headX - 140}, ${headY - 85})">
          <!-- NECK -->
          <path d="M 124 125 L 124 165 C 124 175 156 175 156 165 L 156 125 Z" fill="${app.skinTone}" />
          <!-- NECK SHADOW -->
          <path d="M 124 125 Q 140 145 156 125 L 156 138 Q 140 152 124 138 Z" fill="rgba(0,0,0,0.18)" />

          <!-- HEAD BASE -->
          ${app.gender === 'female' ? renderFemaleHead(app.skinTone) : renderMaleHead(app.skinTone)}

          <!-- EYES -->
          ${renderEyes(app.eyeColor)}

          <!-- EYEBROWS -->
          ${renderEyebrows(app.hairColor)}

          <!-- NOSE & MOUTH -->
          ${renderMouthAndNose(app)}

          <!-- FACIAL HAIR (MEN) -->
          ${app.gender === 'male' ? renderFacialHair(app.facialHair, app.facialHairColor) : ''}

          <!-- HAIR LAYER -->
          ${renderHair(app.hairStyle, app.hairColor, app.gender, (app.hat ?? (app.accessory === 'fedora' ? 'fedora' : 'none')) !== 'none')}

          <!-- ACCESSORIES (FACE / HEAD) -->
          ${renderAccessory(app.accessory, app.clothingSecondaryColor)}

          <!-- HAT -->
          ${renderHat(app.hat ?? (app.accessory === 'fedora' ? 'fedora' : 'none'), app.clothingColor, app.clothingSecondaryColor)}
        </g>
      </g>
    </svg>
  `;
}

function renderBackgroundDetails(type: string): string {
  if (type === 'alley') {
    return `
      <!-- Alley bricks & lamp -->
      <path d="M 20 0 L 20 340 M 40 0 L 40 340 M 240 0 L 240 340 M 260 0 L 260 340" stroke="rgba(255,255,255,0.04)" stroke-width="2" />
      <circle cx="230" cy="50" r="14" fill="#ff7675" opacity="0.3" filter="url(#soft-glow)" />
      <text x="210" y="55" fill="#ff7675" font-family="'Cinzel', serif" font-weight="bold" font-size="10" opacity="0.7">CLUB</text>
    `;
  }
  if (type === 'bar') {
    return `
      <!-- Speakeasy wood shelves -->
      <rect x="15" y="40" width="250" height="8" rx="2" fill="#5d4037" opacity="0.5" />
      <rect x="30" y="20" width="12" height="20" rx="2" fill="#d4af37" opacity="0.4" />
      <rect x="50" y="16" width="14" height="24" rx="2" fill="#e67e22" opacity="0.5" />
      <rect x="220" y="18" width="16" height="22" rx="2" fill="#b7410e" opacity="0.4" />
    `;
  }
  if (type === 'bank') {
    return `
      <!-- Marble bank columns and gold glow -->
      <rect x="18" y="30" width="16" height="250" fill="rgba(255,255,255,0.06)" />
      <rect x="56" y="30" width="16" height="250" fill="rgba(255,255,255,0.05)" />
      <rect x="208" y="30" width="16" height="250" fill="rgba(255,255,255,0.05)" />
      <rect x="246" y="30" width="16" height="250" fill="rgba(255,255,255,0.06)" />
      <rect x="10" y="22" width="260" height="8" fill="rgba(212,175,55,0.35)" />
      <circle cx="140" cy="60" r="30" fill="#d4af37" opacity="0.14" filter="url(#soft-glow)" />
    `;
  }
  return `
    <!-- Foggy harbor / City silhouettes -->
    <path d="M 0 160 Q 70 140 140 160 T 280 160 L 280 340 L 0 340 Z" fill="rgba(0,0,0,0.25)" />
    <circle cx="50" cy="50" r="18" fill="#f5cd79" opacity="0.25" filter="url(#soft-glow)" />
  `;
}

function renderMaleHead(skin: string): string {
  return `
    <!-- Strong defined male mobster jawline -->
    <path d="M 104 70 C 104 35 176 35 176 70 C 176 98 174 125 158 142 C 148 152 132 152 122 142 C 106 125 104 98 104 70 Z" fill="${skin}" stroke="#222" stroke-width="2.5" />
    <!-- Ear Left -->
    <path d="M 104 85 C 96 85 96 110 105 112 Z" fill="${skin}" stroke="#222" stroke-width="2" />
    <!-- Ear Right -->
    <path d="M 176 85 C 184 85 184 110 175 112 Z" fill="${skin}" stroke="#222" stroke-width="2" />
  `;
}

function renderFemaleHead(skin: string): string {
  return `
    <!-- Sleek femme fatale jawline -->
    <path d="M 108 70 C 108 40 172 40 172 70 C 172 98 168 126 154 140 C 146 148 134 148 126 140 C 112 126 108 98 108 70 Z" fill="${skin}" stroke="#222" stroke-width="2.5" />
    <path d="M 108 88 C 102 88 102 108 109 110 Z" fill="${skin}" stroke="#222" stroke-width="2" />
    <path d="M 172 88 C 178 88 178 108 171 110 Z" fill="${skin}" stroke="#222" stroke-width="2" />
  `;
}

function renderEyes(color: string): string {
  return `
    <!-- Left Eye -->
    <ellipse cx="125" cy="85" rx="7" ry="5" fill="#ffffff" stroke="#222" stroke-width="1.8" />
    <circle cx="126" cy="85" r="3.2" fill="${color}" />
    <circle cx="127" cy="84" r="1.2" fill="#000" />
    <circle cx="128" cy="83" r="0.8" fill="#fff" />

    <!-- Right Eye -->
    <ellipse cx="155" cy="85" rx="7" ry="5" fill="#ffffff" stroke="#222" stroke-width="1.8" />
    <circle cx="154" cy="85" r="3.2" fill="${color}" />
    <circle cx="153" cy="84" r="1.2" fill="#000" />
    <circle cx="154" cy="83" r="0.8" fill="#fff" />
  `;
}

function renderEyebrows(hairColor: string): string {
  return `
    <!-- Determined thick gangster eyebrows -->
    <path d="M 115 76 Q 125 72 135 77" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 145 77 Q 155 72 165 76" fill="none" stroke="${hairColor}" stroke-width="3.5" stroke-linecap="round" />
  `;
}

function renderMouthAndNose(app: CharacterAppearance): string {
  return `
    <!-- Nose with clean comic line -->
    <path d="M 140 82 L 142 105 L 137 108 L 143 108" fill="none" stroke="#222" stroke-width="2" stroke-linejoin="round" />

    <!-- Mouth (Smirk / Grimace) -->
    <path d="M 128 126 Q 140 128 152 124" fill="none" stroke="#222" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 132 132 Q 140 134 148 132" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="1.5" />
  `;
}

function renderFacialHair(type: string, color: string): string {
  if (type === 'mustache') {
    return `
      <!-- Pencil / classic mobster mustache -->
      <path d="M 127 119 Q 140 115 140 122 Q 140 115 153 119 Q 140 124 127 119 Z" fill="${color}" stroke="#111" stroke-width="1" />
    `;
  }
  if (type === 'stubble') {
    return `
      <!-- 5 o'clock shadow -->
      <path d="M 118 115 Q 140 125 162 115 C 160 145 150 148 140 148 C 130 148 120 145 118 115 Z" fill="${color}" opacity="0.22" />
    `;
  }
  if (type === 'goatee') {
    return `
      <path d="M 128 118 Q 140 116 152 118 L 148 146 Q 140 150 132 146 Z" fill="${color}" stroke="#111" stroke-width="1" />
    `;
  }
  if (type === 'beard') {
    return `
      <!-- Heavy thick mob boss beard -->
      <path d="M 105 90 C 105 145 118 160 140 160 C 162 160 175 145 175 90 C 172 120 165 140 152 142 Q 140 135 128 142 C 115 140 108 120 105 90 Z" fill="${color}" stroke="#111" stroke-width="1.8" />
    `;
  }
  if (type === 'handlebar') {
    return `
      <!-- Waxed handlebar mustache -->
      <path d="M 120 120 Q 130 112 140 119 Q 150 112 160 120 Q 150 127 140 123 Q 130 127 120 120 Z" fill="${color}" stroke="#111" stroke-width="1" />
      <path d="M 120 120 Q 112 119 112 111 M 160 120 Q 168 119 168 111" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" />
    `;
  }
  if (type === 'vandyke') {
    return `
      <!-- Van Dyke: mustache + pointed goatee -->
      <path d="M 127 119 Q 140 115 140 122 Q 140 115 153 119 Q 140 124 127 119 Z" fill="${color}" stroke="#111" stroke-width="1" />
      <path d="M 131 130 Q 140 126 149 130 L 142 152 Q 140 156 138 152 Z" fill="${color}" stroke="#111" stroke-width="1" />
    `;
  }
  return '';
}

function renderHair(style: string, color: string, gender: string, hasHat = false): string {
  if (style === 'bald') return '';

  if (style === 'pompadour') {
    return `
      <!-- Rockabilly / Slick Pompadour -->
      <path d="M 102 68 C 100 20 130 10 140 12 C 160 15 180 30 178 68 C 170 45 150 35 140 38 C 120 40 110 50 102 68 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
    `;
  }
  if (style === 'slick') {
    return `
      <!-- Classic 1930s Slicked Back -->
      <path d="M 102 65 C 102 28 130 22 140 22 C 150 22 178 28 178 65 C 170 50 155 42 140 42 C 125 42 110 50 102 65 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
      <path d="M 115 32 Q 140 45 165 32" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none" />
    `;
  }
  if (style === 'buzz') {
    return `
      <!-- Military buzz cut -->
      <path d="M 103 68 C 104 38 130 32 140 32 C 150 32 176 38 177 68 C 170 55 155 48 140 48 C 125 48 110 55 103 68 Z" fill="${color}" opacity="0.9" stroke="#111" stroke-width="1.5" />
    `;
  }
  if (style === 'bob') {
    return `
      <!-- Vintage 1920s Flapper Bob -->
      <path d="M 100 70 C 95 35 130 20 140 20 C 150 20 185 35 180 70 C 188 110 175 130 168 135 C 165 110 170 70 140 50 C 110 70 115 110 112 135 C 105 130 92 110 100 70 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
    `;
  }

  if (style === 'wavy') {
    return `
      <!-- Long 1930s finger waves -->
      <path d="M 100 72 C 92 30 126 16 140 16 C 154 16 188 30 180 72 C 190 100 184 132 192 156 C 178 150 170 128 168 100 C 164 64 118 64 112 100 C 110 128 102 150 88 156 C 96 132 90 100 100 72 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
      <path d="M 118 34 Q 140 46 162 34" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none" />
      <path d="M 97 112 Q 104 126 96 142 M 183 112 Q 176 126 184 142" stroke="rgba(255,255,255,0.2)" stroke-width="2" fill="none" />
    `;
  }
  if (style === 'side_part') {
    return `
      <!-- Classic side part -->
      <path d="M 102 68 C 100 28 128 18 142 18 C 162 18 182 30 178 68 C 174 50 164 40 150 38 C 134 36 112 44 102 68 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
      <path d="M 126 20 Q 124 34 112 46" stroke="rgba(0,0,0,0.4)" stroke-width="2" fill="none" />
      <path d="M 146 24 Q 166 28 176 50" stroke="rgba(255,255,255,0.22)" stroke-width="2" fill="none" />
    `;
  }
  if (style === 'curly') {
    const puffs = [[110, 56, 17], [126, 36, 19], [154, 36, 19], [170, 56, 17], [140, 26, 17], [103, 76, 11], [177, 76, 11]];
    return `
      <!-- Curly voluminous hair -->
      <g stroke="#111" stroke-width="5">${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" />`).join('')}</g>
      <g>${puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}" fill="${color}" />`).join('')}</g>
    `;
  }
  if (style === 'updo') {
    return `
      <!-- Elegant updo with bun -->
      ${hasHat ? '' : `<circle cx="140" cy="14" r="17" fill="${color}" stroke="#111" stroke-width="2.5" />`}
      <path d="M 102 65 C 102 28 130 22 140 22 C 150 22 178 28 178 65 C 170 50 155 42 140 42 C 125 42 110 50 102 65 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
      <path d="M 118 30 Q 140 42 162 30" stroke="rgba(255,255,255,0.25)" stroke-width="2" fill="none" />
    `;
  }

  // Default messy / parted
  return `
    <path d="M 102 68 C 100 30 125 22 140 22 C 158 22 178 30 178 68 C 170 50 152 45 140 45 C 122 45 110 52 102 68 Z" fill="${color}" stroke="#111" stroke-width="2.5" />
  `;
}

function renderClothing(app: CharacterAppearance, headX: number, bodyY: number): string {
  const main = app.clothingColor;
  const sec = app.clothingSecondaryColor;

  if (app.clothing === 'trenchcoat') {
    return `
      <!-- Trenchcoat with popped collar -->
      <path d="M 40 340 L 50 210 L 95 160 L 124 165 L 140 195 L 156 165 L 185 160 L 230 210 L 240 340 Z" fill="${main}" stroke="#111" stroke-width="3" />
      <!-- High Collar Left & Right -->
      <path d="M 95 160 L 105 115 L 126 155 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
      <path d="M 185 160 L 175 115 L 154 155 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
      <!-- Inner shirt & Red tie -->
      <polygon points="126,155 154,155 140,210" fill="#f5f5f5" stroke="#111" stroke-width="1.5" />
      <polygon points="137,165 143,165 145,215 140,225 135,215" fill="${sec}" stroke="#111" stroke-width="1.5" />
      <!-- Coat Lapels -->
      <path d="M 95 160 L 140 250 L 140 340" stroke="#111" stroke-width="3" fill="none" />
      <path d="M 185 160 L 140 250" stroke="#111" stroke-width="3" fill="none" />
      <circle cx="120" cy="270" r="5" fill="#d4af37" />
      <circle cx="120" cy="305" r="5" fill="#d4af37" />
    `;
  }

  if (app.clothing === 'pinstripe_suit') {
    return `
      <!-- Pinstripe Double-Breasted Suit -->
      <path d="M 45 340 L 55 205 L 100 160 L 124 165 L 140 195 L 156 165 L 180 160 L 225 205 L 235 340 Z" fill="${main}" stroke="#111" stroke-width="3" />
      <!-- Pinstripe lines -->
      <line x1="80" y1="180" x2="70" y2="340" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
      <line x1="105" y1="165" x2="95" y2="340" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
      <line x1="175" y1="165" x2="185" y2="340" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
      <line x1="200" y1="180" x2="210" y2="340" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
      <!-- Shirt & Tie -->
      <polygon points="126,165 154,165 140,215" fill="#fff" stroke="#111" stroke-width="1.5" />
      <polygon points="137,170 143,170 145,225 140,235 135,225" fill="${sec}" stroke="#111" stroke-width="1.5" />
      <!-- Lapels & Buttons -->
      <path d="M 100 160 L 138 235 L 138 340" stroke="#111" stroke-width="2.5" fill="none" />
      <path d="M 180 160 L 128 235" stroke="#111" stroke-width="2.5" fill="none" />
      <circle cx="125" cy="255" r="4" fill="#d4af37" />
      <circle cx="150" cy="255" r="4" fill="#d4af37" />
      <circle cx="125" cy="285" r="4" fill="#d4af37" />
      <circle cx="150" cy="285" r="4" fill="#d4af37" />
    `;
  }

  const BODY = 'M 45 340 L 55 205 L 100 160 L 124 165 L 140 195 L 156 165 L 180 160 L 225 205 L 235 340 Z';

  if (app.clothing === 'leather_jacket') {
    return `
      <!-- Biker-style leather jacket over a white tee -->
      <path d="${BODY}" fill="${main}" stroke="#111" stroke-width="3" />
      <polygon points="126,165 154,165 140,208" fill="#ececec" stroke="#111" stroke-width="1.5" />
      <path d="M 100 160 L 126 168 L 140 208 L 122 246 L 84 210 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
      <path d="M 180 160 L 154 168 L 140 208 L 158 246 L 196 210 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
      <path d="M 140 208 L 140 340" stroke="#9aa0a6" stroke-width="3" stroke-dasharray="4,3" />
      <path d="M 60 220 L 54 340 M 220 220 L 226 340" stroke="${sec}" stroke-width="6" />
      <rect x="86" y="292" width="34" height="6" rx="2" fill="rgba(0,0,0,0.35)" />
      <rect x="160" y="292" width="34" height="6" rx="2" fill="rgba(0,0,0,0.35)" />
    `;
  }

  if (app.clothing === 'classic_suit') {
    return `
      <!-- Classic single-breasted suit with pocket square -->
      <path d="${BODY}" fill="${main}" stroke="#111" stroke-width="3" />
      <polygon points="126,165 154,165 140,215" fill="#fff" stroke="#111" stroke-width="1.5" />
      <polygon points="137,170 143,170 145,225 140,235 135,225" fill="${sec}" stroke="#111" stroke-width="1.5" />
      <path d="M 100 160 L 140 245 L 140 340" stroke="#111" stroke-width="2.5" fill="none" />
      <path d="M 180 160 L 140 245" stroke="#111" stroke-width="2.5" fill="none" />
      <circle cx="140" cy="266" r="4" fill="#d4af37" />
      <circle cx="140" cy="298" r="4" fill="#d4af37" />
      <polygon points="168,232 184,232 182,243 170,243" fill="${sec}" stroke="#111" stroke-width="1.2" />
    `;
  }

  if (app.clothing === 'turtleneck') {
    return `
      <!-- Noir knit turtleneck -->
      <path d="${BODY}" fill="${main}" stroke="#111" stroke-width="3" />
      <path d="M 80 190 L 70 340 M 105 170 L 97 340 M 175 170 L 183 340 M 200 190 L 210 340" stroke="rgba(255,255,255,0.1)" stroke-width="2" />
      <path d="M 110 150 C 110 182 170 182 170 150 L 176 176 C 176 206 104 206 104 176 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
      <path d="M 112 168 Q 140 188 168 168" stroke="rgba(255,255,255,0.14)" stroke-width="2" fill="none" />
      <path d="M 108 182 Q 140 202 172 182" stroke="rgba(255,255,255,0.1)" stroke-width="2" fill="none" />
    `;
  }

  if (app.clothing === 'flapper_dress') {
    return `
      <!-- Elegant 1920s dress with pearls -->
      <path d="M 60 340 L 68 214 Q 98 176 124 166 Q 140 204 156 166 Q 182 176 212 214 L 220 340 Z" fill="${main}" stroke="#111" stroke-width="3" />
      <path d="M 100 188 Q 140 238 180 188 L 160 160 L 120 160 Z" fill="${app.skinTone}" stroke="#111" stroke-width="2" />
      <path d="M 96 262 Q 140 276 184 262 L 186 282 Q 140 296 94 282 Z" fill="${sec}" stroke="#111" stroke-width="2" />
      <path d="M 112 180 Q 140 234 168 180" stroke="#f6f3ea" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1,7" fill="none" />
      <path d="M 78 300 L 74 340 M 100 300 L 98 340 M 180 300 L 182 340 M 202 300 L 206 340" stroke="rgba(255,255,255,0.25)" stroke-width="2" />
    `;
  }

  // Vest with Suspenders
  return `
    <!-- White shirt with vest and suspenders -->
    <path d="M 45 340 L 55 205 L 100 160 L 124 165 L 140 195 L 156 165 L 180 160 L 225 205 L 235 340 Z" fill="#f8f9fa" stroke="#111" stroke-width="3" />
    <!-- Dark Vest -->
    <path d="M 85 200 L 115 180 L 128 240 L 140 260 L 152 240 L 165 180 L 195 200 L 190 340 L 90 340 Z" fill="${main}" stroke="#111" stroke-width="2.5" />
    <!-- Suspenders -->
    <rect x="98" y="190" width="10" height="150" fill="${sec}" stroke="#111" stroke-width="1.2" />
    <rect x="172" y="190" width="10" height="150" fill="${sec}" stroke="#111" stroke-width="1.2" />
    <!-- Tie -->
    <polygon points="137,175 143,175 145,245 140,255 135,245" fill="${sec}" stroke="#111" stroke-width="1.5" />
  `;
}

function renderAccessory(acc: string, color: string): string {
  if (acc === 'eyepatch') {
    return `
      <!-- Pirate-noir eyepatch with strap -->
      <path d="M 104 74 L 176 68" stroke="#111" stroke-width="2.5" fill="none" />
      <path d="M 114 78 Q 125 70 138 80 Q 138 96 125 98 Q 112 96 114 78 Z" fill="#111" stroke="#000" stroke-width="1.5" />
    `;
  }
  if (acc === 'monocle') {
    return `
      <!-- Gold monocle with chain -->
      <circle cx="155" cy="85" r="11" fill="rgba(255,255,255,0.14)" stroke="#d4af37" stroke-width="2.2" />
      <path d="M 164 93 Q 178 112 172 140" stroke="#d4af37" stroke-width="1.6" fill="none" stroke-dasharray="3,2" />
    `;
  }
  if (acc === 'earring') {
    return `
      <!-- Gold hoop earring -->
      <circle cx="103" cy="116" r="5" fill="none" stroke="#d4af37" stroke-width="2.2" />
    `;
  }
  if (acc === 'flower') {
    return `
      <!-- Red carnation on the lapel -->
      <g transform="translate(40, 120)">
        <circle cx="150" cy="108" r="7" fill="#c0392b" stroke="#111" stroke-width="1.5" />
        <circle cx="150" cy="108" r="3" fill="#e74c3c" />
        <path d="M 150 115 L 146 126" stroke="#2e7d32" stroke-width="2.2" />
      </g>
    `;
  }
  if (acc === 'sunglasses') {
    return `
      <!-- Dark Noir Sunglasses -->
      <path d="M 112 80 L 134 80 L 132 94 L 116 94 Z" fill="#111" stroke="#d4af37" stroke-width="1.5" />
      <path d="M 146 80 L 168 80 L 164 94 L 148 94 Z" fill="#111" stroke="#d4af37" stroke-width="1.5" />
      <line x1="134" y1="83" x2="146" y2="83" stroke="#d4af37" stroke-width="2" />
    `;
  }
  if (acc === 'cigar') {
    return `
      <!-- Burning Cuban Cigar with glowing ember -->
      <g transform="rotate(15 150 128)">
        <rect x="145" y="125" width="28" height="6" rx="2" fill="#6d4c41" stroke="#222" stroke-width="1" />
        <rect x="170" y="125" width="3" height="6" fill="#ff5722" filter="url(#soft-glow)" />
        <path d="M 174 124 Q 180 115 178 105" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </g>
    `;
  }
  if (acc === 'scar') {
    return `
      <!-- Cheek or Eye Scar -->
      <path d="M 118 72 L 126 100" stroke="#b71c1c" stroke-width="1.8" stroke-linecap="round" />
      <line x1="119" y1="82" x2="125" y2="84" stroke="#b71c1c" stroke-width="1.2" />
      <line x1="121" y1="90" x2="127" y2="92" stroke="#b71c1c" stroke-width="1.2" />
    `;
  }
  if (acc === 'gold_chain') {
    return `
      <!-- Heavy Gold Mob Chain -->
      <path d="M 115 160 Q 140 210 165 160" stroke="#d4af37" stroke-width="3.5" fill="none" stroke-dasharray="4,2" />
    `;
  }
  return '';
}

function renderHat(hat: string, main: string, sec: string): string {
  if (hat === 'fedora') {
    return `
      <!-- Gangster Fedora Hat -->
      <g transform="translate(0, 6)">
        <ellipse cx="140" cy="40" rx="68" ry="16" fill="#1b1b1e" stroke="#000" stroke-width="2.5" />
        <path d="M 98 38 C 100 0 120 5 130 8 C 140 5 155 3 162 10 C 172 8 180 20 182 38 Z" fill="#1b1b1e" stroke="#000" stroke-width="2.5" />
        <path d="M 103 36 C 120 32 160 32 177 36 L 178 30 C 160 26 120 26 102 30 Z" fill="${sec}" />
      </g>
    `;
  }
  if (hat === 'flat_cap') {
    return `
      <!-- Newsboy flat cap -->
      <g transform="translate(0, -4)">
        <path d="M 102 56 C 102 20 178 20 178 56 C 190 56 194 64 180 66 L 100 66 C 86 64 90 56 102 56 Z" fill="${main}" stroke="#000" stroke-width="2.5" />
        <path d="M 98 62 C 100 76 140 82 172 66 L 150 62 Z" fill="#1b1b1e" stroke="#000" stroke-width="2" />
        <path d="M 108 48 Q 140 36 172 48" stroke="rgba(255,255,255,0.22)" stroke-width="2" fill="none" />
        <circle cx="140" cy="26" r="3.5" fill="${main}" stroke="#000" stroke-width="1.5" />
      </g>
    `;
  }
  if (hat === 'bowler') {
    return `
      <!-- Bowler / derby hat -->
      <g transform="translate(0, -4)">
        <ellipse cx="140" cy="54" rx="52" ry="11" fill="#1b1b1e" stroke="#000" stroke-width="2.5" />
        <path d="M 106 52 C 104 6 176 6 174 52 Z" fill="#1b1b1e" stroke="#000" stroke-width="2.5" />
        <path d="M 107 46 C 125 52 155 52 173 46 L 174 52 C 155 58 125 58 106 52 Z" fill="${sec}" />
      </g>
    `;
  }
  return '';
}

/**
 * Randomize appearance based on style preference
 */
export function generateRandomAppearance(styleHint?: 'carrasco' | 'muralha' | 'malandro'): CharacterAppearance {
  const gender = Math.random() < 0.25 ? 'female' : 'male';
  const skin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].value;
  const hairStyles: CharacterAppearance['hairStyle'][] = gender === 'female' ? ['bob', 'wavy', 'messy'] : ['pompadour', 'slick', 'buzz', 'messy', 'bald'];
  const hairStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
  const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].value;
  const eyeColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].value;

  const facialHairs: CharacterAppearance['facialHair'][] = gender === 'female' ? ['none'] : ['none', 'mustache', 'stubble', 'goatee', 'beard'];
  const facialHair = facialHairs[Math.floor(Math.random() * facialHairs.length)];

  const clothings: CharacterAppearance['clothing'][] = ['pinstripe_suit', 'trenchcoat', 'vest_suspenders', 'classic_suit'];
  const clothing = clothings[Math.floor(Math.random() * clothings.length)];
  const colorPreset = CLOTHING_COLORS[Math.floor(Math.random() * CLOTHING_COLORS.length)];

  const accessories: CharacterAppearance['accessory'][] = ['none', 'fedora', 'sunglasses', 'cigar', 'scar', 'gold_chain'];
  const accessory = accessories[Math.floor(Math.random() * accessories.length)];

  const bgs: CharacterAppearance['cardBackground'][] = ['alley', 'bar', 'dock'];
  const cardBackground = bgs[Math.floor(Math.random() * bgs.length)];

  const firstNamesMale = ['Don Vito', 'Luciano', 'Vincenzo', 'Salvatore', 'Tony', 'Frankie', 'Silvio', 'Corrado'];
  const firstNamesFemale = ['Donna Carmela', 'Francesca', 'Gina', 'Isabella', 'Sofia', 'Lucia'];
  const nicknames = ['Navalha', 'Mãos de Ferro', 'Silencioso', 'Sombra', 'Scarface', 'Raposa', 'Touro', 'Carcereiro'];

  const fn = gender === 'female' ? firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)] : firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)];
  const nick = nicknames[Math.floor(Math.random() * nicknames.length)];

  return {
    name: `${fn} "${nick}"`,
    gender,
    skinTone: skin,
    hairStyle,
    hairColor,
    eyeColor,
    facialHair,
    facialHairColor: hairColor,
    clothing,
    clothingColor: colorPreset.main,
    clothingSecondaryColor: colorPreset.sec,
    accessory,
    cardBackground,
  };
}
