import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TradeService, Trade, TradeScreenshot } from '../../services/trade.service';
import { TradingJournalComponent } from '../../components/trading-journal/trading-journal.component';
import { TradeDay } from '../../components/trading-journal/trading-journal.model';
import { isEntryScreenshot, isExitScreenshot, isTradeLogScreenshot, isNewScreenshotFormat } from '../../utils/screenshot.util';

type TradeResult = 'profit' | 'loss' | 'pending';

interface ModalData {
  date: string;
  result: TradeResult;
  trades: Trade[];
}

@Component({
  selector: 'app-journal',
  imports: [CommonModule, DatePipe, TradingJournalComponent],
  templateUrl: './journal.html',
  styleUrl: './journal.scss',
})
export class Journal implements OnInit {
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

  journalTradeDays = computed<TradeDay[]>(() => {
    const trades = this.monthTrades();
    const byDate = new Map<string, Trade[]>();
    for (const t of trades) {
      if (!byDate.has(t.tradeDate)) byDate.set(t.tradeDate, []);
      byDate.get(t.tradeDate)!.push(t);
    }

    const result: TradeDay[] = [];
    for (const [dateStr, dayTrades] of byDate) {
      const [y, m, d] = dateStr.split('-').map(Number);
      const anyClosed = dayTrades.some(t => t.screenshots.some(s => isExitScreenshot(s.s3Url)));
      let status: TradeDay['status'];
      let pnl = 0;
      if (anyClosed) {
        pnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
        status = pnl >= 0 ? 'profit' : 'loss';
      } else {
        status = 'pending';
      }
      result.push({ date: new Date(y, m - 1, d), status, pnl, tradeCount: dayTrades.length });
    }
    return result;
  });

  entryImage = computed<TradeScreenshot | null>(() => {
    const trade = this.selectedTrade();
    if (!trade) return null;
    return trade.screenshots.find(s => isEntryScreenshot(s.s3Url)) ?? null;
  });

  exitImage = computed<TradeScreenshot | null>(() => {
    const trade = this.selectedTrade();
    if (!trade) return null;
    return trade.screenshots.find(s => isExitScreenshot(s.s3Url)) ?? null;
  });

  // Newer screenshots ("_Entry.png"/"_Close.png") are much wider and need
  // to be stacked instead of shown side by side.
  useStackedCharts = computed<boolean>(() => {
    const entry = this.entryImage();
    const exit = this.exitImage();
    return isNewScreenshotFormat(entry?.s3Url ?? exit?.s3Url ?? '');
  });

  dayTotalPnl = computed<number>(() => {
    const data = this.modalData();
    if (!data) return 0;
    return data.trades.reduce((sum, t) => sum + t.pnl, 0);
  });

  tradeStatus = computed<'pending' | 'closed-profit' | 'closed-loss'>(() => {
    const trade = this.selectedTrade();
    if (!trade) return 'pending';
    const hasExit = trade.screenshots.some(s => isExitScreenshot(s.s3Url));
    if (!hasExit) return 'pending';
    return trade.pnl >= 0 ? 'closed-profit' : 'closed-loss';
  });

  tradeLogImage = computed<TradeScreenshot | null>(() => {
    const trade = this.selectedTrade();
    if (!trade) return null;
    return trade.screenshots.find(s => isTradeLogScreenshot(s.s3Url)) ?? null;
  });

  onJournalMonthChanged(e: { year: number; month: number }) {
    this.currentYear.set(e.year);
    this.currentMonth.set(e.month);
    this.loadMonth();
  }

  onJournalDayClick(date: Date) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayTrades = this.monthTrades().filter(t => t.tradeDate === dateStr);
    if (dayTrades.length === 0) return;

    const anyClosed = dayTrades.some(t => t.screenshots.some(s => isExitScreenshot(s.s3Url)));
    let result: TradeResult;
    if (anyClosed) {
      const totalPnl = dayTrades.reduce((sum, t) => sum + t.pnl, 0);
      result = totalPnl >= 0 ? 'profit' : 'loss';
    } else {
      result = 'pending';
    }

    this.modalData.set({ date: dateStr, result, trades: dayTrades });
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
}
