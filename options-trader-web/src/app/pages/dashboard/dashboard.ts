import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TradeService, Trade, TradeScreenshot } from '../../services/trade.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  trades: Trade[];
  result: 'profit' | 'loss' | null;
}

interface ModalData {
  date: string;
  result: 'profit' | 'loss';
  trades: Trade[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth());

  monthTrades = signal<Trade[]>([]);
  loadingCalendar = signal(false);

  modalData = signal<ModalData | null>(null);
  selectedTrade = signal<Trade | null>(null);
  selectedImageIndex = signal(0);
  loadingModal = signal(false);
  modalError = signal('');

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private tradeService: TradeService) {}

  ngOnInit() {
    this.loadMonth();
  }

  private loadMonth() {
    const year = this.currentYear();
    const month = this.currentMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    this.loadingCalendar.set(true);
    this.monthTrades.set([]);

    this.tradeService.getTradesByMonth(monthStr).subscribe({
      next: (trades) => {
        this.monthTrades.set(trades);
        this.loadingCalendar.set(false);
      },
      error: () => this.loadingCalendar.set(false),
    });
  }

  calendarDays = computed<(CalendarDay | null)[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const trades = this.monthTrades();

    const days: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayTrades = trades.filter(t => t.tradeDate === dateStr);

      let result: 'profit' | 'loss' | null = null;
      if (dayTrades.length > 0) {
        const totalPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        result = totalPnl >= 0 ? 'profit' : 'loss';
      }

      days.push({ date, dayNumber: d, trades: dayTrades, result });
    }

    return days;
  });

  monthLabel = computed(() =>
    `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`
  );

  tradeImages = computed<TradeScreenshot[]>(() => {
    const trade = this.selectedTrade();
    if (!trade) return [];
    return trade.screenshots.filter(s =>
      s.s3Url.endsWith('_entry.png') || s.s3Url.endsWith('_exit.png')
    );
  });

  prevMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.loadMonth();
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.loadMonth();
  }

  openModal(day: CalendarDay) {
    if (!day.result) return;
    const dateStr = `${this.currentYear()}-${String(this.currentMonth() + 1).padStart(2, '0')}-${String(day.dayNumber).padStart(2, '0')}`;
    this.modalData.set({ date: dateStr, result: day.result, trades: day.trades });
    this.selectedTrade.set(null);
    this.modalError.set('');
  }

  selectTrade(trade: Trade) {
    this.selectedTrade.set(trade);
    this.selectedImageIndex.set(0);
  }

  backToTrades() {
    this.selectedTrade.set(null);
  }

  closeModal() {
    this.modalData.set(null);
    this.selectedTrade.set(null);
  }

  selectImage(index: number) {
    this.selectedImageIndex.set(index);
  }

  isToday(day: CalendarDay): boolean {
    return (
      day.date.getFullYear() === this.today.getFullYear() &&
      day.date.getMonth() === this.today.getMonth() &&
      day.date.getDate() === this.today.getDate()
    );
  }
}
