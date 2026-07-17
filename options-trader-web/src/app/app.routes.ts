import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { Journal } from './pages/journal/journal';
import { TradeLogComponent } from './pages/trade-log/trade-log.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { TradeDetailComponent } from './pages/trade-detail/trade-detail.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: Home },
  { path: 'home', component: Home },
  { path: 'login', component: Login },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'journal', component: Journal },
      { path: 'analytics', component: AnalyticsComponent },
      { path: 'trades', component: TradeLogComponent },
      { path: 'trades/:id', component: TradeDetailComponent },
    ],
  },
];
