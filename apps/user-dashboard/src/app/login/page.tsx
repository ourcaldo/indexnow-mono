'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { authService } from '@indexnow/supabase-client'
import { logger, loginSchema, forgotPasswordSchema } from '@indexnow/shared'
import { useSiteName, useSiteLogo } from '@indexnow/database/client'

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
  AuthLoadingButton,
  AuthCheckingSpinner
} from '@indexnow/ui/auth'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isMagicLinkMode, setIsMagicLinkMode] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  // (#113) Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          router.replace('/dashboard')
          return
        }
      } catch (error) {
        logger.error({ error: error instanceof Error ? error : undefined }, 'Auth check error on login page')
        // Don't block login page if auth check fails
      } finally {
        // Always stop checking auth, even if there's an error
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])
  
  // Check for auth callback errors in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authError = urlParams.get('error')
    if (authError) {
      switch (authError) {
        case 'auth_callback_failed':
          setError('Authentication failed. Please try again.')
          break
        case 'auth_callback_exception':
          setError('An error occurred during authentication. Please try again.')
          break
        case 'missing_auth_code':
          setError('Invalid authentication link. Please request a new magic link.')
          break
        // Enhanced error handling for new verification routes
        case 'email_verification_failed':
          setError('Email verification failed. Please check your email or request a new verification link.')
          break
        case 'recovery_verification_failed':
          setError('Password reset verification failed. Please request a new password reset link.')
          break
        case 'magiclink_verification_failed':
          setError('Magic link verification failed. Please request a new magic link.')
          break
        case 'expired_link':
          setError('This link has expired. Please request a new verification link.')
          break
        case 'invalid_link':
          setError('This link is invalid. Please request a new verification link.')
          break
        case 'access_denied':
          setError('Access denied. Please try signing in again.')
          break
        case 'server_error':
          setError('Server error occurred. Please try again later.')
          break
        case 'temporarily_unavailable':
          setError('Service temporarily unavailable. Please try again later.')
          break
        case 'network_error':
          setError('Network error occurred. Please check your connection and try again.')
          break
        case 'timeout_error':
          setError('Request timed out. Please try again.')
          break
        case 'no_session_data':
          setError('Session data not found. Please try signing in again.')
          break
        case 'missing_verification_token':
          setError('Verification token missing. Please request a new verification link.')
          break
        case 'missing_verification_type':
          setError('Invalid verification link. Please request a new verification link.')
          break
        case 'unknown_verification_type':
          setError('Unknown verification type. Please request a new verification link.')
          break
        case 'verification_exception':
          setError('Verification error occurred. Please try again.')
          break
        default:
          setError('Authentication error occurred.')
      }
      // Clear the error from URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])
  
  // Site settings hooks
  const siteName = useSiteName()
  const logoUrl = useSiteLogo(true) // Always use full logo for login page

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})
    
    try {
      if (isMagicLinkMode) {
        // (#113) Validate email for magic link mode
        const result = forgotPasswordSchema.safeParse({ email })
        if (!result.success) {
          const errors: Record<string, string> = {}
          for (const err of result.error.errors) {
            const field = err.path[0]?.toString()
            if (field && !errors[field]) errors[field] = err.message
          }
          setFieldErrors(errors)
          setIsLoading(false)
          return
        }
        await authService.createMagicLink(email, `${window.location.origin}/auth/callback?next=/dashboard`)
        setMagicLinkSent(true)
        setError("")
      } else {
        // (#113) Validate login fields with Zod
        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
          const errors: Record<string, string> = {}
          for (const err of result.error.errors) {
            const field = err.path[0]?.toString()
            if (field && !errors[field]) errors[field] = err.message
          }
          setFieldErrors(errors)
          setIsLoading(false)
          return
        }
        
        // Handle password login
        const authResult = await authService.signIn(email, password)
        
        // Get user role and redirect to appropriate subdomain
        if (authResult.user) {
          const userRole = await authService.getUserRole(authResult.user)
          const redirectUrl = authService.getSubdomainRedirectUrl(userRole)
          
          // If it's a subdomain URL, use window.location for cross-subdomain redirect
          if (redirectUrl.startsWith('http')) {
            window.location.href = redirectUrl
          } else {
            router.push(redirectUrl)
          }
        } else {
          router.push("/dashboard") // Fallback
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : (isMagicLinkMode ? "Failed to send magic link" : "Login failed"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setFieldErrors({})
    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setFieldErrors({ email: result.error.errors[0]?.message || 'Please enter a valid email' })
      return
    }
    
    setIsLoading(true)
    try {
      await authService.resetPassword(email)
      // We don't have useToast here yet, let's use the error state for success message
      setError("SUCCESS: Password recovery email sent! Please check your inbox.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send recovery email")
    } finally {
      setIsLoading(false)
    }
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  // Show loading spinner instead of white screen while checking auth
  if (isCheckingAuth) {
    return <AuthCheckingSpinner />
  }

  return (
    <div className={`min-h-screen flex ${isMobile ? 'flex-col' : 'flex-row'} font-sans`}>

      {/* Left Side - Login Form */}
      <div className={`${isMobile ? 'w-full' : 'w-1/2'} bg-background ${isMobile ? 'px-5 py-10' : 'p-[60px]'} flex flex-col justify-center ${isMobile ? 'items-center' : 'items-start'} relative`}>
        {/* Logo for both mobile and desktop */}
        {logoUrl && (
          <div className={`absolute ${isMobile ? 'top-5 left-5' : 'top-10 left-[60px]'} flex items-center`}>
            <Image 
              src={logoUrl} 
              alt="Logo"
              width={isMobile ? 240 : 360}
              height={isMobile ? 48 : 72}
              className="w-auto"
              style={{ maxWidth: isMobile ? '240px' : '360px' }}
              unoptimized
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`max-w-md w-full ${isMobile ? 'text-center mt-24' : 'text-left'}`}>
          <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-brand-primary mb-2 leading-tight`}>
            Welcome Back
          </h1>
          <p className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-10 leading-relaxed`}>
            Enter your email and password to access your account.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Magic Link Success Notification */}
            {magicLinkSent && (
              <div className="mb-8 text-center">
                <div className="mb-4 text-[32px]">✨</div>
                <h3 className="text-lg font-semibold text-foreground mb-2 m-0">
                  Magic Link Sent!
                </h3>
                <p className="text-muted-foreground text-sm m-0 leading-relaxed mb-4">
                  Check your email ({email}) and click the link to log in instantly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false)
                    setIsMagicLinkMode(false)
                  }}
                  className="bg-transparent border-0 text-brand-primary text-sm cursor-pointer underline hover:text-brand-secondary transition-colors"
                >
                  Back to login
                </button>
              </div>
            )}

            {/* Show form only if magic link is not sent */}
            {!magicLinkSent && (
              <>
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
                    placeholder="your@email.com"
                    required
                  />
                  {fieldErrors.email && <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>}
                </div>

                {/* Password Field - Hidden in magic link mode */}
                {!isMagicLinkMode && (
                  <>
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      disabled={isLoading}
                      variant="native"
                      className="mb-6"
                    />
                    {fieldErrors.password && <p className="text-sm text-destructive -mt-4 mb-6">{fieldErrors.password}</p>}

                    {/* Remember Me & Forgot Password */}
                    <div className="flex justify-between items-center mb-8">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="mr-2 w-4 h-4 accent-brand"
                        />
                        <span className="text-sm text-muted-foreground">
                          Remember Me
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => router.push("/forgot-password")}
                        className="bg-transparent border-0 text-brand-primary text-sm cursor-pointer hover:underline transition-all"
                      >
                        Forgot Your Password?
                      </button>
                    </div>
                  </>
                )}

                {/* Login/Magic Link Button */}
                <AuthLoadingButton
                  isLoading={isLoading}
                  loadingText={isMagicLinkMode ? "Sending..." : "Signing In..."}
                  variant="native"
                  className="mb-6"
                >
                  {isMagicLinkMode && <span style={{ marginRight: '8px' }}>✨</span>}
                  {isMagicLinkMode ? "Send Magic Link" : "Sign In"}
                </AuthLoadingButton>

                {/* Error/Success Message */}
                <AuthErrorAlert error={error || null} allowSuccessPrefix className="mb-6" />

                {/* Toggle Magic Link Mode */}
                <div className="text-center mb-6">
                  <button
                    type="button"
                    onClick={() => setIsMagicLinkMode(!isMagicLinkMode)}
                    className="bg-transparent border-0 text-muted-foreground text-sm cursor-pointer hover:underline hover:text-foreground transition-all"
                  >
                    {isMagicLinkMode ? "← Back to password login" : "✨ Login with magic link instead"}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Register Link and Verification Link */}
          <div className="text-center pt-6 border-t border-border space-y-3">
            <p className="text-sm text-muted-foreground m-0">
              Don't have an account?{' '}
              <button
                onClick={() => router.push("/register")}
                className="bg-transparent border-0 text-brand-primary text-sm font-semibold cursor-pointer hover:underline transition-all"
              >
                Sign up here
              </button>
            </p>
            
            <p className="text-sm text-muted-foreground m-0">
              Haven't received your verification email?{' '}
              <button
                type="button"
                onClick={() => router.push("/resend-verification")}
                className="bg-transparent border-0 text-brand-primary text-sm font-semibold cursor-pointer hover:underline transition-all"
                data-testid="link-resend-verification"
              >
                Resend verification email
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Dashboard Preview (Desktop Only) */}
      {!isMobile && (
        <div className="w-1/2 bg-brand-primary p-[60px] flex flex-col justify-center items-center text-white relative">
          <div className="overflow-hidden w-full h-full relative">
            <DashboardPreview />
          </div>
        </div>
      )}
    </div>
  )
}
