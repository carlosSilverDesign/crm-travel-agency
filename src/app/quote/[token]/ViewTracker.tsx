'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  quoteId: string
}

export default function ViewTracker({ quoteId }: ViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await fetch('/api/public/quotes/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: quoteId }),
        })
      } catch (error) {
        console.error('Failed to track quote view:', error)
      }
    }

    trackView()
  }, [quoteId])

  return null
}
