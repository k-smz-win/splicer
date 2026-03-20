import { useTranslation } from 'react-i18next'
import { useProjects } from '../features/project/hooks'
import { formatLocal } from '../utils/date'

export function ProjectListPage() {
  const { t } = useTranslation()
  const { projects, loading, error } = useProjects()

  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error) return <p className="text-red-500">{t('common.error')}</p>

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('project.title')}</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('project.id')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('project.name')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('project.description')}</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">{t('project.createdAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-4 py-3 text-gray-600">{p.description}</td>
                <td className="px-4 py-3 text-gray-500">{formatLocal(p.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
