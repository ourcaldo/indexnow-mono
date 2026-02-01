'use client'

import React, { createContext, useEffect, useState, useContext } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'
import { ApiEndpoints } from '../constants/ApiEndpoints'

interface PaddleContextType {
  paddle: Paddle | null
  isLoading: boolean
}

const PaddleContext = createContext<PaddleContextType>({
  paddle: null,
  isLoading: true,
})

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
          throw new Error('Paddle client token not found in database configuration')
        }

        const paddleInstance = await initializePaddle({
          environment: environment || 'sandbox',
          token: clientToken,
          eventCallback: (data) => {
            switch (data.name) {
              case 'checkout.completed':
                break

              case 'checkout.closed':
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard?subscription=cancelled'
                }
                break

              case 'checkout.error':
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard?subscription=failed'
                }
                break

              default:
                break
            }
          }
        })

        if (paddleInstance) {
          setPaddle(paddleInstance)
        }
      } catch (error) {
        // Errors are tracked server-side
      } finally {
        setIsLoading(false)
      }
    }

    initPaddle()
  }, [])

  return (
    <PaddleContext.Provider value={{ paddle, isLoading }}>
      {children}
    </PaddleContext.Provider>
  )
}

export const usePaddle = () => useContext(PaddleContext)
