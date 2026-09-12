import { BacktestConfig, BacktestResult, Candle, Strategy, TradeLog } from '../types/crypto';
import { StrategyEngine } from './strategyEngine';

export class BacktestEngine {
  /**
   * Run full vectorized backtest simulation on historical candles
   */
  static runBacktest(
    strategy: Strategy,
    candles: Candle[] = [],
    config: BacktestConfig
  ): BacktestResult {
    const initialBalance = config?.initialBalance || 10000;
    let balance = initialBalance;
    let peakBalance = balance;
    let maxDrawdownPct = 0;
    let maxDrawdownDurationBars = 0;
    let currentDrawdownBars = 0;

    const trades: TradeLog[] = [];
    const equityCurve: BacktestResult['equityCurve'] = [];

    const safeCandles = candles || [];
    if (safeCandles.length === 0) {
      return {
        initialBalance,
        finalBalance: initialBalance,
        totalReturnPct: 0,
        annualizedReturnPct: 0,
        benchmarkReturnPct: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdownPct: 0,
        maxDrawdownDurationDays: 0,
        winRatePct: 0,
        profitFactor: 0,
        payoffRatio: 0,
        totalTrades: 0,
        winTrades: 0,
        lossTrades: 0,
        avgWinPct: 0,
        avgLossPct: 0,
        trades: [],
        equityCurve: [{
          time: new Date().toISOString().split('T')[0],
          timestamp: Date.now(),
          equity: initialBalance,
          drawdownPct: 0,
          benchmarkEquity: initialBalance,
        }],
      };
    }

    // Buy & Hold Benchmark tracking
    const benchmarkStartPrice = safeCandles.length > 0 ? safeCandles[0].close : 1;
    const benchmarkShares = initialBalance / benchmarkStartPrice;

    // Active simulated position state
    let inPosition = false;
    let positionSide: 'LONG' | 'SHORT' = 'LONG';
    let entryPrice = 0;
    let entryTime = 0;
    let positionAmount = 0;
    let stopLossPrice = 0;
    let takeProfitPrice = 0;
    let trailingStopPeak = 0;

    const commissionRate = (config.commissionPct || 0.1) / 100;
    const slippageRate = (config.slippagePct || 0.05) / 100;
    const riskPerTrade = (config.riskPerTradePct || 10) / 100;

    // We need at least 30 candles for initial indicator warmup
    const warmup = Math.min(30, Math.floor(safeCandles.length / 2));

    for (let i = warmup; i < safeCandles.length; i++) {
      const slice = safeCandles.slice(0, i + 1);
      const currentCandle = safeCandles[i];
      const prevCandle = safeCandles[i - 1] || currentCandle;
      const currentPrice = currentCandle.close;

      const dateStr = new Date(currentCandle.time * 1000).toISOString().split('T')[0];
      const benchmarkVal = benchmarkShares * currentPrice;

      // 1. Check if in position, evaluate exits (SL / TP / Trailing Stop)
      if (inPosition) {
        let exitReason: string | null = null;
        let exitPrice = currentPrice;

        if (positionSide === 'LONG') {
          // Update Trailing Stop
          if (currentPrice > trailingStopPeak) {
            trailingStopPeak = currentPrice;
            if (config.useTrailingStop) {
              stopLossPrice = Math.max(
                stopLossPrice,
                trailingStopPeak * (1 - (config.trailingStopPct || 2) / 100)
              );
            }
          }

          if (currentCandle.low <= stopLossPrice) {
            exitReason = 'Stop Loss';
            exitPrice = stopLossPrice * (1 - slippageRate);
          } else if (currentCandle.high >= takeProfitPrice) {
            exitReason = 'Take Profit';
            exitPrice = takeProfitPrice * (1 - slippageRate);
          }
        }

        // Close position if exit triggered
        if (exitReason) {
          const grossPnl = (exitPrice - entryPrice) * positionAmount;
          const commissionCost = (entryPrice * positionAmount + exitPrice * positionAmount) * commissionRate;
          const netPnl = grossPnl - commissionCost;
          const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;

          balance += netPnl;

          trades.push({
            id: `trade-${trades.length + 1}`,
            symbol: config.symbol,
            side: positionSide,
            entryPrice,
            exitPrice,
            amount: positionAmount,
            pnl: netPnl,
            pnlPct,
            commission: commissionCost,
            entryTime,
            exitTime: currentCandle.time * 1000,
            durationMinutes: Math.round((currentCandle.time * 1000 - entryTime) / 60000),
            exitReason,
          });

          inPosition = false;
        }
      }

      // 2. Evaluate Strategy Signal on new candle
      if (!inPosition) {
        const signal = StrategyEngine.evaluateStrategy(strategy, slice);

        if (signal.action === 'BUY') {
          inPosition = true;
          positionSide = 'LONG';
          entryPrice = currentPrice * (1 + slippageRate);
          entryTime = currentCandle.time * 1000;

          const tradeCapital = balance * riskPerTrade;
          positionAmount = tradeCapital / entryPrice;

          // Deduct entry commission
          balance -= tradeCapital * commissionRate;

          stopLossPrice = signal.stopLossPrice || entryPrice * 0.98;
          takeProfitPrice = signal.takeProfitPrice || entryPrice * 1.05;
          trailingStopPeak = entryPrice;
        }
      } else {
        // Evaluate sell / close signal
        const signal = StrategyEngine.evaluateStrategy(strategy, slice);
        if (signal.action === 'SELL') {
          const exitPrice = currentPrice * (1 - slippageRate);
          const grossPnl = (exitPrice - entryPrice) * positionAmount;
          const commissionCost = (entryPrice * positionAmount + exitPrice * positionAmount) * commissionRate;
          const netPnl = grossPnl - commissionCost;
          const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;

          balance += netPnl;

          trades.push({
            id: `trade-${trades.length + 1}`,
            symbol: config.symbol,
            side: positionSide,
            entryPrice,
            exitPrice,
            amount: positionAmount,
            pnl: netPnl,
            pnlPct,
            commission: commissionCost,
            entryTime,
            exitTime: currentCandle.time * 1000,
            durationMinutes: Math.round((currentCandle.time * 1000 - entryTime) / 60000),
            exitReason: 'Strateji Sinyali (SELL)',
          });

          inPosition = false;
        }
      }

      // Track Peak & Drawdown
      const currentEquity = inPosition
        ? balance + (currentPrice - entryPrice) * positionAmount
        : balance;

      if (currentEquity > peakBalance) {
        peakBalance = currentEquity;
        currentDrawdownBars = 0;
      } else {
        currentDrawdownBars++;
        if (currentDrawdownBars > maxDrawdownDurationBars) {
          maxDrawdownDurationBars = currentDrawdownBars;
        }
      }

      const ddPct = ((peakBalance - currentEquity) / peakBalance) * 100;
      if (ddPct > maxDrawdownPct) {
        maxDrawdownPct = ddPct;
      }

      equityCurve.push({
        time: dateStr,
        timestamp: currentCandle.time * 1000,
        equity: Math.round(currentEquity * 100) / 100,
        drawdownPct: Math.round(ddPct * 100) / 100,
        benchmarkEquity: Math.round(benchmarkVal * 100) / 100,
      });
    }

    // Performance calculations
    const finalBalance = balance;
    const totalReturnPct = ((finalBalance - initialBalance) / initialBalance) * 100;
    const benchmarkReturnPct = safeCandles.length > 0 ? ((safeCandles[safeCandles.length - 1].close - benchmarkStartPrice) / benchmarkStartPrice) * 100 : 0;

    const winTrades = trades.filter((t) => t.pnl > 0);
    const lossTrades = trades.filter((t) => t.pnl <= 0);
    const winRatePct = trades.length > 0 ? (winTrades.length / trades.length) * 100 : 0;

    const grossProfit = winTrades.reduce((a, b) => a + b.pnl, 0);
    const grossLoss = Math.abs(lossTrades.reduce((a, b) => a + b.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;

    const avgWinPct = winTrades.length > 0 ? winTrades.reduce((a, b) => a + b.pnlPct, 0) / winTrades.length : 0;
    const avgLossPct = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((a, b) => a + b.pnlPct, 0) / lossTrades.length) : 0;
    const payoffRatio = avgLossPct > 0 ? avgWinPct / avgLossPct : avgWinPct;

    // Calculate Sharpe & Sortino Ratios (Annualized)
    const returns = trades.map((t) => t.pnlPct / 100);
    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    
    let variance = 0;
    let downsideVariance = 0;
    for (const r of returns) {
      variance += Math.pow(r - meanReturn, 2);
      if (r < 0) downsideVariance += Math.pow(r, 2);
    }
    const stdDev = returns.length > 1 ? Math.sqrt(variance / (returns.length - 1)) : 0.01;
    const downsideStdDev = lossTrades.length > 0 ? Math.sqrt(downsideVariance / lossTrades.length) : 0.01;

    // Assuming ~250 trading periods
    const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;
    const sortinoRatio = downsideStdDev > 0 ? (meanReturn / downsideStdDev) * Math.sqrt(252) : 0;

    const daysCount = safeCandles.length > 1 ? (safeCandles[safeCandles.length - 1].time - safeCandles[0].time) / 86400 : 1;
    const annualizedReturnPct = daysCount > 0 ? (totalReturnPct / daysCount) * 365 : totalReturnPct;

    return {
      initialBalance,
      finalBalance: Math.round(finalBalance * 100) / 100,
      totalReturnPct: Math.round(totalReturnPct * 100) / 100,
      annualizedReturnPct: Math.round(annualizedReturnPct * 100) / 100,
      benchmarkReturnPct: Math.round(benchmarkReturnPct * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      sortinoRatio: Math.round(sortinoRatio * 100) / 100,
      maxDrawdownPct: Math.round(maxDrawdownPct * 100) / 100,
      maxDrawdownDurationDays: Math.round((maxDrawdownDurationBars * 15) / (60 * 24)), // approximate
      winRatePct: Math.round(winRatePct * 10) / 10,
      profitFactor: Math.round(profitFactor * 100) / 100,
      payoffRatio: Math.round(payoffRatio * 100) / 100,
      totalTrades: trades.length,
      winTrades: winTrades.length,
      lossTrades: lossTrades.length,
      avgWinPct: Math.round(avgWinPct * 100) / 100,
      avgLossPct: Math.round(avgLossPct * 100) / 100,
      trades: trades.reverse(),
      equityCurve,
    };
  }

  /**
   * Export Trades to CSV
   */
  static exportTradesCSV(trades: TradeLog[] = []): string {
    const safeTrades = trades || [];
    const headers = ['ID', 'Symbol', 'Side', 'EntryPrice', 'ExitPrice', 'Amount', 'PnL_USDT', 'PnL_Pct', 'Commission', 'DurationMin', 'ExitReason'];
    const rows = safeTrades.map((t) => [
      t.id,
      t.symbol,
      t.side,
      t.entryPrice.toFixed(4),
      t.exitPrice.toFixed(4),
      t.amount.toFixed(4),
      t.pnl.toFixed(2),
      t.pnlPct.toFixed(2) + '%',
      t.commission.toFixed(2),
      t.durationMinutes,
      `"${t.exitReason}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
