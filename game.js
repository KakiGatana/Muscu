/* Entraînement — l'aventure : niveaux, zones, monstres et rendu pixel art (canvas, aucune image) */
(function () {
  'use strict';
  const W = 144, H = 128, GY = 104, HX = 24, MAX = 100;

  /* ---------- règles ---------- */
  // XP cumulée pour atteindre le niveau l. Pensé sur plusieurs années à ~4 séances par semaine :
  // niveau 10 ≈ 3 semaines, 20 ≈ 2 mois, 30 ≈ 5 mois, 50 ≈ 1 an, 75 ≈ 2 ans et demi, 100 ≈ 4 ans.
  const need = l => l <= 1 ? 0 : Math.round(21 * Math.pow(l - 1, 1.9));
  const levelOf = xp => { let l = 1; while (l < MAX && need(l + 1) <= xp) l++; return l; };
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
    { l: 28, t: 'Champion', g: 'Armure dorée, cape écarlate' },
    { l: 36, t: 'Assassin de l\'ombre', g: 'Tenue noire, masque, écharpe violette, deux dagues' },
    { l: 44, t: 'Chasseur d\'élite', g: 'Long manteau de nuit, lame d\'énergie bleue' },
    { l: 52, t: 'Seigneur de guerre', g: 'Armure cramoisie, espadon de flammes' },
    { l: 60, t: 'Paladin céleste', g: 'Armure blanche et or, ailes, auréole' },
    { l: 68, t: 'Seigneur des ombres', g: 'Armure d\'ombre, yeux luisants, aura violette' },
    { l: 76, t: 'Marcheur du vide', g: 'Armure stellaire, lame du vide' },
    { l: 84, t: 'Demi-dieu', g: 'Corps de lumière, ailes dorées, lame solaire' },
    { l: 92, t: 'Souverain des étoiles', g: 'Armure de nébuleuse, ailes astrales, lame d\'aurore' },
    { l: 100, t: 'Monarque absolu', g: 'Armure de lumière pure, aura prismatique' }
  ];
  const q = (a, b, e, n) => ({ a, b, e, n }), hu = (h, s, e, b, w, l) => ({ h, s, e, b, w, l }), sl = (a, A, e, m) => ({ a, A, e, m }), sp = (a, e, l) => ({ a, e, l }),
    bt = (a, e, w) => ({ a, e, w }), go = (a, A, e) => ({ a, A, e }), dr = (a, A, e, f, w) => ({ a, A, e, f, w }), gh = (a, e, m) => ({ a, e, m }), ey = (a, w, i, p) => ({ a, w, i, p });
  // [nom, niveau requis, forme, échelle, palette, options : f = vole, B = boss]
  const Z = (l, n, list) => ({ l, n, m: list.map(m => ({ n: m[0], l: m[1], s: m[2], sc: m[3], p: m[4], fly: /f/.test(m[5] || ''), boss: /B/.test(m[5] || '') })) });
  const ZONES = [
    Z(1, 'La campagne', [
      ['Rat des champs', 2, 'quad', 1, q('#8c7b6b', '#c9a0a0', '#111', '#e7b0b0')],
      ['Corbeau', 2, 'bat', 1, bt('#1c1c24', '#ffd84a', '#2a2a36'), 'f'],
      ['Sanglier', 3, 'quad', 2, q('#5e4634', '#5e4634', '#f2e9d8', '#f2e9d8')],
      ['Loup alpha', 4, 'quad', 3, q('#7c828a', '#5d636b', '#ffd84a', '#fff'), 'B']]),
    Z(5, 'La ville', [
      ['Voleur', 6, 'human', 2, hu('#2b2b33', '#d9a57c', '#111', '#3a3a46', '#b9c0c7', '#26262e')],
      ['Chien errant', 6, 'quad', 2, q('#8a6a4a', '#6b4f36', '#111', '#fff')],
      ['Brute', 7, 'human', 2, hu('#7a3b22', '#c98f66', '#111', '#6b3a2a', '#6b4a2b', '#3a2c22')],
      ['Mercenaire', 8, 'human', 2, hu('#8a8f96', '#d9a57c', '#111', '#4a5a6a', '#d7dde3', '#2c3440')],
      ['Chef des bandits', 9, 'human', 3, hu('#111', '#d9a57c', '#c0392b', '#7a1f2a', '#d7dde3', '#1c1c22'), 'B']]),
    Z(10, 'Les égouts', [
      ['Slime', 11, 'slime', 2, sl('#57b96a', '#a6e8b0', '#12301a', '#2f7a40')],
      ['Rat géant', 12, 'quad', 3, q('#6a5f58', '#b98a8a', '#ff4a4a', '#e7b0b0')],
      ['Nuée de chauves-souris', 12, 'bat', 2, bt('#3b2f45', '#ff4a4a', '#55456a'), 'f'],
      ['Crocodile', 13, 'quad', 3, q('#3f6b3a', '#2f5230', '#ffd84a', '#fff')],
      ['Roi slime', 14, 'slime', 5, sl('#3f9ad9', '#a6dcff', '#0c2a44', '#ffd84a'), 'B']]),
    Z(15, 'La forêt sombre', [
      ['Gobelin', 16, 'human', 2, hu('#5f8a3a', '#7fae4a', '#ffd84a', '#6b4a2b', '#9aa0a6', '#3a2c22')],
      ['Loup noir', 16, 'quad', 2, q('#22222c', '#16161e', '#ff3b3b', '#fff')],
      ['Araignée géante', 17, 'spider', 3, sp('#2a2230', '#ff3b3b', '#40334a')],
      ['Esprit des bois', 18, 'ghost', 2, gh('#8fe0a0', '#12301a', '#3f9a5a'), 'f'],
      ['Troll', 19, 'golem', 4, go('#5c7a4a', '#4a653c', '#ffd84a'), 'B']]),
    Z(20, 'Les mines', [
      ['Chauve-souris', 21, 'bat', 2, bt('#3b2f45', '#ff4a4a', '#55456a'), 'f'],
      ['Squelette', 22, 'human', 2, hu('#e9e6da', '#e9e6da', '#111', '#cfcabb', '#9aa0a6', '#cfcabb')],
      ['Kobold', 23, 'human', 2, hu('#8a4a2a', '#b9683a', '#ffd84a', '#5a4026', '#6fe3ff', '#3a2c22')],
      ['Ver des roches', 25, 'slime', 3, sl('#8a6a4a', '#b99a7a', '#111', '#3a2c22')],
      ['Golem de pierre', 27, 'golem', 4, go('#7a7672', '#5c5955', '#6fe3ff'), 'B']]),
    Z(28, 'Les cimes', [
      ['Loup des neiges', 29, 'quad', 2, q('#e6eef5', '#c4d3e0', '#3a8fd9', '#fff')],
      ['Orc', 30, 'human', 3, hu('#2f4a2a', '#5f8a4a', '#ff4a4a', '#4a3a2a', '#8a8f96', '#2e241b')],
      ['Harpie', 32, 'bat', 3, bt('#c9a27c', '#111', '#7a5a8a'), 'f'],
      ['Élémentaire de glace', 33, 'golem', 3, go('#9ad6ff', '#6fb0e6', '#fff')],
      ['Yéti', 35, 'golem', 4, go('#eef3f7', '#c9d6e0', '#3a8fd9'), 'B']]),
    Z(36, 'Le volcan', [
      ['Diablotin', 37, 'human', 2, hu('#7a1410', '#c0392b', '#ffd84a', '#8a1f18', '#2a1210', '#5a120e')],
      ['Salamandre', 38, 'quad', 3, q('#e0621a', '#ffb04a', '#111', '#ffe08a')],
      ['Chien de lave', 40, 'quad', 3, q('#2a1210', '#ff7a1a', '#ffd84a', '#ff7a1a')],
      ['Élémentaire de feu', 41, 'ghost', 3, gh('#ff8a2a', '#fff3b0', '#c0392b'), 'f'],
      ['Démon', 43, 'golem', 4, go('#6b1512', '#3a0c0a', '#ffd84a'), 'B']]),
    Z(44, 'La citadelle', [
      ['Garde maudit', 45, 'human', 2, hu('#4a4a5a', '#8fa0a0', '#7fe7ff', '#3a3a4a', '#9aa0a6', '#26262e')],
      ['Gargouille', 46, 'bat', 3, bt('#6a6a78', '#ff3b3b', '#4a4a58'), 'f'],
      ['Chevalier noir', 48, 'human', 3, hu('#1c1c26', '#2a2a38', '#ff3b3b', '#22222e', '#c3c9cf', '#16161e')],
      ['Liche', 50, 'human', 3, hu('#4a2a6b', '#d8e6d0', '#7fe7ff', '#3a2055', '#7fe7ff', '#2a1740')],
      ['Dragon', 51, 'dragon', 4, dr('#8a1f1f', '#d9a441', '#ffd84a', '#ff8a2a', '#5a1414'), 'B']]),
    Z(52, 'Le donjon des ombres', [
      ['Ombre errante', 53, 'ghost', 2, gh('#2a1a55', '#b388ff', '#120a22'), 'f'],
      ['Soldat d\'ombre', 54, 'human', 2, hu('#120a22', '#1e1238', '#b388ff', '#1a1030', '#8b6cff', '#0d0818')],
      ['Bête d\'ombre', 56, 'quad', 3, q('#160d2a', '#2a1a55', '#b388ff', '#b388ff')],
      ['Assassin sans visage', 58, 'human', 3, hu('#0d0818', '#0d0818', '#ff3b3b', '#160d2a', '#e6dcff', '#0d0818')],
      ['Gardien du portail', 59, 'golem', 5, go('#2a1a55', '#120a22', '#b388ff'), 'B']]),
    Z(60, 'La cité céleste', [
      ['Sentinelle ailée', 61, 'bat', 3, bt('#f4f1e6', '#4da3ff', '#ffffff'), 'f'],
      ['Golem d\'or', 62, 'golem', 3, go('#e0b04a', '#c8963a', '#fff')],
      ['Séraphin', 64, 'ghost', 3, gh('#fff6d8', '#4da3ff', '#e0b04a'), 'f'],
      ['Lion céleste', 66, 'quad', 4, q('#ffe9a0', '#e0b04a', '#4da3ff', '#fff')],
      ['Archange déchu', 67, 'human', 5, hu('#f4f1e6', '#c9d0e6', '#ff3b3b', '#3a3a4a', '#fff3b0', '#22222e'), 'B']]),
    Z(68, 'Les abysses', [
      ['Méduse abyssale', 69, 'tentacle', 2, gh('#b388ff', '#fff', '#7a4ad9'), 'f'],
      ['Jeune léviathan', 70, 'quad', 4, q('#12406a', '#0a2a4a', '#6fe3ff', '#fff')],
      ['Œil des profondeurs', 72, 'eye', 3, ey('#1a5a6a', '#d8f4ff', '#12a0a0', '#02141c'), 'f'],
      ['Horreur rampante', 74, 'spider', 4, sp('#0a2a3a', '#6fe3ff', '#12506a')],
      ['Kraken', 75, 'tentacle', 5, gh('#7a2a5a', '#ffd84a', '#3a0f2a'), 'B']]),
    Z(76, 'La faille', [
      ['Anomalie', 77, 'slime', 3, sl('#ff4ad9', '#ffb0f0', '#12021f', '#6fe3ff')],
      ['Double sombre', 78, 'human', 3, hu('#12021f', '#2a0540', '#6fe3ff', '#1a0330', '#ff4ad9', '#0a0214')],
      ['Traqueur dimensionnel', 80, 'spider', 4, sp('#0a3a4a', '#ff4ad9', '#6fe3ff')],
      ['Œil de la faille', 82, 'eye', 4, ey('#3a0850', '#fff', '#ff4ad9', '#12021f'), 'f'],
      ['Gardien de la faille', 83, 'golem', 5, go('#22043a', '#6fe3ff', '#ff4ad9'), 'B']]),
    Z(84, 'Le vide cosmique', [
      ['Spectre stellaire', 85, 'ghost', 3, gh('#9ad6ff', '#06051a', '#4da3ff'), 'f'],
      ['Dévoreur d\'étoiles', 86, 'eye', 4, ey('#1a1040', '#fff3b0', '#ff8a2a', '#000'), 'f'],
      ['Serpent cosmique', 88, 'dragon', 3, dr('#3a2a8a', '#b388ff', '#fff', '#6fe3ff', '#1a1040')],
      ['Titan du vide', 90, 'golem', 5, go('#2a2470', '#5a4ab8', '#6fe3ff')],
      ['Entité sans nom', 91, 'tentacle', 6, gh('#4a2a9a', '#ff4ad9', '#6fe3ff'), 'B']]),
    Z(92, 'Le trône des étoiles', [
      ['Héraut du trône', 93, 'human', 3, hu('#fff', '#e6dcff', '#ff7ad9', '#b9a5e6', '#fff', '#8a7ac0')],
      ['Dragon astral', 95, 'dragon', 4, dr('#e6dcff', '#ff7ad9', '#4da3ff', '#fff', '#b388ff')],
      ['Colosse céleste', 97, 'golem', 5, go('#fff6d8', '#e0b04a', '#ff7ad9')],
      ['Le Souverain', 100, 'human', 5, hu('#ffd76a', '#1a1040', '#fff', '#3a1a7a', '#ff7ad9', '#120a30'), 'B']])
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
    dragon: ['..............w...', '.aa..........www..', 'aeaa........wwwww.', 'aaaaa......wwwwww.', 'ffaaaa...aaaawwww.', '..aaaaaaaaaaaaww..', '...aaaaaaaaaaaaa..', '...aaaAAAAAaaaaaa.', '....aaAAAAAaaa.aaa', '....aa.aa..aa...aa', '....aa.aa..aa....a', '...aaa.aaa.aaa....'],
    ghost: ['...aaaa...', '..aaaaaa..', '.aaaaaaaa.', '.aeeaaeea.', '.aeeaaeea.', '.aaaaaaaa.', '.aaammaaa.', '.aaaaaaaa.', '.aaaaaaaa.', '.aa.aa.aa.', '.a..a...a.'],
    eye: ['....aaaa....', '..aaaaaaaa..', '.aawwwwwwaa.', 'aawwwiiwwwaa', 'aawwippiwwaa', 'aawwippiwwaa', 'aawwwiiwwwaa', '.aawwwwwwaa.', '..aaaaaaaa..', '....aaaa....'],
    tentacle: ['....aaaaaa....', '...aaaaaaaa...', '..aaeaaaaeaa..', '..aaeaaaaeaa..', '..aaaaaaaaaa..', '...aaammaaa...', '..a.aaaaaa.a..', '.a..a.aa.a..a.', 'a..a..aa..a..a', 'a..a..a.a.a..a', '.a..a.a.a..a..', '..a..a...a..a.']
  };
  const HB = ['...hhhh...', '..hhhhhh..', '..hsssss..', '..hssese..', '..ssssss..', '...tttt...', '.atttttta.', '.atttttta.', '.sbbbbbbs.', '..pppppp..'];
  const LEGS = [['..pp..pp..', '..pp..pp..', '..oo..ooo.'], ['..pppppp..', '...pppp...', '...oooo...']];
  const SKIN = '#e8b98a', EYE = '#2a1c12', RB = ['#ff7ad9', '#ffd76a', '#6fe3ff', '#b388ff', '#fff'];
  const HP = [
    { h: '#d9b44a', hat: 1, t: '#b8a27a', a: '#b8a27a', b: '#5a3d22', p: '#6b5a45', o: '#3b2a1a', w: { k: 'fork' } },
    { h: '#5a3a22', t: '#8a5a2e', a: '#a9773f', b: '#3b2a1a', p: '#4d4a46', o: '#2a2019', w: { len: 3, c: '#b9c0c7' } },
    { h: '#5a3a22', t: '#3f7a4a', a: '#3f7a4a', b: '#c8a04a', p: '#5a4632', o: '#2a2019', cape: '#8a2f2f', w: { len: 5, c: '#c9d0d6' } },
    { h: '#9aa0a6', t: '#7d858c', a: '#7d858c', b: '#5a3d22', p: '#4d4a46', o: '#3a3a3a', shield: '#3b5f8a', w: { len: 6, c: '#d7dde3' } },
    { h: '#c3c9cf', plume: '#c0392b', t: '#c3c9cf', a: '#aab1b8', b: '#6b7178', p: '#aab1b8', o: '#6b7178', shield: '#c3c9cf', w: { len: 7, c: '#eef1f4' } },
    { h: '#e0b04a', plume: '#fff', t: '#e0b04a', a: '#c8963a', b: '#8a2f2f', p: '#c8963a', o: '#7a5a22', cape: '#a82828', shield: '#e0b04a', w: { len: 7, c: '#f1f4f7' } },
    { h: '#1a1a22', mask: '#1a1a22', t: '#22222c', a: '#2c2c38', b: '#8b6cff', p: '#1a1a22', o: '#0e0e12', scarf: '#8b6cff', w: { len: 4, c: '#c4b5ff', glow: 1, dual: 1 } },
    { h: '#15151c', t: '#1c2238', a: '#1c2238', b: '#4da3ff', p: '#14182a', o: '#0c0e18', cape: '#14182a', aura: '#4da3ff', w: { len: 8, c: '#7fe7ff', glow: 1 } },
    { h: '#7a1f1f', plume: '#ffb04a', t: '#8a2323', a: '#6b1a1a', b: '#e0b04a', p: '#5a1515', o: '#3a0e0e', cape: '#2a0a0a', aura: '#ff8a2a', w: { len: 10, c: '#ff8a2a', glow: 1, thick: 1 } },
    { h: '#f4f1e6', plume: '#ffd76a', t: '#f4f1e6', a: '#e0b04a', b: '#ffd76a', p: '#f4f1e6', o: '#e0b04a', cape: '#ffffff', wings: '#ffffff', halo: 1, w: { len: 9, c: '#fff3b0', glow: 1 } },
    { h: '#0d0d14', e: '#b9a5ff', s: '#b9a0a8', t: '#14141e', a: '#1e1e2c', b: '#8b6cff', p: '#0d0d14', o: '#07070b', cape: '#2a1a55', aura: '#8b6cff', w: { len: 9, c: '#b388ff', glow: 1, dual: 1 } },
    { h: '#0a1030', plume: '#6fe3ff', t: '#0f1a4a', a: '#1a2a6a', b: '#6fe3ff', p: '#0a1030', o: '#050818', cape: '#050818', aura: '#6fe3ff', w: { len: 10, c: '#6fe3ff', glow: 1, thick: 1 } },
    { h: '#ffd76a', s: '#ffe9c8', t: '#fff6d8', a: '#ffd76a', b: '#ffffff', p: '#fff6d8', o: '#ffd76a', cape: '#ffb84a', wings: '#ffe9a0', halo: 1, aura: '#ffd76a', w: { len: 10, c: '#ffffff', glow: 1, thick: 1 } },
    { h: '#e6f4ff', e: '#ff7ad9', t: '#1a1040', a: '#3a2a8a', b: '#ff7ad9', p: '#120a30', o: '#0a0620', cape: '#3a1a7a', wings: '#b388ff', halo: 1, aura: 'rb', w: { len: 11, c: '#ff7ad9', glow: 1, thick: 1 } },
    { h: '#ffffff', e: '#4da3ff', s: '#f4f6ff', t: '#ffffff', a: '#e6f4ff', b: '#4da3ff', p: '#ffffff', o: '#9ad6ff', cape: '#4da3ff', wings: '#9ad6ff', halo: 1, aura: 'rb', w: { len: 12, c: '#ffffff', glow: 1, thick: 1 } }
  ].map(p => Object.assign({ s: SKIN, e: EYE }, p));

  let g = null;
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  const hash = n => { n = Math.sin(n * 127.1 + 3.7) * 43758.5453; return n - Math.floor(n); };
  function disc(cx, cy, r, col) { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); R(col, cx - w, cy + dy, w * 2 + 1, 1); } }
  function spr(rows, pal, x, y, sc) {
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const c = pal[rows[j][i]]; if (c) { g.fillStyle = c; g.fillRect(x + i * sc, y + j * sc, sc, sc); } }
  }
  function drawHero(x, y, sc, tier, frame, atk, t) {
    const P = HP[tier], w = P.w, hx = x + 9 * sc, f2 = Math.floor(t * 4) % 2;
    if (P.aura) for (let k = 0; k < 9; k++) { const n = k + Math.floor(t * 5) * 13; R(P.aura === 'rb' ? RB[(k + Math.floor(t * 5)) % RB.length] : P.aura, x - 3 * sc + hash(n) * 16 * sc, y - 3 * sc + hash(n + 5) * 16 * sc, sc / 2, sc / 2); }
    if (P.wings) { R(P.wings, x - 3 * sc, y + (2 - f2) * sc, 3 * sc, sc); R(P.wings, x - 5 * sc, y + (3 - f2) * sc, 5 * sc, sc); R(P.wings, x - 4 * sc, y + (4 - f2) * sc, 4 * sc, sc); R(P.wings, x - 3 * sc, y + (5 - f2) * sc, 3 * sc, sc); R(P.wings, x - 2 * sc, y + (6 - f2) * sc, 2 * sc, sc); }
    if (P.cape) { R(P.cape, x + sc, y + 5 * sc, sc, 6 * sc); R(P.cape, x, y + 7 * sc, sc, (frame ? 4 : 5) * sc); }
    if (P.scarf) { R(P.scarf, x - 2 * sc, y + (4 + f2) * sc, 4 * sc, sc); R(P.scarf, x - 4 * sc, y + (5 - f2) * sc, 3 * sc, sc); }
    spr(HB.concat(LEGS[frame]), P, x, y, sc);
    if (P.mask) R(P.mask, x + 2 * sc, y + 4 * sc, 6 * sc, sc);
    if (P.hat) R(P.h, x + sc, y + sc, 8 * sc, sc);
    if (P.plume) { R(P.plume, x + 3 * sc, y - 2 * sc, sc, 2 * sc); R(P.plume, x + 2 * sc, y - 2 * sc, sc, sc); }
    if (P.halo) R('#fff3b0', x + 2 * sc, y - (P.plume ? 4 : 2) * sc, 6 * sc, Math.max(1, sc / 2));
    if (P.shield) { R(P.shield, x - sc, y + 6 * sc, 3 * sc, 4 * sc); R('rgba(255,255,255,.35)', x, y + 7 * sc, sc, sc); R('rgba(0,0,0,.3)', x - sc, y + 9 * sc, 3 * sc, sc); }
    if (w.k === 'fork') {
      if (atk) { R('#8a6a3f', x + 6 * sc, y + 7 * sc, 9 * sc, sc); R('#9aa0a6', x + 15 * sc, y + 6 * sc, sc, 3 * sc); R('#9aa0a6', x + 16 * sc, y + 6 * sc, sc, sc); R('#9aa0a6', x + 16 * sc, y + 8 * sc, sc, sc); R('#9aa0a6', x + 16 * sc, y + 7 * sc, sc, sc); }
      else { R('#8a6a3f', hx, y - sc, sc, 13 * sc); R('#9aa0a6', hx - sc, y - 2 * sc, 3 * sc, sc); R('#9aa0a6', hx - sc, y - 3 * sc, sc, sc); R('#9aa0a6', hx + sc, y - 3 * sc, sc, sc); R('#9aa0a6', hx, y - 3 * sc, sc, sc); }
      return;
    }
    const th = w.thick ? 2 : 1;
    if (w.dual) { if (w.glow) { g.globalAlpha = .3; R(w.c, x - sc, y + 9 * sc, 3 * sc, Math.min(4, w.len) * sc); g.globalAlpha = 1; } R(w.c, x, y + 9 * sc, sc, Math.min(4, w.len) * sc); }
    if (atk) {
      if (w.glow) { g.globalAlpha = .3; R(w.c, hx + 2 * sc, y + (6 - (th - 1)) * sc, w.len * sc, (th + 2) * sc); g.globalAlpha = 1; }
      R('#3b2a1a', hx, y + 7 * sc, sc, sc); R('#c8a04a', hx + sc, y + (6 - (th - 1)) * sc, sc, (th + 2) * sc); R(w.c, hx + 2 * sc, y + (7 - (th - 1)) * sc, w.len * sc, th * sc);
    } else {
      if (w.glow) { g.globalAlpha = .3; R(w.c, hx - sc, y + (6 - w.len) * sc, (th + 2) * sc, w.len * sc); g.globalAlpha = 1; }
      R('#3b2a1a', hx, y + 7 * sc, sc, 2 * sc); R('#c8a04a', hx - sc, y + 6 * sc, (th + 2) * sc, sc); R(w.c, hx, y + (6 - w.len) * sc, th * sc, w.len * sc);
    }
  }

  /* ---------- décors ---------- */
  function sky(cols) { const h = Math.ceil(GY / cols.length); cols.forEach((c, i) => R(c, 0, i * h, W, h)); }
  function ridge(sx, par, base, amp, f, col) { g.fillStyle = col; for (let x = 0; x < W; x++) { const wx = x + sx * par, y = Math.round(base + Math.sin(wx / f) * amp + Math.sin(wx / (f * .37)) * amp * .4); g.fillRect(x, y, 1, GY - y); } }
  function each(sx, par, step, fn, reg) { const off = sx * par, k0 = Math.floor(off / step) - 2, n = Math.ceil(W / step) + 4; for (let k = k0; k < k0 + n; k++) fn(Math.round(k * step + (reg ? 0 : hash(k) * step * .5) - off), k); }
  function ground(sx, col, top, speck) { R(col, 0, GY, W, H - GY); R(top, 0, GY, W, 2); each(sx, 1, 11, (x, k) => R(speck, x, GY + 5 + (hash(k + 3) * 14 | 0), 3, 1)); }
  function tri(cx, h, slope, col, snow) { for (let i = 0; i < h; i++) { const w = Math.round(i * slope); R(snow && i < h * .3 ? snow : col, cx - w, GY - h + i, w * 2 + 1, 1); } }
  function motes(t, n, col, speed) { for (let i = 0; i < n; i++) R(col, (hash(i) * W + Math.sin(t + i) * 5 + W) % W, GY - ((t * speed * (1 + hash(i + 9)) + hash(i + 4) * 96) % 100), 1, 1); }
  const BG = [
    (sx, t) => { // campagne
      sky(['#86bfe0', '#a5d3ea', '#cfe8e0']); R('#fff1b8', W - 34, 12, 10, 10); R('#fff8d8', W - 32, 14, 6, 6);
      each(sx + t * 30, .1, 76, (x, k) => { const y = 10 + (hash(k) * 16 | 0); R('#fff', x, y, 22, 4); R('#fff', x + 5, y - 3, 11, 3); });
      ridge(sx, .2, GY - 28, 6, 31, '#7fae6a'); ridge(sx, .4, GY - 19, 4, 19, '#5f9450');
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
      each(sx, .5, 96, (x, k) => { R('#55665e', x - 2, 34, 30, 30); R('#0f1512', x, 36, 26, 26); R('#2f6a58', x + 8, 58, 10, 4); R('#4fa58a', x + 12, 62 + ((t * 40 + k * 13) % 38), 1, 3); }, 1);
      R('#3a4a44', 0, 14, W, 4); R('#2c3a35', 0, 18, W, 1);
      R('#24483c', 0, GY, W, H - GY); R('#3d7a65', 0, GY, W, 2);
      each(sx, 1, 13, (x, k) => R('#5fb89a', x + Math.sin(t * 2 + k) * 2, GY + 5 + (hash(k) * 14 | 0), 4, 1));
    },
    (sx, t) => { // forêt
      sky(['#10201a', '#17301f', '#214229']);
      each(sx, .3, 22, (x, k) => R('#162a1c', x, 0, 5 + (hash(k) * 4 | 0), GY));
      each(sx, .6, 46, x => { R('#2a1f15', x, 0, 9, GY); R('#3a2c1e', x + 2, 0, 1, GY); R('#1d150e', x + 7, 0, 2, GY); });
      R('#0c1812', 0, 0, W, 10); each(sx, .6, 14, (x, k) => R('#143021', x, 10, 7, 3 + (hash(k) * 6 | 0)), 1);
      each(sx, .8, 37, (x, k) => { if (Math.sin(t * 3 + k * 2.1) > .2) R('#d8ff8a', x, 34 + (hash(k) * 50 | 0), 1, 1); });
      each(sx, 1, 58, x => { R('#e9e2d0', x + 2, GY - 4, 1, 4); R('#c0392b', x, GY - 6, 5, 2); });
      ground(sx, '#2b4423', '#3d6130', '#1f331a');
    },
    (sx, t) => { // mines
      R('#19171d', 0, 0, W, GY);
      each(sx, .4, 13, (x, k) => R('#221f27', x, hash(k + 1) * GY, 5, 3));
      each(sx, .8, 84, x => { R('#5a4026', x, 26, 4, GY - 26); R('#5a4026', x + 44, 26, 4, GY - 26); R('#6b4d2e', x - 4, 22, 56, 5); R('#ffb84a', x + 23, 27, 2, 4); g.globalAlpha = .1 + Math.sin(t * 9) * .02; R('#ffb84a', x + 14, 20, 20, 20); g.globalAlpha = 1; }, 1);
      each(sx, .8, 53, x => { R('#6fe3ff', x, GY - 7, 2, 7); R('#3aa7c9', x + 2, GY - 4, 2, 4); R('#3aa7c9', x - 2, GY - 3, 2, 3); });
      R('#35302c', 0, GY, W, H - GY); R('#4a443e', 0, GY, W, 2);
      each(sx, 1, 10, x => R('#4a3824', x, GY + 4, 3, 4), 1); R('#8a8a92', 0, GY + 5, W, 1);
      each(sx, 1, 11, (x, k) => R('#28241f', x, GY + 12 + (hash(k) * 8 | 0), 3, 1));
    },
    (sx, t) => { // cimes
      sky(['#7fa6cf', '#a9c6e2', '#dbe8f2']);
      each(sx, .15, 62, (x, k) => tri(x, 40 + (hash(k) * 26 | 0), .9, '#8a9bb3', '#fff'));
      each(sx, .35, 90, (x, k) => tri(x, 24 + (hash(k + 4) * 12 | 0), 1.3, '#6c7d96', '#eef3f7'));
      each(sx, .8, 50, x => { R('#3a2a1c', x + 5, GY - 4, 2, 4); R('#23483a', x, GY - 8, 11, 4); R('#23483a', x + 2, GY - 12, 7, 4); R('#23483a', x + 4, GY - 16, 3, 4); R('#fff', x + 4, GY - 16, 3, 1); R('#fff', x + 2, GY - 12, 3, 1); });
      ground(sx, '#dfe8ef', '#ffffff', '#b9c8d6');
      for (let i = 0; i < 26; i++) R('#fff', (hash(i) * W + t * 8 * (1 + hash(i + 5))) % W, (hash(i + 2) * GY + t * 18) % GY, 1, 1);
    },
    (sx, t) => { // volcan
      sky(['#160a0a', '#3a100d', '#7a2412', '#c4501c']);
      each(sx, .1, 170, x => { tri(x, 60, 1.1, '#2a1210'); R('#ff8a2a', x - 3, GY - 60, 7, 3); R('#ff5a1a', x - 1, GY - 57, 2, 18); R('#ff5a1a', x + 1, GY - 40, 2, 14); }, 1);
      each(sx, .5, 34, (x, k) => { const h = 10 + (hash(k) * 16 | 0); R('#1d0e0c', x, GY - h, 6, h); R('#1d0e0c', x + 6, GY - h * .6, 5, h * .6 + 1); R('#1d0e0c', x - 4, GY - h * .4, 4, h * .4 + 1); });
      R('#2e1611', 0, GY, W, H - GY); R('#4a2018', 0, GY, W, 2);
      g.globalAlpha = .7 + Math.sin(t * 3) * .3; each(sx, 1, 23, (x, k) => R('#ff7a1a', x, GY + 5 + (hash(k) * 12 | 0), 7, 1)); g.globalAlpha = 1;
      for (let i = 0; i < 18; i++) R(i % 3 ? '#ffb04a' : '#ff5a1a', (hash(i) * W + Math.sin(t + i) * 6 + W) % W, GY - ((t * 14 * (1 + hash(i + 9)) + hash(i + 4) * 80) % 100), 1, 1);
    },
    (sx, t) => { // citadelle
      sky(['#0b0b18', '#151530', '#2a2148']);
      for (let i = 0; i < 26; i++) R('#fff', hash(i) * W, hash(i + 50) * 34, 1, 1);
      R('#e9e6ff', 22, 22, 10, 10); R('#151530', 25, 22, 7, 7);
      R('#2a2a3a', 0, 46, W, GY - 46); each(sx, .5, 12, x => R('#2a2a3a', x, 41, 7, 5), 1);
      for (let y = 54; y < GY; y += 9) R('#222231', 0, y, W, 1);
      each(sx, .5, 78, x => { R('#7a1f2a', x, 54, 9, 24); R('#5a1520', x + 3, 78, 3, 3); R('#d9a441', x + 3, 60, 3, 6); R('#5a4026', x + 38, 74, 2, 7); R('#ffb84a', x + 38, 70 + (Math.floor(t * 8) % 2), 2, 4); g.globalAlpha = .12; R('#ffb84a', x + 31, 63, 16, 16); g.globalAlpha = 1; }, 1);
      ground(sx, '#3a3a4a', '#52526a', '#2c2c3a');
    },
    (sx, t) => { // donjon des ombres
      sky(['#0d0818', '#160d2a', '#1f1140']);
      each(sx, .2, 150, x => { for (let i = 0; i < 4; i++) { g.globalAlpha = .16 + i * .12; disc(x + 40, GY - 36, 28 - i * 7, i === 3 ? '#e6dcff' : '#8b6cff'); } g.globalAlpha = 1; }, 1);
      each(sx, .6, 58, (x, k) => { R('#1a1030', x, 0, 11, GY); R('#2a1a4a', x + 2, 0, 2, GY); R('#120a22', x - 2, 0, 15, 5); R('#120a22', x - 2, GY - 5, 15, 5); if (Math.sin(t * 2 + k) > -.3) { R('#b388ff', x + 4, 40, 3, 1); R('#b388ff', x + 5, 38, 1, 5); R('#b388ff', x + 4, 54, 3, 3); } }, 1);
      ground(sx, '#1a1228', '#3a2a66', '#120c1e');
      motes(t, 16, '#b388ff', 10);
    },
    (sx, t) => { // cité céleste
      sky(['#3a6fd9', '#6fa3ee', '#a9cbf5', '#ffe2b8']);
      g.globalAlpha = .25; disc(W - 30, 24, 15, '#fff6d8'); g.globalAlpha = 1; disc(W - 30, 24, 9, '#fff6d8');
      each(sx, .2, 70, (x, k) => { const h = 38 + (hash(k) * 30 | 0); R('#e9e6f4', x, GY - h, 10, h); R('#e0b04a', x - 2, GY - h - 3, 14, 3); R('#e0b04a', x + 4, GY - h - 9, 2, 6); R('#bcd0f0', x + 3, GY - h + 6, 4, 8); });
      each(sx, .5, 64, (x, k) => { const y = 48 + (hash(k) * 26 | 0); R('#fff', x, y, 30, 5); R('#fff', x + 6, y - 4, 16, 4); R('#dfe8fa', x + 2, y + 5, 26, 2); R('#f4f1e6', x + 11, y - 16, 8, 12); R('#e0b04a', x + 9, y - 18, 12, 2); });
      R('#f4f6ff', 0, GY, W, H - GY); each(sx, 1, 18, x => { R('#fff', x, GY - 3, 14, 5); R('#fff', x + 3, GY - 5, 8, 2); }, 1);
      each(sx, 1, 11, (x, k) => R('#d6def5', x, GY + 6 + (hash(k) * 12 | 0), 4, 1));
    },
    (sx, t) => { // abysses
      sky(['#020814', '#041226', '#06203a']);
      g.globalAlpha = .07; each(sx, .1, 46, x => { for (let y = 0; y < GY; y += 4) R('#6fe3ff', x + y * .35, y, 9, 4); }); g.globalAlpha = 1;
      each(sx, .3, 40, (x, k) => { const h = 24 + (hash(k) * 46 | 0); R('#07182c', x, GY - h, 8, h); R('#07182c', x + 8, GY - h * .6, 6, h * .6 + 1); });
      each(sx, .8, 26, (x, k) => { const h = 10 + (hash(k) * 16 | 0); for (let i = 0; i < h; i += 2) R(i % 4 ? '#0f5a5a' : '#147a6a', x + Math.round(Math.sin(t * 1.5 + k + i * .3) * 2), GY - i - 2, 2, 2); });
      each(sx, .6, 31, (x, k) => { if (Math.sin(t * 2 + k * 1.7) > 0) R('#6fe3ff', x, 30 + (hash(k) * 66 | 0), 1, 1); });
      ground(sx, '#0a1a2c', '#12304a', '#06101c');
      g.globalAlpha = .6; motes(t, 14, '#9ad6ff', 16); g.globalAlpha = 1;
    },
    (sx, t) => { // la faille
      sky(['#12021f', '#22043a', '#3a0850', '#5a0c5e']);
      each(sx, .15, 130, x => { let cx = x + 40; for (let y = 4; y < GY - 8; y += 4) { cx += (hash(y) - .5) * 9; g.globalAlpha = .35; R('#6fe3ff', cx - 2, y, 6, 4); g.globalAlpha = 1; R('#fff', cx, y, 2, 4); } }, 1);
      each(sx, .4, 38, (x, k) => { const y = 24 + (hash(k) * 56 | 0) + Math.round(Math.sin(t * 1.5 + k) * 3), s = 4 + (hash(k + 2) * 6 | 0), c = k % 2 ? '#6fe3ff' : '#ff4ad9'; R(c, x, y, s, 1); R(c, x, y + s, s + 1, 1); R(c, x, y, 1, s); R(c, x + s, y, 1, s); });
      for (let i = 0; i < 3; i++) { const n = i + Math.floor(t * 7) * 3; if (hash(n) > .55) { g.globalAlpha = .25; R(i % 2 ? '#6fe3ff' : '#ff4ad9', hash(n + 1) * W, hash(n + 2) * GY, 20 + hash(n + 3) * 40, 2); g.globalAlpha = 1; } }
      R('#0a0214', 0, GY, W, H - GY); R('#ff4ad9', 0, GY, W, 1);
      g.globalAlpha = .55; each(sx, 1, 12, x => R('#6fe3ff', x, GY + 1, 1, H - GY), 1); [6, 13, 20].forEach(d => R('#6fe3ff', 0, GY + d, W, 1)); g.globalAlpha = 1;
    },
    (sx, t) => { // vide cosmique
      sky(['#02020a', '#06051a', '#0d0a2a']);
      for (let i = 0; i < 54; i++) if (Math.sin(t * 2 + i * 1.3) > -.6) R(i % 7 ? '#fff' : '#9ad6ff', ((hash(i) * W - sx * .05) % W + W) % W, hash(i + 60) * GY, 1, 1);
      g.globalAlpha = .16; each(sx, .08, 120, x => { disc(x + 30, 46, 24, '#8b6cff'); disc(x + 52, 58, 18, '#ff4ad9'); disc(x + 14, 62, 14, '#4da3ff'); }, 1); g.globalAlpha = 1;
      each(sx, .12, 210, x => { disc(x + 90, 34, 15, '#3a2a8a'); disc(x + 87, 31, 11, '#5a4ab8'); R('#b9a5ff', x + 68, 34, 44, 1); R('#8b6cff', x + 71, 36, 38, 1); }, 1);
      each(sx, .5, 52, (x, k) => { const y = 58 + (hash(k) * 30 | 0) + Math.round(Math.sin(t + k) * 2); R('#2a2a3e', x, y, 12, 4); R('#1a1a2a', x + 2, y + 4, 8, 3); R('#4a4a6a', x + 1, y, 6, 1); });
      ground(sx, '#16162a', '#3a3a5e', '#0c0c18');
    },
    (sx, t) => { // trône des étoiles
      sky(['#0a0620', '#22104a', '#4a1e78', '#8a3a9a', '#e08ac0']);
      for (let i = 0; i < 30; i++) R('#fff', hash(i) * W, hash(i + 50) * 40, 1, 1);
      g.globalAlpha = .12 + Math.sin(t) * .03; each(sx, .1, 48, (x, k) => R('#fff', x, 0, 6 + (hash(k) * 8 | 0), GY)); g.globalAlpha = 1;
      each(sx, .15, 200, x => { for (let i = 0; i < 7; i++) R(i % 2 ? '#c8963a' : '#e0b04a', x + i * 6, GY - 8 - i * 7, 110 - i * 12, 7); R('#fff6d8', x + 44, GY - 78, 22, 22); R('#e0b04a', x + 41, GY - 84, 28, 6); R('#ff7ad9', x + 53, GY - 90, 4, 6); }, 1);
      each(sx, .6, 46, (x, k) => { const y = 34 + (hash(k) * 40 | 0) + Math.round(Math.sin(t * 1.3 + k) * 3), c = k % 2 ? '#fff' : '#ffb0e6'; R(c, x + 2, y, 2, 1); R(c, x + 1, y + 1, 4, 2); R(c, x, y + 3, 6, 2); R(c, x + 1, y + 5, 4, 2); R(c, x + 2, y + 7, 2, 1); });
      ground(sx, '#d9c8ff', '#ffffff', '#b09ae0');
    }
  ];

  /* ---------- la scène ---------- */
  let raf = 0, st = null;
  const BEAT = .5;
  function say(s, txt, cls) { if (s.cap && s.cap.isConnected) { s.cap.textContent = txt; s.cap.className = 'cap ' + (cls || ''); } }
  function banner(s, small, big, cls) {
    if (!s.box || !s.box.isConnected) return;
    const old = s.box.querySelector('.fxb'); if (old) old.remove();
    const b = document.createElement('div'), a = document.createElement('small'), c = document.createElement('b');
    b.className = 'fxb ' + (cls || ''); a.textContent = small; c.textContent = big; b.appendChild(a); b.appendChild(c); s.box.appendChild(b);
  }
  function bossbar(s, m, ratio) {
    if (!s.box || !s.box.isConnected) return;
    let b = s.box.querySelector('.bossbar');
    if (!m) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.className = 'bossbar'; b.innerHTML = '<span></span><div><i></i></div>'; b.firstChild.textContent = m.n; s.box.appendChild(b); }
    b.querySelector('i').style.width = Math.max(0, Math.round(ratio * 100)) + '%';
  }
  // moments importants à montrer : montée de niveau, nouvelle tenue, nouvelle zone, premier combat contre un boss.
  // Ils sont joués quand la scène est à l'écran, jamais en arrière-plan ; « seen » = niveau acquis une fois le groupe vu.
  function buildQueue(from, to) {
    const qu = [];
    for (let l = from + 1; l <= to; l++) {
      const last = qu[qu.length - 1];
      if (last && last.t === 'lvl' && last.solo) last.to = l; else qu.push({ t: 'lvl', to: l, solo: true });
      const cur = qu[qu.length - 1], extra = [];
      if (tierIdx(l) > tierIdx(l - 1)) extra.push({ t: 'tier', i: tierIdx(l) });
      ZONES.forEach(z => z.m.forEach(m => { if (m.boss && m.l === l) extra.push({ t: 'boss', m }); }));
      if (zoneIdx(l) > zoneIdx(l - 1)) extra.push({ t: 'zone', i: zoneIdx(l) });
      if (extra.length) { cur.solo = false; extra.forEach(e => qu.push(e)); }
      qu[qu.length - 1].seen = l;
    }
    return qu;
  }
  function nextEvent(s) {
    const e = s.ev = s.queue.shift(); s.t = 0;
    if (e.t === 'lvl') { s.phase = 'ev'; banner(s, 'Niveau supérieur', 'Niveau ' + e.to, 'lvl'); say(s, s.name + ' passe au niveau ' + e.to + '.', 'ok'); }
    else if (e.t === 'tier') { s.phase = 'ev'; banner(s, 'Nouveau titre', TIERS[e.i].t, 'tier'); say(s, TIERS[e.i].g + '.', 'ok'); }
    else if (e.t === 'zone') { s.phase = 'ev'; banner(s, 'Nouvelle zone', ZONES[e.i].n, 'zone'); say(s, s.name + ' entre dans une nouvelle zone : ' + ZONES[e.i].n + '.'); }
    else { s.m = e.m; s.mx = W + 4; s.phase = 'approach'; s.cineNext = true; banner(s, 'Boss', e.m.n, 'boss'); say(s, 'BOSS · ' + e.m.n + ' approche.', 'boss'); s.shake = s.time + .9; }
  }
  function endEvent(s) {
    const e = s.ev; s.ev = null;
    const hb = s.box && s.box.querySelector('.hud b'), hs = s.box && s.box.querySelector('.hud span');
    if (e.t === 'lvl') { s.level = e.to; if (hb) hb.textContent = 'NIV. ' + e.to; }
    if (e.t === 'tier') { s.tier = e.i; if (hs) hs.textContent = TIERS[e.i].t; }
    if (e.t === 'zone') s.z = e.i;
    if (e.seen && s.onSeen) s.onSeen(e.seen);
    s.phase = 'walk'; s.t = 0;
    if (!s.queue.length) s.doneAt = s.time + 1.8;
  }
  function pick(s) {
    const ms = ZONES[s.z].m, won = ms.filter(m => m.l <= s.level), next = ms.find(m => m.l > s.level);
    s.n++;
    if (next && (!won.length || s.n % 3 === 0)) return next;
    return won.length ? won[Math.floor(Math.random() * won.length)] : next;
  }
  function mpos(s) {
    const m = s.m, rows = SHAPES[m.s], h = rows.length * m.sc, w = rows[0].length * m.sc, fly = m.fly ? 12 + Math.round(Math.sin(s.time * 5) * 2) : 0;
    return { x: Math.round(s.mx), y: GY - h - fly, w, h, cy: GY - Math.min(h, 28) / 2 - fly };
  }
  function white(m) { if (!m._w) { m._w = {}; Object.keys(m.p).forEach(k => { m._w[k] = '#fff'; }); } return m._w; }
  function beginFight(s, cine) {
    const m = s.m; s.phase = 'fight'; s.t = 0; s.beat = -1; s.hits = 0; s.cine = cine; s.win = cine || m.l <= s.level;
    s.beats = cine ? 14 : s.win ? (m.boss ? 10 : 6) : 4;
    if (m.boss) bossbar(s, m, 1);
  }
  // chaque forme de monstre a sa propre attaque ; un boss place un coup spécial (chargé, plus large) un coup sur deux
  function strike(s, p) {
    const m = s.m, mp = mpos(s), hy = GY - 13, big = p.special, T = s.time;
    if (p.hero) {
      const wp = HP[s.tier].w;
      s.fx.push({ k: 'slash', x: mp.x + 2, y: mp.cy, c: wp.c || '#d7dde3', dir: 1, big: s.tier >= 6, t0: T, d: .24 });
      if (wp.dual) s.fx.push({ k: 'slash', x: mp.x + 5, y: mp.cy + 3, c: '#fff', dir: 1, t0: T + .06, d: .2 });
      s.mflash = T + .1; s.sparks.push({ x: mp.x + 5, y: mp.cy, t0: T }); s.hits++;
      if (m.boss) bossbar(s, m, s.win ? 1 - s.hits / Math.ceil(s.beats / 2) : 1 - s.hits * .06);
      if (s.tier >= 6) s.shake = Math.max(s.shake, T + .12);
      return;
    }
    let delay = 0; const c = m.p.a;
    if (m.s === 'quad') s.fx.push({ k: 'claw', x: HX + 8, y: hy, big, t0: T, d: .3 });
    else if (m.s === 'human') s.fx.push({ k: 'slash', x: HX + 18, y: hy, c: m.p.w, dir: -1, big, t0: T, d: .24 });
    else if (m.s === 'slime' || m.s === 'ghost') { delay = .28; s.fx.push({ k: 'proj', x0: mp.x, y0: mp.cy, c: m.s === 'ghost' ? m.p.e : c, big, t0: T, d: delay }); }
    else if (m.s === 'spider') s.fx.push({ k: 'beam', y: mp.cy, c: '#e6eef5', big, t0: T, d: .25 });
    else if (m.s === 'eye') s.fx.push({ k: 'beam', y: mp.cy, c: m.p.i, big: true, wide: big, t0: T, d: .38 });
    else if (m.s === 'bat') { delay = .2; s.fx.push({ k: 'rings', x: mp.x, y: mp.cy, c: '#fff', big, t0: T, d: .36 }); }
    else if (m.s === 'golem') { delay = .22; s.fx.push({ k: 'quake', c: m.p.A || c, big, t0: T, d: .34 }); s.shake = T + .3; }
    else if (m.s === 'dragon') s.fx.push({ k: 'breath', x0: mp.x + m.sc, y0: mp.y + 4 * m.sc, c: m.p.f, big, t0: T, d: .55 });
    else if (m.s === 'tentacle') s.fx.push({ k: 'spikes', c, big, t0: T, d: .42 });
    const r = Math.random(), at = T + delay;
    if (p.last && !s.win) s.hhit = at;
    else if (!p.special && (s.win ? r < .33 : r < .15)) { s.hparry = at; s.sparks.push({ x: HX + 22, y: GY - 15, t0: at }); s.fx.push({ k: 'ring', x: HX + 22, y: GY - 15, c: '#9ad6ff', t0: at, d: .3 }); pop(s, 'Parade', 'par', delay); }
    else if (s.win ? r < .64 : r < .32) { s.hdodge = at - .08; pop(s, 'Esquive', 'dod', delay); }
    else s.hhit = at;
    if (m.boss) s.shake = Math.max(s.shake, T + delay + (big ? .5 : .2));
  }
  function burst(s, m, x, y) {
    const rows = SHAPES[m.s], sc = m.sc; s.parts = []; s.pt0 = s.time;
    for (let j = 0; j < rows.length; j++) for (let i = 0; i < rows[j].length; i++) { const c = m.p[rows[j][i]]; if (c && (i + j) % 2 === 0) s.parts.push({ x: x + i * sc, y: y + j * sc, vx: 6 + hash(i * 7 + j) * 44, vy: -16 - hash(i + j * 5) * 56, c, s: Math.max(1, sc - 1) }); }
  }
  function endFight(s) {
    const m = s.m, mp = mpos(s); s.t = 0; s.pend = null; s.charge = 0;
    if (s.win) {
      s.phase = 'win'; burst(s, m, mp.x, mp.y);
      if (m.boss) { s.fx.push({ k: 'cross', x: mp.x, y: mp.y, w: mp.w, h: mp.h, t0: s.time, d: .7 }); s.shake = s.time + .55; bossbar(s, m, 0); }
      if (s.cine) banner(s, 'Boss terrassé', m.n, 'win');
      say(s, m.n + (m.boss ? ' terrassé.' : ' vaincu.'), 'ok');
    } else { s.phase = 'lose'; s.shake = s.time + .3; banner(s, 'Vaincu', 'Niveau ' + m.l + ' requis', 'ko'); say(s, m.n + ' est trop fort. Niveau ' + m.l + ' requis.', 'ko'); }
  }
  /* ---------- PNJ : un par zone, ils parlent de leur monde ou de tes vraies performances ---------- */
  const NPCS = [
    ['Vieux fermier', hu('#d9b44a', '#d9a57c', '#2a1c12', '#7a6a4a', undefined, '#4a3a2a'), ['Avant, les rats restaient dans les granges. Depuis que les portails se sont ouverts, ils attaquent en plein jour.', 'Le Loup alpha rôde près de la clôture. Personne ne passe en ville sans l\'avoir battu.', 'Une fourche, ça suffit pour commencer. Tout le monde commence quelque part.']],
    ['Marchande', hu('#7a3b22', '#e8b98a', '#2a1c12', '#3f7a6a', undefined, '#2c3a36'), ['La nuit, les bandits tiennent les ruelles. Leur chef ne sort que pour ceux qui valent le déplacement.', 'On dit que sous nos pieds, dans les égouts, quelque chose grossit.']],
    ['Égoutier', hu('#4a4a3a', '#c9a57c', '#2a1c12', '#5a5a3a', undefined, '#33331f'), ['Ne touche pas l\'eau. Les slimes naissent dedans, et leur roi a tout avalé jusqu\'aux grilles.', 'Ces tunnels mènent jusqu\'à la forêt. Peu de gens en ressortent pour le raconter.']],
    ['Herboriste', hu('#3a5a2a', '#e8b98a', '#2a1c12', '#5a7a3a', undefined, '#2a3a1f'), ['La forêt était claire, autrefois. C\'est le Troll qui a éteint les lucioles.', 'Les araignées tissent là où la lumière ne passe plus. Regarde où tu marches.']],
    ['Vieux mineur', hu('#8a8f96', '#c98f66', '#2a1c12', '#6b4a2b', undefined, '#3a2c22'), ['On a creusé trop profond. Le Golem dormait dans la veine de cristal bleu.', 'Les kobolds volent les lanternes. Sans lumière, la mine te garde.']],
    ['Guide de montagne', hu('#e6eef5', '#d9a57c', '#2a1c12', '#6c7d96', undefined, '#3a4660'), ['Là-haut, l\'air manque et le Yéti n\'aime pas la visite.', 'De la crête, par temps clair, on voit rougeoyer le volcan. C\'est par là que tu vas, non ?']],
    ['Forgeron', hu('#2a1210', '#b9683a', '#ffb04a', '#5a2a1a', undefined, '#2a1210'), ['Ici, on forge dans la lave. Une lame trempée au volcan ne casse pas, son porteur parfois.', 'Le Démon est venu par la cheminée du cratère. Depuis, les braises ne retombent plus.']],
    ['Vieux garde', hu('#9aa0a6', '#c9a57c', '#2a1c12', '#3a3a4a', undefined, '#22222e'), ['J\'ai servi le roi de cette citadelle. Maintenant, c\'est un dragon qui dort sur le trône.', 'Les chevaliers noirs étaient mes frères d\'armes. Ne leur montre aucune pitié, ils n\'en ont plus.']],
    ['Éclaireuse', hu('#1a1030', '#c9b0d0', '#b388ff', '#2a1a55', undefined, '#120a22'), ['Ici, ton ombre ne t\'obéit plus tout à fait. Garde-la à l\'œil.', 'Le Gardien du portail ne dort jamais. Derrière lui, le ciel lui-même est une ville.']],
    ['Prêtresse', hu('#fff6d8', '#f0d0b0', '#4da3ff', '#e9e6f4', undefined, '#c8963a'), ['Cette cité flottait au-dessus de tout. Puis l\'Archange est tombé, et elle penche depuis.', 'Les lions célestes gardaient les portes. Ils ne reconnaissent plus personne.']],
    ['Plongeur perdu', hu('#12406a', '#9ad6ff', '#6fe3ff', '#0a2a4a', undefined, '#06203a'), ['Je suis descendu chercher une épave. Je cherche maintenant la surface.', 'Le Kraken ne chasse pas. Il attend que tu passes au-dessus.']],
    ['Cartographe', hu('#3a0850', '#e8b98a', '#6fe3ff', '#22043a', undefined, '#12021f'), ['Mes cartes changent pendant que je les dessine. La faille n\'a pas de forme fixe.', 'Tu croiseras ton double, ici. Il connaît tes mouvements. Change-les.']],
    ['Astronome errant', hu('#0d0a2a', '#d0d0f0', '#9ad6ff', '#1a1040', undefined, '#06051a'), ['Chaque étoile que tu vois est une chose que le Dévoreur n\'a pas encore mangée.', 'Au bout du vide, il y a un trône. Personne ne sait qui l\'a construit.']],
    ['Dernier pèlerin', hu('#ffffff', '#f4e6ff', '#ff7ad9', '#b9a5e6', undefined, '#8a7ac0'), ['Tu es arrivé là où les histoires s\'arrêtent. Le Souverain attend le seul qui ira jusqu\'au niveau 100.', 'J\'ai mis une vie à monter ces marches. Toi, tu les montes une séance après l\'autre.']]
  ];
  function perfLine(s) {
    const t = s.stats, out = [];
    if (!t || !t.n) return 'Tu n\'as encore rien prouvé. Va soulever quelque chose, on en reparle.';
    if (t.streak >= 3) out.push(t.streak + ' jours d\'entraînement d\'affilée ? On commence à parler de toi par ici.');
    if (t.days >= 3) out.push('Ça fait ' + t.days + ' jours qu\'on ne t\'a pas vu t\'entraîner. Les monstres, eux, ne prennent pas de repos.');
    if (t.full) out.push('Ta dernière séance était complète. Ça se voit à ta façon de tenir ton arme.');
    else if (t.spam) out.push('Il paraît que tu as martelé le même mouvement toute une séance. Têtu. J\'aime ça.');
    else out.push('Tu as écourté ta dernière séance, non ? Le prochain boss ne te fera pas ce cadeau.');
    if (t.rec) out.push('Un record à ta dernière séance, à ce qu\'on raconte. Continue comme ça.');
    if (t.planned) out.push(t.did >= t.planned ? 'Toutes tes séances de la semaine sont faites. Rien à redire.' : t.did + ' séance' + (t.did > 1 ? 's' : '') + ' sur ' + t.planned + ' cette semaine. Il reste du chemin.');
    let nb = null; ZONES.forEach(z => z.m.forEach(m => { if (m.boss && m.l > s.level && !nb) nb = m; }));
    if (nb) out.push(nb.n + ' t\'attend au niveau ' + nb.l + '. Encore ' + (nb.l - s.level) + ' niveau' + (nb.l - s.level > 1 ? 'x' : '') + ' à gagner.');
    return out[Math.floor(Math.random() * out.length)];
  }
  function npcLine(s) { const lore = NPCS[s.z][2]; return ++s.talk % 2 ? lore[Math.floor(Math.random() * lore.length)] : perfLine(s); }
  function bubble(s, name, text) {
    if (!s.box || !s.box.isConnected) return;
    const old = s.box.querySelector('.bubble'); if (old) old.remove();
    if (!name) return;
    const b = document.createElement('div'), n = document.createElement('b'), p = document.createElement('p');
    b.className = 'bubble'; n.textContent = name; p.textContent = text; b.appendChild(n); b.appendChild(p); s.box.appendChild(b);
  }
  function pop(s, txt, cls, delay) {
    if (!s.box || !s.box.isConnected) return;
    const d = document.createElement('div'); d.className = 'fxt ' + cls; d.textContent = txt; d.style.animationDelay = (delay || 0) + 's'; s.box.appendChild(d);
    setTimeout(() => d.remove(), 1400 + (delay || 0) * 1000);
  }
  function update(s, dt) {
    s.time += dt; s.t += dt;
    const m = s.m, e = s.ev;
    if (s.phase === 'walk') {
      s.sx += 26 * dt;
      if (s.doneAt && s.time > s.doneAt) { s.doneAt = 0; if (s.onDone) s.onDone(); return; }
      if (s.queue.length) { if (s.t > 1) nextEvent(s); }
      else if (!s.doneAt && s.t > 2.2 && ++s.enc % 4 === 2) { const d = NPCS[s.z]; s.npc = { n: d[0], s: 'human', sc: 2, p: d[1], npc: 1 }; s.mx = W + 4; s.phase = 'npcIn'; s.t = 0; say(s, d[0] + ' vient à ta rencontre.'); }
      else if (!s.doneAt && s.t > 2.2) { s.m = pick(s); if (!s.m) { s.t = 0; return; } s.mx = W + 4; s.phase = 'approach'; s.t = 0; say(s, (s.m.boss ? 'BOSS · ' : '') + s.m.n + ' approche.', s.m.boss ? 'boss' : ''); }
    } else if (s.phase === 'approach') {
      s.sx += 12 * dt; s.mx -= (s.cineNext ? 42 : 70) * dt;
      if (s.mx <= HX + 36) { s.mx = HX + 36; beginFight(s, !!s.cineNext); s.cineNext = false; }
    } else if (s.phase === 'fight') {
      const b = Math.floor(s.t / BEAT);
      if (b !== s.beat) {
        s.beat = b;
        if (b >= s.beats) { endFight(s); return; }
        const hero = b % 2 === 0, special = !hero && m.boss && ((b - 1) / 2) % 2 === 1;
        s.pend = { at: s.time + BEAT * .45, hero, special, last: b === s.beats - 1 }; if (special) s.charge = s.pend.at;
      }
      if (s.pend && s.time >= s.pend.at) { const p = s.pend; s.pend = null; strike(s, p); }
    } else if (s.phase === 'win') {
      if (s.t > (s.cine ? 2.6 : 1.2)) { bossbar(s, null); s.m = null; const c = s.cine; s.cine = false; if (c && s.ev) endEvent(s); else { s.phase = 'walk'; s.t = 0; } }
    } else if (s.phase === 'lose') {
      if (s.t > .9) s.mx += 50 * dt;
      if (s.t > 3.5) { bossbar(s, null); s.m = null; s.phase = 'walk'; s.t = 0; }
    } else if (s.phase === 'npcIn') {
      s.sx += 14 * dt; s.mx -= 46 * dt;
      if (s.mx <= HX + 34) { s.mx = HX + 34; s.phase = 'npcTalk'; s.t = 0; bubble(s, s.npc.n, npcLine(s)); }
    } else if (s.phase === 'npcTalk') {
      if (s.t > 6) { bubble(s); s.phase = 'npcOut'; s.t = 0; }
    } else if (s.phase === 'npcOut') {
      s.sx += 26 * dt; s.mx -= 40 * dt;
      if (s.mx < -24) { s.npc = null; s.phase = 'walk'; s.t = 0; }
    } else if (s.phase === 'ev') {
      if (e.t === 'zone') { s.sx += 70 * dt; if (s.t > 1.2 && s.z !== e.i) s.z = e.i; }
      if (s.t > (e.t === 'tier' ? 3 : 2.4)) endEvent(s);
    }
    s.sparks = s.sparks.filter(k => s.time < k.t0 + .2);
    s.fx = s.fx.filter(k => s.time < k.t0 + k.d);
  }
  function drawFx(s, k) {
    const T = s.time; if (T < k.t0) return;
    const a = (T - k.t0) / k.d, mx = s.mx;
    g.globalAlpha = Math.max(0, 1 - a);
    if (k.k === 'slash') {
      const r = (k.big ? 10 : 6) + a * 4;
      for (let an = -1.2; an <= 1.2; an += .16) { R(k.c, k.x + k.dir * Math.cos(an) * r * .8, k.y + Math.sin(an) * r * 1.5, 2, 2); R('#fff', k.x + k.dir * Math.cos(an) * (r - 2) * .8, k.y + Math.sin(an) * (r - 2) * 1.5, 1, 1); }
    } else if (k.k === 'claw') {
      const len = Math.min(1, a * 2.5) * (k.big ? 14 : 9);
      for (let j = 0; j < 3; j++) for (let i = 0; i < len; i++) R(j === 1 ? '#ff5d73' : '#fff', k.x - 5 + j * 4 + i * .6, k.y - 8 + i * 1.5, k.big ? 2 : 1, 2);
    } else if (k.k === 'proj') {
      g.globalAlpha = 1; const x = k.x0 + (HX + 12 - k.x0) * a, y = k.y0 + (GY - 13 - k.y0) * a - Math.sin(a * Math.PI) * 7, z = k.big ? 7 : 4;
      R(k.c, x, y, z, z); R('#fff', x + 1, y + 1, z - 2, z - 2); g.globalAlpha = .5; R(k.c, x + z, y + 1, z, z - 2); R(k.c, x + z * 2, y + 2, z - 1, z - 3);
    } else if (k.k === 'beam') {
      const h = k.wide ? 9 : k.big ? 5 : 2, x0 = HX + 12, len = mx - x0 + 2;
      g.globalAlpha = (1 - a) * .5; R(k.c, x0, k.y - h, len, h * 2); g.globalAlpha = 1 - a; R(k.c, x0, k.y - h / 2, len, h); R('#fff', x0, k.y - Math.max(1, h / 4), len, Math.max(1, Math.round(h / 2)));
    } else if (k.k === 'rings') {
      g.globalAlpha = 1;
      for (let n = 0; n < 3; n++) { const p = a * 1.3 - n * .2; if (p > 0 && p < 1) { const x = k.x - p * (k.x - HX - 12), z = k.big ? 9 : 5; R(k.c, x, k.y - z, 1, z * 2); R(k.c, x + 1, k.y - z - 2, 1, 2); R(k.c, x + 1, k.y + z, 1, 2); } }
    } else if (k.k === 'quake') {
      g.globalAlpha = 1; const fx0 = mx - a * (mx - HX - 6), u = k.big ? 4 : 2;
      for (let i = 0; i < 5; i++) R(i % 2 ? k.c : '#fff', fx0 + i * 3, GY - (5 - i) * u, 2, (5 - i) * u);
      g.globalAlpha = .5; R('#fff', fx0 - 4, GY - 1, 22, 1);
    } else if (k.k === 'breath') {
      g.globalAlpha = 1; const reach = Math.min(1, a * 2.6);
      for (let i = 0; i < 30; i++) { const f = i / 30; if (f > reach) break; const j = hash(i + Math.floor(T * 24)) - .5; R(i % 3 ? k.c : '#ffd84a', k.x0 - (k.x0 - HX - 8) * f, k.y0 + (GY - 14 - k.y0) * f + j * (k.big ? 14 : 8) * (f + .2), k.big ? 3 : 2, k.big ? 3 : 2); }
    } else if (k.k === 'spikes') {
      g.globalAlpha = 1; const hg = Math.sin(a * Math.PI) * (k.big ? 30 : 16);
      for (let j = 0; j < (k.big ? 5 : 3); j++) { const x = HX + (k.big ? -4 : 3) + j * 6, hh = hg * (j % 2 ? .7 : 1); R(k.c, x, GY - hh, 3, hh); R('#fff', x + 1, GY - hh - 1, 1, 2); }
    } else if (k.k === 'ring') {
      const r = 3 + a * 10; for (let an = 0; an < 6.3; an += .35) R(k.c, k.x + Math.cos(an) * r, k.y + Math.sin(an) * r, 1, 1);
    } else if (k.k === 'cross') {
      g.globalAlpha = (1 - a) * .7; R('#fff', 0, 0, W, H); g.globalAlpha = 1 - a;
      const n = Math.max(k.w, k.h) + 12;
      for (let i = 0; i < n * Math.min(1, a * 4); i++) { R('#fff', k.x - 6 + i * (k.w + 12) / n, k.y - 6 + i * (k.h + 12) / n, 3, 3); R('#9ad6ff', k.x + k.w + 6 - i * (k.w + 12) / n, k.y - 6 + i * (k.h + 12) / n, 3, 3); }
    }
    g.globalAlpha = 1;
  }
  /* ---------- rendu « réaliste » : haute définition, silhouettes lisses, lumière, brume, météo ---------- */
  const RK = 4;
  const rgba = (h, a) => { let c = h.slice(1); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; const n = parseInt(c, 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
  // par zone : ciel [haut, bas], astre [x, y, rayon, couleur], 3 plans [forme, couleur, hauteur], sol [haut, bas], brume, météo [type, couleur]
  const RZ = [
    { sky: ['#4f7389', '#cfd9cc'], orb: [112, 26, 7, '#fff3c8'], L: [['hill', '#7f9c93', 30], ['hill', '#4f6f58', 18], ['tree', '#24382a', 20]], gr: ['#3f5a3a', '#1c2a1b'], fog: '#d8e4d6', wx: ['mote', '#fff8d0'] },
    { sky: ['#12101f', '#a0523f'], orb: [30, 22, 6, '#f1e6d0'], L: [['city', '#33283c', 40], ['city', '#1a1522', 30], ['rock', '#0c0a10', 7]], gr: ['#2c2a36', '#0e0d13'], fog: '#b06a55', wx: ['rain', '#c8d8ff'] },
    { sky: ['#070d0b', '#1c2e28'], L: [['pillar', '#16241f', 0], ['pillar', '#0b1411', 0], ['rock', '#060c0a', 6]], gr: ['#17352c', '#06100d'], fog: '#3f9a7a', wx: ['mote', '#7fe0b0'] },
    { sky: ['#050d09', '#1c3a26'], orb: [100, 20, 5, '#d8f0d0'], L: [['tree', '#14291c', 62], ['tree', '#0a170f', 74], ['rock', '#050b07', 6]], gr: ['#16281a', '#070e09'], fog: '#5a9a70', wx: ['mote', '#d8ff8a'] },
    { sky: ['#09080c', '#241c18'], L: [['rock', '#1c181c', 40], ['pillar', '#110e12', 0], ['spire', '#08070a', 9]], gr: ['#2a2522', '#0c0a0a'], fog: '#c8813a', wx: ['ember', '#ffb84a'] },
    { sky: ['#56799f', '#e3ecf4'], orb: [108, 22, 6, '#ffffff'], L: [['peak', '#93a6bf', 58], ['peak', '#5f7190', 36], ['tree', '#22343a', 12]], gr: ['#e6eef5', '#9db1c6'], fog: '#ffffff', wx: ['snow', '#ffffff'] },
    { sky: ['#0c0404', '#b8431a'], orb: [70, 96, 26, '#ff6a1a'], L: [['peak', '#3d1510', 62], ['spire', '#170807', 26], ['rock', '#0a0303', 8]], gr: ['#2a120e', '#090302'], fog: '#ff5a14', wx: ['ember', '#ff9a3a'] },
    { sky: ['#05050f', '#2a2148'], orb: [28, 24, 7, '#e9e6ff'], star: 1, L: [['city', '#1c1c30', 50], ['pillar', '#0e0e1a', 0], ['rock', '#07070d', 6]], gr: ['#2c2c3c', '#0b0b12'], fog: '#7a70c0', wx: ['rain', '#b0b8ff'] },
    { sky: ['#05030b', '#24124a'], orb: [86, 58, 16, '#8b6cff'], L: [['pillar', '#170d2e', 0], ['pillar', '#0a0616', 0], ['spire', '#05030b', 8]], gr: ['#171026', '#05030b'], fog: '#8b6cff', wx: ['mote', '#b388ff'] },
    { sky: ['#2b5cc2', '#ffe2b8'], orb: [110, 26, 9, '#fff6d8'], L: [['city', '#b9c8ea', 56], ['city', '#e9e6f4', 34], ['rock', '#ffffff', 7]], gr: ['#f4f6ff', '#b4c2e6'], fog: '#fff0d2', wx: ['mote', '#ffffff'] },
    { sky: ['#01050c', '#06243f'], L: [['spire', '#08203a', 66], ['spire', '#030b16', 40], ['rock', '#02070d', 7]], gr: ['#0a1a2c', '#02060c'], fog: '#3aa8c8', wx: ['bubble', '#9ad6ff'] },
    { sky: ['#0b0116', '#5a0c5e'], orb: [40, 40, 10, '#6fe3ff'], L: [['spire', '#2c0644', 70], ['spire', '#0d0118', 34], ['rock', '#06000c', 6]], gr: ['#1a0330', '#06000c'], fog: '#ff4ad9', wx: ['mote', '#6fe3ff'] },
    { sky: ['#010107', '#100c30'], orb: [104, 34, 14, '#5a4ab8'], star: 1, L: [['rock', '#16142e', 30], ['spire', '#08071c', 22], ['rock', '#030310', 6]], gr: ['#16162a', '#04040b'], fog: '#8b6cff', wx: ['mote', '#9ad6ff'] },
    { sky: ['#0a0620', '#e08ac0'], orb: [72, 30, 12, '#fff6d8'], star: 1, L: [['city', '#8a5aa8', 64], ['pillar', '#3a1a6a', 0], ['rock', '#f4eaff', 6]], gr: ['#d9c8ff', '#7d6bbd'], fog: '#ffb4e6', wx: ['mote', '#ffffff'] }
  ];
  function layer(sx, par, type, col, hb, seed) {
    g.fillStyle = col; g.beginPath();
    if (type === 'hill') { g.moveTo(0, GY + 1); for (let x = 0; x <= W; x += 3) { const wx = x + sx * par + seed * 50; g.lineTo(x, GY - hb - Math.sin(wx / 37) * hb * .35 - Math.sin(wx / 13) * hb * .12); } g.lineTo(W, GY + 1); g.fill(); return; }
    const step = { peak: 58, city: 34, tree: 30, pillar: 52, spire: 26, rock: 44 }[type];
    each(sx + seed * 200, par, step, (x, k) => {
      const r = hash(k + seed * 31), h = hb * (.6 + r * .8);
      if (type === 'peak') { g.moveTo(x - h * .75, GY + 1); g.lineTo(x - h * .1, GY - h); g.lineTo(x + h * .06, GY - h * .92); g.lineTo(x + h * .8, GY + 1); g.closePath(); }
      else if (type === 'city') { const w = 14 + r * 10; g.rect(x, GY - h, w, h + 1); g.moveTo(x - 4, GY - h + 1); g.quadraticCurveTo(x + w * .25, GY - h - 1, x + w / 2, GY - h - 7); g.quadraticCurveTo(x + w * .75, GY - h - 1, x + w + 4, GY - h + 1); g.closePath(); if (r > .5) { g.rect(x + w * .3, GY - h - 13, w * .4, 7); g.moveTo(x + w * .15, GY - h - 12); g.lineTo(x + w / 2, GY - h - 18); g.lineTo(x + w * .85, GY - h - 12); g.closePath(); } }
      else if (type === 'tree') { g.rect(x + 3, GY - h, 2.5 + r * 2, h + 1); g.moveTo(x + 14 + r * 6, GY - h); g.ellipse(x + 4, GY - h, 10 + r * 6, 7 + r * 5, 0, 0, 7); }
      else if (type === 'pillar') { g.rect(x, 0, 8, GY + 1); g.rect(x - 2, 0, 12, 4); g.rect(x - 2, GY - 4, 12, 5); }
      else if (type === 'spire') { g.moveTo(x - 3 - r * 3, GY + 1); g.lineTo(x + r * 2, GY - h); g.lineTo(x + 4 + r * 3, GY + 1); g.closePath(); }
      else { g.moveTo(x - 8, GY + 1); g.quadraticCurveTo(x - 6, GY - h * .6, x, GY - h * .55); g.quadraticCurveTo(x + 9, GY - h * .5, x + 11, GY + 1); g.closePath(); }
    }, type === 'pillar');
    g.fill();
  }
  function bgReal(z, sx, T) {
    const Z = RZ[z];
    let gr = g.createLinearGradient(0, 0, 0, GY); gr.addColorStop(0, Z.sky[0]); gr.addColorStop(1, Z.sky[1]); g.fillStyle = gr; g.fillRect(0, 0, W, GY + 1);
    if (Z.star) for (let i = 0; i < 46; i++) { g.fillStyle = rgba('#ffffff', .35 + .5 * Math.abs(Math.sin(T * 1.5 + i * 1.7))); g.fillRect(hash(i) * W, hash(i + 60) * GY * .7, .7, .7); }
    if (Z.orb) { const [ox, oy, r, c] = Z.orb; gr = g.createRadialGradient(ox, oy, r * .4, ox, oy, r * 4.5); gr.addColorStop(0, rgba(c, .55)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, GY); g.fillStyle = c; g.beginPath(); g.arc(ox, oy, r, 0, 7); g.fill(); }
    Z.L.forEach((l, i) => {
      layer(sx, [.12, .4, .75][i], l[0], l[1], l[2], i + 1);
      if (i < 2) { gr = g.createLinearGradient(0, GY - 46, 0, GY); gr.addColorStop(0, rgba(Z.fog, 0)); gr.addColorStop(1, rgba(Z.fog, i ? .3 : .42)); g.fillStyle = gr; g.fillRect(0, GY - 46, W, 47); }
    });
    gr = g.createLinearGradient(0, GY, 0, H); gr.addColorStop(0, Z.gr[0]); gr.addColorStop(1, Z.gr[1]); g.fillStyle = gr; g.fillRect(0, GY, W, H - GY);
    g.fillStyle = rgba(Z.fog, .3); g.fillRect(0, GY, W, .6);
    g.fillStyle = 'rgba(0,0,0,.22)'; each(sx, 1, 23, (x, k) => { g.beginPath(); g.ellipse(x, GY + 6 + hash(k) * 14, 5 + hash(k + 2) * 5, 1, 0, 0, 7); g.fill(); });
  }
  function postReal(z, T) {
    const [k, c] = RZ[z].wx;
    if (k === 'rain') { g.strokeStyle = rgba(c, .32); g.lineWidth = .45; g.beginPath(); for (let i = 0; i < 46; i++) { const px = ((hash(i) * W * 1.2 - T * 46) % W + W) % W, py = (hash(i + 7) * H + T * (230 + hash(i) * 90)) % H; g.moveTo(px, py); g.lineTo(px - 1.6, py + 6.5); } g.stroke(); }
    else if (k === 'snow') { g.fillStyle = rgba(c, .85); for (let i = 0; i < 34; i++) { g.beginPath(); g.arc((hash(i) * W + Math.sin(T + i) * 6 + T * 7) % W, (hash(i + 3) * H + T * (14 + hash(i) * 14)) % H, .5 + hash(i + 5) * .7, 0, 7); g.fill(); } }
    else if (k === 'bubble') { g.strokeStyle = rgba(c, .5); g.lineWidth = .35; for (let i = 0; i < 16; i++) { g.beginPath(); g.arc((hash(i) * W + Math.sin(T * 1.5 + i) * 4 + W) % W, H - ((T * (12 + hash(i) * 10) + hash(i + 4) * H) % H), .8 + hash(i + 8) * 1.2, 0, 7); g.stroke(); } }
    else { const em = k === 'ember'; g.shadowColor = c; g.shadowBlur = 8; for (let i = 0; i < (em ? 22 : 16); i++) { g.fillStyle = rgba(c, .35 + .55 * Math.abs(Math.sin(T * 2 + i * 2.3))); g.beginPath(); g.arc((hash(i) * W + Math.sin(T * .8 + i) * 8 + W) % W, GY + 6 - ((T * (em ? 16 : 5) * (1 + hash(i + 9)) + hash(i + 4) * 100) % 104), em ? .7 : .55, 0, 7); g.fill(); } g.shadowBlur = 0; }
    const v = g.createRadialGradient(W / 2, H * .52, H * .3, W / 2, H * .52, H * .86); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.66)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  }
  function heroReal(x, tier, walking, atk, ak, T) {
    const P = HP[tier], w = P.w, fy = GY, sw = walking ? Math.sin(T * 10) : 0, bob = walking ? Math.abs(Math.sin(T * 10)) * .8 : Math.sin(T * 2) * .3;
    const cx = x + 10, hipY = fy - 10 - bob, shY = fy - 19 - bob, hdY = fy - 22.6 - bob;
    const line = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(cx, fy + .6, 8, 1.6, 0, 0, 7); g.fill();
    if (P.aura) { const c = P.aura === 'rb' ? RB[Math.floor(T * 3) % RB.length] : P.aura, gr = g.createRadialGradient(cx, fy - 14, 2, cx, fy - 14, 21); gr.addColorStop(0, rgba(c, .5)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(cx - 22, fy - 36, 44, 40); }
    if (P.wings) { const fl = Math.sin(T * 4) * 2; g.fillStyle = rgba(P.wings, .88); [0, 4].forEach((o, i) => { g.beginPath(); g.moveTo(cx - 2, shY + 2 + o); g.quadraticCurveTo(cx - 12, shY - 13 - fl + o * 1.5, cx - 21 + i * 4, shY - 4 - fl + o); g.quadraticCurveTo(cx - 12, shY + 2 + o, cx - 3, shY + 7 + o); g.fill(); }); }
    const cp = P.cape || P.scarf;
    if (cp) { const f = Math.sin(T * 5) * 1.5 + (walking ? 2 : 0); g.fillStyle = cp; g.beginPath(); g.moveTo(cx - 2, shY); g.quadraticCurveTo(cx - 8 - f, shY + 6, cx - 9 - f * 1.5, P.cape ? fy - 3 : shY + 5 + f); g.lineTo(cx - 4, P.cape ? fy - 5 : shY + 3); g.lineTo(cx + 1, shY + 2); g.fill(); }
    // bras arrière, seconde lame, bouclier
    g.strokeStyle = P.a; g.lineWidth = 2.3; line(cx - 3, shY + 1.5, cx - 4.5, shY + 8);
    if (w.dual) { if (w.glow) { g.shadowColor = w.c; g.shadowBlur = 9; } g.strokeStyle = w.c; g.lineWidth = 1.1; line(cx - 4.5, shY + 8, cx - 8.5, shY + 15); g.shadowBlur = 0; }
    // jambes
    [[-1.6, sw], [1.6, -sw]].forEach(([o, q]) => { g.strokeStyle = P.p; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + o, hipY); g.lineTo(cx + o + q * 1.5, hipY + 5); g.lineTo(cx + o + q * 3, fy - 1.4); g.stroke(); g.strokeStyle = P.o; g.lineWidth = 2.5; line(cx + o + q * 3, fy - 1.2, cx + o + q * 3 + 1.8, fy - 1); });
    // buste
    const tp = () => { g.beginPath(); g.moveTo(cx - 4.5, shY); g.lineTo(cx + 4.5, shY); g.lineTo(cx + 3, hipY + 1); g.lineTo(cx - 3, hipY + 1); g.closePath(); };
    tp(); g.fillStyle = P.t; g.fill();
    const sh = g.createLinearGradient(cx - 5, 0, cx + 5, 0); sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(.6, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(255,255,255,.2)'); tp(); g.fillStyle = sh; g.fill();
    g.fillStyle = P.b; g.fillRect(cx - 3.2, hipY - 1, 6.4, 1.3);
    if (P.shield) { g.fillStyle = P.shield; g.beginPath(); g.ellipse(cx - 5.5, shY + 7, 2.8, 4.4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.ellipse(cx - 5, shY + 5.5, 1, 1.8, 0, 0, 7); g.fill(); }
    // tête
    g.fillStyle = P.s; g.beginPath(); g.arc(cx, hdY, 3, 0, 7); g.fill();
    g.fillStyle = P.h; g.beginPath(); g.arc(cx, hdY, 3.2, Math.PI * .62, Math.PI * 1.92); g.closePath(); g.fill();
    if (P.mask) { g.fillStyle = P.mask; g.beginPath(); g.arc(cx, hdY, 3.1, -.1, Math.PI * .8); g.closePath(); g.fill(); }
    if (P.hat) { g.fillStyle = P.h; g.beginPath(); g.moveTo(cx - 7, hdY - 1); g.lineTo(cx + .5, hdY - 6); g.lineTo(cx + 7.5, hdY - 1); g.closePath(); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - 7, hdY - 1.4, 14.5, .6); }
    if (P.e !== EYE) { g.shadowColor = P.e; g.shadowBlur = 7; } g.fillStyle = P.e; g.fillRect(cx + 1.2, hdY - .5, 1.1, .8); g.shadowBlur = 0;
    if (P.plume) { g.strokeStyle = P.plume; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, hdY - 3); g.quadraticCurveTo(cx - 2, hdY - 8, cx - 6, hdY - 5 + Math.sin(T * 5)); g.stroke(); }
    if (P.halo) { g.shadowColor = '#fff3b0'; g.shadowBlur = 9; g.strokeStyle = '#fff3b0'; g.lineWidth = .8; g.beginPath(); g.ellipse(cx, hdY - 6.5, 4.4, 1.2, 0, 0, 7); g.stroke(); g.shadowBlur = 0; }
    // bras avant et arme
    const hxh = cx + (atk ? 7 : 5), hyh = shY + (atk ? 4 : 7), an = atk ? -1.9 + Math.max(0, Math.min(1, (ak - .38) / .42)) * 2.5 : -1.2, dx = Math.cos(an), dy = Math.sin(an);
    g.strokeStyle = P.a; g.lineWidth = 2.4; line(cx + 3, shY + 1.5, hxh, hyh);
    if (w.k === 'fork') {
      g.strokeStyle = '#8a6a3f'; g.lineWidth = 1.1; line(hxh - dx * 5, hyh - dy * 5, hxh + dx * 15, hyh + dy * 15);
      g.strokeStyle = '#c3c9cf'; g.lineWidth = .8; [-1, 0, 1].forEach(o => line(hxh + dx * 15 - dy * o * 1.6, hyh + dy * 15 + dx * o * 1.6, hxh + dx * 19 - dy * o * 1.6, hyh + dy * 19 + dx * o * 1.6));
      line(hxh + dx * 15 + dy * 1.6, hyh + dy * 15 - dx * 1.6, hxh + dx * 15 - dy * 1.6, hyh + dy * 15 + dx * 1.6);
      return;
    }
    const L = w.len * 1.9 + 3;
    if (atk) { g.strokeStyle = rgba(w.c, .35); g.lineWidth = 2.6; g.beginPath(); g.arc(hxh, hyh, L - 1, an - 1.2, an); g.stroke(); }
    if (w.glow) { g.shadowColor = w.c; g.shadowBlur = 12; }
    g.strokeStyle = w.c; g.lineWidth = w.thick ? 2 : 1.2; line(hxh + dx * 1.5, hyh + dy * 1.5, hxh + dx * L, hyh + dy * L); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = .4; line(hxh + dx * 2, hyh + dy * 2, hxh + dx * (L - 1), hyh + dy * (L - 1));
    g.strokeStyle = '#c8a04a'; g.lineWidth = 1; line(hxh + dx * 1.5 - dy * 1.8, hyh + dy * 1.5 + dx * 1.8, hxh + dx * 1.5 + dy * 1.8, hyh + dy * 1.5 - dx * 1.8);
  }
  // monstres du mode réaliste : chaque famille est dessinée à la main (formes pleines, ombrage, yeux luisants, animation),
  // avec des variantes par monstre (crinière, cornes, couronne, capuche, bâton, ailes…)
  const XT = {
    'Loup alpha': 'mane', 'Lion céleste': 'mane', 'Crocodile': 'croc', 'Salamandre': 'croc fire', 'Jeune léviathan': 'croc', 'Chien de lave': 'fire', 'Bête d\'ombre': 'fire', 'Sanglier': 'tusk',
    'Voleur': 'hood', 'Assassin sans visage': 'hood', 'Liche': 'hood robe staff', 'Chef des bandits': 'cape', 'Diablotin': 'horns', 'Chevalier noir': 'cape horns', 'Archange déchu': 'wings', 'Le Souverain': 'crown cape',
    'Héraut du trône': 'robe staff', 'Double sombre': 'cape', 'Gobelin': 'ears', 'Kobold': 'ears', 'Orc': 'tusk', 'Soldat d\'ombre': 'hood', 'Squelette': '', 'Garde maudit': 'cape',
    'Roi slime': 'crown', 'Ver des roches': 'seg', 'Corbeau': 'beak', 'Harpie': 'beak',
    'Démon': 'horns', 'Gardien du portail': 'horns crystal', 'Gardien de la faille': 'crystal', 'Élémentaire de glace': 'crystal', 'Golem d\'or': 'crystal', 'Colosse céleste': 'crystal', 'Titan du vide': 'horns',
    'Élémentaire de feu': 'flame', 'Séraphin': 'halo', 'Méduse abyssale': 'jelly', 'Entité sans nom': 'many'
  };
  const tint = (h, f) => { let c = h.slice(1); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2]; const n = parseInt(c, 16), k = v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)); return `rgb(${k(n >> 16)},${k(n >> 8 & 255)},${k(n & 255)})`; };
  const vg = (col, y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, tint(col, .24)); gr.addColorStop(.5, col); gr.addColorStop(1, tint(col, -.55)); return gr; };
  const el = (cx, cy, rx, ry, rot) => { g.beginPath(); g.ellipse(cx, cy, Math.max(.1, rx), Math.max(.1, ry), rot || 0, 0, 7); g.fill(); };
  const ln = (p, wd, col) => { g.strokeStyle = col; g.lineWidth = wd; g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.stroke(); };
  const pol = p => { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); };
  const glw = (col, cx, cy, r) => { g.shadowColor = col; g.shadowBlur = 12; g.fillStyle = col; el(cx, cy, r, r); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.8)'; el(cx, cy, r * .4, r * .4); };
  const VEC = {
    quad(C, w, h, u, T, F) {
      const a = C('a'), b = C('b') || a, st = Math.sin(T * 8), croc = /croc/.test(F), by = croc ? .64 : .5, ry = croc ? .19 : .27;
      g.strokeStyle = b; g.lineWidth = u * (croc ? 1.7 : .9); g.beginPath(); g.moveTo(w * .86, h * by); g.quadraticCurveTo(w * 1.02, h * (by - .05), w * (croc ? 1.14 : 1), h * (croc ? by + .22 : by - .42 + st * .04)); g.stroke();
      [[.3, 1], [.42, -1], [.72, -1], [.84, 1]].forEach(([px, d], i) => ln([w * px, h * (by + .1), w * px + d * st * u * .8, h * .8, w * px + d * st * u * 1.4 - u * .4, h], u * (croc ? 1 : 1.3), tint(a, i % 2 ? -.45 : -.2)));
      g.fillStyle = vg(a, h * (by - ry), h * (by + ry)); el(w * .58, h * by, w * .34, h * ry);
      if (/mane/.test(F)) { g.fillStyle = vg(b, h * .05, h * .8); el(w * .31, h * (by - .06), w * .15, h * .38); }
      if (croc || /fire/.test(F)) { g.fillStyle = b; for (let i = 0; i < 6; i++) pol([w * (.36 + i * .09), h * (by - ry + .03), w * (.4 + i * .09), h * (by - ry - .14), w * (.44 + i * .09), h * (by - ry + .03)]); }
      g.fillStyle = vg(a, h * (by - .4), h * (by + .2)); el(w * .2, h * (by - .1), w * .14, h * .24); el(w * .08, h * (by - .02), w * (croc ? .17 : .1), h * (croc ? .1 : .13));
      if (!croc) { g.fillStyle = tint(b, -.2); pol([w * .19, h * (by - .3), w * .23, h * (by - .56), w * .29, h * (by - .28)]); pol([w * .12, h * (by - .28), w * .15, h * (by - .5), w * .2, h * (by - .3)]); }
      g.fillStyle = C('n') || '#ffffff'; pol([w * .03, h * (by + .04), w * .06, h * (by + (/tusk/.test(F) ? .3 : .2)), w * .1, h * (by + .05)]);
      if (/fire/.test(F)) { g.shadowColor = b; g.shadowBlur = 10; ln([w * .4, h * by, w * .5, h * (by - .1), w * .6, h * (by + .06), w * .72, h * (by - .06)], u * .35, b); g.shadowBlur = 0; }
      glw(C('e'), w * .17, h * (by - .16), u * .42);
    },
    human(C, w, h, u, T, F, act, m) {
      const cx = w * .5, bob = Math.sin(T * 2.2) * u * .15, shY = h * .36 + bob, hipY = h * .7, hdY = h * .19 + bob, r = w * .26, b = C('b'), wc = C('w');
      if (/wings/.test(F)) { const fl = Math.sin(T * 4) * h * .05; g.fillStyle = vg('#e9e6f4', 0, h * .7); [0, h * .12].forEach(o => { g.beginPath(); g.moveTo(cx, shY + o); g.quadraticCurveTo(w * 1.2, -h * .25 - fl + o, w * 1.75, h * .1 - fl + o); g.quadraticCurveTo(w * 1.2, h * .3 + o, cx + u, shY + h * .2 + o); g.fill(); }); }
      if (/cape/.test(F)) { const f = Math.sin(T * 4) * u * .5; g.fillStyle = tint(b, -.5); g.beginPath(); g.moveTo(cx, shY); g.quadraticCurveTo(w * .95 + f, h * .6, w * 1.05 + f, h * .97); g.lineTo(cx + u, h * .9); g.closePath(); g.fill(); }
      if (/robe/.test(F)) { g.fillStyle = vg(b, shY, h); pol([cx - w * .3, shY, cx + w * .3, shY, cx + w * .42, h, cx - w * .42, h]); }
      else { ln([cx - u * .9, hipY, cx - u * 1.1, h], u * 1.3, C('l')); ln([cx + u * .9, hipY, cx + u * 1.1, h], u * 1.3, tint(C('l'), -.3)); g.fillStyle = vg(b, shY, hipY + u); pol([cx - w * .32, shY, cx + w * .32, shY, cx + w * .22, hipY + u * .4, cx - w * .22, hipY + u * .4]); }
      g.fillStyle = C('s'); el(cx, hdY, r, r);
      const hood = /hood/.test(F); g.fillStyle = vg(C('h'), hdY - r, hdY + r); g.beginPath(); g.arc(cx, hdY, r * (hood ? 1.22 : 1.08), -Math.PI * (hood ? 1.02 : .85), Math.PI * (hood ? .55 : .4)); g.closePath(); g.fill();
      if (hood) pol([cx, hdY - r * 1.2, cx + r * 1.5, hdY - r * 1.5, cx + r, hdY - r * .4]);
      if (/ears/.test(F)) { g.fillStyle = C('s'); pol([cx - r * .2, hdY - r * .2, cx + r * 1.9, hdY - r * .9, cx + r * .6, hdY + r * .3]); }
      if (/horns/.test(F)) { g.fillStyle = tint(C('h'), .35); pol([cx - r * .7, hdY - r * .7, cx - r * 1.1, hdY - r * 2, cx - r * .1, hdY - r]); pol([cx + r * .3, hdY - r * .9, cx + r * 1.1, hdY - r * 2, cx + r * .9, hdY - r * .6]); }
      if (/tusk/.test(F)) { g.fillStyle = '#f2e9d8'; pol([cx - r * .7, hdY + r * .5, cx - r * .5, hdY - r * .1, cx - r * .3, hdY + r * .6]); }
      if (/crown/.test(F)) { g.shadowColor = '#ffd76a'; g.shadowBlur = 10; g.fillStyle = '#ffd76a'; pol([cx - r, hdY - r * .8, cx - r, hdY - r * 1.9, cx - r * .4, hdY - r * 1.3, cx, hdY - r * 2.1, cx + r * .4, hdY - r * 1.3, cx + r, hdY - r * 1.9, cx + r, hdY - r * .8]); g.shadowBlur = 0; }
      glw(C('e'), cx - r * .45, hdY, u * .3);
      if (m.npc || !wc) { ln([cx - w * .28, shY + u * .4, cx - w * .34, hipY], u * 1.05, tint(b, -.15)); ln([cx + w * .28, shY + u * .4, cx + w * .34, hipY], u * 1.05, tint(b, -.4)); return; }
      const hx = cx - w * .44 - act * u, hy = shY + u * 2.4 - act * u * 1.6, an = -Math.PI * .62 - act * 1.25, L = h * (/staff/.test(F) ? .7 : .55), dx = Math.cos(an), dy = Math.sin(an);
      ln([cx - w * .25, shY + u * .5, hx, hy], u * 1.1, tint(b, -.15));
      if (/staff/.test(F)) { ln([hx - dx * L * .5, hy - dy * L * .5, hx + dx * L, hy + dy * L], u * .45, '#6b4a2b'); glw(wc, hx + dx * L, hy + dy * L, u * .7); return; }
      if (m.boss) { g.shadowColor = wc; g.shadowBlur = 10; } ln([hx, hy, hx + dx * L, hy + dy * L], u * .55, wc); g.shadowBlur = 0;
      ln([hx - dy * u, hy + dx * u, hx + dy * u, hy - dx * u], u * .4, '#c8a04a');
    },
    slime(C, w, h, u, T, F) {
      const a = C('a'), top = h * .08 + Math.sin(T * 5) * h * .06;
      g.fillStyle = vg(a, top, h); g.beginPath(); g.moveTo(0, h); g.bezierCurveTo(-w * .06, h * .3, w * .22, top, w * .5, top); g.bezierCurveTo(w * .78, top, w * 1.06, h * .3, w, h); g.closePath(); g.fill();
      if (/seg/.test(F)) for (let i = 1; i < 5; i++) ln([w * i * .2, h * .3, w * i * .2 + u * .5, h], u * .3, tint(a, -.4));
      g.globalAlpha = .55; g.fillStyle = C('A') || '#ffffff'; el(w * .34, h * .32, w * .12, h * .09, -.5); g.globalAlpha = 1;
      glw(C('e'), w * .3, h * .56, u * .5); glw(C('e'), w * .56, h * .56, u * .5);
      g.fillStyle = tint(a, -.7); el(w * .43, h * .8, w * .1, h * .05);
      if (/crown/.test(F)) { g.shadowColor = '#ffd76a'; g.shadowBlur = 10; g.fillStyle = '#ffd76a'; pol([w * .36, top + h * .04, w * .36, top - h * .16, w * .43, top - h * .06, w * .5, top - h * .2, w * .57, top - h * .06, w * .64, top - h * .16, w * .64, top + h * .04]); g.shadowBlur = 0; }
    },
    spider(C, w, h, u, T) {
      const st = Math.sin(T * 9), a = C('a'), lc = C('l') || a;
      for (let i = 0; i < 4; i++) { const o = (i % 2 ? st : -st) * u * .7; ln([w * (.42 + i * .06), h * .55, w * (.06 + i * .29), h * .04, w * (-.04 + i * .35) + o, h], u * .55, i % 2 ? lc : tint(lc, -.35)); }
      g.fillStyle = vg(a, h * .12, h * .9); el(w * .66, h * .5, w * .27, h * .37); el(w * .34, h * .57, w * .15, h * .24);
      g.globalAlpha = .5; g.fillStyle = C('e'); pol([w * .66, h * .32, w * .72, h * .5, w * .66, h * .66, w * .6, h * .5]); g.globalAlpha = 1;
      ln([w * .24, h * .68, w * .2, h * .86], u * .4, '#ffffff'); ln([w * .3, h * .7, w * .29, h * .88], u * .4, '#ffffff');
      [[.23, .5], [.3, .43], [.26, .6], [.34, .52]].forEach(p => glw(C('e'), w * p[0], h * p[1], u * .26));
    },
    bat(C, w, h, u, T, F) {
      const fl = Math.sin(T * 11), wc = C('w') || C('a'), cy = h * .5, a = C('a');
      [-1, 1].forEach(sd => { const X = v => w * .5 + sd * w * v; g.fillStyle = vg(wc, 0, h); g.beginPath(); g.moveTo(X(0), cy - h * .1); g.quadraticCurveTo(X(.25), cy - h * .6 - fl * h * .2, X(.54), cy - h * .35 - fl * h * .35); g.quadraticCurveTo(X(.42), cy + h * .05, X(.36), cy + h * .3 - fl * h * .1); g.quadraticCurveTo(X(.27), cy + h * .02, X(.18), cy + h * .3); g.quadraticCurveTo(X(.1), cy + h * .1, X(0), cy + h * .2); g.fill(); });
      g.fillStyle = vg(a, cy - h * .4, cy + h * .4); el(w * .5, cy + h * .05, w * .085, h * .3); el(w * .46, cy - h * .2, w * .075, h * .2);
      g.fillStyle = tint(a, -.2); pol([w * .42, cy - h * .32, w * .43, cy - h * .6, w * .47, cy - h * .36]); pol([w * .47, cy - h * .36, w * .5, cy - h * .6, w * .52, cy - h * .3]);
      if (/beak/.test(F)) { g.fillStyle = '#e0b04a'; pol([w * .4, cy - h * .2, w * .33, cy - h * .12, w * .41, cy - h * .08]); }
      glw(C('e'), w * .43, cy - h * .22, u * .28);
    },
    golem(C, w, h, u, T, F, act) {
      const a = C('a'), A = C('A') || a, br = Math.sin(T * 2) * u * .2;
      g.fillStyle = vg(a, h * .7, h); g.fillRect(w * .2, h * .72, w * .22, h * .28); g.fillStyle = tint(a, -.4); g.fillRect(w * .58, h * .72, w * .22, h * .28);
      ln([w * .88, h * .32 + br, w * .98, h * .58, w * .94, h * .78], w * .17, tint(a, -.4));
      g.fillStyle = vg(a, h * .2, h * .8); g.strokeStyle = a; g.lineWidth = u; g.beginPath(); g.moveTo(w * .12, h * .28 + br); g.lineTo(w * .88, h * .28 + br); g.lineTo(w * .76, h * .76); g.lineTo(w * .24, h * .76); g.closePath(); g.fill(); g.stroke();
      g.shadowColor = C('e'); g.shadowBlur = 8; ln([w * .34, h * .4, w * .44, h * .5, w * .38, h * .58, w * .5, h * .68], u * .35, A); g.shadowBlur = 0;
      if (/crystal/.test(F)) { g.fillStyle = vg(A, 0, h * .3); pol([w * .1, h * .28 + br, w * .16, h * .04, w * .26, h * .28 + br]); pol([w * .7, h * .28 + br, w * .82, h * .06, w * .9, h * .28 + br]); }
      g.fillStyle = vg(a, 0, h * .3); el(w * .42, h * .16 + br, w * .17, h * .13);
      if (/horns/.test(F)) { g.fillStyle = tint(a, .3); pol([w * .28, h * .12 + br, w * .2, -h * .08, w * .36, h * .06 + br]); pol([w * .5, h * .06 + br, w * .64, -h * .08, w * .58, h * .13 + br]); }
      glw(C('e'), w * .34, h * .15 + br, u * .38); glw(C('e'), w * .47, h * .15 + br, u * .38);
      const fx = w * .04 - act * w * .3, fy = h * .74 - act * h * .28;
      ln([w * .14, h * .32 + br, w * .02 - act * w * .1, h * .55 - act * h * .1, fx, fy], w * .2, tint(a, -.12)); g.fillStyle = vg(a, fy - w * .12, fy + w * .12); el(fx, fy, w * .13, w * .13);
    },
    dragon(C, w, h, u, T, F, act) {
      const a = C('a'), A = C('A') || a, fl = Math.sin(T * 5);
      g.fillStyle = vg(C('w') || a, -h * .2, h * .6); g.beginPath(); g.moveTo(w * .55, h * .5); g.quadraticCurveTo(w * .6, -h * .3 - fl * h * .08, w * .98, -h * .02 - fl * h * .12); g.quadraticCurveTo(w * .88, h * .25, w * .92, h * .44); g.quadraticCurveTo(w * .78, h * .3, w * .74, h * .52); g.closePath(); g.fill();
      g.strokeStyle = tint(a, -.2); g.lineWidth = u * 1.7; g.beginPath(); g.moveTo(w * .8, h * .64); g.quadraticCurveTo(w * .98, h * .66, w * 1.08, h * .92 + fl * h * .04); g.stroke();
      ln([w * .72, h * .7, w * .77, h * .88, w * .7, h], u * 1.6, tint(a, -.45)); ln([w * .42, h * .7, w * .38, h * .88, w * .32, h], u * 1.6, tint(a, -.25));
      g.fillStyle = vg(a, h * .4, h * .86); el(w * .58, h * .62, w * .26, h * .2);
      g.globalAlpha = .85; g.fillStyle = A; el(w * .56, h * .73, w * .2, h * .07); g.globalAlpha = 1;
      g.fillStyle = A; for (let i = 0; i < 5; i++) pol([w * (.42 + i * .08), h * .45, w * (.46 + i * .08), h * .32, w * (.5 + i * .08), h * .45]);
      g.strokeStyle = a; g.lineWidth = u * 2.3; g.beginPath(); g.moveTo(w * .38, h * .56); g.quadraticCurveTo(w * .3, h * .2, w * .16, h * .25); g.stroke();
      g.fillStyle = vg(a, h * .1, h * .42); el(w * .13, h * .25, w * .1, h * .1); el(w * .05, h * .3, w * .075, h * .06);
      g.fillStyle = A; pol([w * .16, h * .18, w * .27, h * .03, w * .21, h * .21]); pol([w * .12, h * .16, w * .19, h * .0, w * .16, h * .19]);
      glw(C('f') || C('e'), w * 0, h * .34, u * (.35 + act * .5)); glw(C('e'), w * .12, h * .22, u * .34);
    },
    ghost(C, w, h, u, T, F) {
      const a = C('a'), wv = T * 6, gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, tint(a, .3)); gr.addColorStop(.6, a); gr.addColorStop(1, rgba(a, 0));
      if (/halo/.test(F)) { g.shadowColor = '#fff3b0'; g.shadowBlur = 10; g.strokeStyle = '#fff3b0'; g.lineWidth = u * .35; g.beginPath(); g.ellipse(w * .5, -h * .1, w * .26, h * .05, 0, 0, 7); g.stroke(); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,.8)'; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(w * .5, h * .35); g.quadraticCurveTo(w * .5 + sd * w * .8, -h * .1, w * .5 + sd * w * 1.05, h * .3 + Math.sin(T * 4) * h * .05); g.quadraticCurveTo(w * .5 + sd * w * .6, h * .4, w * .5, h * .55); g.fill(); }); }
      g.globalAlpha = .9; g.fillStyle = gr; g.shadowColor = a; g.shadowBlur = 10; g.beginPath(); g.moveTo(w * .12, h * .95);
      if (/flame/.test(F)) { g.bezierCurveTo(w * .02, h * .4, w * .2, h * .2, w * .3, h * .22); for (let i = 0; i < 3; i++) { g.lineTo(w * (.36 + i * .14), -h * (.12 + .1 * Math.sin(T * 9 + i * 2))); g.lineTo(w * (.44 + i * .14), h * .2); } g.bezierCurveTo(w * .85, h * .2, w * .98, h * .4, w * .88, h * .95); }
      else { g.bezierCurveTo(w * .02, h * .3, w * .2, 0, w * .5, 0); g.bezierCurveTo(w * .8, 0, w * .98, h * .3, w * .88, h * .95); }
      for (let i = 1; i < 5; i++) g.lineTo(w * (.88 - i * .19), h * (.95 + (i % 2 ? -.1 : .04)) + Math.sin(wv + i) * h * .03);
      g.closePath(); g.fill(); g.shadowBlur = 0; g.globalAlpha = 1;
      glw(C('e'), w * .35, h * .4, u * .55); glw(C('e'), w * .62, h * .4, u * .55);
      g.fillStyle = C('m') || tint(a, -.6); el(w * .48, h * .62, w * .09, h * .07);
    },
    eye(C, w, h, u, T) {
      const a = C('a'), cx = w * .5, cy = h * .5, r = h * .48, dk = tint(a, -.35);
      for (let i = 0; i < 4; i++) { g.strokeStyle = dk; g.lineWidth = u * .5; g.beginPath(); g.moveTo(cx + (i - 1.5) * r * .4, cy + r * .7); g.quadraticCurveTo(cx + (i - 1.5) * r * .5 + Math.sin(T * 3 + i) * u * 1.5, cy + r * 1.2, cx + (i - 1.5) * r * .6 + Math.sin(T * 2 + i * 2) * u * 2, cy + r * 1.6); g.stroke(); }
      const gr = g.createRadialGradient(cx - r * .3, cy - r * .3, r * .1, cx, cy, r); gr.addColorStop(0, tint(a, .35)); gr.addColorStop(.6, a); gr.addColorStop(1, tint(a, -.65)); g.fillStyle = gr; el(cx, cy, r, r);
      if (T % 4.2 < .14) { ln([cx - r * .75, cy, cx + r * .5, cy], u * .5, tint(a, -.7)); return; }
      g.fillStyle = C('w') || '#ffffff'; el(cx - r * .12, cy, r * .64, r * .5);
      g.shadowColor = C('i'); g.shadowBlur = 14; g.fillStyle = C('i'); el(cx - r * .27, cy, r * .31, r * .31); g.shadowBlur = 0;
      g.fillStyle = C('p') || '#000000'; el(cx - r * .3, cy, r * .09, r * .27);
      g.fillStyle = 'rgba(255,255,255,.7)'; el(cx - r * .4, cy - r * .14, r * .06, r * .06);
    },
    tentacle(C, w, h, u, T, F) {
      const a = C('a'), dk = tint(a, -.4), jelly = /jelly/.test(F);
      for (let i = 0; i < 6; i++) { const bx = w * (.22 + i * .112); g.strokeStyle = i % 2 ? dk : tint(a, -.12); g.lineWidth = u * (jelly ? .35 : 1.15); g.beginPath(); g.moveTo(bx, h * .45); g.bezierCurveTo(bx + Math.sin(T * 2 + i) * w * .08, h * .68, bx + (i - 2.5) * w * .08 + Math.sin(T * 2.5 + i * 1.3) * w * .1, h * .85, bx + (i - 2.5) * w * .15, h); g.stroke(); }
      if (jelly) g.globalAlpha = .85;
      g.fillStyle = vg(a, 0, h * .62);
      if (jelly) { g.beginPath(); g.moveTo(w * .14, h * .5); g.bezierCurveTo(w * .14, -h * .1, w * .86, -h * .1, w * .86, h * .5); g.closePath(); g.fill(); } else el(w * .5, h * .3, w * .34, h * .3);
      g.globalAlpha = .3; g.fillStyle = '#ffffff'; el(w * .38, h * .14, w * .1, h * .05, -.4); g.globalAlpha = 1;
      glw(C('e'), w * .38, h * .33, u * .55); glw(C('e'), w * .6, h * .33, u * .55);
      if (/many/.test(F)) [[.26, .2], [.72, .22], [.5, .14], [.48, .44], [.3, .44], [.68, .42]].forEach(p => glw(C('m') || C('e'), w * p[0], h * p[1], u * .3));
      else { g.fillStyle = tint(a, -.7); el(w * .49, h * .5, w * .07, h * .035); }
    }
  };
  function monReal(m, x, y, flash, mp, T, act) {
    if (!m.fly) { g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x + mp.w / 2, GY + .6, mp.w * .48, 1.8, 0, 0, 7); g.fill(); }
    if (m.boss && !flash) { const cx = x + mp.w / 2, cy = y + mp.h / 2, rr = Math.max(mp.w, mp.h) * (.85 + Math.sin(T * 4) * .08), gr = g.createRadialGradient(cx, cy, 2, cx, cy, rr); gr.addColorStop(0, 'rgba(255,60,80,.38)'); gr.addColorStop(1, 'rgba(255,60,80,0)'); g.fillStyle = gr; g.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    const C = k => m.p[k] ? (flash ? '#ffffff' : m.p[k]) : undefined;
    g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
    VEC[m.s](C, mp.w, mp.h, m.sc, T, XT[m.n] || '', act || 0, m);
    g.restore(); g.shadowBlur = 0; g.globalAlpha = 1;
  }
  function draw(s) {
    g = s.ctx; const m = s.m, e = s.ev, T = s.time, K = s.K, real = s.real;
    g.setTransform(K, 0, 0, K, 0, 0);
    if (T < s.shake) { R('#000', 0, 0, W, H); const q0 = Math.floor(T * 40); g.setTransform(K, 0, 0, K, Math.round((hash(q0) - .5) * 4) * K, Math.round((hash(q0 + 9) - .5) * 4) * K); }
    if (real) bgReal(s.z, s.sx, T); else BG[s.z](s.sx, T);
    const inEv = s.phase === 'ev', walking = s.phase === 'walk' || s.phase === 'approach' || s.phase === 'npcIn' || s.phase === 'npcOut' || (inEv && e.t === 'zone');
    const fr = walking ? Math.floor(T * 6) % 2 : 0;
    let hx = HX, atk = false, ak = 0, mxo = 0, hide = false, tier = s.tier, act = 0, rot = 0, ha = 1, ghost = 0;
    if (s.phase === 'fight') {
      const k = (s.t % BEAT) / BEAT, lun = k < .3 ? -3 * (k / .3) : k < .5 ? -3 + 13 * ((k - .3) / .2) : 10 * (1 - (k - .5) / .5);
      if (s.beat % 2 === 0) { hx += lun; atk = k > .38 && k < .8; ak = k; } else { mxo = -lun; act = Math.max(0, Math.sin(k * Math.PI)); }
    }
    if (T >= s.hhit && T < s.hhit + .16) { hx -= 3; hide = Math.floor(T * 30) % 2 === 0; }
    if (T >= s.hdodge && T < s.hdodge + .32) { ghost = hx; hx -= Math.sin((T - s.hdodge) / .32 * Math.PI) * 11; }
    if (T >= s.hparry && T < s.hparry + .26) { atk = true; ak = .55; mxo += 4; }
    if (s.phase === 'lose') { const t = s.t; hx -= Math.min(1, t / .3) * 8; rot = Math.min(1, t / .45) * 1.5; if (t > 1.9) ha = Math.max(0, 1 - (t - 1.9) / .7); if (t > 2.7) { rot = 0; hx = HX; ha = Math.min(1, (t - 2.7) / .6); } }
    if (inEv && e.t === 'tier') tier = s.t < 1.6 ? (Math.floor(s.t * (4 + s.t * 9)) % 2 ? e.i : s.tier) : e.i;
    if (s.phase === 'approach' && s.cineNext) { g.globalAlpha = .3 + Math.sin(T * 12) * .25; R('#ff5d73', 0, 0, W, 4); R('#ff5d73', 0, H - 4, W, 4); g.globalAlpha = 1; }
    if (m && s.phase !== 'win') {
      const mp = mpos(s), rows = SHAPES[m.s], mb = (!m.fly && s.phase !== 'fight' && Math.floor(T * 6) % 2) ? 1 : 0, x = mp.x + Math.round(mxo);
      if (T < s.charge) { const a = 1 - (s.charge - T) / (BEAT * .45); g.globalAlpha = .1; R('#ff5d73', 0, 0, W, H); g.globalAlpha = .2 + a * .35; disc(x + mp.w / 2, mp.y + mp.h / 2, Math.round(6 + a * Math.max(mp.w, mp.h) * .6), '#ff5d73'); g.globalAlpha = 1; }
      if (real) monReal(m, s.mx + mxo, mp.y, T < s.mflash, mp, T, act);
      else {
        if (m.boss) for (let k = 0; k < 14; k++) { const n = k + Math.floor(T * 6) * 17; R(k % 2 ? '#ff5d73' : '#ffd84a', x - 4 + hash(n) * (mp.w + 8), mp.y - 5 + hash(n + 3) * (mp.h + 5), 1, 1); }
        spr(rows, T < s.mflash ? white(m) : m.p, x, mp.y - mb, m.sc);
      }
    }
    if (inEv && e.t === 'lvl') {
      const a = Math.min(1, s.t / .4) * (1 - Math.max(0, (s.t - 1.9) / .5));
      g.globalAlpha = .28 * a; R('#4da3ff', hx - 6, 0, 32, GY); g.globalAlpha = .35 * a; R('#e6f4ff', hx + 3, 0, 14, GY); g.globalAlpha = a;
      for (let i = 0; i < 16; i++) R(i % 2 ? '#fff' : '#9ad6ff', hx - 4 + hash(i) * 28, GY - ((s.t * 60 * (1 + hash(i + 3)) + hash(i + 7) * GY) % GY), 1, 3);
      const r = (s.t * 30) % 26; R('#fff', hx + 10 - r, GY - 1, r * 2, 1); g.globalAlpha = 1;
    }
    if (s.npc) { if (real) monReal(s.npc, s.mx, GY - 24, false, { w: 16, h: 24 }, T, 0); else spr(SHAPES.human, s.npc.p, Math.round(s.mx), GY - 24 - (s.phase !== 'npcTalk' && fr ? 1 : 0), 2); }
    const hero = (X, al) => { g.save(); g.globalAlpha = al; if (rot) { g.translate(Math.round(X) + 10, GY); g.rotate(-rot); g.translate(-Math.round(X) - 10, -GY); } if (real) heroReal(X, tier, walking, atk, ak, T); else drawHero(Math.round(X), GY - 26 - (walking && fr ? 1 : 0), 2, tier, fr, atk, T); g.restore(); };
    if (ghost) { hero(ghost, .22); hero((ghost + hx) / 2, .4); }
    if (s.phase === 'lose') {
      const t = s.t;
      if (t < 1.9) { g.globalAlpha = .2 * Math.min(1, t / .3); R('#ff2030', 0, 0, W, H); g.globalAlpha = 1; }
      if (t > 1.7 && t < 2.9) { g.globalAlpha = Math.max(0, 1 - (t - 1.7) / 1.2); for (let i = 0; i < 12; i++) R(i % 2 ? '#9ad6ff' : '#fff', HX - 12 + hash(i) * 26, GY - 3 - (t - 1.7) * 26 * (1 + hash(i + 3)), 1, 2); g.globalAlpha = 1; }
      if (t > 2.7) { g.globalAlpha = .35 * Math.max(0, 1 - (t - 2.7) / .8); R('#e6f4ff', HX + 2, 0, 16, GY); g.globalAlpha = 1; }
    }
    if (!hide && ha > 0) hero(hx, ha);
    if (real) g.shadowBlur = 10;
    s.fx.forEach(k => { if (real) g.shadowColor = k.c || '#ffffff'; drawFx(s, k); });
    if (real) g.shadowColor = '#ffd84a';
    if (s.parts.length) { const ag = T - s.pt0; if (ag > 1.3) s.parts = []; else { g.globalAlpha = Math.max(0, 1 - ag / 1.3); s.parts.forEach(p => R(p.c, p.x + p.vx * ag, p.y + p.vy * ag + 70 * ag * ag, p.s, p.s)); g.globalAlpha = 1; } }
    s.sparks.forEach(k => { if (T >= k.t0) { R('#fff', k.x - 3, k.y, 7, 1); R('#fff', k.x, k.y - 3, 1, 7); R('#ffd84a', k.x - 2, k.y - 2, 1, 1); R('#ffd84a', k.x + 2, k.y + 2, 1, 1); R('#ffd84a', k.x + 2, k.y - 2, 1, 1); R('#ffd84a', k.x - 2, k.y + 2, 1, 1); } });
    g.shadowBlur = 0;
    if (inEv && e.t === 'tier') {
      const f = Math.max(0, 1 - Math.abs(s.t - 1.6) / .3);
      if (f) { g.globalAlpha = f * .9; R('#fff', 0, 0, W, H); g.globalAlpha = 1; }
      if (s.t > 1.6 && s.t < 2.6) { g.globalAlpha = 1 - (s.t - 1.6); const d = (s.t - 1.6) * 60; for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2; R(i % 2 ? '#c4b5ff' : '#fff', hx + 10 + Math.cos(an) * d, GY - 13 + Math.sin(an) * d, 2, 2); } g.globalAlpha = 1; }
    }
    if (real) postReal(s.z, T);
    if (inEv && e.t === 'zone') { g.globalAlpha = s.t < 1.2 ? s.t / 1.2 : Math.max(0, 1 - (s.t - 1.2) / 1.2); R('#000', 0, 0, W, H); g.globalAlpha = 1; }
    g.setTransform(K, 0, 0, K, 0, 0);
  }
  function setMode(real) {
    const s = st; if (!s) return;
    s.real = !!real; s.K = real ? RK : 1; s.canvas.width = W * s.K; s.canvas.height = H * s.K; s.canvas.classList.toggle('real', s.real);
    s.ctx.imageSmoothingEnabled = s.real; draw(s);
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; st = null; }
  function start(canvas, o) {
    stop();
    const real = !!o.real, K = real ? RK : 1;
    canvas.width = W * K; canvas.height = H * K; canvas.classList.toggle('real', real);
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = real;
    let level = o.level; const target = Math.max(level, o.target || level);
    const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still && target > level) { level = target; if (o.onSeen) o.onSeen(target); }   // sans animations : on acte directement
    const s = st = { canvas, ctx, real, K, box: canvas.parentNode, cap: o.cap, name: o.name || 'Le héros', onSeen: o.onSeen, onDone: o.onDone, level, z: zoneIdx(level), tier: tierIdx(level),
      queue: buildQueue(level, target), ev: null, phase: 'walk', t: 0, time: 0, sx: 0, m: null, mx: 0, sparks: [], fx: [], hdodge: -9, hparry: -9, npc: null, enc: 0, talk: 0, stats: o.stats || null, parts: [], pt0: 0, n: 0, shake: 0, mflash: 0, hhit: -9, charge: 0, hits: 0, doneAt: 0 };
    let last = performance.now();
    const loop = now => {
      if (st !== s || !canvas.isConnected) { if (st === s) stop(); return; }
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!document.hidden) { update(s, dt); if (st === s) draw(s); }
      if (st === s) raf = requestAnimationFrame(loop);
    };
    draw(s);
    if (!still) raf = requestAnimationFrame(loop);
  }
  function portrait(canvas, level) {
    canvas.width = 40; canvas.height = 48;
    g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 40, 48);
    drawHero(11, 20, 2, tierIdx(level), 0, false, 0);
  }

  window.RPG = { MAX, need, levelOf, streakMult, sessionXp, TIERS, ZONES, tierIdx, zoneIdx, buildQueue, start, stop, setMode, portrait, tick: dt => { const s = st; if (s) { update(s, dt); if (st === s) draw(s); } } };
})();
