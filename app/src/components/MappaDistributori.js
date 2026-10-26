import { forwardRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { formattaPrezzo } from "../utils/geo";

// Mappa con i distributori. Il segnaposto verde è il più economico, il blu quello scelto.
// Il ref permette al genitore di spostare la mappa (animateToRegion).
const MappaDistributori = forwardRef(function MappaDistributori(
  { centro, raggioKm, distributori, idPiuEconomico, idSelezionato, onSeleziona, style },
  ref
) {
  const delta = (raggioKm / 111) * 2.2; // 1° di latitudine ≈ 111 km
  return (
    <MapView
      ref={ref}
      style={style}
      showsUserLocation
      initialRegion={{ latitude: centro.lat, longitude: centro.lon, latitudeDelta: delta, longitudeDelta: delta }}
      key={raggioKm}
    >
      {distributori.map((d) => (
        <Marker
          key={d.id}
          coordinate={{ latitude: d.lat, longitude: d.lon }}
          title={`${formattaPrezzo(d.prezzoGpl)} · ${d.nome}`}
          pinColor={d.id === idPiuEconomico ? "green" : d.id === idSelezionato ? "blue" : "red"}
          onPress={() => onSeleziona(d)}
        />
      ))}
    </MapView>
  );
});

export default MappaDistributori;
