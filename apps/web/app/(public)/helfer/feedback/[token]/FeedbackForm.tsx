'use client'

import { useState } from 'react'
import { Star, CheckCircle2 } from 'lucide-react'
import { submitHelferFeedback } from '@/lib/actions/helfer-feedback'

interface FeedbackFormProps {
  zuweisungId: string
  token: string
}

export function FeedbackForm({ zuweisungId, token: _token }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [feedbackPositiv, setFeedbackPositiv] = useState('')
  const [feedbackVerbesserung, setFeedbackVerbesserung] = useState('')
  const [wiederHelfen, setWiederHelfen] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Bitte gib eine Bewertung ab')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await submitHelferFeedback({
        zuweisungId,
        rating,
        feedbackPositiv: feedbackPositiv || null,
        feedbackVerbesserung: feedbackVerbesserung || null,
        wiederHelfen,
      })

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten')
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg border border-success-200 bg-success-50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success-600" />
        <h3 className="mt-4 text-lg font-semibold text-success-800">
          Vielen Dank fuer dein Feedback!
        </h3>
        <p className="mt-2 text-success-700">
          Dein Feedback hilft uns, besser zu werden.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Wie hat dir dein Einsatz gefallen?
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-neutral-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-neutral-500">
            {rating === 1 && 'Nicht gut'}
            {rating === 2 && 'Geht so'}
            {rating === 3 && 'In Ordnung'}
            {rating === 4 && 'Gut'}
            {rating === 5 && 'Ausgezeichnet'}
          </p>
        )}
      </div>

      {/* Positive Feedback */}
      <div>
        <label
          htmlFor="feedbackPositiv"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Was hat dir gut gefallen?
        </label>
        <textarea
          id="feedbackPositiv"
          value={feedbackPositiv}
          onChange={(e) => setFeedbackPositiv(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="z.B. Gute Organisation, nettes Team..."
        />
      </div>

      {/* Improvement Feedback */}
      <div>
        <label
          htmlFor="feedbackVerbesserung"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          Was koennten wir verbessern?
        </label>
        <textarea
          id="feedbackVerbesserung"
          value={feedbackVerbesserung}
          onChange={(e) => setFeedbackVerbesserung(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="z.B. Mehr Infos vorab, bessere Pausenregelung..."
        />
      </div>

      {/* Would help again */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Wuerdest du wieder bei uns helfen?
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setWiederHelfen(true)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              wiederHelfen === true
                ? 'border-success-500 bg-success-50 text-success-700'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Ja, gerne!
          </button>
          <button
            type="button"
            onClick={() => setWiederHelfen(false)}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              wiederHelfen === false
                ? 'border-error-500 bg-error-50 text-error-700'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            Eher nicht
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Wird gesendet...' : 'Feedback absenden'}
      </button>
    </form>
  )
}
