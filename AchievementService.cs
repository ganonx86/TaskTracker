namespace TaskTracker;

public sealed class AchievementService(DataStore store)
{
    private static readonly AchievementDefinition[] Definitions =
    [
        new("first-quest", "Bienvenue, Aventurier", "Terminer sa première quête", "count", 1), new("five-quests", "Et c'est parti !", "Terminer 5 quêtes", "count", 5), new("hard-quest", "Petit mais vaillant", "Terminer une quête marquée comme difficile"), new("before-deadline", "Une bonne chose de faite", "Terminer une quête avant sa date limite", "beforeDeadline"), new("level-two", "Premier niveau", "Atteindre le niveau 2"), new("ten-quests", "La machine est lancée", "Terminer 10 quêtes", "count", 10), new("twenty-five-quests", "Ça devient sérieux", "Terminer 25 quêtes", "count", 25), new("hundred-quests", "Héros du quotidien", "Terminer 100 quêtes", "count", 100),
        new("three-day-streak", "Sur une lancée", "3 jours consécutifs avec au moins une quête terminée", "streak", 3), new("seven-day-streak", "Je ne m'arrête plus", "7 jours consécutifs", "streak", 7), new("perfect-week", "Une semaine parfaite", "Terminer toutes les quêtes prévues pendant 7 jours"), new("fourteen-day-streak", "Deux semaines, tranquille", "14 jours consécutifs", "streak", 14), new("thirty-day-streak", "Inarrêtable", "30 jours consécutifs", "streak", 30), new("hundred-day-streak", "Machine de guerre", "100 jours consécutifs", "streak", 100), new("year-streak", "La légende raconte...", "365 jours consécutifs", "streak", 365), new("hundred-active-days", "Aujourd'hui aussi", "Accomplir au moins une quête pendant 100 jours", "streak", 100),
        new("long-postponed", "J'aurais pu remettre à demain", "Terminer une tâche que tu repoussais depuis longtemps"), new("very-hard-quest", "Le boss est tombé", "Terminer une quête très difficile"), new("hated-task", "Pas aujourd'hui, Satan", "Terminer une tâche que tu détestes"), new("three-hard-daily", "Mission suicide", "Terminer 3 quêtes difficiles dans la même journée"), new("five-hard-daily", "Mode Hardcore", "Terminer 5 quêtes difficiles en une journée"), new("no-reminder", "Sans les mains", "Terminer une quête sans utiliser de rappel"), new("waiting-seven-days", "C'était pas si terrible", "Terminer une quête restée en attente pendant 7 jours", "waiting", 7), new("waiting-thirty-days", "Enfin débarrassé", "Terminer une quête restée en attente pendant 30 jours", "waiting", 30),
        new("laundry", "Le linge ne se plie pas tout seul", "Faire une lessive"), new("tidy-room", "Maître du rangement", "Ranger entièrement une pièce"), new("dirty-room", "Que la lumière soit", "Nettoyer une pièce particulièrement sale"), new("clean-home", "Le royaume est propre", "Nettoyer toute la maison"), new("home-cooked-meal", "Chef de guilde", "Preparer un repas maison"), new("five-home-cooked-meals", "Gordon Ramsay peut trembler", "Cuisiner 5 repas maison"), new("groceries", "Le frigo respire", "Faire les courses"), new("clean-and-groceries", "Épée et plumeau", "Faire le ménage et les courses le même jour"), new("lost-item", "Je l'avais pourtant rangé ici...", "Retrouver quelque chose perdu depuis longtemps"), new("spring-cleaning", "Adieu, poussière", "Faire un grand ménage"),
        new("accounts", "L'argent ne pousse toujours pas sur les arbres", "Faire ses comptes"), new("budget-update", "Comptable du dimanche", "Mettre son budget à jour"), new("budget-month", "Pas aujourd'hui, découvert", "Respecter son budget pendant un mois"), new("first-savings", "Le trésor grandit", "Épargner une première somme"), new("savings-goal", "Petit pactole", "Atteindre un objectif d'épargne"), new("admin-five", "Paperasse Slayer", "Terminer 5 tâches administratives"), new("mailbox", "Le courrier ne fait plus peur", "Vider sa boîte aux lettres"), new("old-admin", "Dossier classé", "Terminer une tâche administrative vieille de plus de 30 jours"),
        new("habit-three-days", "Un peu mieux qu'hier", "Compléter une habitude pendant 3 jours"), new("reading", "Ça travaille là-haut", "Lire pendant 30 minutes"), new("learn-new", "Connaissance +1", "Apprendre quelque chose de nouveau"), new("no-motivation", "Pas besoin de motivation", "Accomplir une tâche malgré l'absence de motivation"), new("habit-thirty-days", "Discipline > motivation", "Maintenir une habitude pendant 30 jours"), new("learning-goal", "Nouvelle compétence débloquée", "Terminer un objectif d'apprentissage"), new("impossible", "Je peux le faire", "Réussir quelque chose qui semblait impossible"),
        new("at-2359", "???", "Terminer une quête à 23h59", "at2359", null, true), new("last-second", "Dernière seconde", "Terminer une quête moins d'une minute avant l'échéance", null, null, true), new("postpone-ten", "On verra demain", "Reporter une quête 10 fois", null, null, true), new("twenty-overdue", "Le procrastinateur", "Avoir 20 quêtes en retard", null, null, true), new("recreate", "J'ai changé d'avis", "Annuler une quête puis la recréer", null, null, true), new("after-midnight", "Qui a besoin de sommeil ?", "Terminer une quête après minuit", "afterMidnight", null, true), new("speedrun", "Speedrun", "Terminer une quête moins de 30 secondes après sa création", "speedrun", null, true), new("overkill", "Overkill", "Terminer une quête extrêmement facile avec une difficulté maximale", null, null, true), new("why", "Mais pourquoi ?", "Créer une quête puis la supprimer immédiatement", null, null, true), new("unplanned", "C'était pas prévu", "Terminer une quête qui n'était pas planifiée", null, null, true)
    ];

    public IEnumerable<Achievement> List(int profileId, int? limit) => store.LoadAchievements(profileId).Achievements.OrderByDescending(item => item.CompletedAt).Take(limit ?? int.MaxValue);

    public IEnumerable<object> Catalog(int profileId)
    {
        var data = SynchronizeStatuses(profileId);
        return Definitions.Select(definition =>
        {
            var status = data.Statuses[definition.Id];
            return new { definition.Id, definition.Title, definition.Description, definition.Rule, definition.Threshold, definition.Hidden, definition.Points, Unlocked = status.State == "unlocked", status.CompletedAt };
        });
    }

    public List<Achievement> UnlockEligible(int profileId, List<TaskItem> tasks)
    {
        var completed = tasks.Where(item => item.Completed && item.CompletedAt is not null).OrderBy(item => item.CompletedAt, StringComparer.Ordinal).ToList();
        var data = SynchronizeStatuses(profileId);
        var unlockedIds = data.Achievements.Select(item => item.DefinitionId).ToHashSet();
        var unlocked = new List<Achievement>();
        foreach (var definition in Definitions)
        {
            if (unlockedIds.Contains(definition.Id) || !MeetsCondition(definition, completed)) continue;
            var achievement = new Achievement { Id = data.NextId++, DefinitionId = definition.Id, TaskId = completed[^1].Id, Title = definition.Title, Description = definition.Description, Points = definition.Points, CompletedAt = Now() };
            data.Achievements.Add(achievement);
            data.Statuses[definition.Id] = new AchievementStatus { State = "unlocked", CompletedAt = achievement.CompletedAt };
            unlocked.Add(achievement);
        }
        if (unlocked.Count > 0) store.SaveAchievements(profileId, data);
        return unlocked;
    }

    private AchievementData SynchronizeStatuses(int profileId)
    {
        var data = store.LoadAchievements(profileId);
        var changed = false;
        foreach (var definition in Definitions)
        {
            var achievement = data.Achievements.FirstOrDefault(item => item.DefinitionId == definition.Id);
            var expected = new AchievementStatus { State = achievement is null ? "locked" : "unlocked", CompletedAt = achievement?.CompletedAt };
            if (!data.Statuses.TryGetValue(definition.Id, out var status) || status.State != expected.State || status.CompletedAt != expected.CompletedAt) { data.Statuses[definition.Id] = expected; changed = true; }
        }
        if (changed) store.SaveAchievements(profileId, data);
        return data;
    }

    private static bool MeetsCondition(AchievementDefinition definition, List<TaskItem> tasks)
    {
        if (definition.Rule is null || tasks.Count == 0) return false;
        var latest = tasks[^1];
        return definition.Rule switch
        {
            "count" => tasks.Count >= definition.Threshold,
            "streak" => LongestStreak(tasks) >= definition.Threshold,
            "beforeDeadline" => tasks.Any(task => task.Deadline is not null && DateTimeOffset.Parse(task.CompletedAt!) <= DateTimeOffset.Parse($"{task.Deadline}T23:59:59.999+00:00")),
            "waiting" => tasks.Any(task => DateTimeOffset.Parse(task.CompletedAt!) - DateTimeOffset.Parse(task.CreatedAt) >= TimeSpan.FromDays(definition.Threshold!.Value)),
            "at2359" => DateTimeOffset.Parse(latest.CompletedAt!).ToLocalTime() is { Hour: 23, Minute: 59 },
            "afterMidnight" => DateTimeOffset.Parse(latest.CompletedAt!).ToLocalTime().Hour < 5,
            "speedrun" => DateTimeOffset.Parse(latest.CompletedAt!) - DateTimeOffset.Parse(latest.CreatedAt) < TimeSpan.FromSeconds(30),
            _ => false
        };
    }

    private static int LongestStreak(List<TaskItem> tasks)
    {
        var dates = tasks.Select(task => DateOnly.FromDateTime(DateTimeOffset.Parse(task.CompletedAt!).LocalDateTime)).Distinct().Order().ToList();
        var longest = 0;
        var current = 0;
        DateOnly? previous = null;
        foreach (var date in dates) { current = previous is not null && date.DayNumber - previous.Value.DayNumber == 1 ? current + 1 : 1; longest = Math.Max(longest, current); previous = date; }
        return longest;
    }

    private static string Now() => DateTimeOffset.UtcNow.ToString("O");
}