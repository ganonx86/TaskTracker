import { loadAchievements, saveAchievements } from "./store.js";

export function listAchievements(profileId, limit) {
  const data = loadAchievements(profileId);
  const sorted = [...data.achievements].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  return limit ? sorted.slice(0, limit) : sorted;
}

export const ACHIEVEMENT_DEFINITIONS = [
  ["first-quest", "Bienvenue, Aventurier", "Terminer sa première quête", "count", 1],
  ["five-quests", "Et c'est parti !", "Terminer 5 quêtes", "count", 5],
  ["hard-quest", "Petit mais vaillant", "Terminer une quête marquée comme difficile"],
  ["before-deadline", "Une bonne chose de faite", "Terminer une quête avant sa date limite", "beforeDeadline"],
  ["level-two", "Premier niveau", "Atteindre le niveau 2"],
  ["ten-quests", "La machine est lancée", "Terminer 10 quêtes", "count", 10],
  ["twenty-five-quests", "Ça devient sérieux", "Terminer 25 quêtes", "count", 25],
  ["hundred-quests", "Héros du quotidien", "Terminer 100 quêtes", "count", 100],

  ["three-day-streak", "Sur une lancée", "3 jours consécutifs avec au moins une quête terminée", "streak", 3],
  ["seven-day-streak", "Je ne m'arrête plus", "7 jours consécutifs", "streak", 7],
  ["perfect-week", "Une semaine parfaite", "Terminer toutes les quêtes prévues pendant 7 jours"],
  ["fourteen-day-streak", "Deux semaines, tranquille", "14 jours consécutifs", "streak", 14],
  ["thirty-day-streak", "Inarrêtable", "30 jours consécutifs", "streak", 30],
  ["hundred-day-streak", "Machine de guerre", "100 jours consécutifs", "streak", 100],
  ["year-streak", "La légende raconte...", "365 jours consécutifs", "streak", 365],
  ["hundred-active-days", "Aujourd'hui aussi", "Accomplir au moins une quête pendant 100 jours", "streak", 100],

  ["long-postponed", "J'aurais pu remettre à demain", "Terminer une tâche que tu repoussais depuis longtemps"],
  ["very-hard-quest", "Le boss est tombé", "Terminer une quête très difficile"],
  ["hated-task", "Pas aujourd'hui, Satan", "Terminer une tâche que tu détestes"],
  ["three-hard-daily", "Mission suicide", "Terminer 3 quêtes difficiles dans la même journée"],
  ["five-hard-daily", "Mode Hardcore", "Terminer 5 quêtes difficiles en une journée"],
  ["no-reminder", "Sans les mains", "Terminer une quête sans utiliser de rappel"],
  ["waiting-seven-days", "C'était pas si terrible", "Terminer une quête restée en attente pendant 7 jours", "waiting", 7],
  ["waiting-thirty-days", "Enfin débarrassé", "Terminer une quête restée en attente pendant 30 jours", "waiting", 30],

  ["laundry", "Le linge ne se plie pas tout seul", "Faire une lessive"],
  ["tidy-room", "Maître du rangement", "Ranger entièrement une pièce"],
  ["dirty-room", "Que la lumière soit", "Nettoyer une pièce particulièrement sale"],
  ["clean-home", "Le royaume est propre", "Nettoyer toute la maison"],
  ["home-cooked-meal", "Chef de guilde", "Preparer un repas maison"],
  ["five-home-cooked-meals", "Gordon Ramsay peut trembler", "Cuisiner 5 repas maison"],
  ["groceries", "Le frigo respire", "Faire les courses"],
  ["clean-and-groceries", "Épée et plumeau", "Faire le ménage et les courses le même jour"],
  ["lost-item", "Je l'avais pourtant rangé ici...", "Retrouver quelque chose perdu depuis longtemps"],
  ["spring-cleaning", "Adieu, poussière", "Faire un grand ménage"],

  ["accounts", "L'argent ne pousse toujours pas sur les arbres", "Faire ses comptes"],
  ["budget-update", "Comptable du dimanche", "Mettre son budget à jour"],
  ["budget-month", "Pas aujourd'hui, découvert", "Respecter son budget pendant un mois"],
  ["first-savings", "Le trésor grandit", "Épargner une première somme"],
  ["savings-goal", "Petit pactole", "Atteindre un objectif d'épargne"],
  ["admin-five", "Paperasse Slayer", "Terminer 5 tâches administratives"],
  ["mailbox", "Le courrier ne fait plus peur", "Vider sa boîte aux lettres"],
  ["old-admin", "Dossier classé", "Terminer une tâche administrative vieille de plus de 30 jours"],

  ["habit-three-days", "Un peu mieux qu'hier", "Compléter une habitude pendant 3 jours"],
  ["reading", "Ça travaille là-haut", "Lire pendant 30 minutes"],
  ["learn-new", "Connaissance +1", "Apprendre quelque chose de nouveau"],
  ["no-motivation", "Pas besoin de motivation", "Accomplir une tâche malgré l'absence de motivation"],
  ["habit-thirty-days", "Discipline > motivation", "Maintenir une habitude pendant 30 jours"],
  ["learning-goal", "Nouvelle compétence débloquée", "Terminer un objectif d'apprentissage"],
  ["impossible", "Je peux le faire", "Réussir quelque chose qui semblait impossible"],

  ["at-2359", "???", "Terminer une quête à 23h59", "at2359", null, true],
  ["last-second", "Dernière seconde", "Terminer une quête moins d'une minute avant l'échéance", null, null, true],
  ["postpone-ten", "On verra demain", "Reporter une quête 10 fois", null, null, true],
  ["twenty-overdue", "Le procrastinateur", "Avoir 20 quêtes en retard", null, null, true],
  ["recreate", "J'ai changé d'avis", "Annuler une quête puis la recréer", null, null, true],
  ["after-midnight", "Qui a besoin de sommeil ?", "Terminer une quête après minuit", "afterMidnight", null, true],
  ["speedrun", "Speedrun", "Terminer une quête moins de 30 secondes après sa création", "speedrun", null, true],
  ["overkill", "Overkill", "Terminer une quête extrêmement facile avec une difficulté maximale", null, null, true],
  ["why", "Mais pourquoi ?", "Créer une quête puis la supprimer immédiatement", null, null, true],
  ["unplanned", "C'était pas prévu", "Terminer une quête qui n'était pas planifiée", null, null, true],
].map(([id, title, description, rule = null, threshold = null, hidden = false]) => ({
  id,
  title,
  description,
  rule,
  threshold,
  hidden,
  points: 50,
}));

function loadAchievementData(profileId) {
  const data = loadAchievements(profileId);
  data.statuses ||= {};
  let changed = false;
  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    const achievement = data.achievements.find((item) => item.definitionId === definition.id);
    const status = achievement
      ? { state: "unlocked", completedAt: achievement.completedAt }
      : { state: "locked", completedAt: null };
    if (JSON.stringify(data.statuses[definition.id]) !== JSON.stringify(status)) {
      data.statuses[definition.id] = status;
      changed = true;
    }
  }
  if (changed) saveAchievements(profileId, data);
  return data;
}

export function listAchievementCatalog(profileId) {
  const data = loadAchievementData(profileId);
  return ACHIEVEMENT_DEFINITIONS.map((definition) => ({
    ...definition,
    unlocked: data.statuses[definition.id].state === "unlocked",
    completedAt: data.statuses[definition.id].completedAt,
  }));
}

function localDateKey(isoDate) {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function longestStreak(tasks) {
  const dates = [...new Set(tasks.map((task) => localDateKey(task.completedAt)))].sort();
  let longest = 0;
  let current = 0;
  let previous = null;
  for (const date of dates) {
    const day = new Date(`${date}T00:00:00`);
    current = previous && day.getTime() - previous.getTime() === 86_400_000 ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = day;
  }
  return longest;
}

function meetsCondition(definition, completedTasks) {
  const latest = completedTasks.at(-1);
  if (!definition.rule || !latest) return false;
  if (definition.rule === "count") return completedTasks.length >= definition.threshold;
  if (definition.rule === "streak") return longestStreak(completedTasks) >= definition.threshold;
  if (definition.rule === "beforeDeadline") {
    return completedTasks.some((task) => task.deadline && new Date(task.completedAt) <= new Date(`${task.deadline}T23:59:59.999`));
  }
  if (definition.rule === "waiting") {
    return completedTasks.some((task) => task.createdAt && new Date(task.completedAt) - new Date(task.createdAt) >= definition.threshold * 86_400_000);
  }
  const completedAt = new Date(latest.completedAt);
  if (definition.rule === "at2359") return completedAt.getHours() === 23 && completedAt.getMinutes() === 59;
  if (definition.rule === "afterMidnight") return completedAt.getHours() < 5;
  if (definition.rule === "speedrun") {
    return Boolean(latest.createdAt) && new Date(latest.completedAt) - new Date(latest.createdAt) < 30_000;
  }
  return false;
}

export function unlockEligibleAchievements(profileId, tasks) {
  const completedTasks = tasks
    .filter((task) => task.completed && task.completedAt)
    .sort((first, second) => first.completedAt.localeCompare(second.completedAt));
  const data = loadAchievementData(profileId);
  const unlockedIds = new Set(data.achievements.map((achievement) => achievement.definitionId));
  const unlocked = [];

  for (const definition of ACHIEVEMENT_DEFINITIONS) {
    if (unlockedIds.has(definition.id) || !meetsCondition(definition, completedTasks)) continue;
    const achievement = {
      id: data.nextId++,
      definitionId: definition.id,
      taskId: completedTasks.at(-1).id,
      title: definition.title,
      description: definition.description,
      points: definition.points,
      completedAt: new Date().toISOString(),
    };
    data.achievements.push(achievement);
    data.statuses[definition.id] = { state: "unlocked", completedAt: achievement.completedAt };
    unlocked.push(achievement);
  }
  if (unlocked.length > 0) saveAchievements(profileId, data);
  return unlocked;
}
