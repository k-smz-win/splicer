import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function AccessDeniedPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-5xl font-bold text-red-400 mb-4">403</p>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{t('error.accessDenied')}</h2>
      <p className="text-gray-500 mb-6">{t('error.accessDeniedDesc')}</p>
      <Link to="/dashboard" className="text-blue-600 underline text-sm">
        {t('error.backToDashboard')}
      </Link>
    </div>
  )
}
