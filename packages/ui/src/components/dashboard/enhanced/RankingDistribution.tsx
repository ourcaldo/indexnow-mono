import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../..';
import { Target, TrendingUp, Award } from 'lucide-react';
import { RankingData, KeywordSummary, KeywordsByRange } from './types';

interface RankingDistributionProps {
  data: RankingData;
  keywordsByRange?: KeywordsByRange;
  title?: string;
  description?: string;
  className?: string;
}

export const RankingDistribution = React.memo(function RankingDistribution({
  data,
  keywordsByRange,
  title = 'Position Distribution',
  description,
  className = '',
}: RankingDistributionProps) {
  const segments = [
    {
      label: 'Top 3',
      range: '1-3',
      count: data.topThree,
      color: 'bg-green-500',
      textColor: 'text-green-500',
      keywords: keywordsByRange?.topThree || [],
    },
    {
      label: 'Top 10',
      range: '4-10',
      count: data.topTen,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      keywords: keywordsByRange?.topTen || [],
    },
    {
      label: 'Top 20',
      range: '11-20',
      count: data.topTwenty,
      color: 'bg-orange-500',
      textColor: 'text-orange-500',
      keywords: keywordsByRange?.topTwenty || [],
    },
    {
      label: 'Top 100',
      range: '21-100',
      count: data.topHundred,
      color: 'bg-red-500',
      textColor: 'text-red-500',
      keywords: keywordsByRange?.topHundred || [],
    },
    {
      label: 'Out of 100',
      range: '>100',
      count: data.outOfHundred,
      color: 'bg-gray-400',
      textColor: 'text-gray-400',
      keywords: keywordsByRange?.outOfHundred || [],
    },
  ];

  const maxCount = Math.max(...segments.map((s) => s.count), 1);
  const rankedCount = data.total - data.outOfHundred;
  const rankedPercentage = data.total > 0 ? Math.round((rankedCount / data.total) * 100) : 0;

  return (
    <Card className={className} data-testid="card-ranking-distribution">
      <CardHeader className="pb-3">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-foreground text-base font-semibold">{title}</CardTitle>
            {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="flex items-center space-x-1"
              data-testid="badge-ranked"
            >
              <Target className="h-3 w-3" />
              <span>{rankedCount} ranked</span>
            </Badge>
            <Badge
              variant="default"
              className="flex items-center space-x-1 bg-green-500 text-white hover:bg-green-600"
              data-testid="badge-percentage"
            >
              <Award className="h-3 w-3" />
              <span>{rankedPercentage}%</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Performance Score */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-foreground text-sm font-medium">Performance Score</span>
            <span className="text-lg font-bold text-green-500" data-testid="text-performance-score">
              {rankedPercentage}%
            </span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${rankedPercentage}%` }}
              data-testid="bar-performance-score"
            />
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Based on keyword position distribution and ranking quality
          </p>
        </div>

        {/* Position Breakdown */}
        <div className={keywordsByRange ? 'grid grid-cols-1 gap-6 lg:grid-cols-2' : ''}>
          {/* Left: Bar Chart */}
          <div className="space-y-3">
            <div className="text-foreground text-sm font-medium">Position Breakdown</div>
            {segments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center space-x-3"
                data-testid={`row-position-${segment.range}`}
              >
                <div className="text-muted-foreground w-20 text-right text-xs">{segment.label}</div>
                <div className="flex flex-1 items-center space-x-2">
                  {/* Bar */}
                  <div className="bg-muted relative h-3 flex-1 overflow-hidden rounded-full">
                    <div
                      className={`h-full ${segment.color} transition-all duration-500 ease-out`}
                      style={{
                        width: maxCount > 0 ? `${(segment.count / maxCount) * 100}%` : '0%',
                      }}
                      data-testid={`bar-${segment.range}`}
                    />
                  </div>
                  {/* Count */}
                  <div
                    className={`text-sm font-medium ${segment.textColor} min-w-[2rem] text-right`}
                    data-testid={`text-count-${segment.range}`}
                  >
                    {segment.count}
                  </div>
                  {/* Percentage */}
                  <div
                    className="text-muted-foreground min-w-[3rem] text-right text-xs"
                    data-testid={`text-percentage-${segment.range}`}
                  >
                    {data.total > 0 ? Math.round((segment.count / data.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Top Keywords */}
          {keywordsByRange && (
            <div className="space-y-3">
              <div className="text-foreground text-sm font-medium">Top Keywords</div>
              {segments.map((segment, index) => {
                const topKeywords = segment.keywords.slice(0, 3);
                return (
                  <div
                    key={index}
                    className="flex min-h-[40px] items-center"
                    data-testid={`keywords-${segment.range}`}
                  >
                    {topKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {topKeywords.map((kw, kwIndex) => (
                          <Badge
                            key={kwIndex}
                            variant="outline"
                            className="px-2 py-0.5 text-xs"
                            data-testid={`keyword-badge-${segment.range}-${kwIndex}`}
                          >
                            {kw.keyword} (#{kw.current_position})
                          </Badge>
                        ))}
                        {segment.keywords.length > 3 && (
                          <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                            +{segment.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">No keywords</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Performance Insights */}
        {rankedCount > 0 && (
          <div className="bg-muted/30 mt-6 rounded-lg p-4" data-testid="section-insights">
            <div className="flex items-start space-x-2">
              <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <div>
                <div className="text-foreground text-sm font-medium">Performance Insight</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {data.topThree > 0 && (
                    <>
                      You have{' '}
                      <span className="font-medium text-green-500">{data.topThree} keywords</span>{' '}
                      in top 3 positions!{' '}
                    </>
                  )}
                  {data.topTen > 0 && (
                    <>
                      Great job with{' '}
                      <span className="font-medium text-blue-500">{data.topTen} keywords</span> in
                      top 10.{' '}
                    </>
                  )}
                  {data.outOfHundred > 0 && (
                    <>
                      Consider optimizing{' '}
                      <span className="font-medium text-gray-500">
                        {data.outOfHundred} unranked keywords
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
