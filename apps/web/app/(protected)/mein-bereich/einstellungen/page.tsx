import { NotificationSettings } from '@/components/notifications'
import { getNotificationSettings } from '@/lib/actions/notifications'
import Link from 'next/link'
import type { Route } from 'next'

export const metadata = {
  title: 'Einstellungen | BackstagePass',
}

export default async function EinstellungenPage() {
  const settings = await getNotificationSettings()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
          <p className="mt-1 text-gray-600">
            Verwalte deine Benachrichtigungseinstellungen
          </p>
        </div>
        <Link
          href={'/dashboard' as Route}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Zurück zum Dashboard
        </Link>
      </div>

      <NotificationSettings settings={settings} />
    </div>
  )
}
