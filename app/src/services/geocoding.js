// Servizio di ricerca indirizzi. È l'UNICO file che sa quale servizio si usa (oggi Photon, basato su
// OpenStreetMap, senza chiave): per cambiare servizio basta cambiare qui.
//
// cercaIndirizzo(testo, { origine, signal }) -> [{ etichetta, lat, lon }]   (max 8, solo Italia)
//   origine: { lat, lon } facoltativa, i luoghi vicini a questo punto hanno la precedenza
//   signal:  AbortSignal facoltativo, per annullare la richiesta (lancia un errore con name "AbortError")
// Se il servizio non risponde, o risponde in modo non valido, lancia un Error.
//
// Nota: Photon accetta solo le lingue default/en/de/fr, e "it" farebbe rispondere con un errore.
// Senza il parametro `lang` i nomi sono quelli locali, quindi in italiano per i luoghi italiani.

const URL_PHOTON = "https://photon.komoot.io/api/";
const LAT_MIN = 35.3, LAT_MAX = 47.2, LON_MIN = 6.5, LON_MAX = 18.9;
const MAX_RISULTATI = 8;
const TIMEOUT_MS = 10000;
const MAX_CARATTERI_RISPOSTA = 300000;
export const LUNGHEZZA_MAX = 100;
export const LUNGHEZZA_MIN = 3;

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

function erroreAnnullato() {
  const e = new Error("annullata");
  e.name = "AbortError";
  return e;
}

// Scarica e legge il JSON, con timeout e possibilità di annullare dall'esterno.
async function scaricaJson(url, signalEsterno) {
  const controllo = new AbortController();
  let scaduto = false;
  const annulla = () => controllo.abort();
  const timer = setTimeout(() => {
    scaduto = true;
    controllo.abort();
  }, TIMEOUT_MS);
  if (signalEsterno) {
    if (signalEsterno.aborted) annulla();
    else signalEsterno.addEventListener("abort", annulla);
  }
  try {
    const risposta = await fetch(url, { signal: controllo.signal, headers: { Accept: "application/json" } });
    if (!risposta.ok) throw new Error(`servizio non disponibile (${risposta.status})`);
    const corpo = await risposta.text();
    if (corpo.length > MAX_CARATTERI_RISPOSTA) throw new Error("risposta troppo grande");
    return JSON.parse(corpo);
  } catch (e) {
    if (signalEsterno?.aborted) throw erroreAnnullato();
    if (scaduto) throw new Error("timeout");
    throw e;
  } finally {
    clearTimeout(timer);
    signalEsterno?.removeEventListener("abort", annulla);
  }
}

// Testo preso dal servizio: solo stringhe, ripulite e corte.
function campo(valore) {
  return typeof valore === "string" ? pulisciTesto(valore) : "";
}

// "Via Roma 10, Udine, Udine" -> senza doppioni (confronto senza maiuscole)
function creaEtichetta(p) {
  const via = [campo(p.street), campo(p.housenumber)].filter(Boolean).join(" ");
  let nome = campo(p.name);
  if (via && nome && via.toLowerCase().includes(nome.toLowerCase())) nome = "";
  const comune = campo(p.city) || campo(p.locality) || campo(p.district);
  const provincia = campo(p.county).replace(/^(Provincia|Citt[àa] metropolitana|Libero consorzio comunale) (di |del |della )?/i, "");
  const visti = new Set();
  return [nome, via, comune, provincia]
    .filter((parte) => {
      const chiave = parte.toLowerCase();
      if (!parte || visti.has(chiave)) return false;
      visti.add(chiave);
      return true;
    })
    .join(", ");
}

// Una voce del servizio -> { etichetta, lat, lon }, oppure null se non è valida o non è in Italia.
function leggiRisultato(f) {
  const g = f?.geometry;
  const p = f?.properties;
  if (!g || g.type !== "Point" || !Array.isArray(g.coordinates) || !p || typeof p !== "object") return null;
  const [lon, lat] = g.coordinates;
  if (typeof lon !== "number" || typeof lat !== "number" || !inItalia(lat, lon)) return null;
  if (p.countrycode && p.countrycode !== "IT") return null;
  const etichetta = creaEtichetta(p);
  return etichetta ? { etichetta, lat, lon } : null;
}

export async function cercaIndirizzo(testo, { origine, signal } = {}) {
  const pulito = pulisciTesto(testo);
  if (pulito.length < LUNGHEZZA_MIN) return [];

  let url =
    `${URL_PHOTON}?q=${encodeURIComponent(pulito)}&limit=${MAX_RISULTATI}` +
    `&bbox=${LON_MIN},${LAT_MIN},${LON_MAX},${LAT_MAX}`;
  if (origine && inItalia(origine.lat, origine.lon)) {
    url += `&lat=${origine.lat.toFixed(4)}&lon=${origine.lon.toFixed(4)}`;
  }

  const json = await scaricaJson(url, signal);
  if (!json || typeof json !== "object" || !Array.isArray(json.features)) {
    throw new Error("risposta non valida");
  }

  const visti = new Set();
  const risultati = [];
  for (const f of json.features) {
    const r = leggiRisultato(f);
    if (!r || visti.has(r.etichetta.toLowerCase())) continue;
    visti.add(r.etichetta.toLowerCase());
    risultati.push(r);
    if (risultati.length >= MAX_RISULTATI) break;
  }
  return risultati;
}
