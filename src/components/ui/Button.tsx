import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement>

/** プライマリボタン。フォーム送信など主要なアクションに使用する。 */
export function Button({ className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`bg-blue-700 text-white rounded py-2 text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors ${className}`}
    />
  )
}

/** テキストボタン。ナビゲーションや補助的なアクションに使用する。 */
export function TextButton({ className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`underline opacity-80 hover:opacity-100 transition-opacity ${className}`}
    />
  )
}
