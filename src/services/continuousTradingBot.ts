import { Strategy, Timeframe, Signal, Position, TradingMode } from '../types/crypto';
import { BinanceService } from './binanceService';
import { StrategyEngine } from './strategyEngine';
import { PaperTradingEngine } from './paperTradingEngine';
import { TOP_500_COINS } from '../data/top500Coins';

export interface ContinuousBotConfig {
  enabled: boolean;
  autoTrade: boolean;
  scanPool: 'top50' | 'top100' | 'favorites';
  timeframe: Timeframe;
  selectedStrategyId: string;
  orderSizeUSDT: number;
  stopLossPct: number;
  takeProfitPct: number;
  trailingStopPct: number;
  maxOpenPositions: number;
  cycleCooldownSeconds: number;
  mode: TradingMode;
}

export interface BotSignalRecord {
  id: string;
  symbol: string;
  strategyId: string;
  strategyName: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  reason: string;
  timestamp: number;
  tradeExecuted: boolean;
  executionMessage?: string;
}

export interface BotStatus {
  isRunning: boolean;
  currentCycle: number;
  currentSymbol: string;
  scannedCountInCycle: number;
  totalInCycle: number;
  totalScannedAllTime: number;
  totalSignalsFound: number;
  totalTradesExecuted: number;
  lastScanTime: number;
  nextCycleTime?: number;
}

type BotListener = () => void;

export class ContinuousTradingBot {
  private static config: ContinuousBotConfig = {
    enabled: false,
    autoTrade: true,
    scanPool: 'top50',
    timeframe: '15m',
    selectedStrategyId: 'strat-pm-mangi',
    orderSizeUSDT: 500,
    stopLossPct: 2.0,
    takeProfitPct: 4.5,
    trailingStopPct: 1.5,
    maxOpenPositions: 5,
    cycleCooldownSeconds: 5,
    mode: 'PAPER',
  };

  private static status: BotStatus = {
    isRunning: false,
    currentCycle: 0,
    currentSymbol: '',
    scannedCountInCycle: 0,
    totalInCycle: 0,
    totalScannedAllTime: 0,
    totalSignalsFound: 0,
    totalTradesExecuted: 0,
    lastScanTime: 0,
  };

  private static isLoopActive = false;
  private static shouldStop = false;
  private static recentSignals: BotSignalRecord[] = [];
  private static logs: string[] = [];
  private static listeners: Set<BotListener> = new Set();
  private static strategiesRef: Strategy[] = [];

  /**
   * Initialize configuration from storage or defaults
   */
  static init(strategies: Strategy[]) {
    this.strategiesRef = strategies;
    const saved = localStorage.getItem('kripto_continuous_bot_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      } catch (e) {
        console.error('Failed to parse continuous bot config:', e);
      }
    }
  }

  static updateStrategies(strategies: Strategy[]) {
    this.strategiesRef = strategies;
  }

  static getConfig(): ContinuousBotConfig {
    return { ...this.config };
  }

  static getStatus(): BotStatus {
    return { ...this.status };
  }

  static getRecentSignals(): BotSignalRecord[] {
    return [...this.recentSignals];
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static subscribe(listener: BotListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    this.listeners.forEach((l) => l());
  }

  static addLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    this.logs = [`[${timestamp}] ${msg}`, ...this.logs].slice(0, 100);
    this.notify();
  }

  static updateConfig(newConfig: Partial<ContinuousBotConfig>) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('kripto_continuous_bot_config', JSON.stringify(this.config));
    this.notify();
  }

  /**
   * Start 24/7 continuous market scanning and auto-trading loop
   */
  static async start(strategies?: Strategy[]) {
    if (strategies) this.strategiesRef = strategies;
    if (this.isLoopActive) return;

    this.shouldStop = false;
    this.isLoopActive = true;
    this.config.enabled = true;
    this.status.isRunning = true;
    this.addLog('🚀 7/24 Kesintisiz Otonom Tarama ve Otomatik Trading Botu BAŞLATILDI.');
    this.notify();

    // Run the infinite loop
    this.runLoop();
  }

  /**
   * Stop the continuous trading loop
   */
  static stop() {
    this.shouldStop = true;
    this.isLoopActive = false;
    this.config.enabled = false;
    this.status.isRunning = false;
    this.status.currentSymbol = '';
    this.addLog('🛑 Kesintisiz Otonom Bot DURDURULDU.');
    this.notify();
  }

  /**
   * Core continuous loop running across market pools non-stop
   */
  private static async runLoop() {
    while (this.isLoopActive && !this.shouldStop) {
      this.status.currentCycle += 1;
      const cycleNum = this.status.currentCycle;
      
      // Determine symbols to scan
      let symbolsToScan: string[] = [];
      if (this.config.scanPool === 'top50') {
        symbolsToScan = TOP_500_COINS.slice(0, 50).map((c) => c.symbol);
      } else if (this.config.scanPool === 'top100') {
        symbolsToScan = TOP_500_COINS.slice(0, 100).map((c) => c.symbol);
      } else {
        const favs = localStorage.getItem('crypto_favorites');
        if (favs) {
          try {
            symbolsToScan = JSON.parse(favs);
          } catch {
            symbolsToScan = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
          }
        } else {
          symbolsToScan = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'AVAXUSDT', 'DOGEUSDT', 'LINKUSDT'];
        }
      }

      this.status.totalInCycle = symbolsToScan.length;
      this.status.scannedCountInCycle = 0;
      this.addLog(`🔄 Döngü #${cycleNum} Başladı: ${symbolsToScan.length} coin taranıyor (${this.config.timeframe} dilimi)...`);
      this.notify();

      // Find selected strategy or fallback to first enabled
      let strat = this.strategiesRef.find((s) => s.id === this.config.selectedStrategyId);
      if (!strat && this.strategiesRef.length > 0) {
        strat = this.strategiesRef[0];
      }

      if (!strat) {
        this.addLog('⚠️ Uyarı: Aktif strateji bulunamadı. Lütfen bir strateji seçin.');
        await this.sleep(3000);
        continue;
      }

      // Process in small batches of 3-5 to respect Binance rate limits cleanly
      const batchSize = 4;
      for (let i = 0; i < symbolsToScan.length; i += batchSize) {
        if (this.shouldStop) break;

        const batch = symbolsToScan.slice(i, i + batchSize);
        const promises = batch.map(async (sym) => {
          if (this.shouldStop) return;
          this.status.currentSymbol = sym;
          this.notify();

          try {
            // Fetch recent 120 candles (low API weight = 2)
            const candles = await BinanceService.fetchKlines(sym, this.config.timeframe, 120);
            if (candles && candles.length >= 30) {
              const latestPrice = candles[candles.length - 1]?.close || 0;
              if (latestPrice > 0) {
                PaperTradingEngine.onPriceTick(sym, latestPrice);
              }

              const signal = StrategyEngine.evaluateStrategy(strat!, candles);
              this.status.totalScannedAllTime += 1;
              this.status.lastScanTime = Date.now();

              // Process Signal
              if (signal.action === 'BUY' || signal.action === 'SELL') {
                await this.handleSignalDetected(sym, strat!, signal, latestPrice || signal.price);
              }
            }
          } catch (err: any) {
            // Non-blocking error handling
            console.warn(`ContinuousBot: ${sym} fetch error:`, err?.message || err);
          }
        });

        await Promise.all(promises);
        this.status.scannedCountInCycle += batch.length;
        this.notify();

        // 600ms pause between batches ensures zero rate limit stress
        if (i + batchSize < symbolsToScan.length && !this.shouldStop) {
          await this.sleep(600);
        }
      }

      this.addLog(`✅ Döngü #${cycleNum} tamamlandı. (${this.status.scannedCountInCycle} coin tarandı).`);
      
      if (!this.shouldStop) {
        const cooldown = Math.max(1, this.config.cycleCooldownSeconds);
        this.status.nextCycleTime = Date.now() + cooldown * 1000;
        this.addLog(`⏳ ${cooldown} saniye sonra sonraki döngüye geçilecek...`);
        this.notify();
        await this.sleep(cooldown * 1000);
      }
    }

    this.isLoopActive = false;
    this.status.isRunning = false;
    this.status.currentSymbol = '';
    this.notify();
  }

  /**
   * Handle discovered BUY or SELL signal and auto-execute if enabled
   */
  private static async handleSignalDetected(
    symbol: string,
    strategy: Strategy,
    signal: Signal,
    currentPrice: number
  ) {
    this.status.totalSignalsFound += 1;
    let tradeExecuted = false;
    let execMessage = '';

    const openPositions = PaperTradingEngine.getPositions().filter((p) => p.status === 'OPEN');
    const hasOpenPosForSymbol = openPositions.some((p) => p.symbol === symbol);

    if (this.config.autoTrade) {
      if (signal.action === 'BUY') {
        if (hasOpenPosForSymbol) {
          execMessage = `${symbol} üzerinde zaten açık pozisyon var, yeni pozisyon açılmadı.`;
          this.addLog(`ℹ️ ${execMessage}`);
        } else if (openPositions.length >= this.config.maxOpenPositions) {
          execMessage = `Maksimum açık pozisyon limitine (${this.config.maxOpenPositions}) ulaşıldı.`;
          this.addLog(`⚠️ ${execMessage}`);
        } else {
          // Execute BUY Order
          const result = PaperTradingEngine.placeOrder({
            symbol,
            type: 'MARKET',
            side: 'BUY',
            price: currentPrice,
            amountUSDT: this.config.orderSizeUSDT,
            leverage: 1,
            stopLossPct: this.config.stopLossPct,
            takeProfitPct: this.config.takeProfitPct,
            trailingStopPct: this.config.trailingStopPct,
            mode: this.config.mode,
          });

          if (result.success) {
            tradeExecuted = true;
            this.status.totalTradesExecuted += 1;
            execMessage = `OTOMATİK ALIM YAPILDI: ${symbol} @ $${currentPrice.toFixed(4)} ($${this.config.orderSizeUSDT} USDT)`;
            this.addLog(`⚡ ${execMessage} [${strategy.name}]`);
          } else {
            execMessage = `Alım başarısız: ${result.message}`;
            this.addLog(`❌ ${execMessage}`);
          }
        }
      } else if (signal.action === 'SELL') {
        const existingLong = openPositions.find((p) => p.symbol === symbol && p.side === 'LONG');
        if (existingLong) {
          PaperTradingEngine.closePosition(existingLong.id, `Otonom Satış Sinyali (${strategy.name})`);
          tradeExecuted = true;
          this.status.totalTradesExecuted += 1;
          execMessage = `OTOMATİK POZİSYON KAPATILDI: ${symbol} @ $${currentPrice.toFixed(4)}`;
          this.addLog(`🎯 ${execMessage}`);
        } else {
          execMessage = `Satış sinyali tespit edildi (Açık long pozisyon yok).`;
          this.addLog(`🔔 ${symbol} SELL sinyali: ${signal.reason}`);
        }
      }
    } else {
      execMessage = `Sadece izleme modu (Otomatik Al-Sat kapalı).`;
      this.addLog(`🔥 SİNYAL: ${symbol} -> ${signal.action} [${strategy.name}] (${signal.reason})`);
    }

    // Record in recent signals table
    const record: BotSignalRecord = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      symbol,
      strategyId: strategy.id,
      strategyName: strategy.name,
      action: signal.action,
      price: currentPrice,
      reason: signal.reason,
      timestamp: Date.now(),
      tradeExecuted,
      executionMessage: execMessage,
    };

    this.recentSignals = [record, ...this.recentSignals].slice(0, 100);
    this.notify();
  }

  private static sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
