// (#V7 L-26) Email input uses native HTML type="email" validation.
// Adding Zod validation (z.string().email()) would provide stricter
// client-side checks but the API already validates server-side.
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSiteName, useSiteLogo } from '@indexnow/database/client';
import { ArrowLeft, Send } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  DashboardPreview,
} from '@indexnow/ui';
import { AUTH_ENDPOINTS } from '@indexnow/shared';

export default function ResendVerification() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Site settings hooks
  const siteName = useSiteName();
  const logoUrl = useSiteLogo(true);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(AUTH_ENDPOINTS.RESEND_VERIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include', // Essential for cross-subdomain authentication
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to send verification email');
        return;
      }

      setMessage('Verification email sent! Please check your inbox and spam folder.');
      setEmail('');
    } catch (error) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen ${isMobile ? 'flex-col' : 'flex-row'} font-sans`}>
      {/* Left Side - Resend Verification Form */}
      <div
        className={`${isMobile ? 'w-full' : 'w-1/2'} bg-background ${isMobile ? 'px-5 py-10' : 'p-[60px]'} flex flex-col justify-center ${isMobile ? 'items-center' : 'items-start'} relative`}
      >
        {/* Logo for both mobile and desktop */}
        {logoUrl && (
          <div
            className={`absolute ${isMobile ? 'top-5 left-5' : 'top-10 left-[60px]'} flex items-center`}
          >
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
        <div className={`w-full max-w-md ${isMobile ? 'mt-24 text-center' : 'text-left'}`}>
          <h1
            className={`${isMobile ? 'text-2xl' : 'text-3xl'} text-brand-primary mb-2 leading-tight font-bold`}
          >
            Having Problems?
          </h1>
          <p
            className={`${isMobile ? 'text-sm' : 'text-base'} text-muted-foreground mb-10 leading-relaxed`}
          >
            Enter your email address and we'll send you a new verification link to get you back on
            track.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-6">
              <label className="text-muted-foreground mb-2 block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-field-default form-field-focus w-full px-4 py-3 text-base"
                placeholder="your@email.com"
                required
                disabled={isLoading}
                data-testid="input-email"
              />
            </div>

            {/* Error Message */}
            {error && <div className="badge-error mb-6 rounded-lg p-3 text-center">{error}</div>}

            {/* Success Message */}
            {message && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
                <div className="text-green-800 dark:text-green-400">{message}</div>
              </div>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-brand-primary hover:bg-brand-secondary mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 px-6 py-[14px] text-base font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              data-testid="button-send"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Verification Email
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="border-border border-t pt-6 text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-muted-foreground hover:text-foreground mx-auto flex cursor-pointer items-center gap-2 border-0 bg-transparent text-sm transition-colors"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Dashboard Preview (Desktop Only) */}
      {!isMobile && (
        <div className="bg-brand-primary relative flex w-1/2 flex-col items-center justify-center p-[60px] text-white">
          <div className="relative h-full w-full overflow-hidden">
            <DashboardPreview />
          </div>
        </div>
      )}
    </div>
  );
}
