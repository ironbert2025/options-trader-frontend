export interface TradeDay {
  date: Date;
  status: 'profit' | 'loss' | 'pending' | 'none';
  pnl: number;
  tradeCount: number;
}

export interface WeekSummary {
  weekNumber: number;
  totalPnl: number;
  activeDays: number;
  totalTrades: number;
  status: 'profit' | 'loss' | 'empty';
}

export interface MonthSummary {
  monthPnl: number;
  tradingDays: number;
  totalDays: number;
  winRate: number;
  totalTrades: number;
}
