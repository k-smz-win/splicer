import { Role } from '../constants/roles'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Project {
  id: string
  name: string
  description: string
  /** UTC ISO 8601 */
  createdAt: string
}

/**
 * 融着作業の1件分のデータ。
 * 地図表示など他機能への流用を容易にするため、意図的にフラット構造を維持する。
 * ネストが必要になった場合は型定義の変更ではなく、変換層（hooks 等）で対応する。
 */
export interface Fusion {
  id: string
  projectId: string
  name: string
  status: 'SUCCESS' | 'FAIL'
  workerName: string
  /** UTC ISO 8601 */
  startedAt: string
  /** UTC ISO 8601 */
  finishedAt: string
  lat: number
  lng: number
  /** UTC ISO 8601 */
  createdAt: string
}

/**
 * 地図表示専用の軽量マーカー型。
 * `Fusion` などのドメイン型を `MapView` が直接参照しないよう、表示層で変換して使う。
 */
export interface MapMarker {
  id: string
  name: string
  lat: number
  lng: number
  info?: string
}
