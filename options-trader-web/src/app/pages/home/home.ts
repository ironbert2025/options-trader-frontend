import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface PreviewTrade {
  date: string;
  symbol: string;
  pnl: string;
  status: 'profit' | 'loss';
}

interface Stat {
  value: string;
  accent: string;
  label: string;
}

interface Feature {
  icon: string;
  iconClass: 'green' | 'navy' | 'amber';
  borderColor: string;
  title: string;
  desc: string;
}

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  trades: PreviewTrade[] = [
    { date: 'Jun 17', symbol: 'AAPL C · 195', pnl: '+$842', status: 'profit' },
    { date: 'Jun 18', symbol: 'TSLA P · 240', pnl: '-$310', status: 'loss' },
    { date: 'Jun 23', symbol: 'SPY C · 540', pnl: '+$1,240', status: 'profit' },
  ];

  stats: Stat[] = [
    { value: '86', accent: '%', label: 'Avg win rate among active users' },
    { value: '3', accent: 'x', label: 'Profit factor improvement in 90 days' },
    { value: '<2', accent: 'min', label: 'To log a complete trade with charts' },
    { value: '100', accent: '%', label: 'Your data, your journal, no ads' },
  ];

  features: Feature[] = [
    {
      icon: 'ti-calendar', iconClass: 'green', borderColor: '#639922',
      title: 'Calendar View',
      desc: 'Every trading day color-coded by outcome. Profit and loss at a glance — weekly summaries included, no spreadsheet required.',
    },
    {
      icon: 'ti-chart-candle', iconClass: 'navy', borderColor: '#1e2a3a',
      title: 'Trade Charts',
      desc: 'Entry and exit screenshots for every position. See exactly what you saw when you pulled the trigger — side by side.',
    },
    {
      icon: 'ti-trending-up', iconClass: 'amber', borderColor: '#f59e0b',
      title: 'P&L Tracking',
      desc: 'Premium paid, net P&L, duration, and target percent. Analytics that show your best day, best symbol, and sweet spot duration.',
    },
  ];

  constructor(private router: Router) {}

  openJournal() {
    this.router.navigate(['/login']);
  }

  signIn() {
    this.router.navigate(['/login']);
  }
}
