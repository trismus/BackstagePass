import { getDesignSettings } from '@/lib/actions/design-settings'
import { DesignSettingsForm } from './DesignSettingsForm'

export const metadata = {
  title: 'Design-Einstellungen',
  description: 'Globale Design-Parameter der Applikation verwalten',
}

export default async function DesignSettingsPage() {
  const settings = await getDesignSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Design-Einstellungen
        </h1>
        <p className="mt-1 text-neutral-600">
          Konfiguriere das globale Erscheinungsbild der Applikation
        </p>
      </div>

      <DesignSettingsForm initialSettings={settings} />
    </div>
  )
}
