import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold text-white/10">404</h1>
        <p className="text-sm text-gray-400">Page not found</p>
        <Link
          href="/"
          className="inline-block mt-2 px-3 py-1.5 text-sm text-gray-300 border border-white/[0.08] rounded-md hover:bg-white/[0.04] transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
