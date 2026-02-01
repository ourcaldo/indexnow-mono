export interface RankingData {
  total: number
  topThree: number
  topTen: number
  topTwenty: number
  topHundred: number
  outOfHundred: number
}

export interface KeywordSummary {
  keyword: string
  current_position: number
  position_1d?: number
}

export interface KeywordsByRange {
  topThree: KeywordSummary[]
  topTen: KeywordSummary[]
  topTwenty: KeywordSummary[]
  topHundred: KeywordSummary[]
  outOfHundred: KeywordSummary[]
}
