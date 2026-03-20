import { SEED_FUSIONS } from '../data/seed'
import type { FusionRecord } from '../models/types'

/**
 * @remarks
 * 現在はインメモリデータを返す。DB 移行時はこの関数のみを差し替える。
 *
 * @param projectId 指定した場合そのプロジェクトの融着データのみを返す
 */
function list(projectId?: string): FusionRecord[] {
  if (projectId) return SEED_FUSIONS.filter((f) => f.projectId === projectId)
  return SEED_FUSIONS
}

export const fusionService = { list }
