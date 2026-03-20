import { SEED_PROJECTS } from '../data/seed'
import type { ProjectRecord } from '../models/types'

/**
 * @remarks
 * 現在はインメモリデータを返す。DB 移行時はこの関数のみを差し替える。
 */
function list(): ProjectRecord[] {
  return SEED_PROJECTS
}

export const projectService = { list }
