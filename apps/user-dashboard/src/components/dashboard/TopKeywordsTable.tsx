'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@indexnow/ui';
import { Search, Plus, ChevronRightIcon } from 'lucide-react';
import { PositionChange } from '@indexnow/ui/dashboard';
import type { KeywordData } from './types';

export interface TopKeywordsTableProps {
  domainKeywords: KeywordData[];
  selectedDomainName: string;
  calculatePositionChange: (keyword: KeywordData) => number | null;
}

export function TopKeywordsTable({
  domainKeywords,
  selectedDomainName,
  calculatePositionChange,
}: TopKeywordsTableProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Top Keywords</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm">
              Latest performance • {selectedDomainName}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/indexnow/overview')}
            data-testid="button-view-all-keywords"
            className="btn-hover shrink-0"
          >
            View All ({domainKeywords.length})
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {domainKeywords.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="bg-muted/50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Search className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">No Keywords Yet</h3>
            <p className="text-muted-foreground mb-6 text-sm">
              Start tracking keywords for this domain to see performance data here.
            </p>
            <Button
              onClick={() => router.push('/dashboard/indexnow/add')}
              size="sm"
              className="btn-hover"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Keywords
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Mobile-friendly header */}
            <div className="text-muted-foreground bg-muted/30 hidden gap-3 border-b px-6 py-3 text-xs font-semibold tracking-wide uppercase md:grid md:grid-cols-12">
              <div className="col-span-4">Keyword</div>
              <div className="col-span-2 text-center">Position</div>
              <div className="col-span-2 text-center">Country</div>
              <div className="col-span-2 text-center">Device</div>
              <div className="col-span-2 text-center">Tags</div>
            </div>

            {/* Keywords List */}
            <div className="divide-y">
              {domainKeywords.slice(0, 8).map((keyword: KeywordData, index) => {
                const currentPos = keyword.recent_ranking?.position || keyword.current_position;
                const positionChange = calculatePositionChange(keyword);

                return (
                  <div
                    key={keyword.id || index}
                    className="hover:bg-muted/50 gap-3 p-4 transition-colors md:grid md:grid-cols-12 md:px-6 md:py-3"
                  >
                    {/* Mobile Layout */}
                    <div className="space-y-2 md:hidden">
                      <div className="flex items-center justify-between">
                        <div className="text-foreground mr-2 flex-1 truncate font-medium">
                          {keyword.keyword}
                        </div>
                        <div className="flex shrink-0 items-center space-x-1">
                          <span className="text-foreground text-xs font-medium">
                            {currentPos ? `#${currentPos}` : 'NR'}
                          </span>
                          <PositionChange change={positionChange} className="text-xs" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground text-xs">
                            {keyword.country?.iso2_code?.toUpperCase() || 'N/A'}
                          </span>
                          <span className="text-muted-foreground text-xs capitalize">
                            {keyword.device_type}
                          </span>
                        </div>
                        {keyword.tags && keyword.tags.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-muted-foreground text-xs">{keyword.tags[0]}</span>
                            {keyword.tags.length > 1 && (
                              <span className="text-muted-foreground text-xs">
                                +{keyword.tags.length - 1}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden md:contents">
                      {/* Keyword */}
                      <div className="text-foreground col-span-4 truncate font-medium">
                        {keyword.keyword}
                      </div>

                      {/* Position */}
                      <div className="col-span-2 flex items-center justify-center space-x-1">
                        <span className="text-foreground text-sm font-medium">
                          {currentPos ? `#${currentPos}` : 'NR'}
                        </span>
                        <PositionChange change={positionChange} className="text-xs" />
                      </div>

                      {/* Country */}
                      <div className="col-span-2 flex justify-center">
                        <span className="text-muted-foreground text-sm">
                          {keyword.country?.iso2_code?.toUpperCase() || 'N/A'}
                        </span>
                      </div>

                      {/* Device */}
                      <div className="col-span-2 flex justify-center">
                        <span className="text-muted-foreground text-sm capitalize">
                          {keyword.device_type}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="col-span-2 flex justify-center">
                        {keyword.tags && keyword.tags.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-muted-foreground text-sm">{keyword.tags[0]}</span>
                            {keyword.tags.length > 1 && (
                              <span className="text-muted-foreground text-sm">
                                +{keyword.tags.length - 1}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
