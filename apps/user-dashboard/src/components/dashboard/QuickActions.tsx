'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@indexnow/ui';
import { Plus, Search, BarChart3, Settings, Zap } from 'lucide-react';

export interface QuickActionsProps {
  domainKeywordsCount: number;
}

export function QuickActions({ domainKeywordsCount }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Zap className="mr-2 h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-11 w-full justify-start transition-colors duration-150"
          onClick={() => router.push('/dashboard/indexnow/add')}
          data-testid="action-add-keywords"
        >
          <Plus className="mr-3 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Add Keywords</div>
            <div className="text-xs opacity-90">Track new terms</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="hover:text-foreground dark:hover:text-foreground h-11 w-full justify-start transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/indexnow/overview')}
          data-testid="action-view-keywords"
        >
          <Search className="mr-3 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">View All Keywords</div>
            <div className="text-muted-foreground hover:text-muted-foreground text-xs">
              {domainKeywordsCount} tracked
            </div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="hover:text-foreground dark:hover:text-foreground h-11 w-full justify-start transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/indexnow/rank-history')}
          data-testid="action-rank-history"
        >
          <BarChart3 className="mr-3 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Rank History</div>
            <div className="text-muted-foreground text-xs">Historical data</div>
          </div>
        </Button>

        <Button
          variant="outline"
          className="hover:text-foreground dark:hover:text-foreground h-11 w-full justify-start transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={() => router.push('/dashboard/settings/plans-billing')}
          data-testid="action-manage-billing"
        >
          <Settings className="mr-3 h-4 w-4" />
          <div className="text-left">
            <div className="font-medium">Manage Billing</div>
            <div className="text-muted-foreground text-xs">Plans & usage</div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}
