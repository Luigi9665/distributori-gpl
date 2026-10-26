import { ActivityIndicator, StyleSheet, View } from "react-native";
import { spazi, useStili, useTema } from "../theme/tema";
import Bottone from "./Bottone";
import Schermata from "./Schermata";
import Testo from "./Testo";

// Schermata a tutta pagina per caricamento, errori e permessi.
// azioni: [{ titolo, onPress, variante }]
export default function StatoPagina({ titolo, messaggio, caricamento = false, azioni = [] }) {
  const stili = useStili(creaStili);
  const tema = useTema();
  return (
    <Schermata>
      <View style={stili.centro}>
        {caricamento && <ActivityIndicator size="large" color={tema.primario} />}
        <Testo variante="titolo" style={stili.centrato}>{titolo}</Testo>
        {messaggio ? (
          <Testo colore="secondario" style={stili.centrato}>
            {messaggio}
          </Testo>
        ) : null}
        <View style={stili.azioni}>
          {azioni.map((a) => (
            <Bottone key={a.titolo} titolo={a.titolo} onPress={a.onPress} variante={a.variante} pienaLarghezza />
          ))}
        </View>
      </View>
    </Schermata>
  );
}

const creaStili = () =>
  StyleSheet.create({
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: spazi.xl, gap: spazi.md },
    centrato: { textAlign: "center" },
    azioni: { alignSelf: "stretch", gap: spazi.sm, marginTop: spazi.sm },
  });
