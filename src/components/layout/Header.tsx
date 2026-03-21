import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import { TextButton } from '../ui/Button'

/** アプリケーションヘッダー。タイトル・ユーザー名・言語切替・ログアウトを含む。 */
export function Header() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === 'ja' ? 'en' : 'ja')
  }

  return (
    <header className="bg-blue-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/dashboard" className="font-bold text-lg tracking-wide">
          {t('app.title')}
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="opacity-80">{user?.name}</span>
          <TextButton onClick={toggleLang}>
            {i18n.language === 'ja' ? 'EN' : 'JP'}
          </TextButton>
          <TextButton onClick={handleLogout}>
            {t('common.logout')}
          </TextButton>
        </div>
      </div>
    </header>
  )
}
