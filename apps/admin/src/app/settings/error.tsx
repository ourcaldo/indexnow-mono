'use client';

import { RouteError } from '@/components/shared-primitives';

export default function SettingsError(props: { error: Error; reset: () => void }) {
  return <RouteError {...props} message="Failed to load settings" />;
}
