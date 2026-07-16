import { Component, Input, OnChanges, OnInit, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Trade, DayGroup, WeekSummary } from './trade-log.model';
import { TradeService, Trade as ApiTrade } from '../../services/trade.service';

interface DisplayRow {
  kind: 'day' | 'empty-range';
  group?: DayGroup;
  startLabel?: string;
  endLabel?: string;
}

@Component({
  selector: 'app-trade-log',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-log.component.html',
  styleUrl: './trade-log.component.scss',
})
export class TradeLogComponent implements OnChanges, OnInit {
  @Input() trades: Trade[] = [];

  private tradesSignal = signal<Trade[]>([]);
  private inputProvided = false;

  viewMode = signal<'week' | 'month'>('week');
  currentWeekIndex = signal(0);
  activeFilter = signal<'all' | 'profit' | 'loss'>('all');
  currentPage = signal(1);
  pageSize = 10;
  collapsedIndices = signal<Set<number>>(new Set());

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weekdayLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(private router: Router, private tradeService: TradeService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['trades'] && this.trades?.length) {
      this.inputProvided = true;
      this.tradesSignal.set(this.trades);
      this.currentWeekIndex.set(this.currentWeekIndexForToday());
      this.currentPage.set(1);
    }
  }

  ngOnInit() {
    if (!this.inputProvided) {
      const today = new Date();
      const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      this.tradeService.getTradesByMonth(monthStr).subscribe(apiTrades => {
        if (!this.inputProvided) {
          this.tradesSignal.set(apiTrades.map(t => this.mapApiTrade(t)));
          this.currentWeekIndex.set(this.currentWeekIndexForToday());
        }
      });
    }
  }

  private currentWeekIndexForToday(): number {
    const today = new Date();
    const weeks = this.weeks();
    const index = weeks.findIndex(w =>
      w.dayGroups.some(g =>
        g.date.getFullYear() === today.getFullYear() &&
        g.date.getMonth() === today.getMonth() &&
        g.date.getDate() === today.getDate()
      )
    );
    return index === -1 ? Math.max(0, weeks.length - 1) : index;
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

  weeks = computed<WeekSummary[]>(() => {
    const trades = this.tradesSignal();
    if (trades.length === 0) return [];

    const year = trades[0].date.getFullYear();
    const month = trades[0].date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const byDate = new Map<string, Trade[]>();
    for (const t of trades) {
      const key = this.dateKey(t.date);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(t);
    }

    const weekdayDates: Date[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const weekday = date.getDay();
      if (weekday !== 0 && weekday !== 6) {
        weekdayDates.push(date);
      }
    }

    const buckets = new Map<number, Date[]>();
    for (const date of weekdayDates) {
      const iso = this.getISOWeek(date);
      if (!buckets.has(iso)) buckets.set(iso, []);
      buckets.get(iso)!.push(date);
    }

    const isoWeekKeys = Array.from(buckets.keys()).sort((a, b) => a - b);

    return isoWeekKeys.map((isoWeek, index) => {
      const dates = buckets.get(isoWeek)!;
      const dayGroups: DayGroup[] = dates.map(date => {
        const key = this.dateKey(date);
        const dayTrades = byDate.get(key) ?? [];
        const dayPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        const status: DayGroup['status'] = dayTrades.length === 0
          ? 'empty'
          : (dayPnl >= 0 ? 'profit' : 'loss');
        return {
          date,
          label: `${this.weekdayLong[date.getDay()]}, ${this.formatShortDay(date)}`,
          trades: dayTrades,
          dayPnl,
          status,
        };
      });

      const activeDayGroups = dayGroups.filter(g => g.trades.length > 0);
      const totalPnl = activeDayGroups.reduce((sum, g) => sum + g.dayPnl, 0);
      const totalTrades = activeDayGroups.reduce((sum, g) => sum + g.trades.length, 0);
      const closedTrades = activeDayGroups.flatMap(g => g.trades).filter(t => t.status === 'Closed');
      const winRate = closedTrades.length > 0
        ? Math.round((closedTrades.filter(t => t.pnl >= 0).length / closedTrades.length) * 100)
        : 0;

      const first = dates[0];
      const last = dates[dates.length - 1];

      return {
        weekNumber: isoWeek,
        label: `W${index + 1}`,
        range: `${this.formatShortDay(first)}–${last.getDate()}`,
        totalPnl,
        activeDays: activeDayGroups.length,
        totalTrades,
        winRate,
        dayGroups,
      };
    });
  });

  currentWeek = computed<WeekSummary | null>(() => {
    const weeks = this.weeks();
    if (weeks.length === 0) return null;
    const index = Math.min(this.currentWeekIndex(), weeks.length - 1);
    return weeks[index];
  });

  filteredDayGroups = computed<DayGroup[]>(() => {
    const week = this.currentWeek();
    if (!week) return [];
    const filter = this.activeFilter();

    return week.dayGroups.map(group => {
      const trades = group.trades.filter(t => this.matchesFilter(t, filter));
      const dayPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
      const status: DayGroup['status'] = trades.length === 0
        ? 'empty'
        : (dayPnl >= 0 ? 'profit' : 'loss');
      return { ...group, trades, dayPnl, status };
    });
  });

  weekDisplayRows = computed<DisplayRow[]>(() => {
    const rows: DisplayRow[] = [];
    let emptyRun: DayGroup[] = [];

    const flushEmptyRun = () => {
      if (emptyRun.length === 0) return;
      const start = emptyRun[0];
      const end = emptyRun[emptyRun.length - 1];
      rows.push({
        kind: 'empty-range',
        startLabel: `${this.weekdayShort[start.date.getDay()]} ${this.formatShortDay(start.date)}`,
        endLabel: `${this.weekdayShort[end.date.getDay()]} ${this.formatShortDay(end.date)}`,
      });
      emptyRun = [];
    };

    for (const group of this.filteredDayGroups()) {
      if (group.trades.length === 0) {
        emptyRun.push(group);
      } else {
        flushEmptyRun();
        rows.push({ kind: 'day', group });
      }
    }
    flushEmptyRun();

    return rows;
  });

  monthTrades = computed<Trade[]>(() => {
    const filter = this.activeFilter();
    return [...this.tradesSignal()]
      .filter(t => this.matchesFilter(t, filter))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  });

  monthTotal = computed<number>(() =>
    this.monthTrades().reduce((sum, t) => sum + t.pnl, 0)
  );

  monthWinRate = computed<number>(() => {
    const closed = this.monthTrades().filter(t => t.status === 'Closed');
    if (closed.length === 0) return 0;
    return Math.round((closed.filter(t => t.pnl >= 0).length / closed.length) * 100);
  });

  totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(this.monthTrades().length / this.pageSize))
  );

  pageNumbers = computed<number[]>(() =>
    Array.from({ length: this.totalPages() }, (_, i) => i + 1)
  );

  paginatedMonthTrades = computed<Trade[]>(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.monthTrades().slice(start, start + this.pageSize);
  });

  pageSubtitle = computed<string>(() => {
    const trades = this.tradesSignal();
    if (trades.length === 0) return '';
    const monthLabel = `${this.monthNames[trades[0].date.getMonth()]} ${trades[0].date.getFullYear()}`;

    if (this.viewMode() === 'month') {
      return `${monthLabel} · All trades`;
    }
    const week = this.currentWeek();
    if (!week) return monthLabel;
    return `${monthLabel} · Week ${this.currentWeekIndex() + 1} · ${week.range}`;
  });

  prevWeek() {
    this.currentWeekIndex.update(i => Math.max(0, i - 1));
    this.collapsedIndices.set(new Set());
  }

  nextWeek() {
    this.currentWeekIndex.update(i => Math.min(this.weeks().length - 1, i + 1));
    this.collapsedIndices.set(new Set());
  }

  setView(v: 'week' | 'month') {
    this.viewMode.set(v);
  }

  setFilter(f: 'all' | 'profit' | 'loss') {
    this.activeFilter.set(f);
    this.currentPage.set(1);
    this.collapsedIndices.set(new Set());
  }

  goToPage(page: number) {
    this.currentPage.set(Math.min(Math.max(1, page), this.totalPages()));
  }

  toggleDayGroup(index: number) {
    this.collapsedIndices.update(set => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  isCollapsed(index: number): boolean {
    return this.collapsedIndices().has(index);
  }

  navigateToDetail(tradeId: string) {
    this.router.navigate(['/trades', tradeId]);
  }

  formatPnl(value: number | null | undefined): string {
    if (value == null) return '—';
    const sign = value < 0 ? '-' : '+';
    const abs = Math.abs(Math.round(value));
    return `${sign}$${abs.toLocaleString('en-US')}`;
  }

  formatPnlWithPercent(trade: Trade): string {
    return `${this.formatPnl(trade.pnl)} (${this.formatPercent(trade.pnlPercent)})`;
  }

  formatPercent(value: number | null | undefined): string {
    return value == null ? '—' : `${value.toFixed(1)}%`;
  }

  private matchesFilter(t: Trade, filter: 'all' | 'profit' | 'loss'): boolean {
    if (filter === 'all') return true;
    if (filter === 'profit') return t.pnl >= 0;
    return t.pnl < 0;
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private formatShortDay(date: Date): string {
    return `${this.monthNames[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
