/* TANDEM — app de suivi muscu hors ligne (vanilla JS, aucune dépendance) */
(function () {
  'use strict';
  const KEY = 'tandem.v1';
  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const D1 = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  const $ = (s, r = document) => r.querySelector(s);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  const num = s => { const m = String(s == null ? '' : s).replace(',', '.').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };
  const fw = w => (w === '' || w == null || isNaN(w)) ? '' : String(w).replace('.', ',');
  const pad = n => String(n).padStart(2, '0');
  const isoDay = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayISO = () => isoDay(new Date());
  const fdate = iso => { const d = new Date(iso); return `${DAYS[(d.getDay() + 6) % 7].slice(0, 3)}. ${d.getDate()} ${MONTHS[d.getMonth()]}`; };

  /* ---------- état ---------- */
  function load() {
    try {
      const r = localStorage.getItem(KEY);
      if (r) { const s = JSON.parse(r); if (s && s.profiles && s.profiles.him && s.profiles.her) return s; }
    } catch (e) { }
    return TANDEM_DEFAULTS.make();
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  const P = () => S.profiles[S.active];
  const progById = id => P().programs.find(p => p.id === id);
  const V = { tab: 'home', stack: [] };
  const top = () => V.stack[V.stack.length - 1];

  /* ---------- helpers métier ---------- */
  function startW(start) {
    const s = String(start || '');
    let m = s.match(/^\s*\d+\s*x\s*(\d+(?:[.,]\d+)?)/i);
    if (m) return parseFloat(m[1].replace(',', '.'));
    const n = num(s);
    return isNaN(n) || n === 0 ? '' : n;
  }
  function repsDef(r) { const n = num(r); return isNaN(n) ? '' : n; }
  function repHi(r) { const m = String(r).match(/(\d+)\s*-\s*(\d+)/); return m ? +m[2] : num(r); }
  function lastOf(exId, beforeIdx) {
    const logs = P().logs;
    for (let i = (beforeIdx == null ? logs.length : beforeIdx) - 1; i >= 0; i--) {
      const e = logs[i].ex.find(x => x.id === exId);
      if (e && e.sets.length) return e.sets;
    }
    return null;
  }
  function initSets(ex) {
    const last = lastOf(ex.id), out = [];
    for (let i = 0; i < Math.max(1, ex.sets | 0); i++) {
      const l = last && (last[i] || last[last.length - 1]);
      out.push({ w: l ? l.w : (ex.kind === 'w' ? startW(ex.start) : ''), r: l ? l.r : repsDef(ex.reps), d: false });
    }
    return out;
  }
  const restTxt = s => s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${Math.floor(s / 60)} min`) : `${s} s`;
  const mmss = s => { const t = Math.max(0, Math.round(s)); return `${Math.floor(t / 60)}:${pad(t % 60)}`; };
  const setsDone = ex => { const a = S.cur.sets[ex.id] || []; return ex.kind === 'c' ? (a[0] && a[0].d ? 1 : 0) : a.filter(x => x.d).length; };
  const setsTotal = ex => ex.kind === 'c' ? 1 : (S.cur.sets[ex.id] || []).length;

  /* ---------- icônes ---------- */
  const I = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    list: '<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>',
    chart: '<path d="M3 20h18M6 16l4-5 4 3 5-7"/>',
    book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 19a2 2 0 012-2h13"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    go: '<path d="M9 5l7 7-7 7"/>',
    up: '<path d="M6 15l6-6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    check: '<path d="M4 12l5 5L20 6"/>',
    swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  const svg = (n, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${I[n]}</svg>`;

  /* ---------- navigation ---------- */
  function go(v) { V.stack.push(v); history.pushState({ d: V.stack.length }, ''); render(); window.scrollTo(0, 0); }
  function back() { if (V.stack.length) history.back(); }
  window.addEventListener('popstate', () => {
    if (V.stack.length) { V.stack.pop(); render(); window.scrollTo(0, 0); }
  });
  function setTab(t) { V.tab = t; V.stack = []; render(); window.scrollTo(0, 0); }

  /* ---------- rendu ---------- */
  function render() {
    const y = window.scrollY;
    document.body.dataset.theme = S.active || 'him';
    const app = $('#app');
    if (!S.active) { app.innerHTML = pickerView(); return; }
    const v = top();
    let body;
    if (v) body = v.t === 'prog' ? progView(v) : v.t === 'edit' ? editView(v) : workView();
    else body = ({ home: homeView, progs: progsView, track: trackView, guide: guideView, more: moreView })[V.tab]();
    app.innerHTML = (v ? '' : header()) + `<main class="${v ? 'sub' : ''}">${body}</main>` + (v ? '' : nav());
    window.scrollTo(0, y);
    if (v && v.t === 'work') ensureWake(); else releaseWake();
    updateTimerUI();
  }

  function header() {
    const p = P();
    return `<header class="hdr">
      <div class="logo"><img src="icons/icon.svg" alt="" width="34" height="34" style="border-radius:10px;box-shadow:0 0 22px color-mix(in srgb,var(--a) 50%,transparent)"><b class="disp grad-t">Tandem</b></div>
      <button class="pill" data-act="switch" aria-label="Changer de profil"><div class="av">${esc((p.name || '?')[0].toUpperCase())}</div><span>${esc(p.name)}</span>${svg('swap')}</button>
    </header>`;
  }
  function nav() {
    const t = [['home', 'Accueil', 'home'], ['progs', 'Séances', 'list'], ['track', 'Suivi', 'chart'], ['guide', 'Guide', 'book'], ['more', 'Réglages', 'gear']];
    return `<nav>${t.map(([k, l, ic]) => `<button class="${V.tab === k ? 'on' : ''}" data-act="tab" data-t="${k}">${svg(ic)}${l}</button>`).join('')}</nav>`;
  }

  function pickerView() {
    const c = (k, sub) => `<button class="pcard ${k}" data-act="pick" data-k="${k}"><div class="av">${esc((S.profiles[k].name || '?')[0].toUpperCase())}</div><div><h3 class="disp">${esc(S.profiles[k].name)}</h3><p>${sub}</p></div></button>`;
    return `<div class="pick"><img class="big-logo" src="icons/icon.svg" alt=""><h1 class="disp grad-t">Tandem</h1>
      <p class="t">Deux profils. Une salle. Zéro excuse.</p>
      ${c('him', 'Haut / Bas · force & sèche')}${c('her', 'Fessiers · tonus & ventre')}</div>`;
  }

  /* ----- Accueil ----- */
  function homeView() {
    const p = P(), now = new Date(), di = (now.getDay() + 6) % 7, day = p.week[di], prog = day.p && progById(day.p);
    const hasCur = S.cur && S.cur.profile === S.active && progById(S.cur.prog);
    const doneToday = p.logs.some(l => l.date.slice(0, 10) === todayISO());
    const mon = new Date(now); mon.setDate(now.getDate() - di);
    let planned = 0, did = 0;
    const wk = p.week.map((d, i) => {
      const dt = new Date(mon); dt.setDate(mon.getDate() + i);
      const done = p.logs.some(l => l.date.slice(0, 10) === isoDay(dt));
      if (d.p) planned++; if (done) did++;
      return `<div class="day ${d.p ? 'has' : ''} ${done ? 'done' : ''} ${i === di ? 'today' : ''}">${D1[i]}<i></i></div>`;
    }).join('');
    let hero;
    if (hasCur) {
      const cp = progById(S.cur.prog);
      hero = `<section class="hero"><div class="eyebrow">⏱ Séance en cours</div><h1 class="disp">${esc(cp.name)}<small class="grad-t">${esc(cp.tag)}</small></h1>
        <div class="row"><button class="btn pri xl" data-act="resume">Reprendre</button></div>
        <div style="margin-top:10px"><button class="btn sm ghost dng" data-act="abandon">Abandonner cette séance</button></div></section>`;
    } else if (prog) {
      hero = `<section class="hero"><div class="eyebrow">Aujourd'hui · ${DAYS[di]}</div>
        <h1 class="disp">${esc(prog.name)}<small class="grad-t">${esc(prog.tag)}</small></h1>
        <div class="chips"><span class="chip acc">${esc(prog.dur)}</span><span class="chip">${prog.ex.filter(e => e.kind !== 'c').length} exercices</span>${doneToday ? '<span class="chip ok">✓ Déjà faite</span>' : ''}</div>
        <button class="btn pri xl" data-act="start" data-id="${prog.id}">${doneToday ? 'Refaire la séance' : 'Lancer la séance'}</button></section>`;
    } else {
      hero = `<section class="hero rest"><div class="eyebrow">Aujourd'hui · ${DAYS[di]}</div>
        <h1 class="disp">${esc(day.l || 'Repos')}<small class="grad-t">Récupère, c'est là que tu progresses</small></h1>
        <div class="chips">${p.programs.map(q => `<button class="chip acc" data-act="openProg" data-id="${q.id}">${esc(q.name)}</button>`).join('')}</div>
        <p class="mut" style="font-size:13px">Envie de t'entraîner quand même ? Choisis une séance.</p></section>`;
    }
    const last = p.logs[p.logs.length - 1];
    const recs = countRecords();
    return `${hero}
      <div class="sect-h" style="margin-top:6px"><h2 class="disp">Ma semaine</h2><button class="btn sm" data-act="weekEdit">${svg('edit')}Modifier</button></div>
      <div class="week">${wk}</div>
      <div class="stats">
        <div class="stat"><b class="grad-t">${did}/${planned}</b><span>cette semaine</span></div>
        <div class="stat"><b class="grad-t">${p.logs.length}</b><span>séances</span></div>
        <div class="stat"><b class="grad-t">${recs}</b><span>exos suivis</span></div>
      </div>
      ${last ? `<div class="card row sp"><div><div class="eyebrow">Dernière séance</div><b>${esc(last.name)}</b> <span class="mut">· ${fdate(last.date)}</span></div><span class="chip">${last.dur} min</span></div>` : `<div class="card empty">Ta 1re séance t'attend. Lance-toi 💥</div>`}`;
  }

  /* ----- Séances ----- */
  function progsView() {
    const p = P();
    const cards = p.programs.map((q, i) => {
      const days = p.week.map((d, k) => d.p === q.id ? DAYS[k].slice(0, 3) : null).filter(Boolean).join(' · ');
      return `<button class="prog" data-act="openProg" data-id="${q.id}"><div class="badge disp">${i + 1}</div>
        <div><h3 class="disp">${esc(q.name)}</h3><p>${esc(q.tag)} · ${esc(q.dur)} · ${q.ex.length} exos${days ? ' · ' + days : ''}</p></div>${svg('go', 'go')}</button>`;
    }).join('');
    return `<div class="sect-h" style="margin-top:12px"><h2 class="disp">Mes séances</h2></div>${cards}
      <button class="btn pri" style="width:100%" data-act="newProg">${svg('plus')} Nouvelle séance</button>`;
  }
  function progView(v) {
    const pr = progById(v.id);
    if (!pr) { return '<div class="empty">Séance introuvable</div>'; }
    let secPrev = null;
    const lines = pr.ex.map(e => {
      const head = e.sec !== secPrev ? `<div class="sec">${esc(e.sec)}</div>` : ''; secPrev = e.sec;
      const l = lastOf(e.id);
      const right = e.kind === 'c' ? esc(e.reps) : `${e.sets} × ${esc(e.reps)}`;
      const sub = l ? 'dernière : ' + l.map(s => (s.w !== '' ? fw(s.w) + '×' : '') + s.r).join(' · ') : (e.start && e.kind === 'w' ? 'départ ' + esc(e.start) : esc(e.note));
      return `${head}<div class="ex-line"><div><div class="n">${e.key ? '<span class="star">★</span> ' : ''}${esc(e.n)}</div><div class="m">${sub}</div></div><div class="r">${right}</div></div>`;
    }).join('');
    return `<div class="top"><button class="ic" data-act="back">${svg('back')}</button><div class="grow"><h2 class="disp">${esc(pr.name)}</h2><p>${esc(pr.tag)} · ${esc(pr.dur)}</p></div><button class="ic" data-act="edit" data-id="${pr.id}">${svg('edit')}</button></div>
      <button class="btn pri xl" data-act="start" data-id="${pr.id}">Lancer la séance</button>${lines}`;
  }

  /* ----- Éditeur ----- */
  function editView(v) {
    const pr = progById(v.id);
    if (!pr) return '<div class="empty">Séance introuvable</div>';
    const secs = [...new Set(pr.ex.map(e => e.sec))];
    const ex = pr.ex.map((e, i) => `<div class="ed" data-i="${i}">
      <div class="hd"><b>${i + 1}</b>
        <button data-act="exUp" data-i="${i}">${svg('up')}</button><button data-act="exDown" data-i="${i}">${svg('down')}</button>
        <button data-act="exDup" data-i="${i}" title="Dupliquer">${svg('plus')}</button><button data-act="exDel" data-i="${i}" style="color:var(--danger)">${svg('trash')}</button></div>
      <label class="f"><span>Exercice</span><input class="fi" data-ef="n" data-i="${i}" value="${esc(e.n)}"></label>
      <label class="f"><span>Bloc (titre de section)</span><input class="fi" list="secs" data-ef="sec" data-i="${i}" value="${esc(e.sec)}"></label>
      <div class="g3"><label class="f"><span>Séries</span><input class="fi" inputmode="numeric" data-ef="sets" data-i="${i}" value="${esc(e.sets)}"></label>
      <label class="f"><span>Reps / durée</span><input class="fi" data-ef="reps" data-i="${i}" value="${esc(e.reps)}"></label>
      <label class="f"><span>Repos (s)</span><input class="fi" inputmode="numeric" data-ef="rest" data-i="${i}" value="${esc(e.rest)}"></label></div>
      <div class="g2"><label class="f"><span>Charge de départ</span><input class="fi" data-ef="start" data-i="${i}" value="${esc(e.start)}"></label>
      <label class="f"><span>Type</span><select class="fi" data-ef="kind" data-i="${i}">
        <option value="w" ${e.kind === 'w' ? 'selected' : ''}>Charge + reps</option><option value="b" ${e.kind === 'b' ? 'selected' : ''}>Poids du corps</option><option value="c" ${e.kind === 'c' ? 'selected' : ''}>Case à cocher</option></select></label></div>
      <label class="f"><span>Note</span><input class="fi" data-ef="note" data-i="${i}" value="${esc(e.note)}"></label>
      <label class="tick"><input type="checkbox" data-ef="key" data-i="${i}" ${e.key ? 'checked' : ''}> ★ Non négociable</label>
      <p class="mut" style="font-size:12px;margin-top:6px">Repos = 0 → enchaîne direct avec l'exercice suivant (superset).</p>
    </div>`).join('');
    return `<div class="top"><button class="ic" data-act="back">${svg('back')}</button><div class="grow"><h2 class="disp">Modifier</h2><p>Les changements sont sauvegardés automatiquement</p></div><button class="btn sm pri" data-act="back">OK</button></div>
      <div class="card"><label class="f"><span>Nom de la séance</span><input class="fi" data-pf="name" value="${esc(pr.name)}"></label>
      <div class="g2"><label class="f"><span>Sous-titre</span><input class="fi" data-pf="tag" value="${esc(pr.tag)}"></label>
      <label class="f"><span>Durée</span><input class="fi" data-pf="dur" value="${esc(pr.dur)}"></label></div></div>
      <datalist id="secs">${secs.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      ${ex}
      <button class="btn pri" style="width:100%;margin-bottom:10px" data-act="exAdd">${svg('plus')} Ajouter un exercice</button>
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
      const head = e.sec !== prev ? `<div class="sec">${esc(e.sec)}</div>` : ''; prev = e.sec;
      return head + exCard(e, i, pr.ex);
    }).join('');
    return `<div class="wk-top"><div class="row sp"><button class="ic" data-act="back">${svg('back')}</button>
        <div class="grow" style="min-width:0"><h2 class="disp">${esc(pr.name)} <span class="grad-t">${esc(pr.tag)}</span></h2></div>
        <span class="chip acc" id="elapsed">${mmss((Date.now() - S.cur.start) / 1000)}</span></div>
      <div class="prog-bar"><i style="width:${tot ? Math.round(dn / tot * 100) : 0}%"></i></div></div>
      ${cards}
      <button class="btn pri xl" data-act="finish" style="margin-top:8px">Terminer la séance · ${dn}/${tot}</button>
      <div style="height:${T ? 110 : 20}px"></div>`;
  }
  function exCard(e, i, list) {
    const sets = S.cur.sets[e.id];
    const chain = e.rest === 0 && e.kind !== 'c' && i < list.length - 1;
    if (e.kind === 'c') {
      const on = sets[0] && sets[0].d;
      return `<div class="ex ${e.key ? 'key' : ''}"><button class="cbtn" data-act="tick" data-ex="${e.id}" data-i="0">
        <div class="chk ${on ? 'on' : ''}">${svg('check')}</div><div><h3 class="disp" style="font-size:18px">${esc(e.n)} <span class="mut" style="font-size:14px;font-style:normal">· ${esc(e.reps)}${e.sets > 1 ? ' × ' + e.sets : ''}</span></h3>${e.note ? `<div class="nt">${esc(e.note)}</div>` : ''}</div></button></div>`;
    }
    const l = lastOf(e.id);
    let hint = '';
    if (l && e.kind === 'w') {
      const hi = repHi(e.reps);
      if (hi && l.length >= e.sets && l.every(s => num(s.r) >= hi && s.w !== '')) hint = '<span class="chip ok">💪 tout validé → monte la charge</span>';
    }
    const lastChip = l ? `<span class="chip">Dernière : ${l.map(s => (s.w !== '' && e.kind === 'w' ? fw(s.w) + '×' : '') + s.r).join(' · ')}</span>` : (e.kind === 'w' && e.start ? `<span class="chip">Départ : ${esc(e.start)}</span>` : '');
    const rows = sets.map((s, k) => `<div class="set ${e.kind === 'b' ? 'nw' : ''} ${s.d ? 'dn' : ''}"><div class="i">${k + 1}</div>
      ${e.kind === 'w' ? `<div class="unit" data-u="kg"><input class="in" inputmode="decimal" data-sk="w" data-ex="${e.id}" data-i="${k}" value="${esc(fw(s.w))}" placeholder="kg"></div>` : ''}
      <div class="unit" data-u="${e.kind === 'w' ? 'reps' : ''}"><input class="in" inputmode="decimal" data-sk="r" data-ex="${e.id}" data-i="${k}" value="${esc(s.r)}" placeholder="${esc(e.reps)}"></div>
      <button class="chk ${s.d ? 'on' : ''}" data-act="tick" data-ex="${e.id}" data-i="${k}" aria-label="Valider la série">${svg('check')}</button></div>`).join('');
    return `<div class="ex ${e.key ? 'key' : ''} ${chain ? 'chain' : ''}">
      <h3 class="disp">${e.key ? '<span class="star">★</span> ' : ''}${esc(e.n)}</h3>
      <div class="tg">${e.sets} × ${esc(e.reps)}${e.rest ? ' · repos ' + restTxt(e.rest) : ' · enchaîne'}</div>
      ${e.note ? `<div class="nt">${esc(e.note)}</div>` : ''}
      <div class="lh">${lastChip}${hint}</div>
      <div class="sets">${rows}</div>
      <div class="ex-act"><button data-act="addSet" data-ex="${e.id}">+ série</button><button data-act="remSet" data-ex="${e.id}">− série</button></div></div>`;
  }

  /* ----- Suivi ----- */
  function trackView() {
    const p = P();
    const body = p.body.slice().sort((a, b) => a.d.localeCompare(b.d));
    const lastB = body[body.length - 1], firstB = body[0];
    const delta = body.length > 1 ? (lastB.kg - firstB.kg) : 0;
    const chart = bodyChart(body);
    const bl = body.slice().reverse().slice(0, 6).map(b => `<div class="rk"><span>${fdate(b.d)}</span><span class="mut">${b.waist ? 'taille ' + fw(b.waist) + ' cm' : ''}</span><b class="v">${fw(b.kg)} kg</b><button data-act="bodyDel" data-id="${b.id}" style="color:var(--mut)">${svg('trash', '')}</button></div>`).join('');
    const recs = recordsList().slice(0, 10).map(r => `<div class="rk"><span class="star">★</span><div><b>${esc(r.n)}</b><div class="mut" style="font-size:12px">${fdate(r.d)}</div></div><b class="v grad-t">${fw(r.w)} kg <small style="font-size:13px">× ${esc(r.r)}</small></b></div>`).join('');
    const hist = p.logs.slice().reverse().slice(0, 30).map(l => {
      const vol = l.ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + (num(s.w) || 0) * (num(s.r) || 0), 0), 0);
      return `<details class="hist g" style="padding:0"><summary style="padding:13px 15px"><div><b>${esc(l.name)}</b><div class="d">${fdate(l.date)} · ${l.dur} min · ${(vol / 1000).toFixed(1).replace('.', ',')} t</div></div></summary>
        <ul style="padding:0 15px 8px">${l.ex.filter(e => e.sets.length).map(e => `<li><b>${esc(e.n)}</b> — ${e.sets.map(s => (s.w !== '' && s.w != null ? fw(s.w) + '×' : '') + s.r).join(' · ')}</li>`).join('')}</ul>
        <div style="padding:0 15px 13px"><button class="btn sm dng" data-act="logDel" data-id="${l.id}">Supprimer</button></div></details>`;
    }).join('');
    return `<div class="sect-h" style="margin-top:12px"><h2 class="disp">Poids & mesures</h2><button class="btn sm pri" data-act="bodyAdd">${svg('plus')} Pesée</button></div>
      <div class="card">${lastB ? `<div class="row sp" style="margin-bottom:6px"><div><b class="disp grad-t" style="font-size:38px;line-height:1">${fw(lastB.kg)} kg</b></div>
        ${body.length > 1 ? `<span class="chip ${delta <= 0 ? 'ok' : 'acc'}">${delta > 0 ? '+' : ''}${fw(Math.round(delta * 10) / 10)} kg depuis le début</span>` : ''}</div>` : ''}${chart}</div>${bl}
      <div class="sect-h"><h2 class="disp">Records</h2></div>${recs || '<div class="card empty">Tes records apparaîtront après ta 1re séance.</div>'}
      <div class="sect-h"><h2 class="disp">Historique</h2></div>${hist || '<div class="card empty">Aucune séance enregistrée.</div>'}`;
  }
  function bodyChart(b) {
    if (b.length < 2) return `<div class="empty" style="padding:14px">${b.length ? 'Ajoute une 2e pesée pour voir la courbe.' : 'Ajoute ta 1re pesée pour démarrer le suivi.'}</div>`;
    const W = 320, H = 130, pl = 8, pr = 8, pt = 12, pb = 12;
    const ks = b.map(x => +x.kg), mn = Math.min(...ks) - 0.5, mx = Math.max(...ks) + 0.5;
    const pts = b.map((x, i) => [pl + i * (W - pl - pr) / (b.length - 1), pt + (1 - (x.kg - mn) / (mx - mn)) * (H - pt - pb)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ` L${pts[pts.length - 1][0]} ${H} L${pts[0][0]} ${H} Z`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a)" stop-opacity=".4"/><stop offset="1" stop-color="var(--a)" stop-opacity="0"/></linearGradient>
      <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--a2)"/><stop offset="1" stop-color="var(--a)"/></linearGradient></defs>
      <path d="${area}" fill="url(#ga)"/><path d="${line}" fill="none" stroke="url(#gl)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#0a0a0f" stroke="var(--a)" stroke-width="2"/>`).join('')}</svg>`;
  }
  function recordsList() {
    const best = {};
    P().logs.forEach(l => l.ex.forEach(e => e.sets.forEach(s => {
      const w = num(s.w); if (!w) return;
      if (!best[e.id] || w > best[e.id].w || (w === best[e.id].w && num(s.r) > num(best[e.id].r))) best[e.id] = { n: e.n, w, r: s.r, d: l.date };
    })));
    return Object.values(best).sort((a, b) => b.w - a.w);
  }
  function countRecords() { return recordsList().length; }

  /* ----- Guide ----- */
  function guideView() {
    return `<div class="sect-h" style="margin-top:12px"><h2 class="disp">Le guide</h2></div>` + P().guide.map(g => `<details class="g" ${g.open ? 'open' : ''}><summary><span style="font-size:22px">${g.i}</span>${esc(g.t)}</summary><ul>${g.b.map(x => `<li>${rich(x)}</li>`).join('')}</ul></details>`).join('');
  }

  /* ----- Réglages ----- */
  function moreView() {
    const p = P();
    return `<div class="sect-h" style="margin-top:12px"><h2 class="disp">Réglages</h2></div>
      <div class="card"><label class="f"><span>Mon prénom</span><input class="fi" data-name value="${esc(p.name)}"></label>
        <button class="btn" style="width:100%" data-act="weekEdit">${svg('edit')} Modifier ma semaine type</button></div>
      <div class="card">
        <div class="sw"><span>🔔 Son à la fin du repos</span><button class="tog ${S.opts.sound ? 'on' : ''}" data-act="optSound" aria-label="Son"></button></div>
        <div class="sw"><span>📳 Vibration</span><button class="tog ${S.opts.vib ? 'on' : ''}" data-act="optVib" aria-label="Vibration"></button></div></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:6px">Sauvegarde</div>
        <p class="mut" style="font-size:13px;margin-bottom:12px">Tout est stocké sur ce téléphone. Exporte de temps en temps pour ne rien perdre (ou pour passer sur un nouveau téléphone).</p>
        <div class="g2"><button class="btn" data-act="export">⬇ Exporter</button><button class="btn" data-act="importPick">⬆ Importer</button></div>
        <input type="file" id="imp" accept="application/json,.json" hidden></div>
      <div class="card"><div class="eyebrow" style="margin-bottom:10px">Zone sensible</div>
        <button class="btn dng" style="width:100%" data-act="resetProgs">Remettre les séances d'origine</button></div>
      <p class="mut" style="text-align:center;font-size:12px;margin-top:18px">TANDEM · fonctionne 100 % hors ligne</p>`;
  }

  /* ---------- feuilles / dialogues ---------- */
  let askRes = null;
  function openSheet(html) { $('#sheet').innerHTML = `<div class="bk" data-act="sheetX"></div><div class="pn">${html}</div>`; $('#sheet').classList.add('show'); }
  function closeSheet() { $('#sheet').classList.remove('show'); $('#sheet').innerHTML = ''; if (askRes) { const r = askRes; askRes = null; r(false); } }
  function ask(msg, ok = 'Confirmer', danger = true) {
    return new Promise(res => {
      askRes = res;
      openSheet(`<h2 class="disp">${esc(msg)}</h2><div class="g2" style="margin-top:16px"><button class="btn" data-act="sheetX">Annuler</button><button class="btn ${danger ? 'dng' : 'pri'}" data-act="askOk">${esc(ok)}</button></div>`);
    });
  }
  let toastT;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2000); }

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
        <div class="row" style="gap:6px"><button class="btn" data-act="tm" data-d="-15">−15</button><button class="btn" data-act="tm" data-d="15">+15</button><button class="btn" data-act="tmx">✕</button></div></div></div>`;
    }
    $('#tt').textContent = mmss(Math.ceil(left));
    $('.bar i', el).style.width = (T.done ? 100 : (100 - left / T.total * 100)) + '%';
    $('.tm', el).classList.toggle('go', T.done);
    $('#tl').textContent = T.done ? 'GO !' : 'REPOS';
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
    if (S.cur && !(S.cur.profile === S.active && S.cur.prog === id)) {
      if (!await ask('Une séance est déjà en cours. L\'abandonner ?', 'Abandonner')) return;
    }
    if (!S.cur || S.cur.prog !== id || S.cur.profile !== S.active) {
      const pr = progById(id); S.cur = { profile: S.active, prog: id, start: Date.now(), sets: {} };
      pr.ex.forEach(e => { S.cur.sets[e.id] = initSets(e); });
      save();
    }
    T = null; go({ t: 'work' });
  }
  function finish() {
    const pr = progById(S.cur.prog), logs = P().logs;
    const ex = pr.ex.map(e => ({
      id: e.id, n: e.n,
      sets: (e.kind === 'c' ? [] : (S.cur.sets[e.id] || [])).filter(s => s.d).map(s => ({ w: e.kind === 'w' ? (s.w === '' ? '' : (num(s.w) || '')) : '', r: s.r }))
    }));
    const doneCount = ex.reduce((a, e) => a + e.sets.length, 0) + pr.ex.filter(e => e.kind === 'c' && setsDone(e)).length;
    const doRecords = [];
    ex.forEach(e => {
      const best = Math.max(0, ...e.sets.map(s => num(s.w) || 0));
      if (!best) return;
      let prevBest = 0; logs.forEach(l => { const o = l.ex.find(x => x.id === e.id); if (o) o.sets.forEach(s => { prevBest = Math.max(prevBest, num(s.w) || 0); }); });
      if (prevBest && best > prevBest) doRecords.push({ n: e.n, w: best, was: prevBest });
    });
    const dur = Math.max(1, Math.round((Date.now() - S.cur.start) / 60000));
    const vol = ex.reduce((a, e) => a + e.sets.reduce((b, s) => b + (num(s.w) || 0) * (num(s.r) || 0), 0), 0);
    logs.push({ id: uid(), date: new Date().toISOString(), prog: pr.id, name: `${pr.name}`, dur, ex });
    S.cur = null; T = null; save();
    V.stack = [];
    V.tab = 'home'; render(); window.scrollTo(0, 0);
    openSheet(`<div class="win"><div class="trophy">${doRecords.length ? '🏆' : '💪'}</div><h2 class="disp grad-t" style="font-size:34px">Séance validée</h2>
      <p class="mut">${esc(pr.name)} · bien joué ${esc(P().name)} !</p>
      <div class="g"><div class="stat"><b class="grad-t">${dur}</b><span>minutes</span></div><div class="stat"><b class="grad-t">${doneCount}</b><span>séries</span></div><div class="stat"><b class="grad-t">${(vol / 1000).toFixed(1).replace('.', ',')}</b><span>tonnes</span></div></div>
      ${doRecords.map(r => `<div class="rec"><span>🔥 ${esc(r.n)}</span><span>${fw(r.was)} → <b class="grad-t">${fw(r.w)} kg</b></span></div>`).join('')}
      <button class="btn pri xl" style="margin-top:12px" data-act="sheetX">Fermer</button></div>`);
  }

  /* ---------- actions ---------- */
  const A = {
    pick(t) { S.active = t.dataset.k; V.tab = 'home'; V.stack = []; save(); render(); },
    switch() { S.active = S.active === 'him' ? 'her' : 'him'; V.stack = []; save(); render(); window.scrollTo(0, 0); },
    tab(t) { setTab(t.dataset.t); },
    back() { back(); },
    openProg(t) { go({ t: 'prog', id: t.dataset.id }); },
    start(t) { startProg(t.dataset.id); },
    resume() { go({ t: 'work' }); },
    async abandon() { if (await ask('Abandonner la séance en cours ?', 'Abandonner')) { S.cur = null; T = null; save(); render(); } },
    edit(t) { go({ t: 'edit', id: t.dataset.id }); },
    newProg() {
      const id = 'p' + uid();
      P().programs.push({ id, name: 'Nouvelle séance', tag: 'Perso', dur: '~45 min', ex: [{ id: 'e' + uid(), sec: 'LE GROS', n: 'Nouvel exercice', sets: 3, reps: '10', rest: 90, start: '', note: '', kind: 'w', key: false }] });
      save(); go({ t: 'edit', id });
    },
    async delProg() {
      const v = top(); if (!await ask('Supprimer cette séance ?', 'Supprimer')) return;
      const p = P(); p.programs = p.programs.filter(x => x.id !== v.id); p.week.forEach(d => { if (d.p === v.id) d.p = null; });
      if (S.cur && S.cur.prog === v.id) S.cur = null; save(); V.stack = []; V.tab = 'progs'; render(); toast('Séance supprimée');
    },
    dupProg() {
      const v = top(), pr = progById(v.id), id = 'p' + uid();
      const c = JSON.parse(JSON.stringify(pr)); c.id = id; c.name += ' (copie)'; c.ex.forEach(e => { e.id = 'e' + uid(); });
      P().programs.push(c); save(); V.stack.pop(); V.stack.push({ t: 'edit', id }); render(); window.scrollTo(0, 0); toast('Séance dupliquée');
    },
    exAdd() { const pr = progById(top().id), l = pr.ex[pr.ex.length - 1]; pr.ex.push({ id: 'e' + uid(), sec: l ? l.sec : 'LE GROS', n: 'Nouvel exercice', sets: 3, reps: '10', rest: 90, start: '', note: '', kind: 'w', key: false }); save(); render(); window.scrollTo(0, document.body.scrollHeight); },
    exDel(t) { const pr = progById(top().id); pr.ex.splice(+t.dataset.i, 1); save(); render(); },
    exDup(t) { const pr = progById(top().id), i = +t.dataset.i, c = JSON.parse(JSON.stringify(pr.ex[i])); c.id = 'e' + uid(); pr.ex.splice(i + 1, 0, c); save(); render(); },
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
      const p = P();
      const opts = sel => `<option value="">— Repos —</option>` + p.programs.map(q => `<option value="${q.id}" ${q.id === sel ? 'selected' : ''}>${esc(q.name)} · ${esc(q.tag)}</option>`).join('');
      openSheet(`<h2 class="disp">Ma semaine type</h2><p class="mut" style="margin-bottom:14px;font-size:13px">Choisis la séance de chaque jour.</p>
        ${p.week.map((d, i) => `<label class="f"><span>${DAYS[i]}</span><select class="fi" data-wd="${i}">${opts(d.p)}</select></label>`).join('')}
        <button class="btn pri xl" data-act="weekSave" style="margin-top:6px">Enregistrer</button>`);
    },
    weekSave() { document.querySelectorAll('[data-wd]').forEach(s => { const d = P().week[+s.dataset.wd]; d.p = s.value || null; if (!d.p && !d.l) d.l = 'Repos'; }); save(); closeSheet(); render(); toast('Semaine mise à jour'); },
    bodyAdd() {
      openSheet(`<h2 class="disp">Nouvelle pesée</h2>
        <label class="f"><span>Date</span><input class="fi" type="date" id="bd" value="${todayISO()}"></label>
        <div class="g2"><label class="f"><span>Poids (kg)</span><input class="fi" id="bk" inputmode="decimal" placeholder="ex. 84,5"></label>
        <label class="f"><span>Tour de taille (cm)</span><input class="fi" id="bw" inputmode="decimal" placeholder="optionnel"></label></div>
        <button class="btn pri xl" data-act="bodySave">Enregistrer</button>`);
    },
    bodySave() {
      const kg = num($('#bk').value); if (isNaN(kg)) { toast('Entre un poids'); return; }
      const w = num($('#bw').value);
      P().body.push({ id: uid(), d: $('#bd').value || todayISO(), kg, waist: isNaN(w) ? '' : w }); save(); closeSheet(); render(); toast('Pesée ajoutée');
    },
    async bodyDel(t) { if (await ask('Supprimer cette pesée ?', 'Supprimer')) { P().body = P().body.filter(b => b.id !== t.dataset.id); save(); render(); } },
    async logDel(t) { if (await ask('Supprimer cette séance de l\'historique ?', 'Supprimer')) { P().logs = P().logs.filter(l => l.id !== t.dataset.id); save(); render(); } },
    optSound() { S.opts.sound = !S.opts.sound; save(); render(); },
    optVib() { S.opts.vib = !S.opts.vib; save(); render(); },
    export() {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tandem-sauvegarde-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); toast('Sauvegarde exportée');
    },
    importPick() { $('#imp').click(); },
    async resetProgs() {
      if (!await ask('Remettre les séances d\'origine ? Tes modifications de séances seront perdues (l\'historique est conservé).', 'Remettre')) return;
      const d = TANDEM_DEFAULTS.makePrograms(S.active); P().programs = d.programs; P().week = d.week; P().guide = d.guide; S.cur = null; save(); render(); toast('Séances réinitialisées');
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
      if (k === 'key') ex.key = t.checked;
      else if (k === 'sets') ex.sets = Math.max(1, parseInt(t.value) || 1);
      else if (k === 'rest') ex.rest = Math.max(0, parseInt(t.value) || 0);
      else ex[k] = t.value;
      save(); return;
    }
    if (t.dataset.pf) { progById(top().id)[t.dataset.pf] = t.value; save(); return; }
    if (t.dataset.name !== undefined) { P().name = t.value; save(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.id === 'imp' && t.files[0]) {
      const r = new FileReader();
      r.onload = async () => {
        try {
          const o = JSON.parse(r.result);
          if (!o.profiles || !o.profiles.him || !o.profiles.her) throw 0;
          if (await ask('Remplacer toutes les données actuelles par cette sauvegarde ?', 'Importer')) { S = o; S.opts = S.opts || { sound: true, vib: true }; save(); V.stack = []; render(); toast('Sauvegarde importée'); }
        } catch (er) { toast('Fichier invalide'); }
      };
      r.readAsText(t.files[0]); t.value = '';
    }
    if (t.dataset.ef === 'kind') { render(); }
  });

  /* ---------- démarrage ---------- */
  render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => { });
  }
})();
