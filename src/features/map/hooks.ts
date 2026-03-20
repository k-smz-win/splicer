import { useMemo } from 'react'
import type { Fusion, MapMarker } from '../../types'

/**
 * 融着データを `MapView` が要求する形に変換する Hook。
 * `MapView` が `Fusion` 型を直接参照しないよう依存を分離するために map 層に置く。
 */
export function useFusionMarkers(fusions: Fusion[]): MapMarker[] {
  return useMemo(
    () =>
      fusions.map((f) => ({
        id: f.id,
        name: f.name,
        lat: f.lat,
        lng: f.lng,
        info: `${f.workerName} / ${f.status}`,
      })),
    [fusions]
  )
}
