import { loadProfiles, saveProfiles, deleteProfileData, saveAvatarPhoto, deleteAvatarPhoto } from "./store.js";

export const AVATARS = ["🎮", "🚀", "🐱", "🐉", "🦊", "🍕", "⚡", "🌟", "🎧", "🏆"];

export function listProfiles() {
  return loadProfiles().profiles;
}

function applyFields(profile, { name, nom, prenom, dateNaissance, avatar }) {
  if (name !== undefined) {
    if (!name.trim()) throw new Error("Le nametag est requis.");
    profile.name = name.trim();
  }
  if (nom !== undefined) profile.nom = nom.trim() || null;
  if (prenom !== undefined) profile.prenom = prenom.trim() || null;
  if (dateNaissance !== undefined) profile.dateNaissance = dateNaissance || null;
  if (avatar !== undefined && AVATARS.includes(avatar)) profile.avatar = avatar;
}

export function createProfile({ name, nom, prenom, dateNaissance, avatar, photo } = {}) {
  if (!name || !name.trim()) {
    throw new Error("Le nametag est requis.");
  }
  const data = loadProfiles();
  const profile = {
    id: data.nextId++,
    name: name.trim(),
    nom: nom?.trim() || null,
    prenom: prenom?.trim() || null,
    dateNaissance: dateNaissance || null,
    avatar: avatar && AVATARS.includes(avatar) ? avatar : AVATARS[data.profiles.length % AVATARS.length],
    photo: null,
    pointsArchives: 0,
  };
  if (photo) {
    profile.photo = saveAvatarPhoto(profile.id, photo);
  }
  data.profiles.push(profile);
  saveProfiles(data);
  return profile;
}

export function archiveProfilePoints(id, points) {
  if (points <= 0) return getProfile(id);
  const data = loadProfiles();
  const profile = data.profiles.find((p) => p.id === id);
  if (!profile) {
    throw new Error(`Profil #${id} introuvable.`);
  }
  profile.pointsArchives = (profile.pointsArchives || 0) + points;
  saveProfiles(data);
  return profile;
}

export function updateProfile(id, { name, nom, prenom, dateNaissance, avatar, photo, removePhoto } = {}) {
  const data = loadProfiles();
  const profile = data.profiles.find((p) => p.id === id);
  if (!profile) {
    throw new Error(`Profil #${id} introuvable.`);
  }
  applyFields(profile, { name, nom, prenom, dateNaissance, avatar });
  if (photo) {
    profile.photo = saveAvatarPhoto(id, photo);
  } else if (removePhoto) {
    deleteAvatarPhoto(id);
    profile.photo = null;
  }
  saveProfiles(data);
  return profile;
}

export function removeProfile(id) {
  const data = loadProfiles();
  const index = data.profiles.findIndex((p) => p.id === id);
  if (index === -1) {
    throw new Error(`Profil #${id} introuvable.`);
  }
  const [removed] = data.profiles.splice(index, 1);
  saveProfiles(data);
  deleteProfileData(id);
  deleteAvatarPhoto(id);
  return removed;
}

export function getProfile(id) {
  const profile = loadProfiles().profiles.find((p) => p.id === id);
  if (!profile) {
    throw new Error(`Profil #${id} introuvable.`);
  }
  return profile;
}
