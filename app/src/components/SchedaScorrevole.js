import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { StyleSheet } from "react-native";
import { raggi, spazi, useStili, useTema } from "../theme/tema";

// Scheda che si trascina dal basso sopra il contenuto (come in Google Maps).
// Va messa dentro un contenitore che ne definisce l'area (es. sopra la mappa).
// snapPoints: altezze in cui si ferma, es. ["22%", "50%", "92%"]. indiceIniziale: quale usare all'apertura.
// Il ref espone snapToIndex(n), expand(), collapse().
const SchedaScorrevole = forwardRef(function SchedaScorrevole(
  { snapPoints, indiceIniziale = 1, children, contenutoStyle },
  ref
) {
  const stili = useStili(creaStili);
  const tema = useTema();
  return (
    <BottomSheet
      ref={ref}
      index={indiceIniziale}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      backgroundStyle={stili.sfondo}
      handleIndicatorStyle={{ backgroundColor: tema.bordo, width: 40 }}
    >
      <BottomSheetScrollView contentContainerStyle={[stili.contenuto, contenutoStyle]}>
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

export default SchedaScorrevole;

const creaStili = (t) =>
  StyleSheet.create({
    sfondo: {
      backgroundColor: t.sfondo,
      borderTopLeftRadius: raggi.lg,
      borderTopRightRadius: raggi.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.bordo,
    },
    contenuto: { paddingHorizontal: spazi.lg, paddingBottom: spazi.xl },
  });
