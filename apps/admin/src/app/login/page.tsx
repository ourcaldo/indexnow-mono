'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@indexnow/ui'
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { authService } from '@indexnow/shared'
import { useSiteName, useSiteLogo } from '@indexnow/database'
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS, type VerifyRoleResponse } from '@indexnow/shared'
import { AuthErrorHandler } from '@indexnow/auth'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  
  // Site settings hooks
  const siteName = useSiteName()
  const logoUrl = useSiteLogo(true) // Always use full logo for admin login

  useEffect(() => {
    const authStateHandler = AuthErrorHandler.createAuthStateChangeHandler(
      undefined,
      () => {
        window.location.reload()
      }
    )
    
    const { data: authListener } = authService.onFullAuthStateChange(authStateHandler)
    
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Step 1: Authenticate using centralized authService
      const authData = await authService.signIn(email, password)

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

      // Use router.push with a small delay to ensure cookies are set
      setTimeout(() => {
        router.push('/')
      }, 100)
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-foreground rounded-full flex items-center justify-center">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt="Admin Logo"
                className="w-12 h-12 object-contain filter brightness-0 invert"
              />
            )}
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Admin Access
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sign in with admin credentials to access the dashboard
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="border-border focus:border-accent focus:ring-accent"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="border-border focus:border-accent focus:ring-accent pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In to Admin Dashboard'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Only users with admin privileges can access this area
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

