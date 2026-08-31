using Microsoft.Extensions.FileProviders;
using TaskTracker;
#if WINDOWS
using System.Windows.Forms;
#endif

var useDesktopWindow = OperatingSystem.IsWindows() && (args.Length == 0 || args[0] == "gui");
var isGui = useDesktopWindow || args.Length == 0 || args[0] == "web";
var port = 3000;
var builder = WebApplication.CreateBuilder();
if (isGui)
{
	var portIndex = Array.FindIndex(args, argument => argument is "--port" or "-p");
	port = portIndex >= 0 && portIndex + 1 < args.Length && int.TryParse(args[portIndex + 1], out var customPort) ? customPort : 3000;
	builder.WebHost.UseUrls(useDesktopWindow ? "http://127.0.0.1:0" : $"http://localhost:{port}");
}
builder.Services.AddSingleton<DataStore>();
builder.Services.AddSingleton<TaskService>();
builder.Services.AddSingleton<ProfileService>();
builder.Services.AddSingleton<AchievementService>();
var app = builder.Build();
if (!isGui)
{
	Environment.ExitCode = Cli.Run(args, app.Services.GetRequiredService<TaskService>(), app.Services.GetRequiredService<ProfileService>());
	return;
}
var publicDirectory = Path.Combine(app.Environment.ContentRootPath, "public");
if (!Directory.Exists(publicDirectory))
{
	publicDirectory = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "public"));
}
app.UseDefaultFiles(new DefaultFilesOptions { FileProvider = new PhysicalFileProvider(publicDirectory) });
app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(publicDirectory) });
var store = app.Services.GetRequiredService<DataStore>();
Directory.CreateDirectory(store.AvatarsDirectory);
app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(store.AvatarsDirectory), RequestPath = "/avatars" });

app.MapGet("/api/profiles", (ProfileService profiles) => profiles.ListProfiles());
app.MapPost("/api/profiles", (ProfileRequest request, ProfileService profiles) => Execute(() => Results.Created("/api/profiles", profiles.Create(request))));
app.MapPatch("/api/profiles/{id:int}", (int id, ProfileRequest request, ProfileService profiles) => Execute(() => Results.Ok(profiles.Update(id, request))));
app.MapDelete("/api/profiles/{id:int}", (int id, ProfileService profiles) => Execute(() => Results.Ok(profiles.Remove(id))));
app.MapGet("/api/profiles/{profileId:int}/tasks", (int profileId, TaskService tasks) => tasks.ListTasks(profileId));
app.MapPost("/api/profiles/{profileId:int}/tasks", (int profileId, TaskRequest request, TaskService tasks) => Execute(() => Results.Created($"/api/profiles/{profileId}/tasks", tasks.AddTask(profileId, request.Title, request.Deadline))));
app.MapPost("/api/profiles/{profileId:int}/tasks/{taskId:int}/subtasks", (int profileId, int taskId, TaskRequest request, TaskService tasks) => Execute(() => Results.Created($"/api/profiles/{profileId}/tasks/{taskId}/subtasks", tasks.AddSubtask(profileId, taskId, request.Title, request.Deadline))));
app.MapPatch("/api/profiles/{profileId:int}/items/{id:int}/complete", (int profileId, int id, CompletionRequest request, TaskService tasks, AchievementService achievements) => Execute(() => { var item = tasks.CompleteItem(profileId, id, request.Completed); var unlocked = request.Completed ? achievements.UnlockEligible(profileId, tasks.ListTasks(profileId)) : []; return Results.Ok(new { item.Id, item.Title, item.Deadline, item.Completed, item.CreatedAt, item.CompletedAt, item.Subtasks, achievement = unlocked.LastOrDefault(), achievements = unlocked }); }));
app.MapPatch("/api/profiles/{profileId:int}/items/{id:int}/deadline", (int profileId, int id, DeadlineRequest request, TaskService tasks) => Execute(() => Results.Ok(tasks.SetDeadline(profileId, id, request.Deadline))));
app.MapDelete("/api/profiles/{profileId:int}/items/{id:int}", (int profileId, int id, TaskService tasks, ProfileService profiles) => Execute(() => { var item = tasks.RemoveItem(profileId, id); profiles.ArchivePoints(profileId, TaskService.ComputeTaskPoints(item)); return Results.Ok(item); }));
app.MapGet("/api/profiles/{profileId:int}/achievements", (int profileId, int? limit, AchievementService achievements) => achievements.List(profileId, limit));
app.MapGet("/api/profiles/{profileId:int}/achievement-catalog", (int profileId, AchievementService achievements) => achievements.Catalog(profileId));

#if WINDOWS
if (useDesktopWindow)
{
	ApplicationConfiguration.Initialize();
	try
	{
		await app.StartAsync();
		var address = app.Urls.Single();
		Application.Run(new MainWindow(app, new Uri(address)));
	}
	catch (Exception exception)
	{
		MessageBox.Show($"Impossible de demarrer TaskTracker.\n\n{exception.Message}", "TaskTracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
	}
	return;
}
#endif
app.Run();

static IResult Execute(Func<IResult> action)
{
	try { return action(); }
	catch (InvalidOperationException exception) { return Results.BadRequest(new { error = exception.Message }); }
}