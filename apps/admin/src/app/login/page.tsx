'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@indexnow/supabase-client';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.signIn(email, password);
      if (!user) {
        setError('Invalid credentials');
        return;
      }
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a12]">
      <div className="w-full max-w-sm px-6">
        <div className="flex items-center gap-2 mb-8">
          <Lock className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">Admin</span>
        </div>

        <h1 className="text-xl font-semibold text-white mb-1">Sign in</h1>
        <p className="text-[13px] text-gray-500 mb-8">
          Restricted to super admin accounts only.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-[13px] text-gray-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-md px-3 py-2.5 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/[0.15] transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-[13px] text-red-400">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-[13px] font-medium text-white bg-white/10 rounded-md hover:bg-white/[0.15] transition-colors disabled:opacity-40"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
