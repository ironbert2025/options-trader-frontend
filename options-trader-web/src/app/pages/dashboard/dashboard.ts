import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MOCK_TRADING_DAYS, TradingDay } from '../../data/mock-trading-days';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  tradingDay: TradingDay | null;
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

  selectedDay = signal<TradingDay | null>(null);
  selectedImageIndex = signal(0);

  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
    this.selectedDay.set(day.tradingDay);
    this.selectedImageIndex.set(0);
  }

  closeModal() {
    this.selectedDay.set(null);
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
