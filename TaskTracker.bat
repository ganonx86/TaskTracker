@echo off
setlocal
cd /d "%~dp0"
if exist "TaskTracker.exe" (
	TaskTracker.exe %*
) else (
	dotnet run --project TaskTracker.csproj -- %*
)