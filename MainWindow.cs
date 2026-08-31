#if WINDOWS
using Microsoft.Web.WebView2.WinForms;

namespace TaskTracker;

public sealed class MainWindow : Form
{
    private readonly WebApplication server;
    private readonly Uri applicationUri;
    private readonly WebView2 browser = new() { Dock = DockStyle.Fill };

    public MainWindow(WebApplication server, Uri applicationUri)
    {
        this.server = server;
        this.applicationUri = applicationUri;
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
            await browser.EnsureCoreWebView2Async();
            browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            browser.Source = applicationUri;
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