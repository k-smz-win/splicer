interface Props {
  variant: 'success' | 'error'
  label: string
}

/**
 * 成功・失敗などの状態を色付きバッジで表示する汎用コンポーネント。
 * ドメイン知識を持たず、variant と label を呼び元が決定する。
 */
export function StatusBadge({ variant, label }: Props) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
        variant === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {label}
    </span>
  )
}
