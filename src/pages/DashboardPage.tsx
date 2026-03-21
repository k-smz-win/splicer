import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { PermissionGate } from '../components/PermissionGate'
import { Permission } from '../constants/permissions'
import { PageTitle } from '../components/ui/PageTitle'
import { DashboardCard } from '../components/ui/DashboardCard'

export function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()

  return (
    <div>
      <PageTitle>{t('dashboard.title')}</PageTitle>
      <p className="text-gray-600 mb-6">
        {t('dashboard.welcome', { name: user?.name })}　／　{t('dashboard.role')}: {user?.role}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PermissionGate permission={Permission.MANAGE_PROJECT}>
          <Link to="/projects" className="group block">
            <DashboardCard
              title={t('nav.projects')}
              desc={t('dashboard.projectsDesc')}
            />
          </Link>
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_FUSION}>
          <Link to="/fusion" className="block">
            <DashboardCard
              title={t('nav.fusion')}
              desc={t('dashboard.fusionDesc')}
              className="hover:border-blue-400 hover:shadow"
            />
          </Link>
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_MAP}>
          <Link to="/map" className="block">
            <DashboardCard
              title={t('nav.map')}
              desc={t('dashboard.mapDesc')}
              className="hover:border-blue-400 hover:shadow"
            />
          </Link>
        </PermissionGate>

        <PermissionGate permission={Permission.VIEW_USER}>
          <Link to="#" className="block">
            <DashboardCard
              title={t('nav.users')}
              desc={t('dashboard.usersDesc')}
              className="hover:border-blue-400 hover:shadow"
            />
          </Link>
        </PermissionGate>
      </div>
    </div>
  )
}
