const params = new URLSearchParams(location.search);
const profileId = params.get("profile");

const activeAvatarEl = document.getElementById("active-avatar");
const activeNameEl = document.getElementById("active-name");
const statCountEl = document.getElementById("stat-count");
const statPointsEl = document.getElementById("stat-points");
const listEl = document.getElementById("achievements-full-list");
const emptyStateEl = document.getElementById("achievements-empty-state");

async function api(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Une erreur est survenue.");
  }
  return data;
}

function avatarMarkup(profile) {
  return profile.photo ? `<img src="${profile.photo}" alt="${profile.name}" />` : profile.avatar;
}

function renderAchievementRow(achievement, index = 0) {
  const isHidden = achievement.hidden && !achievement.unlocked;
  const row = document.createElement("div");
  row.className = `achievement-row${achievement.unlocked ? "" : " locked"}`;
  row.style.animationDelay = `${index * 60}ms`;
  const details = achievement.unlocked
    ? `<div class="achievement-date">Débloqué le ${new Date(achievement.completedAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}</div>`
    : `<div class="achievement-date">${isHidden ? "Succès caché" : achievement.description}</div>`;
  row.innerHTML = `<span class="achievement-icon">${achievement.unlocked ? "🏆" : "🔒"}</span>
    <div class="achievement-info">
      <div class="achievement-title">${isHidden ? "???" : achievement.title}</div>
      ${details}
    </div>
    ${achievement.unlocked ? `<span class="achievement-points">+${achievement.points} pts</span>` : ""}`;
  return row;
}

async function init() {
  if (!profileId) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById("back-link").href = `index.html?profile=${profileId}`;

  const [profile, achievements, catalog] = await Promise.all([
    api(`/api/profiles`).then((profiles) => profiles.find((p) => String(p.id) === profileId)),
    api(`/api/profiles/${profileId}/achievements`),
    api(`/api/profiles/${profileId}/achievement-catalog`),
  ]);

  if (!profile) {
    window.location.href = "index.html";
    return;
  }

  activeAvatarEl.innerHTML = avatarMarkup(profile);
  activeNameEl.textContent = profile.name;

  statCountEl.textContent = achievements.length;
  statPointsEl.textContent = achievements.reduce((sum, a) => sum + a.points, 0);

  emptyStateEl.remove();
  catalog.forEach((achievement, index) => {
    listEl.appendChild(renderAchievementRow(achievement, index));
  });
}

init();
