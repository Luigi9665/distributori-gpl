import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { altezzaMinimaTocco, raggi, spazi, tipografia, useStili, useTema } from "../theme/tema";
import Bottone from "./Bottone";
import Testo from "./Testo";

// Campo di ricerca con pulsante "Cerca" e "✕" per svuotare. L'invio da tastiera avvia la ricerca.
// Le altre props (onFocus, autoFocus, ...) passano al TextInput.
export default function BarraRicerca({
  valore,
  onCambia,
  onInvia,
  onPulisci,
  caricamento = false,
  segnaposto = "Cerca",
  maxLength = 100,
  style,
  ...resto
}) {
  const stili = useStili(creaStili);
  const tema = useTema();
  return (
    <View style={[stili.riga, style]}>
      <View style={stili.campo}>
        <TextInput
          value={valore}
          onChangeText={onCambia}
          onSubmitEditing={onInvia}
          placeholder={segnaposto}
          placeholderTextColor={tema.testoSecondario}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
          maxLength={maxLength}
          accessibilityLabel={segnaposto}
          style={stili.testo}
          {...resto}
        />
        {valore.length > 0 && (
          <Pressable onPress={onPulisci} hitSlop={10} accessibilityRole="button" accessibilityLabel="Cancella testo">
            <Testo colore="secondario" style={stili.cancella}>
              ✕
            </Testo>
          </Pressable>
        )}
      </View>
      <Bottone titolo="Cerca" onPress={onInvia} caricamento={caricamento} disabilitato={valore.trim().length < 3} />
    </View>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    riga: { flexDirection: "row", alignItems: "center", gap: spazi.sm },
    campo: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      minHeight: altezzaMinimaTocco,
      paddingHorizontal: spazi.md,
      gap: spazi.sm,
      backgroundColor: t.superficie,
      borderRadius: raggi.md,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    testo: { flex: 1, color: t.testo, fontSize: tipografia.corpo.fontSize, paddingVertical: spazi.sm },
    cancella: { fontSize: 16 },
  });
