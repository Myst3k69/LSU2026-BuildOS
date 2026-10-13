import { domains, loadProject, saveProject, progress, createProject, respond } from './core.js';

const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
  box: '<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  megaphone: '<path d="m3 9 14-5v16L3 15zM6 16l2 5h4l-2-4M21 8v8"/>',
  chart: '<path d="M4 3v17h17M8 15v-5m5 5V6m5 9v-7"/>',
  shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4m-2-2h4"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  checkSquare: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7 12 3 3 7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  flag: '<path d="M5 21V4c5-3 9 3 14 0v10c-5 3-9-3-14 0"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  settings: '<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  book: '<path d="M12 5v16M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 2-3-3-6-3-9-2z"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
  warning: '<path d="M10.3 4a2 2 0 0 1 3.4 0l8 14a2 2 0 0 1-1.7 3H4a2 2 0 0 1-1.7-3zM12 9v5m0 3h.01"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  file: '<path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8m-8 4h6"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9H4l-2 2v-8a9 9 0 1 1 19-3zM7 10h10M7 14h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.box}</svg>`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
let storage;
try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Stockage indisponible'); } }; }
let project = loadProject(storage);
let view = 'overview';
let selectedDomain = null;
let filter = 'all';
let query = '';
let activeTaskId = null;
let saveFailed = false;
let lastFocus = null;
let toastTimer;
const app = document.querySelector('#app');
const overlay = document.querySelector('#overlay');

function persist() {
  saveFailed = !saveProject(storage, project);
  if (saveFailed) toast('Sauvegarde indisponible. Exportez votre projet pour le conserver.');
}
function toast(message) {
  const el = document.querySelector('#toast');
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('visible'), 3800);
}
function logo() { return '<span class="logo">Build<span>OS</span></span>'; }
function domainFor(task) { return domains.find(d => d.id === task.domain); }
function taskRow(task, showDomain = false) {
  const d = domainFor(task);
  return `<div class="task-row ${task.done ? 'completed' : ''}">
    <input class="task-check" type="checkbox" ${task.done ? 'checked' : ''} data-toggle="${task.id}" aria-label="Marquer ${escape(task.title)} ${task.done ? 'à faire' : 'comme terminée'}">
    <button class="task-title" data-task="${task.id}">${escape(task.title)}${showDomain ? `<span class="task-subtitle">${escape(d.name)} ${task.forgotten ? '· Étape souvent oubliée' : ''}</span>` : ''}</button>
    <span class="due ${task.done ? 'done' : task.due === 'Aujourd’hui' ? 'today' : task.due === 'Cette semaine' ? 'week' : 'later'}">${task.done ? 'Terminé' : escape(task.due)}</span>
    <button class="task-open icon-button" data-task="${task.id}" aria-label="Ouvrir ${escape(task.title)}">${icon('chevron')}</button>
  </div>`;
}
function shell() {
  const p = progress(project);
  app.innerHTML = `<aside class="sidebar">
    <a href="#overview" class="brand" aria-label="BuildOS, vue d’ensemble">${logo()}</a>
    <div class="sidebar-caption">VOTRE ESPACE DE TRAVAIL</div>
    <button class="side-item ${!selectedDomain && view === 'overview' ? 'active' : ''}" data-nav="overview">${icon('home')}<span>Mon projet</span><span class="side-active-dot"></span></button>
    <div class="sidebar-caption domains-label">DOMAINES DU PROJET</div>
    <nav aria-label="Domaines du projet">${domains.map(d => `<button class="side-item ${selectedDomain === d.id ? 'active' : ''}" data-domain="${d.id}">${icon(d.icon)}<span>${d.name}</span>${progress(project, d.id).percent === 100 ? icon('check', 'tiny') : ''}</button>`).join('')}</nav>
    <div class="side-divider"></div>
    <button class="side-item ${view === 'resources' && !selectedDomain ? 'active' : ''}" data-nav="resources">${icon('book')}<span>Mes ressources</span></button>
    <button class="side-item" data-action="settings">${icon('settings')}<span>Paramètres</span></button>
    <div class="sidebar-bottom">
      <div class="help-card"><span class="help-icon">${icon('compass')}</span><strong>Une idée. Un cap.</strong><p>Chaque grande aventure commence par une première étape.</p><button data-action="method">Découvrir la méthode ${icon('arrow')}</button></div>
      <div class="sidebar-project"><span class="avatar">${escape(project.name.charAt(0).toUpperCase())}</span><div><span>Votre projet</span><strong>${escape(project.name)}</strong></div><button class="icon-button" data-action="settings" aria-label="Paramètres du projet">${icon('down')}</button></div>
    </div>
  </aside>
  <div class="workspace">
    <header class="topbar"><div class="breadcrumb">Mon espace ${icon('chevron')} <strong>${escape(project.name)}</strong></div><a href="#overview" class="mobile-brand">${logo()}</a><div class="topbar-actions"><span class="save-status ${saveFailed ? 'error' : ''}"><span></span>${saveFailed ? 'Non sauvegardé' : 'Sauvegardé sur ce navigateur'}</span><button class="icon-button" data-action="method" aria-label="Aide et méthode">${icon('help')}</button><button class="profile-avatar" data-action="settings" aria-label="Paramètres du projet">${escape(project.name.charAt(0).toUpperCase())}</button></div></header>
    <main id="main-content">
      <section class="page-heading"><div><div class="eyebrow">DE L’IDÉE À L’IMPACT</div><h1>Votre projet, <span>en mouvement.</span></h1><p>Le cap est clair. Faisons avancer les choses.</p></div><button class="button primary create-button" data-action="create">${icon('plus')} Créer mon projet</button></section>
      ${project.demo ? `<div class="demo-strip"><span>${icon('compass')} Vous explorez un projet d’exemple.</span><button data-action="create">Et si on lançait le vôtre ? ${icon('arrow')}</button></div>` : ''}
      <section class="project-heading"><div class="project-heading-name"><span class="project-mark">${icon('box')}</span><div><div class="name-line"><h2>${escape(project.name)}</h2><span class="project-label">${project.demo ? 'Projet démo' : 'Mon projet'}</span></div><p>${escape(project.brief)}</p></div></div><button class="button secondary" data-action="new-task">${icon('plus')} Nouvelle tâche</button></section>
      <div class="tabbar"><nav aria-label="Vues du projet">${[['overview','Vue d’ensemble'],['tasks','Tâches'],['plan','Plan du projet'],['decisions','Décisions'],['resources','Ressources']].map(([id,name]) => `<button class="tab ${view === id && !selectedDomain ? 'active' : ''}" data-nav="${id}" ${view === id && !selectedDomain ? 'aria-current="page"' : ''}>${name}${id === 'tasks' ? `<span>${project.tasks.length - p.done}</span>` : ''}</button>`).join('')}</nav><span class="private-label">${icon('shield')} Un espace à vous</span></div>
      <div id="view-content">${content()}</div>
      <footer class="page-footer"><span>${logo()} <span class="footer-caption">Des idées plus solides. Des projets qui avancent.</span></span><span>${icon('shield')} Sans compte. Sans distraction.</span></footer>
    </main>
  </div>
  <nav class="mobile-nav" aria-label="Navigation mobile"><button data-nav="overview" class="${view === 'overview' ? 'active' : ''}">${icon('home')}<span>Mon projet</span></button><button data-nav="tasks" class="${view === 'tasks' ? 'active' : ''}">${icon('checkSquare')}<span>Tâches</span></button><button class="mobile-add" data-action="new-task" aria-label="Ajouter une tâche">${icon('plus')}</button><button data-nav="plan" class="${view === 'plan' ? 'active' : ''}">${icon('compass')}<span>Mon plan</span></button><button data-action="settings">${icon('settings')}<span>Réglages</span></button></nav>`;
}

function content() {
  if (selectedDomain) return domainContent();
  return { overview, tasks: tasksContent, plan: planContent, decisions: decisionsContent, resources: resourcesContent }[view]();
}
function overview() {
  const p = progress(project);
  const remaining = project.tasks.filter(t => !t.done);
  const forgotten = remaining.filter(t => t.forgotten);
  const priority = remaining.filter(t => !t.forgotten).slice(0, 5);
  return `<section class="stats-grid" aria-label="Avancement du projet">
    <article class="card progress-card"><div class="card-overline">VOTRE AVANCEMENT ${icon('chart')}</div><div class="progress-number">${p.percent}<span>%</span><span class="progress-description">${p.done} tâches terminées<br>sur ${p.total}</span></div><div class="progress-track" role="progressbar" aria-label="Avancement global" aria-valuenow="${p.percent}" aria-valuemin="0" aria-valuemax="100"><div style="width:${p.percent}%"></div></div><p>${p.done === p.total ? 'Le plan est terminé. Beau chemin parcouru !' : p.done ? 'Chaque petit pas compte. Continuez comme ça.' : 'Votre aventure commence ici. À vous de jouer.'}</p></article>
    <article class="card stats-card"><div class="stat"><span class="stat-icon green">${icon('checkSquare')}</span><div><strong>${p.done.toString().padStart(2,'0')}</strong><span>Tâches terminées</span></div></div><div class="stat"><span class="stat-icon blue">${icon('clock')}</span><div><strong>${(p.total-p.done).toString().padStart(2,'0')}</strong><span>Tâches à faire</span></div></div><div class="stat"><span class="stat-icon orange">${icon('flag')}</span><div><strong>${project.decisions.length.toString().padStart(2,'0')}</strong><span>Décisions prises</span></div></div></article>
    <article class="momentum-card"><div class="momentum-copy"><span class="eyebrow">VOTRE PROCHAINE ÉTAPE</span><h3>${priority.length ? 'Les grandes idées<br>méritent un premier pas.' : 'Un projet solide,<br>jusqu’au dernier détail.'}</h3><button data-task="${(priority[0] || remaining[0] || project.tasks[0]).id}">On avance ensemble ${icon('arrow')}</button></div><div class="orbit-art" aria-hidden="true"><div class="orbit-ring one"></div><div class="orbit-ring two"></div><div class="orbit-ring three"></div><div class="orbit-center">${icon('sparkles')}</div><span class="orbit-dot"></span><span class="orbit-star">✦</span></div></article>
  </section>
  <div class="dashboard-grid"><div class="dashboard-left"><section class="card priorities"><div class="section-card-heading"><div><span class="section-kicker">UN PAS APRÈS L’AUTRE</span><h3>Vos tâches prioritaires</h3></div><button class="text-link" data-nav="tasks">Tout voir ${icon('arrow')}</button></div><div class="task-list">${priority.length ? priority.map(t => taskRow(t)).join('') : '<div class="empty-inline">'+icon('checkSquare')+' Vos tâches prioritaires sont terminées.</div>'}</div><div class="card-bottom-note">${icon('compass')} Un objectif à la fois, pour aller plus loin.</div></section>
  <section class="domains-section"><div class="section-heading"><h3>Un projet, plusieurs dimensions</h3><button class="text-link" data-nav="plan">Voir le plan ${icon('arrow')}</button></div><div class="domain-grid">${domains.map(d => { const dp=progress(project,d.id); return `<button class="domain-card" data-domain="${d.id}"><span class="domain-icon ${d.color}">${icon(d.icon)}</span><span class="domain-card-arrow">${icon('chevron')}</span><strong>${d.name}</strong><span>${dp.done}/${dp.total} tâches terminées</span><div class="mini-track"><div class="${d.color}" style="width:${dp.percent}%"></div></div></button>`; }).join('')}</div></section></div>
  <div class="dashboard-right"><section class="copilot-card"><div class="section-card-heading"><h3><span class="copilot-symbol">${icon('sparkles')}</span> Votre copilote</h3><span class="pill blue">Mode démo</span></div><p>Un peu de clarté, un grand pas en avant.<br>On commence par quoi ?</p><div class="suggestions">${(priority.length ? priority.slice(0,2) : project.tasks.slice(0,2)).map((t,i) => `<button data-task="${t.id}" data-prompt="${i ? 'Comment commencer cette tâche ?' : 'Aide-moi à rédiger une proposition.'}"><span class="suggestion-icon">${icon(i ? 'compass' : 'chat')}</span><span>${i ? 'Préparer votre prochaine étape' : 'Affiner votre proposition de valeur'}</span>${icon('arrow')}</button>`).join('')}</div><div class="copilot-note"><span></span> L’IA vous accompagne. Vous gardez le cap.</div></section>
  <section class="forgotten-card"><div class="section-card-heading"><h3>${icon('warning')} Ne rien oublier</h3><span class="count orange">${forgotten.length}</span></div><p>Ces étapes passent souvent sous le radar.<br>Autant y penser maintenant.</p><div class="forgotten-list">${forgotten.length ? forgotten.map(t => `<button data-task="${t.id}"><span class="forgotten-bullet"></span><span>${escape(t.title)}</span>${icon('arrow')}</button>`).join('') : `<div class="empty-inline">${icon('check')} Toutes les étapes sont couvertes.</div>`}</div><div class="forgotten-foot">Les bons réflexes font les projets solides.</div></section></div></div>
  <section class="quote-banner"><span class="quote-spark">${icon('sparkles')}</span><div><strong>Vous n’avez pas besoin de tout savoir.</strong><span>Juste de savoir quelle est la prochaine étape.</span></div><span class="quote-label">STRUCTURER. DÉCIDER. AVANCER.</span></section>`;
}
function tasksContent() {
  const filtered = project.tasks.filter(t => (!selectedDomain || t.domain === selectedDomain) && (filter === 'all' || (filter === 'done' ? t.done : filter === 'forgotten' ? t.forgotten && !t.done : !t.done)) && t.title.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  return `<section class="card all-tasks"><div class="section-card-heading"><h3>${selectedDomain ? escape(domains.find(d=>d.id===selectedDomain).name) : 'Toutes vos tâches'} <span class="muted-count">${filtered.length}</span></h3><label class="search-field">${icon('search')}<input id="task-search" type="search" placeholder="Rechercher une tâche…" value="${escape(query)}" aria-label="Rechercher une tâche"></label></div><div class="filters">${[['all','Toutes'],['todo','À faire'],['done','Terminées'],['forgotten','Souvent oubliées']].map(([id,label]) => `<button class="${filter===id ? 'selected':''}" data-filter="${id}">${label}</button>`).join('')}</div><div id="filtered-tasks">${filtered.length ? filtered.map(t=>taskRow(t,true)).join('') : '<div class="empty-state">'+icon('search')+'<h3>Aucune tâche ici pour le moment</h3><p>Essayez un autre filtre ou ajoutez votre prochaine étape.</p></div>'}</div></section>`;
}
function domainContent() {
  const d=domains.find(d=>d.id===selectedDomain);
  return `<div class="domain-intro"><span class="domain-icon ${d.color}">${icon(d.icon)}</span><div><h3>${d.name}</h3><p>${d.description}</p></div><button class="text-link" data-nav="overview">${icon('arrowLeft')} Vue d’ensemble</button></div>${tasksContent()}`;
}
function planContent() {
  return `<div class="view-intro"><div><h3>Le chemin de votre projet</h3><p>Des fondations au lancement. Chaque domaine a sa place.</p></div><span class="pill blue">Plan ${project.demo ? 'd’exemple' : 'généré depuis une trame'}</span></div><div class="plan-grid">${domains.map((d,i) => { const p=progress(project,d.id); return `<section class="card plan-card"><div class="plan-heading"><span class="domain-icon ${d.color}">${icon(d.icon)}</span><div><span class="section-kicker">DOMAINE 0${i+1}</span><h3>${d.name}</h3></div><span class="plan-percent">${p.percent}%</span></div><p>${d.description}</p><div class="task-list">${project.tasks.filter(t=>t.domain===d.id).map(t=>taskRow(t)).join('')}</div></section>`; }).join('')}</div>`;
}
function decisionsContent() {
  return `<div class="view-intro"><div><h3>Vos décisions, au même endroit</h3><p>Gardez une trace de ce qui fait avancer votre projet.</p></div></div>${project.decisions.length ? `<div class="decisions-grid">${project.decisions.map(d=>`<article class="card decision-card"><span class="stat-icon orange">${icon('flag')}</span><span class="section-kicker">DÉCISION DU ${new Date(d.createdAt).toLocaleDateString('fr-FR')}</span><h3>${escape(d.title)}</h3><p>${escape(d.text)}</p>${project.tasks.some(t=>t.id===d.taskId) ? `<button class="text-link" data-task="${d.taskId}">Retrouver la tâche ${icon('arrow')}</button>` : ''}</article>`).join('')}</div>` : `<div class="card empty-state">${icon('flag')}<h3>Les idées deviennent des décisions.</h3><p>Ouvrez une tâche et enregistrez votre première décision pour la retrouver ici.</p><button class="button primary" data-nav="tasks">Explorer mes tâches ${icon('arrow')}</button></div>`}`;
}
const resources = [
  ['La proposition de valeur', 'Une promesse claire pour une cible précise.', 'strategy', 'À remplir :\n\nNotre cible :\nSon problème principal :\nNotre solution :\nLe bénéfice mesurable :\nCe qui nous différencie :\n\nPhrase de synthèse : Nous aidons [cible] à [résultat] grâce à [solution].'],
  ['Le guide d’entretien utilisateur', 'Écouter les besoins avant de construire.', 'market', '1. Racontez-moi la dernière fois où vous avez rencontré ce problème.\n2. Comment le gérez-vous aujourd’hui ?\n3. Qu’est-ce qui vous prend le plus de temps ?\n4. Qu’avez-vous déjà essayé ?\n5. Que se passe-t-il si vous ne résolvez pas ce problème ?\n\nÉcoutez les faits, évitez les questions qui suggèrent une réponse et demandez l’accord avant de prendre des notes personnelles.'],
  ['La checklist du premier lancement', 'Les essentiels pour passer à l’action.', 'marketing', '□ Définir un seul segment de clients\n□ Choisir un problème précis\n□ Préparer une première version utilisable\n□ Tester le parcours principal sur téléphone\n□ Rédiger une promesse claire\n□ Choisir un canal d’acquisition\n□ Définir trois indicateurs de succès\n□ Vérifier vos obligations de confidentialité\n□ Prévoir un moyen de recueillir les retours'],
  ['Le budget de démarrage', 'Faire le point sur vos moyens et vos besoins.', 'finance', 'Dépenses initiales :\nDépenses mensuelles fixes :\nDépenses variables par client :\nTrésorerie disponible :\nRevenus mensuels estimés :\n\nDurée de fonctionnement sans revenus = trésorerie disponible / dépenses mensuelles.\n\nPréparez un scénario prudent et un scénario favorable.'],
];
function resourcesContent() {
  const deliverables=project.tasks.filter(t=>t.deliverable);
  return `<div class="view-intro"><div><h3>De quoi passer à l’action</h3><p>Des trames simples, disponibles ici. À adapter à votre projet.</p></div></div><div class="resources-grid">${resources.map((r,i)=>`<button class="card resource-card" data-resource="${i}"><span class="domain-icon ${domains.find(d=>d.id===r[2]).color}">${icon('file')}</span><span class="section-kicker">TRAME PRATIQUE</span><strong>${r[0]}</strong><span>${r[1]}</span><span class="text-link">Ouvrir la ressource ${icon('arrow')}</span></button>`).join('')}</div><div class="section-heading deliverable-heading"><h3>Vos livrables sauvegardés</h3><span class="pill gray">${deliverables.length}</span></div>${deliverables.length ? deliverables.map(t=>`<button class="card saved-deliverable" data-task="${t.id}">${icon('file')}<strong>${escape(t.title)}</strong>${icon('arrow')}</button>`).join('') : '<div class="card empty-state compact"><p>Vos livrables apparaîtront ici une fois sauvegardés depuis une tâche.</p></div>'}`;
}

function openOverlay(html, drawer = false) {
  if (!overlay.childElementCount) lastFocus=document.activeElement;
  overlay.innerHTML=`<div class="overlay-backdrop" data-action="close"></div><section class="${drawer ? 'task-drawer' : 'modal'}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${html}</section>`;
  document.body.classList.add('modal-open');
  app.inert=true;
  requestAnimationFrame(()=>overlay.querySelector('input:not([type="checkbox"]), textarea, button')?.focus());
}
function closeOverlay() {
  overlay.innerHTML='';
  document.body.classList.remove('modal-open');
  app.inert=false;
  activeTaskId=null;
  if (lastFocus?.isConnected) lastFocus.focus();
  else app.querySelector('.create-button')?.focus();
}
function modalHeader(title, label = '') {
  return `<div class="modal-heading"><div>${label ? `<span class="section-kicker">${label}</span>` : ''}<h2 id="dialog-title">${title}</h2></div><button class="icon-button" data-action="close" aria-label="Fermer">${icon('close')}</button></div>`;
}
function openCreate() {
  openOverlay(`${modalHeader('Les grandes idées commencent ici.', 'UN NOUVEAU DÉPART')}<p class="modal-description">Décrivez votre projet. Nous vous proposerons un plan pour poser les bonnes fondations.</p><form id="create-form"><label class="form-label" for="project-name">Le nom de votre projet</label><input id="project-name" name="name" placeholder="Par exemple : Studio, Bloom, Moonshot…" required maxlength="60" autocomplete="off"><label class="form-label" for="project-brief">Votre idée, en quelques mots</label><textarea id="project-brief" name="brief" rows="5" placeholder="Quel problème résolvez-vous ? Pour qui ? Et quelle est votre idée pour y répondre ?" required minlength="20" maxlength="3000"></textarea><p class="form-hint">20 caractères minimum. Pas besoin d’avoir toutes les réponses.</p><div class="local-notice">${icon('shield')} Un seul projet par navigateur. ${project.demo ? 'Le projet démo sera remplacé.' : 'Votre projet actuel sera remplacé. Vous pouvez d’abord l’exporter depuis les paramètres.'}</div><button class="button primary full-width" type="submit">${icon('sparkles')} Générer mon plan ${icon('arrow')}</button><p class="simulation-note">Plan issu d’une trame prédéfinie · Aucune IA connectée</p></form>`);
}
function openTask(id, prompt) {
  const task=project.tasks.find(t=>t.id===id);
  if (!task) return;
  activeTaskId=id;
  const d=domainFor(task);
  openOverlay(`<div class="drawer-top"><span class="domain-pill ${d.color}">${icon(d.icon)} ${d.name}</span><button class="icon-button" data-action="close" aria-label="Fermer la tâche">${icon('close')}</button></div><div class="task-detail"><span class="section-kicker">VOTRE PROCHAINE ACTION</span><h2 id="dialog-title">${escape(task.title)}</h2><p>${escape(task.description)}</p>${task.forgotten ? `<div class="task-warning">${icon('warning')} Cette étape est souvent oubliée. Pensez-y dès maintenant.</div>` : ''}<button class="button ${task.done ? 'success' : 'secondary'}" data-complete="${id}">${icon(task.done ? 'checkSquare' : 'check')} ${task.done ? 'Terminée · Remettre à faire' : 'Marquer comme terminée'}</button></div><div class="chat-heading"><span>${icon('sparkles')} Votre copilote de tâche</span><span class="pill blue">Simulation</span></div><div id="chat-messages" class="chat-messages" role="log" aria-live="polite">${messages(task)}</div><div class="chat-quick-actions"><button data-chat-prompt="Comment commencer cette tâche ?">Par où commencer ?</button><button data-chat-prompt="Aide-moi à rédiger un livrable.">Rédiger un livrable</button></div><form id="chat-form" class="chat-form"><label class="sr-only" for="chat-input">Votre message au copilote</label><textarea id="chat-input" rows="2" maxlength="2000" placeholder="Une question, une idée, un point à éclaircir…" required></textarea><button class="send-button" type="submit" aria-label="Envoyer le message">${icon('arrow')}</button></form><p class="chat-disclaimer">Réponses prédéfinies. Vos échanges restent sur ce navigateur.</p><div class="drawer-actions"><button class="button secondary" data-action="deliverable">${icon('file')} Livrable${task.deliverable ? ' sauvegardé' : ''}</button><button class="button secondary" data-action="decision">${icon('flag')} Noter une décision</button></div>`,true);
  overlay.querySelector('#chat-input')?.focus();
  if (prompt) sendMessage(prompt);
  scrollChat();
}
function messages(task) {
  return `<div class="message assistant"><span class="chat-avatar">${icon('sparkles')}</span><div><strong>BuildOS <span>· votre copilote</span></strong><p>On avance ensemble sur cette tâche. Je peux vous proposer une méthode, expliquer l’objectif ou préparer une trame de livrable.<br><br>Par quoi souhaitez-vous commencer ?</p></div></div>${task.messages.map(m=>`<div class="message ${m.role}">${m.role==='assistant' ? `<span class="chat-avatar">${icon('sparkles')}</span>` : ''}<div>${m.role==='assistant' ? '<strong>BuildOS <span>· suggestion simulée</span></strong>' : ''}<p>${escape(m.content)}</p></div></div>`).join('')}`;
}
function scrollChat() { requestAnimationFrame(()=>{ const el=overlay.querySelector('#chat-messages'); if(el) el.scrollTop=el.scrollHeight; }); }
function sendMessage(text) {
  const task=project.tasks.find(t=>t.id===activeTaskId);
  if (!task || !text.trim()) return;
  task.messages.push({role:'user',content:text.trim()},{role:'assistant',content:respond(project,task,text.trim())});
  persist();
  overlay.querySelector('#chat-messages').innerHTML=messages(task);
  overlay.querySelector('#chat-input').value='';
  shell();
  scrollChat();
}
function openSettings() {
  openOverlay(`${modalHeader('Un espace à vous.', 'PARAMÈTRES DU PROJET')}<div class="settings-summary"><span class="avatar">${escape(project.name.charAt(0).toUpperCase())}</span><div><strong>${escape(project.name)}</strong><span>${project.tasks.length} tâches · ${progress(project).done} terminées</span></div></div><div class="settings-note">${icon('shield')}<div><strong>Sans compte, sur ce navigateur</strong><p>Votre projet et vos échanges sont enregistrés localement. Ils ne sont pas partagés entre appareils. Effacer les données du navigateur les supprime.</p></div></div><div class="settings-note">${icon('sparkles')}<div><strong>Un prototype autonome</strong><p>Le plan suit une trame prédéfinie et l’assistance IA est simulée. Aucun service externe n’est contacté.</p></div></div><button class="button secondary full-width" data-action="export">${icon('download')} Exporter mon projet en JSON</button><button class="button primary full-width setting-create" data-action="create">${icon('plus')} Créer un nouveau projet</button>`);
}
function openMethod() {
  openOverlay(`${modalHeader('De l’idée à l’impact.', 'LA MÉTHODE BUILDOS')}<p class="modal-description">Vous gardez la vision. BuildOS vous aide à organiser le chemin.</p><div class="method-steps">${[['compass','01','Structurer','Décrivez votre idée et retrouvez les étapes essentielles dans six domaines.'],['flag','02','Décider','Travaillez sur une tâche, notez vos choix et conservez le contexte.'],['arrow','03','Avancer','Produisez un livrable, terminez une tâche et voyez votre projet progresser.'],['shield','04','Ne rien oublier','Anticipez les étapes souvent négligées : conformité, protection et trésorerie.']].map(([ic,n,t,p])=>`<div><span class="method-number">${n}</span><span class="domain-icon blue">${icon(ic)}</span><section><h3>${t}</h3><p>${p}</p></section></div>`).join('')}</div><button class="button primary full-width" data-action="close">C’est parti ${icon('arrow')}</button>`);
}
function openNewTask() {
  openOverlay(`${modalHeader('Votre prochaine petite victoire.', 'NOUVELLE TÂCHE')}<form id="new-task-form"><label class="form-label" for="task-name">Que souhaitez-vous faire ?</label><input id="task-name" name="title" required maxlength="120" placeholder="Une action concrète, un résultat clair"><label class="form-label" for="task-domain">Domaine du projet</label><select id="task-domain" name="domain">${domains.map(d=>`<option value="${d.id}" ${selectedDomain===d.id ? 'selected':''}>${d.name}</option>`).join('')}</select><label class="form-label" for="task-description">Quelques détails (facultatif)</label><textarea id="task-description" name="description" rows="3" maxlength="1500" placeholder="L’objectif, les questions à résoudre…"></textarea><button type="submit" class="button primary full-width">Ajouter la tâche ${icon('plus')}</button></form>`);
}
function openDeliverable() {
  const task=project.tasks.find(t=>t.id===activeTaskId);
  const id=task.id;
  const last=task.messages.filter(m=>m.role==='assistant').at(-1)?.content || '';
  openOverlay(`${modalHeader('Un résultat concret.', 'LIVRABLE DE TÂCHE')}<p class="modal-description">${escape(task.title)}. Relisez et adaptez la suggestion avant de la sauvegarder.</p><form id="deliverable-form" data-task-id="${id}"><label class="form-label" for="deliverable-text">Votre livrable</label><textarea id="deliverable-text" name="text" rows="12" required maxlength="15000" placeholder="Rédigez votre livrable ici…">${escape(task.deliverable || last)}</textarea><button class="button primary full-width" type="submit">${icon('check')} Sauvegarder le livrable</button></form><button class="text-link modal-back" data-task="${id}">${icon('arrowLeft')} Retour à la tâche</button>`);
}
function openDecision() {
  const id=activeTaskId;
  openOverlay(`${modalHeader('Une décision qui fait avancer.', 'GARDER UNE TRACE')}<form id="decision-form" data-task-id="${id}"><label class="form-label" for="decision-title">Votre décision</label><input id="decision-title" name="title" required maxlength="120" placeholder="Par exemple : cibler les équipes de 2 à 5 personnes"><label class="form-label" for="decision-text">Pourquoi ce choix ?</label><textarea id="decision-text" name="text" rows="5" required maxlength="3000" placeholder="Le contexte, les raisons, ce que cela change…"></textarea><button class="button primary full-width" type="submit">${icon('flag')} Enregistrer la décision</button></form><button class="text-link modal-back" data-task="${id}">${icon('arrowLeft')} Retour à la tâche</button>`);
}
function exportProject() {
  const url=URL.createObjectURL(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url; link.download=`buildos-${project.name.replace(/[^a-z0-9]/gi,'-')}.json`;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  toast('Votre projet a été exporté.');
}
function navigate(next) {
  view=next; selectedDomain=null; filter='all';query='';
  shell();
}
document.addEventListener('click',event=>{
  const el=event.target.closest('button, [data-action]');
  if(!el) return;
  if(el.dataset.nav) navigate(el.dataset.nav);
  else if(el.dataset.domain) { selectedDomain=el.dataset.domain; filter='all';query='';shell(); }
  else if(el.dataset.task) openTask(el.dataset.task,el.dataset.prompt);
  else if(el.dataset.complete) {
    const task=project.tasks.find(t=>t.id===el.dataset.complete);task.done=!task.done;persist();shell();openTask(task.id);toast(task.done ? 'Une étape de plus. Bien joué !' : 'La tâche est à nouveau à faire.');
  } else if(el.dataset.filter) {filter=el.dataset.filter;shell();}
  else if(el.dataset.chatPrompt) sendMessage(el.dataset.chatPrompt);
  else if(el.dataset.resource !== undefined) {
    const r=resources[Number(el.dataset.resource)];
    openOverlay(`${modalHeader(escape(r[0]),'VOTRE BOÎTE À OUTILS')}<p class="modal-description">${escape(r[1])}</p><div class="resource-text">${escape(r[3])}</div><button class="button primary full-width" data-action="close">C’est noté ${icon('check')}</button>`);
  } else if(el.dataset.action) ({close:closeOverlay,create:openCreate,settings:openSettings,method:openMethod,'new-task':openNewTask,deliverable:openDeliverable,decision:openDecision,export:exportProject}[el.dataset.action])?.();
});
document.addEventListener('change',event=>{
  if(event.target.dataset.toggle) {
    const t=project.tasks.find(t=>t.id===event.target.dataset.toggle);t.done=event.target.checked;persist();shell();toast(t.done?'Une étape de plus. Bien joué !':'Tâche remise à faire.');
  }
});
document.addEventListener('input',event=>{
  if(event.target.id==='task-search') {
    query=event.target.value;
    const html=tasksContent();
    const parsed=document.createElement('div');parsed.innerHTML=html;
    document.querySelector('#filtered-tasks').innerHTML=parsed.querySelector('#filtered-tasks').innerHTML;
    document.querySelector('.muted-count').textContent=parsed.querySelector('.muted-count').textContent;
  }
});
document.addEventListener('submit',event=>{
  const form=event.target;
  if(!['create-form','new-task-form','chat-form','deliverable-form','decision-form'].includes(form.id)) return;
  event.preventDefault();
  const data=new FormData(form);
  if(form.id==='create-form') {
    const name=data.get('name').trim(),brief=data.get('brief').trim();
    if(!name || brief.length<20) {toast('Ajoutez un nom et un brief d’au moins 20 caractères.');return;}
    project=createProject(name,brief);persist();closeOverlay();navigate('plan');toast('Votre plan est prêt. L’aventure commence !');
  } else if(form.id==='new-task-form') {
    const title=data.get('title').trim();if(!title) return;
    const task={id:`task-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,title,domain:data.get('domain'),description:data.get('description').trim() || 'Définissez le résultat attendu et la première action à réaliser.',done:false,forgotten:false,due:'Cette semaine',messages:[],deliverable:''};
    project.tasks.push(task);persist();closeOverlay();shell();openTask(task.id);toast('Votre prochaine étape est ajoutée.');
  } else if(form.id==='chat-form') sendMessage(form.querySelector('textarea').value);
  else if(form.id==='deliverable-form') {
    const t=project.tasks.find(t=>t.id===form.dataset.taskId);t.deliverable=data.get('text').trim();persist();shell();openTask(t.id);toast('Livrable sauvegardé dans vos ressources.');
  } else if(form.id==='decision-form') {
    const title=data.get('title').trim(),text=data.get('text').trim();if(!title||!text) return;
    project.decisions.push({id:`decision-${Date.now()}`,title,text,createdAt:new Date().toISOString(),taskId:form.dataset.taskId});persist();shell();openTask(form.dataset.taskId);toast('Décision enregistrée. Vous gardez le cap.');
  }
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape' && overlay.childElementCount) closeOverlay();
  if(event.target.id==='chat-input' && event.key==='Enter' && !event.shiftKey && !event.isComposing) {event.preventDefault();sendMessage(event.target.value);}
  if(event.key==='Tab' && overlay.childElementCount) {
    const items=[...overlay.querySelectorAll('button, input, textarea, select, a[href]')].filter(el=>!el.disabled);
    if(event.shiftKey && document.activeElement===items[0]) {event.preventDefault();items.at(-1).focus();}
    else if(!event.shiftKey && document.activeElement===items.at(-1)) {event.preventDefault();items[0].focus();}
  }
});
window.addEventListener('hashchange',()=>{ const next=location.hash.slice(1);if(['overview','tasks','plan','decisions','resources'].includes(next)) navigate(next); });
persist();
shell();
