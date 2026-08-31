import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.pkg
  ? path.join(process.env.APPDATA || process.env.LOCALAPPDATA || process.cwd(), "TaskTracker", "data")
  : path.join(__dirname, "..", "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");
const LEGACY_TASKS_FILE = path.join(DATA_DIR, "tasks.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function taskFile(profileId) {
  return path.join(DATA_DIR, `tasks-${profileId}.json`);
}

function achievementsFile(profileId) {
  return path.join(DATA_DIR, `achievements-${profileId}.json`);
}

export function loadAchievements(profileId) {
  ensureDataDir();
  const file = achievementsFile(profileId);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ achievements: [], nextId: 1 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function saveAchievements(profileId, data) {
  ensureDataDir();
  fs.writeFileSync(achievementsFile(profileId), JSON.stringify(data, null, 2));
}

export function deleteAchievements(profileId) {
  const file = achievementsFile(profileId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

const AVATARS_DIR = path.join(DATA_DIR, "avatars");

function extensionFromDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.exec(dataUrl);
  return match ? (match[1] === "jpeg" ? "jpg" : match[1]) : null;
}

export function saveAvatarPhoto(profileId, dataUrl) {
  const ext = extensionFromDataUrl(dataUrl);
  if (!ext) {
    throw new Error("Format d'image non supporte (png, jpg, gif ou webp attendu).");
  }
  if (!fs.existsSync(AVATARS_DIR)) fs.mkdirSync(AVATARS_DIR, { recursive: true });
  deleteAvatarPhoto(profileId);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const buffer = Buffer.from(base64, "base64");
  const MAX_SIZE = 3 * 1024 * 1024; // 3 Mo
  if (buffer.length > MAX_SIZE) {
    throw new Error("L'image est trop volumineuse (3 Mo maximum).");
  }
  const filename = `${profileId}.${ext}`;
  fs.writeFileSync(path.join(AVATARS_DIR, filename), buffer);
  return `/avatars/${filename}`;
}

export function deleteAvatarPhoto(profileId) {
  if (!fs.existsSync(AVATARS_DIR)) return;
  for (const file of fs.readdirSync(AVATARS_DIR)) {
    if (file.startsWith(`${profileId}.`)) {
      fs.unlinkSync(path.join(AVATARS_DIR, file));
    }
  }
}

// Migre les anciennes donnees (avant les profils) vers un premier profil.
function migrateLegacyData() {
  if (fs.existsSync(PROFILES_FILE) || !fs.existsSync(LEGACY_TASKS_FILE)) return;
  const legacy = fs.readFileSync(LEGACY_TASKS_FILE, "utf-8");
  fs.writeFileSync(
    PROFILES_FILE,
    JSON.stringify({ profiles: [{ id: 1, name: "Joueur 1", avatar: "🎮" }], nextId: 2 }, null, 2)
  );
  fs.writeFileSync(taskFile(1), legacy);
  fs.unlinkSync(LEGACY_TASKS_FILE);
}

export function loadProfiles() {
  ensureDataDir();
  migrateLegacyData();
  if (!fs.existsSync(PROFILES_FILE)) {
    fs.writeFileSync(PROFILES_FILE, JSON.stringify({ profiles: [], nextId: 1 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(PROFILES_FILE, "utf-8"));
}

export function saveProfiles(data) {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2));
}

export function loadData(profileId) {
  ensureDataDir();
  const file = taskFile(profileId);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify({ tasks: [], nextId: 1 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

export function saveData(profileId, data) {
  ensureDataDir();
  fs.writeFileSync(taskFile(profileId), JSON.stringify(data, null, 2));
}

export function deleteProfileData(profileId) {
  const file = taskFile(profileId);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  deleteAchievements(profileId);
}
