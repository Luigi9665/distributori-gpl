import { StyleSheet, Text } from "react-native";
import { tipografia, useStili } from "../theme/tema";

// Testo con stili pronti.
// variante: titolo | sottotitolo | corpo | piccolo | prezzo | prezzoGrande
// colore:   testo | secondario | primario | errore
// Tutte le altre props (numberOfLines, style, ...) passano a <Text>.
export default function Testo({ variante = "corpo", colore = "testo", style, children, ...resto }) {
  const stili = useStili(creaStili);
  return (
    <Text style={[tipografia[variante], stili[colore], style]} {...resto}>
      {children}
    </Text>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    testo: { color: t.testo },
    secondario: { color: t.testoSecondario },
    primario: { color: t.primario },
    errore: { color: t.errore },
  });
