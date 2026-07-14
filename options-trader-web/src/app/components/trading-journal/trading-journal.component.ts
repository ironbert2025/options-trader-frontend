import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TradeDay, WeekSummary, MonthSummary } from './trading-journal.model';

interface CalendarCell {
  dayNumber: number | null;
  date: Date | null;
  status: 'profit' | 'loss' | 'pending' | 'none';
  pnl: number;
  tradeCount: number;
  isToday: boolean;
}

interface CalendarRow {
  days: CalendarCell[];
  week: WeekSummary;
}

@Component({
  selector: 'app-trading-journal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trading-journal.component.html',
  styleUrl: './trading-journal.component.scss',
})
export class TradingJournalComponent implements OnChanges {
  @Input() tradeDays: TradeDay[] = [];

  @Output() dayClick = new EventEmitter<Date>();
  @Output() monthChanged = new EventEmitter<{ year: number; month: number }>();

  private tradeDaysSignal = signal<TradeDay[]>([]);

  today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth());

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  weekDayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tradeDays']) {
      this.tradeDaysSignal.set(this.tradeDays ?? []);
    }
  }

  monthLabel = computed(() =>
    `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`
  );

  calendarRows = computed<CalendarRow[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();

    const dayMap = new Map<string, TradeDay>();
    for (const d of this.tradeDaysSignal()) {
      dayMap.set(this.dateKey(d.date), d);
    }

    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push(this.emptyCell());
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const match = dayMap.get(this.dateKey(date));
      cells.push({
        dayNumber: d,
        date,
        status: match?.status ?? 'none',
        pnl: match?.pnl ?? 0,
        tradeCount: match?.tradeCount ?? 0,
        isToday: this.isSameDate(date, this.today),
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push(this.emptyCell());
    }

    const rows: CalendarRow[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      const rowCells = cells.slice(i, i + 7);
      rows.push({
        days: rowCells,
        week: this.buildWeekSummary(rowCells, Math.floor(i / 7) + 1),
      });
    }
    return rows;
  });

  monthSummary = computed<MonthSummary>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const monthDays = this.tradeDaysSignal().filter(
      d => d.date.getFullYear() === year && d.date.getMonth() === month
    );

    const closedDays = monthDays.filter(d => d.status === 'profit' || d.status === 'loss');
    const profitDays = closedDays.filter(d => d.status === 'profit');
    const activeDays = monthDays.filter(d => d.status !== 'none');

    const monthPnl = closedDays.reduce((sum, d) => sum + d.pnl, 0);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const winRate = closedDays.length > 0
      ? Math.round((profitDays.length / closedDays.length) * 100)
      : 0;
    const totalTrades = activeDays.reduce((sum, d) => sum + d.tradeCount, 0);

    return {
      monthPnl,
      tradingDays: activeDays.length,
      totalDays,
      winRate,
      totalTrades,
    };
  });

  prevMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.monthChanged.emit({ year: this.currentYear(), month: this.currentMonth() });
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.monthChanged.emit({ year: this.currentYear(), month: this.currentMonth() });
  }

  onDayClick(day: { dayNumber: number | null; date: Date | null; status: string }) {
    if (!day.date || day.status === 'none') return;
    this.dayClick.emit(day.date);
  }

  formatPnl(value: number): string {
    const sign = value < 0 ? '-' : '+';
    const abs = Math.abs(Math.round(value));
    return `${sign}$${abs.toLocaleString('en-US')}`;
  }

  private buildWeekSummary(cells: CalendarCell[], sequentialIndex: number): WeekSummary {
    const closedCells = cells.filter(c => c.date && (c.status === 'profit' || c.status === 'loss'));
    const totalPnl = closedCells.reduce((sum, c) => sum + c.pnl, 0);
    const totalTrades = closedCells.reduce((sum, c) => sum + c.tradeCount, 0);
    const activeDays = closedCells.length;

    const firstDated = cells.find(c => c.date);
    const weekNumber = firstDated?.date ? this.getISOWeek(firstDated.date) : sequentialIndex;

    let status: WeekSummary['status'] = 'empty';
    if (activeDays > 0) {
      status = totalPnl >= 0 ? 'profit' : 'loss';
    }

    return { weekNumber, totalPnl, activeDays, totalTrades, status };
  }

  private emptyCell(): CalendarCell {
    return { dayNumber: null, date: null, status: 'none', pnl: 0, tradeCount: 0, isToday: false };
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private isSameDate(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  private getISOWeek(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
