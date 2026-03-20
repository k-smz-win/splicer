/** localStorage のキー。アプリ全体で一意になるよう名前空間を含める。 */
const TOKEN_KEY = 'fusion_splicer_auth_token'

/**
 * JWT の読み書きを localStorage に対して行う薄いラッパー。
 *
 * 呼び出し元: loginApi（書き込み）/ AuthContext.logout（削除）/ API クライアント（読み取り）
 * Cognito 移行時は get() を Amplify の getAccessToken() 等に差し替える。
 */
export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => { localStorage.setItem(TOKEN_KEY, token) },
  clear: (): void => { localStorage.removeItem(TOKEN_KEY) },
}
