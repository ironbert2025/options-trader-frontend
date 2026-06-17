import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MOCK_TRADING_DAYS, TradingDay } from '../../data/mock-trading-days';
import { TradeService, Trade, TradeScreenshot } from '../../services/trade.service';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  tradingDay: TradingDay | null;
}

interface ModalData {
  date: string;
  result: 'profit' | 'loss';
  trades: Trade[];
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  today = new Date();
  currentYear = signal(this.today.getFullYear());
  currentMonth = signal(this.today.getMonth());

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

  calendarDays = computed<(CalendarDay | null)[]>(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (CalendarDay | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tradingDay = MOCK_TRADING_DAYS.find(t => t.date === dateStr) ?? null;
      days.push({ date, dayNumber: d, tradingDay });
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
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
  }

  openModal(day: CalendarDay) {
    if (!day.tradingDay) return;

    const dateStr = day.tradingDay.date;
    const result = day.tradingDay.result;

    this.loadingModal.set(true);
    this.modalError.set('');
    this.modalData.set({ date: dateStr, result, trades: [] });
    this.selectedTrade.set(null);

    this.tradeService.getTradeByDate(dateStr).subscribe({
      next: (trades) => {
        this.modalData.set({ date: dateStr, result, trades });
        this.loadingModal.set(false);
      },
      error: () => {
        this.modalError.set('Could not load trades for this day.');
        this.loadingModal.set(false);
      },
    });
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
