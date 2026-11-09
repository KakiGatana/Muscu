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
      if (s.t > 2.2) { s.m = pick(s); if (!s.m) { s.t = 0; return; } s.mx = W + 4; s.phase = 'approach'; s.t = 0; say(s, (s.m.boss ? 'BOSS · ' : '') + s.m.n + ' approche.', s.m.boss ? 'boss' : ''); }
    } else if (s.phase === 'approach') {
      s.sx += 12 * dt; s.mx -= 70 * dt;
      if (s.mx <= HX + 36) { s.mx = HX + 36; s.phase = 'fight'; s.t = 0; s.beat = -1; s.win = m.l <= s.level; s.beats = s.win ? (m.boss ? 10 : 6) : 4; }
    } else if (s.phase === 'fight') {
      const b = Math.floor(s.t / .42);
      if (b !== s.beat) {
        s.beat = b;
        if (b >= s.beats) { s.phase = s.win ? 'win' : 'lose'; s.t = 0; say(s, s.win ? m.n + (m.boss ? ' terrassé.' : ' vaincu.') : m.n + ' est trop fort. Niveau ' + m.l + ' requis.', s.win ? 'ok' : 'ko'); }
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
      const rows = SHAPES[m.s], h = rows.length * m.sc, w = rows[0].length * m.sc;
      const fly = m.fly ? 12 + Math.round(Math.sin(s.time * 5) * 2) : 0, mb = (!m.fly && s.phase !== 'fight' && Math.floor(s.time * 6) % 2) ? 1 : 0;
      const x = Math.round(s.mx + mxo), y = GY - h - fly - mb;
      if (m.boss) for (let k = 0; k < 14; k++) { const n = k + Math.floor(s.time * 6) * 17; R(k % 2 ? '#ff5d73' : '#ffd84a', x - 4 + hash(n) * (w + 8), y - 5 + hash(n + 3) * (h + 5), 1, 1); }
      spr(rows, m.p, x, y, m.sc);
    }
    if (!hide) drawHero(Math.round(hx), GY - 26 - (walking && fr ? 1 : 0), 2, s.tier, fr, atk, s.time);
    s.sparks.forEach(k => { if (s.time >= k.t0) { R('#fff', k.x - 3, k.y, 7, 1); R('#fff', k.x, k.y - 3, 1, 7); R('#ffd84a', k.x - 2, k.y - 2, 1, 1); R('#ffd84a', k.x + 2, k.y + 2, 1, 1); R('#ffd84a', k.x + 2, k.y - 2, 1, 1); R('#ffd84a', k.x - 2, k.y + 2, 1, 1); } });
  }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; st = null; }
  function start(canvas, level, cap) {
    stop();
    canvas.width = W; canvas.height = H;
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
    canvas.width = 40; canvas.height = 48;
    g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 40, 48);
    drawHero(11, 20, 2, tierIdx(level), 0, false, 0);
  }

  window.RPG = { MAX, need, levelOf, streakMult, sessionXp, TIERS, ZONES, tierIdx, zoneIdx, start, stop, portrait, tick: dt => { if (st) { update(st, dt); draw(st); } } };
})();
