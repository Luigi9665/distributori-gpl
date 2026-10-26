import { Linking, Platform } from "react-native";

// Apre l'app mappe con le indicazioni verso un punto.
// Usa solo coordinate numeriche già validate e codifica il nome.
export async function apriNavigazione({ lat, lon, nome }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  const etichetta = encodeURIComponent(String(nome || "Distributore").slice(0, 60));
  const web = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const nativo =
    Platform.OS === "ios"
      ? `maps://?daddr=${lat},${lon}&q=${etichetta}`
      : `geo:${lat},${lon}?q=${lat},${lon}(${etichetta})`;
  try {
    await Linking.openURL(nativo);
    return true;
  } catch (e) {
    try {
      await Linking.openURL(web);
      return true;
    } catch (e2) {
      return false;
    }
  }
}
