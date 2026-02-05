'use client'

import { Users, UserCheck, UserX, Clock } from 'lucide-react'

type CheckInStatsProps = {
  total: number
  eingecheckt: number
  noShow: number
  erwartet: number
}

export function CheckInStats({
  total,
  eingecheckt,
  noShow,
  erwartet,
}: CheckInStatsProps) {
  const percentage = total > 0 ? Math.round((eingecheckt / total) * 100) : 0

  return (
    <div className="mb-6 space-y-4">
      {/* Progress Bar */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Fortschritt Check-in
          </span>
          <span className="text-sm font-medium text-gray-900">
            {percentage}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Gesamt</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{eingecheckt}</p>
              <p className="text-xs text-gray-500">Eingecheckt</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{erwartet}</p>
              <p className="text-xs text-gray-500">Erwartet</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{noShow}</p>
              <p className="text-xs text-gray-500">No-Show</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
