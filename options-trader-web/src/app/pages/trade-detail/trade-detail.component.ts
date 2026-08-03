import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TradeService, Trade, TradeScreenshot } from '../../services/trade.service';
import { isEntryScreenshot, isExitScreenshot, isTradeLogScreenshot, isNewScreenshotFormat } from '../../utils/screenshot.util';

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trade-detail.component.html',
  styleUrl: './trade-detail.component.scss',
})
export class TradeDetailComponent implements OnInit {
  trade = signal<Trade | null>(null);
  loading = signal(true);
  notFound = signal(false);

  constructor(
    private route: ActivatedRoute,
    private tradeService: TradeService,
    private location: Location
  ) {}

  goBack() {
    this.location.back();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    this.tradeService.getTradeById(id).subscribe({
      next: t => {
        this.trade.set(t);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  entryImage = computed<TradeScreenshot | null>(() => {
    const t = this.trade();
    if (!t) return null;
    return t.screenshots.find(s => isEntryScreenshot(s.s3Url)) ?? null;
  });

  exitImage = computed<TradeScreenshot | null>(() => {
    const t = this.trade();
    if (!t) return null;
    return t.screenshots.find(s => isExitScreenshot(s.s3Url)) ?? null;
  });

  tradeLogImage = computed<TradeScreenshot | null>(() => {
    const t = this.trade();
    if (!t) return null;
    return t.screenshots.find(s => isTradeLogScreenshot(s.s3Url)) ?? null;
  });

  // Newer screenshots ("_Entry.png"/"_Close.png") are much wider and need
  // to be stacked instead of shown side by side.
  useStackedCharts = computed<boolean>(() => {
    const entry = this.entryImage();
    const exit = this.exitImage();
    return isNewScreenshotFormat(entry?.s3Url ?? exit?.s3Url ?? '');
  });

  status = computed<'pending' | 'closed-profit' | 'closed-loss'>(() => {
    const t = this.trade();
    if (!t) return 'pending';
    if (t.pnlPercent == null) return 'pending';
    return t.pnl >= 0 ? 'closed-profit' : 'closed-loss';
  });
}
