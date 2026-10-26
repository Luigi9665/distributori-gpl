import { Pressable, StyleSheet, View } from "react-native";
import { spazi, useStili } from "../theme/tema";
import { formattaKm, formattaPrezzo } from "../utils/geo";
import Badge from "./Badge";
import Testo from "./Testo";

// Riga della lista: marchio e comune, distanza e indirizzo, prezzo.
export default function VoceDistributore({ distributore: d, piuEconomico = false, onPress }) {
  const stili = useStili(creaStili);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${d.marchio} ${d.comune}, ${formattaPrezzo(d.prezzoGpl)}, a ${formattaKm(d.km)}`}
      onPress={() => onPress(d)}
      style={({ pressed }) => [stili.voce, pressed && { opacity: 0.6 }]}
    >
      <View style={stili.testi}>
        <Testo variante="sottotitolo" numberOfLines={1}>
          {d.marchio} · {d.comune}
        </Testo>
        <Testo variante="piccolo" colore="secondario" numberOfLines={1}>
          {formattaKm(d.km)} · {d.indirizzo}
        </Testo>
      </View>
      <View style={stili.prezzo}>
        <Testo variante="prezzo">{formattaPrezzo(d.prezzoGpl)}</Testo>
        {piuEconomico && <Badge testo="Più economico" />}
      </View>
    </Pressable>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    voce: {
      flexDirection: "row",
      alignItems: "center",
      gap: spazi.md,
      paddingVertical: spazi.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.bordo,
    },
    testi: { flex: 1, gap: 2 },
    prezzo: { alignItems: "flex-end", gap: 2 },
  });
