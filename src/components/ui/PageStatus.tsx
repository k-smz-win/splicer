import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  loading: boolean
  error: string | null
  children: ReactNode
}

export function PageStatus({ loading, error, children }: Props) {
  const { t } = useTranslation()
  if (loading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (error)   return <p className="text-red-500">{t('common.error')}</p>
  return <>{children}</>
}
