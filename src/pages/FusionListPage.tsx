import { useTranslation } from 'react-i18next'
import { useFusions } from '../features/fusion/hooks'
import { formatLocal } from '../utils/date'
import { PageTitle } from '../components/ui/PageTitle'
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'

export function FusionListPage() {
  const { t } = useTranslation()
  const { fusions, loading, error } = useFusions()

  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error) return <p className="text-red-500">{t('common.error')}</p>

  return (
    <div>
      <PageTitle>{t('fusion.title')}</PageTitle>

      <Table>
        <Thead>
          <tr>
            <Th>{t('fusion.name')}</Th>
            <Th>{t('fusion.status')}</Th>
            <Th>{t('fusion.workerName')}</Th>
            <Th>{t('fusion.startedAt')}</Th>
            <Th>{t('fusion.finishedAt')}</Th>
          </tr>
        </Thead>
        <Tbody>
          {fusions.map((f) => (
            <Tr key={f.id}>
              <Td className="font-medium text-gray-800">{f.name}</Td>
              <Td>
                <StatusBadge
                  variant={f.status === 'SUCCESS' ? 'success' : 'error'}
                  label={f.status === 'SUCCESS' ? t('fusion.success') : t('fusion.fail')}
                />
              </Td>
              <Td className="text-gray-600">{f.workerName}</Td>
              <Td className="text-gray-500">{formatLocal(f.startedAt)}</Td>
              <Td className="text-gray-500">{formatLocal(f.finishedAt)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  )
}

