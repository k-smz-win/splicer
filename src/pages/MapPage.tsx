import { useTranslation } from 'react-i18next'
import { useFusions, useFusionMarkers } from '../features/fusion/hooks'
import { MapView } from '../components/MapView'
import { PageStatus } from '../components/ui/PageStatus'

export function MapPage() {
  const { t } = useTranslation()
  const { fusions, loading, error } = useFusions()
  const markers = useFusionMarkers(fusions)

  return (
    <PageStatus loading={loading} error={error}>
      <div className="h-full flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('map.title')}</h2>
        <div className="flex-1 rounded-lg overflow-hidden shadow" style={{ minHeight: '500px' }}>
          <MapView markers={markers} />
        </div>
      </div>
    </PageStatus>
  )
}
