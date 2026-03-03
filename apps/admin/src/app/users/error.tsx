'use client';

import { RouteError } from '@/components/shared-primitives';

export default function UsersError(props: { error: Error; reset: () => void }) {
  return <RouteError {...props} message="Failed to load users" />;
}
