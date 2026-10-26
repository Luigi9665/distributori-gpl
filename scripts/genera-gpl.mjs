// Genera gpl.json a partire dai due CSV open data MIMIT (Osservaprezzi Carburanti).
//
// Uso:
//   node scripts/genera-gpl.mjs                      scarica i CSV e scrive data/gpl.json
//   node scripts/genera-gpl.mjs --locale             usa i CSV già presenti in data/ (niente download)
//   node scripts/genera-gpl.mjs --out docs/gpl.json  scrive il risultato in un altro percorso

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE_URL = "https://www.mimit.gov.it/images/exportCSV";
const FILE_IMPIANTI = "anagrafica_impianti_attivi.csv";
const FILE_PREZZI = "prezzo_alle_8.csv";

const cartellaProgetto = join(dirname(fileURLToPath(import.meta.url)), "..");
const cartellaDati = join(cartellaProgetto, "data");

const args = process.argv.slice(2);
const usaLocale = args.includes("--locale");
const iOut = args.indexOf("--out");
const fileOut = iOut >= 0 ? args[iOut + 1] : join(cartellaDati, "gpl.json");

const GIORNI_MAX = 30;

// Limiti approssimativi dell'Italia: fuori da qui le coordinate sono sbagliate.
const LAT_MIN = 35.3, LAT_MAX = 47.2, LON_MIN = 6.5, LON_MAX = 18.9;

// Scarica con qualche tentativo e mostra la causa vera dell'errore di rete.
async function scarica(url, nomeFile) {
  const TENTATIVI = 3;
  let ultimoErrore;
  for (let i = 1; i <= TENTATIVI; i++) {
    try {
      const risposta = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
          Accept: "text/csv,text/plain,*/*",
          "Accept-Language": "it-IT,it;q=0.9",
        },
        signal: AbortSignal.timeout(60000),
      });
      if (!risposta.ok) {
        throw new Error(`HTTP ${risposta.status}`);
      }
      return await risposta.text();
    } catch (e) {
      const causa = e.cause ? ` (${e.cause.code || e.cause.message})` : "";
      ultimoErrore = new Error(`Download di ${nomeFile} fallito: ${e.message}${causa}`);
      console.log(`Tentativo ${i}/${TENTATIVI} fallito: ${ultimoErrore.message}`);
      if (i < TENTATIVI) await new Promise((r) => setTimeout(r, 5000 * i));
    }
  }
  throw ultimoErrore;
}

async function leggiCsv(nomeFile) {
  if (usaLocale) {
    return readFile(join(cartellaDati, nomeFile), "utf8");
  }
  const testo = await scarica(`${BASE_URL}/${nomeFile}`, nomeFile);
  await mkdir(cartellaDati, { recursive: true });
  await writeFile(join(cartellaDati, nomeFile), testo, "utf8");
  return testo;
}

// Prima riga "Estrazione del AAAA-MM-GG", seconda riga intestazione, poi i dati.
function analizzaCsv(testo, nomeFile) {
  const righe = testo.replace(/^﻿/, "").split(/\r?\n/).filter((r) => r.trim() !== "");
  const match = righe[0].match(/(\d{4}-\d{2}-\d{2})/);
  const estrazione = match ? match[1] : null;
  const colonne = righe[1].split("|").map((c) => c.trim());
  const dati = [];
  let scartate = 0;
  for (const riga of righe.slice(2)) {
    let campi = riga.split("|");
    // Alcuni nomi contengono un "|" in più: unisco i pezzi in eccesso nel nome impianto.
    const iNome = colonne.indexOf("Nome Impianto");
    if (campi.length > colonne.length && iNome >= 0) {
      const extra = campi.length - colonne.length;
      campi = [
        ...campi.slice(0, iNome),
        campi.slice(iNome, iNome + extra + 1).join("|"),
        ...campi.slice(iNome + extra + 1),
      ];
    }
    if (campi.length !== colonne.length) {
      scartate++;
      continue;
    }
    const oggetto = {};
    colonne.forEach((nome, i) => (oggetto[nome] = campi[i].trim()));
    dati.push(oggetto);
  }
  console.log(`${nomeFile}: ${dati.length} righe lette, ${scartate} scartate (colonne non valide)`);
  return { estrazione, colonne, dati };
}

function verificaColonne(colonne, attese, nomeFile) {
  const mancanti = attese.filter((c) => !colonne.includes(c));
  if (mancanti.length > 0) {
    throw new Error(`${nomeFile}: mancano le colonne ${mancanti.join(", ")}. Il formato MIMIT è cambiato?`);
  }
}

function numero(valore) {
  const n = Number(String(valore).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

// "23/10/2026 07:45:12" -> { testo: "23/10/2026 07:45", ordine: 20261023074512 }
function analizzaData(valore) {
  const m = String(valore).match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return { testo: "", ordine: 0 };
  const [, g, me, a, h, mi, s = "00"] = m;
  return { testo: `${g}/${me}/${a} ${h}:${mi}`, ordine: Number(`${a}${me}${g}${h}${mi}${s}`) };
}

function coordinateValide(lat, lon) {
  return (
    lat !== null && lon !== null &&
    lat >= LAT_MIN && lat <= LAT_MAX &&
    lon >= LON_MIN && lon <= LON_MAX
  );
}

async function main() {
  console.log(usaLocale ? "Uso i CSV locali in data/" : "Scarico i CSV dal sito MIMIT...");
  const [testoImpianti, testoPrezzi] = await Promise.all([
    leggiCsv(FILE_IMPIANTI),
    leggiCsv(FILE_PREZZI),
  ]);

  const impianti = analizzaCsv(testoImpianti, FILE_IMPIANTI);
  const prezzi = analizzaCsv(testoPrezzi, FILE_PREZZI);

  verificaColonne(
    impianti.colonne,
    ["idImpianto", "Gestore", "Bandiera", "Nome Impianto", "Indirizzo", "Comune", "Provincia", "Latitudine", "Longitudine"],
    FILE_IMPIANTI
  );
  verificaColonne(prezzi.colonne, ["idImpianto", "descCarburante", "prezzo", "isSelf", "dtComu"], FILE_PREZZI);

  // 1) Tieni solo il GPL. Se un impianto ha più righe GPL, vince la più recente.
  const gplPerImpianto = new Map();
  let prezziNonValidi = 0;
  let prezziVecchi = 0;
  // Prezzi comunicati più di GIORNI_MAX giorni prima dell'estrazione sono considerati vecchi.
  const dataEstrazione = new Date(prezzi.estrazione + "T00:00:00Z");
  const dLimite = new Date(dataEstrazione.getTime() - GIORNI_MAX * 86400000);
  const limiteVecchi = Number(dLimite.toISOString().slice(0, 10).replaceAll("-", "") + "000000");
  for (const p of prezzi.dati) {
    if (p.descCarburante.toUpperCase() !== "GPL") continue;
    const prezzo = numero(p.prezzo);
    if (prezzo === null || prezzo < 0.3 || prezzo > 3) {
      prezziNonValidi++;
      continue;
    }
    const data = analizzaData(p.dtComu);
    if (data.ordine < limiteVecchi) {
      prezziVecchi++;
      continue;
    }
    const attuale = gplPerImpianto.get(p.idImpianto);
    if (!attuale || data.ordine > attuale.ordine) {
      gplPerImpianto.set(p.idImpianto, { prezzo, self: p.isSelf === "1", ...data });
    }
  }

  // 2) Unisci con l'anagrafica tramite idImpianto, scarta chi non ha coordinate valide.
  const distributori = [];
  let senzaCoordinate = 0;
  for (const imp of impianti.dati) {
    const gpl = gplPerImpianto.get(imp.idImpianto);
    if (!gpl) continue;
    const lat = numero(imp.Latitudine);
    const lon = numero(imp.Longitudine);
    if (!coordinateValide(lat, lon)) {
      senzaCoordinate++;
      continue;
    }
    distributori.push({
      id: Number(imp.idImpianto),
      nome: imp["Nome Impianto"],
      marchio: imp.Bandiera,
      indirizzo: imp.Indirizzo,
      comune: imp.Comune,
      provincia: imp.Provincia,
      lat,
      lon,
      prezzoGpl: gpl.prezzo,
      self: gpl.self,
      dataPrezzo: gpl.testo,
    });
  }

  if (distributori.length < 1000) {
    throw new Error(`Solo ${distributori.length} distributori: dati sospetti, non scrivo il file.`);
  }

  distributori.sort((a, b) => a.id - b.id);

  const risultato = {
    aggiornato: prezzi.estrazione,
    fonte: "MIMIT - Osservaprezzi Carburanti",
    distributori,
  };

  await mkdir(dirname(fileOut), { recursive: true });
  await writeFile(fileOut, JSON.stringify(risultato), "utf8");

  console.log("---");
  console.log(`Righe GPL nei prezzi:       ${gplPerImpianto.size}`);
  console.log(`Prezzi non validi scartati: ${prezziNonValidi}`);
  console.log(`Prezzi vecchi (> ${GIORNI_MAX} gg):   ${prezziVecchi}`);
  console.log(`Senza coordinate valide:    ${senzaCoordinate}`);
  console.log(`Distributori nel JSON:      ${distributori.length}`);
  console.log(`File scritto: ${fileOut}`);
}

main().catch((errore) => {
  console.error("ERRORE:", errore.message);
  process.exit(1);
});
