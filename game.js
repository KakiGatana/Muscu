/* Entraînement — l'aventure : niveaux, zones, monstres et rendu pixel art (canvas, aucune image) */
(function () {
  'use strict';
  const W = 192, H = 108, GY = 86, HX = 40;

  /* ---------- règles ---------- */
  // XP cumulée pour atteindre le niveau l (niveau 5 ≈ 5 séances, niveau 10 ≈ 1 mois, niveau 50 ≈ 1 an)
  const need = l => l <= 1 ? 0 : Math.round(60 * Math.pow(l - 1, 1.6));
  const levelOf = xp => { let l = 1; while (need(l + 1) <= xp) l++; return l; };
  const streakMult = s => Math.min(2.5, 1 + 0.25 * Math.max(0, s - 1));
  // 3 XP par série validée, 2 par échauffement, +15 si la séance est complète, +5 par record ; le tout × la série en cours
  function sessionXp(o) {
    const base = o.sets * 3 + o.warm * 2 + (o.full ? 15 : 0) + o.records * 5, mult = streakMult(o.streak);
    return { base, mult, xp: Math.round(base * mult) };
  }
  const TIERS = [
    { l: 1, t: 'Paysan', g: 'Tunique de lin, chapeau de paille, fourche' },
    { l: 5, t: 'Milicien', g: 'Gilet de cuir, dague' },
    { l: 10, t: 'Aventurier', g: 'Cape de voyage, épée courte' },
    { l: 15, t: 'Guerrier', g: 'Cotte de mailles, casque, bouclier' },
    { l: 20, t: 'Chevalier', g: 'Armure de plates, épée longue' },
    { l: 30, t: 'Champion', g: 'Armure dorée, cape écarlate' },
    { l: 40, t: 'Héros', g: 'Armure de nuit, lame runique' },
    { l: 50, t: 'Légende', g: 'Armure blanche, lame solaire, aura' }
  ];
  const ZONES = [
    { l: 1, n: 'La campagne', m: [
      { n: 'Rat des champs', l: 2, s: 'quad', sc: 1, p: { a: '#8c7b6b', b: '#c9a0a0', e: '#111', n: '#e7b0b0' } },
      { n: 'Sanglier', l: 3, s: 'quad', sc: 2, p: { a: '#5e4634', b: '#5e4634', e: '#f2e9d8', n: '#f2e9d8' } },
      { n: 'Loup', l: 4, s: 'quad', sc: 2, p: { a: '#7c828a', b: '#5d636b', e: '#ffd84a', n: '#fff' } }] },
    { l: 5, n: 'La ville', m: [
      { n: 'Voleur', l: 6, s: 'human', sc: 2, p: { h: '#2b2b33', s: '#d9a57c', e: '#111', b: '#3a3a46', w: '#b9c0c7', l: '#26262e' } },
      { n: 'Brute', l: 8, s: 'human', sc: 2, p: { h: '#7a3b22', s: '#c98f66', e: '#111', b: '#6b3a2a', w: '#6b4a2b', l: '#3a2c22' } },
      { n: 'Chef des bandits', l: 9, s: 'human', sc: 3, p: { h: '#111', s: '#d9a57c', e: '#c0392b', b: '#7a1f2a', w: '#d7dde3', l: '#1c1c22' } }] },
    { l: 10, n: 'Les égouts', m: [
      { n: 'Slime', l: 11, s: 'slime', sc: 2, p: { a: '#57b96a', A: '#a6e8b0', e: '#12301a', m: '#2f7a40' } },
      { n: 'Rat géant', l: 12, s: 'quad', sc: 3, p: { a: '#6a5f58', b: '#b98a8a', e: '#ff4a4a', n: '#e7b0b0' } },
      { n: 'Crocodile', l: 14, s: 'quad', sc: 3, p: { a: '#3f6b3a', b: '#2f5230', e: '#ffd84a', n: '#fff' } }] },
    { l: 15, n: 'La forêt sombre', m: [
      { n: 'Gobelin', l: 16, s: 'human', sc: 2, p: { h: '#5f8a3a', s: '#7fae4a', e: '#ffd84a', b: '#6b4a2b', w: '#9aa0a6', l: '#3a2c22' } },
      { n: 'Araignée géante', l: 18, s: 'spider', sc: 3, p: { a: '#2a2230', e: '#ff3b3b', l: '#40334a' } },
      { n: 'Troll', l: 19, s: 'golem', sc: 3, p: { a: '#5c7a4a', A: '#4a653c', e: '#ffd84a' } }] },
    { l: 20, n: 'Les mines', m: [
      { n: 'Chauve-souris', l: 22, s: 'bat', sc: 2, fly: 1, p: { a: '#3b2f45', e: '#ff4a4a', w: '#55456a' } },
      { n: 'Squelette', l: 25, s: 'human', sc: 2, p: { h: '#e9e6da', s: '#e9e6da', e: '#111', b: '#cfcabb', w: '#9aa0a6', l: '#cfcabb' } },
      { n: 'Golem de pierre', l: 29, s: 'golem', sc: 3, p: { a: '#7a7672', A: '#5c5955', e: '#6fe3ff' } }] },
    { l: 30, n: 'Les cimes', m: [
      { n: 'Orc', l: 32, s: 'human', sc: 3, p: { h: '#2f4a2a', s: '#5f8a4a', e: '#ff4a4a', b: '#4a3a2a', w: '#8a8f96', l: '#2e241b' } },
      { n: 'Harpie', l: 35, s: 'bat', sc: 3, fly: 1, p: { a: '#c9a27c', e: '#111', w: '#7a5a8a' } },
      { n: 'Yéti', l: 39, s: 'golem', sc: 3, p: { a: '#eef3f7', A: '#c9d6e0', e: '#3a8fd9' } }] },
    { l: 40, n: 'Le volcan', m: [
      { n: 'Diablotin', l: 42, s: 'human', sc: 2, p: { h: '#7a1410', s: '#c0392b', e: '#ffd84a', b: '#8a1f18', w: '#2a1210', l: '#5a120e' } },
      { n: 'Salamandre', l: 45, s: 'quad', sc: 3, p: { a: '#e0621a', b: '#ffb04a', e: '#111', n: '#ffe08a' } },
      { n: 'Démon', l: 49, s: 'golem', sc: 4, p: { a: '#6b1512', A: '#3a0c0a', e: '#ffd84a' } }] },
    { l: 50, n: 'La citadelle', m: [
      { n: 'Chevalier noir', l: 52, s: 'human', sc: 3, p: { h: '#1c1c26', s: '#2a2a38', e: '#ff3b3b', b: '#22222e', w: '#c3c9cf', l: '#16161e' } },
      { n: 'Liche', l: 56, s: 'human', sc: 3, p: { h: '#4a2a6b', s: '#d8e6d0', e: '#7fe7ff', b: '#3a2055', w: '#7fe7ff', l: '#2a1740' } },
      { n: 'Dragon', l: 60, s: 'dragon', sc: 4, p: { a: '#8a1f1f', A: '#d9a441', e: '#ffd84a', f: '#ff8a2a', w: '#5a1414' } }] }
  ];
  const idx = (arr, l) => { let i = 0; arr.forEach((t, k) => { if (l >= t.l) i = k; }); return i; };
  const tierIdx = l => idx(TIERS, l), zoneIdx = l => idx(ZONES, l);

  /* ---------- sprites (les monstres regardent vers la gauche) ---------- */
  const SHAPES = {
    quad: ['a.a...........', 'aaaa.......b..', 'aeaaaaaaaaaab.', 'aaaaaaaaaaaaa.', '.naaaaaaaaaaa.', '..aaaaaaaaaaa.', '..a.a....a.a..', '..a.a....a.a..'],
    human: ['..hhhh..', '.hhhhhh.', '.seesss.', '.ssssss.', '..bbbb..', 'wbbbbbb.', 'wbbbbbbs', 'w.bbbb..', '..bbbb..', '..l..l..', '..l..l..', '.ll.ll..'],
    slime: ['...aaaa...', '..aAAaaa..', '.aaAaaaaa.', '.aeaaeaaa.', 'aaaaaaaaaa', 'aaaammaaaa', '.aaaaaaaa.'],
    spider: ['.l..l..l..l.', 'l.l.aaaa.l.l', 'l..aaaaaa..l', '.eaeaaaaaa..', 'l..aaaaaa..l', 'l.l.aaaa.l.l', '.l..l..l..l.'],
    bat: ['w............w', 'ww....aa....ww', 'www..aeea..www', 'wwwwaaaaaawwww', '.wwwwaaaawwww.', '..ww..aa..ww..', '......a.a.....'],
    golem: ['...aaaa...', '..aeaaea..', '..aaaaaa..', 'aaaaaaaaaa', 'aaAAaaAAaa', 'aaaaaaaaaa', 'aa.aaaa.aa', 'aa.aaaa.aa', 'aa.aaaa.aa', '...aa.aa..', '...aa.aa..', '..aaa.aaa.'],
    dragon: ['..............w...', '.aa..........www..', 'aeaa........wwwww.', 'aaaaa......wwwwww.', 'ffaaaa...aaaawwww.', '..aaaaaaaaaaaaww..', '...aaaaaaaaaaaaa..', '...aaaAAAAAaaaaaa.', '....aaAAAAAaaa.aaa', '....aa.aa..aa...aa', '....aa.aa..aa....a', '...aaa.aaa.aaa....']
  };
  const HB = ['...hhhh...', '..hhhhhh..', '..hsssss..', '..hssese..', '..ssssss..', '...tttt...', '.atttttta.', '.atttttta.', '.sbbbbbbs.', '..pppppp..'];
  const LEGS = [['..pp..pp..', '..pp..pp..', '..oo..ooo.'], ['..pppppp..', '...pppp...', '...oooo...']];
  const SKIN = '#e8b98a', EYE = '#2a1c12';
  const HP = [
    { h: '#d9b44a', hat: 1, t: '#b8a27a', a: '#b8a27a', b: '#5a3d22', p: '#6b5a45', o: '#3b2a1a', w: { k: 'fork' } },
    { h: '#5a3a22', t: '#8a5a2e', a: '#a9773f', b: '#3b2a1a', p: '#4d4a46', o: '#2a2019', w: { len: 3, c: '#b9c0c7' } },
    { h: '#5a3a22', t: '#3f7a4a', a: '#3f7a4a', b: '#c8a04a', p: '#5a4632', o: '#2a2019', cape: '#8a2f2f', w: { len: 5, c: '#c9d0d6' } },
    { h: '#9aa0a6', t: '#7d858c', a: '#7d858c', b: '#5a3d22', p: '#4d4a46', o: '#3a3a3a', shield: '#3b5f8a', w: { len: 6, c: '#d7dde3' } },
    { h: '#c3c9cf', plume: '#c0392b', t: '#c3c9cf', a: '#aab1b8', b: '#6b7178', p: '#aab1b8', o: '#6b7178', shield: '#c3c9cf', w: { len: 7, c: '#eef1f4' } },
    { h: '#e0b04a', plume: '#fff', t: '#e0b04a', a: '#c8963a', b: '#8a2f2f', p: '#c8963a', o: '#7a5a22', cape: '#a82828', shield: '#e0b04a', w: { len: 7, c: '#f1f4f7' } },
    { h: '#2f3f6b', plume: '#7fe7ff', t: '#2f3f6b', a: '#3d5290', b: '#e0b04a', p: '#26335a', o: '#1a2340', cape: '#1a2340', w: { len: 8, c: '#7fe7ff', glow: 1 } },
    { h: '#f4f1e6', plume: '#ffd76a', t: '#f4f1e6', a: '#e0b04a', b: '#ffd76a', p: '#f4f1e6', o: '#e0b04a', cape: '#ffd76a', aura: 1, w: { len: 9, c: '#fff3b0', glow: 1 } }
  ].map(p => Object.assign({ s: SKIN, e: EYE }, p));

  let g = null;
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const hash = n => { n = Math.sin(n * 127.1 + 3.7) * 43758.5453; return n - Math.floor(n); };
  function spr(rows, pal, x, y, sc) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const c = pal[rows[j][i]]; if (c) { g.fillStyle = c; g.fillRect(x + i * sc, y + j * sc, sc, sc); } }
  }
  function drawHero(x, y, sc, tier, frame, atk, t) {
    const P = HP[tier], w = P.w, hx = x + 9 * sc;
    if (P.aura) for (let k = 0; k < 7; k++) { const q = k + Math.floor(t * 5) * 13; R('#ffd76a', x - 3 * sc + hash(q) * 16 * sc, y - 3 * sc + hash(q + 5) * 16 * sc, sc / 2, sc / 2); }
    if (P.cape) { R(P.cape, x + sc, y + 5 * sc, sc, 6 * sc); R(P.cape, x, y + 7 * sc, sc, (frame ? 4 : 5) * sc); }
    spr(HB.concat(LEGS[frame]), P, x, y, sc);
    if (P.hat) R(P.h, x + sc, y + sc, 8 * sc, sc);
    if (P.plume) { R(P.plume, x + 3 * sc, y - 2 * sc, sc, 2 * sc); R(P.plume, x + 2 * sc, y - 2 * sc, sc, sc); }
    if (P.shield) { R(P.shield, x - sc, y + 6 * sc, 3 * sc, 4 * sc); R('rgba(255,255,255,.35)', x, y + 7 * sc, sc, sc); R('rgba(0,0,0,.3)', x - sc, y + 9 * sc, 3 * sc, sc); }
    if (w.k === 'fork') {
      if (atk) { R('#8a6a3f', x + 6 * sc, y + 7 * sc, 9 * sc, sc); R('#9aa0a6', x + 15 * sc, y + 6 * sc, sc, 3 * sc); R('#9aa0a6', x + 16 * sc, y + 6 * sc, sc, sc); R('#9aa0a6', x + 16 * sc, y + 8 * sc, sc, sc); R('#9aa0a6', x + 16 * sc, y + 7 * sc, sc, sc); }
      else { R('#8a6a3f', hx, y - sc, sc, 13 * sc); R('#9aa0a6', hx - sc, y - 2 * sc, 3 * sc, sc); R('#9aa0a6', hx - sc, y - 3 * sc, sc, sc); R('#9aa0a6', hx + sc, y - 3 * sc, sc, sc); R('#9aa0a6', hx, y - 3 * sc, sc, sc); }
      return;
    }
    if (atk) {
      if (w.glow) { g.globalAlpha = .3; R(w.c, hx + 2 * sc, y + 6 * sc, w.len * sc, 3 * sc); g.globalAlpha = 1; }
      R('#3b2a1a', hx, y + 7 * sc, sc, sc); R('#c8a04a', hx + sc, y + 6 * sc, sc, 3 * sc); R(w.c, hx + 2 * sc, y + 7 * sc, w.len * sc, sc);
    } else {
      if (w.glow) { g.globalAlpha = .3; R(w.c, hx - sc, y + (6 - w.len) * sc, 3 * sc, w.len * sc); g.globalAlpha = 1; }
      R('#3b2a1a', hx, y + 7 * sc, sc, 2 * sc); R('#c8a04a', hx - sc, y + 6 * sc, 3 * sc, sc); R(w.c, hx, y + (6 - w.len) * sc, sc, w.len * sc);
    }
  }

  /* ---------- décors ---------- */
  function sky(cols) { const h = Math.ceil(GY / cols.length); cols.forEach((c, i) => R(c, 0, i * h, W, h)); }
  function ridge(sx, par, base, amp, f, col) { g.fillStyle = col; for (let x = 0; x < W; x++) { const wx = x + sx * par, y = Math.round(base + Math.sin(wx / f) * amp + Math.sin(wx / (f * .37)) * amp * .4); g.fillRect(x, y, 1, GY - y); } }
  function each(sx, par, step, fn, reg) { const off = sx * par, k0 = Math.floor(off / step) - 2, n = Math.ceil(W / step) + 4; for (let k = k0; k < k0 + n; k++) fn(Math.round(k * step + (reg ? 0 : hash(k) * step * .5) - off), k); }
  function ground(sx, col, top, speck) { R(col, 0, GY, W, H - GY); R(top, 0, GY, W, 2); each(sx, 1, 11, (x, k) => R(speck, x, GY + 5 + (hash(k + 3) * 14 | 0), 3, 1)); }
  function tri(cx, h, slope, col, snow) { for (let i = 0; i < h; i++) { const w = Math.round(i * slope); R(snow && i < h * .3 ? snow : col, cx - w, GY - h + i, w * 2 + 1, 1); } }
  const BG = [
    (sx, t) => { // campagne
      sky(['#86bfe0', '#a5d3ea', '#cfe8e0']); R('#fff1b8', 150, 10, 10, 10); R('#fff8d8', 152, 12, 6, 6);
      each(sx + t * 30, .1, 76, (x, k) => { const y = 10 + (hash(k) * 16 | 0); R('#fff', x, y, 22, 4); R('#fff', x + 5, y - 3, 11, 3); });
      ridge(sx, .2, 60, 5, 31, '#7fae6a'); ridge(sx, .4, 68, 4, 19, '#5f9450');
      each(sx, .7, 66, (x, k) => { if (k % 2) { R('#5a3d22', x + 4, GY - 12, 3, 12); R('#3f7a3a', x - 1, GY - 22, 13, 11); R('#56984c', x + 1, GY - 21, 6, 4); } else { R('#d9b44a', x, GY - 8, 12, 8); R('#e8c865', x + 2, GY - 10, 8, 2); R('#b8923a', x, GY - 3, 12, 1); } });
      R('#8a6a3f', 0, GY - 5, W, 1); each(sx, 1, 14, x => R('#8a6a3f', x, GY - 7, 1, 7), 1);
      ground(sx, '#5d8a3d', '#7fb04f', '#4c7532');
    },
    (sx, t) => { // ville
      sky(['#2c2a4a', '#5b4368', '#b06a5e', '#e09a6a']);
      each(sx, .25, 26, (x, k) => { const h = 22 + (hash(k) * 22 | 0); R('#231f33', x, GY - h, 22, h); for (let r = 0; r < 3; r++) if (hash(k * 7 + r) > .45) R('#ffd76a', x + 4 + r * 6, GY - h + 5 + (hash(k + r) * 8 | 0), 2, 3); });
      each(sx, .6, 52, (x, k) => { const h = 30 + (hash(k + 3) * 12 | 0); R('#3a3348', x, GY - h, 40, h); R('#5a3a3a', x - 2, GY - h - 3, 44, 3); R('#221c2a', x + 16, GY - 11, 7, 11); R(hash(k) > .4 ? '#ffd76a' : '#2a2438', x + 5, GY - h + 7, 5, 6); R('#ffd76a', x + 29, GY - h + 7, 5, 6); }, 1);
      each(sx, 1, 74, x => { R('#15131c', x, GY - 24, 1, 24); R('#ffe9a0', x - 1, GY - 26, 3, 3); g.globalAlpha = .12; R('#ffe9a0', x - 6, GY - 31, 13, 13); g.globalAlpha = 1; }, 1);
      ground(sx, '#4b4756', '#625d70', '#3a3644');
    },
    (sx, t) => { // égouts
      R('#22302b', 0, 0, W, GY);
      for (let y = 0; y < GY; y += 8) { R('#1a2521', 0, y, W, 1); const o = ((y / 8) % 2 * 8 - sx * .5) % 16; for (let x = o - 16; x < W; x += 16) R('#1a2521', x, y, 1, 8); }
      each(sx, .5, 96, (x, k) => { R('#55665e', x - 2, 26, 30, 30); R('#0f1512', x, 28, 26, 26); R('#2f6a58', x + 8, 50, 10, 4); R('#4fa58a', x + 12, 54 + ((t * 40 + k * 13) % 30), 1, 3); }, 1);
      R('#3a4a44', 0, 10, W, 4); R('#2c3a35', 0, 14, W, 1);
      R('#24483c', 0, GY, W, H - GY); R('#3d7a65', 0, GY, W, 2);
      each(sx, 1, 13, (x, k) => R('#5fb89a', x + Math.sin(t * 2 + k) * 2, GY + 5 + (hash(k) * 14 | 0), 4, 1));
    },
    (sx, t) => { // forêt
      sky(['#10201a', '#17301f', '#214229']);
      each(sx, .3, 22, (x, k) => R('#162a1c', x, 0, 5 + (hash(k) * 4 | 0), GY));
      each(sx, .6, 46, x => { R('#2a1f15', x, 0, 9, GY); R('#3a2c1e', x + 2, 0, 1, GY); R('#1d150e', x + 7, 0, 2, GY); });
      R('#0c1812', 0, 0, W, 10); each(sx, .6, 14, (x, k) => R('#143021', x, 10, 7, 3 + (hash(k) * 6 | 0)), 1);
      each(sx, .8, 37, (x, k) => { if (Math.sin(t * 3 + k * 2.1) > .2) R('#d8ff8a', x, 34 + (hash(k) * 36 | 0), 1, 1); });
      each(sx, 1, 58, x => { R('#e9e2d0', x + 2, GY - 4, 1, 4); R('#c0392b', x, GY - 6, 5, 2); });
      ground(sx, '#2b4423', '#3d6130', '#1f331a');
    },
    (sx, t) => { // mines
      R('#19171d', 0, 0, W, GY);
      each(sx, .4, 13, (x, k) => R('#221f27', x, hash(k + 1) * GY, 5, 3));
      each(sx, .8, 84, x => { R('#5a4026', x, 18, 4, GY - 18); R('#5a4026', x + 44, 18, 4, GY - 18); R('#6b4d2e', x - 4, 14, 56, 5); R('#ffb84a', x + 23, 19, 2, 4); g.globalAlpha = .1 + Math.sin(t * 9) * .02; R('#ffb84a', x + 14, 12, 20, 20); g.globalAlpha = 1; }, 1);
      each(sx, .8, 53, x => { R('#6fe3ff', x, GY - 7, 2, 7); R('#3aa7c9', x + 2, GY - 4, 2, 4); R('#3aa7c9', x - 2, GY - 3, 2, 3); });
      R('#35302c', 0, GY, W, H - GY); R('#4a443e', 0, GY, W, 2);
      each(sx, 1, 10, x => R('#4a3824', x, GY + 4, 3, 4), 1); R('#8a8a92', 0, GY + 5, W, 1);
      each(sx, 1, 11, (x, k) => R('#28241f', x, GY + 12 + (hash(k) * 8 | 0), 3, 1));
    },
    (sx, t) => { // cimes
      sky(['#7fa6cf', '#a9c6e2', '#dbe8f2']);
      each(sx, .15, 62, (x, k) => tri(x, 34 + (hash(k) * 22 | 0), .9, '#8a9bb3', '#fff'));
      each(sx, .35, 90, (x, k) => tri(x, 22 + (hash(k + 4) * 10 | 0), 1.3, '#6c7d96', '#eef3f7'));
      each(sx, .8, 50, x => { R('#3a2a1c', x + 5, GY - 4, 2, 4); R('#23483a', x, GY - 8, 11, 4); R('#23483a', x + 2, GY - 12, 7, 4); R('#23483a', x + 4, GY - 16, 3, 4); R('#fff', x + 4, GY - 16, 3, 1); R('#fff', x + 2, GY - 12, 3, 1); });
      ground(sx, '#dfe8ef', '#ffffff', '#b9c8d6');
      for (let i = 0; i < 26; i++) R('#fff', (hash(i) * W + t * 8 * (1 + hash(i + 5))) % W, (hash(i + 2) * GY + t * 18) % GY, 1, 1);
    },
    (sx, t) => { // volcan
      sky(['#160a0a', '#3a100d', '#7a2412', '#c4501c']);
      each(sx, .1, 170, x => { tri(x, 52, 1.1, '#2a1210'); R('#ff8a2a', x - 3, GY - 52, 7, 3); R('#ff5a1a', x - 1, GY - 49, 2, 16); R('#ff5a1a', x + 1, GY - 34, 2, 12); }, 1);
      each(sx, .5, 34, (x, k) => { const h = 10 + (hash(k) * 16 | 0); R('#1d0e0c', x, GY - h, 6, h); R('#1d0e0c', x + 6, GY - h * .6, 5, h * .6 + 1); R('#1d0e0c', x - 4, GY - h * .4, 4, h * .4 + 1); });
      R('#2e1611', 0, GY, W, H - GY); R('#4a2018', 0, GY, W, 2);
      g.globalAlpha = .7 + Math.sin(t * 3) * .3; each(sx, 1, 23, (x, k) => R('#ff7a1a', x, GY + 5 + (hash(k) * 12 | 0), 7, 1)); g.globalAlpha = 1;
      for (let i = 0; i < 18; i++) R(i % 3 ? '#ffb04a' : '#ff5a1a', (hash(i) * W + Math.sin(t + i) * 6 + W) % W, GY - ((t * 14 * (1 + hash(i + 9)) + hash(i + 4) * 80) % 84), 1, 1);
    },
    (sx, t) => { // citadelle
      sky(['#0b0b18', '#151530', '#2a2148']);
      for (let i = 0; i < 26; i++) R('#fff', hash(i) * W, hash(i + 50) * 28, 1, 1);
      R('#e9e6ff', 28, 8, 10, 10); R('#151530', 31, 8, 7, 7);
      R('#2a2a3a', 0, 34, W, GY - 34); each(sx, .5, 12, x => R('#2a2a3a', x, 29, 7, 5), 1);
      for (let y = 42; y < GY; y += 9) R('#222231', 0, y, W, 1);
      each(sx, .5, 78, x => { R('#7a1f2a', x, 40, 9, 22); R('#5a1520', x + 3, 62, 3, 3); R('#d9a441', x + 3, 46, 3, 6); R('#5a4026', x + 38, 58, 2, 7); R('#ffb84a', x + 38, 54 + (Math.floor(t * 8) % 2), 2, 4); g.globalAlpha = .12; R('#ffb84a', x + 31, 47, 16, 16); g.globalAlpha = 1; }, 1);
      ground(sx, '#3a3a4a', '#52526a', '#2c2c3a');
    }
  ];

  /* ---------- la scène ---------- */
  let raf = 0, st = null;
  function say(s, txt, cls) { if (s.cap && s.cap.isConnected) { s.cap.textContent = txt; s.cap.className = 'cap ' + (cls || ''); } }
  function pick(s) {
    const ms = ZONES[s.z].m, won = ms.filter(m => m.l <= s.level), next = ms.find(m => m.l > s.level);
    s.n++;
    if (next && (!won.length || s.n % 3 === 0)) return next;
    return won.length ? won[Math.floor(Math.random() * won.length)] : next;
  }
  function update(s, dt) {
    s.time += dt; s.t += dt;
    const m = s.m;
    if (s.phase === 'walk') {
      s.sx += 26 * dt;
      if (s.t > 2.2) { s.m = pick(s); if (!s.m) { s.t = 0; return; } s.mx = W + 4; s.phase = 'approach'; s.t = 0; say(s, s.m.n + ' approche.'); }
    } else if (s.phase === 'approach') {
      s.sx += 12 * dt; s.mx -= 70 * dt;
      if (s.mx <= HX + 36) { s.mx = HX + 36; s.phase = 'fight'; s.t = 0; s.beat = -1; s.win = m.l <= s.level; s.beats = s.win ? 6 : 4; }
    } else if (s.phase === 'fight') {
      const b = Math.floor(s.t / .42);
      if (b !== s.beat) {
        s.beat = b;
        if (b >= s.beats) { s.phase = s.win ? 'win' : 'lose'; s.t = 0; say(s, s.win ? m.n + ' vaincu.' : m.n + ' est trop fort. Niveau ' + m.l + ' requis.', s.win ? 'ok' : 'ko'); }
        else s.sparks.push(b % 2 === 0 ? { x: s.mx + 4, y: GY - 12 - (m.fly ? 12 : 0), t0: s.time + .17 } : { x: HX + 12, y: GY - 14, t0: s.time + .17 });
      }
    } else if (s.phase === 'win') { if (s.t > 1.1) { s.m = null; s.phase = 'walk'; s.t = 0; } }
    else if (s.phase === 'lose') { if (s.t > .5) s.mx += 60 * dt; if (s.t > 2) { s.m = null; s.phase = 'walk'; s.t = 0; } }
    s.sparks = s.sparks.filter(k => s.time < k.t0 + .2);
  }
  function draw(s) {
    g = s.ctx; const m = s.m;
    BG[s.z](s.sx, s.time);
    const walking = s.phase === 'walk' || s.phase === 'approach';
    const fr = walking ? Math.floor(s.time * 6) % 2 : 0;
    let hx = HX, atk = false, mxo = 0, hide = false, mhide = false;
    if (s.phase === 'fight') { const k = (s.t % .42) / .42, lun = Math.sin(k * Math.PI) * 7; if (s.beat % 2 === 0) { hx += lun; atk = k > .2 && k < .85; } else mxo = -lun; }
    if (s.phase === 'win') mhide = Math.floor(s.t * 14) % 2 === 0;
    if (s.phase === 'lose') { hx -= Math.min(1, s.t / .25) * 14 * (1 - Math.max(0, Math.min(1, (s.t - 1.2) / .6))); hide = s.t < 1.1 && Math.floor(s.t * 14) % 2 === 0; }
    if (m && !mhide) {
      const rows = SHAPES[m.s], h = rows.length * m.sc;
      const fly = m.fly ? 12 + Math.round(Math.sin(s.time * 5) * 2) : 0, mb = (!m.fly && s.phase !== 'fight' && Math.floor(s.time * 6) % 2) ? 1 : 0;
      spr(rows, m.p, Math.round(s.mx + mxo), GY - h - fly - mb, m.sc);
    }
    if (!hide) drawHero(Math.round(hx), GY - 26 - (walking && fr ? 1 : 0), 2, s.tier, fr, atk, s.time);
    s.sparks.forEach(k => { if (s.time >= k.t0) { R('#fff', k.x - 3, k.y, 7, 1); R('#fff', k.x, k.y - 3, 1, 7); R('#ffd84a', k.x - 2, k.y - 2, 1, 1); R('#ffd84a', k.x + 2, k.y + 2, 1, 1); R('#ffd84a', k.x + 2, k.y - 2, 1, 1); R('#ffd84a', k.x - 2, k.y + 2, 1, 1); } });
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; st = null; }
  function start(canvas, level, cap) {
    stop();
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const s = st = { canvas, ctx, cap, level, z: zoneIdx(level), tier: tierIdx(level), phase: 'walk', t: 0, time: 0, sx: 0, m: null, mx: 0, sparks: [], n: 0 };
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    const loop = now => {
      if (st !== s || !canvas.isConnected) { if (st === s) stop(); return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!document.hidden) { update(s, dt); draw(s); }
      raf = requestAnimationFrame(loop);
    };
    draw(s);
    if (!still) raf = requestAnimationFrame(loop);
  }
  function portrait(canvas, level) {
    g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, canvas.width, canvas.height);
    drawHero(4, 8, 2, tierIdx(level), 0, false, 0);
  }

  window.RPG = { need, levelOf, streakMult, sessionXp, TIERS, ZONES, tierIdx, zoneIdx, start, stop, portrait, tick: dt => { if (st) { update(st, dt); draw(st); } } };
})();
