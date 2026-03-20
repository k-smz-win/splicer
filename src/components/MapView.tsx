import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { MapMarker } from '../types'

// Leaflet デフォルトアイコンのパス修正（Vite環境）
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
}

/**
 * 表示専用の地図コンポーネント
 * ロジックは持たず、markers を受け取って表示するだけ
 */
export function MapView({ markers, center = [35.689, 139.692], zoom = 12 }: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%', minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{marker.name}</p>
              {marker.info && <p className="text-gray-600 mt-1">{marker.info}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
