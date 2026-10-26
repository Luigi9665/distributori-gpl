import { useMemo } from "react";
import { useColorScheme } from "react-native";

// Misure comuni: usale al posto di numeri sparsi nel codice.
export const spazi = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const raggi = { sm: 8, md: 12, pill: 999 };
export const altezzaMinimaTocco = 44; // misura minima consigliata per un'area toccabile

const chiaro = {
  scuro: false,
  sfondo: "#f5f7f6",
  superficie: "#ffffff",
  testo: "#111827",
  testoSecondario: "#5b6470",
  bordo: "#e2e6e4",
  primario: "#0a7f55",
  suPrimario: "#ffffff",
  primarioLieve: "#e3f4ec",
  avvisoSfondo: "#fff3cd",
  avvisoTesto: "#664d03",
  errore: "#b3261e",
};

const scuro = {
  scuro: true,
  sfondo: "#0e1210",
  superficie: "#181d1a",
  testo: "#f2f4f3",
  testoSecondario: "#a4adaa",
  bordo: "#2a322e",
  primario: "#2fd48a",
  suPrimario: "#06281a",
  primarioLieve: "#173326",
  avvisoSfondo: "#3d3210",
  avvisoTesto: "#ffe69c",
  errore: "#f2b8b5",
};

export const tipografia = {
  titolo: { fontSize: 24, fontWeight: "700", lineHeight: 30 },
  sottotitolo: { fontSize: 17, fontWeight: "600", lineHeight: 22 },
  corpo: { fontSize: 15, fontWeight: "400", lineHeight: 21 },
  piccolo: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
  prezzo: { fontSize: 17, fontWeight: "700", lineHeight: 22 },
  prezzoGrande: { fontSize: 30, fontWeight: "700", lineHeight: 36 },
};

// Tema attuale (chiaro o scuro, come il telefono).
export function useTema() {
  const modo = useColorScheme();
  return modo === "dark" ? scuro : chiaro;
}

// Crea gli stili di un componente e li ricalcola solo quando cambia il tema.
// `crea` va definita fuori dal componente: (tema) => StyleSheet.create({...})
export function useStili(crea) {
  const tema = useTema();
  return useMemo(() => crea(tema), [tema, crea]);
}
