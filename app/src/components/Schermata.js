import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStili, useTema } from "../theme/tema";

// Su Android alcuni telefoni non comunicano l'altezza della barra dei tasti (Home/Indietro):
// in quel caso si usa un margine minimo, così i comandi in basso restano sempre toccabili.
const MARGINE_MINIMO_BASSO = Platform.OS === "android" ? 48 : 0;
const MARGINE_MINIMO_ALTO = Platform.OS === "android" ? 24 : 0;

// Contenitore di ogni schermata: lascia lo spazio per notch, barra di stato e tasti di sistema.
export default function Schermata({ children, style }) {
  const stili = useStili(creaStili);
  const tema = useTema();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        stili.base,
        {
          paddingTop: Math.max(insets.top, MARGINE_MINIMO_ALTO),
          paddingBottom: Math.max(insets.bottom, MARGINE_MINIMO_BASSO),
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      <StatusBar style={tema.scuro ? "light" : "dark"} />
      {children}
    </View>
  );
}

const creaStili = (t) => StyleSheet.create({ base: { flex: 1, backgroundColor: t.sfondo } });
