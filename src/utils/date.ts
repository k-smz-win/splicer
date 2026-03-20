import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

// ローカルタイムゾーン（環境依存）
const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * UTC で保持された日時文字列をブラウザのローカルタイムゾーンで表示用に変換する。
 * サーバー通信・DB 保存は UTC で統一し、表示時のみ変換する設計に基づく。
 *
 * @param utcIso UTC ISO 8601 文字列（例: `"2025-04-01T01:00:00Z"`）
 * @param fmt dayjs フォーマット文字列。省略時は `"YYYY/MM/DD HH:mm"`
 * @returns ローカルタイムゾーンに変換・フォーマットされた文字列
 */
export function formatLocal(utcIso: string, fmt = 'YYYY/MM/DD HH:mm'): string {
  return dayjs.utc(utcIso).tz(LOCAL_TZ).format(fmt)
}

/**
 * 新規レコードの日時フィールド生成に使用する UTC 文字列を返す。
 * サーバー送信・DB 保存で UTC を統一する設計に基づく。
 *
 * @returns UTC ISO 8601 文字列（例: `"2025-04-01T01:00:00.000Z"`）
 */
export function nowUtc(): string {
  return dayjs.utc().toISOString()
}

/**
 * UTC 日時を基準に相対時間表記を返す。`formatLocal` と同じ UTC 統一方針に基づく。
 *
 * @param utcIso UTC ISO 8601 文字列
 * @returns ローカルタイムゾーンを基準にした相対時間文字列（例: `"3分前"`）
 */
export function fromNow(utcIso: string): string {
  return dayjs.utc(utcIso).tz(LOCAL_TZ).fromNow()
}
