import { NavLink } from 'react-router-dom'

type Props = {
  to: string
  label: string
}

/** サイドバー用ナビゲーションリンク。現在のページはハイライト表示する。 */
export function NavItem({ to, label }: Props) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? 'block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-r-md'
          : 'block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-r-md transition-colors'
      }
    >
      {label}
    </NavLink>
  )
}
