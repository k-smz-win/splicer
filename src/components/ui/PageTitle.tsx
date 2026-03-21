import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLHeadingElement>

/** ページの見出し（h2）。各ページの最上部に配置する。 */
export function PageTitle({ className = '', ...props }: Props) {
  return (
    <h2
      {...props}
      className={`text-2xl font-bold text-gray-800 mb-6 ${className}`}
    />
  )
}
