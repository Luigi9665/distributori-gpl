import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { validaDati } from "../utils/validazione";

const URL_DATI = "https://luigi9665.github.io/distributori-gpl/gpl.json";
const CHIAVE_CACHE = "gpl-json-v1";
const TIMEOUT_MS = 20000;

// Scarica gpl.json. Se internet non va usa l'ultima copia salvata sul telefono.
// stato: caricamento | ok | errore      offline: true se si usano i dati salvati
export default function useDatiGpl() {
  const [stato, setStato] = useState("caricamento");
  const [dati, setDati] = useState(null);
  const [offline, setOffline] = useState(false);

  const carica = useCallback(async () => {
    setStato((s) => (s === "ok" ? s : "caricamento"));
    const controllo = new AbortController();
    const timer = setTimeout(() => controllo.abort(), TIMEOUT_MS);
    try {
      const risposta = await fetch(URL_DATI, { signal: controllo.signal });
      clearTimeout(timer);
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
      const puliti = validaDati(await risposta.json());
      if (!puliti) throw new Error("dati non validi");
      setDati(puliti);
      setOffline(false);
      setStato("ok");
      AsyncStorage.setItem(CHIAVE_CACHE, JSON.stringify(puliti)).catch(() => {});
    } catch (e) {
      clearTimeout(timer);
      try {
        const salvato = validaDati(JSON.parse(await AsyncStorage.getItem(CHIAVE_CACHE)));
        if (!salvato) throw new Error("nessuna copia salvata");
        setDati(salvato);
        setOffline(true);
        setStato("ok");
      } catch (e2) {
        setStato("errore");
      }
    }
  }, []);

  useEffect(() => {
    carica();
  }, [carica]);

  return { stato, dati, offline, ricarica: carica };
}
