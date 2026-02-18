import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../..';
import { Target, TrendingUp, Award } from 'lucide-react';

export interface RankingData {
  position: number | null;
  keyword: string;
  domain: string;
}

interface RankingDistributionProps {
  data: RankingData[];
  title?: string;
  description?: string;
  className?: string;
}

export const LegacyRankingDistribution = React.memo(function LegacyRankingDistribution({
  data,
  title = 'Ranking Distribution',
  description = 'Overview of your keyword positions',
  className = '',
}: RankingDistributionProps) {
  // Guard against empty data
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Target className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">No ranking data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate distribution
  const rankedKeywords = data.filter((item) => item.position !== null && item.position > 0);
  const unrankedCount = data.length - rankedKeywords.length;

  const distribution = {
    top3: rankedKeywords.filter((item) => item.position! <= 3).length,
    top10: rankedKeywords.filter((item) => item.position! <= 10 && item.position! > 3).length,
    top20: rankedKeywords.filter((item) => item.position! <= 20 && item.position! > 10).length,
    top50: rankedKeywords.filter((item) => item.position! <= 50 && item.position! > 20).length,
    beyond50: rankedKeywords.filter((item) => item.position! > 50).length,
    unranked: unrankedCount,
  };

  const totalKeywords = data.length;
  const rankedPercentage =
    totalKeywords > 0 ? Math.round((rankedKeywords.length / totalKeywords) * 100) : 0;

  // Distribution segments for visualization
  const segments = [
    {
      label: 'Top 3',
      count: distribution.top3,
      color: 'bg-[hsl(var(--success))]',
      textColor: 'text-[hsl(var(--success))]',
    },
    {
      label: 'Top 10',
      count: distribution.top10,
      color: 'bg-[hsl(var(--info))]',
      textColor: 'text-[hsl(var(--info))]',
    },
    {
      label: 'Top 20',
      count: distribution.top20,
      color: 'bg-[hsl(var(--accent))]',
      textColor: 'text-[hsl(var(--accent))]',
    },
    {
      label: 'Top 50',
      count: distribution.top50,
      color: 'bg-[hsl(var(--warning))]',
      textColor: 'text-[hsl(var(--warning))]',
    },
    {
      label: '50+',
      count: distribution.beyond50,
      color: 'bg-[hsl(var(--muted))]',
      textColor: 'text-[hsl(var(--muted-foreground))]',
    },
    {
      label: 'Unranked',
      count: distribution.unranked,
      color: 'bg-[hsl(var(--error))]',
      textColor: 'text-[hsl(var(--error))]',
    },
  ];

  const maxCount = Math.max(...segments.map((s) => s.count));

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>{rankedKeywords.length} ranked</span>
            </Badge>
            <Badge
              variant="default"
              className="flex items-center space-x-1 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]"
            >
              <Award className="h-3 w-3" />
              <span>{rankedPercentage}%</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-[hsl(var(--success))]">{distribution.top3}</div>
            <div className="text-muted-foreground text-xs">Top 3 Positions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[hsl(var(--info))]">{distribution.top10}</div>
            <div className="text-muted-foreground text-xs">Top 10 Positions</div>
          </div>
          <div className="text-center">
            <div className="text-foreground text-2xl font-bold">{totalKeywords}</div>
            <div className="text-muted-foreground text-xs">Total Keywords</div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="space-y-3">
          <div className="text-foreground text-sm font-medium">Position Distribution</div>
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="text-muted-foreground w-16 text-right text-xs">{segment.label}</div>
              <div className="flex flex-1 items-center space-x-2">
                {/* Bar */}
                <div className="bg-muted relative h-3 flex-1 overflow-hidden rounded-full">
                  <div
                    className={`h-full ${segment.color} transition-all duration-500 ease-out`}
                    style={{
                      width: maxCount > 0 ? `${(segment.count / maxCount) * 100}%` : '0%',
                    }}
                  />
                </div>
                {/* Count */}
                <div className={`text-sm font-medium ${segment.textColor} min-w-[2rem] text-right`}>
                  {segment.count}
                </div>
                {/* Percentage */}
                <div className="text-muted-foreground min-w-[3rem] text-right text-xs">
                  {totalKeywords > 0 ? Math.round((segment.count / totalKeywords) * 100) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Insights */}
        {rankedKeywords.length > 0 && (
          <div className="bg-muted/30 mt-6 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-[hsl(var(--success))]" />
              <div>
                <div className="text-foreground text-sm font-medium">Performance Insight</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {distribution.top3 > 0 && (
                    <>
                      You have{' '}
                      <span className="font-medium text-[hsl(var(--success))]">
                        {distribution.top3} keywords
                      </span>{' '}
                      in top 3 positions!{' '}
                    </>
                  )}
                  {distribution.top10 > 0 && (
                    <>
                      Great job with{' '}
                      <span className="font-medium text-[hsl(var(--info))]">
                        {distribution.top10} keywords
                      </span>{' '}
                      in top 10.{' '}
                    </>
                  )}
                  {distribution.unranked > 0 && (
                    <>
                      Consider optimizing{' '}
                      <span className="font-medium text-[hsl(var(--error))]">
                        {distribution.unranked} unranked keywords
                      </span>{' '}
                      for better visibility.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
