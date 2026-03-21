import type { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLDivElement>

/** 白背景・角丸・影のカードコンテナ。 */
export function Card({ className = '', ...props }: Props) {
  return (
    <div
      {...props}
      className={`bg-white rounded-lg shadow ${className}`}
    />
  )
}
