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
      if (!user) { setError('Invalid credentials'); return; }

      // Verify admin/super_admin role — the API already validated credentials
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        setError('Access denied. Admin privileges required.');
        return;
      }

      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Admin Panel</span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to access the admin dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder="Enter your password" />
            </div>
            {error && <div className="text-sm text-red-600 font-medium">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-all disabled:opacity-40">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
