import type { BedarfStatus } from '@/lib/supabase/types'

interface BedarfUebersichtProps {
  bedarf: BedarfStatus[]
}

export function BedarfUebersicht({ bedarf }: BedarfUebersichtProps) {
  if (bedarf.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h3 className="font-medium text-gray-900">Besetzung</h3>
        </div>
        <div className="p-8 text-center text-gray-500">
          Keine Schichten definiert
        </div>
      </div>
    )
  }

  const totalBenoetigt = bedarf.reduce((sum, b) => sum + b.benoetigt, 0)
  const totalZugewiesen = bedarf.reduce((sum, b) => sum + b.zugewiesen, 0)
  const totalOffen = bedarf.reduce((sum, b) => sum + b.offen, 0)

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
        <h3 className="font-medium text-gray-900">Besetzung</h3>
        <span
          className={`text-sm font-medium ${
            totalOffen > 0 ? 'text-orange-600' : 'text-green-600'
          }`}
        >
          {totalZugewiesen}/{totalBenoetigt} besetzt
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                Rolle
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                Zeitblock
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">
                Benötigt
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">
                Besetzt
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">
                Offen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bedarf.map((b, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {b.rolle}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {b.zeitblock ? (
                    <span>
                      {b.zeitblock.name}
                      <span className="ml-1 text-gray-400">
                        ({b.zeitblock.startzeit.slice(0, 5)} -{' '}
                        {b.zeitblock.endzeit.slice(0, 5)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {b.benoetigt}
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  <span
                    className={`font-medium ${
                      b.zugewiesen >= b.benoetigt
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {b.zugewiesen}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {b.offen > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
                      {b.offen}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      0
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
