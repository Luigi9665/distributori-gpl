# Crea (o sostituisce) l'attività di Windows che aggiorna gpl.json ogni giorno alle 09:30.
# Se il PC è spento a quell'ora, parte appena viene riacceso.
# Si lancia una sola volta.

$script = Join-Path $PSScriptRoot "aggiorna-e-pubblica.ps1"
$azione = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$quando = New-ScheduledTaskTrigger -Daily -At 09:30
$opzioni = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15)

Register-ScheduledTask -TaskName "Distributori GPL - aggiorna" -Action $azione `
    -Trigger $quando -Settings $opzioni -Force | Out-Null

Write-Host "Attività creata: ogni giorno alle 09:30."
