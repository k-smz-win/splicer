import { randomUUID } from 'crypto'
import type { Company, CompanyClosure } from '../models/types'
import type { ICompanyRepository } from './ICompanyRepository'

/**
 * InMemory 会社リポジトリ。
 *
 * PostgreSQL の Closure table と同等のロジックをメモリ上で再現する。
 * 動作確認・ローカル開発用。本番では PostgreSQLCompanyRepository に差し替える。
 *
 * Closure table 更新ロジック（会社作成時）:
 *   1. 自己参照を追加: (newId, newId, 0)
 *   2. 親の祖先経路をコピー: parent の ancestor 全行を depth+1 で追加
 *
 * これにより、再帰SQL不要で任意の深さの子孫・祖先を O(1) クエリで取得できる。
 */
export class InMemoryCompanyRepository implements ICompanyRepository {
  private companies: Map<string, Company> = new Map()
  private closures: CompanyClosure[] = []

  async save(company: Company): Promise<void> {
    // id が未設定なら UUID を自動生成
    const id = company.id || randomUUID()
    const record: Company = { ...company, id }
    this.companies.set(id, record)

    // --- Closure table 更新 ---

    // 1. 自己参照（depth=0）
    this.closures.push({ ancestorId: id, descendantId: id, depth: 0 })

    // 2. 親の祖先経路をコピーして depth+1 で追加
    if (record.parentId) {
      const parentAncestors = this.closures.filter(
        (c) => c.descendantId === record.parentId,
      )
      for (const row of parentAncestors) {
        this.closures.push({
          ancestorId: row.ancestorId,
          descendantId: id,
          depth: row.depth + 1,
        })
      }
    }
  }

  async findById(id: string): Promise<Company | null> {
    return this.companies.get(id) ?? null
  }

  async findDescendants(companyId: string, includeRoot = false): Promise<Company[]> {
    const depthThreshold = includeRoot ? 0 : 1
    const descendantIds = this.closures
      .filter((c) => c.ancestorId === companyId && c.depth >= depthThreshold)
      .sort((a, b) => a.depth - b.depth)
      .map((c) => c.descendantId)

    return descendantIds
      .map((id) => this.companies.get(id))
      .filter((c): c is Company => c !== undefined)
  }

  async findAncestors(companyId: string, includeRoot = false): Promise<Company[]> {
    const depthThreshold = includeRoot ? 0 : 1
    const ancestorRows = this.closures
      .filter((c) => c.descendantId === companyId && c.depth >= depthThreshold)
      .sort((a, b) => a.depth - b.depth)  // depth昇順（直近の親が先）

    return ancestorRows
      .map((row) => this.companies.get(row.ancestorId))
      .filter((c): c is Company => c !== undefined)
  }

  async isAncestorOrSelf(ancestorId: string, descendantId: string): Promise<boolean> {
    return this.closures.some(
      (c) => c.ancestorId === ancestorId && c.descendantId === descendantId,
    )
  }
}

// =========================================
// 参考: PostgreSQL 実装のクエリイメージ
// =========================================
//
// [save] 会社作成時の Closure table 更新:
//   INSERT INTO company_closure (ancestor_id, descendant_id, depth)
//   VALUES ($newId, $newId, 0)               -- 自己参照
//   UNION ALL
//   SELECT ancestor_id, $newId, depth + 1   -- 親の経路コピー
//   FROM company_closure
//   WHERE descendant_id = $parentId;
//
// [findDescendants]
//   SELECT c.* FROM company c
//   JOIN company_closure cc ON c.id = cc.descendant_id
//   WHERE cc.ancestor_id = $companyId AND cc.depth > 0
//   ORDER BY cc.depth;
//
// [findAncestors]
//   SELECT c.* FROM company c
//   JOIN company_closure cc ON c.id = cc.ancestor_id
//   WHERE cc.descendant_id = $companyId AND cc.depth > 0
//   ORDER BY cc.depth;
//
// [isAncestorOrSelf]
//   SELECT EXISTS(
//     SELECT 1 FROM company_closure
//     WHERE ancestor_id = $ancestorId AND descendant_id = $descendantId
//   );
