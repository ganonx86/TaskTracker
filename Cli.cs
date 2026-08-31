namespace TaskTracker;

public static class Cli
{
    public static int Run(string[] arguments, TaskService tasks, ProfileService profiles)
    {
        try
        {
            var values = arguments.ToList();
            var profileId = TakeOption(values, "--profile", "-P") is { } profile ? ParseId(profile) : 1;
            if (values.Count == 0) return Help();
            if (values[0] == "profile") return RunProfile(values[1..], profiles);
            return values[0] switch
            {
                "add" when values.Count >= 2 => PrintTask(tasks.AddTask(profileId, values[1], TakeOption(values, "--deadline", "-d")), "Tache creee"),
                "add-sub" when values.Count >= 3 => PrintTask(tasks.AddSubtask(profileId, ParseId(values[1]), values[2], TakeOption(values, "--deadline", "-d")), "Sous-tache creee"),
                "deadline" when values.Count >= 3 => PrintTask(tasks.SetDeadline(profileId, ParseId(values[1]), values[2]), "Deadline mise a jour"),
                "done" when values.Count >= 2 => PrintTask(tasks.CompleteItem(profileId, ParseId(values[1]), true), "Element termine"),
                "undone" when values.Count >= 2 => PrintTask(tasks.CompleteItem(profileId, ParseId(values[1]), false), "Element marque comme non termine"),
                "rm" when values.Count >= 2 => PrintTask(tasks.RemoveItem(profileId, ParseId(values[1])), "Element supprime"),
                "list" or "ls" => PrintTaskList(tasks.ListTasks(profileId)),
                _ => Help()
            };
        }
        catch (InvalidOperationException exception) { Console.Error.WriteLine(exception.Message); return 1; }
    }

    private static int RunProfile(List<string> values, ProfileService profiles)
    {
        if (values.Count == 0) return Help();
        switch (values[0])
        {
            case "list": case "ls":
                foreach (var profile in profiles.ListProfiles()) Console.WriteLine($"{profile.Avatar} #{profile.Id} {profile.Name}");
                return 0;
            case "add" when values.Count >= 2:
                var created = profiles.Create(new ProfileRequest(values[1], TakeOption(values, "--nom"), TakeOption(values, "--prenom"), TakeOption(values, "--naissance"), TakeOption(values, "--avatar", "-a"), null));
                Console.WriteLine($"Profil {created.Avatar} #{created.Id} \"{created.Name}\" cree.");
                return 0;
            case "edit" when values.Count >= 2:
                var updated = profiles.Update(ParseId(values[1]), new ProfileRequest(TakeOption(values, "--nametag"), TakeOption(values, "--nom"), TakeOption(values, "--prenom"), TakeOption(values, "--naissance"), TakeOption(values, "--avatar", "-a"), null));
                Console.WriteLine($"Profil #{updated.Id} mis a jour.");
                return 0;
            case "rm" when values.Count >= 2:
                var removed = profiles.Remove(ParseId(values[1]));
                Console.WriteLine($"Profil #{removed.Id} supprime.");
                return 0;
            default: return Help();
        }
    }

    private static void ListTasks(IEnumerable<TaskItem> tasks)
    {
        var items = tasks.ToList();
        if (items.Count == 0) { Console.WriteLine("Aucune tache. Utilisez `TaskTracker add <titre>` pour en creer une."); return; }
        foreach (var task in items) { PrintItem(task, 0); foreach (var subtask in task.Subtasks) PrintItem(subtask, 1); }
    }

    private static int PrintTaskList(IEnumerable<TaskItem> tasks) { ListTasks(tasks); return 0; }

    private static void PrintItem(TaskItem item, int depth) => Console.WriteLine($"{new string(' ', depth * 2)}[{(item.Completed ? 'x' : ' ')}] #{item.Id} {item.Title}{(item.Deadline is null ? "" : $" (deadline: {item.Deadline})")}");
    private static int PrintTask(TaskItem task, string message) { Console.WriteLine($"{message} : #{task.Id} \"{task.Title}\"."); return 0; }
    private static int Help() { Console.Error.WriteLine("Commandes : gui, profile, add, add-sub, list, deadline, done, undone, rm"); return 1; }
    private static int ParseId(string value) => int.TryParse(value, out var id) && id > 0 ? id : throw new InvalidOperationException("Identifiant invalide.");
    private static string? TakeOption(List<string> values, params string[] names)
    {
        var index = values.FindIndex(value => names.Contains(value));
        if (index < 0) return null;
        if (index == values.Count - 1) throw new InvalidOperationException($"Valeur manquante pour {values[index]}.");
        var value = values[index + 1];
        values.RemoveRange(index, 2);
        return value;
    }
}