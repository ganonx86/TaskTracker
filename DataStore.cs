using System.Text.Json;

namespace TaskTracker;

public sealed class DataStore
{
    private readonly JsonSerializerOptions jsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, WriteIndented = true };
    private readonly string dataDirectory;

    public DataStore(IWebHostEnvironment environment)
    {
        var projectDirectory = environment.IsDevelopment() ? Directory.GetCurrentDirectory() : AppContext.BaseDirectory;
        dataDirectory = OperatingSystem.IsWindows() && !environment.IsDevelopment()
            ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "TaskTracker", "data")
            : Path.Combine(projectDirectory, "data");
        Directory.CreateDirectory(dataDirectory);
        MigrateLegacyData();
    }

    public string AvatarsDirectory => Path.Combine(dataDirectory, "avatars");
    public ProfileData LoadProfiles() => Load(Path.Combine(dataDirectory, "profiles.json"), new ProfileData());
    public void SaveProfiles(ProfileData data) => Save(Path.Combine(dataDirectory, "profiles.json"), data);
    public TaskData LoadTasks(int profileId) => Load(Path.Combine(dataDirectory, $"tasks-{profileId}.json"), new TaskData());
    public void SaveTasks(int profileId, TaskData data) => Save(Path.Combine(dataDirectory, $"tasks-{profileId}.json"), data);
    public AchievementData LoadAchievements(int profileId) => Load(Path.Combine(dataDirectory, $"achievements-{profileId}.json"), new AchievementData());
    public void SaveAchievements(int profileId, AchievementData data) => Save(Path.Combine(dataDirectory, $"achievements-{profileId}.json"), data);

    public void DeleteProfileData(int profileId)
    {
        DeleteFile(Path.Combine(dataDirectory, $"tasks-{profileId}.json"));
        DeleteFile(Path.Combine(dataDirectory, $"achievements-{profileId}.json"));
        DeleteAvatarPhoto(profileId);
    }

    public string SaveAvatarPhoto(int profileId, string dataUrl)
    {
        var prefix = new System.Text.RegularExpressions.Regex("^data:image/(png|jpeg|jpg|gif|webp);base64,", System.Text.RegularExpressions.RegexOptions.IgnoreCase).Match(dataUrl);
        if (!prefix.Success) throw new InvalidOperationException("Format d'image non supporte (png, jpg, gif ou webp attendu).");
        byte[] content;
        try { content = Convert.FromBase64String(dataUrl[(dataUrl.IndexOf(',') + 1)..]); }
        catch (FormatException) { throw new InvalidOperationException("L'image est invalide."); }
        if (content.Length > 3 * 1024 * 1024) throw new InvalidOperationException("L'image est trop volumineuse (3 Mo maximum).");
        Directory.CreateDirectory(AvatarsDirectory);
        DeleteAvatarPhoto(profileId);
        var extension = prefix.Groups[1].Value.ToLowerInvariant() == "jpeg" ? "jpg" : prefix.Groups[1].Value.ToLowerInvariant();
        File.WriteAllBytes(Path.Combine(AvatarsDirectory, $"{profileId}.{extension}"), content);
        return $"/avatars/{profileId}.{extension}";
    }

    public void DeleteAvatarPhoto(int profileId)
    {
        if (!Directory.Exists(AvatarsDirectory)) return;
        foreach (var file in Directory.EnumerateFiles(AvatarsDirectory, $"{profileId}.*")) File.Delete(file);
    }

    private T Load<T>(string path, T fallback)
    {
        if (!File.Exists(path)) Save(path, fallback);
        return JsonSerializer.Deserialize<T>(File.ReadAllText(path), jsonOptions) ?? fallback;
    }

    private void Save<T>(string path, T data) => File.WriteAllText(path, JsonSerializer.Serialize(data, jsonOptions));
    private static void DeleteFile(string path) { if (File.Exists(path)) File.Delete(path); }

    private void MigrateLegacyData()
    {
        var profilesPath = Path.Combine(dataDirectory, "profiles.json");
        var legacyTasksPath = Path.Combine(dataDirectory, "tasks.json");
        if (File.Exists(profilesPath) || !File.Exists(legacyTasksPath)) return;
        Save(profilesPath, new ProfileData { Profiles = [new Profile { Id = 1, Name = "Joueur 1", Avatar = "🎮" }], NextId = 2 });
        File.Move(legacyTasksPath, Path.Combine(dataDirectory, "tasks-1.json"));
    }
}