import { Pressable, StyleSheet, View } from "react-native";
import { altezzaMinimaTocco, raggi, spazi, useStili } from "../theme/tema";
import Testo from "./Testo";

// Piccolo elenco di scelte (risultati di ricerca, ricerche recenti...).
// voci: [{ etichetta, ... }]. onScegli(voce) viene chiamata al tocco.
// Se `messaggio` è presente viene mostrato al posto delle voci (nessun risultato, errore...).
export default function ElencoRisultati({ titolo, voci = [], messaggio, onScegli, style }) {
  const stili = useStili(creaStili);
  if (!messaggio && voci.length === 0) return null;
  return (
    <View style={[stili.contenitore, style]}>
      {titolo ? (
        <Testo variante="piccolo" colore="secondario" style={stili.titolo}>
          {titolo}
        </Testo>
      ) : null}
      {messaggio ? (
        <Testo colore="secondario" style={stili.messaggio}>
          {messaggio}
        </Testo>
      ) : (
        voci.map((v, i) => (
          <Pressable
            key={`${v.etichetta}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={v.etichetta}
            onPress={() => onScegli(v)}
            style={({ pressed }) => [stili.voce, i > 0 && stili.separata, pressed && { opacity: 0.6 }]}
          >
            <Testo numberOfLines={2}>{v.etichetta}</Testo>
          </Pressable>
        ))
      )}
    </View>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    contenitore: {
      backgroundColor: t.superficie,
      borderRadius: raggi.md,
      borderWidth: 1,
      borderColor: t.bordo,
      overflow: "hidden",
    },
    titolo: { paddingHorizontal: spazi.md, paddingTop: spazi.sm },
    messaggio: { padding: spazi.md },
    voce: { minHeight: altezzaMinimaTocco, justifyContent: "center", paddingHorizontal: spazi.md, paddingVertical: spazi.sm },
    separata: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.bordo },
  });
