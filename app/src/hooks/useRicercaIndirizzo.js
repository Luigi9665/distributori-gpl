import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { cercaIndirizzo, LUNGHEZZA_MIN, pulisciTesto } from "../services/geocoding";

const CHIAVE_RECENTI = "gpl-ricerche-v1";
const MAX_RECENTI = 5;
const PAUSA_MS = 500; // attesa dopo l'ultimo carattere scritto, prima di cercare da soli

function validaRecenti(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((r) => r && typeof r.etichetta === "string" && Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .map((r) => ({ etichetta: r.etichetta.slice(0, 120), lat: r.lat, lon: r.lon }))
    .slice(0, MAX_RECENTI);
}

// Gestisce testo scritto, ricerca progressiva, risultati, errori e ricerche recenti.
// stato: fermo | cerca | risultati | vuoto | errore
// origine (facoltativa): { lat, lon }, i luoghi vicini a questo punto hanno la precedenza.
export default function useRicercaIndirizzo(origine) {
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState("fermo");
  const [risultati, setRisultati] = useState([]);
  const [recenti, setRecenti] = useState([]);

  const timer = useRef(null);
  const richiesta = useRef(null); // AbortController della ricerca in corso
  const numero = useRef(0); // numero dell'ultima ricerca avviata: le risposte vecchie si scartano
  const origineRef = useRef(origine);
  origineRef.current = origine;

  useEffect(() => {
    AsyncStorage.getItem(CHIAVE_RECENTI)
      .then((v) => setRecenti(validaRecenti(JSON.parse(v))))
      .catch(() => {});
  }, []);

  // Ferma l'attesa e annulla la richiesta in corso
  const annulla = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = null;
    richiesta.current?.abort();
    richiesta.current = null;
    numero.current += 1;
  }, []);

  const avvia = useCallback(
    async (daCercare) => {
      annulla();
      const mio = numero.current;
      const controllo = new AbortController();
      richiesta.current = controllo;
      setStato("cerca");
      try {
        const trovati = await cercaIndirizzo(daCercare, { origine: origineRef.current, signal: controllo.signal });
        if (mio !== numero.current) return;
        setRisultati(trovati);
        setStato(trovati.length ? "risultati" : "vuoto");
      } catch (e) {
        if (mio !== numero.current || e?.name === "AbortError") return;
        setRisultati([]);
        setStato("errore");
      }
    },
    [annulla]
  );

  // Ricerca progressiva: parte da sola dopo 3 caratteri e una pausa nella digitazione
  useEffect(() => {
    const pulito = pulisciTesto(testo);
    if (pulito.length < LUNGHEZZA_MIN) {
      annulla();
      setRisultati([]);
      setStato("fermo");
      return undefined;
    }
    annulla();
    timer.current = setTimeout(() => avvia(pulito), PAUSA_MS);
    return annulla;
  }, [testo, avvia, annulla]);

  // Pulsante Cerca / invio da tastiera: cerca subito, senza aspettare la pausa
  const cerca = useCallback(() => {
    const pulito = pulisciTesto(testo);
    if (pulito.length >= LUNGHEZZA_MIN) avvia(pulito);
  }, [testo, avvia]);

  // Ricorda un luogo scelto (in cima, senza doppioni)
  const ricorda = useCallback((luogo) => {
    setRecenti((attuali) => {
      const nuovi = [luogo, ...attuali.filter((r) => r.etichetta !== luogo.etichetta)].slice(0, MAX_RECENTI);
      AsyncStorage.setItem(CHIAVE_RECENTI, JSON.stringify(nuovi)).catch(() => {});
      return nuovi;
    });
  }, []);

  // Cancella la cronologia delle ricerche, anche dal telefono
  const cancellaRecenti = useCallback(() => {
    setRecenti([]);
    AsyncStorage.removeItem(CHIAVE_RECENTI).catch(() => {});
  }, []);

  const chiudi = useCallback(() => {
    annulla();
    setRisultati([]);
    setStato("fermo");
  }, [annulla]);

  const pulisci = useCallback(() => {
    setTesto("");
    chiudi();
  }, [chiudi]);

  return { testo, setTesto, stato, risultati, recenti, cerca, ricorda, cancellaRecenti, chiudi, pulisci };
}
