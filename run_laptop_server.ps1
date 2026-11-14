param(
    [string]$Port = "8080",
    [string]$PullInterval = "5m",
    [string]$SyncSecret = ""
)

$ErrorActionPreference = "Stop"
$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoDir

$env:PORT = $Port
$env:BZP_STATIC_DIR = $RepoDir
$env:BZP_AUTO_PULL = "true"
$env:BZP_PULL_INTERVAL = $PullInterval
if ($SyncSecret -ne "") {
    $env:BZP_SYNC_SECRET = $SyncSecret
}

Write-Host "=====================================================" -ForegroundColor Red
Write-Host " BOZHEMAN ≡ PROTOCOL — LAPTOP NODE SERVER (Go + GitHub Sync)" -ForegroundColor Red
Write-Host "=====================================================" -ForegroundColor Red
Write-Host "Repo Directory : $RepoDir"
Write-Host "HTTP Port      : http://localhost:$Port"
Write-Host "GitHub AutoPull: ENABLED (every $PullInterval)"
Write-Host ""

$ServerExe = Join-Path $RepoDir "bozheman-server.exe"
if (-not (Test-Path $ServerExe) -or (Get-Command go -ErrorAction SilentlyContinue)) {
    if (Get-Command go -ErrorAction SilentlyContinue) {
        Write-Host "Building Go server binary..." -ForegroundColor Yellow
        go build -o $ServerExe ./cmd/server
    }
}

if (Test-Path $ServerExe) {
    & $ServerExe
} else {
    Write-Host "Error: bozheman-server.exe not found and 'go' is not in PATH." -ForegroundColor Red
    exit 1
}
