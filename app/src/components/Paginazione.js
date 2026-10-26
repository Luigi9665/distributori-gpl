import { StyleSheet, View } from "react-native";
import { spazi, useStili } from "../theme/tema";
import Bottone from "./Bottone";
import Testo from "./Testo";

// Comandi di paginazione riutilizzabili per qualsiasi elenco.
// pagina parte da 0. onCambia(nuovaPagina) viene chiamata al tocco.
export default function Paginazione({ pagina, totale, perPagina, onCambia }) {
  const stili = useStili(creaStili);
  const totalePagine = Math.max(1, Math.ceil(totale / perPagina));
  const corrente = Math.min(pagina, totalePagine - 1);
  const da = totale === 0 ? 0 : corrente * perPagina + 1;
  const a = Math.min((corrente + 1) * perPagina, totale);
  const primaPagina = corrente === 0;
  const ultimaPagina = corrente >= totalePagine - 1;

  return (
    <View style={stili.contenitore}>
      <Testo variante="piccolo" colore="secondario" style={stili.centrato}>
        {da}–{a} di {totale} · Pagina {corrente + 1} di {totalePagine}
      </Testo>
      <View style={stili.riga}>
        <Bottone titolo="«" variante="secondario" dimensione="piccolo" accessibilityLabel="Prima pagina"
          disabilitato={primaPagina} onPress={() => onCambia(0)} style={stili.stretto} />
        <Bottone titolo="Precedente" variante="secondario" dimensione="piccolo" accessibilityLabel="Pagina precedente"
          disabilitato={primaPagina} onPress={() => onCambia(corrente - 1)} style={stili.largo} />
        <Bottone titolo="Successiva" variante="secondario" dimensione="piccolo" accessibilityLabel="Pagina successiva"
          disabilitato={ultimaPagina} onPress={() => onCambia(corrente + 1)} style={stili.largo} />
        <Bottone titolo="»" variante="secondario" dimensione="piccolo" accessibilityLabel="Ultima pagina"
          disabilitato={ultimaPagina} onPress={() => onCambia(totalePagine - 1)} style={stili.stretto} />
      </View>
    </View>
  );
}

const creaStili = () =>
  StyleSheet.create({
    contenitore: { gap: spazi.xs, paddingVertical: spazi.sm },
    centrato: { textAlign: "center" },
    riga: { flexDirection: "row", gap: spazi.xs },
    largo: { flex: 3, paddingHorizontal: spazi.xs },
    stretto: { flex: 1, paddingHorizontal: spazi.xs },
  });
