import { randomUUID } from 'crypto'
import type { Company, CompanyType, ResolvedUser } from '../models/types'
import type { ICompanyRepository } from '../repositories/ICompanyRepository'
import { InMemoryCompanyRepository } from '../repositories/inMemoryCompanyRepository'

/**
 * 会社サービス。
 *
 * ビジネスロジックを担当。Repository 経由でデータを操作する。
 * PostgreSQL 実装に切り替える場合は repository の差し替えのみでよい。
 *
 * 権限チェックはここで行う。handler は認証（誰か）を解決し、
 * このサービスが認可（何ができるか）を判定する。
 */

// TODO: DI コンテナを導入する場合はここを差し替える
const repository: ICompanyRepository = new InMemoryCompanyRepository()

export interface CreateCompanyInput {
  name: string
  type: CompanyType
  parentId: string | null
}

/**
 * 会社を作成する。
 *
 * 権限チェック:
 * - SYS_ADMIN: 任意の会社を作成可能
 * - MANAGER以下: 自分の会社の配下にのみ作成可能
 *
 * @throws {Error} 'forbidden' - 権限不足
 * @throws {Error} 'parent_not_found' - 指定した親会社が存在しない
 */
export async function createCompany(
  input: CreateCompanyInput,
  actor: ResolvedUser,
): Promise<Company> {
  // 親会社が存在するか確認
  if (input.parentId) {
    const parent = await repository.findById(input.parentId)
    if (!parent) throw new Error('parent_not_found')

    // SYS_ADMIN 以外は自分の配下にのみ作成可能
    if (actor.role !== 'SYS_ADMIN') {
      const allowed = await repository.isAncestorOrSelf(actor.companyId, input.parentId)
      if (!allowed) throw new Error('forbidden')
    }
  } else {
    // ルート会社（parent_id=null）作成は SYS_ADMIN のみ
    if (actor.role !== 'SYS_ADMIN') throw new Error('forbidden')
  }

  const company: Company = {
    id: randomUUID(),
    name: input.name,
    type: input.type,
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
  }

  await repository.save(company)
  return company
}

/**
 * 指定会社の配下（子孫）を返す。
 *
 * 権限チェック:
 * - SYS_ADMIN: 任意の会社の配下を取得可能
 * - それ以外: 自分の会社が対象会社の祖先（または同一）であることを確認
 *
 * @throws {Error} 'not_found' - 対象会社が存在しない
 * @throws {Error} 'forbidden' - 権限不足
 */
export async function getDescendants(
  companyId: string,
  actor: ResolvedUser,
): Promise<Company[]> {
  const target = await repository.findById(companyId)
  if (!target) throw new Error('not_found')

  if (actor.role !== 'SYS_ADMIN') {
    const allowed = await repository.isAncestorOrSelf(actor.companyId, companyId)
    if (!allowed) throw new Error('forbidden')
  }

  return repository.findDescendants(companyId)
}

/**
 * 指定会社の祖先（親・親の親...）を返す。
 *
 * 権限チェック:
 * - SYS_ADMIN: 任意の会社の祖先を取得可能
 * - それ以外: 自分の会社が対象会社の祖先（または同一）であることを確認
 *
 * @throws {Error} 'not_found' - 対象会社が存在しない
 * @throws {Error} 'forbidden' - 権限不足
 */
export async function getAncestors(
  companyId: string,
  actor: ResolvedUser,
): Promise<Company[]> {
  const target = await repository.findById(companyId)
  if (!target) throw new Error('not_found')

  if (actor.role !== 'SYS_ADMIN') {
    const allowed = await repository.isAncestorOrSelf(actor.companyId, companyId)
    if (!allowed) throw new Error('forbidden')
  }

  return repository.findAncestors(companyId)
}

/**
 * ログインユーザーの会社配下を返す（GET /companies/me/descendants）。
 * companyId は actor.companyId を使用する。権限チェック不要（自分自身のため）。
 */
export async function getMyDescendants(actor: ResolvedUser): Promise<Company[]> {
  return repository.findDescendants(actor.companyId)
}

export const companyService = {
  createCompany,
  getDescendants,
  getAncestors,
  getMyDescendants,
}
