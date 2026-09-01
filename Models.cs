namespace TaskTracker;

public sealed class ProfileData
{
    public List<Profile> Profiles { get; set; } = [];
    public int NextId { get; set; } = 1;
}

public sealed class Profile
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Nom { get; set; }
    public string? Prenom { get; set; }
    public string? DateNaissance { get; set; }
    public string Avatar { get; set; } = "🎮";
    public string? Photo { get; set; }
    public int PointsArchives { get; set; }
}

public sealed class TaskData
{
    public List<TaskItem> Tasks { get; set; } = [];
    public int NextId { get; set; } = 1;
}

public sealed class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Deadline { get; set; }
    public bool Completed { get; set; }
    public string CreatedAt { get; set; } = "";
    public string? CompletedAt { get; set; }
    public List<TaskItem> Subtasks { get; set; } = [];
}

public sealed class AchievementData
{
    public List<Achievement> Achievements { get; set; } = [];
    public int NextId { get; set; } = 1;
    public Dictionary<string, AchievementStatus> Statuses { get; set; } = [];
}

public sealed class Achievement
{
    public int Id { get; set; }
    public string DefinitionId { get; set; } = "";
    public int TaskId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string CompletedAt { get; set; } = "";
}

public sealed class AchievementStatus
{
    public string State { get; set; } = "locked";
    public string? CompletedAt { get; set; }
}

public sealed record ProfileRequest(string? Name, string? Nom, string? Prenom, string? DateNaissance, string? Avatar, string? Photo, bool RemovePhoto = false);
public sealed record TaskRequest(string? Title, string? Deadline);
public sealed record CompletionRequest(bool Completed);
public sealed record DeadlineRequest(string? Deadline);

public sealed record AchievementDefinition(string Id, string Title, string Description, string? Rule = null, int? Threshold = null, bool Hidden = false);