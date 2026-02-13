import { getUserProfile } from '@/lib/supabase/server'
import { getAccessibleToursByCategory } from '@/lib/tours'
import { TOUR_CATEGORIES } from '@/lib/tours'
import { TourCard } from '@/components/tours'

export const metadata = {
  title: 'Interaktive Tours',
  description: 'Lerne BackstagePass mit interaktiven Schritt-für-Schritt Anleitungen kennen',
}

export default async function ToursPage() {
  const profile = await getUserProfile()

  if (!profile) {
    return <div>Nicht angemeldet</div>
  }

  const toursByCategory = getAccessibleToursByCategory(profile.role)

  // Filter categories that have tours
  const availableCategories = TOUR_CATEGORIES.filter(
    (category) => toursByCategory[category.name]?.length > 0
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Interaktive Tours
        </h1>
        <p className="mt-2 text-neutral-600">
          Lerne BackstagePass mit interaktiven Schritt-für-Schritt Anleitungen kennen.
          Jede Tour führt dich durch einen bestimmten Workflow.
        </p>
      </div>

      {/* Tours by Category */}
      {availableCategories.length > 0 ? (
        <div className="space-y-8">
          {availableCategories.map((category) => {
            const tours = toursByCategory[category.name] || []
            if (tours.length === 0) return null

            return (
              <div key={category.name}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {category.label}
                  </h2>
                  <p className="text-sm text-neutral-600">{category.description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white p-8 text-center">
          <p className="text-neutral-600">
            Keine Tours verfügbar für deine Rolle.
          </p>
        </div>
      )}

      {/* Help Tip */}
      <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
        <div className="flex gap-3">
          <svg
            className="h-5 w-5 flex-shrink-0 text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-medium text-primary-900">Tipp</h3>
            <p className="mt-1 text-sm text-primary-800">
              Du kannst eine Tour jederzeit mit der ESC-Taste beenden. Tours sind
              auch direkt auf den jeweiligen Seiten verfügbar - suche nach dem
              Tour-Button.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
