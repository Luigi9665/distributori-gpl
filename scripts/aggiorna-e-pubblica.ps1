# Genera dati\gpl.json dai CSV MIMIT e, se è cambiato, lo carica su GitHub.
# Lo lancia l'Utilità di pianificazione ogni giorno (vedi crea-attivita-pianificata.ps1).

$ErrorActionPreference = "Stop"
$progetto = Split-Path -Parent $PSScriptRoot
Set-Location $progetto
Start-Transcript -Path (Join-Path $progetto "aggiornamento.log") -Force | Out-Null

try {
    node scripts/genera-gpl.mjs --out dati/gpl.json
    if ($LASTEXITCODE -ne 0) { throw "Lo script Node è fallito (codice $LASTEXITCODE)" }

    git add dati/gpl.json
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "gpl.json invariato: niente da caricare."
    } else {
        $oggi = Get-Date -Format "yyyy-MM-dd"
        git commit -m "Aggiorna gpl.json del $oggi"
        if ($LASTEXITCODE -ne 0) { throw "git commit fallito" }
        git pull --rebase origin main
        git push origin main
        if ($LASTEXITCODE -ne 0) { throw "git push fallito" }
        Write-Host "Caricato su GitHub: tra circa un minuto è online."
    }
}
finally {
    Stop-Transcript | Out-Null
}
