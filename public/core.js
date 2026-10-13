export const STORAGE_KEY = 'buildos-project-v1';
export const domains = [
  { id: 'strategy', name: 'Stratégie', icon: 'compass', color: 'purple', description: 'Poser des fondations solides' },
  { id: 'product', name: 'Produit', icon: 'box', color: 'blue', description: 'Construire ce qui compte' },
  { id: 'market', name: 'Marché', icon: 'globe', color: 'green', description: 'Comprendre vos futurs clients' },
  { id: 'marketing', name: 'Marketing', icon: 'megaphone', color: 'pink', description: 'Faire connaître votre projet' },
  { id: 'finance', name: 'Finance', icon: 'chart', color: 'orange', description: 'Donner les moyens de réussir' },
  { id: 'legal', name: 'Juridique', icon: 'shield', color: 'gray', description: 'Anticiper et protéger' },
];

const templates = [
  ['strategy', 'Définir la vision du projet', 'Clarifiez le changement que vous souhaitez apporter et les objectifs de votre projet.', 'Fait', false],
  ['market', 'Identifier votre client idéal', 'Décrivez le profil, les besoins et les difficultés de votre premier segment de clients.', 'Fait', false],
  ['product', 'Lister les fonctionnalités essentielles', 'Séparez les fonctionnalités indispensables à votre première version de celles qui peuvent attendre.', 'Fait', false],
  ['strategy', 'Finaliser la proposition de valeur', 'Formulez en une phrase à qui vous vous adressez, quel problème vous résolvez et pourquoi votre solution est différente.', 'Aujourd’hui', false],
  ['market', 'Réaliser 5 entretiens utilisateurs', 'Confrontez vos hypothèses à cinq utilisateurs potentiels avant de développer davantage.', 'Cette semaine', false],
  ['product', 'Définir le périmètre de la première version', 'Choisissez un parcours principal et définissez les critères de réussite de votre MVP.', 'Cette semaine', false],
  ['finance', 'Valider le modèle économique', 'Déterminez qui paie, pour quelle valeur et à quel prix. Listez vos hypothèses à tester.', 'À venir', false],
  ['marketing', 'Préparer votre premier lancement', 'Choisissez un canal, un message et un objectif mesurable pour vos premiers utilisateurs.', 'À venir', false],
  ['legal', 'Protéger votre propriété intellectuelle', 'Inventoriez votre marque, vos créations et vos contrats. Vérifiez les protections adaptées.', 'À anticiper', true],
  ['legal', 'Anticiper la conformité RGPD', 'Identifiez les données personnelles collectées, leur finalité et leur durée de conservation.', 'À anticiper', true],
  ['finance', 'Prévoir une réserve de trésorerie', 'Estimez vos dépenses fixes et la durée de fonctionnement possible sans revenus.', 'À anticiper', true],
  ['marketing', 'Définir les indicateurs de succès', 'Retenez trois indicateurs concrets qui permettent de suivre la valeur apportée aux utilisateurs.', 'À venir', false],
];

export function createProject(name, brief, demo = false) {
  return {
    version: 1, name: name.trim(), brief: brief.trim(), demo,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    tasks: templates.map(([domain, title, description, due, forgotten], i) => ({
      id: `task-${i + 1}`, domain, title, description,
      due: !demo && due === 'Fait' ? 'Cette semaine' : due,
      done: demo && i < 3, forgotten, messages: [], deliverable: '',
    })),
    decisions: demo ? [{ id: 'decision-1', title: 'Commencer par les équipes créatives', text: 'Concentrer la première version sur les petites équipes créatives pour valider un besoin précis.', createdAt: new Date().toISOString(), taskId: 'task-2' }] : [],
  };
}

export function demoProject() {
  return createProject('Moonshot', 'Une plateforme qui aide les petites équipes créatives à centraliser leurs projets et à travailler plus simplement ensemble.', true);
}

export function isProject(value) {
  return !!value && value.version === 1 && typeof value.name === 'string' && typeof value.brief === 'string' &&
    Array.isArray(value.decisions) && value.decisions.every(d => d && typeof d.title === 'string' && typeof d.text === 'string') &&
    Array.isArray(value.tasks) && value.tasks.length > 0 && value.tasks.every(t =>
      t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.description === 'string' && typeof t.done === 'boolean' &&
      domains.some(d => d.id === t.domain) && typeof t.due === 'string' && typeof t.deliverable === 'string' && Array.isArray(t.messages) &&
      t.messages.every(m => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string'));
}

export function loadProject(storage) {
  try {
    const project = JSON.parse(storage.getItem(STORAGE_KEY));
    return isProject(project) ? project : demoProject();
  } catch { return demoProject(); }
}

export function saveProject(storage, project) {
  project.updatedAt = new Date().toISOString();
  try { storage.setItem(STORAGE_KEY, JSON.stringify(project)); return true; }
  catch { return false; }
}

export function progress(project, domain) {
  const tasks = project.tasks.filter(t => !domain || t.domain === domain);
  const done = tasks.filter(t => t.done).length;
  return { total: tasks.length, done, percent: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
}

export function respond(project, task, input) {
  const question = input.toLocaleLowerCase('fr');
  const context = `Pour « ${project.name} », travaillons sur : ${task.title.toLocaleLowerCase('fr')}.`;
  if (/livrable|rédig|exemple|formul|proposition/.test(question)) {
    if (task.domain === 'strategy') return `${context}\n\nVoici une première trame à personnaliser :\n\n« ${project.name} aide [votre cible précise] à [résoudre son problème principal] grâce à [votre solution], pour [obtenir un résultat mesurable]. »\n\nVotre brief : ${project.brief}\n\nChoisissez un seul segment et complétez les trois éléments entre crochets avec vos observations terrain. Cette trame est une suggestion simulée, à valider avec vos utilisateurs.`;
    return `${context}\n\nVoici une trame de livrable :\n\n1. Objectif : ${task.description}\n2. Hypothèse à vérifier : [votre hypothèse principale].\n3. Action concrète : [une action réalisable cette semaine].\n4. Preuve attendue : [un résultat observable].\n5. Décision : [continuer, ajuster ou abandonner l’hypothèse].\n\nComplétez cette trame avec les informations de votre projet avant de la sauvegarder.`;
  }
  if (/pourquoi|comprendre|important/.test(question)) return `${context}\n\nCette étape vous permet de réduire une incertitude avant d’investir davantage de temps. ${task.description}\n\nCommencez par noter ce que vous savez déjà, puis ce qui reste à vérifier. Une première version imparfaite mais confrontée au terrain est plus utile qu’un document exhaustif.\n\nQuel est le principal point qui vous bloque aujourd’hui ?`;
  if (/suite|commenc|étape|aide|comment/.test(question)) return `${context}\n\nJe vous propose trois actions simples :\n\n1. Listez vos hypothèses à partir de votre brief.\n2. Choisissez la plus risquée et une manière concrète de la tester.\n3. Notez le résultat et la décision qu’il vous permet de prendre.\n\nPour cette tâche : ${task.description}\n\nVous pouvez me demander une trame de livrable pour poser vos idées.`;
  return `${context}\n\nVous avez écrit : « ${input} »\n\nPour transformer cette idée en action, précisez le résultat que vous voulez obtenir, une hypothèse à tester et un critère de réussite.\n\n${task.description}\n\nJe peux vous aider avec une méthode en trois étapes ou une trame de livrable. Cette assistance utilise des réponses prédéfinies, sans service IA connecté.`;
}
