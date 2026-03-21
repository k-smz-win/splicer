import { useTranslation } from 'react-i18next'
import { useFusions } from '../features/fusion/hooks'
import { useFusionMarkers } from '../features/fusion/hooks'
import { MapView } from '../components/MapView'

export function MapPage() {
  const { t } = useTranslation()
  const { fusions, loading, error } = useFusions()
  const markers = useFusionMarkers(fusions)

  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error) return <p className="text-red-500">{t('common.error')}</p>

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('map.title')}</h2>
      <div className="flex-1 rounded-lg overflow-hidden shadow" style={{ minHeight: '500px' }}>
        <MapView markers={markers} />
      </div>
    </div>
  )
}
