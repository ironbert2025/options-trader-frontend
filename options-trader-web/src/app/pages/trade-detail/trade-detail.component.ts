import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TradeService, Trade, TradeScreenshot } from '../../services/trade.service';

@Component({
  selector: 'app-trade-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './trade-detail.component.html',
  styleUrl: './trade-detail.component.scss',
})
export class TradeDetailComponent implements OnInit {
  trade = signal<Trade | null>(null);
  loading = signal(true);
  notFound = signal(false);

  constructor(
    private route: ActivatedRoute,
    private tradeService: TradeService
  ) {}

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
    return t.screenshots.find(s => s.s3Url.endsWith('_entry.png')) ?? null;
  });

  exitImage = computed<TradeScreenshot | null>(() => {
    const t = this.trade();
    if (!t) return null;
    return t.screenshots.find(s => s.s3Url.endsWith('_exit.png')) ?? null;
  });

  tradeLogImage = computed<TradeScreenshot | null>(() => {
    const t = this.trade();
    if (!t) return null;
    return t.screenshots.find(s => s.s3Url.endsWith('_TradeLog.png')) ?? null;
  });

  status = computed<'pending' | 'closed-profit' | 'closed-loss'>(() => {
    const t = this.trade();
    if (!t) return 'pending';
    if (t.pnlPercent == null) return 'pending';
    return t.pnl >= 0 ? 'closed-profit' : 'closed-loss';
  });
}
