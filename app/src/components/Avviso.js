import { Pressable, StyleSheet, View } from "react-native";
import { raggi, spazi, useStili, useTema } from "../theme/tema";
import Testo from "./Testo";

// Riquadro giallo di avviso. Se passi onPress diventa toccabile.
export default function Avviso({ testo, onPress, style }) {
  const stili = useStili(creaStili);
  const tema = useTema();
  const Contenitore = onPress ? Pressable : View;
  return (
    <Contenitore
      onPress={onPress}
      accessibilityRole={onPress ? "button" : "alert"}
      style={[stili.base, style]}
    >
      <Testo variante="piccolo" style={{ color: tema.avvisoTesto }}>
        {testo}
      </Testo>
    </Contenitore>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    base: { backgroundColor: t.avvisoSfondo, borderRadius: raggi.sm, padding: spazi.sm },
  });
