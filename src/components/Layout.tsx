import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Permission } from '../constants/permissions'
import { PermissionGate } from './PermissionGate'

export function Layout() {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-bold text-lg tracking-wide">
            {t('app.title')}
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-80">{user?.name}</span>
            <button onClick={toggleLang} className="underline opacity-80 hover:opacity-100">
              {i18n.language === 'ja' ? 'EN' : 'JP'}
            </button>
            <button onClick={handleLogout} className="underline opacity-80 hover:opacity-100">
              {t('common.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-6xl w-full mx-auto">
        {/* サイドナビ */}
        <nav className="w-48 bg-white border-r border-gray-200 py-6 flex flex-col gap-1 text-sm shrink-0">
          <NavItem to="/dashboard" label={t('nav.dashboard')} />
          <PermissionGate permission={Permission.MANAGE_PROJECT}>
            <NavItem to="/projects" label={t('nav.projects')} />
          </PermissionGate>
          <PermissionGate permission={Permission.VIEW_FUSION}>
            <NavItem to="/fusion" label={t('nav.fusion')} />
          </PermissionGate>
          <PermissionGate permission={Permission.VIEW_MAP}>
            <NavItem to="/map" label={t('nav.map')} />
          </PermissionGate>
        </nav>

        {/* メインコンテンツ */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-r-md transition-colors"
    >
      {label}
    </Link>
  )
}
