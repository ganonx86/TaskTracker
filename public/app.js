const taskListEl = document.getElementById("task-list");
const emptyStateEl = document.getElementById("empty-state");
const overlayEl = document.getElementById("overlay");
const modalForm = document.getElementById("modal-form");
const modalTitleEl = document.getElementById("modal-title");
const titleInput = document.getElementById("modal-title-input");
const deadlineInput = document.getElementById("modal-deadline-input");

const profileScreenEl = document.getElementById("profile-screen");
const appEl = document.getElementById("app");
const profileGridEl = document.getElementById("profile-grid");
const profileOverlayEl = document.getElementById("profile-overlay");
const profileForm = document.getElementById("profile-form");
const profileModalTitleEl = document.getElementById("profile-modal-title");
const profileSubmitBtn = document.getElementById("profile-submit-btn");
const profileNameInput = document.getElementById("profile-name-input");
const profilePrenomInput = document.getElementById("profile-prenom-input");
const profileNomInput = document.getElementById("profile-nom-input");
const profileBirthdateInput = document.getElementById("profile-birthdate-input");
const profilePhotoInput = document.getElementById("profile-photo-input");
const photoPreviewEl = document.getElementById("photo-preview");
const removePhotoBtn = document.getElementById("remove-photo-btn");
const avatarPickerEl = document.getElementById("avatar-picker");
const activeAvatarEl = document.getElementById("active-avatar");
const activeNameEl = document.getElementById("active-name");

const AVATARS = ["🎮", "🚀", "🐱", "🐉", "🦊", "🍕", "⚡", "🌟", "🎧", "🏆"];
const ACTIVE_PROFILE_COOKIE = "tasktracker_active_profile";
const PROFILES_COOKIE = "tasktracker_profiles";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
let activeProfile = null;
let selectedAvatar = AVATARS[0];
let selectedPhoto = null; // data URL de la nouvelle photo choisie
let photoRemoved = false; // l'utilisateur a retire la photo existante
let editingProfileId = null; // null = creation, sinon id du profil modifie

let modalMode = null; // { type: 'task' | 'subtask' | 'deadline', taskId?, itemId? }
let previousScore = null; // score total lors du dernier rendu (null = pas encore initialise)
let previousLevel = null; // niveau lors du dernier rendu (null = pas encore initialise)
const scoreBadgeEl = document.getElementById("score-badge");
const scoreValueEl = document.getElementById("score-value");
const levelBadgeEl = document.getElementById("level-badge");
const levelValueEl = document.getElementById("level-value");
const levelProgressFillEl = document.getElementById("level-progress-fill");

const POINTS_PER_SUBTASK = 5;
const MAX_POINTS_PER_TASK = 50;
// XP requis pour passer du niveau n au niveau n+1 : une courbe qui s'allonge, comme dans un jeu video.
const LEVEL_BASE_XP = 100;

function xpForLevel(level) {
  return LEVEL_BASE_XP * level;
}

function computeLevelInfo(totalXp) {
  let level = 1;
  let remaining = totalXp;
  let needed = xpForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level++;
    needed = xpForLevel(level);
  }
  return { level, currentXp: remaining, neededXp: needed };
}

async function api(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Une erreur est survenue.");
  }
  return data;
}

function setCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function getCookie(name) {
  const prefix = `${name}=`;
  const value = document.cookie.split("; ").find((cookie) => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

function saveProfilesCookie(profiles) {
  const summaries = profiles.slice(0, 20).map(({ id, name, avatar, photo }) => ({ id, name, avatar, photo }));
  setCookie(PROFILES_COOKIE, JSON.stringify(summaries));
}

async function syncProfilesCookie() {
  const profiles = await api("/api/profiles");
  saveProfilesCookie(profiles);
  return profiles;
}

function isOverdue(deadline, completed) {
  if (!deadline || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${deadline}T00:00:00`) < today;
}

function openModal(mode) {
  modalMode = mode;
  modalForm.reset();
  const titleField = titleInput.closest("label");
  if (mode.type === "deadline") {
    modalTitleEl.textContent = "Modifier la deadline";
    titleField.style.display = "none";
    titleInput.required = false;
    deadlineInput.value = mode.currentDeadline || "";
  } else {
    titleField.style.display = "";
    titleInput.required = true;
    modalTitleEl.textContent = mode.type === "task" ? "Nouvelle tâche" : "Nouvelle sous-tâche";
  }
  overlayEl.classList.remove("hidden");
  (mode.type === "deadline" ? deadlineInput : titleInput).focus();
}

function closeModal() {
  overlayEl.classList.add("hidden");
  modalMode = null;
}

document.getElementById("add-task-btn").addEventListener("click", () => {
  openModal({ type: "task" });
});

document.getElementById("modal-cancel-btn").addEventListener("click", closeModal);
overlayEl.addEventListener("click", (e) => {
  if (e.target === overlayEl) closeModal();
});

modalForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    if (modalMode.type === "task") {
      await api(`/api/profiles/${activeProfile.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title: titleInput.value, deadline: deadlineInput.value }),
      });
    } else if (modalMode.type === "subtask") {
      await api(`/api/profiles/${activeProfile.id}/tasks/${modalMode.taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify({ title: titleInput.value, deadline: deadlineInput.value }),
      });
    } else if (modalMode.type === "deadline") {
      await api(`/api/profiles/${activeProfile.id}/items/${modalMode.itemId}/deadline`, {
        method: "PATCH",
        body: JSON.stringify({ deadline: deadlineInput.value }),
      });
    }
    closeModal();
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

async function toggleComplete(id, completed) {
  try {
    const result = await api(`/api/profiles/${activeProfile.id}/items/${id}/complete`, {
      method: "PATCH",
      body: JSON.stringify({ completed }),
    });
    await refresh();
    const achievements = result.achievements || (result.achievement ? [result.achievement] : []);
    achievements.forEach((achievement, index) => {
      setTimeout(() => showAchievementCelebration(achievement), index * 350);
    });
  } catch (err) {
    alert(err.message);
  }
}

async function removeItem(id) {
  if (!confirm("Supprimer cet element ?")) return;
  await api(`/api/profiles/${activeProfile.id}/items/${id}`, { method: "DELETE" });
  await refresh();
}

function renderItemRow(item, { onAddSub } = {}) {
  const row = document.createElement("div");
  row.className = "item-row";

  const checkbox = document.createElement("button");
  checkbox.className = `checkbox${item.completed ? " checked" : ""}`;
  checkbox.textContent = item.completed ? "✓" : "";
  checkbox.title = item.completed ? "Marquer comme non terminee" : "Marquer comme terminee";
  checkbox.addEventListener("click", () => toggleComplete(item.id, !item.completed));
  row.appendChild(checkbox);

  const title = document.createElement("span");
  title.className = `item-title${item.completed ? " completed" : ""}`;
  title.textContent = item.title;
  row.appendChild(title);

  const deadlineBtn = document.createElement("button");
  deadlineBtn.className = `deadline-badge${isOverdue(item.deadline, item.completed) ? " overdue" : ""}`;
  deadlineBtn.textContent = item.deadline
    ? isOverdue(item.deadline, item.completed)
      ? `⚠ ${item.deadline}`
      : item.deadline
    : "+ deadline";
  deadlineBtn.addEventListener("click", () =>
    openModal({ type: "deadline", itemId: item.id, currentDeadline: item.deadline })
  );
  row.appendChild(deadlineBtn);

  const actions = document.createElement("div");
  actions.className = "row-actions";

  if (onAddSub) {
    const addBtn = document.createElement("button");
    addBtn.className = "btn-icon";
    addBtn.title = "Ajouter une sous-tache";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", onAddSub);
    actions.appendChild(addBtn);
  }

  const delBtn = document.createElement("button");
  delBtn.className = "btn-icon danger";
  delBtn.title = "Supprimer";
  delBtn.textContent = "✕";
  delBtn.addEventListener("click", () => removeItem(item.id));
  actions.appendChild(delBtn);

  row.appendChild(actions);
  return row;
}

function computeProgress(task) {
  if (task.subtasks.length === 0) return task.completed ? 100 : 0;
  const done = task.subtasks.filter((s) => s.completed).length;
  return Math.round((done / task.subtasks.length) * 100);
}

// Base de 5 pts par sous-tache terminee, plafonnee a 50 pts par tache.
// Sans sous-tache, la tache rapporte le plafond complet une fois terminee.
function computeTaskPoints(task) {
  if (task.subtasks.length === 0) return task.completed ? MAX_POINTS_PER_TASK : 0;
  const done = task.subtasks.filter((s) => s.completed).length;
  return Math.min(done * POINTS_PER_SUBTASK, MAX_POINTS_PER_TASK);
}

function computeTotalScore(tasks) {
  const taskPoints = tasks.reduce((sum, task) => sum + computeTaskPoints(task), 0);
  return taskPoints + (activeProfile.pointsArchives || 0);
}

function renderProgressBar(percent) {
  const wrapper = document.createElement("div");
  wrapper.className = "progress-bar";
  const fill = document.createElement("div");
  fill.className = `progress-fill${percent === 100 ? " complete" : ""}`;
  fill.style.width = `${percent}%`;
  wrapper.appendChild(fill);
  return wrapper;
}

function renderTask(task) {
  const card = document.createElement("div");
  card.className = "task-card";
  card.appendChild(
    renderItemRow(task, { onAddSub: () => openModal({ type: "subtask", taskId: task.id }) })
  );
  card.appendChild(renderProgressBar(computeProgress(task)));

  if (task.subtasks.length > 0) {
    const subtasksEl = document.createElement("div");
    subtasksEl.className = "subtasks";
    for (const sub of task.subtasks) {
      subtasksEl.appendChild(renderItemRow(sub));
    }
    card.appendChild(subtasksEl);
  }

  return card;
}

let audioCtx = null;

function playAchievementSound() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const notes = [523.25, 659.25, 783.99, 1046.5]; // do-mi-sol-do, arpege ascendant
  const startTime = audioCtx.currentTime;
  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const noteStart = startTime + i * 0.09;
    gain.gain.setValueAtTime(0, noteStart);
    gain.gain.linearRampToValueAtTime(0.25, noteStart + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.4);
  });
}

function playPointSound() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  const startTime = audioCtx.currentTime;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.18, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + 0.2);
}

function showAchievementCelebration(achievement) {
  playAchievementSound();
  const toast = document.createElement("div");
  toast.className = "toast achievement-toast";
  toast.innerHTML = `<span class="toast-icon">🏆</span><div class="toast-content"><div class="toast-kicker">Succès débloqué</div><div class="toast-title">${achievement.title}</div><div class="toast-subtitle">${achievement.description}</div></div><span class="toast-points">+${achievement.points} pts</span>`;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 2800);
}

function updateScoreBadge(total, delta) {
  scoreValueEl.textContent = total;
  if (delta > 0) {
    playPointSound();
    scoreBadgeEl.classList.remove("pulse");
    void scoreBadgeEl.offsetWidth; // relance l'animation meme si elle vient de jouer
    scoreBadgeEl.classList.add("pulse");
    const float = document.createElement("span");
    float.className = "score-float";
    float.textContent = `+${delta}`;
    scoreBadgeEl.appendChild(float);
    float.addEventListener("animationend", () => float.remove(), { once: true });
  }
  updateLevelBadge(total);
}

function updateLevelBadge(total) {
  const { level, currentXp, neededXp } = computeLevelInfo(total);
  levelValueEl.textContent = level;
  levelProgressFillEl.style.width = `${Math.round((currentXp / neededXp) * 100)}%`;
  if (previousLevel !== null && level > previousLevel) {
    playAchievementSound();
    levelBadgeEl.classList.remove("pulse");
    void levelBadgeEl.offsetWidth; // relance l'animation meme si elle vient de jouer
    levelBadgeEl.classList.add("pulse");
    showLevelUpCelebration(level);
  }
  previousLevel = level;
}

function showLevelUpCelebration(level) {
  const toast = document.createElement("div");
  toast.className = "toast achievement-toast";
  toast.innerHTML = `<span class="toast-icon">⭐</span><div class="toast-content"><div class="toast-kicker">Niveau superieur</div><div class="toast-title">Niveau ${level}</div></div>`;
  document.getElementById("toast-container").appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, 2800);
}

async function refresh() {
  const [tasks, profiles] = await Promise.all([
    api(`/api/profiles/${activeProfile.id}/tasks`),
    api("/api/profiles"),
  ]);
  activeProfile = profiles.find((profile) => profile.id === activeProfile.id) || activeProfile;
  taskListEl.innerHTML = "";
  if (tasks.length === 0) {
    taskListEl.appendChild(emptyStateEl);
    const totalScore = activeProfile.pointsArchives || 0;
    updateScoreBadge(totalScore, 0);
    previousScore = totalScore;
    await loadAchievementsPreview();
    return;
  }
  for (const task of tasks) {
    taskListEl.appendChild(renderTask(task));
  }

  const totalScore = computeTotalScore(tasks);
  const delta = previousScore === null ? 0 : Math.max(totalScore - previousScore, 0);
  updateScoreBadge(totalScore, delta);
  previousScore = totalScore;
  await loadAchievementsPreview();
}

async function loadAchievementsPreview() {
  const achievements = await api(`/api/profiles/${activeProfile.id}/achievements?limit=3`);
  const section = document.getElementById("achievements-preview");
  const list = document.getElementById("achievements-preview-list");
  if (achievements.length === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");
  list.innerHTML = achievements.map((a, i) => renderAchievementRow(a, i)).join("");
}

function renderAchievementRow(achievement, index = 0) {
  const date = new Date(achievement.completedAt).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `<div class="achievement-row" style="animation-delay:${index * 70}ms">
    <span class="achievement-icon">🏆</span>
    <div class="achievement-info">
      <div class="achievement-title">${achievement.title}</div>
      <div class="achievement-date">${date}</div>
    </div>
    <span class="achievement-points">+${achievement.points} pts</span>
  </div>`;
}

// --- Gestion des profils (façon selection de profil Xbox) ---

function renderAvatarPicker() {
  avatarPickerEl.innerHTML = "";
  for (const avatar of AVATARS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `avatar-option${avatar === selectedAvatar ? " selected" : ""}`;
    btn.textContent = avatar;
    btn.addEventListener("click", () => {
      selectedAvatar = avatar;
      renderAvatarPicker();
    });
    avatarPickerEl.appendChild(btn);
  }
}

function renderPhotoPreview() {
  if (selectedPhoto) {
    photoPreviewEl.innerHTML = `<img src="${selectedPhoto}" alt="Photo de profil" />`;
    removePhotoBtn.classList.remove("hidden");
  } else if (editingProfileId && !photoRemoved && photoPreviewEl.dataset.existingPhoto) {
    photoPreviewEl.innerHTML = `<img src="${photoPreviewEl.dataset.existingPhoto}" alt="Photo de profil" />`;
    removePhotoBtn.classList.remove("hidden");
  } else {
    photoPreviewEl.textContent = selectedAvatar;
    removePhotoBtn.classList.add("hidden");
  }
}

profilePhotoInput.addEventListener("change", () => {
  const file = profilePhotoInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    selectedPhoto = reader.result;
    photoRemoved = false;
    renderPhotoPreview();
  };
  reader.readAsDataURL(file);
});

removePhotoBtn.addEventListener("click", () => {
  selectedPhoto = null;
  photoRemoved = true;
  profilePhotoInput.value = "";
  renderPhotoPreview();
});

function openProfileModal(profile) {
  profileForm.reset();
  selectedPhoto = null;
  photoRemoved = false;
  photoPreviewEl.dataset.existingPhoto = "";

  if (profile) {
    editingProfileId = profile.id;
    profileModalTitleEl.textContent = "Modifier le profil";
    profileSubmitBtn.textContent = "Enregistrer";
    profileNameInput.value = profile.name;
    profilePrenomInput.value = profile.prenom || "";
    profileNomInput.value = profile.nom || "";
    profileBirthdateInput.value = profile.dateNaissance || "";
    selectedAvatar = profile.avatar;
    if (profile.photo) photoPreviewEl.dataset.existingPhoto = profile.photo;
  } else {
    editingProfileId = null;
    profileModalTitleEl.textContent = "Nouveau profil";
    profileSubmitBtn.textContent = "Créer";
    selectedAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  }

  renderAvatarPicker();
  renderPhotoPreview();
  profileOverlayEl.classList.remove("hidden");
  profileNameInput.focus();
}

function closeProfileModal() {
  profileOverlayEl.classList.add("hidden");
}

document.getElementById("profile-cancel-btn").addEventListener("click", closeProfileModal);
profileOverlayEl.addEventListener("click", (e) => {
  if (e.target === profileOverlayEl) closeProfileModal();
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    name: profileNameInput.value,
    prenom: profilePrenomInput.value,
    nom: profileNomInput.value,
    dateNaissance: profileBirthdateInput.value,
    avatar: selectedAvatar,
  };
  if (selectedPhoto) payload.photo = selectedPhoto;
  if (photoRemoved) payload.removePhoto = true;

  try {
    let profile;
    if (editingProfileId) {
      profile = await api(`/api/profiles/${editingProfileId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      profile = await api("/api/profiles", { method: "POST", body: JSON.stringify(payload) });
    }
    await syncProfilesCookie();
    closeProfileModal();
    if (activeProfile && activeProfile.id === profile.id) {
      selectProfile(profile);
    } else if (!activeProfile) {
      await renderProfileGrid();
      selectProfile(profile);
    } else {
      await renderProfileGrid();
    }
  } catch (err) {
    alert(err.message);
  }
});

async function removeProfileTile(id, e) {
  e.stopPropagation();
  if (!confirm("Supprimer ce profil et toutes ses taches ?")) return;
  await api(`/api/profiles/${id}`, { method: "DELETE" });
  await renderProfileGrid();
}

function avatarMarkup(profile) {
  return profile.photo
    ? `<img src="${profile.photo}" alt="${profile.name}" />`
    : profile.avatar;
}

async function renderProfileGrid() {
  const profiles = await api("/api/profiles");
  saveProfilesCookie(profiles);
  profileGridEl.innerHTML = "";
  for (const profile of profiles) {
    const tile = document.createElement("button");
    tile.className = "profile-tile";
    tile.innerHTML = `<span class="avatar-circle">${avatarMarkup(profile)}</span><span class="profile-name">${profile.name}</span><button class="edit-profile-tile-btn" title="Modifier">✎</button><button class="remove-profile-btn" title="Supprimer">✕</button>`;
    tile.addEventListener("click", () => selectProfile(profile));
    tile.querySelector(".remove-profile-btn").addEventListener("click", (e) => removeProfileTile(profile.id, e));
    tile.querySelector(".edit-profile-tile-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openProfileModal(profile);
    });
    profileGridEl.appendChild(tile);
  }
  const addTile = document.createElement("button");
  addTile.className = "profile-tile add-tile";
  addTile.innerHTML = `<span class="avatar-circle">+</span><span class="profile-name">Nouveau profil</span>`;
  addTile.addEventListener("click", () => openProfileModal());
  profileGridEl.appendChild(addTile);
}

function selectProfile(profile) {
  activeProfile = profile;
  setCookie(ACTIVE_PROFILE_COOKIE, String(profile.id));
  activeAvatarEl.innerHTML = avatarMarkup(profile);
  activeNameEl.textContent = profile.name;
  profileScreenEl.classList.add("hidden");
  appEl.classList.remove("hidden");
  previousScore = null;
  document.getElementById("view-achievements-btn").href = `achievements.html?profile=${profile.id}`;
  refresh();
}

function showProfileScreen() {
  activeProfile = null;
  appEl.classList.add("hidden");
  profileScreenEl.classList.remove("hidden");
  renderProfileGrid();
}

const profileChipBtn = document.getElementById("profile-chip-btn");
const profileDropdownEl = document.getElementById("profile-dropdown");

profileChipBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  profileDropdownEl.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!profileDropdownEl.classList.contains("hidden") && !profileDropdownEl.contains(e.target)) {
    profileDropdownEl.classList.add("hidden");
  }
});

document.getElementById("dropdown-edit-btn").addEventListener("click", () => {
  profileDropdownEl.classList.add("hidden");
  openProfileModal(activeProfile);
});

document.getElementById("dropdown-switch-btn").addEventListener("click", () => {
  profileDropdownEl.classList.add("hidden");
  showProfileScreen();
});

// La page de selection de profil est le premier ecran affiche, sauf lien direct (?profile=id).
async function init() {
  const params = new URLSearchParams(location.search);
  const linkedId = Number(params.get("profile"));
  const savedProfileId = Number(getCookie(ACTIVE_PROFILE_COOKIE));
  const profileId = linkedId || savedProfileId;
  if (profileId) {
    history.replaceState(null, "", location.pathname);
    try {
      const profiles = await api("/api/profiles");
      saveProfilesCookie(profiles);
      const profile = profiles.find((p) => p.id === profileId);
      if (profile) {
        selectProfile(profile);
        return;
      }
    } catch {
      // ignore et retombe sur l'ecran de selection
    }
  }
  showProfileScreen();
}

init();
