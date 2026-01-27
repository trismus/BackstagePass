import type { RessourceKategorie } from '@/lib/supabase/types'

const kategorieConfig: Record<
  RessourceKategorie,
  { label: string; color: string }
> = {
  licht: { label: 'Licht', color: 'bg-yellow-100 text-yellow-800' },
  ton: { label: 'Ton', color: 'bg-blue-100 text-blue-800' },
  requisite: { label: 'Requisite', color: 'bg-green-100 text-green-800' },
  kostuem: { label: 'Kostüm', color: 'bg-pink-100 text-pink-800' },
  buehne: { label: 'Bühne', color: 'bg-purple-100 text-purple-800' },
  sonstiges: { label: 'Sonstiges', color: 'bg-gray-100 text-gray-600' },
}

interface RessourceKategorieBadgeProps {
  kategorie: RessourceKategorie | null
}

export function RessourceKategorieBadge({
  kategorie,
}: RessourceKategorieBadgeProps) {
  if (!kategorie) {
    return <span className="text-sm text-gray-400">-</span>
  }

  const config = kategorieConfig[kategorie]

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  )
}
