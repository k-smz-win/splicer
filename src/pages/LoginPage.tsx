import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogin } from '../features/auth/hooks'

export function LoginPage() {
  const { t } = useTranslation()
  const { handleLogin, loading, error } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault()
    handleLogin({ email, password })
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">
          {t('auth.loginTitle')}
        </h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{t(`auth.${error}`)}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 text-white rounded py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors"
          >
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>

        {/* 開発用ヒント */}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-400 text-center mb-2">開発用アカウント（password: password）</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-500">
            <span>SYS_ADMIN:</span><span>admin@example.com</span>
            <span>MANAGER:</span><span>manager@example.com</span>
            <span>USER:</span><span>user@example.com</span>
            <span>WORKER:</span><span>worker@example.com</span>
          </div>
        </div>
      </div>
    </div>
  )
}
