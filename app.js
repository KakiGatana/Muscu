/* Entraînement — carnet de muscu hors ligne (vanilla JS, aucune dépendance) */
(function () {
  'use strict';
  const KEY = 'fonte.v1', OLD_KEY = 'tandem.v1';
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const D1 = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const ALERTS = { epaule_gauche: 'Épaule gauche', genou: 'Genou', coude: 'Coude' };
  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const num = s => { const m = String(s == null ? '' : s).replace(',', '.').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  const fw = w => (w === '' || w == null || isNaN(w)) ? '' : String(w).replace('.', ',');
  const pad = n => String(n).padStart(2, '0');
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayISO = () => isoDay(new Date());
  const logDay = l => isoDay(new Date(l.date));
  const fdate = iso => { const d = new Date(iso); return `${DAYS[(d.getDay() + 6) % 7].slice(0, 3)}. ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const norm = s => String(s || '').toLowerCase().replace(/^[a-z]\d\s*·\s*/, '').replace(/[^a-z0-9àâçéèêëîïôûùüÿ]+/g, ' ').trim();

  /* ---------- correctifs de programme appliqués une seule fois aux données déjà enregistrées ---------- */
  const PATCHES = [
    // 1 : Med ball slams remplacé par des skips (séance Athlétique, à faire dehors)
    s => {
      const p = s.programs.find(x => x.id === 'athletique'); if (!p) return;
      const i = p.ex.findIndex(e => norm(e.n) === 'med ball slams');
      if (i >= 0) p.ex.splice(i, 1, { id: p.ex[i].id, sec: p.ex[i].sec, n: 'Skips (montées de genoux explosives)', sets: 3, reps: '15 m', rest: 60, start: '', note: 'Appuis légers et rapides, à faire dehors. Pas de réception violente (genou).', kind: 'b', key: false });
    },
    // 2 : XP rétroactive pour les séances faites avant l'arrivée de l'aventure (3 XP par série, sans bonus)
    s => { s.logs.forEach(l => { if (l.xp == null) { l.xp = l.ex.reduce((n, e) => n + Math.min(8, e.sets.length) * 3, 0); l.streak = l.streak || 1; l.mult = 1; } }); }
  ];
  function migrate(s) { for (let i = s.patchV || 0; i < PATCHES.length; i++) { try { PATCHES[i](s); } catch (e) { } } s.patchV = PATCHES.length; return s; }

  /* ---------- état (tout est sauvegardé sur l'appareil, rien ne repart à zéro) ---------- */
  function fresh() {
    const d = FONTE_DEFAULT;
    return { v: 1, name: 'Ilann', opts: { sound: true, vib: true }, cur: null, progV: d.version, patchV: PATCHES.length,
      programs: clone(d.programs), week: clone(d.week), guide: clone(d.guide), logs: [], body: [], lastBackup: 0 };
  }
  // reprend l'historique d'une ancienne sauvegarde (version « Tandem ») sans toucher au nouveau programme
  function fromOld(o) {
    const s = fresh(), h = o.profiles && o.profiles.him;
    if (h) { s.name = h.name || s.name; s.logs = h.logs || []; s.body = h.body || []; }
    if (o.opts) s.opts = o.opts;
    s.patchV = 0; return migrate(s);
  }
  function load() {
    try {
      const r = localStorage.getItem(KEY);
      if (r) { const s = JSON.parse(r); if (s && Array.isArray(s.programs) && Array.isArray(s.week)) { s.opts = s.opts || { sound: true, vib: true }; s.logs = s.logs || []; s.body = s.body || []; s.guide = s.guide || clone(FONTE_DEFAULT.guide); return migrate(s); } }
      const old = localStorage.getItem(OLD_KEY);
      if (old) { const o = JSON.parse(old); if (o && o.profiles) return fromOld(o); }
    } catch (e) { }
    return fresh();
  }
  let S = load();
  let saveFail = false;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); saveFail = false; } catch (e) { saveFail = true; } }
  save();
  window.addEventListener('pagehide', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  const progById = id => id === '__spam' ? (S.cur && S.cur.spamProg) || undefined : S.programs.find(p => p.id === id);
  const V = { tab: 'home', stack: [] };
  const top = () => V.stack[V.stack.length - 1];

  /* ---------- helpers métier ---------- */
  function startW(start) {
    const s = String(start || '');
    const m = s.match(/^\s*\d+\s*x\s*(\d+(?:[.,]\d+)?)/i);
    if (m) return parseFloat(m[1].replace(',', '.'));
    const n = num(s);
    return isNaN(n) || n === 0 ? '' : n;
  }
  const repsDef = r => { const n = num(r); return isNaN(n) ? '' : n; };
  function repHi(r) { const m = String(r).match(/(\d+)\s*-\s*(\d+)/); return m ? +m[2] : num(r); }
  function lastOf(ex) {
    for (let i = S.logs.length - 1; i >= 0; i--) {
      const e = S.logs[i].ex.find(x => x.id === ex.id || norm(x.n) === norm(ex.n));
      if (e && e.sets.length) return { sets: e.sets, t: Date.parse(S.logs[i].date) || 0 };
    }
    return null;
  }
  // charge proposée : la plus récente entre la dernière séance faite et la dernière modification manuelle du programme
  function initSets(ex) {
    const l = lastOf(ex), useStart = ex.startAt && (!l || ex.startAt > l.t), out = [];
    for (let i = 0; i < Math.max(1, ex.sets | 0); i++) {
      const ls = !useStart && l && (l.sets[i] || l.sets[l.sets.length - 1]);
      out.push({ w: ls ? ls.w : (ex.kind === 'w' ? startW(ex.start) : ''), r: ls ? ls.r : repsDef(ex.reps), d: false });
    }
    return out;
  }
  const restTxt = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${Math.floor(s / 60)} min`) : `${s} s`;
  const mmss = s => { const t = Math.max(0, Math.round(s)); return `${Math.floor(t / 60)}:${pad(t % 60)}`; };
  const setsDone = ex => { const a = S.cur.sets[ex.id] || []; return ex.kind === 'c' ? (a[0] && a[0].d ? 1 : 0) : a.filter(x => x.d).length; };
  const setsTotal = ex => ex.kind === 'c' ? 1 : (S.cur.sets[ex.id] || []).length;
  const lastTxt = (l, e) => l.sets.map(s => (s.w !== '' && s.w != null && e.kind === 'w' ? fw(s.w) + '×' : '') + s.r).join(' · ');

  /* ---------- icônes ---------- */
  const I = {
    home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
    list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    chart: '<path d="M4 20V4M4 20h16M8 15l4-4 3 3 5-6"/>',
    book: '<path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"/><path d="M5 17a3 3 0 013-3h11"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', go: '<path d="M9 5l7 7-7 7"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    check: '<path d="M4 12l5 5L20 6"/>', sword: '<path d="M20 4L9.5 14.5M20 4h-5M20 4v5M6.5 11.5l6 6M8 16l-4 4"/>', plus: '<path d="M12 5v14M5 12h14"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>'
  };
  const svg = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

  /* ---------- navigation ---------- */
  function go(v) { V.stack.push(v); history.pushState({ d: V.stack.length }, ''); render(); window.scrollTo(0, 0); }
  function back() { if (V.stack.length) history.back(); }
  window.addEventListener('popstate', () => { if (V.stack.length) { V.stack.pop(); render(); window.scrollTo(0, 0); } });
  function setTab(t) { V.tab = t; V.stack = []; render(); window.scrollTo(0, 0); }

  /* ---------- rendu ---------- */
  function render() {
    const y = window.scrollY, v = top();
    let body;
    if (v) body = v.t === 'prog' ? progView(v) : v.t === 'edit' ? editView(v) : workView();
    else body = ({ home: homeView, progs: progsView, adv: advView, track: trackView, guide: guideView, more: moreView })[V.tab]();
    $('#app').innerHTML = (v ? '' : header()) + `<main class="${v ? 'sub' : ''}">${body}</main>` + (v ? '' : nav());
    window.scrollTo(0, y);
    if (v && v.t === 'work') ensureWake(); else releaseWake();
    updateTimerUI();
    mountGame();
  }
  function header() {
    const d = new Date();
    return `<header class="hdr"><div class="logo"><img src="icons/icon.svg" alt="" width="30" height="30"><b>Entraînement</b></div>
      <div class="row" style="gap:12px"><span class="date">${DAYS[(d.getDay() + 6) % 7].slice(0, 3)}. ${d.getDate()} ${MONTHS[d.getMonth()]}</span><button class="ic sm" data-act="tab" data-t="more" aria-label="Réglages">${svg('gear')}</button></div></header>`;
  }
  function nav() {
    const t = [['home', 'Accueil', 'home'], ['progs', 'Séances', 'list'], ['adv', 'Aventure', 'sword'], ['track', 'Suivi', 'chart'], ['guide', 'Guide', 'book']];
    return `<nav>${t.map(([k, l, ic]) => `<button class="${V.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${svg(ic)}<span>${l}</span></button>`).join('')}</nav>`;
  }

  /* ----- Accueil ----- */
  function homeView() {
    const now = new Date(), di = (now.getDay() + 6) % 7, day = S.week[di], prog = day.p && progById(day.p);
    const hasCur = S.cur && progById(S.cur.prog);
    const doneToday = S.logs.some(l => logDay(l) === todayISO());
    const mon = new Date(now); mon.setDate(now.getDate() - di);
    let planned = 0, did = 0;
    const wk = S.week.map((d, i) => {
      const dt = new Date(mon); dt.setDate(mon.getDate() + i);
      const done = S.logs.some(l => logDay(l) === isoDay(dt));
      if (d.p) planned++; if (done) did++;
      return `<div class="day ${d.p ? 'has' : ''} ${done ? 'done' : ''} ${i === di ? 'today' : ''}"><span>${D1[i]}</span><i></i></div>`;
    }).join('');
    let hero;
    if (hasCur) {
      const cp = progById(S.cur.prog);
      hero = `<section class="hero"><div class="eyebrow">Séance en cours</div><h1>${esc(cp.name)}</h1><p class="sub">${esc(cp.tag)}</p>
        <button class="btn pri xl" data-act="resume">Reprendre</button>
        <button class="btn ghost sm dng" style="margin-top:10px" data-act="abandon">Abandonner cette séance</button></section>`;
    } else if (prog) {
      hero = `<section class="hero"><div class="eyebrow">Quête du jour · ${DAYS[di]}${prog.opt ? ' · optionnelle' : ''}</div>
        <h1>${esc(prog.name)}</h1><p class="sub">${esc(prog.tag)}</p>
        <div class="chips"><span class="chip">${esc(prog.dur)}</span><span class="chip">${prog.ex.filter(e => e.kind !== 'c').length} exercices</span>${doneToday ? '<span class="chip ok">Déjà faite</span>' : ''}</div>
        ${day.n ? `<p class="note">${esc(day.n)}</p>` : ''}
        <button class="btn pri xl" data-act="start" data-id="${prog.id}">${doneToday ? 'Refaire la séance' : 'Commencer'}</button></section>`;
    } else {
      hero = `<section class="hero rest"><div class="eyebrow">${DAYS[di]}</div><h1>${esc(day.l || 'Repos')}</h1>
        ${day.n ? `<p class="note">${esc(day.n)}</p>` : ''}
        <p class="mut" style="font-size:13px;margin:4px 0 10px">Envie de t'entraîner quand même ?</p>
        <div class="chips">${S.programs.map(q => `<button class="chip btnchip" data-act="openProg" data-id="${q.id}">${esc(q.name)}</button>`).join('')}</div></section>`;
    }
    const last = S.logs[S.logs.length - 1];
    const bw = S.body.slice().sort((a, b) => a.d.localeCompare(b.d)).pop();
    const nudge = (S.logs.length >= 3 && Date.now() - (S.lastBackup || 0) > 14 * 864e5)
      ? `<div class="card nudge"><div><b>Sauvegarde conseillée</b><p class="mut">${S.lastBackup ? 'Dernière il y a ' + Math.round((Date.now() - S.lastBackup) / 864e5) + ' jours.' : 'Aucune sauvegarde pour l\'instant.'}</p></div><button class="btn sm" data-act="export">Exporter</button></div>` : '';
    const xp = totalXp(), L = RPG.levelOf(xp), xa = RPG.need(L), xb = RPG.need(L + 1), stk = streakNow();
    const spamBtn = hasCur ? '' : `<button class="btn xl ghost spam" data-act="spam">Salle bondée ? Séance spam</button>`;
    const adv = `<button class="card advstrip" data-act="tab" data-t="adv"><canvas data-me class="px" width="30" height="36"></canvas>
      <div class="grow"><div class="eyebrow">Niveau ${L} · ${RPG.TIERS[RPG.tierIdx(L)].t}</div><div class="xp"><i style="width:${Math.round((xp - xa) / (xb - xa) * 100)}%"></i></div>
      <p class="mut">${xp - xa} / ${xb - xa} XP${stk > 1 ? ' · série de ' + stk : ''}</p></div>${svg('go', 'go')}</button>`;
    return `${hero}${spamBtn}${adv}${nudge}
      <div class="sect-h"><h2>La semaine</h2><button class="btn sm ghost" data-act="weekEdit">${svg('edit')}Modifier</button></div>
      <div class="week">${wk}</div>
      <div class="stats">
        <div class="stat"><b>${did}<small>/${planned}</small></b><span>cette semaine</span></div>
        <div class="stat"><b>${S.logs.length}</b><span>séances</span></div>
        <div class="stat"><b>${bw ? fw(bw.kg) : '—'}<small>${bw ? ' kg' : ''}</small></b><span>dernier poids</span></div>
      </div>
      ${last ? `<div class="card row sp"><div><div class="eyebrow">Dernière séance</div><b>${esc(last.name)}</b> <span class="mut">· ${fdate(last.date)}</span></div><span class="chip">${last.dur} min</span></div>` : ''}`;
  }

  /* ----- Séances ----- */
  function progsView() {
    const cards = S.programs.map((q, i) => {
      const days = S.week.map((d, k) => d.p === q.id ? DAYS[k].slice(0, 3) : null).filter(Boolean).join(' · ');
      return `<button class="prog" data-act="openProg" data-id="${q.id}"><div class="no">${pad(i + 1)}</div>
        <div class="grow"><h3>${esc(q.name)}</h3><p>${esc(q.tag)} · ${esc(q.dur)}${days ? ' · ' + days : ''}</p></div>${svg('go', 'go')}</button>`;
    }).join('');
    return `<div class="sect-h first"><h2>Séances</h2></div>${cards}
      <button class="btn xl" style="margin-top:6px" data-act="newProg">${svg('plus')} Nouvelle séance</button>`;
  }
  function progView(v) {
    const pr = progById(v.id);
    if (!pr) return '<div class="empty">Séance introuvable</div>';
    let secPrev = null;
    const lines = pr.ex.map(e => {
      const head = e.sec !== secPrev ? `<div class="sec"><span>${esc(e.sec)}</span></div>` : ''; secPrev = e.sec;
      const l = lastOf(e);
      const right = e.kind === 'c' ? esc(e.reps) : `${e.sets} × ${esc(e.reps)}`;
      const sub = l ? 'dernière : ' + lastTxt(l, e) : (e.start && e.kind === 'w' ? 'départ ' + esc(e.start) + ' kg' + (e.est ? ' (estimé)' : '') : esc(e.note));
      return `${head}<div class="ex-line"><div class="grow"><div class="n">${esc(e.n)}${e.key ? ' <span class="tagc">Noyau</span>' : ''}</div><div class="m">${sub}</div></div><div class="r">${right}</div></div>`;
    }).join('');
    return `<div class="top"><button class="ic" data-act="back">${svg('back')}</button><div class="grow"><h2>${esc(pr.name)}</h2><p>${esc(pr.tag)} · ${esc(pr.dur)}</p></div><button class="ic" data-act="edit" data-id="${pr.id}">${svg('edit')}</button></div>
      <button class="btn pri xl" data-act="start" data-id="${pr.id}">Commencer</button>${lines}
      ${pr.rule ? `<p class="note" style="margin-top:16px">${esc(pr.rule)}</p>` : ''}`;
  }

  /* ----- Éditeur ----- */
  function editView(v) {
    const pr = progById(v.id);
    if (!pr) return '<div class="empty">Séance introuvable</div>';
    const secs = [...new Set(pr.ex.map(e => e.sec))];
    const alertOpt = e => `<option value="">Aucune</option>` + Object.keys(ALERTS).map(k => `<option value="${k}" ${e.alert === k ? 'selected' : ''}>${ALERTS[k]}</option>`).join('');
    const ex = pr.ex.map((e, i) => `<div class="ed">
      <div class="hd"><b>${pad(i + 1)}</b>
        <button data-act="exUp" data-i="${i}">${svg('up')}</button><button data-act="exDown" data-i="${i}">${svg('down')}</button>
        <button data-act="exDup" data-i="${i}" title="Dupliquer">${svg('copy')}</button><button data-act="exDel" data-i="${i}" class="dng">${svg('trash')}</button></div>
      <label class="f"><span>Exercice</span><input class="fi" data-ef="n" data-i="${i}" value="${esc(e.n)}"></label>
      <label class="f"><span>Bloc (titre de section)</span><input class="fi" list="secs" data-ef="sec" data-i="${i}" value="${esc(e.sec)}"></label>
      <div class="g3"><label class="f"><span>Séries</span><input class="fi" inputmode="numeric" data-ef="sets" data-i="${i}" value="${esc(e.sets)}"></label>
      <label class="f"><span>Reps / durée</span><input class="fi" data-ef="reps" data-i="${i}" value="${esc(e.reps)}"></label>
      <label class="f"><span>Repos (s)</span><input class="fi" inputmode="numeric" data-ef="rest" data-i="${i}" value="${esc(e.rest)}"></label></div>
      <div class="g2"><label class="f"><span>Charge de départ (kg)</span><input class="fi" inputmode="decimal" data-ef="start" data-i="${i}" value="${esc(e.start)}"></label>
      <label class="f"><span>Type</span><select class="fi" data-ef="kind" data-i="${i}">
        <option value="w" ${e.kind === 'w' ? 'selected' : ''}>Charge + reps</option><option value="b" ${e.kind === 'b' ? 'selected' : ''}>Poids du corps</option><option value="c" ${e.kind === 'c' ? 'selected' : ''}>Case à cocher</option></select></label></div>
      <div class="g2"><label class="f"><span>Unité (ex. par bras)</span><input class="fi" data-ef="unit" data-i="${i}" value="${esc(e.unit || '')}"></label>
      <label class="f"><span>Alerte</span><select class="fi" data-ef="alert" data-i="${i}">${alertOpt(e)}</select></label></div>
      <label class="f"><span>Note</span><input class="fi" data-ef="note" data-i="${i}" value="${esc(e.note)}"></label>
      <div class="g2"><label class="tick"><input type="checkbox" data-ef="key" data-i="${i}" ${e.key ? 'checked' : ''}> Noyau (non négociable)</label>
      <label class="tick"><input type="checkbox" data-ef="est" data-i="${i}" ${e.est ? 'checked' : ''}> Charge estimée</label></div>
    </div>`).join('');
    return `<div class="top"><button class="ic" data-act="back">${svg('back')}</button><div class="grow"><h2>Modifier</h2><p>Enregistré automatiquement</p></div><button class="btn sm pri" data-act="back">OK</button></div>
      <div class="card"><label class="f"><span>Nom de la séance</span><input class="fi" data-pf="name" value="${esc(pr.name)}"></label>
      <div class="g2"><label class="f"><span>Sous-titre</span><input class="fi" data-pf="tag" value="${esc(pr.tag)}"></label>
      <label class="f"><span>Durée</span><input class="fi" data-pf="dur" value="${esc(pr.dur)}"></label></div></div>
      <datalist id="secs">${secs.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      ${ex}
      <p class="mut" style="font-size:12.5px;margin:2px 4px 12px">Repos à 0 = enchaîne directement avec l'exercice suivant (superset). Si tu modifies une charge de départ, elle est proposée à la prochaine séance, même si l'exercice a déjà un historique.</p>
      <button class="btn pri xl" style="margin-bottom:10px" data-act="exAdd">${svg('plus')} Ajouter un exercice</button>
      <div class="g2"><button class="btn" data-act="dupProg">Dupliquer la séance</button><button class="btn dng" data-act="delProg">Supprimer</button></div>`;
  }

  /* ----- Séance en cours ----- */
  function workView() {
    const pr = progById(S.cur && S.cur.prog);
    if (!pr) { V.stack = []; return '<div class="empty">Séance introuvable</div>'; }
    pr.ex.forEach(e => { if (!S.cur.sets[e.id]) S.cur.sets[e.id] = initSets(e); });
    let tot = 0, dn = 0; pr.ex.forEach(e => { tot += setsTotal(e); dn += setsDone(e); });
    let prev = null;
    const cards = pr.ex.map((e, i) => {
      const head = e.sec !== prev ? `<div class="sec"><span>${esc(e.sec)}</span></div>` : ''; prev = e.sec;
      return head + exCard(e, i, pr);
    }).join('');
    return `<div class="wk-top"><div class="row sp"><button class="ic" data-act="back">${svg('back')}</button>
        <div class="grow" style="min-width:0"><h2>${esc(pr.name)} <span class="mut">${esc(pr.tag)}</span></h2></div>
        <span class="chip" id="elapsed">${mmss((Date.now() - S.cur.start) / 1000)}</span></div>
      <div class="prog-bar"><i style="width:${tot ? Math.round(dn / tot * 100) : 0}%"></i></div></div>
      ${cards}
      ${pr.rule ? `<p class="note">${esc(pr.rule)}</p>` : ''}
      <button class="btn pri xl" data-act="finish" style="margin-top:10px">Terminer la séance · ${dn}/${tot}</button>
      <div style="height:${T ? 110 : 20}px"></div>`;
  }
  function exCard(e, i, pr) {
    const sets = S.cur.sets[e.id], list = pr.ex;
    const chain = e.rest === 0 && e.kind !== 'c' && i < list.length - 1 && list[i + 1].sec === e.sec;
    const flags = (e.alert ? `<span class="chip warn">${ALERTS[e.alert] || esc(e.alert)}</span>` : '') + (e.hold ? '<span class="chip warn">Ne pas forcer</span>' : '') + (e.unit ? `<span class="chip">${esc(e.unit)}</span>` : '');
    const why = e.adj && e.adj.why ? `<details class="why"><summary>Pourquoi cette charge ?</summary><p>${esc(e.adj.why)}</p>
      <p class="mut">${e.adj.old ? 'Ancienne charge : ' + esc(e.adj.old) + ' kg' : ''}${e.adj.conf ? ' · confiance : ' + esc(e.adj.conf) : ''}${e.adj.target ? ' · cible court terme : ' + esc(e.adj.target) + ' kg' : ''}</p></details>` : '';
    if (e.kind === 'c') {
      const on = sets[0] && sets[0].d;
      return `<article class="ex ${e.key ? 'key' : ''}"><button class="cbtn" data-act="tick" data-ex="${e.id}" data-i="0">
        <div class="chk ${on ? 'on' : ''}">${svg('check')}</div><div class="grow"><h3>${esc(e.n)} <span class="mut">· ${esc(e.reps)}${e.sets > 1 ? ' × ' + e.sets : ''}</span></h3>${e.note ? `<div class="nt">${esc(e.note)}</div>` : ''}</div></button></article>`;
    }
    const l = lastOf(e);
    let hint = '';
    if (l && e.kind === 'w') {
      const hi = repHi(e.reps), inc = /^bas/.test(pr.id) ? 5 : 2.5;
      if (hi && l.sets.length >= e.sets && l.sets.every(s => num(s.r) >= hi && s.w !== '' && s.w != null))
        hint = `<button class="chip ok btnchip" data-act="bump" data-ex="${e.id}" data-inc="${inc}">Fourchette atteinte · passer à +${fw(inc)} kg</button>`;
    }
    const lastChip = l ? `<span class="chip">Dernière fois : ${lastTxt(l, e)}</span>` : (e.kind === 'w' && e.start ? `<span class="chip">Départ : ${esc(e.start)} kg${e.est ? ' (estimé)' : ''}</span>` : '');
    const rows = sets.map((s, k) => `<div class="set ${e.kind === 'b' ? 'nw' : ''} ${s.d ? 'dn' : ''}"><div class="i">${k + 1}</div>
      ${e.kind === 'w' ? `<div class="unit" data-u="kg"><input class="in" inputmode="decimal" data-sk="w" data-ex="${e.id}" data-i="${k}" value="${esc(fw(s.w))}" placeholder="kg"></div>` : ''}
      <div class="unit" data-u="${e.kind === 'w' ? 'reps' : ''}"><input class="in" inputmode="decimal" data-sk="r" data-ex="${e.id}" data-i="${k}" value="${esc(s.r)}" placeholder="${esc(e.reps)}"></div>
      <button class="chk ${s.d ? 'on' : ''}" data-act="tick" data-ex="${e.id}" data-i="${k}" aria-label="Valider la série">${svg('check')}</button></div>`).join('');
    return `<article class="ex ${e.key ? 'key' : ''} ${chain ? 'chain' : ''}">
      <div class="row sp" style="align-items:flex-start"><div class="grow"><h3>${esc(e.n)}</h3>
      <div class="tg">${e.sets} × ${esc(e.reps)}${e.rest ? ' · repos ' + restTxt(e.rest) : ' · enchaîne'}</div></div>${e.key ? '<span class="tagc">Noyau</span>' : ''}</div>
      ${e.note ? `<div class="nt">${esc(e.note)}</div>` : ''}
      <div class="lh">${flags}${lastChip}${hint}</div>${why}
      <div class="sets">${rows}</div>
      <div class="ex-act"><button data-act="addSet" data-ex="${e.id}">+ série</button><button data-act="remSet" data-ex="${e.id}">− série</button></div></article>`;
  }

  /* ----- Suivi ----- */
  function trackView() {
    const body = S.body.slice().sort((a, b) => a.d.localeCompare(b.d));
    const lastB = body[body.length - 1], firstB = body[0];
    const delta = body.length > 1 ? (lastB.kg - firstB.kg) : 0;
    const bl = body.slice().reverse().slice(0, 6).map(b => `<div class="rk"><span>${fdate(b.d)}</span><span class="mut grow">${b.waist ? 'taille ' + fw(b.waist) + ' cm' : ''}</span><b class="v">${fw(b.kg)} kg</b><button data-act="bodyDel" data-id="${b.id}" class="mut" aria-label="Supprimer">${svg('trash')}</button></div>`).join('');
    const recs = recordsList().slice(0, 10).map(r => `<div class="rk"><div class="grow"><b>${esc(r.n)}</b><div class="mut" style="font-size:12px">${fdate(r.d)}</div></div><b class="v">${fw(r.w)} kg <small>× ${esc(r.r)}</small></b></div>`).join('');
    const hist = S.logs.slice().reverse().slice(0, 30).map(l => {
      const vol = l.ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + (num(s.w) || 0) * (num(s.r) || 0), 0), 0);
      return `<details class="g hist"><summary><div class="grow"><b>${esc(l.name)}</b><div class="d">${fdate(l.date)} · ${l.dur} min · ${(vol / 1000).toFixed(1).replace('.', ',')} t${l.xp ? ' · +' + l.xp + ' XP' : ''}</div></div></summary>
        <ul>${l.ex.filter(e => e.sets.length).map(e => `<li><b>${esc(e.n)}</b> — ${e.sets.map(s => (s.w !== '' && s.w != null ? fw(s.w) + '×' : '') + s.r).join(' · ')}</li>`).join('')}</ul>
        ${l.coach ? `<p class="note" style="margin:0 15px 12px">${esc(l.coach)}</p>` : ''}
        <div style="padding:0 15px 13px"><button class="btn sm dng" data-act="logDel" data-id="${l.id}">Supprimer</button></div></details>`;
    }).join('');
    return `<div class="sect-h first"><h2>Poids & mesures</h2><button class="btn sm pri" data-act="bodyAdd">${svg('plus')} Pesée</button></div>
      <div class="card">${lastB ? `<div class="row sp" style="margin-bottom:6px"><b class="bignum">${fw(lastB.kg)}<small> kg</small></b>
        ${body.length > 1 ? `<span class="chip ${delta <= 0 ? 'ok' : ''}">${delta > 0 ? '+' : ''}${fw(Math.round(delta * 10) / 10)} kg depuis le début</span>` : ''}</div>` : ''}${bodyChart(body)}</div>${bl}
      <div class="sect-h"><h2>Records</h2></div>${recs || '<div class="card empty">Tes records apparaîtront après ta première séance.</div>'}
      <div class="sect-h"><h2>Historique</h2></div>${hist || '<div class="card empty">Aucune séance enregistrée.</div>'}`;
  }
  function bodyChart(b) {
    if (b.length < 2) return `<div class="empty" style="padding:14px">${b.length ? 'Ajoute une deuxième pesée pour voir la courbe.' : 'Ajoute ta première pesée pour démarrer le suivi.'}</div>`;
    const W = 320, H = 130, pl = 8, pr = 8, pt = 12, pb = 12;
    const ks = b.map(x => +x.kg), mn = Math.min(...ks) - 0.5, mx = Math.max(...ks) + 0.5;
    const pts = b.map((x, i) => [pl + i * (W - pl - pr) / (b.length - 1), pt + (1 - (x.kg - mn) / (mx - mn)) * (H - pt - pb)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a)" stop-opacity=".28"/><stop offset="1" stop-color="var(--a)" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#ga)"/><path d="${line}" fill="none" stroke="var(--a)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.2" fill="var(--bg)" stroke="var(--a)" stroke-width="2"/>`).join('')}</svg>`;
  }
  function recordsList() {
    const best = {};
    S.logs.forEach(l => l.ex.forEach(e => e.sets.forEach(s => {
      const w = num(s.w); if (!w) return; const k = norm(e.n);
      if (!best[k] || w > best[k].w || (w === best[k].w && num(s.r) > num(best[k].r))) best[k] = { n: e.n, w, r: s.r, d: l.date };
    })));
    return Object.values(best).sort((a, b) => b.w - a.w);
  }

  /* ----- Aventure ----- */
  const totalXp = () => S.logs.reduce((n, l) => n + (l.xp || 0), 0);
  // série = jours d'entraînement consécutifs ; un jour de repos prévu au planning (ou une séance optionnelle) ne la casse pas
  function streakNow() {
    const days = new Set(S.logs.map(logDay));
    const planned = d => { const w = S.week[(d.getDay() + 6) % 7], p = w && w.p && S.programs.find(x => x.id === w.p); return !!p && !p.opt; };
    const d = new Date(); let n = days.has(isoDay(d)) ? 1 : 0;
    for (let i = 0; i < 120; i++) { d.setDate(d.getDate() - 1); if (days.has(isoDay(d))) n++; else if (planned(d)) break; }
    return n;
  }
  function badges() {
    const maxSt = Math.max(0, ...S.logs.map(l => l.streak || 0)), spam = S.logs.filter(l => l.spam).length, full = S.logs.filter(l => l.full).length, rec = S.logs.reduce((n, l) => n + (l.rec || 0), 0);
    return [['Régulier', 'Série de 5 séances', maxSt >= 5], ['Inarrêtable', 'Série de 10 séances', maxSt >= 10], ['Sans faute', '10 séances complètes', full >= 10],
      ['Briseur de records', '10 records battus', rec >= 10], ['Roi du spam', '5 séances spam', spam >= 5], ['Centurion', '100 séances', S.logs.length >= 100]];
  }
  function mountGame() {
    const L = RPG.levelOf(totalXp());
    document.querySelectorAll('canvas[data-me]').forEach(c => RPG.portrait(c, L));
    const c = $('#adv'); if (c) RPG.start(c, L, $('#advcap')); else RPG.stop();
  }
  function advView() {
    const xp = totalXp(), L = RPG.levelOf(xp), xa = RPG.need(L), xb = RPG.need(L + 1), ti = RPG.tierIdx(L), zi = RPG.zoneIdx(L);
    const stk = streakNow(), today = S.logs.some(l => logDay(l) === todayISO()), nextMult = RPG.streakMult(Math.max(1, today ? stk : stk + 1));
    const beaten = RPG.ZONES.reduce((n, z) => n + z.m.filter(m => m.l <= L).length, 0), total = RPG.ZONES.reduce((n, z) => n + z.m.length, 0);
    const zones = RPG.ZONES.map((z, i) => {
      const open = L >= z.l, done = z.m.every(m => m.l <= L);
      return `<div class="zone ${open ? '' : 'lock'} ${i === zi ? 'cur' : ''}"><div class="row sp"><b>${open ? esc(z.n) : 'Zone inconnue'}</b><span class="chip ${done ? 'ok' : ''}">${done ? 'Terminée' : open ? 'En cours' : 'Niveau ' + z.l}</span></div>
        ${open ? `<ul>${z.m.map(m => `<li class="${m.l <= L ? 'won' : ''}"><span>${esc(m.n)}</span><small>${m.l <= L ? 'vaincu' : 'niveau ' + m.l}</small></li>`).join('')}</ul>` : ''}</div>`;
    }).join('');
    const tiers = RPG.TIERS.map((t, i) => `<div class="rk"><div class="grow"><b>${L >= t.l ? esc(t.t) : '???'}</b><div class="mut" style="font-size:12.5px">${L >= t.l ? esc(t.g) : 'Se débloque au niveau ' + t.l}</div></div>${i === ti ? '<span class="tagc">Actuel</span>' : ''}</div>`).join('');
    const bd = badges().map(b => `<div class="rk"><div class="grow"><b class="${b[2] ? '' : 'mut'}">${b[0]}</b><div class="mut" style="font-size:12.5px">${b[1]}</div></div>${b[2] ? '<span class="chip ok">Obtenu</span>' : ''}</div>`).join('');
    return `<div class="sect-h first"><h2>Aventure</h2><span class="chip">${esc(RPG.ZONES[zi].n)}</span></div>
      <div class="scene"><div class="hud"><b>NIV. ${L}</b><span>${esc(RPG.TIERS[ti].t)}</span><div class="xp"><i style="width:${Math.round((xp - xa) / (xb - xa) * 100)}%"></i></div></div><canvas id="adv" width="144" height="128"></canvas><div id="advcap" class="cap">${esc(S.name)} avance dans ${esc(RPG.ZONES[zi].n.toLowerCase())}.</div></div>
      <div class="card me"><canvas data-me class="px" width="30" height="36"></canvas><div class="grow"><div class="eyebrow">Niveau ${L}</div><h3>${esc(S.name)}, ${esc(RPG.TIERS[ti].t)}</h3>
        <div class="xp"><i style="width:${Math.round((xp - xa) / (xb - xa) * 100)}%"></i></div><p class="mut" style="font-size:12.5px">${xp - xa} / ${xb - xa} XP · niveau ${L + 1} dans ${xb - xp} XP</p></div></div>
      <div class="stats">
        <div class="stat"><b>${stk}</b><span>série en cours</span></div>
        <div class="stat"><b>×${fw(nextMult)}</b><span>prochaine séance</span></div>
        <div class="stat"><b>${beaten}<small>/${total}</small></b><span>monstres vaincus</span></div>
      </div>
      <details class="g"><summary>Comment gagner de l'XP</summary><ul>
        <li><b>3 XP</b> par série validée, <b>2 XP</b> par échauffement, <b>+15</b> si la séance est faite en entier, <b>+5</b> par record.</li>
        <li>Le total est multiplié par ta série : ×1 le premier jour, puis +0,25 par jour d'entraînement d'affilée, jusqu'à ×2,5.</li>
        <li>Un jour de repos prévu au planning ne casse pas la série. Un jour de séance prévu et sauté la remet à zéro.</li>
        <li>Une séance spam compte comme les autres : ce sont les séries validées qui paient.</li></ul></details>
      <div class="sect-h"><h2>Le voyage</h2></div>${zones}
      <div class="sect-h"><h2>Équipement</h2></div>${tiers}
      <div class="sect-h"><h2>Titres</h2></div>${bd}`;
  }

  /* ----- Guide ----- */
  function guideView() {
    return `<div class="sect-h first"><h2>Guide</h2></div>` + S.guide.map(g => `<details class="g" ${g.open ? 'open' : ''}><summary>${esc(g.t)}</summary><ul>${g.b.map(x => `<li>${rich(x)}</li>`).join('')}</ul></details>`).join('');
  }

  /* ----- Réglages ----- */
  function moreView() {
    setTimeout(() => { try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { const el = $('#persist'); if (el) el.textContent = p ? 'Stockage protégé par le navigateur.' : 'Stockage non protégé : exporte régulièrement une sauvegarde.'; }); } catch (e) { } }, 0);
    return `<div class="sect-h first"><h2>Réglages</h2></div>
      <div class="card"><label class="f"><span>Prénom</span><input class="fi" data-name value="${esc(S.name)}"></label>
        <button class="btn" style="width:100%" data-act="weekEdit">${svg('edit')} Modifier ma semaine type</button></div>
      <div class="card">
        <div class="sw"><span>Son à la fin du repos</span><button class="tog ${S.opts.sound ? 'on' : ''}" data-act="optSound" aria-label="Son"></button></div>
        <div class="sw"><span>Vibration</span><button class="tog ${S.opts.vib ? 'on' : ''}" data-act="optVib" aria-label="Vibration"></button></div></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:6px">Sauvegarde</div>
        <p class="mut" style="font-size:13px;margin-bottom:6px">Tes séances, charges et modifications sont enregistrées sur ce téléphone et restent après chaque mise à jour de l'app. Exporte de temps en temps un fichier de sauvegarde (changement de téléphone, nettoyage du navigateur).</p>
        <p class="mut" style="font-size:12.5px;margin-bottom:12px" id="persist"></p>
        <p style="font-size:13px;margin-bottom:12px">Dernière sauvegarde : <b>${S.lastBackup ? fdate(new Date(S.lastBackup).toISOString()) : 'jamais'}</b></p>
        <div class="g2"><button class="btn" data-act="export">Exporter</button><button class="btn" data-act="importPick">Importer</button></div>
        <input type="file" id="imp" accept="application/json,.json" hidden></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:10px">Programme</div>
        <p class="mut" style="font-size:13px;margin-bottom:12px">Programme d'origine : v${esc(S.progV || '')}. Remettre les séances d'origine efface tes modifications de séances, jamais ton historique.</p>
        <button class="btn dng" style="width:100%" data-act="resetProgs">Remettre les séances d'origine</button></div>
      <p class="mut" style="text-align:center;font-size:12px;margin-top:18px">Entraînement · fonctionne hors ligne</p>`;
  }

  /* ---------- feuilles / dialogues ---------- */
  let askRes = null;
  function openSheet(html) { $('#sheet').innerHTML = `<div class="bk" data-act="sheetX"></div><div class="pn">${html}</div>`; $('#sheet').classList.add('show'); }
  function closeSheet() { $('#sheet').classList.remove('show'); $('#sheet').innerHTML = ''; if (askRes) { const r = askRes; askRes = null; r(false); } }
  function ask(msg, ok = 'Confirmer', danger = true) {
    return new Promise(res => {
      askRes = res;
      openSheet(`<h2>${esc(msg)}</h2><div class="g2" style="margin-top:16px"><button class="btn" data-act="sheetX">Annuler</button><button class="btn ${danger ? 'dng' : 'pri'}" data-act="askOk">${esc(ok)}</button></div>`);
    });
  }
  let toastT;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }

  /* ---------- minuteur de repos ---------- */
  let T = null, actx = null, wake = null;
  function unlockAudio() { try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { } }
  function beep() {
    if (S.opts.vib && navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400]);
    if (!S.opts.sound || !actx) return;
    try {
      [0, .22, .44].forEach((t, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), n = actx.currentTime + t;
        o.type = 'triangle'; o.frequency.value = i === 2 ? 1175 : 880; o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(.0001, n); g.gain.exponentialRampToValueAtTime(.5, n + .02); g.gain.exponentialRampToValueAtTime(.0001, n + .2);
        o.start(n); o.stop(n + .22);
      });
    } catch (e) { }
  }
  function startTimer(sec, label) { T = { end: Date.now() + sec * 1000, total: sec, label, done: false }; updateTimerUI(); }
  function updateTimerUI() {
    const el = $('#timer');
    if (!T) { el.classList.remove('show'); return; }
    const left = Math.max(0, (T.end - Date.now()) / 1000);
    el.classList.add('show');
    if (!$('.tm', el)) {
      el.innerHTML = `<div class="tm"><div class="bar"><i></i></div><div class="row sp"><div class="row" style="gap:14px;min-width:0"><div class="t" id="tt"></div><div style="min-width:0"><small id="tl">REPOS</small><b>${esc(T.label)}</b></div></div>
        <div class="row" style="gap:6px"><button class="btn" data-act="tm" data-d="-15">−15</button><button class="btn" data-act="tm" data-d="15">+15</button><button class="btn" data-act="tmx" aria-label="Fermer">×</button></div></div></div>`;
    }
    $('#tt').textContent = mmss(Math.ceil(left));
    $('.bar i', el).style.width = (T.done ? 100 : (100 - left / T.total * 100)) + '%';
    $('.tm', el).classList.toggle('go', T.done);
    $('#tl').textContent = T.done ? 'REPRENDS' : 'REPOS';
  }
  setInterval(() => {
    if (T) {
      if (!T.done && T.end <= Date.now()) { T.done = true; T.doneAt = Date.now(); beep(); }
      if (T.done && Date.now() - T.doneAt > 4000) { T = null; $('#timer').innerHTML = ''; }
      updateTimerUI();
    }
    const el = $('#elapsed'); if (el && S.cur) el.textContent = mmss((Date.now() - S.cur.start) / 1000);
  }, 250);
  async function ensureWake() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) { } }
  function releaseWake() { try { if (wake) wake.release(); } catch (e) { } wake = null; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && top() && top().t === 'work') ensureWake(); });

  /* ---------- séance : démarrage / fin ---------- */
  async function startProg(id) {
    if (S.cur && S.cur.prog !== id) {
      if (!await ask('Une séance est déjà en cours. L\'abandonner ?', 'Abandonner')) return;
      S.cur = null;
    }
    if (!S.cur) {
      const pr = progById(id); S.cur = { prog: id, start: Date.now(), sets: {} };
      pr.ex.forEach(e => { S.cur.sets[e.id] = initSets(e); });
      save();
    }
    T = null; go({ t: 'work' });
  }
  // le mot du coach : dépend de ce qui a réellement été fait
  function coachLine(o) {
    const pick = arr => arr[S.logs.length % arr.length];
    let s;
    if (!o.sets) s = 'Rien de validé aujourd\'hui. Ça arrive, mais on ne va pas se mentir : celle-là ne compte pas. On se revoit à la prochaine.';
    else if (o.spam) s = o.sets < 5
      ? `Salle pleine et ${o.sets} séries seulement sur ${o.names}. C'est fait, mais en spam vise au moins 5 séries par mouvement pour que ça pèse.`
      : pick([`Salle pleine, et tu as quand même sorti ${o.sets} séries sur ${o.names}. Bon réflexe : du volume sur un gros mouvement vaut mieux qu'une séance annulée.`,
        `${o.sets} séries sur ${o.names}. Simple et efficace. Surveille la qualité des dernières : quand la technique part, tu arrêtes.`,
        `Tu as transformé une salle bondée en vraie séance : ${o.sets} séries sur ${o.names}. La prochaine fois, change de mouvement pour ne pas toujours taper les mêmes articulations.`]);
    else if (o.full) s = pick(['Séance complète, du premier au dernier exercice. Rien à redire. Mange tes protéines et dors.',
      'Tout est coché. C\'est avec des séances comme celle-là, répétées, que le physique change.',
      'Carton plein. Si les dernières séries étaient faciles, on monte la charge la prochaine fois.']);
    else if (o.coreTotal && o.coreDone < o.coreTotal) s = pick(['Séance incomplète et le noyau n\'est pas terminé. Ça arrive. La prochaine fois, tu commences par le haut de la liste et tu ne lâches pas les deux premiers.',
      `${o.doneEx} exercice${o.doneEx > 1 ? 's' : ''} sur ${o.totalEx}, et le noyau n'est pas bouclé. Tu es venu, c'est déjà ça, mais ce sont les deux premiers mouvements qui font progresser.`]);
    else if (o.coreTotal && o.doneEx <= o.coreTotal) s = pick(['Noyau fait, le reste sauté. Ça reste une vraie séance de 20 minutes : l\'essentiel est là.',
      'Tu as fait les deux mouvements qui comptent. Mieux vaut ça que rien, mais ne laisse pas les accessoires sauter trois fois de suite : tes épaules et ton tirage en ont besoin.']);
    else s = pick([`${o.doneEx} exercices sur ${o.totalEx}, les plus importants d'abord. Tu as coupé par le bas, c'est la bonne façon de raccourcir.`,
      `${o.doneEx} exercices sur ${o.totalEx}. Bonne séance. Il manque la fin : si c'est le temps qui a manqué, enchaîne les supersets sans traîner la prochaine fois.`]);
    if (o.records) s += o.records > 1 ? ` Et ${o.records} records au passage.` : ' Et un record au passage.';
    if (o.streak >= 3) s += ` ${o.streak} jours d'entraînement d'affilée : garde ce rythme.`;
    return s;
  }
  function finish() {
    const pr = progById(S.cur.prog), spam = !!pr.spam, work = pr.ex.filter(e => e.kind !== 'c');
    const nDone = e => (S.cur.sets[e.id] || []).filter(s => s.d).length, planned = e => Math.max(1, e.sets | 0);
    const ex = pr.ex.map(e => ({
      id: e.id, n: e.n,
      sets: (e.kind === 'c' ? [] : (S.cur.sets[e.id] || [])).filter(s => s.d).map(s => ({ w: e.kind === 'w' ? (s.w === '' ? '' : (num(s.w) || '')) : '', r: s.r }))
    }));
    const warm = pr.ex.filter(e => e.kind === 'c' && setsDone(e)).length;
    const allSets = work.reduce((n, e) => n + nDone(e), 0), xpSets = work.reduce((n, e) => n + Math.min(8, nDone(e)), 0);
    const doneEx = work.filter(e => nDone(e) > 0).length, full = !spam && work.length > 0 && work.every(e => nDone(e) >= planned(e));
    const core = work.filter(e => e.key), coreDone = core.filter(e => nDone(e) >= planned(e)).length;
    const doRecords = [];
    ex.forEach(e => {
      const best = Math.max(0, ...e.sets.map(s => num(s.w) || 0));
      if (!best) return;
      let prevBest = 0; S.logs.forEach(l => { const o = l.ex.find(x => x.id === e.id || norm(x.n) === norm(e.n)); if (o) o.sets.forEach(s => { prevBest = Math.max(prevBest, num(s.w) || 0); }); });
      if (prevBest && best > prevBest) doRecords.push({ n: e.n, w: best, was: prevBest });
    });
    const dur = Math.max(1, Math.round((Date.now() - S.cur.start) / 60000));
    const vol = ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + (num(s.w) || 0) * (num(s.r) || 0), 0), 0);
    const lvl0 = RPG.levelOf(totalXp());
    const log = { id: uid(), date: new Date().toISOString(), prog: pr.id, name: spam ? 'Spam · ' + pr.tag : pr.name, dur, ex, spam, full, rec: doRecords.length };
    S.logs.push(log);
    const streak = streakNow(), gain = RPG.sessionXp({ sets: xpSets, warm, full, records: doRecords.length, streak });
    log.xp = gain.xp; log.streak = streak; log.mult = gain.mult;
    log.coach = coachLine({ sets: allSets, spam, names: pr.tag, full, doneEx, totalEx: work.length, coreDone, coreTotal: core.length, records: doRecords.length, streak });
    const lvl1 = RPG.levelOf(totalXp()), newTier = RPG.tierIdx(lvl1) > RPG.tierIdx(lvl0), newZone = RPG.zoneIdx(lvl1) > RPG.zoneIdx(lvl0);
    S.cur = null; T = null; save();
    V.stack = []; V.tab = 'home'; render(); window.scrollTo(0, 0);
    openSheet(`<div class="win"><div class="eyebrow">Quête accomplie</div><h2 style="font-size:30px;margin:6px 0">${esc(log.name)}</h2>
      <div class="g"><div class="stat"><b>${dur}</b><span>minutes</span></div><div class="stat"><b>${allSets + warm}</b><span>séries</span></div><div class="stat"><b>${(vol / 1000).toFixed(1).replace('.', ',')}</b><span>tonnes</span></div></div>
      <div class="coach"><div class="eyebrow">Le coach</div><p>${esc(log.coach)}</p></div>
      <div class="xpgain"><b>+${gain.xp} XP</b><span>${gain.base} × ${fw(gain.mult)} · série de ${streak}</span></div>
      ${lvl1 > lvl0 ? `<div class="lvlup">Niveau supérieur · niveau ${lvl1}${newTier ? ' · nouveau titre : ' + esc(RPG.TIERS[RPG.tierIdx(lvl1)].t) : ''}${newZone ? ' · nouvelle zone : ' + esc(RPG.ZONES[RPG.zoneIdx(lvl1)].n) : ''}</div>` : ''}
      ${doRecords.map(r => `<div class="rec"><span>${esc(r.n)}</span><span>${fw(r.was)} → <b>${fw(r.w)} kg</b></span></div>`).join('')}
      <div class="g2" style="margin-top:12px"><button class="btn" data-act="toAdv">Voir l'aventure</button><button class="btn pri" data-act="sheetX">Fermer</button></div></div>`);
  }

  /* ---------- sauvegarde / import ---------- */
  function importData(o) {
    if (o && Array.isArray(o.programs) && Array.isArray(o.week)) { S = o; S.opts = S.opts || { sound: true, vib: true }; S.logs = S.logs || []; S.body = S.body || []; S.guide = S.guide || clone(FONTE_DEFAULT.guide); migrate(S); return true; }
    if (o && o.profiles && o.profiles.him) { S = fromOld(o); return true; }
    return false;
  }

  /* ---------- actions ---------- */
  const A = {
    toAdv() { closeSheet(); setTab('adv'); },
    spam() {
      const seen = {}, list = [];
      S.programs.forEach(p => p.ex.forEach(e => { const k = norm(e.n); if (e.kind !== 'c' && !seen[k]) { seen[k] = 1; list.push(e); } }));
      list.sort((x, y) => (y.key ? 1 : 0) - (x.key ? 1 : 0));
      openSheet(`<h2>Séance spam</h2><p class="mut" style="margin-bottom:12px;font-size:13.5px">Salle bondée : choisis un ou deux exercices et enchaîne les séries dessus.</p>
        <div class="picks">${list.map(e => `<label class="pickrow"><input type="checkbox" data-sp="${e.id}"><span>${esc(e.n.replace(/^[A-Z]\d\s*·\s*/, ''))}</span></label>`).join('')}</div>
        <div class="g2" style="margin-top:12px"><label class="f"><span>Autre exercice</span><input class="fi" id="spx" placeholder="ex. Tractions"></label>
        <label class="f"><span>Séries par exercice</span><input class="fi" id="spn" inputmode="numeric" value="6"></label></div>
        <button class="btn pri xl" data-act="spamGo">Commencer</button>`);
    },
    async spamGo() {
      const n = Math.min(15, Math.max(1, parseInt($('#spn').value) || 6)), picked = [];
      document.querySelectorAll('[data-sp]:checked').forEach(c => { for (const p of S.programs) { const e = p.ex.find(x => x.id === c.dataset.sp); if (e) { picked.push(clone(e)); break; } } });
      const other = $('#spx').value.trim();
      if (other) picked.push({ id: 'x_' + norm(other).replace(/ /g, '_'), n: other, reps: 'max', rest: 120, start: '', note: '', kind: 'w' });
      if (!picked.length) { toast('Choisis au moins un exercice'); return; }
      closeSheet();
      if (S.cur && !await ask('Une séance est déjà en cours. L\'abandonner ?', 'Abandonner')) return;
      picked.forEach(e => { e.n = e.n.replace(/^[A-Z]\d\s*·\s*/, ''); e.sets = n; e.sec = 'Spam'; e.key = false; e.rest = e.rest || 120; });
      const prog = { id: '__spam', spam: true, name: 'Spam', tag: picked.map(e => e.n).join(' + '), dur: 'libre', ex: picked };
      S.cur = { prog: '__spam', spamProg: prog, start: Date.now(), sets: {} };
      prog.ex.forEach(e => { S.cur.sets[e.id] = initSets(e); });
      save(); T = null; go({ t: 'work' });
    },
    tab(t) { setTab(t.dataset.t); },
    back() { back(); },
    openProg(t) { go({ t: 'prog', id: t.dataset.id }); },
    start(t) { startProg(t.dataset.id); },
    resume() { go({ t: 'work' }); },
    async abandon() { if (await ask('Abandonner la séance en cours ?', 'Abandonner')) { S.cur = null; T = null; save(); render(); } },
    edit(t) { go({ t: 'edit', id: t.dataset.id }); },
    newProg() {
      const id = 'p' + uid();
      S.programs.push({ id, name: 'Nouvelle séance', tag: 'Perso', dur: '~45 min', ex: [{ id: 'e' + uid(), sec: 'Noyau', n: 'Nouvel exercice', sets: 3, reps: '10', rest: 90, start: '', note: '', kind: 'w', key: false }] });
      save(); go({ t: 'edit', id });
    },
    async delProg() {
      const v = top(); if (!await ask('Supprimer cette séance ?', 'Supprimer')) return;
      S.programs = S.programs.filter(x => x.id !== v.id); S.week.forEach(d => { if (d.p === v.id) d.p = null; });
      if (S.cur && S.cur.prog === v.id) S.cur = null; save(); V.stack = []; V.tab = 'progs'; render(); toast('Séance supprimée');
    },
    dupProg() {
      const v = top(), pr = progById(v.id), id = 'p' + uid();
      const c = clone(pr); c.id = id; c.name += ' (copie)'; c.ex.forEach(e => { e.id = 'e' + uid(); });
      S.programs.push(c); save(); V.stack.pop(); V.stack.push({ t: 'edit', id }); render(); window.scrollTo(0, 0); toast('Séance dupliquée');
    },
    exAdd() { const pr = progById(top().id), l = pr.ex[pr.ex.length - 1]; pr.ex.push({ id: 'e' + uid(), sec: l ? l.sec : 'Noyau', n: 'Nouvel exercice', sets: 3, reps: '10', rest: 90, start: '', note: '', kind: 'w', key: false }); save(); render(); window.scrollTo(0, document.body.scrollHeight); },
    async exDel(t) { if (!await ask('Supprimer cet exercice ?', 'Supprimer')) return; const pr = progById(top().id); pr.ex.splice(+t.dataset.i, 1); save(); render(); },
    exDup(t) { const pr = progById(top().id), i = +t.dataset.i, c = clone(pr.ex[i]); c.id = 'e' + uid(); pr.ex.splice(i + 1, 0, c); save(); render(); },
    exUp(t) { const pr = progById(top().id), i = +t.dataset.i; if (i > 0) { [pr.ex[i - 1], pr.ex[i]] = [pr.ex[i], pr.ex[i - 1]]; save(); render(); } },
    exDown(t) { const pr = progById(top().id), i = +t.dataset.i; if (i < pr.ex.length - 1) { [pr.ex[i + 1], pr.ex[i]] = [pr.ex[i], pr.ex[i + 1]]; save(); render(); } },
    tick(t) {
      unlockAudio();
      const pr = progById(S.cur.prog), e = pr.ex.find(x => x.id === t.dataset.ex), s = S.cur.sets[e.id][+t.dataset.i];
      s.d = !s.d;
      if (s.d && navigator.vibrate && S.opts.vib) navigator.vibrate(15);
      if (s.d && e.kind !== 'c' && e.rest > 0) startTimer(e.rest, e.n);
      save(); render();
    },
    bump(t) { S.cur.sets[t.dataset.ex].forEach(s => { if (!s.d && s.w !== '') s.w = Math.round(((num(s.w) || 0) + parseFloat(t.dataset.inc)) * 100) / 100; }); save(); render(); },
    addSet(t) { const a = S.cur.sets[t.dataset.ex], l = a[a.length - 1] || { w: '', r: '' }; a.push({ w: l.w, r: l.r, d: false }); save(); render(); },
    remSet(t) { const a = S.cur.sets[t.dataset.ex]; if (a.length > 1) { a.pop(); save(); render(); } },
    async finish() {
      const pr = progById(S.cur.prog); let dn = 0; pr.ex.forEach(e => { dn += setsDone(e); });
      if (!dn && !await ask('Aucune série validée. Terminer quand même ?', 'Terminer', false)) return;
      finish();
    },
    tm(t) { if (T) { T.end += +t.dataset.d * 1000; T.total = Math.max(T.total, (T.end - Date.now()) / 1000); T.done = false; updateTimerUI(); } },
    tmx() { T = null; $('#timer').innerHTML = ''; updateTimerUI(); render(); },
    sheetX() { closeSheet(); },
    askOk() { const r = askRes; askRes = null; closeSheet(); if (r) r(true); },
    weekEdit() {
      const opts = sel => `<option value="">Repos</option>` + S.programs.map(q => `<option value="${q.id}" ${q.id === sel ? 'selected' : ''}>${esc(q.name)} · ${esc(q.tag)}</option>`).join('');
      openSheet(`<h2>Semaine type</h2><p class="mut" style="margin-bottom:14px;font-size:13px">Choisis la séance de chaque jour.</p>
        ${S.week.map((d, i) => `<label class="f"><span>${DAYS[i]}</span><select class="fi" data-wd="${i}">${opts(d.p)}</select></label>`).join('')}
        <button class="btn pri xl" data-act="weekSave" style="margin-top:6px">Enregistrer</button>`);
    },
    weekSave() { document.querySelectorAll('[data-wd]').forEach(s => { const d = S.week[+s.dataset.wd]; d.p = s.value || null; if (!d.p && !d.l) d.l = 'Repos'; }); save(); closeSheet(); render(); toast('Semaine mise à jour'); },
    bodyAdd() {
      openSheet(`<h2>Nouvelle pesée</h2>
        <label class="f"><span>Date</span><input class="fi" type="date" id="bd" value="${todayISO()}"></label>
        <div class="g2"><label class="f"><span>Poids (kg)</span><input class="fi" id="bk" inputmode="decimal" placeholder="ex. 84,5"></label>
        <label class="f"><span>Tour de taille (cm)</span><input class="fi" id="bw" inputmode="decimal" placeholder="optionnel"></label></div>
        <button class="btn pri xl" data-act="bodySave">Enregistrer</button>`);
    },
    bodySave() {
      const kg = num($('#bk').value); if (isNaN(kg)) { toast('Entre un poids'); return; }
      const w = num($('#bw').value);
      S.body.push({ id: uid(), d: $('#bd').value || todayISO(), kg, waist: isNaN(w) ? '' : w }); save(); closeSheet(); render(); toast('Pesée ajoutée');
    },
    async bodyDel(t) { if (await ask('Supprimer cette pesée ?', 'Supprimer')) { S.body = S.body.filter(b => b.id !== t.dataset.id); save(); render(); } },
    async logDel(t) { if (await ask('Supprimer cette séance de l\'historique ?', 'Supprimer')) { S.logs = S.logs.filter(l => l.id !== t.dataset.id); save(); render(); } },
    optSound() { S.opts.sound = !S.opts.sound; save(); render(); },
    optVib() { S.opts.vib = !S.opts.vib; save(); render(); },
    export() {
      S.lastBackup = Date.now(); save();
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `entrainement-sauvegarde-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Sauvegarde exportée'); render();
    },
    importPick() { $('#imp').click(); },
    async resetProgs() {
      if (!await ask('Remettre les séances d\'origine ? Tes modifications de séances seront perdues (l\'historique est conservé).', 'Remettre')) return;
      const d = FONTE_DEFAULT; S.programs = clone(d.programs); S.week = clone(d.week); S.guide = clone(d.guide); S.progV = d.version; S.cur = null; save(); render(); toast('Séances réinitialisées');
    }
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act]'); if (!t) return;
    const f = A[t.dataset.act]; if (f) f(t);
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.sk && S.cur) { const s = S.cur.sets[t.dataset.ex][+t.dataset.i]; s[t.dataset.sk] = t.dataset.sk === 'w' ? t.value.replace(',', '.') : t.value; save(); return; }
    if (t.dataset.ef) {
      const pr = progById(top().id), ex = pr.ex[+t.dataset.i], k = t.dataset.ef;
      if (k === 'key' || k === 'est') ex[k] = t.checked;
      else if (k === 'sets') ex.sets = Math.max(1, parseInt(t.value) || 1);
      else if (k === 'rest') ex.rest = Math.max(0, parseInt(t.value) || 0);
      else if (k === 'alert') { if (t.value) ex.alert = t.value; else delete ex.alert; }
      else { ex[k] = t.value; if (k === 'start') ex.startAt = Date.now(); }
      save(); return;
    }
    if (t.dataset.pf) { progById(top().id)[t.dataset.pf] = t.value; save(); return; }
    if (t.dataset.name !== undefined) { S.name = t.value; save(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'imp' && t.files[0]) {
      const r = new FileReader();
      r.onload = async () => {
        try {
          const o = JSON.parse(r.result);
          if (!(o && ((Array.isArray(o.programs) && Array.isArray(o.week)) || (o.profiles && o.profiles.him)))) throw 0;
          if (await ask('Remplacer toutes les données actuelles par cette sauvegarde ?', 'Importer')) { importData(o); save(); V.stack = []; render(); toast('Sauvegarde importée'); }
        } catch (er) { toast('Fichier invalide'); }
      };
      r.readAsText(t.files[0]); t.value = '';
    }
    if (t.dataset.ef === 'kind') render();
  });

  /* ---------- démarrage ---------- */
  render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  if (saveFail) toast('Stockage indisponible : exporte une sauvegarde');

  // animation d'ouverture
  setTimeout(() => { const sp = $('#splash'); if (sp) { sp.classList.add('out'); setTimeout(() => sp.remove(), 700); } }, 2100);

  // mises à jour : bandeau « Actualiser »
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    const showBanner = reg => {
      $('#banner').hidden = false;
      $('#reload').onclick = () => { if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING'); else location.reload(); };
    };
    navigator.serviceWorker.register('sw.js').then(reg => {
      if (reg.waiting && navigator.serviceWorker.controller) showBanner(reg);
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) showBanner(reg); });
      });
      const check = () => reg.update().catch(() => { });
      document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
      setInterval(check, 30 * 60 * 1000);
    }).catch(() => { });
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; location.reload(); });
  }
})();
