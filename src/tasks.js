import { loadData, saveData } from "./store.js";
import { parseDeadline } from "./date.js";

const POINTS_PER_SUBTASK = 5;
const MAX_POINTS_PER_TASK = 50;

function findTask(data, id) {
  return data.tasks.find((t) => t.id === id);
}

// Base de 5 pts par sous-tache terminee, plafonnee a 50 pts par tache.
export function computeTaskPoints(task) {
  if (task.subtasks.length === 0) return task.completed ? MAX_POINTS_PER_TASK : 0;
  const done = task.subtasks.filter((s) => s.completed).length;
  return Math.min(done * POINTS_PER_SUBTASK, MAX_POINTS_PER_TASK);
}

export function addTask(profileId, title, deadlineInput) {
  const deadline = parseDeadline(deadlineInput);
  const data = loadData(profileId);
  const task = {
    id: data.nextId++,
    title,
    deadline,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    subtasks: [],
  };
  data.tasks.push(task);
  saveData(profileId, data);
  return task;
}

export function addSubtask(profileId, taskId, title, deadlineInput) {
  const deadline = parseDeadline(deadlineInput);
  const data = loadData(profileId);
  const task = findTask(data, taskId);
  if (!task) {
    throw new Error(`Tache #${taskId} introuvable.`);
  }
  const subtask = {
    id: data.nextId++,
    title,
    deadline,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  task.subtasks.push(subtask);
  saveData(profileId, data);
  return subtask;
}

export function listTasks(profileId) {
  const data = loadData(profileId);
  return data.tasks;
}

export function completeItem(profileId, id, { done = true } = {}) {
  const data = loadData(profileId);
  const task = findTask(data, id);
  if (task) {
    if (done && task.subtasks.some((s) => !s.completed)) {
      throw new Error("Impossible de cloturer cette tache : toutes les sous-taches doivent d'abord etre completees.");
    }
    task.completed = done;
    task.completedAt = done ? new Date().toISOString() : null;
    saveData(profileId, data);
    return task;
  }
  for (const t of data.tasks) {
    const subtask = t.subtasks.find((s) => s.id === id);
    if (subtask) {
      subtask.completed = done;
      subtask.completedAt = done ? new Date().toISOString() : null;
      saveData(profileId, data);
      return subtask;
    }
  }
  throw new Error(`Element #${id} introuvable.`);
}

export function removeItem(profileId, id) {
  const data = loadData(profileId);
  const taskIndex = data.tasks.findIndex((t) => t.id === id);
  if (taskIndex !== -1) {
    const [removed] = data.tasks.splice(taskIndex, 1);
    saveData(profileId, data);
    return removed;
  }
  for (const t of data.tasks) {
    const subIndex = t.subtasks.findIndex((s) => s.id === id);
    if (subIndex !== -1) {
      const [removed] = t.subtasks.splice(subIndex, 1);
      saveData(profileId, data);
      return removed;
    }
  }
  throw new Error(`Element #${id} introuvable.`);
}

export function setDeadline(profileId, id, deadlineInput) {
  const deadline = parseDeadline(deadlineInput);
  const data = loadData(profileId);
  const task = findTask(data, id);
  if (task) {
    task.deadline = deadline;
    saveData(profileId, data);
    return task;
  }
  for (const t of data.tasks) {
    const subtask = t.subtasks.find((s) => s.id === id);
    if (subtask) {
      subtask.deadline = deadline;
      saveData(profileId, data);
      return subtask;
    }
  }
  throw new Error(`Element #${id} introuvable.`);
}
