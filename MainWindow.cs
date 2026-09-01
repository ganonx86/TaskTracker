#if WINDOWS
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
            var webViewReadyTask = browser.EnsureCoreWebView2Async();
            await Task.WhenAll(webViewReadyTask, hostStartTask);
            browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            browser.Source = new Uri(server.Urls.Single());
        }
        catch (Exception exception)
        {
            MessageBox.Show($"Impossible de demarrer l'interface TaskTracker.\n\n{exception.Message}", "TaskTracker", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Close();
        }
    }

    protected override async void OnFormClosed(FormClosedEventArgs eventArgs)
    {
        await server.StopAsync();
        base.OnFormClosed(eventArgs);
    }
}
#endif