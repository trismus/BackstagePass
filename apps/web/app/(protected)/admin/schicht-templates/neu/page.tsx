import { TemplateForm } from '@/components/admin/templates/TemplateForm'

export const metadata = {
  title: 'Neues Schicht-Template',
  description: 'Erstellen Sie ein neues Schicht-Template',
}

export default function NeuTemplateSeite() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Neues Schicht-Template
        </h1>
        <p className="mt-1 text-neutral-600">
          Erstellen Sie eine neue Vorlage fuer Helfer-Schichten
        </p>
      </div>

      <TemplateForm />
    </div>
  )
}
