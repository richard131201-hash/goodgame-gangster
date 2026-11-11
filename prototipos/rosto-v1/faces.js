const hx = h => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
const dk = (c, t) => mix(c, '#000000', t);
const lt = (c, t) => mix(c, '#ffffff', t);

const EYES = {
  amendoado: { s: 'M-18 2 C-11 -8 11 -8 18 2 C11 8 -11 8 -18 2 Z', t: 'M-18 2 C-11 -8 11 -8 18 2', f: 'M-17 -3 C-10 -12 10 -12 17 -3', r: 6.8, y: 0 },
  redondo: { s: 'M-16 0 C-16 -10 16 -10 16 0 C16 10 -16 10 -16 0 Z', t: 'M-16 0 C-16 -10 16 -10 16 0', f: 'M-15 -5 C-9 -14 9 -14 15 -5', r: 8.6, y: 0 },
  estreito: { s: 'M-19 3 C-10 -4 10 -4 19 3 C10 6 -10 6 -19 3 Z', t: 'M-19 3 C-10 -4 10 -4 19 3', f: 'M-18 -1 C-9 -8 9 -8 18 -1', r: 5.6, y: 1 },
  pesado: { s: 'M-18 2 C-11 -8 11 -8 18 2 C11 8 -11 8 -18 2 Z', t: 'M-18 2 C-11 -8 11 -8 18 2', f: 'M-17 -4 C-10 -13 10 -13 17 -4', r: 6.4, y: 1.5, lid: 'M-18 2 C-11 -8 11 -8 18 2 C10 -3 -10 -3 -18 2 Z' },
  obliquo: { s: 'M-18 -2 C-10 -9 10 -7 18 3 C10 8 -10 8 -18 -2 Z', t: 'M-18 -2 C-10 -9 10 -7 18 3', f: 'M-17 -7 C-9 -14 10 -12 17 -2', r: 6.4, y: 0 },
  aberto: { s: 'M-20 1 C-12 -12 12 -12 20 1 C12 11 -12 11 -20 1 Z', t: 'M-20 1 C-12 -12 12 -12 20 1', f: 'M-19 -4 C-11 -16 11 -16 19 -4', r: 9.2, y: 0 }
};
const BROWS = {
  grossa: ['M-21 5 C-10 -5 8 -7 21 -2', 6.6],
  fina: ['M-20 4 C-8 -4 8 -5 20 -1', 2.6],
  arqueada: ['M-20 6 C-8 -9 10 -9 20 3', 4.6],
  reta: ['M-21 0 L21 -1', 5.6],
  brava: ['M-21 -5 L21 4', 6.2],
  alta: ['M-20 2 C-8 -8 8 -10 20 -6', 4.2]
};

function noseSvg(style, skin) {
  const line = dk(skin, 0.5), sh = dk(skin, 0.28), hi = lt(skin, 0.3);
  const bridge = `<path d="M155 150 C160 168 161 186 158 198 L167 201 C169 184 167 164 160 148 Z" fill="${sh}" opacity=".42"/>`;
  const nos = (x1, x2, y, rx) => `<ellipse cx="${x1}" cy="${y}" rx="${rx}" ry="2.2" fill="${dk(skin, 0.7)}" opacity=".8" transform="rotate(-18 ${x1} ${y})"/><ellipse cx="${x2}" cy="${y}" rx="${rx}" ry="2.2" fill="${dk(skin, 0.7)}" opacity=".8" transform="rotate(18 ${x2} ${y})"/>`;
  const tip = y => `<ellipse cx="149" cy="${y}" rx="4.4" ry="2.6" fill="${hi}" opacity=".55"/>`;
  switch (style) {
    case 'largo':
      return bridge + `<path d="M131 198 C138 211 162 211 169 198" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/><path d="M141 176 C137 188 132 194 131 198 M159 176 C163 188 168 194 169 198" fill="none" stroke="${line}" stroke-width="1.5" opacity=".6"/><path d="M133 192 C129 199 132 205 139 206 M167 192 C171 199 168 205 161 206" fill="none" stroke="${sh}" stroke-width="2" opacity=".7"/>` + nos(140, 160, 201, 4.4) + tip(193);
    case 'pequeno':
      return `<path d="M154 156 C158 170 158 182 156 190 L162 192 C163 180 162 166 158 154 Z" fill="${sh}" opacity=".35"/><path d="M141 193 C145 200 155 200 159 193" fill="none" stroke="${line}" stroke-width="1.9" stroke-linecap="round"/><path d="M144 178 C142 186 141 190 141 193 M156 178 C158 186 159 190 159 193" fill="none" stroke="${line}" stroke-width="1.3" opacity=".5"/>` + nos(144, 156, 196, 3) + tip(188);
    case 'aquilino':
      return `<path d="M154 150 C162 164 164 178 161 190 C160 197 156 203 153 207 L163 209 C168 196 169 172 160 146 Z" fill="${sh}" opacity=".45"/><path d="M140 203 C146 214 154 214 160 203" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/><path d="M146 160 C150 176 152 190 150 206" fill="none" stroke="${line}" stroke-width="1.6" opacity=".7"/><path d="M143 180 C140 190 139 198 140 203" fill="none" stroke="${line}" stroke-width="1.4" opacity=".55"/>` + nos(144, 157, 204, 3.2) + tip(196);
    case 'fino':
      return `<path d="M153 150 C157 168 157 184 155 198 L160 199 C162 184 161 166 157 150 Z" fill="${sh}" opacity=".4"/><path d="M143 200 C147 206 153 206 157 200" fill="none" stroke="${line}" stroke-width="1.8" stroke-linecap="round"/><path d="M146 174 C145 186 144 194 144 200 M154 174 C155 186 156 194 156 200" fill="none" stroke="${line}" stroke-width="1.3" opacity=".55"/>` + nos(146, 154, 201, 2.6) + tip(192);
    case 'quebrado':
      return `<path d="M150 150 C153 166 159 172 157 182 C155 192 161 196 163 200 L170 201 C168 186 164 178 164 168 C164 158 160 152 154 148 Z" fill="${sh}" opacity=".5"/><path d="M137 200 C141 208 159 208 163 200" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/><path d="M143 178 C140 188 138 194 137 200 M157 184 C160 192 162 196 163 200" fill="none" stroke="${line}" stroke-width="1.5" opacity=".6"/><path d="M146 170 C149 174 152 176 156 176" fill="none" stroke="${dk(skin, 0.65)}" stroke-width="1.4" opacity=".5"/>` + nos(142, 158, 201, 3.6) + tip(192);
    default:
      return bridge + `<path d="M137 199 C141 207 159 207 163 199" fill="none" stroke="${line}" stroke-width="2" stroke-linecap="round"/><path d="M143 176 C140 188 138 194 137 199 M157 176 C160 188 162 194 163 199" fill="none" stroke="${line}" stroke-width="1.5" opacity=".6"/>` + nos(142, 158, 200, 3.4) + tip(192);
  }
}

function mouthSvg(style, skin) {
  const up = mix(skin, '#9c3636', 0.5), lo = mix(skin, '#b04848', 0.52), ln = dk(skin, 0.68), hi = lt(lo, 0.28);
  const corner = (x, y, d) => `<path d="M${x} ${y} l${d} -2" stroke="${ln}" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>`;
  switch (style) {
    case 'sorriso':
      return `<path d="M133 224 C142 234 158 234 167 224 C159 229 141 229 133 224 Z" fill="#f4f0e8"/><path d="M129 219 C140 236 160 236 171 219" fill="none" stroke="${ln}" stroke-width="2" stroke-linecap="round"/><path d="M131 221 C141 217 147 218 150 220 C153 218 159 217 169 221 C160 223 140 223 131 221 Z" fill="${up}"/><path d="M135 230 C143 239 157 239 165 230 C158 234 142 234 135 230 Z" fill="${lo}"/>` + corner(128, 218, -3) + corner(172, 218, 3);
    case 'ladino':
      return `<path d="M131 227 C140 217 150 219 150 222 C154 219 162 217 172 217 C162 224 148 226 131 227 Z" fill="${up}"/><path d="M134 228 C142 237 158 235 168 224 C160 230 144 231 134 228 Z" fill="${lo}"/><path d="M129 228 C140 229 157 227 173 216" fill="none" stroke="${ln}" stroke-width="2" stroke-linecap="round"/>` + corner(174, 216, 3) + `<path d="M178 212 C181 216 181 222 177 226" fill="none" stroke="${dk(skin, 0.3)}" stroke-width="1.4" opacity=".45"/>`;
    case 'seria':
      return `<path d="M131 231 C141 222 159 222 169 231 C159 225 141 225 131 231 Z" fill="${up}"/><path d="M133 231 C142 238 158 238 167 231 C159 233 141 233 133 231 Z" fill="${lo}" opacity=".9"/><path d="M130 231 C141 221 159 221 170 231" fill="none" stroke="${ln}" stroke-width="2" stroke-linecap="round"/>` + corner(129, 233, -3) + corner(171, 233, 3);
    case 'cheia':
      return `<path d="M130 224 C138 214 147 216 150 220 C153 216 162 214 170 224 C160 228 140 228 130 224 Z" fill="${up}"/><path d="M132 225 C140 243 160 243 168 225 C160 230 140 230 132 225 Z" fill="${lo}"/><path d="M144 233 C148 236 152 236 156 233" fill="none" stroke="${hi}" stroke-width="2" opacity=".7" stroke-linecap="round"/><path d="M130 224 C141 228 159 228 170 224" fill="none" stroke="${ln}" stroke-width="1.8" stroke-linecap="round"/>`;
    case 'fina':
      return `<path d="M133 224 C141 221 147 221 150 222 C153 221 159 221 167 224 C159 225 141 225 133 224 Z" fill="${up}" opacity=".9"/><path d="M130 224 C141 227 159 227 170 224" fill="none" stroke="${ln}" stroke-width="2" stroke-linecap="round"/><path d="M137 228 C145 231 155 231 163 228" fill="none" stroke="${dk(skin, 0.25)}" stroke-width="1.4" opacity=".4"/>`;
    default:
      return `<path d="M131 224 C139 218 146 219 150 221 C154 219 161 218 169 224 C160 227 140 227 131 224 Z" fill="${up}"/><path d="M133 225 C141 237 159 237 167 225 C159 228 141 228 133 225 Z" fill="${lo}"/><path d="M144 232 C148 234 152 234 156 232" fill="none" stroke="${hi}" stroke-width="1.8" opacity=".6" stroke-linecap="round"/><path d="M131 224 C141 227.5 159 227.5 169 224" fill="none" stroke="${ln}" stroke-width="1.9" stroke-linecap="round"/>` + corner(130, 225, -3) + corner(170, 225, 3);
  }
}

function earSvg(style, skin) {
  const sh = dk(skin, 0.3), line = dk(skin, 0.55);
  const sc = style === 'grande' ? 1.28 : style === 'pequena' ? 0.78 : 1;
  const base = `<path d="M97 140 C80 132 71 160 80 180 C85 190 96 190 99 181 Z" fill="${skin}" stroke="${line}" stroke-width="1.5"/><path d="M91 148 C83 153 82 168 88 176" fill="none" stroke="${sh}" stroke-width="2" opacity=".65"/><path d="M92 158 C88 160 88 168 91 171" fill="none" stroke="${sh}" stroke-width="1.6" opacity=".5"/>`;
  const lumps = style === 'couveflor' ? `<circle cx="83" cy="156" r="6" fill="${mix(skin, '#c0504d', 0.35)}" stroke="${line}" stroke-width="1.2"/><circle cx="80" cy="169" r="5.5" fill="${mix(skin, '#c0504d', 0.3)}" stroke="${line}" stroke-width="1.2"/><circle cx="86" cy="180" r="4.5" fill="${mix(skin, '#c0504d', 0.3)}" stroke="${line}" stroke-width="1.2"/>` : '';
  return `<g transform="translate(97 160) scale(${sc}) translate(-97 -160)">${base}${lumps}</g>`;
}

function hairBack(style, c) {
  if (style !== 'ondulado') return '';
  return `<path d="M86 130 C70 88 96 40 150 40 C204 40 230 88 214 130 C228 190 214 250 230 308 L70 308 C86 250 72 190 86 130 Z" fill="${c}" stroke="${dk(c, 0.5)}" stroke-width="1.5"/><path d="M200 130 C214 180 204 240 218 300 L230 308 C214 250 228 190 214 130 Z" fill="${dk(c, 0.35)}" opacity=".5"/>`;
}

function hairFront(style, c) {
  const d = dk(c, 0.38), l = lt(c, 0.3), o = dk(c, 0.55);
  const st = `stroke="${o}" stroke-width="1.5" stroke-linejoin="round"`;
  switch (style) {
    case 'topete':
      return `<path d="M90 152 C80 92 94 54 124 42 C132 20 170 14 188 34 C206 50 212 92 210 152 C206 116 196 98 180 90 C166 80 124 82 112 96 C100 106 94 122 90 152 Z" fill="${c}" ${st}/><path d="M210 152 C216 92 208 50 188 34 C200 56 204 90 198 120 C196 134 200 144 210 152 Z" fill="${d}" opacity=".5"/><path d="M128 46 C140 26 168 22 184 38 C166 32 146 36 128 46 Z" fill="${l}" opacity=".4"/><path d="M116 72 C132 56 170 54 194 70 M120 84 C142 70 172 70 192 82 M134 40 C150 30 168 30 180 38" fill="none" stroke="${l}" stroke-width="2" opacity=".55" stroke-linecap="round"/>`;
    case 'risca':
      return `<path d="M90 152 C82 84 106 46 150 44 C194 46 218 84 210 152 C206 118 198 100 184 92 C176 86 150 84 124 90 C108 98 96 118 90 152 Z" fill="${c}" ${st}/><path d="M210 152 C218 84 194 46 150 44 C186 52 204 84 198 122 C196 134 200 144 210 152 Z" fill="${d}" opacity=".5"/><path d="M126 47 C124 64 116 80 106 94" fill="none" stroke="${d}" stroke-width="2.4"/><path d="M130 60 C150 52 184 56 200 78 M124 74 C144 66 176 70 194 90" fill="none" stroke="${l}" stroke-width="2" opacity=".55"/>`;
    case 'raspado':
      return `<path d="M91 148 C84 90 108 56 150 54 C192 56 216 90 209 148 C206 122 198 104 184 98 C170 92 130 92 116 98 C102 104 94 122 91 148 Z" fill="${c}" opacity=".62"/><path d="M104 96 C118 90 130 88 150 88 C170 88 182 90 196 96" fill="none" stroke="${o}" stroke-width="1.3" opacity=".5" stroke-dasharray="2 3"/>`;
    case 'bagunçado':
      return `<path d="M90 152 C80 94 94 54 124 40 L132 58 L148 32 L162 56 L178 36 L186 60 L206 54 C216 90 210 124 210 152 C206 118 198 100 184 92 C170 100 130 100 116 92 C102 100 94 120 90 152 Z" fill="${c}" ${st}/><path d="M210 152 C216 90 214 70 206 54 L186 60 L178 36 C196 60 206 100 198 124 C196 134 200 144 210 152 Z" fill="${d}" opacity=".5"/><path d="M114 70 L128 60 M146 50 L152 64 M170 58 L178 70" fill="none" stroke="${l}" stroke-width="2" opacity=".6"/>`;
    case 'cacheado': {
      const P = [[108, 80, 20], [126, 56, 22], [150, 48, 23], [174, 56, 22], [192, 80, 20], [97, 108, 13], [203, 108, 13], [119, 88, 15], [181, 88, 15], [150, 70, 18]];
      return `<g fill="${c}" stroke="${o}" stroke-width="5">${P.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g><g fill="${c}">${P.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r - 1.5}"/>`).join('')}</g><g fill="${d}" opacity=".4">${P.filter(p => p[0] > 150).map(([x, y, r]) => `<circle cx="${x + 5}" cy="${y + 4}" r="${r - 8}"/>`).join('')}</g><g fill="none" stroke="${l}" stroke-width="2" opacity=".55" stroke-linecap="round"><path d="M114 62 C120 54 128 52 134 54"/><path d="M158 42 C166 40 172 42 176 48"/><path d="M96 76 C98 70 102 66 106 66"/></g>`;
    }
    case 'ondulado':
      return `<path d="M91 150 C84 88 112 54 150 52 C188 54 216 88 209 150 C206 116 196 100 178 92 C168 102 132 102 122 92 C104 100 94 116 91 150 Z" fill="${c}" ${st}/><path d="M209 150 C216 88 190 54 150 52 C184 58 204 90 198 126 C196 138 200 146 209 150 Z" fill="${d}" opacity=".5"/><path d="M116 70 C134 58 170 58 188 74 M122 84 C142 72 168 74 184 86" fill="none" stroke="${l}" stroke-width="2" opacity=".55"/>`;
    case 'careca':
      return '';
    default:
      return `<path d="M90 152 C84 86 108 50 150 48 C192 50 216 86 210 152 C206 118 198 100 184 92 C170 100 130 100 116 92 C102 100 94 118 90 152 Z" fill="${c}" ${st}/><path d="M210 152 C216 86 192 50 150 48 C178 56 200 86 196 122 C194 134 198 144 210 152 Z" fill="${d}" opacity=".5"/><path d="M112 76 C130 62 170 62 190 76 M118 86 C140 76 164 76 182 86 M130 68 C146 60 164 62 176 68" fill="none" stroke="${l}" stroke-width="2" opacity=".55"/>`;
  }
}

function beardSvg(style, c, skin) {
  const d = dk(c, 0.4), o = dk(c, 0.55);
  switch (style) {
    case 'sombra':
      return `<path d="M102 172 C106 210 124 248 150 254 C176 248 194 210 198 172 C188 196 172 210 150 210 C128 210 112 196 102 172 Z" fill="${c}" opacity=".3"/>`;
    case 'bigode':
      return `<path d="M126 215 C134 207 146 207 150 213 C154 207 166 207 174 215 C168 224 156 221 150 217 C144 221 132 224 126 215 Z" fill="${c}" stroke="${o}" stroke-width="1"/>`;
    case 'guidao':
      return `<path d="M124 216 C134 206 146 207 150 213 C154 207 166 206 176 216 C168 223 156 221 150 218 C144 221 132 223 124 216 Z" fill="${c}" stroke="${o}" stroke-width="1"/><path d="M124 216 C116 216 114 208 117 204 M176 216 C184 216 186 208 183 204" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`;
    case 'cavanhaque':
      return `<path d="M126 215 C134 207 146 207 150 213 C154 207 166 207 174 215 C168 224 156 221 150 217 C144 221 132 224 126 215 Z" fill="${c}" stroke="${o}" stroke-width="1"/><path d="M137 238 C143 231 157 231 163 238 C163 254 137 254 137 238 Z" fill="${c}" stroke="${o}" stroke-width="1"/>`;
    case 'cheia':
      return `<path d="M96 168 C98 214 120 256 150 260 C180 256 202 214 204 168 C196 196 184 212 170 218 C160 212 140 212 130 218 C116 212 104 196 96 168 Z" fill="${c}" stroke="${o}" stroke-width="1.4"/><path d="M204 168 C202 214 180 256 150 260 C186 254 198 226 198 196 C198 186 200 176 204 168 Z" fill="${d}" opacity=".45"/><path d="M112 206 C120 226 132 242 146 250 M188 206 C180 226 168 242 154 250" fill="none" stroke="${lt(c, 0.25)}" stroke-width="2" opacity=".35"/>`;
    default:
      return '';
  }
}

function glassesSvg(style) {
  const fr = '#1b1b20', gl = '#a9d3f0';
  const temples = `<path d="M103 150 L90 147 M197 150 L210 147" stroke="${fr}" stroke-width="2.4" stroke-linecap="round"/>`;
  switch (style) {
    case 'redondo':
      return `<circle cx="123" cy="152" r="19" fill="${gl}" fill-opacity=".14" stroke="${fr}" stroke-width="2.8"/><circle cx="177" cy="152" r="19" fill="${gl}" fill-opacity=".14" stroke="${fr}" stroke-width="2.8"/><path d="M141 150 C146 144 154 144 159 150" fill="none" stroke="${fr}" stroke-width="2.6"/><path d="M112 142 C116 139 120 138 124 139" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/><path d="M166 142 C170 139 174 138 178 139" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>` + temples;
    case 'retangular':
      return `<rect x="100" y="138" width="45" height="29" rx="6" fill="${gl}" fill-opacity=".13" stroke="${fr}" stroke-width="2.8"/><rect x="155" y="138" width="45" height="29" rx="6" fill="${gl}" fill-opacity=".13" stroke="${fr}" stroke-width="2.8"/><path d="M145 148 L155 148" stroke="${fr}" stroke-width="2.6"/><path d="M106 144 L118 143" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/><path d="M161 144 L173 143" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>` + temples;
    case 'escuro':
      return `<path d="M99 139 L146 139 L144 164 C140 170 108 170 103 164 Z" fill="#0c0d11" stroke="${fr}" stroke-width="2.6" stroke-linejoin="round"/><path d="M154 139 L201 139 L197 164 C192 170 160 170 156 164 Z" fill="#0c0d11" stroke="${fr}" stroke-width="2.6" stroke-linejoin="round"/><path d="M146 143 L154 143" stroke="${fr}" stroke-width="4"/><path d="M106 145 L128 144 M161 145 L183 144" stroke="#fff" stroke-width="2.4" opacity=".28" stroke-linecap="round"/>` + temples;
    case 'aviador':
      return `<path d="M100 141 C116 136 140 137 146 145 C146 164 134 174 120 174 C106 172 99 158 100 141 Z" fill="#14161c" fill-opacity=".86" stroke="#b8963e" stroke-width="2.4"/><path d="M200 141 C184 136 160 137 154 145 C154 164 166 174 180 174 C194 172 201 158 200 141 Z" fill="#14161c" fill-opacity=".86" stroke="#b8963e" stroke-width="2.4"/><path d="M146 143 C149 140 151 140 154 143" fill="none" stroke="#b8963e" stroke-width="2.4"/><path d="M108 146 C114 143 124 142 132 143 M168 143 C176 142 186 143 192 146" fill="none" stroke="#fff" stroke-width="2.2" opacity=".25" stroke-linecap="round"/><path d="M100 146 L90 144 M200 146 L210 144" stroke="#b8963e" stroke-width="2.2" stroke-linecap="round"/>`;
    case 'monoculo':
      return `<circle cx="177" cy="152" r="19" fill="${gl}" fill-opacity=".14" stroke="#c9a33e" stroke-width="2.6"/><path d="M190 168 C200 184 198 210 190 238" fill="none" stroke="#c9a33e" stroke-width="1.8" stroke-dasharray="3 2.4"/><path d="M168 142 C172 139 176 138 180 139" fill="none" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`;
    default:
      return '';
  }
}

function scarSvg(style) {
  const r = '#8f2f2f', r2 = '#c26a63';
  if (style === 'bochecha') return `<path d="M107 166 L133 214" stroke="${r}" stroke-width="3.2" stroke-linecap="round"/><path d="M107 166 L133 214" stroke="${r2}" stroke-width="1" opacity=".7" stroke-linecap="round"/><path d="M112 168 L118 164 M116 177 L123 173 M121 186 L128 182 M126 195 L133 191 M130 204 L137 200" stroke="${r}" stroke-width="1.6" stroke-linecap="round"/>`;
  if (style === 'sobrancelha') return `<path d="M111 116 L131 146" stroke="${r}" stroke-width="3" stroke-linecap="round"/><path d="M111 116 L131 146" stroke="${r2}" stroke-width="1" opacity=".7" stroke-linecap="round"/><path d="M114 123 L120 119 M119 131 L126 127 M124 139 L131 135" stroke="${r}" stroke-width="1.5" stroke-linecap="round"/>`;
  return '';
}

function hatSvg(style, suit) {
  if (style === 'fedora') return `<path d="M62 86 C80 66 220 66 238 86 C220 104 80 104 62 86 Z" fill="#17171c" stroke="#000" stroke-width="1.5"/><path d="M96 82 C96 34 112 20 150 20 C188 20 204 34 204 82 C180 72 120 72 96 82 Z" fill="#212128" stroke="#000" stroke-width="1.5"/><path d="M96 80 C120 72 180 72 204 80 L204 70 C180 62 120 62 96 70 Z" fill="#7a1f24"/><path d="M204 82 C206 40 192 22 160 20 C190 30 198 52 196 76 Z" fill="#000" opacity=".28"/><path d="M110 40 C122 28 150 24 168 28" fill="none" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/><path d="M64 88 C90 104 210 104 236 88" fill="none" stroke="#fff" stroke-width="1.4" opacity=".14"/>`;
  if (style === 'boina') return `<path d="M92 92 C86 56 118 36 150 36 C186 36 214 56 208 92 C196 98 104 98 92 92 Z" fill="#3a3f4a" stroke="#000" stroke-width="1.5"/><path d="M96 90 C86 98 92 106 112 108 C140 112 180 110 204 104 C214 100 214 92 206 90 Z" fill="#23262e" stroke="#000" stroke-width="1.5"/><circle cx="150" cy="38" r="4" fill="#23262e"/><path d="M208 92 C214 56 190 36 160 36 C192 46 202 70 198 92 Z" fill="#000" opacity=".25"/><path d="M110 60 C124 48 150 44 172 48" fill="none" stroke="#fff" stroke-width="2" opacity=".16" stroke-linecap="round"/>`;
  if (style === 'coco') return `<path d="M66 90 C84 76 216 76 234 90 C216 104 84 104 66 90 Z" fill="#17171c" stroke="#000" stroke-width="1.5"/><path d="M104 86 C98 30 126 18 150 18 C174 18 202 30 196 86 Z" fill="#212128" stroke="#000" stroke-width="1.5"/><path d="M103 84 C130 92 170 92 197 84 L196 74 C170 82 130 82 104 74 Z" fill="#c9a33e"/><path d="M196 86 C202 34 182 18 160 18 C186 28 190 56 188 84 Z" fill="#000" opacity=".28"/><path d="M118 40 C128 28 146 24 162 26" fill="none" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/>`;
  return '';
}

function face(P, uid) {
  const skin = P.skin, sh = dk(skin, 0.22), line = dk(skin, 0.55), eyeC = P.eyeColor, hc = P.hairColor;
  const browC = dk(hc, 0.12);
  const E = EYES[P.eyes] || EYES.amendoado;
  const eye = side => {
    const tx = side === 'L' ? 'translate(123 152) scale(1.18)' : 'translate(177 152) scale(-1.18 1.18)';
    return `<g transform="${tx}"><ellipse cx="0" cy="-8" rx="23" ry="9" fill="${dk(skin, 0.35)}" opacity=".22"/><path d="${E.s}" fill="#f6f2ea"/><g clip-path="url(#ec${uid}${side})"><circle cx="0" cy="${E.y}" r="${E.r}" fill="${eyeC}"/><circle cx="0" cy="${E.y}" r="${E.r}" fill="none" stroke="${dk(eyeC, 0.55)}" stroke-width="1.6"/><circle cx="0" cy="${E.y}" r="${E.r * 0.52}" fill="${dk(eyeC, 0.78)}"/><circle cx="${-E.r * 0.32}" cy="${E.y - E.r * 0.34}" r="${Math.max(1.5, E.r * 0.22)}" fill="#fff" opacity=".95"/></g>${E.lid ? `<path d="${E.lid}" fill="${dk(skin, 0.12)}" stroke="${line}" stroke-width="1"/>` : ''}<path d="${E.t}" fill="none" stroke="${dk(skin, 0.82)}" stroke-width="2.6" stroke-linecap="round"/><path d="${E.f}" fill="none" stroke="${dk(skin, 0.45)}" stroke-width="1.3" opacity=".6" stroke-linecap="round"/><path d="M-14 5 C-6 9 6 9 14 5" fill="none" stroke="${dk(skin, 0.4)}" stroke-width="1" opacity=".4"/></g>`;
  };
  const brow = side => {
    const B = BROWS[P.brows] || BROWS.grossa;
    const tx = side === 'L' ? 'translate(119 129) scale(1.0)' : 'translate(181 129) scale(-1 1)';
    return `<g transform="${tx}"><path d="${B[0]}" fill="none" stroke="${browC}" stroke-width="${B[1]}" stroke-linecap="round" opacity=".95"/></g>`;
  };
  const patch = P.patch ? `<path d="M96 132 L106 146 M140 144 L206 114" fill="none" stroke="#0b0b0d" stroke-width="2.4" stroke-linecap="round"/><path d="M104 152 C106 136 138 136 142 152 C140 168 108 168 104 152 Z" fill="#0b0b0d" stroke="#2a2a30" stroke-width="1.2"/>` : '';
  const cigar = P.cigar ? `<path d="M168 226 L224 212" stroke="#5e381c" stroke-width="8" stroke-linecap="round"/><path d="M168 226 L224 212" stroke="#8a5a30" stroke-width="2" opacity=".6" stroke-linecap="round" transform="translate(0 -2)"/><path d="M188 221 L193 220" stroke="#c9a33e" stroke-width="8"/><circle cx="225" cy="212" r="4.6" fill="#ff7a2e"/><circle cx="226" cy="211" r="2.2" fill="#ffd08a"/><path d="M228 204 C238 194 222 186 232 174 C238 166 230 160 236 152" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>` : '';
  const earring = P.earring ? `<circle cx="86" cy="190" r="6.5" fill="none" stroke="#d4af37" stroke-width="2.6"/>` : '';
  const chain = P.chain ? `<path d="M120 296 C132 326 168 326 180 296" fill="none" stroke="#d4af37" stroke-width="3.6" stroke-dasharray="5 2.4" stroke-linecap="round"/>` : '';
  const suit = P.suit, suitD = dk(suit, 0.35), suitL = lt(suit, 0.16);
  const headPath = 'M150 56 C104 56 89 98 89 150 C89 194 103 230 129 250 C140 260 160 260 171 250 C197 230 211 194 211 150 C211 98 196 56 150 56 Z';
  return `<svg viewBox="0 0 300 360" width="100%" role="img" aria-label="Personagem">
<defs><clipPath id="hd${uid}"><path d="${headPath}"/></clipPath>
<clipPath id="ecL${uid}"><path d="${E.s}"/></clipPath>
<clipPath id="ecR${uid}"><path d="${E.s}"/></clipPath></defs>
<rect width="300" height="360" rx="14" fill="#14161c"/>
<circle cx="150" cy="170" r="150" fill="${lt('#14161c', 0.07)}"/>
<g transform="translate(150 150) scale(1.12 .96) translate(-150 -150)">${hairBack(P.hair, hc)}</g>
<path d="M121 222 L121 286 C121 300 179 300 179 286 L179 222 Z" fill="${dk(skin, 0.1)}" stroke="${line}" stroke-width="1.4"/>
<path d="M121 246 C138 272 162 272 179 246 L179 222 L121 222 Z" fill="${dk(skin, 0.42)}" opacity=".5"/>
<path d="M0 360 L6 318 C28 294 98 282 124 272 L150 326 L176 272 C202 282 272 294 294 318 L300 360 Z" fill="${suit}" stroke="${suitD}" stroke-width="1.5"/>
<path d="M124 272 L150 332 L176 272 L170 258 L150 282 L130 258 Z" fill="#ece8df" stroke="${dk('#ece8df', 0.4)}" stroke-width="1"/>
<path d="M124 272 L150 332 L104 352 L84 298 Z" fill="${suitL}" stroke="${suitD}" stroke-width="1.2"/>
<path d="M176 272 L150 332 L196 352 L216 298 Z" fill="${suitD}" stroke="${suitD}" stroke-width="1.2"/>
<path d="M146 286 L154 286 L158 336 L150 348 L142 336 Z" fill="${P.tie || '#8c2a2f'}" stroke="${dk(P.tie || '#8c2a2f', 0.5)}" stroke-width="1"/>
<path d="M294 318 L300 360 L250 360 C262 340 274 328 294 318 Z" fill="#000" opacity=".22"/>
${chain}
<g transform="translate(150 150) scale(1.12 .96) translate(-150 -150)">
<g>${earSvg(P.ears, skin)}</g>
<g transform="translate(300 0) scale(-1 1)">${earSvg(P.ears, dk(skin, 0.06))}</g>
${earring}
<path d="${headPath}" fill="${skin}" stroke="${line}" stroke-width="1.8"/>
<g clip-path="url(#hd${uid})"><path d="M180 50 C204 96 196 190 170 262 L260 270 L260 40 Z" fill="${dk(skin, 0.5)}" opacity=".3"/><path d="M96 190 C112 226 130 246 150 252 C130 238 112 216 100 186 Z" fill="${dk(skin, 0.5)}" opacity=".16"/><ellipse cx="150" cy="96" rx="30" ry="12" fill="${lt(skin, 0.5)}" opacity=".2"/></g>
${eye('L')}${eye('R')}${patch}
${brow('L')}${brow('R')}
<g transform="translate(150 205) scale(1.16) translate(-150 -205)">${noseSvg(P.nose, skin)}</g>
${beardSvg(P.beard, hc, skin)}
<g transform="translate(150 226) scale(1.14) translate(-150 -226)">${mouthSvg(P.mouth, skin)}</g>
${cigar}
${hairFront(P.hair, hc)}
${P.hair === 'careca' ? `<ellipse cx="146" cy="80" rx="26" ry="11" fill="#fff" opacity=".2"/>` : ''}
${glassesSvg(P.glasses)}
${scarSvg(P.scar)}
${hatSvg(P.hat, suit)}
</g>
</svg>`;
}

if (typeof window !== 'undefined') window.__face = face;
