import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { cercaIndirizzo, pulisciTesto } from "../services/geocoding";

const CHIAVE_RECENTI = "gpl-ricerche-v1";
const MAX_RECENTI = 5;

function validaRecenti(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((r) => r && typeof r.etichetta === "string" && Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .map((r) => ({ etichetta: r.etichetta.slice(0, 120), lat: r.lat, lon: r.lon }))
    .slice(0, MAX_RECENTI);
}

// Gestisce testo scritto, risultati, errori e ricerche recenti.
// stato: fermo | cerca | risultati | vuoto | errore
export default function useRicercaIndirizzo() {
  const [testo, setTesto] = useState("");
  const [stato, setStato] = useState("fermo");
  const [risultati, setRisultati] = useState([]);
  const [recenti, setRecenti] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(CHIAVE_RECENTI)
      .then((v) => setRecenti(validaRecenti(JSON.parse(v))))
      .catch(() => {});
  }, []);

  const cerca = useCallback(async () => {
    if (pulisciTesto(testo).length < 3) {
      setStato("vuoto");
      setRisultati([]);
      return;
    }
    setStato("cerca");
    try {
      const trovati = await cercaIndirizzo(testo);
      setRisultati(trovati);
      setStato(trovati.length ? "risultati" : "vuoto");
    } catch (e) {
      setRisultati([]);
      setStato("errore");
    }
  }, [testo]);

  // Ricorda un luogo scelto (in cima, senza doppioni)
  const ricorda = useCallback((luogo) => {
    setRecenti((attuali) => {
      const nuovi = [luogo, ...attuali.filter((r) => r.etichetta !== luogo.etichetta)].slice(0, MAX_RECENTI);
      AsyncStorage.setItem(CHIAVE_RECENTI, JSON.stringify(nuovi)).catch(() => {});
      return nuovi;
    });
  }, []);

  const chiudi = useCallback(() => {
    setRisultati([]);
    setStato("fermo");
  }, []);

  const pulisci = useCallback(() => {
    setTesto("");
    chiudi();
  }, [chiudi]);

  return { testo, setTesto, stato, risultati, recenti, cerca, ricorda, chiudi, pulisci };
}
