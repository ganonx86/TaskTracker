import path from "path";
import express from "express";
import {
  addTask,
  addSubtask,
  listTasks,
  completeItem,
  removeItem,
  setDeadline,
  computeTaskPoints,
} from "./tasks.js";
import { listProfiles, createProfile, updateProfile, removeProfile, archiveProfilePoints } from "./profiles.js";
import { listAchievements, listAchievementCatalog, unlockEligibleAchievements } from "./achievements.js";
import { getAvatarsDirectory } from "./store.js";

const PROJECT_DIR = process.pkg
  ? path.resolve(path.dirname(process.pkg.entrypoint), "..")
  : path.resolve(path.dirname(process.argv[1]), "..");

export function createServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));
  app.use(express.static(path.join(PROJECT_DIR, "public")));
  app.use("/avatars", express.static(getAvatarsDirectory()));

  app.get("/api/profiles", (req, res) => {
    res.json(listProfiles());
  });

  app.post("/api/profiles", (req, res) => {
    try {
      const { name, nom, prenom, dateNaissance, avatar, photo } = req.body;
      const profile = createProfile({ name, nom, prenom, dateNaissance, avatar, photo });
      res.status(201).json(profile);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/profiles/:id", (req, res) => {
    try {
      const { name, nom, prenom, dateNaissance, avatar, photo, removePhoto } = req.body;
      const profile = updateProfile(Number(req.params.id), {
        name,
        nom,
        prenom,
        dateNaissance,
        avatar,
        photo,
        removePhoto,
      });
      res.json(profile);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/profiles/:id", (req, res) => {
    try {
      const removed = removeProfile(Number(req.params.id));
      res.json(removed);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/profiles/:profileId/tasks", (req, res) => {
    res.json(listTasks(Number(req.params.profileId)));
  });

  app.post("/api/profiles/:profileId/tasks", (req, res) => {
    try {
      const { title, deadline } = req.body;
      const task = addTask(Number(req.params.profileId), title, deadline || undefined);
      res.status(201).json(task);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/profiles/:profileId/tasks/:taskId/subtasks", (req, res) => {
    try {
      const { title, deadline } = req.body;
      const subtask = addSubtask(
        Number(req.params.profileId),
        Number(req.params.taskId),
        title,
        deadline || undefined
      );
      res.status(201).json(subtask);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/profiles/:profileId/items/:id/complete", (req, res) => {
    try {
      const profileId = Number(req.params.profileId);
      const id = Number(req.params.id);
      const done = !!req.body.completed;
      const taskBefore = listTasks(profileId).find((t) => t.id === id);
      const wasCompleted = taskBefore ? taskBefore.completed : null;

      const item = completeItem(profileId, id, { done });

      let achievements = [];
      if (done && taskBefore && !wasCompleted) {
        achievements = unlockEligibleAchievements(profileId, listTasks(profileId));
      }
      res.json({ ...item, achievement: achievements.at(-1) ?? null, achievements });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/profiles/:profileId/achievements", (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    res.json(listAchievements(Number(req.params.profileId), limit));
  });

  app.get("/api/profiles/:profileId/achievement-catalog", (req, res) => {
    res.json(listAchievementCatalog(Number(req.params.profileId)));
  });

  app.patch("/api/profiles/:profileId/items/:id/deadline", (req, res) => {
    try {
      const item = setDeadline(Number(req.params.profileId), Number(req.params.id), req.body.deadline);
      res.json(item);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete("/api/profiles/:profileId/items/:id", (req, res) => {
    try {
      const profileId = Number(req.params.profileId);
      const removed = removeItem(profileId, Number(req.params.id));
      const pointsArchives = computeTaskPoints(removed);
      if (pointsArchives > 0) archiveProfilePoints(profileId, pointsArchives);
      res.json(removed);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  return app;
}
