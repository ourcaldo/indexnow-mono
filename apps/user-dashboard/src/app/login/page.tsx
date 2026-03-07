'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { authService } from '@indexnow/supabase-client'
import { logger, loginSchema, forgotPasswordSchema } from '@indexnow/shared'
import { useSiteName, useSiteLogo } from '@indexnow/database/client'

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Check if user is already authenticated and redirect to dashboard
  useEffect(() => {
    let isMounted = true

    const safetyTimer = setTimeout(() => {
      if (isMounted && isCheckingAuth) {
        setIsCheckingAuth(false)
      }
    }, 4000)

    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        if (isMounted && currentUser) {
          router.replace('/')
          return
        }
      } catch (error) {
        logger.error({ error: error instanceof Error ? error : undefined }, 'Auth check error on login page')
      } finally {
        if (isMounted) setIsCheckingAuth(false)
        clearTimeout(safetyTimer)
      }
    }
    checkAuth()

    return () => {
      isMounted = false
      clearTimeout(safetyTimer)
    }
  }, [router])

  // Check for auth callback errors in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authError = urlParams.get('error')
    if (authError) {
      const errorMessages: Record<string, string> = {
        auth_callback_failed: 'Authentication failed. Please try again.',
        auth_callback_exception: 'An error occurred during authentication. Please try again.',
        missing_auth_code: 'Invalid authentication link. Please request a new magic link.',
        email_verification_failed: 'Email verification failed. Please check your email or request a new verification link.',
        recovery_verification_failed: 'Password reset verification failed. Please request a new password reset link.',
        magiclink_verification_failed: 'Magic link verification failed. Please request a new magic link.',
        expired_link: 'This link has expired. Please request a new verification link.',
        invalid_link: 'This link is invalid. Please request a new verification link.',
        access_denied: 'Access denied. Please try signing in again.',
        server_error: 'Server error occurred. Please try again later.',
        temporarily_unavailable: 'Service temporarily unavailable. Please try again later.',
        network_error: 'Network error occurred. Please check your connection and try again.',
        timeout_error: 'Request timed out. Please try again.',
        no_session_data: 'Session data not found. Please try signing in again.',
        missing_verification_token: 'Verification token missing. Please request a new verification link.',
        missing_verification_type: 'Invalid verification link. Please request a new verification link.',
        unknown_verification_type: 'Unknown verification type. Please request a new verification link.',
        verification_exception: 'Verification error occurred. Please try again.',
      }
      setError(errorMessages[authError] ?? 'Authentication error occurred.')
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const siteName = useSiteName()
  const logoUrl = useSiteLogo(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setFieldErrors({})

    try {
      if (isMagicLinkMode) {
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
        await authService.createMagicLink(email, `${window.location.origin}/auth/callback?next=/`)
        setMagicLinkSent(true)
        setError("")
      } else {
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

        const authResult = await authService.signIn(email, password)

        if (authResult.user) {
          const redirectUrl = authService.getSubdomainRedirectUrl(authResult.user.role ?? 'user')
          window.location.href = redirectUrl || '/'
        } else {
          window.location.href = '/'
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
      setError("SUCCESS: Password recovery email sent! Please check your inbox.")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to send recovery email")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return <AuthCheckingSpinner />
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f5f5f7]">

      {/* ── Left Panel: Login Form ── */}
      <div className="w-full lg:w-[55%] bg-white flex flex-col min-h-screen">
        {/* Logo */}
        <div className="px-8 pt-8 lg:px-14 lg:pt-10">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName || 'Logo'}
              width={180}
              height={40}
              className="w-auto h-8 lg:h-10"
              unoptimized
            />
          ) : (
            <span className="text-xl font-bold text-foreground">{siteName || 'IndexNow Studio'}</span>
          )}
        </div>

        {/* Form (vertically centered) */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-14">
          <div className="w-full max-w-[420px]">
            <h1 className="text-[28px] lg:text-[32px] font-bold text-foreground mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-[15px] text-muted-foreground mb-8 leading-relaxed">
              Enter your email and password to access your account.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Magic Link Success */}
              {magicLinkSent && (
                <div className="mb-8 text-center py-8 px-6 bg-green-50 rounded-xl border border-green-200">
                  <div className="mb-3 text-3xl">✨</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Magic Link Sent!</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    Check your email ({email}) and click the link to log in instantly.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMagicLinkSent(false); setIsMagicLinkMode(false) }}
                    className="bg-transparent border-0 text-brand-primary text-sm cursor-pointer underline hover:text-brand-secondary transition-colors"
                  >
                    Back to login
                  </button>
                </div>
              )}

              {!magicLinkSent && (
                <>
                  {/* Email */}
                  <div className="mb-5">
                    <label className="block text-[13px] font-medium text-foreground mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-3 text-[15px] bg-white border rounded-lg outline-none transition-all
                        ${fieldErrors.email ? 'border-destructive' : 'border-gray-300 hover:border-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20'}`}
                      placeholder="your@email.com"
                      required
                    />
                    {fieldErrors.email && <p className="text-[13px] text-destructive mt-1">{fieldErrors.email}</p>}
                  </div>

                  {/* Password */}
                  {!isMagicLinkMode && (
                    <>
                      <div className="mb-5">
                        <PasswordInput
                          value={password}
                          onChange={setPassword}
                          disabled={isLoading}
                          variant="native"
                          label="Password"
                          className="[&_label]:!text-[13px] [&_label]:!font-medium [&_label]:!text-foreground [&_label]:!mb-1.5 [&_input]:!border-gray-200 [&_input]:!rounded-lg [&_input]:hover:!border-gray-300 [&_input]:focus:!border-brand-primary [&_input]:focus:!ring-2 [&_input]:focus:!ring-brand-primary/20"
                        />
                        {fieldErrors.password && <p className="text-[13px] text-destructive mt-1">{fieldErrors.password}</p>}
                      </div>

                      {/* Remember Me + Forgot Password */}
                      <div className="flex justify-between items-center mb-6">
                        <label className="flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="mr-2 w-4 h-4 rounded border-gray-300 accent-[var(--brand-primary)]"
                          />
                          <span className="text-[13px] text-muted-foreground">Remember Me</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="bg-transparent border-0 text-brand-primary text-[13px] font-medium cursor-pointer hover:underline transition-all"
                        >
                          Forgot Your Password?
                        </button>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <AuthLoadingButton
                    isLoading={isLoading}
                    loadingText={isMagicLinkMode ? "Sending..." : "Signing In..."}
                    variant="native"
                    className="mb-4 !rounded-lg !py-3.5 !text-[15px]"
                  >
                    {isMagicLinkMode && <span className="mr-2">✨</span>}
                    {isMagicLinkMode ? "Send Magic Link" : "Log In"}
                  </AuthLoadingButton>

                  {/* Error */}
                  <AuthErrorAlert error={error || null} allowSuccessPrefix className="mb-4" />

                  {/* Divider + Magic Link Toggle */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-3 text-muted-foreground">
                        {isMagicLinkMode ? 'Or' : 'Or Login With'}
                      </span>
                    </div>
                  </div>

                  {/* Magic Link Button */}
                  <button
                    type="button"
                    onClick={() => setIsMagicLinkMode(!isMagicLinkMode)}
                    className="w-full py-3 px-4 bg-white border border-gray-200 rounded-lg text-[14px] font-medium text-foreground
                      hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isMagicLinkMode ? (
                      <>🔒 Back to password login</>
                    ) : (
                      <>✨ Magic Link</>
                    )}
                  </button>
                </>
              )}
            </form>

            {/* Register + Verification Links */}
            <div className="mt-8 text-center space-y-2">
              <p className="text-[14px] text-muted-foreground">
                Don&apos;t Have An Account?{' '}
                <button
                  onClick={() => router.push("/register")}
                  className="bg-transparent border-0 text-brand-primary font-semibold cursor-pointer hover:underline transition-all text-[14px]"
                >
                  Register Now.
                </button>
              </p>
              <p className="text-[13px] text-muted-foreground">
                Haven&apos;t received your verification email?{' '}
                <button
                  type="button"
                  onClick={() => router.push("/resend-verification")}
                  className="bg-transparent border-0 text-brand-primary font-medium cursor-pointer hover:underline transition-all text-[13px]"
                  data-testid="link-resend-verification"
                >
                  Resend it
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 lg:px-14 flex flex-col sm:flex-row justify-between items-center gap-2 text-[13px] text-muted-foreground">
          <span>Copyright © {new Date().getFullYear()} {siteName || 'IndexNow Studio'}. All rights reserved.</span>
          <a href="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* ── Right Panel: Dashboard Preview (desktop only) ── */}
      <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-[#c2410c] via-[#ea580c] to-[#b91c1c] m-3 rounded-2xl p-12 flex-col justify-center items-center text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/[0.06]" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-black/[0.08]" />
          <div className="absolute top-1/2 right-1/4 w-64 h-64 rounded-full bg-white/[0.03]" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg">
          <h2 className="text-[32px] font-bold leading-tight mb-3">
            Track your rankings<br />and grow your SEO.
          </h2>
          <p className="text-white/70 text-[16px] leading-relaxed mb-10">
            Log in to access your dashboard and monitor keyword performance in real-time.
          </p>

          {/* Dashboard Preview Cards */}
          <div className="space-y-4">
            {/* Top Row: 3 stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-[11px] font-medium mb-1">Total Keywords</p>
                <p className="text-[22px] font-bold">2,847</p>
                <p className="text-green-300 text-[11px] mt-1">↑ 12.5%</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-[11px] font-medium mb-1">Avg Position</p>
                <p className="text-[22px] font-bold">14.3</p>
                <p className="text-green-300 text-[11px] mt-1">↑ 3.2 pts</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-[11px] font-medium mb-1">Top 10</p>
                <p className="text-[22px] font-bold">438</p>
                <p className="text-green-300 text-[11px] mt-1">↑ 24 new</p>
              </div>
            </div>

            {/* Rankings Table Preview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center">
                <p className="text-[13px] font-semibold">Recent Rankings</p>
                <span className="text-[11px] text-white/50">Updated 2m ago</span>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { keyword: 'indexnow api setup', pos: 3, change: 2, domain: 'example.com' },
                  { keyword: 'seo rank tracker', pos: 7, change: 5, domain: 'mysite.io' },
                  { keyword: 'keyword monitoring tool', pos: 12, change: -1, domain: 'example.com' },
                  { keyword: 'google indexing api', pos: 5, change: 3, domain: 'blog.dev' },
                ].map((row) => (
                  <div key={row.keyword} className="px-4 py-2.5 flex items-center justify-between text-[12px]">
                    <div className="flex-1 min-w-0">
                      <span className="text-white/90 truncate block">{row.keyword}</span>
                      <span className="text-white/40 text-[11px]">{row.domain}</span>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="font-semibold text-white/90 tabular-nums w-6 text-right">#{row.pos}</span>
                      <span className={`text-[11px] tabular-nums w-8 text-right ${row.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {row.change > 0 ? `↑${row.change}` : `↓${Math.abs(row.change)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Domains Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-[11px] font-medium mb-1">Active Domains</p>
                <p className="text-[20px] font-bold">6</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-white/60 text-[11px] font-medium mb-1">Index Submissions</p>
                <p className="text-[20px] font-bold">1,293</p>
                <p className="text-green-300 text-[11px] mt-1">↑ 89 today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
