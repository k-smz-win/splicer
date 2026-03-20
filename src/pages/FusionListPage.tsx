import { useTranslation } from 'react-i18next'
import { useFusions } from '../features/fusion/hooks'
import { formatLocal } from '../utils/date'

export function FusionListPage() {
  const { t } = useTranslation()
  const { fusions, loading, error } = useFusions()

  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error) return <p className="text-red-500">{t('common.error')}</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('fusion.title')}</h2>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('fusion.name')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('fusion.status')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('fusion.workerName')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('fusion.startedAt')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('fusion.finishedAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fusions.map((f) => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={f.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">{f.workerName}</td>
                <td className="px-4 py-3 text-gray-500">{formatLocal(f.startedAt)}</td>
                <td className="px-4 py-3 text-gray-500">{formatLocal(f.finishedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: 'SUCCESS' | 'FAIL' }) {
  const { t } = useTranslation()
  const isSuccess = status === 'SUCCESS'
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {isSuccess ? t('fusion.success') : t('fusion.fail')}
    </span>
  )
}
