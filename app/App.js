import { useMemo, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Avviso from "./src/components/Avviso";
import Chip from "./src/components/Chip";
import DettaglioDistributore from "./src/components/DettaglioDistributore";
import MappaDistributori from "./src/components/MappaDistributori";
import Paginazione from "./src/components/Paginazione";
import Schermata from "./src/components/Schermata";
import StatoPagina from "./src/components/StatoPagina";
import Testo from "./src/components/Testo";
import VoceDistributore from "./src/components/VoceDistributore";
import useDatiGpl from "./src/hooks/useDatiGpl";
import usePosizione from "./src/hooks/usePosizione";
import { spazi, useStili } from "./src/theme/tema";
import { distanzaKm, formattaPrezzo } from "./src/utils/geo";
import { apriNavigazione } from "./src/utils/navigazione";

const RAGGI = [5, 10, 20];
const PER_PAGINA = 8;

export default function App() {
  return (
    <SafeAreaProvider>
      <Principale />
    </SafeAreaProvider>
  );
}

function Principale() {
  const stili = useStili(creaStili);
  const { height } = useWindowDimensions();
  const gps = usePosizione();
  const gpl = useDatiGpl();

  const [raggio, setRaggio] = useState(10);
  const [ordine, setOrdine] = useState("distanza"); // distanza | prezzo
  const [pagina, setPagina] = useState(0);
  const [selezionato, setSelezionato] = useState(null);
  const [erroreNavigazione, setErroreNavigazione] = useState(false);
  const mappa = useRef(null);

  const posizione = gps.posizione;
  const dati = gpl.dati;

  // Distributori entro il raggio, con la distanza dall'utente
  const vicini = useMemo(() => {
    if (!dati || !posizione) return [];
    const risultato = [];
    for (const d of dati.distributori) {
      const km = distanzaKm(posizione.lat, posizione.lon, d.lat, d.lon);
      if (km <= raggio) risultato.push({ ...d, km });
    }
    return risultato;
  }, [dati, posizione, raggio]);

  const piuEconomico = useMemo(
    () => (vicini.length ? vicini.reduce((a, b) => (b.prezzoGpl < a.prezzoGpl ? b : a)) : null),
    [vicini]
  );

  const ordinati = useMemo(() => {
    const copia = [...vicini];
    if (ordine === "prezzo") copia.sort((a, b) => a.prezzoGpl - b.prezzoGpl || a.km - b.km);
    else copia.sort((a, b) => a.km - b.km);
    return copia;
  }, [vicini, ordine]);

  const paginaValida = Math.min(pagina, Math.max(0, Math.ceil(ordinati.length / PER_PAGINA) - 1));
  const visibili = ordinati.slice(paginaValida * PER_PAGINA, (paginaValida + 1) * PER_PAGINA);

  // Si torna alla prima pagina quando cambiano raggio o ordine
  function cambiaRaggio(r) {
    setRaggio(r);
    setPagina(0);
    setSelezionato(null);
  }
  function cambiaOrdine(o) {
    setOrdine(o);
    setPagina(0);
  }

  function scegli(d) {
    setSelezionato(d);
    setErroreNavigazione(false);
    mappa.current?.animateToRegion(
      { latitude: d.lat, longitude: d.lon, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      400
    );
  }

  async function portamiLi() {
    const ok = await apriNavigazione(selezionato);
    setErroreNavigazione(!ok);
  }

  // ----- Schermate di attesa e di errore -----
  if (gps.stato === "negato") {
    return (
      <StatoPagina
        titolo="Serve la tua posizione"
        messaggio="Senza la tua posizione non posso mostrarti i distributori vicini. Consentila dalle impostazioni."
        azioni={[
          { titolo: "Apri impostazioni", onPress: () => Linking.openSettings() },
          { titolo: "Riprova", onPress: gps.riprova, variante: "secondario" },
        ]}
      />
    );
  }
  if (gps.stato === "errore") {
    return (
      <StatoPagina
        titolo="Posizione non trovata"
        messaggio="Non riesco a leggere la tua posizione. Controlla che il GPS sia acceso."
        azioni={[{ titolo: "Riprova", onPress: gps.riprova }]}
      />
    );
  }
  if (gpl.stato === "errore") {
    return (
      <StatoPagina
        titolo="Dati non disponibili"
        messaggio="Controlla la connessione internet."
        azioni={[{ titolo: "Riprova", onPress: gpl.ricarica }]}
      />
    );
  }
  if (gps.stato !== "ok" || gpl.stato !== "ok" || !posizione || !dati) {
    return (
      <StatoPagina
        caricamento
        titolo="Distributori GPL"
        messaggio={gps.stato === "verifica" ? "Cerco la tua posizione..." : "Scarico i prezzi..."}
      />
    );
  }

  // ----- Schermata principale -----
  const altezzaMappa = Math.round(Math.min(280, Math.max(160, height * 0.28)));

  return (
    <Schermata>
      <View style={stili.intestazione}>
        <Testo variante="titolo">Distributori GPL</Testo>
        <Testo variante="piccolo" colore="secondario">
          Prezzi aggiornati al {dati.aggiornato}
        </Testo>
        {gpl.offline && (
          <Avviso
            testo="Sei offline: prezzi salvati, potrebbero non essere aggiornati. Tocca per riprovare."
            onPress={gpl.ricarica}
          />
        )}
      </View>

      <View style={stili.filtri}>
        {RAGGI.map((r) => (
          <Chip key={r} etichetta={`${r} km`} selezionato={raggio === r} onPress={() => cambiaRaggio(r)} />
        ))}
        <View style={stili.separatore} />
        <Chip etichetta="Vicini" selezionato={ordine === "distanza"} onPress={() => cambiaOrdine("distanza")} />
        <Chip etichetta="Economici" selezionato={ordine === "prezzo"} onPress={() => cambiaOrdine("prezzo")} />
      </View>

      <MappaDistributori
        ref={mappa}
        style={{ height: altezzaMappa }}
        centro={posizione}
        raggioKm={raggio}
        distributori={vicini}
        idPiuEconomico={piuEconomico?.id}
        idSelezionato={selezionato?.id}
        onSeleziona={scegli}
      />

      <View style={stili.contenuto}>
        {selezionato ? (
          <>
            {erroreNavigazione && (
              <Avviso testo="Non riesco ad aprire le mappe su questo telefono." style={stili.avvisoDettaglio} />
            )}
            <DettaglioDistributore
              distributore={selezionato}
              piuEconomico={selezionato.id === piuEconomico?.id}
              onVai={portamiLi}
              onChiudi={() => setSelezionato(null)}
            />
          </>
        ) : vicini.length === 0 ? (
          <Testo colore="secondario" style={stili.vuoto}>
            Nessun distributore GPL entro {raggio} km. Prova un raggio più grande.
          </Testo>
        ) : (
          <>
            <Testo variante="piccolo" colore="secondario" style={stili.sommario}>
              Il più economico qui vicino: {formattaPrezzo(piuEconomico.prezzoGpl)}
            </Testo>
            <ScrollView style={stili.lista}>
              {visibili.map((d) => (
                <VoceDistributore
                  key={d.id}
                  distributore={d}
                  piuEconomico={d.id === piuEconomico.id}
                  onPress={scegli}
                />
              ))}
            </ScrollView>
            <Paginazione pagina={paginaValida} totale={ordinati.length} perPagina={PER_PAGINA} onCambia={setPagina} />
          </>
        )}
      </View>

      <Testo variante="piccolo" colore="secondario" style={stili.fonte}>
        Fonte: {dati.fonte}
      </Testo>
    </Schermata>
  );
}

const creaStili = () =>
  StyleSheet.create({
    intestazione: { paddingHorizontal: spazi.lg, paddingTop: spazi.sm, gap: 2 },
    // Una sola riga compatta: i pulsanti si dividono la larghezza, senza scorrimento
    filtri: { flexDirection: "row", paddingHorizontal: spazi.lg, paddingVertical: spazi.sm, gap: spazi.xs },
    separatore: { width: spazi.xs },
    contenuto: { flex: 1, paddingHorizontal: spazi.lg },
    lista: { flex: 1 },
    sommario: { paddingTop: spazi.sm },
    vuoto: { textAlign: "center", padding: spazi.xl },
    avvisoDettaglio: { marginTop: spazi.sm },
    fonte: { textAlign: "center", paddingVertical: spazi.xs },
  });
