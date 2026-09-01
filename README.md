# TaskTracker

Gestionnaire de taches, sous-taches et deadlines ecrit en C# avec ASP.NET Core.
Sous Windows, l'interface s'ouvre dans une fenetre autonome. En developpement les
donnees sont sauvegardees dans le dossier `data` du projet ; pour l'application
Windows publiee (release), elles sont sauvegardees dans
`%AppData%\TaskTracker\data`, un dossier dedie propre a chaque utilisateur, afin
que les profils soient retrouves automatiquement au demarrage, y compris apres
une mise a jour de l'application.


## Installation

```bash
dotnet run
```

Le SDK .NET 10 est requis pour lancer le projet depuis ses sources.

## Application Windows autonome

Generez un dossier autonome qui ne depend ni de Node.js ni du SDK .NET :

```powershell
dotnet publish -c Release -f net10.0-windows -r win-x64 --self-contained true -o dist
```

(Ne pas ajouter `-p:PublishSingleFile=true` : le mode "fichier unique" doit se
reextraire a chaque lancement, ce qui ralentit fortement le demarrage.)

Telechargez l'archive Windows depuis la page des releases GitHub, puis extrayez
integralement son contenu avant de lancer `dist\TaskTracker.exe`. L'application s'ouvre dans sa propre
fenetre, sans lancer le navigateur. Le runtime Microsoft Edge WebView2 doit etre
installe (il est inclus avec Windows 11 et les versions recentes de Windows 10).
`TaskTracker.bat` reste un lanceur pratique pour les sources : il execute le
projet via le SDK .NET.

## Interface graphique

```bash
dotnet run
# ou, avec un port personnalise (fenetre Windows) :
dotnet run -- gui --port 3000
```

Sous Linux, ou pour ouvrir explicitement l'interface dans un navigateur :

```bash
dotnet run -- web --port 3000
```

La premiere
page affichee est toujours l'ecran "Qui joue ?" (comme sur Xbox), qui permet
de choisir ou creer un profil local (nametag, prenom, nom, date de naissance,
photo ou avatar). Chaque profil a ses propres taches. Vous pouvez tout faire
a la souris :

- bouton **+ Nouvelle tache** pour creer une tache (titre + deadline optionnelle)
- bouton **+** sur une tache pour ajouter une sous-tache
- clic sur la case a cocher pour marquer termine / non termine
- clic sur le badge de deadline pour la modifier (rouge = en retard)
- bouton **✕** pour supprimer
- clic sur le profil (en haut a gauche) pour ouvrir un menu : **Modifier le
  profil** ou **Changer de profil** (retour a l'ecran de selection)
- sur l'ecran "Qui joue ?", crayon **✎** sur une tuile pour modifier ce profil
  (photo via "Choisir une photo", ou avatar emoji si aucune photo)

### Score façon Xbox (Gamerscore)

Un badge 🏆 en haut a droite affiche le score total du profil :

- chaque sous-tache terminee rapporte **5 points**
- une tache est plafonnee a **50 points** (donc 10 sous-taches terminees max
  utiles ; une tache sans sous-taches rapporte les 50 points d'un coup une
  fois terminee)
- le badge s'anime et emet un son a chaque gain de points, et un toast avec
  fanfare apparait quand une tache atteint 100 %

## Utilisation en ligne de commande

Toutes les commandes de taches s'appliquent au profil #1 par defaut. Utilisez
l'option globale `--profile <id>` (avant la sous-commande) pour cibler un
autre profil.

```bash
# Gerer les profils
dotnet run -- profile list
dotnet run -- profile add "Joueur 2" --avatar 🚀
dotnet run -- profile edit 2 --prenom Alex --nom Martin --naissance 1998-04-02
dotnet run -- profile rm 2

# Ajouter une tache (deadline optionnelle, format AAAA-MM-JJ)
dotnet run -- --profile 1 add "Preparer la presentation" --deadline 2026-09-15

# Ajouter une sous-tache a la tache #1
dotnet run -- add-sub 1 "Creer les slides" --deadline 2026-09-10

# Lister les taches et sous-taches
dotnet run -- list

# Definir/modifier une deadline
dotnet run -- deadline 1 2026-09-20

# Marquer comme terminee / non terminee
dotnet run -- done 2
dotnet run -- undone 2

# Supprimer une tache ou sous-tache
dotnet run -- rm 2
```

Les taches de chaque profil sont sauvegardees dans `data/tasks-<id>.json`, et
la liste des profils dans `data/profiles.json`. Les elements en retard
(deadline depassee et non termines) sont affiches en rouge.