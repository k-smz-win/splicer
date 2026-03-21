import { useMemo } from 'react'
import type { Fusion, MapMarker } from '../../types'
import { fetchFusions } from './api'
import { useAsync } from '../../hooks/useAsync'

export function useFusions(projectId?: string) {
  const { data, loading, error } = useAsync(() => fetchFusions(projectId), [projectId])
  return { fusions: data ?? [], loading, error }
}

/**
 * 融着データを MapView が要求する形に変換する Hook。
 * MapView が Fusion 型を直接参照しないよう依存を分離する。
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
