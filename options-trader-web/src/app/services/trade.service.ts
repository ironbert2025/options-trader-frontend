import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface TradeScreenshot {
  id: number;
  tradeId: number;
  s3Url: string;
  capturedAt: string;
  symbol: string;
}

export interface Trade {
  id: number;
  symbol: string;
  optionType: number;
  strikePrice: number;
  expirationDate: string;
  level: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  contracts: number;
  targetPercent: number;
  duration: string;
  tradeDate: string;
  screenshots: TradeScreenshot[];
}

@Injectable({ providedIn: 'root' })
export class TradeService {
  private readonly baseUrl = 'http://3.133.58.172:5000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  getTradesByMonth(month: string): Observable<Trade[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
    return this.http.get<Trade[]>(`${this.baseUrl}/trades?month=${month}`, { headers });
  }

  getTradeByDate(date: string): Observable<Trade[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken()}`,
    });
    return this.http.get<Trade[]>(`${this.baseUrl}/trades?date=${date}`, { headers });
  }
}
