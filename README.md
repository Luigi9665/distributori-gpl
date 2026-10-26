# Distributori GPL

App mobile (Expo / React Native) per trovare i distributori di GPL in Italia e confrontarne i prezzi.

Fonte dati: MIMIT - Osservaprezzi Carburanti (licenza IODL 2.0).

## Struttura
- `scripts/`  script Node che scarica i CSV e genera `gpl.json`
- `data/`     file di prova generati in locale (non va su Git)
- `app/`      app Expo (Passo 4)
- `.github/workflows/`  GitHub Action giornaliera (Passo 3)
