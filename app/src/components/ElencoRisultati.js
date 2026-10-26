import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { altezzaMinimaTocco, raggi, spazi, useStili } from "../theme/tema";
import Bottone from "./Bottone";
import Testo from "./Testo";

// Piccolo elenco di scelte (risultati di ricerca, ricerche recenti...).
// voci: [{ etichetta, ... }]. onScegli(voce) viene chiamata al tocco.
// Se `messaggio` è presente viene mostrato al posto delle voci (nessun risultato, errore...).
// azione (facoltativa): { titolo, onPress }, un pulsante a destra del titolo (es. "Cancella").
// altezzaMassima (facoltativa): oltre questa altezza le voci scorrono, il titolo resta fermo.
export default function ElencoRisultati({ titolo, voci = [], messaggio, azione, altezzaMassima, onScegli, style }) {
  const stili = useStili(creaStili);
  if (!messaggio && voci.length === 0) return null;
  return (
    <View style={[stili.contenitore, altezzaMassima ? { maxHeight: altezzaMassima } : null, style]}>
      {titolo ? (
        <View style={stili.intestazione}>
          <Testo variante="piccolo" colore="secondario" style={stili.titolo}>
            {titolo}
          </Testo>
          {azione ? <Bottone titolo={azione.titolo} onPress={azione.onPress} variante="testo" dimensione="piccolo" /> : null}
        </View>
      ) : null}
      {messaggio ? (
        <Testo colore="secondario" style={stili.messaggio}>
          {messaggio}
        </Testo>
      ) : (
        // "handled": il tocco su una voce funziona anche con la tastiera aperta
        <ScrollView style={stili.scorrimento} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
          {voci.map((v, i) => (
            <Pressable
              key={`${v.etichetta}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={v.etichetta}
              onPress={() => onScegli(v)}
              style={({ pressed }) => [stili.voce, i > 0 && stili.separata, pressed && { opacity: 0.6 }]}
            >
              <Testo numberOfLines={2}>{v.etichetta}</Testo>
            </Pressable>
          ))}
        </ScrollView>
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
    intestazione: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingRight: spazi.xs },
    titolo: { paddingHorizontal: spazi.md, paddingTop: spazi.sm },
    scorrimento: { flexShrink: 1 },
    messaggio: { padding: spazi.md },
    voce: { minHeight: altezzaMinimaTocco, justifyContent: "center", paddingHorizontal: spazi.md, paddingVertical: spazi.sm },
    separata: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.bordo },
  });
