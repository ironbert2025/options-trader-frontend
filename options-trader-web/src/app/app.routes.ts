import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { Journal } from './pages/journal/journal';
import { TradeLogComponent } from './pages/trade-log/trade-log.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { TradeDetailComponent } from './pages/trade-detail/trade-detail.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'journal', component: Journal, canActivate: [authGuard] },
  { path: 'trades', component: TradeLogComponent, canActivate: [authGuard] },
  { path: 'trades/:id', component: TradeDetailComponent, canActivate: [authGuard] },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [authGuard] },
];
