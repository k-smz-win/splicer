import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLogin } from '../features/auth/hooks'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { FormField } from '../components/ui/FormField'

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
      <Card className="p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-800 mb-6 text-center">
          {t('auth.loginTitle')}
        </h1>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormField
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="admin@example.com"
          />

          <FormField
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-600 text-sm text-center">{t(`auth.${error}`)}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.loginButton')}
          </Button>
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
      </Card>
    </div>
  )
}
