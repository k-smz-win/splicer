import type { APIGatewayProxyEvent } from 'aws-lambda'

/** Lambda + API Gateway プロキシ統合のレスポンス共通ヘッダー。 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
} as const

export const ok = (data: unknown) => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(data),
})

export const badRequest = (message: string) => ({
  statusCode: 400,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
})

export const unauthorized = (message = 'unauthorized') => ({
  statusCode: 401,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
})

export const forbidden = (message = 'forbidden') => ({
  statusCode: 403,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
})

export const internalError = (message = 'internal_error') => ({
  statusCode: 500,
  headers: CORS_HEADERS,
  body: JSON.stringify({ error: message }),
})

/** Authorization ヘッダーから Bearer トークンを抽出する。大文字・小文字どちらも対応。 */
export function extractBearerToken(event: APIGatewayProxyEvent): string | null {
  const auth = event.headers?.['Authorization'] ?? event.headers?.['authorization']
  if (!auth?.startsWith('Bearer ')) return null
  return auth.slice(7)
}
