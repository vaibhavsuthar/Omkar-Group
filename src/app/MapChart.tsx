"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapChartProps {
  locations: { label: string; value: number }[];
}

export default function MapChart({ locations }: MapChartProps) {
  // Demo coordinates for some cities
  const cityCoords: Record<string, [number, number]> = {
    // All keys are lowercase for robust matching
    "ahmedabad": [23.0225, 72.5714],
    "gandhinagar": [23.2231, 72.6509],
    "vadodara": [22.3072, 73.1812],
    "surat": [21.1702, 72.8311],
    // New locations from sales data
    "bodakdev": [23.0304, 72.5070],
    "kudasan": [23.2236, 72.6369],
    "maninagar": [22.9956, 72.6031],
    "alkapuri": [22.3150, 73.1807],
    "vesu": [21.1416, 72.7725],
    "isanpur": [22.9787, 72.6186],
    "vejalpur": [23.0067, 72.5162],
    // Fallbacks
    "ishanpur, ahmedabad": [22.9787, 72.6186],
    "unknown": [22.9787, 72.6186],
  };
  // अगर locations खाली है तो डेमो डेटा दिखाएं
  const demoLocations = [
    { label: "Ahmedabad", value: 5_00_00_000 },
    { label: "Gandhinagar", value: 2_50_00_000 },
    { label: "Vadodara", value: 3_00_00_000 },
    { label: "Surat", value: 4_00_00_000 },
    { label: "Ishanpur, Ahmedabad", value: 1_50_00_000 },
  ];
  const showLocations = locations && locations.length > 0 ? locations : demoLocations;
  // Custom building icon for markers
  // Try .jpg if .png is not working
  const buildingIcon = new L.Icon({
    iconUrl: "/building.jpg",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    className: "shadow-lg"
  });
  // Gujarat bounds (approx): [20.1, 68.4] (SW) to [24.7, 74.4] (NE)
  const gujaratBounds: L.LatLngBoundsExpression = [
    [20.1, 68.4], // Southwest
    [24.7, 74.4], // Northeast
  ];
  return (
    <MapContainer
      center={[22.9787, 72.6186]}
      zoom={7}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#18181b" }}
      bounds={gujaratBounds}
      maxBounds={gujaratBounds}
      minZoom={6}
      maxZoom={16}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {showLocations.map((loc, idx) => (
        <Marker key={idx} position={cityCoords[loc.label.toLowerCase()] || cityCoords["unknown"]} icon={buildingIcon}>
          <Popup>
            <span className="font-bold text-indigo-300">{loc.label === "Unknown" ? "Ishanpur, Ahmedabad" : loc.label}</span>
            <br />Sales: {loc.value.toLocaleString()}
            <br />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/building.jpg" alt="Building" className="w-16 h-12 mt-2 rounded shadow" />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
