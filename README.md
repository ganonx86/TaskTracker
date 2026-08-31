# TaskTracker

CLI simple pour gerer des taches, des sous-taches et leurs deadlines, avec une
interface graphique premium accessible dans le navigateur.

## Installation

```bash
npm install
npm link # optionnel, pour utiliser la commande `tasktracker` globalement
```

## Interface graphique (recommandee)

```bash
node bin/tasktracker.js
# ou, avec un port personnalise:
node bin/tasktracker.js gui --port 3000
```

Ouvrez ensuite l'URL affichee (par defaut http://localhost:3000). La premiere
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
node bin/tasktracker.js profile list
node bin/tasktracker.js profile add "Joueur 2" --avatar 🚀
node bin/tasktracker.js profile edit 2 --prenom Alex --nom Martin --naissance 1998-04-02
node bin/tasktracker.js profile rm 2

# Ajouter une tache (deadline optionnelle, format AAAA-MM-JJ)
node bin/tasktracker.js --profile 1 add "Preparer la presentation" --deadline 2026-09-15

# Ajouter une sous-tache a la tache #1
node bin/tasktracker.js add-sub 1 "Creer les slides" --deadline 2026-09-10

# Lister les taches et sous-taches
node bin/tasktracker.js list

# Definir/modifier une deadline
node bin/tasktracker.js deadline 1 2026-09-20

# Marquer comme terminee / non terminee
node bin/tasktracker.js done 2
node bin/tasktracker.js undone 2

# Supprimer une tache ou sous-tache
node bin/tasktracker.js rm 2
```

Les taches de chaque profil sont sauvegardees dans `data/tasks-<id>.json`, et
la liste des profils dans `data/profiles.json`. Les elements en retard
(deadline depassee et non termines) sont affiches en rouge.