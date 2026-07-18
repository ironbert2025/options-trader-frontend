# OptionsTrader — Frontend

Un diario personal de trading de opciones. Este repositorio contiene el frontend en Angular de **OptionsTrader**, un sistema donde una app de escritorio WinForms captura los trades y screenshots desde la plataforma de Schwab, una Web API en ASP.NET Core almacena y sirve esos datos, y esta app en Angular te da una forma visual, de solo lectura, para revisar tu historial de trading — vista de calendario, registro de trades, analíticas y un dashboard de KPIs.

El proyecto Angular en sí vive en [`options-trader-web/`](options-trader-web).

## Stack

- **Angular 21** — componentes standalone, signals (`signal()` / `computed()`), sin NgModules
- **TypeScript 5.9**
- **SCSS** por componente
- **@tabler/icons-webfont** para íconos
- **Vitest** para tests unitarios

## Funcionalidades

- **Landing page** (`/`) — página pública de marketing
- **Login** (`/login`) — autentica contra el API del backend y guarda un JWT
- **Dashboard** (`/dashboard`) — franja de KPIs (PnL del mes/hoy, win rate, rachas, profit factor), curva de equity, trades recientes, calendario de consistencia, quick stats
- **Trading Journal** (`/journal`) — calendario mensual coloreado por resultado diario, con un modal de detalle de trade por día (screenshots de entrada/salida/trade log)
- **Analytics** (`/analytics`) — PnL por día de la semana, desglose por símbolo/tipo, distribuciones de duración y PnL%, scatter plot duración-vs-PnL, con insights generados automáticamente
- **Trade Log** (`/trades`) — vista de tabla semanal/mensual de todos los trades con filtros (todos/ganadores/perdedores) y paginación
- **Trade Detail** (`/trades/:id`) — vista de detalle completo de un trade, incluyendo los screenshots de entrada/salida/trade log

Todas las rutas autenticadas (`/dashboard`, `/journal`, `/analytics`, `/trades*`) están anidadas bajo un `AuthLayoutComponent` compartido (sidebar + shell de contenido) y protegidas por un guard de rutas que redirige a `/login` si no hay una sesión válida.

## Estructura del proyecto

```
options-trader-web/
  src/app/
    pages/            # componentes de página enrutados (home, login, dashboard, journal, analytics, trade-log, trade-detail)
    components/        # piezas reutilizables (ej. TradingJournalComponent, el grid del calendario)
    layouts/            # AuthLayoutComponent — shell para las páginas autenticadas
    shared/             # SidebarComponent
    services/           # AuthService, TradeService — se comunican con el API del backend
    guards/             # authGuard — protege las rutas autenticadas
    app.routes.ts       # tabla de rutas
```

## Cómo empezar

```bash
cd options-trader-web
npm install
npm start        # ng serve — http://localhost:4200
```

Otros scripts:

```bash
npm run build     # build de producción → dist/options-trader-web
npm run watch     # build de desarrollo, modo watch
npm test          # tests unitarios (Vitest)
```

## API del backend

El frontend se comunica con la Web API de OptionsTrader para autenticación y datos de trades:

| Servicio | Método | Endpoint |
|---|---|---|
| `AuthService.login()` | `POST` | `/api/auth/login` |
| `TradeService.getTradesByMonth(month)` | `GET` | `/api/trades?month=YYYY-MM` |
| `TradeService.getTradeByDate(date)` | `GET` | `/api/trades?date=YYYY-MM-DD` |
| `TradeService.getTradeById(id)` | `GET` | `/api/trades/{id}` |

La autenticación es un JWT tipo bearer guardado en `localStorage`; el token también trae el nombre y apellido del usuario, decodificados del lado del cliente para el saludo del dashboard.

> **Nota:** la URL base del API está actualmente hardcodeada en `auth.service.ts` y `trade.service.ts` en vez de venir de un archivo de environment de Angular. Si apuntas esta app a un backend distinto, actualiza esas dos constantes.

## Despliegue

Los builds de producción se sirven como archivos estáticos vía IIS en la misma instancia EC2 de Windows que aloja el API del backend (frontend en el puerto 80, API en el puerto 5000). Para desplegar:

```bash
cd options-trader-web
npm run build -- --configuration production
scp -r dist/options-trader-web/browser/. <usuario>@<host-ec2>:C:/OptionsTraderFrontend
```

IIS está configurado con una regla de URL Rewrite para que las rutas no encontradas caigan de vuelta a `index.html` (necesario para el ruteo del lado del cliente de Angular).
