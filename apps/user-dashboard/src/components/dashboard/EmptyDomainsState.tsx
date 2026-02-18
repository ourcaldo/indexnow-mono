'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, Button } from '@indexnow/ui';
import { Globe, Plus } from 'lucide-react';

export function EmptyDomainsState() {
  const router = useRouter();

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Globe className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h3 className="mb-2 text-xl font-semibold">Start Tracking Your Rankings</h3>
        <p className="text-muted-foreground mx-auto mb-6 max-w-md">
          Add your first domain and keywords to start monitoring your search engine rankings and
          track your SEO progress.
        </p>
        <Button
          onClick={() => router.push('/dashboard/indexnow/add')}
          className="inline-flex items-center"
          data-testid="button-add-first-domain"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Your First Domain
        </Button>
      </CardContent>
    </Card>
  );
}
