'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@indexnow/ui';
import { Search, Target, BarChart3, Activity } from 'lucide-react';
import type { KeywordData } from './types';

export interface PerformanceOverviewProps {
  domainKeywords: KeywordData[];
  selectedDomainName: string;
  keywordsUsed: number;
}

export function PerformanceOverview({
  domainKeywords,
  selectedDomainName,
  keywordsUsed,
}: PerformanceOverviewProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Performance Overview</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              {selectedDomainName} • Real-time insights
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Total Keywords */}
          <div className="bg-info/10 border-info/20 rounded-lg border p-4 text-center">
            <div className="bg-info/20 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
              <Search className="text-info h-5 w-5" />
            </div>
            <div className="text-foreground text-2xl font-bold" data-testid="stat-total-keywords">
              {domainKeywords.length.toLocaleString()}
            </div>
            <div className="text-muted-foreground text-xs font-medium">Total Keywords</div>
          </div>

          {/* Top 10 Positions */}
          <div className="bg-success/10 border-success/20 rounded-lg border p-4 text-center">
            <div className="bg-success/20 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
              <Target className="text-success h-5 w-5" />
            </div>
            <div className="text-success text-2xl font-bold" data-testid="stat-top-10">
              {
                domainKeywords.filter(
                  (k: KeywordData) => k.recent_ranking?.position && k.recent_ranking.position <= 10
                ).length
              }
            </div>
            <div className="text-success/80 text-xs font-medium">Top 10 Rankings</div>
          </div>

          {/* Average Position */}
          <div className="bg-info/10 border-info/20 rounded-lg border p-4 text-center">
            <div className="bg-info/20 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
              <BarChart3 className="text-info h-5 w-5" />
            </div>
            <div className="text-info text-2xl font-bold" data-testid="stat-avg-position">
              {(() => {
                const ranked = domainKeywords.filter(
                  (k: KeywordData) => k.recent_ranking?.position
                );
                return ranked.length > 0
                  ? Math.round(
                      ranked.reduce(
                        (sum: number, k: KeywordData) => sum + (k.recent_ranking?.position || 100),
                        0
                      ) / ranked.length
                    )
                  : 'N/A';
              })()}
            </div>
            <div className="text-info/80 text-xs font-medium">Avg Position</div>
          </div>

          {/* Keywords Used */}
          <div className="bg-warning/10 border-warning/20 rounded-lg border p-4 text-center">
            <div className="bg-warning/20 mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg">
              <Activity className="text-warning h-5 w-5" />
            </div>
            <div className="text-warning text-2xl font-bold" data-testid="stat-keywords-used">
              {keywordsUsed}
            </div>
            <div className="text-warning/80 text-xs font-medium">Keywords Used</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
