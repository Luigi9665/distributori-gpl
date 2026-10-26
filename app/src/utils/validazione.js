// I dati arrivano da internet (o da una copia salvata): non ci si fida del contenuto.
// Si controlla la forma, si scartano le righe strane e si accorciano i testi.

const LAT_MIN = 35.3, LAT_MAX = 47.2, LON_MIN = 6.5, LON_MAX = 18.9;
const PREZZO_MIN = 0.3, PREZZO_MAX = 3;

function testo(valore, max = 120) {
  return typeof valore === "string" ? valore.slice(0, max) : "";
}

function numero(valore) {
  return typeof valore === "number" && Number.isFinite(valore) ? valore : null;
}

function pulisciDistributore(d) {
  if (!d || typeof d !== "object") return null;
  const id = numero(d.id);
  const lat = numero(d.lat);
  const lon = numero(d.lon);
  const prezzoGpl = numero(d.prezzoGpl);
  if (id === null || lat === null || lon === null || prezzoGpl === null) return null;
  if (lat < LAT_MIN || lat > LAT_MAX || lon < LON_MIN || lon > LON_MAX) return null;
  if (prezzoGpl < PREZZO_MIN || prezzoGpl > PREZZO_MAX) return null;
  return {
    id,
    nome: testo(d.nome),
    marchio: testo(d.marchio, 60),
    indirizzo: testo(d.indirizzo),
    comune: testo(d.comune, 60),
    provincia: testo(d.provincia, 4),
    lat,
    lon,
    prezzoGpl,
    self: d.self === true,
    dataPrezzo: testo(d.dataPrezzo, 20),
  };
}

// Restituisce i dati puliti, oppure null se il file non ha la forma attesa.
export function validaDati(json) {
  if (!json || typeof json !== "object" || !Array.isArray(json.distributori)) return null;
  const distributori = json.distributori.map(pulisciDistributore).filter(Boolean);
  if (distributori.length === 0) return null;
  return {
    aggiornato: testo(json.aggiornato, 20),
    fonte: testo(json.fonte, 80) || "MIMIT - Osservaprezzi Carburanti",
    distributori,
  };
}
