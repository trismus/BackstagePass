import { redirect } from 'next/navigation'
import { ComponentShowcase } from './ComponentShowcase'

// Only accessible in development
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'UI-Komponenten',
  description: 'Dokumentation aller UI-Komponenten',
}

export default function ComponentsPage() {
  // Only allow access in development
  if (process.env.NODE_ENV !== 'development') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          UI-Komponenten
        </h1>
        <p className="mt-1 text-neutral-600">
          Dokumentation und interaktive Beispiele aller Design-System Komponenten
        </p>
        <p className="mt-2 text-sm text-amber-600">
          Diese Seite ist nur im Entwicklungsmodus sichtbar.
        </p>
      </div>

      <ComponentShowcase />
    </div>
  )
}
