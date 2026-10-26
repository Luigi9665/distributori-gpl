# Distributori GPL

App mobile (Expo / React Native) per trovare i distributori di GPL in Italia e confrontarne i prezzi.

## Come funziona
1. Il sito MIMIT blocca i server di GitHub, quindi `scripts/aggiorna-e-pubblica.ps1` gira sul PC (attività pianificata di Windows, ogni giorno alle 09:30).
2. Lo script scarica i due CSV open data, tiene solo il GPL, li unisce e scrive `dati/gpl.json`.
3. Se il file è cambiato, lo carica su GitHub. La GitHub Action lo pubblica su GitHub Pages.
4. L'app scarica `https://luigi9665.github.io/distributori-gpl/gpl.json` e ne tiene una copia sul telefono per l'uso offline.

## Struttura
- `scripts/`  generazione di `gpl.json` e aggiornamento automatico
- `dati/`     `gpl.json` pubblicato
- `data/`     CSV scaricati in locale (non va su Git)
- `app/`      app Expo (SDK 58, JavaScript)
- `.github/workflows/`  pubblicazione su GitHub Pages

## Comandi
```
node scripts/genera-gpl.mjs --out dati/gpl.json    genera il JSON a mano
powershell -ExecutionPolicy Bypass -File scripts\crea-attivita-pianificata.ps1   crea l'attività giornaliera (una volta)
cd app; npx expo start                              avvia l'app per Expo Go
```

## Fonte dei dati e licenza
Dati: **MIMIT - Osservaprezzi Carburanti**, open data rilasciati con licenza
[IODL 2.0](https://www.dati.gov.it/iodl/2.0/). Il riuso, anche commerciale, è consentito citando la fonte.
I prezzi sono quelli comunicati dai gestori; possono differire da quelli esposti alla pompa.
