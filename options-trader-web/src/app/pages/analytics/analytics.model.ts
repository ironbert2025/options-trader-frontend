export interface AnalyticsSummary {
  totalPnl: number;
  winRate: number;
  profitFactor: number;
  avgDuration: string;
  minDuration: string;
  maxDuration: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinner: number;
  avgLoser: number;
  largestWin: number;
  largestLoss: number;
}

export interface DayOfWeekStat {
  day: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  totalPnl: number;
  tradeCount: number;
  status: 'profit' | 'loss' | 'pending' | 'empty';
}

export interface SymbolStat {
  symbol: string;
  type: 'Call' | 'Put';
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  pctOfTotal: number;
  isProfit: boolean;
}

export interface DurationBucket {
  label: string;
  count: number;
  pctOfMax: number;
  status: 'profit' | 'mixed' | 'loss';
}

export interface PnlBucket {
  label: string;
  count: number;
  pctOfMax: number;
  status: 'profit' | 'mixed' | 'loss';
}

export interface ScatterPoint {
  durationMinutes: number;
  pnlPercent: number;
  pnl: number;
  status: 'profit' | 'loss';
}
