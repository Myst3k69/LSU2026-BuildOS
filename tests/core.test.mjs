import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, createProject, demoProject, progress, loadProject, saveProject, respond, isProject } from '../public/core.js';

function memoryStorage() {
  const data=new Map();
  return { getItem: key=>data.get(key) ?? null, setItem: (key,value)=>data.set(key,value) };
}
test('un nouveau projet comporte six domaines et les étapes souvent oubliées, sans tâche déjà terminée',()=>{
  const p=createProject(' Bloom ', ' Une application pour les petites équipes créatives. ');
  assert.equal(p.name,'Bloom');
  assert.equal(p.tasks.length,12);
  assert.equal(new Set(p.tasks.map(t=>t.domain)).size,6);
  assert.equal(p.tasks.filter(t=>t.forgotten).length,3);
  assert.equal(progress(p).percent,0);
  assert.equal(p.tasks.some(t=>t.due==='Fait'),false);
  assert.equal(isProject(p),true);
});
test('la démo et les progrès par domaine sont cohérents',()=>{
  const p=demoProject();
  assert.deepEqual(progress(p),{total:12,done:3,percent:25});
  assert.deepEqual(progress(p,'strategy'),{total:2,done:1,percent:50});
  p.tasks.forEach(t=>t.done=true);
  assert.equal(progress(p).percent,100);
});
test('la sauvegarde restitue projet, tâches, conversations, livrables et décisions',()=>{
  const s=memoryStorage(),p=createProject('Studio','Un outil de suivi pour les freelances créatifs.');
  p.tasks[0].done=true;
  p.tasks[0].messages.push({role:'user',content:'Comment commencer ?'},{role:'assistant',content:'Par une hypothèse.'});
  p.tasks[0].deliverable='Une vision claire';
  p.decisions.push({id:'d1',title:'Cibler les freelances',text:'Une cible précise',taskId:p.tasks[0].id,createdAt:new Date().toISOString()});
  assert.equal(saveProject(s,p),true);
  assert.deepEqual(loadProject(s),p);
});
test('un stockage absent, invalide ou inaccessible retombe sur la démo',()=>{
  const s=memoryStorage();
  assert.equal(loadProject(s).demo,true);
  s.setItem(STORAGE_KEY,'{corrompu');
  assert.equal(loadProject(s).demo,true);
  s.setItem(STORAGE_KEY,JSON.stringify({version:1,name:'x',tasks:[{}]}));
  assert.equal(loadProject(s).demo,true);
  assert.equal(loadProject({getItem(){throw Error('bloqué');}}).demo,true);
});
test('un échec de sauvegarde est signalé au lieu d’être présenté comme un succès',()=>{
  assert.equal(saveProject({setItem(){throw Error('quota');}},demoProject()),false);
});
test('les suggestions restent rattachées à la tâche et au projet',()=>{
  const p=createProject('Bloom','Un service de fleurs locales pour les entreprises.');
  const t=p.tasks.find(t=>t.title.includes('proposition de valeur'));
  const result=respond(p,t,'Aide-moi à rédiger une proposition');
  assert.match(result,/Bloom/);
  assert.match(result,/fleurs locales/);
  assert.match(result,/trame est une suggestion simulée/);
  assert.match(respond(p,t,'Pourquoi est-ce important ?'),/réduire une incertitude/);
  assert.match(respond(p,t,'Comment commencer ?'),/trois actions/);
});
test('les données de conversation malformées ne sont pas chargées',()=>{
  const p=demoProject();p.tasks[0].messages=[{role:'invalid',content:42}];
  assert.equal(isProject(p),false);
});
