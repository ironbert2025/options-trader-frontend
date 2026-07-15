export interface Trade {
  id: string;
  date: Date;
  entryTime: string;
  symbol: string;
  type: 'Call' | 'Put';
  strike: number;
  entryPrice: number;
  exitPrice: number;
  contracts: number;
  premium: number;
  pnl: number;
  pnlPercent: number;
  duration: string;
  status: 'Closed' | 'Pending';
}

export interface DayGroup {
  date: Date;
  label: string;
  trades: Trade[];
  dayPnl: number;
  status: 'profit' | 'loss' | 'empty';
}

export interface WeekSummary {
  weekNumber: number;
  label: string;
  range: string;
  totalPnl: number;
  activeDays: number;
  totalTrades: number;
  winRate: number;
  dayGroups: DayGroup[];
}
