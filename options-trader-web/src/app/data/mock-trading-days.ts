export interface TradingDay {
  date: string; // YYYY-MM-DD
  result: 'profit' | 'loss';
  images: string[];
}

export const MOCK_TRADING_DAYS: TradingDay[] = [
  {
    date: '2026-06-02',
    result: 'profit',
    images: [
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+1',
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+2',
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+3',
    ],
  },
  {
    date: '2026-06-03',
    result: 'loss',
    images: [
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+1',
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+2',
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+3',
    ],
  },
  {
    date: '2026-06-04',
    result: 'profit',
    images: [
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+1',
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+2',
      'https://placehold.co/800x500/22c55e/ffffff?text=Chart+3',
    ],
  },
  {
    date: '2026-06-05',
    result: 'loss',
    images: [
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+1',
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+2',
      'https://placehold.co/800x500/ef4444/ffffff?text=Chart+3',
    ],
  },
];
