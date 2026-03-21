import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { PermissionGate } from '../components/PermissionGate'
import { Permission } from '../constants/permissions'
import { PageTitle } from '../components/ui/PageTitle'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div>
      <PageTitle>{t('dashboard.title')}</PageTitle>
      <p className="text-gray-600 mb-6">
        {t('dashboard.welcome', { name: user?.name })}　／　{t('dashboard.role')}: {user?.role}
      </p>

      {/* 権限別カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PermissionGate permission={Permission.MANAGE_PROJECT}>
          <DashboardCard title={t('nav.projects')} desc={t('dashboard.projectsDesc')} to="/projects" />
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_FUSION}>
          <DashboardCard title={t('nav.fusion')} desc={t('dashboard.fusionDesc')} to="/fusion" />
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_MAP}>
          <DashboardCard title={t('nav.map')} desc={t('dashboard.mapDesc')} to="/map" />
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_USER}>
          <DashboardCard title={t('nav.users')} desc={t('dashboard.usersDesc')} to="#" />
        </PermissionGate>
      </div>
    </div>
  )
}

function DashboardCard({ title, desc, to }: { title: string; desc: string; to: string }) {
  return (
    <Link
      to={to}
      className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-blue-400 hover:shadow transition-all"
    >
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </Link>
  )
}
