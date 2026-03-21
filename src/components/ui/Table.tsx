import type { ReactNode, HTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from 'react'

/** テーブル全体のラッパー。横スクロール対応。 */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50 border-b">{children}</thead>
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

export function Tr({ children, className = '' }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`hover:bg-gray-50 ${className}`}>{children}</tr>
}

/** テーブルヘッダーセル */
export function Th({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className={`text-left px-4 py-3 text-gray-600 font-medium ${className}`}
    >
      {children}
    </th>
  )
}

/** テーブルデータセル */
export function Td({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td {...props} className={`px-4 py-3 ${className}`}>
      {children}
    </td>
  )
}
