# Guía de Usuario — OptionsTrader

Esta guía explica cómo usar cada sección de OptionsTrader: qué información muestra, cómo navegar y qué acciones puedes realizar.

> **Nota sobre las imágenes:** los espacios marcados como `![...](images/archivo.png)` son placeholders. Guarda tus propios screenshots en `docs/images/` con esos nombres exactos y se mostrarán automáticamente al ver este archivo en GitHub o en cualquier visor de Markdown.

## Índice

1. [Inicio de sesión](#1-inicio-de-sesión)
2. [Dashboard](#2-dashboard)
3. [Trading Journal (Calendario)](#3-trading-journal-calendario)
4. [Detalle de trade (desde el calendario)](#4-detalle-de-trade-desde-el-calendario)
5. [Trade Log (Registro de trades)](#5-trade-log-registro-de-trades)
6. [Detalle de trade (página completa)](#6-detalle-de-trade-página-completa)
7. [Analytics](#7-analytics)
8. [Cerrar sesión](#8-cerrar-sesión)

---

## 1. Inicio de sesión

Ruta: `/login`

Pantalla de acceso a la aplicación. Ingresa tu usuario y contraseña para entrar. Si las credenciales son incorrectas, verás un mensaje de error debajo del formulario.

![Pantalla de login](images/login.png)

**Campos:**
- **Username** — tu nombre de usuario.
- **Password** — tu contraseña (puedes mostrarla/ocultarla con el ícono del ojo).

Al iniciar sesión correctamente, la app te lleva directo al **Dashboard**.

---

## 2. Dashboard

Ruta: `/dashboard`

Es la primera pantalla que ves al entrar. Te da un resumen rápido de tu desempeño del mes actual.

![Dashboard principal](images/dashboard.png)

**Qué muestra:**
- **Franja de KPIs** — PnL del mes, PnL de hoy, win rate, racha actual de días ganadores, y PnL promedio por trade (con profit factor).
- **Curva de equity** — gráfico de línea con la evolución acumulada de tu PnL a lo largo del mes, con un punto ámbar marcando "hoy".
- **Trades recientes** — los últimos 4 trades cerrados; haz click en cualquiera para ver su detalle completo.
- **Consistencia** — los últimos 10 días de trading, cada uno con un ícono de color (verde=ganador, rojo=perdedor, ámbar=pendiente) y tu racha actual/mejor racha del mes.
- **Quick stats** — mejor trade, peor trade, promedio de ganadores/perdedores, y el trade más rápido en cerrarse.

---

## 3. Trading Journal (Calendario)

Ruta: `/journal`

Vista de calendario mensual donde cada día está coloreado según el resultado de ese día.

![Calendario del Trading Journal](images/journal-calendar.png)

**Qué muestra:**
- **Resumen del mes** — PnL del mes, días de trading, win rate y total de trades.
- **Calendario** — cada celda de día muestra el PnL y el número de trades. Colores:
  - 🟢 Verde = día ganador
  - 🔴 Rojo = día perdedor
  - 🟠 Ámbar = trade pendiente (aún no cerrado)
  - Gris = sin trades ese día
- **Columna WEEK** — resumen de cada semana (PnL total, días activos, trades).
- **Navegación** — usa las flechas `‹ ›` junto al nombre del mes para moverte entre meses.

Haz click en cualquier día con actividad para ver los trades de ese día.

---

## 4. Detalle de trade (desde el calendario)

Al hacer click en un día del calendario, se abre un modal:

![Modal con la lista de trades del día](images/journal-day-modal.png)

- Si el día tiene **varios trades**, primero ves una lista resumida con el PnL total del día y cada trade individual.
- Al hacer click en un trade específico, ves su **detalle completo**: precio de entrada/salida, contratos, duración, estado, y las capturas de pantalla de entrada, salida y trade log (si existen).

![Detalle de un trade dentro del modal](images/journal-trade-detail-modal.png)

---

## 5. Trade Log (Registro de trades)

Ruta: `/trades`

Vista de tabla con todos tus trades, organizados por semana o por mes.

![Trade Log — vista semanal](images/trade-log-week.png)

**Controles en la parte superior:**
- **Navegador de semana** (`‹ W3 ›`) — solo visible en vista semanal.
- **Toggle Week / Month** — cambia entre ver una semana a la vez o todos los trades del mes en una tabla paginada.
- **Filtros** — All / Profit / Loss, para mostrar solo los trades que te interesan.

**Vista semanal:** agrupa los trades por día, con cada día expandible/colapsable haciendo click en su encabezado. Los días sin trades se muestran comprimidos en una sola fila ("Tue Jul 15 — Fri Jul 18 · No trades").

**Vista mensual:**

![Trade Log — vista mensual](images/trade-log-month.png)

Tabla plana con todos los trades del mes, 10 por página, con paginación al final.

Haz click en cualquier fila para ir al detalle completo de ese trade.

---

## 6. Detalle de trade (página completa)

Ruta: `/trades/:id`

Vista dedicada de un trade individual, a la que llegas al hacer click en cualquier fila del Trade Log.

![Página de detalle de trade](images/trade-detail-page.png)

**Qué muestra:**
- Símbolo, tipo (Call/Put), strike, expiración y nivel.
- PnL en dólares y en porcentaje.
- Precio de entrada/salida, contratos, premium pagado, target y duración.
- Estado (Cerrado/Pendiente) con indicador de color.
- **Charts** — capturas de pantalla de entrada, salida y trade log (si fueron subidas). Si falta alguna, se muestra un placeholder "No screenshot".

Usa el botón **← Back** para volver al Trade Log.

---

## 7. Analytics

Ruta: `/analytics`

Página de estadísticas y patrones sobre tu trading.

![Analytics — vista general](images/analytics-overview.png)

**Selector de período:** Week / Month / All time, en la parte superior derecha.

**Qué muestra:**
- **Franja de KPIs** — PnL total, win rate, profit factor, duración promedio/mínima/máxima.
- **PnL por día de la semana** — gráfico de barras mostrando qué días son más rentables, con un recuadro de insight autogenerado (ej. "Lunes–Martes representan el 81% de tu PnL").

  ![PnL por día de la semana](images/analytics-day-of-week.png)

- **Desglose por símbolo y tipo** — barras de progreso por cada combinación símbolo+tipo (ej. "SPY Call"), con win rate y estadísticas de mejor/peor trade y promedio de ganador/perdedor.
- **Histograma de duración** — cuántos trades caen en cada rango de duración (0–15 min, 15–30 min, etc.), con un insight sobre tu "sweet spot".
- **Distribución de PnL %** — cuántos trades caen en cada rango de rendimiento porcentual.
- **Duración vs PnL (scatter)** — gráfico de puntos mostrando la relación entre cuánto duró un trade y su resultado, con una zona resaltada indicando tu rango de mejor desempeño.

  ![Duración vs PnL y patrones](images/analytics-duration-scatter.png)

Todos los recuadros amarillos con el ícono de foco (💡) son **insights generados automáticamente** a partir de tus datos reales — no son textos fijos.

---

## 8. Cerrar sesión

Desde cualquier página autenticada, el botón **Sign out** está en la parte inferior del menú lateral (sidebar).

![Botón de logout en el sidebar](images/sidebar-logout.png)

Al cerrar sesión, tu token se elimina y vuelves a la página de inicio pública (`/`).

---

## Navegación general

El menú lateral (sidebar), visible en todas las páginas autenticadas, te permite moverte entre:

- **Dashboard**
- **Trading Journal**
- **Analytics**
- **Trade Log**

La sección activa siempre aparece resaltada en el sidebar.
