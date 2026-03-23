import type { Company } from '../models/types'

/**
 * 会社リポジトリのインターフェース。
 *
 * 現在は InMemory 実装のみ。
 * PostgreSQL 実装に差し替える際はこのインターフェースを実装するだけでよい。
 */
export interface ICompanyRepository {
  /**
   * 会社を保存し、Closure table を更新する。
   * 自己参照（depth=0）と、親の経路コピー（depth+1）をまとめて登録する。
   */
  save(company: Company): Promise<void>

  findById(id: string): Promise<Company | null>

  /**
   * 指定会社の配下（子孫）を返す。
   * depth > 0 の closure レコードを使うため再帰SQL不要。
   *
   * @param includeRoot  true の場合、指定会社自身も含む（depth=0 を含む）
   */
  findDescendants(companyId: string, includeRoot?: boolean): Promise<Company[]>

  /**
   * 指定会社の祖先（親・親の親...）を返す。depth 昇順（直近の親が先）。
   *
   * @param includeRoot  true の場合、指定会社自身も含む
   */
  findAncestors(companyId: string, includeRoot?: boolean): Promise<Company[]>

  /**
   * ancestorId が descendantId の祖先（または同一）かどうかを返す。
   * 権限チェック（「自分の配下の会社か？」の判定）に使用する。
   */
  isAncestorOrSelf(ancestorId: string, descendantId: string): Promise<boolean>
}
