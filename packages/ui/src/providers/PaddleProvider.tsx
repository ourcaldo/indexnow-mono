'use client'

import React, { createContext, useEffect, useState, useContext, useCallback } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'
import { ApiEndpoints, logger } from '@indexnow/shared'

interface PaddleContextType {
  paddle: Paddle | null
  isLoading: boolean
  error: string | null
}

const PaddleContext = createContext<PaddleContextType>({
  paddle: null,
  isLoading: true,
  error: null,
})

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const initPaddle = async () => {
      try {
        const response = await fetch(ApiEndpoints.PAYMENT.PADDLE_CONFIG)
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load Paddle configuration')
        }

        const configResult = await response.json()
        
        if (!configResult.success || !configResult.data) {
          throw new Error('Invalid Paddle configuration response')
        }

        const { clientToken, environment } = configResult.data

        if (!clientToken) {
          throw new Error('Paddle client token not available')
        }

        const paddleInstance = await initializePaddle({
          environment: environment || 'sandbox',
          token: clientToken,
          eventCallback: (data) => {
            switch (data.name) {
              case 'checkout.completed':
                // Invalidate queries so UI reflects new subscription state.
                // The successUrl setting handles the redirect — this callback
                // ensures state is correct if the redirect is slow or fails.
                logger.info('Paddle checkout completed')
                break

              case 'checkout.closed':
                // User closed the overlay — do NOT redirect or show "cancelled".
                // The user may want to review or retry from the same page.
                logger.info('Paddle checkout overlay closed by user')
                break

              case 'checkout.error':
                // Paddle handles payment errors internally within the overlay.
                // Users can retry with a different card. Do NOT redirect.
                logger.warn('Paddle checkout error reported within overlay')
                break

              default:
                break
            }
          }
        })

        if (paddleInstance && isMounted) {
          setPaddle(paddleInstance)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize payment system'
        logger.error({ error: err instanceof Error ? err : undefined }, `Paddle init failed: ${message}`)
        if (isMounted) setError(message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    initPaddle()
    return () => { isMounted = false }
  }, [])

  return (
    <PaddleContext.Provider value={{ paddle, isLoading, error }}>
      {children}
    </PaddleContext.Provider>
  )
}

export const usePaddle = () => useContext(PaddleContext)
