'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@indexnow/ui'
import { PasswordInput, AuthErrorAlert, AuthLoadingButton } from '@indexnow/ui/auth'
import { useZodForm } from '@indexnow/ui/hooks'
import { authService } from '@indexnow/supabase-client'
import { loginSchema, type LoginRequest } from '@indexnow/shared'
import { useSiteName, useSiteLogo } from '@indexnow/database/client'
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS, type VerifyRoleResponse } from '@indexnow/shared'

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // (#113) react-hook-form + zod for form validation
  const { register, handleSubmit, formState: { errors } } = useZodForm(loginSchema, {
    defaultValues: { email: '', password: '' },
  })
  
  // Site settings hooks
  const siteName = useSiteName()
  const logoUrl = useSiteLogo(true) // Always use full logo for admin login

  // (#106) Removed duplicate AuthErrorHandler.createAuthStateChangeHandler() listener
  // Auth state changes (including refresh token errors) are now handled centrally
  // by AuthProvider which wraps this page in the app layout.

  const onSubmit = async (data: LoginRequest) => {
    setIsLoading(true)
    setError('')

    try {
      // Step 1: Authenticate using authService
      const authData = await authService.signIn(data.email, data.password)

      if (!authData.user || !authData.session) {
        throw new Error('Authentication failed')
      }

      // Step 2: Verify admin role using direct API call with Bearer token
      const response = await fetch(ADMIN_ENDPOINTS.VERIFY_ROLE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.session.access_token}`
        },
        credentials: 'include'
      })

      const roleData = await response.json() as VerifyRoleResponse

      if (!response.ok || !roleData.success) {
        // Sign out if not admin
        await authService.signOut()
        throw new Error(roleData.error || 'Access denied: Admin privileges required')
      }

      // Step 3: Verify user is SUPER ADMIN (not just admin)
      if (!roleData.data?.isSuperAdmin) {
        await authService.signOut()
        throw new Error('Access denied: Super Admin privileges required. This area is restricted to Super Admins only.')
      }

      // Step 4: The authService.signIn already calls AUTH_ENDPOINTS.SESSION to set server-side cookies
      // We can just proceed to redirect

      // Redirect to admin dashboard — cookies are already set by authService.signIn
      router.push('/')
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0c0c14] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-foreground rounded-full flex items-center justify-center">
            {logoUrl && (
              <Image 
                src={logoUrl} 
                alt="Admin Logo"
                width={48}
                height={48}
                className="object-contain filter brightness-0 invert"
                unoptimized
              />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              Admin Access
            </CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Sign in with admin credentials to access the dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AuthErrorAlert error={error || null} />
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-white font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="admin@example.com"
                className="border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900 dark:text-white font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter your password"
                className="border-gray-200 dark:border-gray-700 focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-rose-600 dark:text-rose-400">{errors.password.message}</p>
              )}
            </div>
            
            <AuthLoadingButton isLoading={isLoading}>
              Sign In to Admin Dashboard
            </AuthLoadingButton>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Only users with admin privileges can access this area
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

