import { Component, Input, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  AnalyticsSummary,
  DayOfWeekStat,
  SymbolStat,
  DurationBucket,
  PnlBucket,
  ScatterPoint,
} from './analytics.model';
import { Trade } from '../trade-log/trade-log.model';
import { TradeService, Trade as ApiTrade } from '../../services/trade.service';
import { AuthService } from '../../services/auth.service';

const DAY_NAMES: DayOfWeekStat['day'][] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DURATION_BUCKET_DEFS = [
  { label: '0–15 min', min: 0, max: 15 },
  { label: '15–30 min', min: 15, max: 30 },
  { label: '30–60 min', min: 30, max: 60 },
  { label: '60–90 min', min: 60, max: 90 },
  { label: '90+ min', min: 90, max: Infinity },
];
const PNL_BUCKET_DEFS = [
  { label: '< 0%', min: -Infinity, max: 0 },
  { label: '0–25%', min: 0, max: 25 },
  { label: '25–50%', min: 25, max: 50 },
  { label: '50–75%', min: 50, max: 75 },
  { label: '75–100%', min: 75, max: Infinity },
];

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss',
})
export class AnalyticsComponent implements OnInit {
  @Input() trades: Trade[] = [];

  private inputProvided = false;
  private tradesSignal = signal<Trade[]>([]);

  period = signal<'week' | 'month' | 'alltime'>('month');
  today = new Date();
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  constructor(private tradeService: TradeService, private router: Router, private authService: AuthService) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  ngOnInit() {
    this.inputProvided = !!this.trades?.length;
    if (this.inputProvided) {
      this.tradesSignal.set(this.trades);
      return;
    }
    const monthStr = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`;
    this.tradeService.getTradesByMonth(monthStr).subscribe(apiTrades => {
      this.tradesSignal.set(apiTrades.map(t => this.mapApiTrade(t)));
    });
  }

  setPeriod(p: 'week' | 'month' | 'alltime') {
    this.period.set(p);
  }

  periodLabel = computed<string>(() => {
    if (this.period() === 'alltime') return 'All time';
    return `${this.monthNames[this.today.getMonth()]} ${this.today.getFullYear()}`;
  });

  filteredTrades = computed<Trade[]>(() => {
    const all = this.tradesSignal();
    const p = this.period();
    if (p === 'alltime') return all;

    if (p === 'month') {
      return all.filter(t => t.date.getFullYear() === this.today.getFullYear() && t.date.getMonth() === this.today.getMonth());
    }

    const weekStart = this.startOfWeek(this.today);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return all.filter(t => t.date >= weekStart && t.date <= weekEnd);
  });

  private closedTrades = computed<Trade[]>(() =>
    this.filteredTrades().filter(t => t.status === 'Closed')
  );

  summary = computed<AnalyticsSummary>(() => {
    const closed = this.closedTrades();
    const totalPnl = closed.reduce((sum, t) => sum + t.pnl, 0);
    const winners = closed.filter(t => t.pnl >= 0);
    const losers = closed.filter(t => t.pnl < 0);
    const winRate = closed.length > 0 ? Math.round((winners.length / closed.length) * 100) : 0;

    const grossProfit = winners.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? grossProfit : 0);

    const durations = closed.map(t => this.durationToMinutes(t.duration));
    const avgMinutes = durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : 0;
    const minMinutes = durations.length > 0 ? Math.min(...durations) : 0;
    const maxMinutes = durations.length > 0 ? Math.max(...durations) : 0;

    const avgWinner = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoser = losers.length > 0 ? -grossLoss / losers.length : 0;
    const largestWin = winners.length > 0 ? Math.max(...winners.map(t => t.pnl)) : 0;
    const largestLoss = losers.length > 0 ? Math.min(...losers.map(t => t.pnl)) : 0;

    return {
      totalPnl,
      winRate,
      profitFactor,
      avgDuration: this.minutesToHHMM(avgMinutes),
      minDuration: this.minutesToHHMM(minMinutes),
      maxDuration: this.minutesToHHMM(maxMinutes),
      totalTrades: closed.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      avgWinner,
      avgLoser,
      largestWin,
      largestLoss,
    };
  });

  dayOfWeekStats = computed<DayOfWeekStat[]>(() => {
    const trades = this.filteredTrades();
    return DAY_NAMES.map((day, index) => {
      const dayTrades = trades.filter(t => t.date.getDay() === index);
      const closed = dayTrades.filter(t => t.status === 'Closed');
      const dayPnl = closed.reduce((s, t) => s + t.pnl, 0);

      let status: DayOfWeekStat['status'] = 'empty';
      if (dayTrades.length > 0) {
        status = closed.length === 0 ? 'pending' : (dayPnl >= 0 ? 'profit' : 'loss');
      }

      return { day, totalPnl: dayPnl, tradeCount: dayTrades.length, status };
    });
  });

  dayBarHeight(day: DayOfWeekStat): number {
    if (day.status === 'empty') return 4;
    const total = this.summary().totalPnl;
    const magnitude = total > 0 ? Math.abs(day.totalPnl) / total : 0.2;
    return 10 + magnitude * 60;
  }

  bestDay = computed<string>(() => {
    const profitDays = this.dayOfWeekStats().filter(d => d.status === 'profit');
    if (profitDays.length === 0) return '—';
    const best = profitDays.reduce((a, b) => (b.totalPnl > a.totalPnl ? b : a));
    return DAY_FULL_NAMES[DAY_NAMES.indexOf(best.day)];
  });

  dayOfWeekInsight = computed<string>(() => {
    const days = this.dayOfWeekStats().filter(d => d.status === 'profit').sort((a, b) => b.totalPnl - a.totalPnl);
    const total = this.summary().totalPnl;
    if (days.length === 0 || total <= 0) {
      return 'Not enough closed trades yet to surface a day-of-week pattern.';
    }
    const top = days.slice(0, 2);
    const pct = Math.round((top.reduce((s, d) => s + d.totalPnl, 0) / total) * 100);
    const names = top.map(d => DAY_FULL_NAMES[DAY_NAMES.indexOf(d.day)]);
    return `${names.join('–')} account for ${pct}% of your period PnL.`;
  });

  symbolStats = computed<SymbolStat[]>(() => {
    const trades = this.filteredTrades();
    const groups = new Map<string, Trade[]>();
    for (const t of trades) {
      const key = `${t.symbol}|${t.type}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }

    const totalPnlAbs = Math.abs(this.summary().totalPnl) || 1;

    return [...groups.entries()]
      .map(([key, groupTrades]) => {
        const [symbol, type] = key.split('|') as [string, 'Call' | 'Put'];
        const closed = groupTrades.filter(t => t.status === 'Closed');
        const totalPnl = closed.reduce((s, t) => s + t.pnl, 0);
        const winners = closed.filter(t => t.pnl >= 0);
        const winRate = closed.length > 0 ? Math.round((winners.length / closed.length) * 100) : 0;

        return {
          symbol,
          type,
          totalPnl,
          tradeCount: groupTrades.length,
          winRate,
          pctOfTotal: Math.min(100, (Math.abs(totalPnl) / totalPnlAbs) * 100),
          isProfit: totalPnl >= 0,
        };
      })
      .sort((a, b) => Math.abs(b.totalPnl) - Math.abs(a.totalPnl));
  });

  durationBuckets = computed<DurationBucket[]>(() => this.buildBuckets(
    DURATION_BUCKET_DEFS,
    t => this.durationToMinutes(t.duration)
  ));

  pnlBuckets = computed<PnlBucket[]>(() => this.buildBuckets(
    PNL_BUCKET_DEFS,
    t => t.pnlPercent ?? 0
  ));

  scatterPoints = computed<ScatterPoint[]>(() =>
    this.closedTrades().map(t => ({
      durationMinutes: this.durationToMinutes(t.duration),
      pnlPercent: t.pnlPercent ?? 0,
      pnl: t.pnl,
      status: t.pnl >= 0 ? 'profit' : 'loss',
    }))
  );

  private scatterRanges = computed(() => {
    const points = this.scatterPoints();
    const pnlPercents = points.map(p => p.pnlPercent);
    const absPnls = points.map(p => Math.abs(p.pnl));
    return {
      minPct: pnlPercents.length ? Math.min(...pnlPercents) : 0,
      maxPct: pnlPercents.length ? Math.max(...pnlPercents) : 1,
      maxAbsPnl: absPnls.length ? Math.max(...absPnls) : 1,
    };
  });

  sweetSpotRange = computed<string>(() => {
    const trades = this.closedTrades();
    let bestLabel = '—';
    let bestAvg = -Infinity;

    for (const def of DURATION_BUCKET_DEFS) {
      const bucketTrades = trades.filter(t => {
        const m = this.durationToMinutes(t.duration);
        return m >= def.min && m < def.max;
      });
      if (bucketTrades.length === 0) continue;
      const avg = bucketTrades.reduce((s, t) => s + t.pnl, 0) / bucketTrades.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestLabel = def.label;
      }
    }

    return bestLabel;
  });

  pnlDistributionInsight = computed<string>(() => {
    const closed = this.closedTrades();
    if (closed.length === 0) return 'Not enough closed trades yet to show a distribution.';
    const above50 = closed.filter(t => (t.pnlPercent ?? 0) > 50).length;
    const pct = Math.round((above50 / closed.length) * 100);
    return `${pct}% of trades hit >50% PnL.`;
  });

  scatterDotStyle(point: ScatterPoint): { left: string; top: string; width: string; height: string } {
    const { minPct, maxPct, maxAbsPnl } = this.scatterRanges();
    const xPct = Math.min(95, (point.durationMinutes / 90) * 100);
    const yNorm = this.normalize(point.pnlPercent, minPct, maxPct);
    const yPct = 100 - yNorm * 90;
    const sizeNorm = this.normalize(Math.abs(point.pnl), 0, maxAbsPnl);
    const size = 6 + sizeNorm * 10;

    return {
      left: `${xPct}%`,
      top: `${yPct}%`,
      width: `${size}px`,
      height: `${size}px`,
    };
  }

  formatPnl(value: number): string {
    const sign = value < 0 ? '-' : '+';
    const abs = Math.abs(Math.round(value));
    return `${sign}$${abs.toLocaleString('en-US')}`;
  }

  private buildBuckets<T extends { label: string; min: number; max: number }>(
    defs: T[],
    getValue: (t: Trade) => number
  ): DurationBucket[] {
    const closed = this.closedTrades();
    const counts = defs.map(def => closed.filter(t => {
      const v = getValue(t);
      return v >= def.min && v < def.max;
    }));

    const maxCount = Math.max(...counts.map(c => c.length), 0);

    return defs.map((def, i) => {
      const bucketTrades = counts[i];
      const profitCount = bucketTrades.filter(t => t.pnl >= 0).length;
      const lossCount = bucketTrades.length - profitCount;

      let status: DurationBucket['status'] = 'profit';
      if (bucketTrades.length > 0) {
        if (lossCount === 0) status = 'profit';
        else if (lossCount > bucketTrades.length / 2) status = 'loss';
        else status = 'mixed';
      }

      return {
        label: def.label,
        count: bucketTrades.length,
        pctOfMax: maxCount > 0 ? (bucketTrades.length / maxCount) * 75 : 0,
        status,
      };
    });
  }

  private mapApiTrade(t: ApiTrade): Trade {
    const [y, m, d] = t.tradeDate.split('-').map(Number);
    const isClosed = t.pnlPercent != null;
    const entryShot = t.screenshots.find(s => s.s3Url.endsWith('_entry.png'));
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
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      contracts: t.contracts,
      premium: t.entryPrice * 100 * t.contracts,
      pnl: t.pnl,
      pnlPercent: t.pnlPercent,
      duration: t.duration,
      status: isClosed ? 'Closed' : 'Pending',
    };
  }

  private durationToMinutes(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
    if (parts.length === 2) return parts[0] + parts[1] / 60;
    return 0;
  }

  private minutesToHHMM(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  private normalize(value: number, min: number, max: number): number {
    if (max <= min) return 0.5;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  private startOfWeek(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }
}
