#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { spawn } from "child_process";
import {
  addTask,
  addSubtask,
  listTasks,
  completeItem,
  removeItem,
  setDeadline,
} from "../src/tasks.js";
import { isOverdue } from "../src/date.js";
import { createServer } from "../src/server.js";
import { listProfiles, createProfile, updateProfile, removeProfile } from "../src/profiles.js";

const program = new Command();

program
  .name("tasktracker")
  .description("Gestionnaire de taches, sous-taches et deadlines en ligne de commande")
  .option("-P, --profile <id>", "ID du profil a utiliser", "1");

program
  .command("gui")
  .alias("web")
  .description("Lancer l'interface graphique dans le navigateur")
  .option("-p, --port <port>", "Port d'ecoute", "3000")
  .action((options) => launchGui(options.port));

const profileCmd = program.command("profile").description("Gerer les profils locaux");

profileCmd
  .command("list")
  .alias("ls")
  .description("Lister les profils")
  .action(() => {
    const profiles = listProfiles();
    if (profiles.length === 0) {
      console.log(chalk.yellow("Aucun profil. Utilisez `tasktracker profile add <nom>` pour en creer un."));
      return;
    }
    for (const p of profiles) {
      console.log(`${p.avatar} #${p.id} ${p.name}`);
    }
  });

profileCmd
  .command("add <nametag>")
  .description("Creer un profil")
  .option("-a, --avatar <emoji>", "Avatar (emoji)")
  .option("--nom <nom>", "Nom de famille")
  .option("--prenom <prenom>", "Prenom")
  .option("--naissance <date>", "Date de naissance (AAAA-MM-JJ)")
  .action((nametag, options) => {
    try {
      const profile = createProfile({
        name: nametag,
        avatar: options.avatar,
        nom: options.nom,
        prenom: options.prenom,
        dateNaissance: options.naissance,
      });
      console.log(chalk.green(`Profil ${profile.avatar} #${profile.id} "${profile.name}" cree.`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

profileCmd
  .command("edit <id>")
  .description("Modifier un profil existant")
  .option("--nametag <nametag>", "Nametag / pseudo")
  .option("-a, --avatar <emoji>", "Avatar (emoji)")
  .option("--nom <nom>", "Nom de famille")
  .option("--prenom <prenom>", "Prenom")
  .option("--naissance <date>", "Date de naissance (AAAA-MM-JJ)")
  .action((id, options) => {
    try {
      const profile = updateProfile(Number(id), {
        name: options.nametag,
        avatar: options.avatar,
        nom: options.nom,
        prenom: options.prenom,
        dateNaissance: options.naissance,
      });
      console.log(chalk.green(`Profil #${profile.id} mis a jour.`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

profileCmd
  .command("rm <id>")
  .description("Supprimer un profil et ses taches")
  .action((id) => {
    try {
      const removed = removeProfile(Number(id));
      console.log(chalk.green(`Profil "${removed.name}" supprime.`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("add <titre>")
  .description("Ajouter une tache")
  .option("-d, --deadline <date>", "Deadline au format AAAA-MM-JJ")
  .action((titre, options) => {
    try {
      const task = addTask(Number(program.opts().profile), titre, options.deadline);
      console.log(chalk.green(`Tache #${task.id} creee: "${task.title}"`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("add-sub <idTache> <titre>")
  .description("Ajouter une sous-tache a une tache existante")
  .option("-d, --deadline <date>", "Deadline au format AAAA-MM-JJ")
  .action((idTache, titre, options) => {
    try {
      const subtask = addSubtask(Number(program.opts().profile), Number(idTache), titre, options.deadline);
      console.log(chalk.green(`Sous-tache #${subtask.id} creee: "${subtask.title}"`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("deadline <id> <date>")
  .description("Definir/modifier la deadline d'une tache ou sous-tache")
  .action((id, date) => {
    try {
      setDeadline(Number(program.opts().profile), Number(id), date);
      console.log(chalk.green(`Deadline mise a jour pour #${id}: ${date}`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("done <id>")
  .description("Marquer une tache ou sous-tache comme terminee")
  .action((id) => {
    try {
      completeItem(Number(program.opts().profile), Number(id), { done: true });
      console.log(chalk.green(`#${id} marque comme termine.`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("undone <id>")
  .description("Marquer une tache ou sous-tache comme non terminee")
  .action((id) => {
    try {
      completeItem(Number(program.opts().profile), Number(id), { done: false });
      console.log(chalk.green(`#${id} marque comme non termine.`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("rm <id>")
  .description("Supprimer une tache ou sous-tache")
  .action((id) => {
    try {
      const removed = removeItem(Number(program.opts().profile), Number(id));
      console.log(chalk.green(`Supprime: "${removed.title}"`));
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exitCode = 1;
    }
  });

program
  .command("list")
  .alias("ls")
  .description("Afficher toutes les taches et sous-taches")
  .action(() => {
    const tasks = listTasks(Number(program.opts().profile));
    if (tasks.length === 0) {
      console.log(chalk.yellow("Aucune tache. Utilisez `tasktracker add <titre>` pour en creer une."));
      return;
    }
    for (const task of tasks) {
      printItem(task, 0);
      for (const sub of task.subtasks) {
        printItem(sub, 1);
      }
    }
  });

function printItem(item, depth) {
  const indent = "  ".repeat(depth);
  const box = item.completed ? chalk.green("[x]") : chalk.gray("[ ]");
  const overdue = isOverdue(item.deadline, item.completed);
  let deadlineText = "";
  if (item.deadline) {
    deadlineText = overdue
      ? chalk.red(` (deadline: ${item.deadline} - en retard)`)
      : chalk.cyan(` (deadline: ${item.deadline})`);
  }
  console.log(`${indent}${box} #${item.id} ${item.title}${deadlineText}`);
}

function launchGui(port) {
  const app = createServer();
  app.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(chalk.green(`TaskTracker est disponible sur ${url}`));
    console.log(chalk.gray("Appuyez sur Ctrl+C pour arreter le serveur."));
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    }
  });
}

if (process.argv.length <= 2) {
  launchGui(3000);
} else {
  program.parse();
}
