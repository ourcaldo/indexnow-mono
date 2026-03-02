import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="text-7xl font-bold text-gray-100">404</div>
        <p className="text-sm text-gray-500">The page you're looking for doesn't exist.</p>
        <Link href="/" className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
