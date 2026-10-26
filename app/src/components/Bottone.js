import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { altezzaMinimaTocco, raggi, spazi, tipografia, useStili, useTema } from "../theme/tema";
import Testo from "./Testo";

// Pulsante generico.
// variante: primario (pieno) | secondario (contorno) | testo (solo scritta)
// dimensione: normale | piccolo      pienaLarghezza: occupa tutta la riga
// Le altre props (accessibilityLabel, testID, ...) passano a <Pressable>.
export default function Bottone({
  titolo,
  onPress,
  variante = "primario",
  dimensione = "normale",
  disabilitato = false,
  caricamento = false,
  pienaLarghezza = false,
  style,
  ...resto
}) {
  const stili = useStili(creaStili);
  const tema = useTema();
  const inattivo = disabilitato || caricamento;
  const coloreTesto = variante === "primario" ? tema.suPrimario : tema.primario;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inattivo, busy: caricamento }}
      accessibilityLabel={titolo}
      hitSlop={6}
      onPress={inattivo ? undefined : onPress}
      style={({ pressed }) => [
        stili.base,
        stili[variante],
        dimensione === "piccolo" && stili.piccolo,
        pienaLarghezza && stili.piena,
        pressed && !inattivo && stili.premuto,
        inattivo && stili.inattivo,
        style,
      ]}
      {...resto}
    >
      {caricamento ? (
        <ActivityIndicator color={coloreTesto} />
      ) : (
        <Testo
          variante="corpo"
          style={[{ color: coloreTesto, fontWeight: "600" }, dimensione === "piccolo" && { fontSize: tipografia.piccolo.fontSize + 1 }]}
          numberOfLines={1}
        >
          {titolo}
        </Testo>
      )}
    </Pressable>
  );
}

const creaStili = (t) =>
  StyleSheet.create({
    base: {
      minHeight: altezzaMinimaTocco,
      paddingHorizontal: spazi.lg,
      borderRadius: raggi.md,
      alignItems: "center",
      justifyContent: "center",
    },
    piccolo: { minHeight: 36, paddingHorizontal: spazi.md },
    piena: { alignSelf: "stretch" },
    primario: { backgroundColor: t.primario },
    secondario: { borderWidth: 1.5, borderColor: t.primario, backgroundColor: "transparent" },
    testo: { backgroundColor: "transparent" },
    premuto: { opacity: 0.7 },
    inattivo: { opacity: 0.4 },
  });
