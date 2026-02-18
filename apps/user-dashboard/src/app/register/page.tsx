'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { authService } from '@indexnow/supabase-client'
import { countries, findCountryByCode, logger } from '@indexnow/shared'
import { useSiteName, useSiteLogo } from '@indexnow/database/client'
import { registerSchema } from '@indexnow/shared/schema'
// We'll use a simple fetch to our detect-location API instead

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  DashboardPreview,
} from '@indexnow/ui'
import {
  PasswordInput,
  AuthErrorAlert,
  AuthLoadingButton
} from '@indexnow/ui/auth'
import { AUTH_ENDPOINTS } from '@indexnow/shared'

interface DetectLocationResponse {
  country?: string;
  countryCode?: string;
  city?: string;
  region?: string;
}

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("")
  const [isDetectingCountry, setIsDetectingCountry] = useState(true)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  // (#113) Per-field validation errors from Zod schema
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Site settings hooks
  const siteName = useSiteName()
  const logoUrl = useSiteLogo(true) // Always use full logo for register page

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)

    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Auto-detect country from IP on component mount
  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch(AUTH_ENDPOINTS.DETECT_LOCATION, {
          credentials: 'include' // Essential for cross-subdomain authentication
        })
        if (response.ok) {
          const data = (await response.json()) as DetectLocationResponse
          if (data.country) {
            setCountry(data.country) // Use full country name instead of countryCode
          } else {
            setCountry('United States') // Fallback to full country name
          }
        } else {
          setCountry('United States') // Fallback to full country name
        }
      } catch (error) {
        logger.warn({ error: error instanceof Error ? error : undefined }, 'Country detection failed')
        setCountry('United States') // Fallback to full country name
      } finally {
        setIsDetectingCountry(false)
      }
    }

    detectCountry()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    // (#113) Client-side validation using Zod schema with per-field errors
    try {
      const validationData = {
        name: fullName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        country
      }

      const result = registerSchema.safeParse(validationData)

      if (!result.success) {
        // Build per-field error map
        const errors: Record<string, string> = {}
        for (const err of result.error.errors) {
          const field = err.path[0]?.toString()
          if (field && !errors[field]) {
            errors[field] = err.message
          }
        }
        setFieldErrors(errors)
        setError("Please fix the errors below")
        setIsLoading(false)
        return
      }
    } catch (validationError: unknown) {
      setError("Please check your input and try again")
      setIsLoading(false)
      return
    }

    try {
      await authService.signUp(email, password, fullName, phoneNumber, country)
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Registration failed")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans bg-secondary">
        <div className="card-bordered max-w-md w-full p-10 text-center">
          <div className="text-5xl mb-5">✨</div>
          <h2 className="text-2xl font-bold text-brand-primary mb-3">
            Check your email
          </h2>
          <p className="text-base text-brand-text mb-8 leading-relaxed">
            We've sent you a confirmation link at <strong>{email}</strong>. Click the link to verify your account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-6 bg-brand-primary text-white border-0 rounded-lg text-base font-semibold cursor-pointer hover:bg-brand-secondary transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex ${isMobile ? 'flex-col' : 'flex-row'} font-sans`}>

      {/* Left Side - Register Form */}
      <div className={`${isMobile ? 'w-full' : 'w-1/2'} bg-background ${isMobile ? 'px-5 py-10' : 'p-[60px]'} flex flex-col justify-center ${isMobile ? 'items-center' : 'items-start'} relative`}>
        {/* Logo for both mobile and desktop */}
        {logoUrl && (
          <div className={`absolute ${isMobile ? 'top-5 left-5' : 'top-8 left-[60px]'} flex items-center z-10`}>
            <Image
              src={logoUrl}
              alt="Logo"
              width={isMobile ? 240 : 280}
              height={48}
              className="w-auto"
              style={{ maxWidth: isMobile ? '240px' : '280px' }}
              unoptimized
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`max-w-md w-full ${isMobile ? 'text-center mt-[90px]' : 'text-left mt-20'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-brand-primary mb-2 leading-tight`}>
            Create Account
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-10 leading-relaxed`}>
            Join {siteName} to start tracking your keyword rankings today.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`form-field-default form-field-focus w-full px-4 py-3 text-base ${fieldErrors.name ? 'border-destructive' : ''}`}
                placeholder="Enter your full name"
                required
              />
              {fieldErrors.name && <p className="text-sm text-destructive mt-1">{fieldErrors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`form-field-default form-field-focus w-full px-4 py-3 text-base ${fieldErrors.email ? 'border-destructive' : ''}`}
                placeholder="you@company.com"
                required
              />
              {fieldErrors.email && <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Phone Number Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  // Only allow numbers, spaces, +, -, ( and )
                  const value = e.target.value.replace(/[^+\-0-9\s\(\)]/g, '')
                  setPhoneNumber(value)
                }}
                className={`form-field-default form-field-focus w-full px-4 py-3 text-base ${fieldErrors.phoneNumber ? 'border-destructive' : ''}`}
                placeholder="+1 (555) 123-4567"
                required
              />
              {fieldErrors.phoneNumber && <p className="text-sm text-destructive mt-1">{fieldErrors.phoneNumber}</p>}
            </div>

            {/* Country Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={isDetectingCountry}
                className={`form-field-default form-field-focus w-full px-4 py-3 text-base ${isDetectingCountry ? 'bg-muted cursor-not-allowed' : 'cursor-pointer'} ${fieldErrors.country ? 'border-destructive' : ''}`}
                required
              >
                <option value="">Select your country</option>
                {countries.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.name}>
                    {countryOption.flag} {countryOption.name}
                  </option>
                ))}
              </select>
              {fieldErrors.country && <p className="text-sm text-destructive mt-1">{fieldErrors.country}</p>}
            </div>

            {/* Password Field */}
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="Create a password"
              variant="native"
              className="mb-6"
            />
            {fieldErrors.password && <p className="text-sm text-destructive -mt-4 mb-6">{fieldErrors.password}</p>}

            {/* Confirm Password Field */}
            <PasswordInput
              id="confirmPassword"
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm your password"
              variant="native"
              className="mb-8"
            />
            {fieldErrors.confirmPassword && <p className="text-sm text-destructive -mt-6 mb-8">{fieldErrors.confirmPassword}</p>}

            {/* Error Message */}
            <AuthErrorAlert error={error || null} className="mb-6" />

            {/* Submit Button */}
            <AuthLoadingButton
              isLoading={isLoading}
              loadingText="Creating Account..."
              variant="native"
            >
              Create Account
            </AuthLoadingButton>

            {/* Sign In Link */}
            <div className="text-center mt-6">
              <span className="text-sm text-muted-foreground">
                Already have an account?{' '}
              </span>
              <a
                href="/login"
                className="text-sm text-brand-primary no-underline font-semibold hover:underline transition-all"
              >
                Sign In
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Dashboard Preview (Desktop Only) */}
      {!isMobile && (
        <div className="w-1/2 bg-brand-primary p-[80px_60px] flex flex-col justify-center text-white relative">
          <div className="overflow-hidden w-full relative">
            <DashboardPreview />
          </div>
        </div>
      )}
    </div>
  )
}
