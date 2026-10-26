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

export async function cercaIndirizzo(testo) {
  const pulito = pulisciTesto(testo);
  if (pulito.length < 3) return [];
  const query = /italia|italy/i.test(pulito) ? pulito : `${pulito}, Italia`;

  const trovati = await conTimeout(Location.geocodeAsync(query));
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
      return { etichetta: creaEtichetta(indirizzo, pulito), lat: r.latitude, lon: r.longitude };
    })
  );

  // Toglie i doppioni con la stessa etichetta
  const visti = new Set();
  return risultati.filter((r) => (visti.has(r.etichetta) ? false : visti.add(r.etichetta)));
}
