import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { KpiSummary, RecentTrade, EquityPoint, ConsistencyDay, QuickStat } from './dashboard.model';
import { TradeService, Trade as ApiTrade } from '../../services/trade.service';
import { AuthService } from '../../services/auth.service';

interface DayAgg {
  date: Date;
  dateKey: string;
  trades: ApiTrade[];
  closedTrades: ApiTrade[];
  dayPnl: number;
  status: 'profit' | 'loss' | 'pending';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  @Input() kpi: KpiSummary | null = null;
  @Input() recentTrades: RecentTrade[] = [];
  @Input() equityPoints: EquityPoint[] = [];
  @Input() consistencyDays: ConsistencyDay[] = [];
  @Input() quickStats: QuickStat[] = [];

  private inputsProvided = false;

  kpiSignal = signal<KpiSummary | null>(null);
  recentTradesSignal = signal<RecentTrade[]>([]);
  equityPointsSignal = signal<EquityPoint[]>([]);
  consistencyDaysSignal = signal<ConsistencyDay[]>([]);
  quickStatsSignal = signal<QuickStat[]>([]);
  lossDaysCount = signal(0);
  lossDaysTotal = signal(0);
  todayTradesCount = signal(0);

  today = new Date();
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  weekdayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];

  constructor(private router: Router, private tradeService: TradeService, private authService: AuthService) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  ngOnInit() {
    this.inputsProvided = !!this.kpi;
    if (this.inputsProvided) {
      this.kpiSignal.set(this.kpi);
      this.recentTradesSignal.set(this.recentTrades);
      this.equityPointsSignal.set(this.equityPoints);
      this.consistencyDaysSignal.set(this.consistencyDays);
      this.quickStatsSignal.set(this.quickStats);
      return;
    }

    const monthStr = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`;
    this.tradeService.getTradesByMonth(monthStr).subscribe(trades => {
      this.buildFromTrades(trades);
    });
  }

  greeting = computed<string>(() => {
    const hour = this.today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  todayLabel = computed<string>(() => {
    return `${this.weekdayNames[this.today.getDay()]}, ${this.monthNames[this.today.getMonth()]} ${this.today.getDate()}, ${this.today.getFullYear()}`;
  });

  equitySvgPoints = computed<string>(() => {
    const points = this.equityPointsSignal();
    if (points.length === 0) return '';

    const values = points.map(p => p.cumulativePnl);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    return points
      .map((p, i) => {
        const x = points.length === 1 ? 0 : (i / (points.length - 1)) * 380;
        const y = 118 - ((p.cumulativePnl - minVal) / range) * 108;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  equityFillPoints = computed<string>(() => {
    const line = this.equitySvgPoints();
    if (!line) return '';
    return `${line} 380,130 0,130`;
  });

  todayDotX = computed<number>(() => {
    const points = this.equityPointsSignal();
    if (points.length === 0) return 0;
    const idx = points.findIndex(p => this.isSameDate(p.date, this.today));
    const i = idx === -1 ? points.length - 1 : idx;
    return points.length === 1 ? 0 : (i / (points.length - 1)) * 380;
  });

  todayDotY = computed<number>(() => {
    const points = this.equityPointsSignal();
    if (points.length === 0) return 118;
    const values = points.map(p => p.cumulativePnl);
    const maxVal = Math.max(...values, 0);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    const idx = points.findIndex(p => this.isSameDate(p.date, this.today));
    const point = idx === -1 ? points[points.length - 1] : points[idx];
    return 118 - ((point.cumulativePnl - minVal) / range) * 108;
  });

  equityMaxLabel = computed<string>(() => {
    const points = this.equityPointsSignal();
    if (points.length === 0) return '$0';
    const max = Math.max(...points.map(p => p.cumulativePnl), 0);
    return this.formatPnl(max);
  });

  navigateToDetail(tradeId: string) {
    this.router.navigate(['/trades', tradeId]);
  }

  navigateToTradeLog() {
    this.router.navigate(['/trades']);
  }

  navigateToJournal() {
    this.router.navigate(['/journal']);
  }

  formatPnl(value: number): string {
    const sign = value < 0 ? '-' : '+';
    const abs = Math.abs(Math.round(value));
    return `${sign}$${abs.toLocaleString('en-US')}`;
  }

  private buildFromTrades(trades: ApiTrade[]) {
    const dayAggs = this.aggregateByDay(trades);
    const sortedDays = [...dayAggs.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
    const closedTrades = trades.filter(t => t.pnlPercent != null);

    const lossDays = sortedDays.filter(d => d.status === 'loss');
    const todayKey = this.dateKey(this.today);
    const todayAgg = sortedDays.find(d => d.dateKey === todayKey);

    this.kpiSignal.set(this.buildKpi(sortedDays, closedTrades));
    this.todayTradesCount.set(todayAgg ? todayAgg.closedTrades.length : 0);
    this.recentTradesSignal.set(this.buildRecentTrades(trades));
    this.equityPointsSignal.set(this.buildEquityPoints(sortedDays));
    this.consistencyDaysSignal.set(this.buildConsistencyDays(sortedDays));
    this.quickStatsSignal.set(this.buildQuickStats(closedTrades));
    this.lossDaysCount.set(lossDays.length);
    this.lossDaysTotal.set(lossDays.reduce((sum, d) => sum + d.dayPnl, 0));
  }

  private aggregateByDay(trades: ApiTrade[]): Map<string, DayAgg> {
    const map = new Map<string, DayAgg>();
    for (const t of trades) {
      const [y, m, d] = t.tradeDate.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const key = t.tradeDate;
      if (!map.has(key)) {
        map.set(key, { date, dateKey: key, trades: [], closedTrades: [], dayPnl: 0, status: 'pending' });
      }
      const agg = map.get(key)!;
      agg.trades.push(t);
      if (t.pnlPercent != null) {
        agg.closedTrades.push(t);
      }
    }
    for (const agg of map.values()) {
      agg.dayPnl = agg.closedTrades.reduce((sum, t) => sum + t.pnl, 0);
      agg.status = agg.closedTrades.length === 0 ? 'pending' : (agg.dayPnl >= 0 ? 'profit' : 'loss');
    }
    return map;
  }

  private buildKpi(sortedDays: DayAgg[], closedTrades: ApiTrade[]): KpiSummary {
    const monthPnl = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const todayKey = this.dateKey(this.today);
    const todayAgg = sortedDays.find(d => d.dateKey === todayKey);
    const todayPnl = todayAgg ? todayAgg.dayPnl : 0;

    const winningTrades = closedTrades.filter(t => t.pnl >= 0).length;
    const losingTrades = closedTrades.filter(t => t.pnl < 0).length;
    const winRate = closedTrades.length > 0 ? Math.round((winningTrades / closedTrades.length) * 100) : 0;

    const tradingDays = sortedDays.filter(d => d.status !== 'pending');
    const { current, best } = this.computeStreaks(tradingDays);

    const avgTradePnl = closedTrades.length > 0 ? monthPnl / closedTrades.length : 0;
    const grossProfit = closedTrades.filter(t => t.pnl >= 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(closedTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);

    return {
      monthPnl,
      todayPnl,
      winRate,
      currentStreak: current,
      bestStreak: best,
      avgTradePnl,
      profitFactor,
      totalTrades: closedTrades.length,
      winningTrades,
      losingTrades,
    };
  }

  private computeStreaks(tradingDays: DayAgg[]): { current: number; best: number } {
    let best = 0;
    let running = 0;
    for (const day of tradingDays) {
      if (day.status === 'profit') {
        running++;
        best = Math.max(best, running);
      } else {
        running = 0;
      }
    }

    let current = 0;
    for (let i = tradingDays.length - 1; i >= 0; i--) {
      if (tradingDays[i].status === 'profit') {
        current++;
      } else {
        break;
      }
    }

    return { current, best };
  }

  private buildRecentTrades(trades: ApiTrade[]): RecentTrade[] {
    const withTime = trades.map(t => ({ trade: t, entryShot: t.screenshots.find(s => s.s3Url.endsWith('_entry.png')) }));

    withTime.sort((a, b) => {
      const aTime = a.entryShot ? new Date(a.entryShot.capturedAt).getTime() : 0;
      const bTime = b.entryShot ? new Date(b.entryShot.capturedAt).getTime() : 0;
      if (a.trade.tradeDate !== b.trade.tradeDate) {
        return b.trade.tradeDate.localeCompare(a.trade.tradeDate);
      }
      return bTime - aTime;
    });

    return withTime.slice(0, 4).map(({ trade: t, entryShot }) => {
      const [y, m, d] = t.tradeDate.split('-').map(Number);
      const entryTime = entryShot
        ? new Date(entryShot.capturedAt + 'Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/New_York' })
        : '--:--';

      return {
        id: String(t.id),
        date: new Date(y, m - 1, d),
        entryTime,
        symbol: t.symbol,
        type: t.optionType === 0 ? 'Call' : 'Put',
        strike: t.strikePrice,
        contracts: t.contracts,
        pnl: t.pnl,
        pnlPercent: t.pnlPercent,
        duration: t.duration,
      };
    });
  }

  private buildEquityPoints(sortedDays: DayAgg[]): EquityPoint[] {
    if (sortedDays.length === 0) return [];

    const year = sortedDays[0].date.getFullYear();
    const month = sortedDays[0].date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayPnlByDate = new Map<string, number>();
    for (const d of sortedDays) {
      dayPnlByDate.set(d.dateKey, d.dayPnl);
    }

    const points: EquityPoint[] = [];
    let cumulative = 0;
    let lastKnownCumulative = 0;
    const todayKey = this.dateKey(this.today);
    let passedToday = false;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = this.dateKey(date);
      if (dayPnlByDate.has(key)) {
        cumulative += dayPnlByDate.get(key)!;
      }
      if (!passedToday) {
        lastKnownCumulative = cumulative;
      }
      if (key === todayKey) {
        passedToday = true;
      }
      points.push({ date, cumulativePnl: passedToday ? lastKnownCumulative : cumulative });
    }

    return points;
  }

  private buildConsistencyDays(sortedDays: DayAgg[]): ConsistencyDay[] {
    const todayKey = this.dateKey(this.today);
    return sortedDays.slice(-10).map(d => ({
      date: d.date,
      label: `${this.monthNames[d.date.getMonth()].slice(0, 3)} ${d.date.getDate()}`,
      status: d.status,
      isToday: d.dateKey === todayKey,
    }));
  }

  private buildQuickStats(closedTrades: ApiTrade[]): QuickStat[] {
    if (closedTrades.length === 0) {
      return [
        { label: 'Best trade', subLabel: 'No closed trades', value: '—', type: 'neutral' },
        { label: 'Worst trade', subLabel: 'No closed trades', value: '—', type: 'neutral' },
        { label: 'Avg winner', subLabel: '0 winning trades', value: '—', type: 'neutral' },
        { label: 'Avg loser', subLabel: '0 losing trades', value: '—', type: 'neutral' },
        { label: 'Fastest trade', subLabel: 'No closed trades', value: '—', type: 'neutral' },
      ];
    }

    const label = (t: ApiTrade) => {
      const [y, m, d] = t.tradeDate.split('-').map(Number);
      const type = t.optionType === 0 ? 'C' : 'P';
      return `${t.symbol} ${type} · ${this.monthNames[m - 1].slice(0, 3)} ${d}`;
    };

    const best = closedTrades.reduce((a, b) => (b.pnl > a.pnl ? b : a));
    const worst = closedTrades.reduce((a, b) => (b.pnl < a.pnl ? b : a));
    const winners = closedTrades.filter(t => t.pnl >= 0);
    const losers = closedTrades.filter(t => t.pnl < 0);
    const avgWinner = winners.length > 0 ? winners.reduce((s, t) => s + t.pnl, 0) / winners.length : 0;
    const avgLoser = losers.length > 0 ? losers.reduce((s, t) => s + t.pnl, 0) / losers.length : 0;
    const fastest = closedTrades.reduce((a, b) => (this.durationSeconds(b.duration) < this.durationSeconds(a.duration) ? b : a));

    return [
      { label: 'Best trade', subLabel: label(best), value: this.formatPnl(best.pnl), type: 'profit' },
      { label: 'Worst trade', subLabel: label(worst), value: this.formatPnl(worst.pnl), type: 'loss' },
      { label: 'Avg winner', subLabel: `${winners.length} winning trade${winners.length !== 1 ? 's' : ''}`, value: this.formatPnl(avgWinner), type: 'profit' },
      { label: 'Avg loser', subLabel: `${losers.length} losing trade${losers.length !== 1 ? 's' : ''}`, value: this.formatPnl(avgLoser), type: 'loss' },
      { label: 'Fastest trade', subLabel: label(fastest), value: fastest.duration, type: 'neutral' },
    ];
  }

  private durationSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
}
