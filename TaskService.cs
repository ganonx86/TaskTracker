namespace TaskTracker;

public sealed class TaskService(DataStore store)
{
    public List<TaskItem> ListTasks(int profileId) => store.LoadTasks(profileId).Tasks;

    public TaskItem AddTask(int profileId, string? title, string? deadline)
    {
        RequireTitle(title);
        var data = store.LoadTasks(profileId);
        var task = new TaskItem { Id = data.NextId++, Title = title!.Trim(), Deadline = ParseDeadline(deadline), CreatedAt = Now() };
        data.Tasks.Add(task);
        store.SaveTasks(profileId, data);
        return task;
    }

    public TaskItem AddSubtask(int profileId, int taskId, string? title, string? deadline)
    {
        RequireTitle(title);
        var data = store.LoadTasks(profileId);
        var task = data.Tasks.SingleOrDefault(item => item.Id == taskId) ?? throw new InvalidOperationException($"Tache #{taskId} introuvable.");
        var subtask = new TaskItem { Id = data.NextId++, Title = title!.Trim(), Deadline = ParseDeadline(deadline), CreatedAt = Now() };
        task.Subtasks.Add(subtask);
        store.SaveTasks(profileId, data);
        return subtask;
    }

    public TaskItem CompleteItem(int profileId, int id, bool done)
    {
        var data = store.LoadTasks(profileId);
        var task = data.Tasks.SingleOrDefault(item => item.Id == id);
        if (task is not null)
        {
            if (done && task.Subtasks.Any(item => !item.Completed)) throw new InvalidOperationException("Impossible de cloturer cette tache : toutes les sous-taches doivent d'abord etre completees.");
            SetCompleted(task, done);
            store.SaveTasks(profileId, data);
            return task;
        }
        var subtask = data.Tasks.SelectMany(item => item.Subtasks).SingleOrDefault(item => item.Id == id) ?? throw new InvalidOperationException($"Element #{id} introuvable.");
        SetCompleted(subtask, done);
        store.SaveTasks(profileId, data);
        return subtask;
    }

    public TaskItem SetDeadline(int profileId, int id, string? deadline)
    {
        var data = store.LoadTasks(profileId);
        var item = FindItem(data, id) ?? throw new InvalidOperationException($"Element #{id} introuvable.");
        item.Deadline = ParseDeadline(deadline);
        store.SaveTasks(profileId, data);
        return item;
    }

    public TaskItem RemoveItem(int profileId, int id)
    {
        var data = store.LoadTasks(profileId);
        var task = data.Tasks.SingleOrDefault(item => item.Id == id);
        if (task is not null) { data.Tasks.Remove(task); store.SaveTasks(profileId, data); return task; }
        foreach (var parent in data.Tasks)
        {
            var subtask = parent.Subtasks.SingleOrDefault(item => item.Id == id);
            if (subtask is not null) { parent.Subtasks.Remove(subtask); store.SaveTasks(profileId, data); return subtask; }
        }
        throw new InvalidOperationException($"Element #{id} introuvable.");
    }

    public static int ComputeTaskPoints(TaskItem task) => task.Subtasks.Count == 0 ? (task.Completed ? 50 : 0) : Math.Min(task.Subtasks.Count(item => item.Completed) * 5, 50);
    public static string? ParseDeadline(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        var value = input.Trim();
        if (!DateOnly.TryParseExact(value, "yyyy-MM-dd", out _)) throw new InvalidOperationException($"Date invalide \"{input}\". Utilisez le format AAAA-MM-JJ.");
        return value;
    }

    private static TaskItem? FindItem(TaskData data, int id) => data.Tasks.SingleOrDefault(item => item.Id == id) ?? data.Tasks.SelectMany(item => item.Subtasks).SingleOrDefault(item => item.Id == id);
    private static void SetCompleted(TaskItem item, bool done) { item.Completed = done; item.CompletedAt = done ? Now() : null; }
    private static void RequireTitle(string? title) { if (string.IsNullOrWhiteSpace(title)) throw new InvalidOperationException("Le titre est requis."); }
    private static string Now() => DateTimeOffset.UtcNow.ToString("O");
}