import type { BedarfStatus } from '@/lib/supabase/types'

interface BedarfUebersichtProps {
  bedarf: BedarfStatus[]
}

export function BedarfUebersicht({ bedarf }: BedarfUebersichtProps) {
  if (bedarf.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b">
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
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
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
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Rolle
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                Zeitblock
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Benötigt
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                Besetzt
              </th>
              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
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
                      <span className="text-gray-400 ml-1">
                        ({b.zeitblock.startzeit.slice(0, 5)} - {b.zeitblock.endzeit.slice(0, 5)})
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-center text-gray-600">
                  {b.benoetigt}
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span
                    className={`font-medium ${
                      b.zugewiesen >= b.benoetigt ? 'text-green-600' : 'text-gray-600'
                    }`}
                  >
                    {b.zugewiesen}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  {b.offen > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      {b.offen}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
