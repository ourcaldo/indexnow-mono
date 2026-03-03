import Link from 'next/link';

/**
 * Shared 404 page component.
 * Use as the default export from `app/not-found.tsx`.
 */
export function NotFoundPage({
  heading = 'Page Not Found',
  description = 'The page you are looking for does not exist or has been moved.',
  backLabel = 'Go to Dashboard',
  backHref = '/',
}: {
  heading?: string;
  description?: string;
  backLabel?: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <div className="text-7xl font-bold text-gray-200 dark:text-gray-700">404</div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">{heading}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        <Link
          href={backHref}
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
