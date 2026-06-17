export interface TradingDay {
  date: string; // YYYY-MM-DD
  result: 'profit' | 'loss';
  images: string[];
}

export const MOCK_TRADING_DAYS: TradingDay[] = [
  {
    date: '2026-06-17',
    result: 'loss',
    images: [],
  },
];
