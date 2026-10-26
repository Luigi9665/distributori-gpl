import { StyleSheet, View } from "react-native";
import { raggi, spazi, useStili } from "../theme/tema";
import { formattaKm, formattaPrezzo } from "../utils/geo";
import Badge from "./Badge";
import Bottone from "./Bottone";
import Testo from "./Testo";

// Card con i dettagli del distributore scelto (si mette dentro la scheda scorrevole).
export default function DettaglioDistributore({ distributore: d, piuEconomico = false, onVai, onChiudi }) {
  const stili = useStili(creaStili);
  return (
    <View style={stili.card}>
      <View style={stili.intestazione}>
        <Testo variante="sottotitolo" style={{ flex: 1 }}>
          {d.nome || d.marchio}
        </Testo>
        {piuEconomico && <Badge testo="Più economico" />}
      </View>
      <Testo colore="secondario">{d.marchio}</Testo>
      <Testo>
        {d.indirizzo}, {d.comune} ({d.provincia})
      </Testo>
      <Testo variante="prezzoGrande" colore="primario">
        {formattaPrezzo(d.prezzoGpl)}
      </Testo>
      <Testo variante="piccolo" colore="secondario">
        {d.self ? "Self service" : "Servito"} · prezzo del {d.dataPrezzo} · a {formattaKm(d.km)}
      </Testo>
      <View style={stili.azioni}>
        <Bottone titolo="Portami lì" onPress={onVai} pienaLarghezza />
        <Bottone titolo="Torna alla lista" variante="secondario" onPress={onChiudi} pienaLarghezza />
      </View>
    </View>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    card: {
      padding: spazi.lg,
      gap: spazi.sm,
      backgroundColor: t.superficie,
      borderRadius: raggi.md,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    intestazione: { flexDirection: "row", alignItems: "center", gap: spazi.sm },
    azioni: { gap: spazi.sm, marginTop: spazi.md },
  });
