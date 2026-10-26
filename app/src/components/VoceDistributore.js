import { Pressable, StyleSheet, View } from "react-native";
import { raggi, spazi, useStili } from "../theme/tema";
import { formattaKm, formattaPrezzo } from "../utils/geo";
import Badge from "./Badge";
import Testo from "./Testo";

// Card della lista: marchio e comune, distanza e indirizzo, prezzo.
// La card del più economico ha il bordo verde.
export default function VoceDistributore({ distributore: d, piuEconomico = false, onPress }) {
  const stili = useStili(creaStili);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${d.marchio} ${d.comune}, ${formattaPrezzo(d.prezzoGpl)}, a ${formattaKm(d.km)}`}
      onPress={() => onPress(d)}
      style={({ pressed }) => [stili.card, piuEconomico && stili.evidenziata, pressed && { opacity: 0.7 }]}
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
        <Testo variante="prezzo" colore={piuEconomico ? "primario" : "testo"}>
          {formattaPrezzo(d.prezzoGpl)}
        </Testo>
        {piuEconomico && <Badge testo="Più economico" />}
      </View>
    </Pressable>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spazi.md,
      padding: spazi.md,
      marginBottom: spazi.sm,
      backgroundColor: t.superficie,
      borderRadius: raggi.md,
      borderWidth: 1,
      borderColor: t.bordo,
    },
    evidenziata: { borderColor: t.primario, borderWidth: 1.5 },
    testi: { flex: 1, gap: 2 },
    prezzo: { alignItems: "flex-end", gap: 2 },
  });
