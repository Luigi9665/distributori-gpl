import { Pressable, StyleSheet } from "react-native";
import { raggi, spazi, useStili, useTema } from "../theme/tema";
import Testo from "./Testo";

// Pulsante a "pillola" per scegliere un valore (raggio, ordine, ...).
// Occupa una quota uguale della riga (flex: 1), quindi più chip affiancati restano compatti.
export default function Chip({ etichetta, selezionato = false, onPress, style, ...resto }) {
  const stili = useStili(creaStili);
  const tema = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selezionato }}
      accessibilityLabel={etichetta}
      hitSlop={{ top: 6, bottom: 6 }}
      onPress={onPress}
      style={({ pressed }) => [stili.base, selezionato && stili.selezionato, pressed && { opacity: 0.7 }, style]}
      {...resto}
    >
      <Testo
        variante="piccolo"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontSize: 13, fontWeight: "600", color: selezionato ? tema.suPrimario : tema.primario }}
      >
        {etichetta}
      </Testo>
    </Pressable>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    base: {
      flex: 1,
      height: 34,
      paddingHorizontal: spazi.xs,
      borderRadius: raggi.pill,
      borderWidth: 1.5,
      borderColor: t.primario,
      alignItems: "center",
      justifyContent: "center",
    },
    selezionato: { backgroundColor: t.primario },
  });
