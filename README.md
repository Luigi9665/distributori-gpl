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

## Ricerca indirizzi
La ricerca usa **Photon** (`https://photon.komoot.io/api`), un servizio gratuito e senza chiave basato sui dati di OpenStreetMap.
Tutto il codice che lo riguarda sta in `app/src/services/geocoding.js`: per cambiare servizio basta modificare quel file.
- La ricerca parte da sola dopo 3 caratteri e una pausa di circa mezzo secondo; "Cerca" e invio da tastiera cercano subito.
- Fino a 8 risultati, solo in Italia, con precedenza ai luoghi vicini al punto di partenza.
- Photon non supporta la lingua italiana come parametro: senza indicarla i nomi sono quelli locali, quindi in italiano.

**Privacy.** Il testo cercato (e, per dare precedenza ai luoghi vicini, le coordinate del punto di partenza) viene inviato a Photon / OpenStreetMap. Va detto nell'informativa privacy dell'app.

**Limiti.** Il Photon pubblico è adatto alle prove, non a molti utenti (ha limiti d'uso e nessuna garanzia di servizio).
Prima della pubblicazione negli store va sostituito con un servizio intermedio nostro o con un servizio con chiave.

## Fonte dei dati e licenza
Dati: **MIMIT - Osservaprezzi Carburanti**, open data rilasciati con licenza
[IODL 2.0](https://www.dati.gov.it/iodl/2.0/). Il riuso, anche commerciale, è consentito citando la fonte.
I prezzi sono quelli comunicati dai gestori; possono differire da quelli esposti alla pompa.
