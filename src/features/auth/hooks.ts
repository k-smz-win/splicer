import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { login as apiLogin } from './api'
import type { LoginCredentials } from './types'

/**
 * ログイン処理を `LoginPage` から切り離すための Hook。
 * API 呼び出し・Context 更新・ナビゲーションを集約し、
 * `LoginPage` がロジックを持たないページにとどまれるようにする。
 */
export function useLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)
    try {
      const { user, permissions } = await apiLogin(credentials)
      login(user, permissions)
      navigate('/dashboard')
    } catch {
      setError('invalidCredentials')
    } finally {
      setLoading(false)
    }
  }

  return { handleLogin, loading, error }
}
