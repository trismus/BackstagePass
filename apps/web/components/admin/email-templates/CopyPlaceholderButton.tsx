'use client'

export function CopyPlaceholderButton({ placeholder }: { placeholder: string }) {
  return (
    <button
      type="button"
      className="text-xs text-neutral-400 hover:text-neutral-600"
      onClick={() => {
        navigator.clipboard.writeText(`{{${placeholder}}}`)
      }}
    >
      Kopieren
    </button>
  )
}
