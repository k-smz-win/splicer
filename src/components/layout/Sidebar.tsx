import { useTranslation } from 'react-i18next'
import { Permission } from '../../constants/permissions'
import { PermissionGate } from '../PermissionGate'
import { NavItem } from '../ui/NavItem'

/** サイドバーナビゲーション。権限に応じてメニュー項目を表示する。 */
export function Sidebar() {
  const { t } = useTranslation()

  return (
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
  )
}
