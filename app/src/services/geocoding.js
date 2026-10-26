import * as Location from "expo-location";

// Servizio di ricerca indirizzi. È l'UNICO file che sa quale servizio si usa (oggi quello del
// telefono, tramite expo-location): per passare a Nominatim, Photon o altro basta cambiare qui.
//
// cercaIndirizzo(testo) -> [{ etichetta, lat, lon }]   (max 5, solo Italia)
// Se il servizio non risponde lancia un Error.

const LAT_MIN = 35.3, LAT_MAX = 47.2, LON_MIN = 6.5, LON_MAX = 18.9;
const MAX_RISULTATI = 5;
const TIMEOUT_MS = 10000;
export const LUNGHEZZA_MAX = 100;

// Toglie caratteri di controllo e spazi doppi, e accorcia il testo.
export function pulisciTesto(testo) {
  return String(testo ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LUNGHEZZA_MAX);
}

function inItalia(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX;
}

function conTimeout(promessa) {
  return Promise.race([
    promessa,
    new Promise((_, rifiuta) => setTimeout(() => rifiuta(new Error("timeout")), TIMEOUT_MS)),
  ]);
}

// "Via Roma 10, Udine" a partire dall'indirizzo restituito dal telefono.
function creaEtichetta(a, testoCercato) {
  if (!a) return testoCercato;
  const via = [a.street, a.streetNumber].filter(Boolean).join(" ") || a.name || "";
  const luogo = a.city || a.subregion || a.region || "";
  const parti = [via, luogo].filter(Boolean);
  return parti.length ? [...new Set(parti)].join(", ") : testoCercato;
}

// Minuscolo e senza accenti, per confrontare i testi.
function normalizza(testo) {
  return String(testo ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const PAROLE_GENERICHE = new Set([
  "via", "viale", "piazza", "piazzale", "corso", "strada", "largo", "vicolo", "contrada",
  "localita", "del", "della", "dello", "dei", "delle", "di", "da", "italia", "italy",
]);

// Il servizio del telefono è "largo di manica": a un testo senza senso risponde con un luogo a caso.
// Per evitarlo tengo un risultato solo se almeno una parola scritta compare nell'indirizzo trovato.
function parolePerControllo(testo) {
  return normalizza(testo)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 3 && !PAROLE_GENERICHE.has(p) && !/^\d+$/.test(p));
}

function indirizzoCoerente(parole, indirizzo, etichetta) {
  if (parole.length === 0) return true; // solo parole generiche: non posso controllare
  const campi = indirizzo
    ? [indirizzo.name, indirizzo.street, indirizzo.city, indirizzo.district, indirizzo.subregion, indirizzo.region]
    : [];
  const testoTrovato = normalizza([...campi, etichetta].filter(Boolean).join(" "));
  return parole.some((p) => testoTrovato.includes(p));
}

export async function cercaIndirizzo(testo) {
  const pulito = pulisciTesto(testo);
  if (pulito.length < 3) return [];
  const parole = parolePerControllo(pulito);

  // Non aggiungo "Italia": il servizio la prende come luogo da cercare e risponde con un punto a caso.
  // Il filtro sui confini italiani si fa sulle coordinate trovate.
  const trovati = await conTimeout(Location.geocodeAsync(pulito));
  const inItalyList = trovati
    .filter((r) => inItalia(r.latitude, r.longitude))
    .slice(0, MAX_RISULTATI);

  // Per ogni punto chiedo il nome leggibile (via, comune). Se fallisce uso il testo scritto.
  const risultati = await Promise.all(
    inItalyList.map(async (r) => {
      let indirizzo = null;
      try {
        [indirizzo] = await conTimeout(
          Location.reverseGeocodeAsync({ latitude: r.latitude, longitude: r.longitude })
        );
      } catch (e) {
        indirizzo = null;
      }
      const etichetta = creaEtichetta(indirizzo, pulito);
      if (!indirizzoCoerente(parole, indirizzo, etichetta)) return null;
      return { etichetta, lat: r.latitude, lon: r.longitude };
    })
  );

  // Toglie i risultati non coerenti e i doppioni con la stessa etichetta
  const visti = new Set();
  return risultati.filter((r) => r && (visti.has(r.etichetta) ? false : visti.add(r.etichetta)));
}
