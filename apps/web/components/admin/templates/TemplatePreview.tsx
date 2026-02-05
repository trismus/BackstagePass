interface TemplatePreviewProps {
  zeitbloeckeCount: number
  schichtenCount: number
  slotsCount: number
  infoBloeckeCount: number
  sachleistungenCount: number
}

export function TemplatePreview({
  zeitbloeckeCount,
  schichtenCount,
  slotsCount,
  infoBloeckeCount,
  sachleistungenCount,
}: TemplatePreviewProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-6">
      <h2 className="text-sm font-medium uppercase tracking-wider text-neutral-500">
        Template-Vorschau
      </h2>
      <p className="mt-2 text-neutral-700">
        Dieses Template generiert:
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-neutral-900">{zeitbloeckeCount}</p>
          <p className="text-sm text-neutral-500">Zeitbloecke</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-neutral-900">{schichtenCount}</p>
          <p className="text-sm text-neutral-500">Schichten</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-neutral-900">{slotsCount}</p>
          <p className="text-sm text-neutral-500">Helfer-Slots</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-neutral-900">{infoBloeckeCount}</p>
          <p className="text-sm text-neutral-500">Info-Bloecke</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-2xl font-semibold text-neutral-900">{sachleistungenCount}</p>
          <p className="text-sm text-neutral-500">Sachleistungen</p>
        </div>
      </div>
    </div>
  )
}
