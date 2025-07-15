# Quick Backup Script for QR Code App Critical Files
# Run this in PowerShell from the project root directory

Write-Host "=== QR Code App - Critical Files Backup ===" -ForegroundColor Green
Write-Host ""

# Check if backup directory exists
$backupPath = "C:\Users\hansz\OneDrive\Dokumente\_Web-Development\IONIC\SECURE-BACKUPS\qr-code-app"
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force
    Write-Host "Created 
    backup directory: $backupPath" -ForegroundColor Yellow
}

# Backup critical files
$files = @(
    @{Source = "upload-keystore.jks"; Target = "$backupPath\upload-keystore.jks"; Priority = "CRITICAL"}
    @{Source = "android\keystore.properties"; Target = "$backupPath\keystore.properties"; Priority = "HIGH"}
    @{Source = "android\app\build.gradle"; Target = "$backupPath\build.gradle.backup"; Priority = "MEDIUM"}
)

foreach ($file in $files) {
    if (Test-Path $file.Source) {
        Copy-Item $file.Source $file.Target -Force
        Write-Host "✅ Backed up: $($file.Source) [$($file.Priority)]" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Missing: $($file.Source) [$($file.Priority)]" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Backup completed to: $backupPath" -ForegroundColor Cyan
Write-Host "Don't forget to also backup to cloud storage!" -ForegroundColor Yellow
Write-Host ""

# Show backup contents
Write-Host "=== Backup Contents ===" -ForegroundColor Green
Get-ChildItem $backupPath | Format-Table Name, Length, LastWriteTime

Write-Host "=== Security Reminder ===" -ForegroundColor Yellow
Write-Host "- Backup folder is automatically synced to OneDrive storage"
Write-Host "- Verify passwords are saved in KeePass"
Write-Host "- Test recovery process occasionally"
