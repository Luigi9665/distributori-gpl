import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

// Chiede il permesso e legge la posizione una volta.
// stato: verifica | ok | negato | errore
export default function usePosizione() {
  const [stato, setStato] = useState("verifica");
  const [posizione, setPosizione] = useState(null);

  const richiedi = useCallback(async () => {
    setStato("verifica");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setStato("negato");
        return;
      }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPosizione({ lat: p.coords.latitude, lon: p.coords.longitude });
      setStato("ok");
    } catch (e) {
      setStato("errore");
    }
  }, []);

  useEffect(() => {
    richiedi();
  }, [richiedi]);

  return { stato, posizione, riprova: richiedi };
}
