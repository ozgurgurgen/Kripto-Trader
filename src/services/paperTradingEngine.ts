import { Order, Position, RiskSettings, TradingMode, TradeLog } from '../types/crypto';
import { BinanceService } from './binanceService';

export class PaperTradingEngine {
  private static initialBalanceUSDT = 10000;
  private static positions: Position[] = [];
  private static orders: Order[] = [];
  
  // Seed with realistic initial trades for rich immediate performance visualization
  private static tradeHistory: TradeLog[] = [
    {
      id: 'th-init-1',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entryPrice: 87200,
      exitPrice: 89400,
      amount: 0.0344,
      pnl: 75.68,
      pnlPct: 7.57,
      commission: 3.08,
      entryTime: Date.now() - 86400000 * 6 - 3600000 * 4,
      exitTime: Date.now() - 86400000 * 6,
      durationMinutes: 240,
      exitReason: 'Take Profit Tetiklendi',
    },
    {
      id: 'th-init-2',
      symbol: 'ETHUSDT',
      side: 'LONG',
      entryPrice: 2420,
      exitPrice: 2510,
      amount: 1.239,
      pnl: 111.51,
      pnlPct: 11.15,
      commission: 3.11,
      entryTime: Date.now() - 86400000 * 5 - 3600000 * 8,
      exitTime: Date.now() - 86400000 * 5 - 3600000 * 2,
      durationMinutes: 360,
      exitReason: 'Takip Eden Stop (Trailing)',
    },
    {
      id: 'th-init-3',
      symbol: 'SOLUSDT',
      side: 'SHORT',
      entryPrice: 178.5,
      exitPrice: 182.2,
      amount: 16.8,
      pnl: -62.16,
      pnlPct: -6.22,
      commission: 3.06,
      entryTime: Date.now() - 86400000 * 5 - 3600000 * 1,
      exitTime: Date.now() - 86400000 * 4 - 3600000 * 18,
      durationMinutes: 420,
      exitReason: 'Stop Loss Tetiklendi',
    },
    {
      id: 'th-init-4',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entryPrice: 88100,
      exitPrice: 90600,
      amount: 0.0567,
      pnl: 141.75,
      pnlPct: 14.18,
      commission: 5.14,
      entryTime: Date.now() - 86400000 * 4 - 3600000 * 12,
      exitTime: Date.now() - 86400000 * 4 - 3600000 * 2,
      durationMinutes: 600,
      exitReason: 'Take Profit Tetiklendi',
    },
    {
      id: 'th-init-5',
      symbol: 'BNBUSDT',
      side: 'LONG',
      entryPrice: 585.0,
      exitPrice: 572.5,
      amount: 4.27,
      pnl: -53.38,
      pnlPct: -5.34,
      commission: 2.45,
      entryTime: Date.now() - 86400000 * 4,
      exitTime: Date.now() - 86400000 * 3 - 3600000 * 16,
      durationMinutes: 480,
      exitReason: 'Stop Loss Tetiklendi',
    },
    {
      id: 'th-init-6',
      symbol: 'ETHUSDT',
      side: 'SHORT',
      entryPrice: 2540,
      exitPrice: 2470,
      amount: 1.575,
      pnl: 110.25,
      pnlPct: 11.03,
      commission: 3.89,
      entryTime: Date.now() - 86400000 * 3 - 3600000 * 14,
      exitTime: Date.now() - 86400000 * 3 - 3600000 * 5,
      durationMinutes: 540,
      exitReason: 'Take Profit Tetiklendi',
    },
    {
      id: 'th-init-7',
      symbol: 'SOLUSDT',
      side: 'LONG',
      entryPrice: 172.0,
      exitPrice: 184.5,
      amount: 17.44,
      pnl: 218.0,
      pnlPct: 21.80,
      commission: 3.22,
      entryTime: Date.now() - 86400000 * 3 - 3600000 * 2,
      exitTime: Date.now() - 86400000 * 2 - 3600000 * 18,
      durationMinutes: 480,
      exitReason: 'Takip Eden Stop (Trailing)',
    },
    {
      id: 'th-init-8',
      symbol: 'BTCUSDT',
      side: 'SHORT',
      entryPrice: 91200,
      exitPrice: 92100,
      amount: 0.0548,
      pnl: -49.32,
      pnlPct: -4.93,
      commission: 5.05,
      entryTime: Date.now() - 86400000 * 2 - 3600000 * 12,
      exitTime: Date.now() - 86400000 * 2 - 3600000 * 4,
      durationMinutes: 480,
      exitReason: 'Stop Loss Tetiklendi',
    },
    {
      id: 'th-init-9',
      symbol: 'AVAXUSDT',
      side: 'LONG',
      entryPrice: 28.4,
      exitPrice: 31.2,
      amount: 88.0,
      pnl: 246.4,
      pnlPct: 24.64,
      commission: 2.74,
      entryTime: Date.now() - 86400000 * 2 - 3600000 * 2,
      exitTime: Date.now() - 86400000 * 1 - 3600000 * 14,
      durationMinutes: 720,
      exitReason: 'Take Profit Tetiklendi',
    },
    {
      id: 'th-init-10',
      symbol: 'ETHUSDT',
      side: 'LONG',
      entryPrice: 2480,
      exitPrice: 2565,
      amount: 1.613,
      pnl: 137.11,
      pnlPct: 13.71,
      commission: 4.14,
      entryTime: Date.now() - 86400000 * 1 - 3600000 * 10,
      exitTime: Date.now() - 86400000 * 1 - 3600000 * 2,
      durationMinutes: 480,
      exitReason: 'Take Profit Tetiklendi',
    },
    {
      id: 'th-init-11',
      symbol: 'SOLUSDT',
      side: 'SHORT',
      entryPrice: 186.0,
      exitPrice: 189.5,
      amount: 16.13,
      pnl: -56.46,
      pnlPct: -5.65,
      commission: 3.06,
      entryTime: Date.now() - 86400000 * 1,
      exitTime: Date.now() - 3600000 * 18,
      durationMinutes: 360,
      exitReason: 'Stop Loss Tetiklendi',
    },
    {
      id: 'th-init-12',
      symbol: 'BTCUSDT',
      side: 'LONG',
      entryPrice: 89400,
      exitPrice: 91800,
      amount: 0.0559,
      pnl: 134.16,
      pnlPct: 13.42,
      commission: 5.13,
      entryTime: Date.now() - 3600000 * 15,
      exitTime: Date.now() - 3600000 * 6,
      durationMinutes: 540,
      exitReason: 'Takip Eden Stop (Trailing)',
    },
    {
      id: 'th-init-13',
      symbol: 'BNBUSDT',
      side: 'LONG',
      entryPrice: 575.0,
      exitPrice: 592.0,
      amount: 4.35,
      pnl: 73.95,
      pnlPct: 7.40,
      commission: 2.58,
      entryTime: Date.now() - 3600000 * 8,
      exitTime: Date.now() - 3600000 * 2,
      durationMinutes: 360,
      exitReason: 'Manuel Kapatma',
    },
    {
      id: 'th-init-14',
      symbol: 'ETHUSDT',
      side: 'SHORT',
      entryPrice: 2580,
      exitPrice: 2615,
      amount: 1.55,
      pnl: -54.25,
      pnlPct: -5.43,
      commission: 4.05,
      entryTime: Date.now() - 3600000 * 5,
      exitTime: Date.now() - 3600000 * 1,
      durationMinutes: 240,
      exitReason: 'Stop Loss Tetiklendi',
    },
  ];

  // Initialize balance with cumulative historical PnL
  private static balanceUSDT = 10000 + 75.68 + 111.51 - 62.16 + 141.75 - 53.38 + 110.25 + 218.0 - 49.32 + 246.4 + 137.11 - 56.46 + 134.16 + 73.95 - 54.25;
  private static riskSettings: RiskSettings = {
    sizingMethod: 'PERCENT_BALANCE',
    fixedAmountUSDT: 500,
    percentOfBalance: 5,
    kellyFraction: 0.5,
    defaultStopLossPct: 2.0,
    defaultTakeProfitPct: 4.5,
    trailingStopPct: 1.5,
    maxDailyLossPct: 5.0,
    maxWeeklyLossPct: 10.0,
    maxOpenPositions: 4,
    maxAssetExposurePct: 30,
    emergencyKillActive: false,
    circuitBreakerTriggered: false,
    todayLossUsdt: 0,
  };

  /**
   * Get Current Balance & Margin summary
   */
  static getAccountSummary() {
    const usedMargin = this.positions.reduce((acc, p) => acc + (p.status === 'OPEN' ? p.margin : 0), 0);
    const totalUnrealizedPnl = this.positions.reduce((acc, p) => acc + (p.status === 'OPEN' ? p.unrealizedPnl : 0), 0);
    const totalEquity = this.balanceUSDT + usedMargin + totalUnrealizedPnl;
    const totalPnlPct = ((totalEquity - this.initialBalanceUSDT) / this.initialBalanceUSDT) * 100;

    return {
      balanceUSDT: this.balanceUSDT,
      usedMargin,
      freeMargin: Math.max(0, this.balanceUSDT),
      totalEquity,
      totalUnrealizedPnl,
      totalPnlPct,
      initialBalance: this.initialBalanceUSDT,
    };
  }

  static getPositions(): Position[] {
    return this.positions;
  }

  static getOrders(): Order[] {
    return this.orders;
  }

  static getTradeHistory(): TradeLog[] {
    return this.tradeHistory;
  }

  static getRiskSettings(): RiskSettings {
    return this.riskSettings;
  }

  static updateRiskSettings(newSettings: Partial<RiskSettings>) {
    this.riskSettings = { ...this.riskSettings, ...newSettings };
  }

  static setInitialBalance(amount: number) {
    this.initialBalanceUSDT = amount;
    this.balanceUSDT = amount;
  }

  /**
   * Calculate Position Sizing based on selected Risk Model
   */
  static calculatePositionSize(symbol: string, currentPrice: number, atrValue?: number): number {
    const { totalEquity } = this.getAccountSummary();

    if (this.riskSettings.sizingMethod === 'FIXED_AMOUNT') {
      return Math.min(this.riskSettings.fixedAmountUSDT, totalEquity * 0.5);
    }

    if (this.riskSettings.sizingMethod === 'KELLY') {
      // Half-Kelly Criterion: f* = (p * b - q) / b
      // Assuming 60% win rate and 1.5 payoff
      const p = 0.60;
      const b = 1.5;
      const q = 1 - p;
      const fullKelly = (p * b - q) / b; // ~0.33
      const halfKelly = Math.max(0.02, Math.min(0.20, fullKelly * this.riskSettings.kellyFraction));
      return totalEquity * halfKelly;
    }

    if (this.riskSettings.sizingMethod === 'ATR_VOLATILITY' && atrValue && atrValue > 0) {
      // 1% total risk / ATR distance
      const riskAmount = totalEquity * 0.01;
      const stopDistance = atrValue * 2;
      const units = riskAmount / stopDistance;
      return Math.min(totalEquity * 0.25, units * currentPrice);
    }

    // Default: Percent of Balance
    return totalEquity * (this.riskSettings.percentOfBalance / 100);
  }

  /**
   * Create and execute an Order (Market, Limit, Stop-Limit, OCO)
   */
  static placeOrder(params: {
    symbol: string;
    type: Order['type'];
    side: Order['side'];
    price: number;
    stopPrice?: number;
    amountUSDT: number;
    leverage?: number;
    stopLossPct?: number;
    takeProfitPct?: number;
    trailingStopPct?: number;
    mode?: TradingMode;
  }): { success: boolean; message: string; order?: Order; position?: Position } {
    // 1. Safety Checks
    if (this.riskSettings.emergencyKillActive) {
      return { success: false, message: 'ACİL DURDURMA (Kill Switch) aktif. Yeni işlem açılamaz.' };
    }

    if (this.riskSettings.circuitBreakerTriggered) {
      return { success: false, message: 'GÜNLÜK KAYIP LİMİTİ (Circuit Breaker) aşıldı. Bot kilitlendi.' };
    }

    const openPositions = this.positions.filter((p) => p.status === 'OPEN');
    if (openPositions.length >= this.riskSettings.maxOpenPositions) {
      return { success: false, message: `Maksimum açık pozisyon limitine (${this.riskSettings.maxOpenPositions}) ulaşıldı.` };
    }

    const leverage = params.leverage || 1;
    const marginRequired = params.amountUSDT / leverage;

    if (marginRequired > this.balanceUSDT) {
      return { success: false, message: `Yetersiz bakiye! Gerekli teminat: $${marginRequired.toFixed(2)}, Mevcut: $${this.balanceUSDT.toFixed(2)}` };
    }

    // Single asset exposure check
    const currentAssetExposure = openPositions
      .filter((p) => p.symbol === params.symbol)
      .reduce((acc, p) => acc + p.margin * p.leverage, 0) + params.amountUSDT;
    
    const { totalEquity } = this.getAccountSummary();
    if ((currentAssetExposure / totalEquity) * 100 > this.riskSettings.maxAssetExposurePct) {
      return {
        success: false,
        message: `Maksimum varlık dağılım limiti aşıldı (%${this.riskSettings.maxAssetExposurePct}).`,
      };
    }

    // Commission simulation (Binance 0.1%)
    const commission = params.amountUSDT * 0.001;
    this.balanceUSDT -= (marginRequired + commission);
    BinanceService.trackOrder();

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const positionSide = params.side === 'BUY' ? 'LONG' : 'SHORT';
    const amountCoins = params.amountUSDT / params.price;

    const slPct = params.stopLossPct ?? this.riskSettings.defaultStopLossPct;
    const tpPct = params.takeProfitPct ?? this.riskSettings.defaultTakeProfitPct;
    const stopLoss = positionSide === 'LONG' ? params.price * (1 - slPct / 100) : params.price * (1 + slPct / 100);
    const takeProfit = positionSide === 'LONG' ? params.price * (1 + tpPct / 100) : params.price * (1 - tpPct / 100);

    const order: Order = {
      id: orderId,
      symbol: params.symbol,
      type: params.type,
      side: params.side,
      price: params.price,
      stopPrice: params.stopPrice,
      amount: amountCoins,
      filledAmount: amountCoins,
      status: 'FILLED',
      timestamp: Date.now(),
      mode: params.mode || 'PAPER',
    };

    const position: Position = {
      id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      symbol: params.symbol,
      side: positionSide,
      entryPrice: params.price,
      currentPrice: params.price,
      amount: amountCoins,
      leverage,
      margin: marginRequired,
      unrealizedPnl: 0,
      unrealizedPnlPct: 0,
      stopLoss,
      takeProfit,
      trailingStopPct: params.trailingStopPct ?? this.riskSettings.trailingStopPct,
      trailingPeakPrice: params.price,
      status: 'OPEN',
      openTime: Date.now(),
      mode: params.mode || 'PAPER',
    };

    this.orders.unshift(order);
    this.positions.unshift(position);

    return {
      success: true,
      message: `${params.symbol} ${positionSide} pozisyonu başarıyla açıldı ($${params.amountUSDT.toFixed(2)} / ${leverage}x)`,
      order,
      position,
    };
  }

  /**
   * Real-time Tick Runner: Updates open positions & executes SL/TP/Trailing Stop
   */
  static onPriceTick(symbol: string, currentPrice: number) {
    const openPositions = this.positions.filter((p) => p.status === 'OPEN' && p.symbol === symbol);

    for (const pos of openPositions) {
      pos.currentPrice = currentPrice;

      // PnL Calculation
      const priceDelta = pos.side === 'LONG' ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
      const rawPnl = priceDelta * pos.amount;
      pos.unrealizedPnl = rawPnl;
      pos.unrealizedPnlPct = (rawPnl / pos.margin) * 100;

      // Trailing Stop Peak Tracker
      if (pos.side === 'LONG') {
        if (currentPrice > (pos.trailingPeakPrice || pos.entryPrice)) {
          pos.trailingPeakPrice = currentPrice;
          if (pos.trailingStopPct) {
            const newSL = currentPrice * (1 - pos.trailingStopPct / 100);
            if (!pos.stopLoss || newSL > pos.stopLoss) {
              pos.stopLoss = newSL;
            }
          }
        }
      } else {
        if (currentPrice < (pos.trailingPeakPrice || pos.entryPrice)) {
          pos.trailingPeakPrice = currentPrice;
          if (pos.trailingStopPct) {
            const newSL = currentPrice * (1 + pos.trailingStopPct / 100);
            if (!pos.stopLoss || newSL < pos.stopLoss) {
              pos.stopLoss = newSL;
            }
          }
        }
      }

      // Check Exits
      let shouldClose = false;
      let closeReason = '';

      if (pos.side === 'LONG') {
        if (pos.stopLoss && currentPrice <= pos.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss Tetiklendi';
        } else if (pos.takeProfit && currentPrice >= pos.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit Tetiklendi';
        }
      } else {
        if (pos.stopLoss && currentPrice >= pos.stopLoss) {
          shouldClose = true;
          closeReason = 'Stop Loss Tetiklendi';
        } else if (pos.takeProfit && currentPrice <= pos.takeProfit) {
          shouldClose = true;
          closeReason = 'Take Profit Tetiklendi';
        }
      }

      // Check Liquidation (Margin Call at -90%)
      if (pos.unrealizedPnlPct <= -90) {
        shouldClose = true;
        closeReason = 'LİKİDASYON (Marjin Çağrısı)';
      }

      if (shouldClose) {
        this.closePosition(pos.id, closeReason);
      }
    }
  }

  /**
   * Close a Position at current price
   */
  static closePosition(positionId: string, reason = 'Manuel Kapatma'): boolean {
    const pos = this.positions.find((p) => p.id === positionId && p.status === 'OPEN');
    if (!pos) return false;

    const exitPrice = pos.currentPrice;
    const priceDelta = pos.side === 'LONG' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
    const grossPnl = priceDelta * pos.amount;
    const exitCommission = exitPrice * pos.amount * 0.001;
    const netPnl = grossPnl - exitCommission;

    pos.status = 'CLOSED';
    pos.closeTime = Date.now();
    pos.closedPnl = netPnl;
    pos.closedReason = reason;

    // Return margin + net PnL to balance
    this.balanceUSDT += (pos.margin + netPnl);

    // Track daily losses for Circuit Breaker
    if (netPnl < 0) {
      this.riskSettings.todayLossUsdt += Math.abs(netPnl);
      const { initialBalance } = this.getAccountSummary();
      const dailyLossPct = (this.riskSettings.todayLossUsdt / initialBalance) * 100;

      if (dailyLossPct >= this.riskSettings.maxDailyLossPct) {
        this.riskSettings.circuitBreakerTriggered = true;
      }
    }

    // Record trade history
    this.tradeHistory.unshift({
      id: `th-${Date.now()}`,
      symbol: pos.symbol,
      side: pos.side,
      entryPrice: pos.entryPrice,
      exitPrice,
      amount: pos.amount,
      pnl: netPnl,
      pnlPct: (netPnl / pos.margin) * 100,
      commission: exitCommission,
      entryTime: pos.openTime,
      exitTime: Date.now(),
      durationMinutes: Math.max(1, Math.round((Date.now() - pos.openTime) / 60000)),
      exitReason: reason,
    });

    return true;
  }

  /**
   * EMERGENCY KILL SWITCH
   * Instantly closes all active positions at market price, cancels all orders, and halts automated systems.
   */
  static triggerEmergencyKillSwitch(): { closedCount: number; returnedBalance: number } {
    this.riskSettings.emergencyKillActive = true;
    const openPos = this.positions.filter((p) => p.status === 'OPEN');
    let count = 0;

    for (const pos of openPos) {
      this.closePosition(pos.id, 'EMERGENCY KILL SWITCH');
      count++;
    }

    return {
      closedCount: count,
      returnedBalance: this.balanceUSDT,
    };
  }

  static resetKillSwitch() {
    this.riskSettings.emergencyKillActive = false;
    this.riskSettings.circuitBreakerTriggered = false;
    this.riskSettings.todayLossUsdt = 0;
  }

  /**
   * Reset / Clear trade history
   */
  static clearTradeHistory() {
    this.tradeHistory = [];
    this.balanceUSDT = this.initialBalanceUSDT;
  }

  /**
   * Re-seed sample trades
   */
  static seedSampleTrades() {
    this.clearTradeHistory();
    this.tradeHistory = [
      {
        id: `th-seed-${Date.now()}-1`,
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 87200,
        exitPrice: 89400,
        amount: 0.0344,
        pnl: 75.68,
        pnlPct: 7.57,
        commission: 3.08,
        entryTime: Date.now() - 86400000 * 6 - 3600000 * 4,
        exitTime: Date.now() - 86400000 * 6,
        durationMinutes: 240,
        exitReason: 'Take Profit Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-2`,
        symbol: 'ETHUSDT',
        side: 'LONG',
        entryPrice: 2420,
        exitPrice: 2510,
        amount: 1.239,
        pnl: 111.51,
        pnlPct: 11.15,
        commission: 3.11,
        entryTime: Date.now() - 86400000 * 5 - 3600000 * 8,
        exitTime: Date.now() - 86400000 * 5 - 3600000 * 2,
        durationMinutes: 360,
        exitReason: 'Takip Eden Stop (Trailing)',
      },
      {
        id: `th-seed-${Date.now()}-3`,
        symbol: 'SOLUSDT',
        side: 'SHORT',
        entryPrice: 178.5,
        exitPrice: 182.2,
        amount: 16.8,
        pnl: -62.16,
        pnlPct: -6.22,
        commission: 3.06,
        entryTime: Date.now() - 86400000 * 5 - 3600000 * 1,
        exitTime: Date.now() - 86400000 * 4 - 3600000 * 18,
        durationMinutes: 420,
        exitReason: 'Stop Loss Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-4`,
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 88100,
        exitPrice: 90600,
        amount: 0.0567,
        pnl: 141.75,
        pnlPct: 14.18,
        commission: 5.14,
        entryTime: Date.now() - 86400000 * 4 - 3600000 * 12,
        exitTime: Date.now() - 86400000 * 4 - 3600000 * 2,
        durationMinutes: 600,
        exitReason: 'Take Profit Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-5`,
        symbol: 'BNBUSDT',
        side: 'LONG',
        entryPrice: 585.0,
        exitPrice: 572.5,
        amount: 4.27,
        pnl: -53.38,
        pnlPct: -5.34,
        commission: 2.45,
        entryTime: Date.now() - 86400000 * 4,
        exitTime: Date.now() - 86400000 * 3 - 3600000 * 16,
        durationMinutes: 480,
        exitReason: 'Stop Loss Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-6`,
        symbol: 'ETHUSDT',
        side: 'SHORT',
        entryPrice: 2540,
        exitPrice: 2470,
        amount: 1.575,
        pnl: 110.25,
        pnlPct: 11.03,
        commission: 3.89,
        entryTime: Date.now() - 86400000 * 3 - 3600000 * 14,
        exitTime: Date.now() - 86400000 * 3 - 3600000 * 5,
        durationMinutes: 540,
        exitReason: 'Take Profit Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-7`,
        symbol: 'SOLUSDT',
        side: 'LONG',
        entryPrice: 172.0,
        exitPrice: 184.5,
        amount: 17.44,
        pnl: 218.0,
        pnlPct: 21.80,
        commission: 3.22,
        entryTime: Date.now() - 86400000 * 3 - 3600000 * 2,
        exitTime: Date.now() - 86400000 * 2 - 3600000 * 18,
        durationMinutes: 480,
        exitReason: 'Takip Eden Stop (Trailing)',
      },
      {
        id: `th-seed-${Date.now()}-8`,
        symbol: 'BTCUSDT',
        side: 'SHORT',
        entryPrice: 91200,
        exitPrice: 92100,
        amount: 0.0548,
        pnl: -49.32,
        pnlPct: -4.93,
        commission: 5.05,
        entryTime: Date.now() - 86400000 * 2 - 3600000 * 12,
        exitTime: Date.now() - 86400000 * 2 - 3600000 * 4,
        durationMinutes: 480,
        exitReason: 'Stop Loss Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-9`,
        symbol: 'AVAXUSDT',
        side: 'LONG',
        entryPrice: 28.4,
        exitPrice: 31.2,
        amount: 88.0,
        pnl: 246.4,
        pnlPct: 24.64,
        commission: 2.74,
        entryTime: Date.now() - 86400000 * 2 - 3600000 * 2,
        exitTime: Date.now() - 86400000 * 1 - 3600000 * 14,
        durationMinutes: 720,
        exitReason: 'Take Profit Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-10`,
        symbol: 'ETHUSDT',
        side: 'LONG',
        entryPrice: 2480,
        exitPrice: 2565,
        amount: 1.613,
        pnl: 137.11,
        pnlPct: 13.71,
        commission: 4.14,
        entryTime: Date.now() - 86400000 * 1 - 3600000 * 10,
        exitTime: Date.now() - 86400000 * 1 - 3600000 * 2,
        durationMinutes: 480,
        exitReason: 'Take Profit Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-11`,
        symbol: 'SOLUSDT',
        side: 'SHORT',
        entryPrice: 186.0,
        exitPrice: 189.5,
        amount: 16.13,
        pnl: -56.46,
        pnlPct: -5.65,
        commission: 3.06,
        entryTime: Date.now() - 86400000 * 1,
        exitTime: Date.now() - 3600000 * 18,
        durationMinutes: 360,
        exitReason: 'Stop Loss Tetiklendi',
      },
      {
        id: `th-seed-${Date.now()}-12`,
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 89400,
        exitPrice: 91800,
        amount: 0.0559,
        pnl: 134.16,
        pnlPct: 13.42,
        commission: 5.13,
        entryTime: Date.now() - 3600000 * 15,
        exitTime: Date.now() - 3600000 * 6,
        durationMinutes: 540,
        exitReason: 'Takip Eden Stop (Trailing)',
      },
      {
        id: `th-seed-${Date.now()}-13`,
        symbol: 'BNBUSDT',
        side: 'LONG',
        entryPrice: 575.0,
        exitPrice: 592.0,
        amount: 4.35,
        pnl: 73.95,
        pnlPct: 7.40,
        commission: 2.58,
        entryTime: Date.now() - 3600000 * 8,
        exitTime: Date.now() - 3600000 * 2,
        durationMinutes: 360,
        exitReason: 'Manuel Kapatma',
      },
      {
        id: `th-seed-${Date.now()}-14`,
        symbol: 'ETHUSDT',
        side: 'SHORT',
        entryPrice: 2580,
        exitPrice: 2615,
        amount: 1.55,
        pnl: -54.25,
        pnlPct: -5.43,
        commission: 4.05,
        entryTime: Date.now() - 3600000 * 5,
        exitTime: Date.now() - 3600000 * 1,
        durationMinutes: 240,
        exitReason: 'Stop Loss Tetiklendi',
      },
    ];

    const netTotal = this.tradeHistory.reduce((acc, t) => acc + t.pnl, 0);
    this.balanceUSDT = this.initialBalanceUSDT + netTotal;
  }

  /**
   * Export trades as CSV string
   */
  static exportTradesCSV(trades?: TradeLog[]): string {
    const list = trades || this.tradeHistory;
    const header = ['ID', 'Sembol', 'Yön', 'Giriş Fiyatı', 'Çıkış Fiyatı', 'Miktar', 'Net Kâr/Zarar ($)', 'Getiri (%)', 'Komisyon ($)', 'Giriş Zamanı', 'Çıkış Zamanı', 'Süre (Dk)', 'Çıkış Nedeni'];
    const rows = list.map((t) => [
      t.id,
      t.symbol,
      t.side,
      t.entryPrice.toFixed(4),
      t.exitPrice.toFixed(4),
      t.amount.toFixed(6),
      t.pnl.toFixed(2),
      t.pnlPct.toFixed(2),
      t.commission.toFixed(4),
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
      t.durationMinutes,
      `"${t.exitReason}"`,
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Calculate comprehensive performance statistics from trades
   */
  static calculatePerformanceMetrics(trades?: TradeLog[], initialCapital?: number) {
    const list = trades || this.tradeHistory;
    const initial = initialCapital || this.initialBalanceUSDT;

    const totalTrades = list.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        breakevenTrades: 0,
        winRatePct: 0,
        profitFactor: 0,
        payoffRatio: 0,
        grossProfit: 0,
        grossLoss: 0,
        netPnl: 0,
        netReturnPct: 0,
        avgTradePnl: 0,
        avgWinPnl: 0,
        avgLossPnl: 0,
        maxWin: 0,
        maxLoss: 0,
        expectancy: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        totalCommissions: 0,
        longTrades: 0,
        longWinRate: 0,
        shortTrades: 0,
        shortWinRate: 0,
        maxDrawdownUsdt: 0,
        maxDrawdownPct: 0,
        cumulativeCurve: [],
        symbolBreakdown: {},
      };
    }

    // Sort chronologically (oldest to newest) for timeline calculation
    const sortedTrades = [...list].sort((a, b) => a.exitTime - b.exitTime);

    let grossProfit = 0;
    let grossLoss = 0;
    let winCount = 0;
    let lossCount = 0;
    let breakevenCount = 0;
    let maxWin = 0;
    let maxLoss = 0;
    let totalCommissions = 0;

    let currentConsecutiveWins = 0;
    let maxConsecutiveWins = 0;
    let currentConsecutiveLosses = 0;
    let maxConsecutiveLosses = 0;

    let longCount = 0;
    let longWins = 0;
    let shortCount = 0;
    let shortWins = 0;

    const symbolStats: Record<string, { trades: number; wins: number; pnl: number; grossProfit: number; grossLoss: number }> = {};

    let runningEquity = initial;
    let peakEquity = initial;
    let maxDrawdownUsdt = 0;
    let maxDrawdownPct = 0;

    // Timeline data points
    const cumulativeCurve: Array<{
      index: number;
      id: string;
      time: string;
      timestamp: number;
      tradePnl: number;
      cumulativePnl: number;
      equity: number;
      drawdownPct: number;
      symbol: string;
      side: string;
      exitReason: string;
    }> = [
      {
        index: 0,
        id: 'start',
        time: sortedTrades.length > 0 ? new Date(sortedTrades[0].entryTime).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Başlangıç',
        timestamp: sortedTrades.length > 0 ? sortedTrades[0].entryTime : Date.now(),
        tradePnl: 0,
        cumulativePnl: 0,
        equity: initial,
        drawdownPct: 0,
        symbol: 'START',
        side: 'START',
        exitReason: 'Başlangıç Bakiyesi',
      }
    ];

    let runningCumPnl = 0;

    sortedTrades.forEach((trade, idx) => {
      const pnl = trade.pnl;
      runningCumPnl += pnl;
      runningEquity += pnl;
      totalCommissions += trade.commission || 0;

      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddUsdt = peakEquity - runningEquity;
      const ddPct = peakEquity > 0 ? (ddUsdt / peakEquity) * 100 : 0;
      if (ddUsdt > maxDrawdownUsdt) maxDrawdownUsdt = ddUsdt;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;

      // Symbol stats
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { trades: 0, wins: 0, pnl: 0, grossProfit: 0, grossLoss: 0 };
      }
      symbolStats[trade.symbol].trades++;
      symbolStats[trade.symbol].pnl += pnl;

      // Long / Short stats
      if (trade.side === 'LONG') {
        longCount++;
        if (pnl > 0) longWins++;
      } else {
        shortCount++;
        if (pnl > 0) shortWins++;
      }

      // Win / Loss classification
      if (pnl > 0.001) {
        winCount++;
        grossProfit += pnl;
        symbolStats[trade.symbol].wins++;
        symbolStats[trade.symbol].grossProfit += pnl;
        if (pnl > maxWin) maxWin = pnl;

        currentConsecutiveWins++;
        if (currentConsecutiveWins > maxConsecutiveWins) maxConsecutiveWins = currentConsecutiveWins;
        currentConsecutiveLosses = 0;
      } else if (pnl < -0.001) {
        lossCount++;
        const absLoss = Math.abs(pnl);
        grossLoss += absLoss;
        symbolStats[trade.symbol].grossLoss += absLoss;
        if (absLoss > maxLoss) maxLoss = absLoss;

        currentConsecutiveLosses++;
        if (currentConsecutiveLosses > maxConsecutiveLosses) maxConsecutiveLosses = currentConsecutiveLosses;
        currentConsecutiveWins = 0;
      } else {
        breakevenCount++;
        currentConsecutiveWins = 0;
        currentConsecutiveLosses = 0;
      }

      cumulativeCurve.push({
        index: idx + 1,
        id: trade.id,
        time: new Date(trade.exitTime).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: trade.exitTime,
        tradePnl: pnl,
        cumulativePnl: Number(runningCumPnl.toFixed(2)),
        equity: Number(runningEquity.toFixed(2)),
        drawdownPct: Number(ddPct.toFixed(2)),
        symbol: trade.symbol,
        side: trade.side,
        exitReason: trade.exitReason,
      });
    });

    const netPnl = grossProfit - grossLoss;
    const netReturnPct = (netPnl / initial) * 100;
    const winRatePct = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const avgWinPnl = winCount > 0 ? grossProfit / winCount : 0;
    const avgLossPnl = lossCount > 0 ? grossLoss / lossCount : 0;
    const payoffRatio = avgLossPnl > 0 ? avgWinPnl / avgLossPnl : avgWinPnl > 0 ? 99.9 : 0;
    const avgTradePnl = totalTrades > 0 ? netPnl / totalTrades : 0;

    // Expectancy = (Win% * AvgWin) - (Loss% * AvgLoss)
    const winProb = totalTrades > 0 ? winCount / totalTrades : 0;
    const lossProb = totalTrades > 0 ? lossCount / totalTrades : 0;
    const expectancy = (winProb * avgWinPnl) - (lossProb * avgLossPnl);

    const longWinRate = longCount > 0 ? (longWins / longCount) * 100 : 0;
    const shortWinRate = shortCount > 0 ? (shortWins / shortCount) * 100 : 0;

    return {
      totalTrades,
      winTrades: winCount,
      lossTrades: lossCount,
      breakevenTrades: breakevenCount,
      winRatePct,
      profitFactor,
      payoffRatio,
      grossProfit,
      grossLoss,
      netPnl,
      netReturnPct,
      avgTradePnl,
      avgWinPnl,
      avgLossPnl,
      maxWin,
      maxLoss,
      expectancy,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      totalCommissions,
      longTrades: longCount,
      longWinRate,
      shortTrades: shortCount,
      shortWinRate,
      maxDrawdownUsdt,
      maxDrawdownPct,
      cumulativeCurve,
      symbolBreakdown: symbolStats,
    };
  }
}
