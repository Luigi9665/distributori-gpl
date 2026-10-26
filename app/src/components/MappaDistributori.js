import { forwardRef } from "react";
import MapView, { Marker } from "react-native-maps";
import { formattaPrezzo } from "../utils/geo";

// Mappa con i distributori. Il segnaposto verde è il più economico, il blu quello scelto,
// il viola il punto di ricerca. Il ref permette al genitore di spostare la mappa (animateToRegion).
// La mappa si ricrea quando cambia il centro o il raggio, così si inquadra la zona giusta.
const MappaDistributori = forwardRef(function MappaDistributori(
  { centro, raggioKm, distributori, idPiuEconomico, idSelezionato, puntoRicerca, onSeleziona, style },
  ref
) {
  const delta = (raggioKm / 111) * 2.2; // 1° di latitudine ≈ 111 km
  return (
    <MapView
      ref={ref}
      style={style}
      showsUserLocation
      initialRegion={{ latitude: centro.lat, longitude: centro.lon, latitudeDelta: delta, longitudeDelta: delta }}
      key={`${raggioKm}-${centro.lat}-${centro.lon}`}
    >
      {puntoRicerca && (
        <Marker
          coordinate={{ latitude: puntoRicerca.lat, longitude: puntoRicerca.lon }}
          title={puntoRicerca.etichetta}
          pinColor="violet"
        />
      )}
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
