import { fusionService } from '../services/fusionService'
import { ok } from '../utils/response'
import { withAuth } from '../middleware/withAuth'

/**
 * GET /api/fusion
 *
 * VIEW_FUSION 権限を要求する。
 * クエリパラメータ projectId で絞り込み可能。
 * 日時はすべて UTC ISO 8601 で返す。ローカル変換はフロントの utils/date.ts が担う。
 */
export const getFusion = withAuth('VIEW_FUSION', async (event) => {
  const projectId = event.queryStringParameters?.projectId ?? undefined
  return ok(fusionService.list(projectId))
})
