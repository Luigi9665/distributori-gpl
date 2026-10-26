import { useMemo, useRef, useState } from "react";
import { Keyboard, Linking, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Avviso from "./src/components/Avviso";
import BarraRicerca from "./src/components/BarraRicerca";
import Bottone from "./src/components/Bottone";
import Chip from "./src/components/Chip";
import DettaglioDistributore from "./src/components/DettaglioDistributore";
import ElencoRisultati from "./src/components/ElencoRisultati";
import MappaDistributori from "./src/components/MappaDistributori";
import Paginazione from "./src/components/Paginazione";
import SchedaScorrevole from "./src/components/SchedaScorrevole";
import Schermata from "./src/components/Schermata";
import StatoPagina from "./src/components/StatoPagina";
import Testo from "./src/components/Testo";
import VoceDistributore from "./src/components/VoceDistributore";
import useDatiGpl from "./src/hooks/useDatiGpl";
import usePosizione from "./src/hooks/usePosizione";
import useRicercaIndirizzo from "./src/hooks/useRicercaIndirizzo";
import { spazi, useStili } from "./src/theme/tema";
import { distanzaKm, formattaPrezzo } from "./src/utils/geo";
import { apriNavigazione } from "./src/utils/navigazione";

// La scheda scorrevole (libreria bottom-sheet) passa a Reanimated un parametro che sul telefono
// viene ignorato e genera decine di avvisi gialli. Sono innocui: li nascondiamo.
configureReanimatedLogger({ level: ReanimatedLogLevel.error, strict: false });

const RAGGI = [5, 10, 20];
const PER_PAGINA = 8;
const PUNTI_SCHEDA = ["18%", "50%", "92%"]; // chiusa, a metà, aperta
const CENTRO_ITALIA = { lat: 42.5, lon: 12.5 };
const RAGGIO_ITALIA_KM = 330;

const MESSAGGI_RICERCA = {
  vuoto: "Non trovo questo indirizzo. Prova con il comune, per esempio «Udine».",
  errore: "Ricerca non disponibile. Controlla la connessione e riprova.",
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Principale />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Principale() {
  const stili = useStili(creaStili);
  const gps = usePosizione();
  const gpl = useDatiGpl();
  const ricerca = useRicercaIndirizzo();

  const [raggio, setRaggio] = useState(10);
  const [ordine, setOrdine] = useState("distanza"); // distanza | prezzo
  const [pagina, setPagina] = useState(0);
  const [selezionato, setSelezionato] = useState(null);
  const [erroreNavigazione, setErroreNavigazione] = useState(false);
  // Punto di partenza scelto con la ricerca. null = si usa la posizione GPS.
  const [partenza, setPartenza] = useState(null);
  const [mostraRecenti, setMostraRecenti] = useState(false);
  const mappa = useRef(null);
  const scheda = useRef(null);

  const dati = gpl.dati;
  const origine = partenza || gps.posizione; // da qui si calcolano distanze, mappa e lista

  // Distributori entro il raggio, con la distanza dall'origine
  const vicini = useMemo(() => {
    if (!dati || !origine) return [];
    const risultato = [];
    for (const d of dati.distributori) {
      const km = distanzaKm(origine.lat, origine.lon, d.lat, d.lon);
      if (km <= raggio) risultato.push({ ...d, km });
    }
    return risultato;
  }, [dati, origine, raggio]);

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

  // Si torna alla prima pagina quando cambiano raggio, ordine o punto di partenza
  function cambiaRaggio(r) {
    setRaggio(r);
    setPagina(0);
    setSelezionato(null);
  }
  function cambiaOrdine(o) {
    setOrdine(o);
    setPagina(0);
  }

  function cambiaPartenza(nuova) {
    setPartenza(nuova);
    setPagina(0);
    setSelezionato(null);
    scheda.current?.snapToIndex(1);
  }

  function scegliLuogo(luogo) {
    Keyboard.dismiss();
    ricerca.ricorda(luogo);
    ricerca.pulisci();
    setMostraRecenti(false);
    cambiaPartenza(luogo);
  }

  function usaMiaPosizione() {
    cambiaPartenza(null);
    if (gps.stato !== "ok") gps.riprova();
  }

  function avviaRicerca() {
    Keyboard.dismiss();
    setMostraRecenti(false);
    ricerca.cerca();
  }

  function scegli(d) {
    setSelezionato(d);
    setErroreNavigazione(false);
    scheda.current?.snapToIndex(1); // mostra il dettaglio a metà schermo
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
  if (gpl.stato === "errore") {
    return (
      <StatoPagina
        titolo="Dati non disponibili"
        messaggio="Controlla la connessione internet."
        azioni={[{ titolo: "Riprova", onPress: gpl.ricarica }]}
      />
    );
  }
  if (gps.stato === "verifica" || gpl.stato !== "ok" || !dati) {
    return (
      <StatoPagina
        caricamento
        titolo="Distributori GPL"
        messaggio={gps.stato === "verifica" ? "Cerco la tua posizione..." : "Scarico i prezzi..."}
      />
    );
  }

  // ----- Schermata principale -----
  // Senza GPS l'app funziona lo stesso: basta cercare un indirizzo.
  const senzaOrigine = !origine;
  const prossimoRaggio = RAGGI.find((r) => r > raggio);
  const messaggioRicerca = MESSAGGI_RICERCA[ricerca.stato];
  const vociRicerca =
    ricerca.stato === "risultati" ? ricerca.risultati : mostraRecenti && !ricerca.testo ? ricerca.recenti : [];

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

      <View style={stili.ricerca}>
        <BarraRicerca
          valore={ricerca.testo}
          onCambia={(t) => {
            ricerca.setTesto(t);
            if (ricerca.stato !== "fermo") ricerca.chiudi();
          }}
          onInvia={avviaRicerca}
          onPulisci={ricerca.pulisci}
          onFocus={() => setMostraRecenti(true)}
          caricamento={ricerca.stato === "cerca"}
          segnaposto="Cerca indirizzo o città"
        />
        <ElencoRisultati
          titolo={
            ricerca.stato === "risultati" ? "Risultati" : vociRicerca.length ? "Ricerche recenti" : undefined
          }
          voci={vociRicerca}
          messaggio={messaggioRicerca}
          onScegli={scegliLuogo}
          style={stili.risultati}
        />
        <View style={stili.partenza}>
          <Testo variante="piccolo" colore="secondario" numberOfLines={1} style={{ flex: 1 }}>
            {partenza
              ? `Distanze da: ${partenza.etichetta}`
              : gps.stato === "ok"
                ? "Distanze da: la tua posizione"
                : "Posizione non disponibile: cerca un indirizzo"}
          </Testo>
          {(partenza || gps.stato !== "ok") && (
            <Bottone titolo="Usa la mia posizione" variante="testo" dimensione="piccolo" onPress={usaMiaPosizione} />
          )}
        </View>
      </View>

      <View style={stili.filtri}>
        {RAGGI.map((r) => (
          <Chip key={r} etichetta={`${r} km`} selezionato={raggio === r} onPress={() => cambiaRaggio(r)} />
        ))}
        <View style={stili.separatore} />
        <Chip etichetta="Vicini" selezionato={ordine === "distanza"} onPress={() => cambiaOrdine("distanza")} />
        <Chip etichetta="Economici" selezionato={ordine === "prezzo"} onPress={() => cambiaOrdine("prezzo")} />
      </View>

      {/* La mappa occupa tutto lo spazio; la scheda scorrevole ci sta sopra */}
      <View style={stili.areaMappa}>
        <MappaDistributori
          ref={mappa}
          style={StyleSheet.absoluteFill}
          centro={origine || CENTRO_ITALIA}
          raggioKm={senzaOrigine ? RAGGIO_ITALIA_KM : raggio}
          distributori={vicini}
          idPiuEconomico={piuEconomico?.id}
          idSelezionato={selezionato?.id}
          puntoRicerca={partenza}
          onSeleziona={scegli}
        />

        <SchedaScorrevole ref={scheda} snapPoints={PUNTI_SCHEDA} indiceIniziale={1}>
          {senzaOrigine ? (
            <View style={stili.vuoto}>
              <Testo colore="secondario" style={stili.centrato}>
                {gps.stato === "negato"
                  ? "Senza la tua posizione puoi comunque cercare un indirizzo qui sopra, oppure consentire l'accesso alla posizione."
                  : "Non riesco a leggere la tua posizione. Cerca un indirizzo qui sopra, oppure riprova con il GPS."}
              </Testo>
              {gps.stato === "negato" && (
                <Bottone titolo="Apri impostazioni" onPress={() => Linking.openSettings()} pienaLarghezza />
              )}
              <Bottone titolo="Riprova con il GPS" variante="secondario" onPress={gps.riprova} pienaLarghezza />
            </View>
          ) : selezionato ? (
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
            <View style={stili.vuoto}>
              <Testo colore="secondario" style={stili.centrato}>
                Nessun distributore GPL entro {raggio} km{partenza ? " da questo indirizzo" : ""}.
              </Testo>
              {prossimoRaggio && (
                <Bottone
                  titolo={`Cerca entro ${prossimoRaggio} km`}
                  onPress={() => cambiaRaggio(prossimoRaggio)}
                  pienaLarghezza
                />
              )}
            </View>
          ) : (
            <>
              <Testo variante="piccolo" colore="secondario" style={stili.sommario}>
                Il più economico qui vicino: {formattaPrezzo(piuEconomico.prezzoGpl)}
              </Testo>
              {visibili.map((d) => (
                <VoceDistributore
                  key={d.id}
                  distributore={d}
                  piuEconomico={d.id === piuEconomico.id}
                  onPress={scegli}
                />
              ))}
              <Paginazione pagina={paginaValida} totale={ordinati.length} perPagina={PER_PAGINA} onCambia={setPagina} />
            </>
          )}
          <Testo variante="piccolo" colore="secondario" style={stili.fonte}>
            Fonte: {dati.fonte}
          </Testo>
        </SchedaScorrevole>
      </View>
    </Schermata>
  );
}

const creaStili = () =>
  StyleSheet.create({
    intestazione: { paddingHorizontal: spazi.lg, paddingTop: spazi.sm, gap: 2 },
    ricerca: { paddingHorizontal: spazi.lg, paddingTop: spazi.sm, gap: spazi.xs },
    risultati: { marginTop: spazi.xs },
    partenza: { flexDirection: "row", alignItems: "center", gap: spazi.sm },
    // Una sola riga compatta: i pulsanti si dividono la larghezza, senza scorrimento
    filtri: { flexDirection: "row", paddingHorizontal: spazi.lg, paddingVertical: spazi.sm, gap: spazi.xs },
    separatore: { width: spazi.xs },
    areaMappa: { flex: 1 },
    sommario: { paddingBottom: spazi.sm },
    vuoto: { padding: spazi.lg, gap: spazi.md },
    centrato: { textAlign: "center" },
    avvisoDettaglio: { marginTop: spazi.sm },
    fonte: { textAlign: "center", paddingTop: spazi.sm },
  });
