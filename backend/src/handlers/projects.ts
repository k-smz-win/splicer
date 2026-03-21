import { projectService } from '../services/projectService'
import { ok } from '../utils/response'
import { withAuth } from '../middleware/withAuth'

/**
 * GET /api/projects
 *
 * MANAGE_PROJECT 権限を要求する。
 */
export const getProjects = withAuth('MANAGE_PROJECT', async () => {
  return ok(projectService.list())
})
