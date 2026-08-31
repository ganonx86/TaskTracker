namespace TaskTracker;

public sealed class ProfileService(DataStore store)
{
    private static readonly string[] Avatars = ["🎮", "🚀", "🐱", "🐉", "🦊", "🍕", "⚡", "🌟", "🎧", "🏆"];
    public List<Profile> ListProfiles() => store.LoadProfiles().Profiles;

    public Profile Create(ProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name)) throw new InvalidOperationException("Le nametag est requis.");
        var data = store.LoadProfiles();
        var profile = new Profile { Id = data.NextId++, Name = request.Name.Trim(), Nom = TrimOrNull(request.Nom), Prenom = TrimOrNull(request.Prenom), DateNaissance = EmptyOrNull(request.DateNaissance), Avatar = IsAvatar(request.Avatar) ? request.Avatar! : Avatars[data.Profiles.Count % Avatars.Length] };
        if (!string.IsNullOrWhiteSpace(request.Photo)) profile.Photo = store.SaveAvatarPhoto(profile.Id, request.Photo);
        data.Profiles.Add(profile);
        store.SaveProfiles(data);
        return profile;
    }

    public Profile Update(int id, ProfileRequest request)
    {
        var data = store.LoadProfiles();
        var profile = Find(data, id);
        if (request.Name is not null) { if (string.IsNullOrWhiteSpace(request.Name)) throw new InvalidOperationException("Le nametag est requis."); profile.Name = request.Name.Trim(); }
        if (request.Nom is not null) profile.Nom = TrimOrNull(request.Nom);
        if (request.Prenom is not null) profile.Prenom = TrimOrNull(request.Prenom);
        if (request.DateNaissance is not null) profile.DateNaissance = EmptyOrNull(request.DateNaissance);
        if (IsAvatar(request.Avatar)) profile.Avatar = request.Avatar!;
        if (!string.IsNullOrWhiteSpace(request.Photo)) profile.Photo = store.SaveAvatarPhoto(id, request.Photo);
        else if (request.RemovePhoto) { store.DeleteAvatarPhoto(id); profile.Photo = null; }
        store.SaveProfiles(data);
        return profile;
    }

    public Profile Remove(int id)
    {
        var data = store.LoadProfiles();
        var profile = Find(data, id);
        data.Profiles.Remove(profile);
        store.SaveProfiles(data);
        store.DeleteProfileData(id);
        return profile;
    }

    public Profile ArchivePoints(int id, int points)
    {
        var data = store.LoadProfiles();
        var profile = Find(data, id);
        if (points > 0) { profile.PointsArchives += points; store.SaveProfiles(data); }
        return profile;
    }

    private static Profile Find(ProfileData data, int id) => data.Profiles.SingleOrDefault(profile => profile.Id == id) ?? throw new InvalidOperationException($"Profil #{id} introuvable.");
    private static bool IsAvatar(string? avatar) => avatar is not null && Avatars.Contains(avatar);
    private static string? TrimOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string? EmptyOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;
}