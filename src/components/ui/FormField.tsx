import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
}

/** ラベル付き入力フィールド。フォーム内の各入力項目に使用する。 */
export function FormField({ label, id, ...props }: Props) {
  const fieldId = id ?? label.replace(/\s+/g, '-').toLowerCase()
  return (
    <div>
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={fieldId}
        {...props}
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
