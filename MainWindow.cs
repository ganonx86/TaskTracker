#if WINDOWS
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace TaskTracker;

public sealed class MainWindow : Form
{
    private readonly WebApplication server;
    private readonly Task hostStartTask;
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill };

    public MainWindow(WebApplication server, Task hostStartTask)
    {
        this.server = server;
        this.hostStartTask = hostStartTask;
        Text = "TaskTracker";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(900, 620);
        ClientSize = new Size(1180, 760);
        Controls.Add(browser);
        Shown += InitializeBrowser;
    }

    private async void InitializeBrowser(object? sender, EventArgs eventArgs)
    {
        try
        {
            // Run WebView2 environment creation and host startup concurrently instead of sequentially.
            await Task.WhenAll(InitializeWebViewAsync(), hostStartTask);
            browser.Source = new Uri(server.Urls.Single());
        }
        catch (Exception exception)
        {
            MessageBox.Show($"Impossible de demarrer l'interface TaskTracker.\n\n{exception.Message}", "TaskTracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    private async Task InitializeWebViewAsync()
    {
        // Force a writable user data folder: the exe's own folder may be read-only (e.g. Program Files), which silently stalls WebView2 init.
        var userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "TaskTracker", "WebView2");
        var environment = await CoreWebView2Environment.CreateAsync(userDataFolder: userDataFolder);
        await browser.EnsureCoreWebView2Async(environment);
        browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
    }

    protected override async void OnFormClosed(FormClosedEventArgs eventArgs)
    {
        await server.StopAsync();
        base.OnFormClosed(eventArgs);
    }
}
#endif