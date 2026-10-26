import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { distanzaKm, formattaKm, formattaPrezzo } from "./geo";

const URL_DATI = "https://luigi9665.github.io/distributori-gpl/gpl.json";
const CHIAVE_CACHE = "gpl-json-v1";
const RAGGI = [5, 10, 20];
const PER_PAGINA = 8;

export default function App() {
  const stili = useStili();

  // Stato dei dati e della posizione
  const [dati, setDati] = useState(null);
  const [erroreDati, setErroreDati] = useState(false);
  const [offline, setOffline] = useState(false); // true = si stanno usando i dati salvati
  const [posizione, setPosizione] = useState(null);
  const [permesso, setPermesso] = useState("verifica"); // verifica | ok | negato | errore

  // Scelte dell'utente
  const [raggio, setRaggio] = useState(10);
  const [ordine, setOrdine] = useState("distanza"); // distanza | prezzo
  const [pagina, setPagina] = useState(0);
  const [selezionato, setSelezionato] = useState(null);

  const mappa = useRef(null);

  // Prima prova internet; se non va, usa l'ultima copia salvata sul telefono.
  const caricaDati = useCallback(async () => {
    setErroreDati(false);
    try {
      const risposta = await fetch(URL_DATI);
      if (!risposta.ok) throw new Error(`HTTP ${risposta.status}`);
      const json = await risposta.json();
      setDati(json);
      setOffline(false);
      AsyncStorage.setItem(CHIAVE_CACHE, JSON.stringify(json)).catch(() => {});
    } catch (e) {
      try {
        const salvato = await AsyncStorage.getItem(CHIAVE_CACHE);
        if (!salvato) throw new Error("nessuna copia salvata");
        setDati(JSON.parse(salvato));
        setOffline(true);
      } catch (e2) {
        setErroreDati(true);
      }
    }
  }, []);

  const caricaPosizione = useCallback(async () => {
    setPermesso("verifica");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermesso("negato");
        return;
      }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPosizione({ lat: p.coords.latitude, lon: p.coords.longitude });
      setPermesso("ok");
    } catch (e) {
      setPermesso("errore");
    }
  }, []);

  useEffect(() => {
    caricaDati();
    caricaPosizione();
  }, [caricaDati, caricaPosizione]);

  // Distributori entro il raggio, con la distanza calcolata
  const vicini = useMemo(() => {
    if (!dati || !posizione) return [];
    const risultato = [];
    for (const d of dati.distributori) {
      const km = distanzaKm(posizione.lat, posizione.lon, d.lat, d.lon);
      if (km <= raggio) risultato.push({ ...d, km });
    }
    return risultato;
  }, [dati, posizione, raggio]);

  const piuEconomico = useMemo(() => {
    if (vicini.length === 0) return null;
    return vicini.reduce((a, b) => (b.prezzoGpl < a.prezzoGpl ? b : a));
  }, [vicini]);

  const ordinati = useMemo(() => {
    const copia = [...vicini];
    if (ordine === "prezzo") copia.sort((a, b) => a.prezzoGpl - b.prezzoGpl || a.km - b.km);
    else copia.sort((a, b) => a.km - b.km);
    return copia;
  }, [vicini, ordine]);

  const totalePagine = Math.max(1, Math.ceil(ordinati.length / PER_PAGINA));
  const paginaCorrente = Math.min(pagina, totalePagine - 1);
  const inizio = paginaCorrente * PER_PAGINA;
  const visibili = ordinati.slice(inizio, inizio + PER_PAGINA);

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
    mappa.current?.animateToRegion(
      { latitude: d.lat, longitude: d.lon, latitudeDelta: 0.04, longitudeDelta: 0.04 },
      400
    );
  }

  function portamiLi(d) {
    const etichetta = encodeURIComponent(d.nome);
    const url =
      Platform.OS === "ios"
        ? `maps://?daddr=${d.lat},${d.lon}&q=${etichetta}`
        : `geo:${d.lat},${d.lon}?q=${d.lat},${d.lon}(${etichetta})`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lon}`);
    });
  }

  // ----- Schermate di attesa / errore -----
  if (permesso === "negato" || permesso === "errore") {
    return (
      <SafeAreaView style={stili.centro}>
        <Text style={stili.titolo}>Distributori GPL</Text>
        <Text style={stili.messaggio}>
          {permesso === "negato"
            ? "Senza la tua posizione non posso mostrarti i distributori vicini.\nConsenti l'accesso alla posizione dalle impostazioni."
            : "Non riesco a leggere la tua posizione.\nControlla che il GPS sia acceso."}
        </Text>
        {permesso === "negato" && <Bottone testo="Apri impostazioni" onPress={() => Linking.openSettings()} />}
        <Bottone testo="Riprova" onPress={caricaPosizione} />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (erroreDati) {
    return (
      <SafeAreaView style={stili.centro}>
        <Text style={stili.titolo}>Distributori GPL</Text>
        <Text style={stili.messaggio}>Dati non disponibili.{"\n"}Controlla la connessione internet.</Text>
        <Bottone testo="Riprova" onPress={caricaDati} />
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  if (!dati || permesso !== "ok" || !posizione) {
    return (
      <SafeAreaView style={stili.centro}>
        <ActivityIndicator size="large" />
        <Text style={stili.messaggio}>
          {permesso === "verifica" ? "Cerco la tua posizione..." : "Scarico i prezzi..."}
        </Text>
        <StatusBar style="auto" />
      </SafeAreaView>
    );
  }

  // ----- Schermata principale -----
  return (
    <SafeAreaView style={stili.contenitore}>
      <View style={stili.intestazione}>
        <Text style={stili.titolo}>Distributori GPL</Text>
        <Text style={stili.piccolo}>Prezzi aggiornati al {dati.aggiornato}</Text>
        {offline && (
          <Pressable onPress={caricaDati} style={stili.avviso}>
            <Text style={stili.testoAvviso}>Sei offline: prezzi salvati, potrebbero non essere aggiornati. Tocca per riprovare.</Text>
          </Pressable>
        )}
      </View>

      <View style={stili.riga}>
        {RAGGI.map((r) => (
          <Scelta key={r} testo={`${r} km`} attiva={raggio === r} onPress={() => cambiaRaggio(r)} />
        ))}
        <View style={{ width: 12 }} />
        <Scelta testo="Vicini" attiva={ordine === "distanza"} onPress={() => cambiaOrdine("distanza")} />
        <Scelta testo="Economici" attiva={ordine === "prezzo"} onPress={() => cambiaOrdine("prezzo")} />
      </View>

      <MapView
        ref={mappa}
        style={stili.mappa}
        showsUserLocation
        initialRegion={{
          latitude: posizione.lat,
          longitude: posizione.lon,
          latitudeDelta: (raggio / 111) * 2.2,
          longitudeDelta: (raggio / 111) * 2.2,
        }}
        key={raggio}
      >
        {vicini.map((d) => (
          <Marker
            key={d.id}
            coordinate={{ latitude: d.lat, longitude: d.lon }}
            title={`${formattaPrezzo(d.prezzoGpl)} · ${d.nome}`}
            pinColor={piuEconomico && d.id === piuEconomico.id ? "green" : d.id === selezionato?.id ? "blue" : "red"}
            onPress={() => setSelezionato(d)}
          />
        ))}
      </MapView>

      {selezionato ? (
        <Dettaglio d={selezionato} onChiudi={() => setSelezionato(null)} onVai={() => portamiLi(selezionato)} />
      ) : (
        <View style={stili.lista}>
          {vicini.length === 0 ? (
            <Text style={stili.messaggio}>Nessun distributore GPL entro {raggio} km. Prova un raggio più grande.</Text>
          ) : (
            <>
              <Text style={stili.piccolo}>
                {inizio + 1}–{Math.min(inizio + PER_PAGINA, ordinati.length)} di {ordinati.length}
                {piuEconomico ? ` · il più economico: ${formattaPrezzo(piuEconomico.prezzoGpl)}` : ""}
              </Text>
              <ScrollView>
                {visibili.map((d) => (
                  <Pressable key={d.id} style={stili.voce} onPress={() => scegli(d)}>
                    <View style={{ flex: 1 }}>
                      <Text style={stili.nomeVoce} numberOfLines={1}>
                        {d.marchio} · {d.comune}
                      </Text>
                      <Text style={stili.piccolo} numberOfLines={1}>
                        {formattaKm(d.km)} · {d.indirizzo}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={stili.prezzo}>{formattaPrezzo(d.prezzoGpl)}</Text>
                      {piuEconomico && d.id === piuEconomico.id && <Text style={stili.badge}>Più economico</Text>}
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={stili.riga}>
                <Scelta testo="«" onPress={() => setPagina(0)} disattiva={paginaCorrente === 0} />
                <Scelta testo="‹ Prec." onPress={() => setPagina(paginaCorrente - 1)} disattiva={paginaCorrente === 0} />
                <Text style={stili.piccolo}>
                  Pagina {paginaCorrente + 1} di {totalePagine}
                </Text>
                <Scelta
                  testo="Succ. ›"
                  onPress={() => setPagina(paginaCorrente + 1)}
                  disattiva={paginaCorrente >= totalePagine - 1}
                />
                <Scelta
                  testo="»"
                  onPress={() => setPagina(totalePagine - 1)}
                  disattiva={paginaCorrente >= totalePagine - 1}
                />
              </View>
            </>
          )}
        </View>
      )}

      <Text style={stili.fonte}>Fonte: {dati.fonte}</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

function Dettaglio({ d, onChiudi, onVai }) {
  const stili = useStili();
  return (
    <View style={stili.dettaglio}>
      <Text style={stili.nomeVoce}>{d.nome}</Text>
      <Text style={stili.testo}>{d.marchio}</Text>
      <Text style={stili.testo}>
        {d.indirizzo}, {d.comune} ({d.provincia})
      </Text>
      <Text style={stili.prezzoGrande}>{formattaPrezzo(d.prezzoGpl)}</Text>
      <Text style={stili.piccolo}>
        {d.self ? "Self service" : "Servito"} · prezzo del {d.dataPrezzo} · a {formattaKm(d.km)}
      </Text>
      <View style={stili.riga}>
        <Bottone testo="Portami lì" onPress={onVai} />
        <Bottone testo="Chiudi" onPress={onChiudi} secondario />
      </View>
    </View>
  );
}

function Bottone({ testo, onPress, secondario }) {
  const stili = useStili();
  return (
    <Pressable onPress={onPress} style={[stili.bottone, secondario && stili.bottoneSecondario]}>
      <Text style={secondario ? stili.testoBottoneSecondario : stili.testoBottone}>{testo}</Text>
    </Pressable>
  );
}

function Scelta({ testo, attiva, onPress, disattiva }) {
  const stili = useStili();
  return (
    <Pressable
      onPress={disattiva ? undefined : onPress}
      style={[stili.scelta, attiva && stili.sceltaAttiva, disattiva && { opacity: 0.35 }]}
    >
      <Text style={attiva ? stili.testoSceltaAttiva : stili.testoScelta}>{testo}</Text>
    </Pressable>
  );
}

// Gli stili dipendono dal tema del telefono (chiaro o scuro).
function useStili() {
  const scuro = useColorScheme() === "dark";
  return useMemo(() => creaStili(scuro), [scuro]);
}

function creaStili(scuro) {
  const sfondo = scuro ? "#121212" : "#ffffff";
  const testo = scuro ? "#f2f2f2" : "#111111";
  const grigio = scuro ? "#a8a8a8" : "#666666";
  const linea = scuro ? "#2a2a2a" : "#eeeeee";
  const verde = scuro ? "#2fd48a" : "#0a6";
  return StyleSheet.create({
    contenitore: { flex: 1, backgroundColor: sfondo, paddingTop: Platform.OS === "android" ? 30 : 0 },
    centro: { flex: 1, backgroundColor: sfondo, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 },
    intestazione: { paddingHorizontal: 12, paddingTop: 6 },
    titolo: { fontSize: 22, fontWeight: "bold", color: testo },
    testo: { color: testo },
    messaggio: { textAlign: "center", fontSize: 15, color: testo },
    piccolo: { fontSize: 12, color: grigio },
    avviso: { backgroundColor: "#fff3cd", borderRadius: 8, padding: 6, marginTop: 4 },
    testoAvviso: { fontSize: 12, color: "#664d03" },
    fonte: { fontSize: 11, color: grigio, textAlign: "center", paddingVertical: 4 },
    riga: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 6 },
    mappa: { height: 240 },
    lista: { flex: 1, paddingHorizontal: 12 },
    voce: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: linea },
    nomeVoce: { fontSize: 15, fontWeight: "600", color: testo },
    prezzo: { fontSize: 16, fontWeight: "700", color: testo },
    prezzoGrande: { fontSize: 26, fontWeight: "700", marginVertical: 6, color: testo },
    badge: { fontSize: 11, color: "#fff", backgroundColor: "#0a6", paddingHorizontal: 6, borderRadius: 8, overflow: "hidden" },
    dettaglio: { flex: 1, padding: 14, gap: 2 },
    bottone: { backgroundColor: "#0a6", paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
    bottoneSecondario: { backgroundColor: "transparent", borderWidth: 1, borderColor: verde },
    testoBottone: { color: "#fff", fontWeight: "600" },
    testoBottoneSecondario: { color: verde, fontWeight: "600" },
    scelta: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, borderColor: verde },
    sceltaAttiva: { backgroundColor: "#0a6", borderColor: "#0a6" },
    testoScelta: { color: verde, fontSize: 13, fontWeight: "600" },
    testoSceltaAttiva: { color: "#fff", fontSize: 13, fontWeight: "600" },
  });
}
