export interface KpiSummary {
  monthPnl: number;
  todayPnl: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  avgTradePnl: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
}

export interface RecentTrade {
  id: string;
  date: Date;
  entryTime: string;
  symbol: string;
  type: 'Call' | 'Put';
  strike: number;
  contracts: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
}

export interface EquityPoint {
  date: Date;
  cumulativePnl: number;
}

export interface ConsistencyDay {
  date: Date;
  label: string;
  status: 'profit' | 'loss' | 'pending' | 'empty';
  isToday: boolean;
}

export interface QuickStat {
  label: string;
  subLabel: string;
  value: string;
  type: 'profit' | 'loss' | 'neutral';
}
