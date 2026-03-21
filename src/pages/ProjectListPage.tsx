import { useTranslation } from 'react-i18next'
import { useProjects } from '../features/project/hooks'
import { formatLocal } from '../utils/date'
import { PageTitle } from '../components/ui/PageTitle'
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table'

export function ProjectListPage() {
  const { t } = useTranslation()
  const { projects, loading, error } = useProjects()

  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error) return <p className="text-red-500">{t('common.error')}</p>

  return (
    <div>
      <PageTitle>{t('project.title')}</PageTitle>

      <Table>
        <Thead>
          <tr>
            <Th>{t('project.id')}</Th>
            <Th>{t('project.name')}</Th>
            <Th>{t('project.description')}</Th>
            <Th>{t('project.createdAt')}</Th>
          </tr>
        </Thead>
        <Tbody>
          {projects.map((p) => (
            <Tr key={p.id}>
              <Td className="text-gray-500 font-mono text-xs">{p.id}</Td>
              <Td className="font-medium text-gray-800">{p.name}</Td>
              <Td className="text-gray-600">{p.description}</Td>
              <Td className="text-gray-500">{formatLocal(p.createdAt)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  )
}
