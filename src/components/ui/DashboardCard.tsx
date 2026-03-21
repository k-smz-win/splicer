interface Props {
  title: string
  desc: string
}

/**
 * ダッシュボード用の情報カード。ルーティング知識を持たない純粋なUIコンポーネント。
 * リンクにする場合は呼び元で `className="group block"` を持つ Link でラップすること。
 * ホバースタイルは group-hover で親のインタラクションに追従する。
 */
export function DashboardCard({ title, desc }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 transition-all group-hover:border-blue-400 group-hover:shadow">
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{desc}</p>
    </div>
  )
}
