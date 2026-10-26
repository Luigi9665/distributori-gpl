import { StyleSheet, View } from "react-native";
import { raggi, spazi, useStili, useTema } from "../theme/tema";
import Testo from "./Testo";

// Etichetta piccola, per esempio "Più economico".
export default function Badge({ testo, style }) {
  const stili = useStili(creaStili);
  const tema = useTema();
  return (
    <View style={[stili.base, style]}>
      <Testo variante="piccolo" style={{ color: tema.suPrimario, fontWeight: "700" }}>
        {testo}
      </Testo>
    </View>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    base: {
      backgroundColor: t.primario,
      borderRadius: raggi.pill,
      paddingHorizontal: spazi.sm,
      paddingVertical: 2,
      alignSelf: "flex-start",
    },
  });
