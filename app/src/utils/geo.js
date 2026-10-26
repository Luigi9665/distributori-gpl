// Distanza in km tra due punti (formula di Haversine).
export function distanzaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Formati per la visualizzazione: "0,749 €/l" e "3,4 km".
export function formattaPrezzo(prezzo) {
  return `${prezzo.toFixed(3).replace(".", ",")} €/l`;
}

export function formattaKm(km) {
  return `${km.toFixed(1).replace(".", ",")} km`;
}
