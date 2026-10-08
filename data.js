/* TANDEM — programmes par défaut (modifiables dans l'app) */
(function () {
  // X(id, bloc, nom, séries, reps, repos(s), départ, note, type, clé)
  // type : 'w' = charge + reps · 'b' = poids du corps (reps/temps) · 'c' = simple case à cocher
  const X = (id, sec, n, sets, reps, rest, start, note, kind = 'w', key = false) =>
    ({ id, sec, n, sets, reps, rest, start, note, kind, key });

  const S_WARM = 'ÉCHAUFFEMENT EXPRESS';
  const S_BIG = 'LE GROS — non négociable';
  const S_SS = 'SUPERSET — enchaîne A1 → A2, repos après';

  function him() {
    const ha = {
      id: 'ha', name: 'Haut A', tag: 'Force', dur: '~40 min',
      ex: [
        X('ha1', S_WARM + ' (3 min)', 'Rotations épaules + coude', 1, '20', 0, '', 'Protège coude & épaule', 'c'),
        X('ha2', S_WARM + ' (3 min)', '1 série légère de développé', 1, '10', 0, '', 'Barre à vide ou 40 % · ~20-30 kg', 'c'),
        X('ha3', S_BIG, 'Développé couché', 4, '5-6', 150, '62,5', '1" de pause sur la poitrine', 'w', true),
        X('ha4', S_BIG, 'Pendlay Row', 4, '6-8', 120, '50 (est.)', 'Explosif', 'w', true),
        X('ha5', S_SS, 'A1 · Développé militaire barre', 3, '8', 0, '27,5', '⚠️ Épaule G : baisse la charge si douleur'),
        X('ha6', S_SS, 'A2 · Tirage poulie haute', 3, '10', 90, '47,5', 'Puis 90 s de repos'),
        X('ha7', 'BRAS + ABDOS + FINISHER (4 min)', 'Curl marteau', 3, '10-12', 60, '12', 'Renforce coude & grip'),
        X('ha8', 'BRAS + ABDOS + FINISHER (4 min)', 'Crunch à la poulie haute', 3, '12-15', 45, '20 (est.)', 'Dos rond, serre le ventre'),
        X('ha9', 'BRAS + ABDOS + FINISHER (4 min)', 'Cou (flexion / extension / latéral)', 1, '15 chaque', 0, '0', 'Résistance de la main, lent', 'b')
      ]
    };
    const ba = {
      id: 'ba', name: 'Bas A', tag: 'Squat', dur: '~40 min',
      ex: [
        X('ba1', S_WARM + ' (3-4 min)', 'Vélo', 1, '2 min', 0, '', 'Échauffe les genoux', 'c'),
        X('ba2', S_WARM + ' (3-4 min)', 'Squats à vide + 1 série légère', 1, '15', 0, '', 'Rode le mouvement · 20-40 kg', 'c'),
        X('ba3', S_BIG, 'Squat', 4, '5-6', 150, '70 → tester 80-90', 'À RETESTER · descente 2-3" sans rebond', 'w', true),
        X('ba4', S_BIG, 'Soulevé de terre roumain', 3, '8-10', 120, '70 (est.)', 'Ischios/fessiers, dos droit', 'w', true),
        X('ba5', S_SS, 'A1 · Presse à cuisses', 3, '10-12', 0, '100 (est.)', 'Ne verrouille pas les genoux'),
        X('ba6', S_SS, 'A2 · Leg curl', 3, '10-12', 90, '30 (est.)', 'Puis 90 s de repos'),
        X('ba7', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Mollets debout', 3, '15', 45, '40 (est.)', 'Tempo lent'),
        X('ba8', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Extensions lombaires (banc 45°)', 3, '12', 60, '0', 'Dos droit · pas d\'hyperextension'),
        X('ba9', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Gainage planche + latéral', 2, '30 s chaque', 30, '0', 'Abdos + obliques', 'b')
      ]
    };
    const at = {
      id: 'at', name: 'Athlétique', tag: 'Sprint & puissance', dur: '~30 min',
      ex: [
        X('at1', 'ÉCHAUFFEMENT — obligatoire ici', 'Corde à sauter + 2 accélérations', 1, '4 min', 0, '', 'Explosif à froid = blessure', 'c'),
        X('at2', S_BIG, 'Sprints all-out', 6, '30 s', 120, '0', 'Vélocité max, piste ou herbe. Si la vitesse baisse, c\'est fini.', 'b', true),
        X('at3', 'PUISSANCE (express)', 'Med ball slams', 3, '8', 60, '6-8 (est.)', 'Explosif total'),
        X('at4', 'PUISSANCE (express)', 'Shuffle latéral / départs-arrêts', 4, '15 m', 60, '0', 'Appuis, foot US & combat', 'b'),
        X('at5', 'FINISHER (3 min)', 'Cou + farmer\'s walk', 2, '15 / 30 s', 45, '2 x 20 (est.)', 'Protection & grip')
      ]
    };
    const hb = {
      id: 'hb', name: 'Haut B', tag: 'Volume', dur: '~40 min',
      ex: [
        X('hb1', S_WARM + ' (3 min)', 'Rotations épaules + coude', 1, '20', 0, '', 'Protège coude & épaule', 'c'),
        X('hb2', S_WARM + ' (3 min)', '1 série légère du 1er exo', 1, '12', 0, '', '40-50 % · ~10-12 kg', 'c'),
        X('hb3', S_BIG, 'Développé incliné haltères', 4, '8-10', 90, '22 / bras', 'Haut des pecs', 'w', true),
        X('hb4', S_BIG, 'Rowing horizontal poulie', 4, '10-12', 90, '50', 'Serre les omoplates', 'w', true),
        X('hb5', 'SUPERSET — épaules, le dos en V', 'A1 · Élévations latérales', 3, '12-15', 0, '7 (est.)', 'Léger · ⚠️ épaule G'),
        X('hb6', 'SUPERSET — épaules, le dos en V', 'A2 · Face pull / oiseau', 3, '15', 60, '20 (est.)', 'Puis 60 s de repos'),
        X('hb7', 'BRAS + ABDOS + FINISHER (4 min)', 'B1 · Curl haltères', 3, '12', 0, '16', 'Superset avec B2'),
        X('hb8', 'BRAS + ABDOS + FINISHER (4 min)', 'B2 · Extension triceps poulie', 3, '12', 60, '22,5', 'Puis 60 s de repos'),
        X('hb9', 'BRAS + ABDOS + FINISHER (4 min)', 'Relevés de genoux en suspension', 3, '10-12', 45, '0', 'Abdos + grip en un seul exo', 'b')
      ]
    };
    const bb = {
      id: 'bb', name: 'Bas B', tag: 'Deadlift', dur: '~40 min',
      ex: [
        X('bb1', S_WARM + ' (3-4 min)', 'Vélo', 1, '2 min', 0, '', 'Échauffe les genoux', 'c'),
        X('bb2', S_WARM + ' (3-4 min)', '1 série légère de deadlift', 1, '8', 0, '', 'Rode le mouvement · 60-70 kg', 'c'),
        X('bb3', S_BIG, 'Soulevé de terre', 4, '5', 180, '100', '1" ras du sol, dos gainé', 'w', true),
        X('bb4', S_BIG, 'Front squat', 3, '8', 120, '45 (est.)', 'Buste droit', 'w', true),
        X('bb5', S_SS, 'A1 · Fentes marchées', 3, '10 / jambe', 0, '2 x 12 (est.)', 'Sans douleur au genou'),
        X('bb6', S_SS, 'A2 · Leg extension', 3, '12', 90, '35 (est.)', 'Puis 90 s de repos'),
        X('bb7', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Mollets assis', 3, '15', 45, '40 (est.)', 'Amplitude max'),
        X('bb8', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Bird-dog / superman', 2, '10 / côté', 30, '0', 'Lombaires LÉGER · le deadlift a déjà chargé', 'b'),
        X('bb9', 'FINISHER — ABDOS + LOMBAIRES (4-5 min)', 'Relevés de jambes + gainage latéral', 2, '12 / 25 s', 30, '0', 'Abdos + obliques', 'b')
      ]
    };

    return {
      name: 'Ilann',
      programs: [ha, ba, at, hb, bb],
      week: [
        { p: null, l: 'Repos / mobilité' }, { p: 'ha' }, { p: 'ba' }, { p: 'at' },
        { p: 'hb' }, { p: 'bb' }, { p: null, l: 'Repos complet' }
      ],
      logs: [], body: [],
      guide: [
        { t: 'La règle du haut de liste', i: '🔝', open: true, b: [
          'Les exercices sont rangés par ordre d\'importance. Si tu dois partir en avance, tu coupes par le **BAS**, jamais par le haut.',
          'Les 2 premiers de chaque séance (étoile ★) sont non négociables.',
          'Semaine chargée ? Garde Haut A + Bas A + Haut B : tu touches quand même tout le corps. L\'Athlétique est la première à sacrifier.'] },
        { t: 'Squat — à retester en priorité', i: '🦵', b: [
          'Ton squat (~78 kg max estimé) est en retard sur ton deadlift (~125 kg). Normalement il devrait être à 80-85 % du deadlift : **100-105 kg**.',
          'Prochaine séance Bas A : monte par paliers (60×5 → 70×3 → 80×3 → 85-90×2-3 si ça passe propre).',
          'Descente lente et contrôlée, **jamais de rebond** en bas : c\'est le rebond qui t\'avait fait mal au genou.',
          'Si ça bloque vers 75-80 : séries de 8 à charge modérée 3-4 semaines, puis remonte.'] },
        { t: 'Épaule gauche', i: '⚠️', b: [
          'Développé militaire et mouvements au-dessus de la tête : charge réduite ou pause si ça réveille la douleur.',
          'Dips retirées du programme (très agressives pour l\'épaule).',
          'Face pull et élévations latérales légères conservés : l\'arrière d\'épaule fait souvent partie de la solution.'] },
        { t: 'Supersets & échauffement', i: '⚡', b: [
          '**A1 / A2** s\'enchaînent sans repos : une série de A1, direct une série de A2, PUIS le repos. Gain : 8-10 min par séance.',
          'Séances HAUT : 20 rotations d\'épaules + 15 flexions/extensions de coude + 1 série légère.',
          'Séances BAS : 2 min de vélo + 15 squats à vide + 1 série légère.',
          'Athlétique : l\'échauffement est obligatoire, sprinter à froid = blessure assurée.'] },
        { t: 'Choisir la bonne charge', i: '🎯', b: [
          'La bonne charge est celle où les **2 dernières reps sont dures mais propres**.',
          'Si tu finis une série facile, tu montes. Les valeurs « (est.) » sont des estimations : ajuste dès la 1re séance.',
          'L\'app te rappelle ta dernière charge et te dit quand monter.'] },
        { t: 'Abdos & lombaires', i: '🔥', b: [
          'Abdos 4×/semaine, lombaires 2×/semaine en travail léger : squat et deadlift les chargent déjà.',
          'Jamais d\'extensions lombaires lourdes la veille ou le lendemain d\'un deadlift lourd.',
          'Les abdos ne font pas fondre les poignées d\'amour : le gras part avec le déficit calorique.'] },
        { t: 'Nutrition — 8 semaines de sèche', i: '🍽️', b: [
          '85 kg → 80-81 kg. Maintenance ~2850 kcal. **Objectif 2350 kcal** (déficit de 500, pas plus).',
          'Protéines **170 g** (le seul chiffre vraiment à tenir) · Lipides 70 g · Glucides ~260 g.',
          'Rythme : -0,5 à -0,7 kg / semaine. Pèse-toi à jeun, même jour, et regarde la moyenne.',
          'Les calories liquides (sodas, alcool, jus) sont le piège n°1.',
          'Après : tu manges autour de ta maintenance (~2900 kcal), tu continues à monter les charges = recomposition.'] },
        { t: 'Les 3 seules règles', i: '🏆', b: [
          '1. Tes protéines : ~170 g par jour.',
          '2. Tes charges montent dans le temps.',
          '3. Ton sommeil.',
          'La régularité sur 12 mois bat n\'importe quel programme parfait suivi 6 semaines.'] }
      ]
    };
  }

  function her() {
    const W = 'ÉCHAUFFEMENT (4 min)';
    const fa = {
      id: 'fa', name: 'Fessiers A', tag: 'Hip thrust', dur: '~45 min',
      ex: [
        X('fa1', W, 'Vélo ou marche inclinée', 1, '3 min', 0, '', 'Réveille les hanches', 'c'),
        X('fa2', W, 'Pont fessier + élastique', 2, '15', 0, '', 'Active les fessiers avant la charge', 'c'),
        X('fa3', S_BIG + ' · fessiers', 'Hip thrust', 4, '10-12', 120, '30 (est.)', 'Pause 1" en haut, serre fort, menton rentré', 'w', true),
        X('fa4', S_BIG + ' · fessiers', 'Soulevé de terre roumain haltères', 3, '10-12', 90, '2 x 8 (est.)', 'Dos droit, sens l\'étirement fessiers/ischios', 'w', true),
        X('fa5', 'SUPERSET — enchaîne A1 → A2', 'A1 · Fentes bulgares', 3, '10 / jambe', 0, '2 x 5 (est.)', 'Buste légèrement penché = plus de fessiers'),
        X('fa6', 'SUPERSET — enchaîne A1 → A2', 'A2 · Abduction machine', 3, '15-20', 75, '25 (est.)', 'Puis 75 s de repos'),
        X('fa7', 'FINISHER — fessiers + ventre', 'Kickback poulie', 3, '12 / jambe', 45, '10 (est.)', 'Contrôle la montée, pas d\'élan'),
        X('fa8', 'FINISHER — fessiers + ventre', 'Crunch inversé', 3, '12-15', 45, '0', 'Le bassin décolle, pas d\'élan', 'b'),
        X('fa9', 'FINISHER — fessiers + ventre', 'Gainage planche', 3, '30-40 s', 30, '0', 'Ventre rentré, fessiers serrés', 'b')
      ]
    };
    const fb = {
      id: 'fb', name: 'Fessiers B', tag: 'Jambes & galbe', dur: '~45 min',
      ex: [
        X('fb1', W, 'Vélo', 1, '3 min', 0, '', 'Réveille les hanches', 'c'),
        X('fb2', W, 'Squats à vide + élastique', 2, '15', 0, '', 'Genoux qui poussent vers l\'extérieur', 'c'),
        X('fb3', S_BIG + ' · jambes', 'Presse à cuisses', 4, '10-12', 120, '60 (est.)', 'Pieds hauts et écartés = plus de fessiers', 'w', true),
        X('fb4', S_BIG + ' · jambes', 'Step-up haltères', 3, '10 / jambe', 90, '2 x 5 (est.)', 'Pousse dans le talon, monte sans élan', 'w', true),
        X('fb5', 'SUPERSET — enchaîne A1 → A2', 'A1 · Leg curl', 3, '12', 0, '20 (est.)', 'Ischios : le galbe du bas de la fesse'),
        X('fb6', 'SUPERSET — enchaîne A1 → A2', 'A2 · Abduction élastique debout', 3, '20', 60, '0', 'Puis 60 s de repos', 'b'),
        X('fb7', 'FINISHER — ventre', 'Relevés de jambes', 3, '12', 45, '0', 'Lombaires plaquées au sol', 'b'),
        X('fb8', 'FINISHER — ventre', 'Planche latérale', 2, '25-30 s chaque', 30, '0', 'Taille et obliques', 'b'),
        X('fb9', 'FINISHER — ventre', 'Vacuum (ventre plat)', 3, '20 s', 30, '0', 'Expire tout, rentre le ventre, tiens', 'b')
      ]
    };
    const hu = {
      id: 'hu', name: 'Haut + Ventre', tag: 'Tonus', dur: '~40 min',
      ex: [
        X('hu1', W, 'Rotations épaules + coudes', 1, '20', 0, '', 'Mobilité avant de tirer', 'c'),
        X('hu2', S_BIG, 'Tirage poulie haute', 3, '12', 90, '30 (est.)', 'Tire vers le haut de la poitrine, coudes bas', 'w', true),
        X('hu3', S_BIG, 'Développé incliné haltères', 3, '10-12', 90, '2 x 5 (est.)', 'Contrôle la descente', 'w', true),
        X('hu4', 'SUPERSET — enchaîne A1 → A2', 'A1 · Élévations latérales', 3, '15', 0, '2 x 3 (est.)', 'Léger, épaules basses'),
        X('hu5', 'SUPERSET — enchaîne A1 → A2', 'A2 · Rowing haltère un bras', 3, '12 / bras', 60, '8 (est.)', 'Puis 60 s de repos'),
        X('hu6', 'FINISHER — ventre', 'Crunch poulie haute', 3, '15', 45, '15 (est.)', 'Dos rond, serre le ventre'),
        X('hu7', 'FINISHER — ventre', 'Relevés de genoux (banc)', 3, '10-12', 45, '0', 'Contrôle, pas d\'élan', 'b'),
        X('hu8', 'FINISHER — ventre', 'Planche', 3, '30-40 s', 30, '0', 'Ventre rentré', 'b')
      ]
    };
    const ca = {
      id: 'ca', name: 'Cardio + Abdos', tag: 'Optionnel', dur: '~30 min',
      ex: [
        X('ca1', 'CARDIO DOUX', 'Marche inclinée', 1, '20 min', 0, '', 'Pente 8-12 %, 5-5,5 km/h : tu dois pouvoir parler', 'c', true),
        X('ca2', 'CIRCUIT ABDOS — 3 tours', 'Bicyclette', 3, '20', 0, '0', 'Lent, coude vers le genou opposé', 'b'),
        X('ca3', 'CIRCUIT ABDOS — 3 tours', 'Crunch', 3, '15', 0, '0', 'Expire en montant', 'b'),
        X('ca4', 'CIRCUIT ABDOS — 3 tours', 'Mountain climbers', 3, '30 s', 0, '0', 'Hanches basses', 'b'),
        X('ca5', 'CIRCUIT ABDOS — 3 tours', 'Planche', 3, '30 s', 60, '0', 'Repos 60 s après le tour', 'b')
      ]
    };

    return {
      name: 'Elle',
      programs: [hu, fa, ca, fb],
      week: [
        { p: null, l: 'Repos / marche' }, { p: 'hu' }, { p: 'fa' }, { p: 'ca' },
        { p: null, l: 'Repos (ou suis Ilann)' }, { p: 'fb' }, { p: null, l: 'Repos complet' }
      ],
      logs: [], body: [],
      guide: [
        { t: 'Ton objectif', i: '🎯', open: true, b: [
          '1m69 · 63 kg → **tonifier, ventre plus ferme, plus de fessiers**.',
          'Tonifier = **gagner un peu de muscle** + rester sec. Ça passe par des charges qui montent, pas par des centaines de reps légères.',
          '3 séances par semaine suffisent (+1 cardio doux optionnel). Tu suis Ilann à la salle : tes séances tombent les mêmes jours que ses séances « Bas » pour faire équipe.'] },
        { t: 'Des fessiers qui prennent', i: '🍑', b: [
          'Le **hip thrust** est le roi : 2×/semaine, c\'est l\'exo prioritaire. Monte la charge dès que 4×12 passent propres.',
          'Pause 1" en haut, bassin en rétroversion, menton rentré. Pas de cambrure dans le bas du dos.',
          'Presse pieds hauts, fentes bulgares, step-up : l\'étirement sous charge fait grossir le muscle.',
          'Règle simple : si tu fais toutes tes reps facilement, tu **montes de 2,5 kg** (ou +1-2 reps) à la séance suivante.'] },
        { t: 'Le ventre : la vérité', i: '🔥', b: [
          'On ne choisit pas où le gras part. Les abdos **renforcent** le ventre (plus ferme, taille plus fine), mais l\'affinement vient d\'un léger déficit + de l\'activité.',
          'Mets des abdos 3-4×/semaine (déjà dans tes séances) : crunch poulie, relevés de jambes, planches, vacuum.',
          'Le **vacuum** (ventre rentré à vide) travaille le transverse : l\'effet « ventre plat ».',
          'Marche : vise **8 000-10 000 pas** par jour, c\'est le meilleur allié discret.'] },
        { t: 'Nutrition — repères indicatifs', i: '🍽️', b: [
          'Pour 63 kg à 1m69, ta maintenance tourne autour de **2 000-2 100 kcal**. Pour te raffermir doucement : **~1 850-1 950 kcal**, sans jamais te priver.',
          'Protéines : **~105-115 g par jour** (1,7 g/kg). Une source de protéines à chaque repas + un yaourt/skyr en collation.',
          'Ne descends pas en dessous de ~1 700 kcal : tu perdrais du muscle et de l\'énergie.',
          'Ce sont des estimations générales, à ajuster selon ta balance et tes sensations (pas un avis médical).'] },
        { t: 'Cycle & fatigue', i: '🌙', b: [
          'Certains jours, la force chute (cycle, sommeil) : fais la séance quand même avec 10 % de charge en moins, c\'est déjà gagné.',
          'Le poids varie de 1-2 kg selon le cycle : regarde la tendance sur 3-4 semaines, le tour de taille et les photos.',
          'Dors 7-8 h : c\'est là que le muscle se construit.'] },
        { t: 'Repères de suivi', i: '📏', b: [
          'Pèse-toi le matin à jeun, même jour chaque semaine, et compare la moyenne.',
          'Une fois par mois : tour de taille (nombril), tour de hanches, et une photo dans les mêmes conditions.',
          'Note tes charges dans l\'app : voir le hip thrust passer de 30 à 60 kg, c\'est le vrai indicateur.'] }
      ]
    };
  }

  window.TANDEM_DEFAULTS = {
    make() {
      return { v: 1, active: null, opts: { sound: true, vib: true }, cur: null, profiles: { him: him(), her: her() } };
    },
    makePrograms(key) { return (key === 'her' ? her() : him()); }
  };
})();
