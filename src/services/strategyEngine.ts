import { Candle, Signal, Strategy, Timeframe } from '../types/crypto';
import { IndicatorEngine } from './indicatorEngine';

export class StrategyEngine {
  /**
   * Default Pre-built Strategies
   */
  static getInitialStrategies(): Strategy[] {
    return [
      {
        id: 'strat-price-action-mangi',
        name: 'Mangi Madang Price Action',
        category: 'custom',
        archetype: 'PRICE_ACTION_CONFLUENCE_ALPHA',
        description: 'Mangi Madang prensipleriyle RSI, Destek/Direnç ve Pin Bar (Hammer) / Engulfing formasyonlarını birleştirerek kesişim (Confluence) noktasında isabetli işlemler yakalar.',
        symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        timeframe: '15m',
        enabled: true,
        params: {
          rsiPeriod: 14,
          oversoldThreshold: 45,
          overboughtThreshold: 75,
          stopLossPct: 1.5,
          takeProfitPct: 8.0,
        },
        totalSignals: 0,
        winRate: 0,
        profitPct: 0,
      },
      {
        id: 'strat-ema-cross',
        name: 'EMA Golden & Trend Cross',
        category: 'trend',
        description: '20 EMA ve 50 EMA kesişimi ile trend takibi. 200 EMA trend filtresi ile sahte kırılımları eler.',
        symbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'],
        timeframe: '15m',
        enabled: true,
        params: {
          fastPeriod: 20,
          slowPeriod: 50,
          filterPeriod: 200,
          stopLossPct: 2.0,
          takeProfitPct: 5.0,
        },
        totalSignals: 48,
        winRate: 64.5,
        profitPct: 38.2,
      },
      {
        id: 'strat-rsi-mean-reversion',
        name: 'RSI Dinamik Mean Reversion',
        category: 'mean_reversion',
        description: 'Aşırı satım bölgesinden (RSI < 30) dönüşlerde alım, aşırı alım (RSI > 70) bölgesinde kâr alma stratejisi.',
        symbols: ['BTCUSDT', 'ETHUSDT'],
        timeframe: '5m',
        enabled: true,
        params: {
          rsiPeriod: 14,
          oversoldThreshold: 30,
          overboughtThreshold: 70,
          stopLossPct: 1.8,
          takeProfitPct: 3.5,
        },
        totalSignals: 62,
        winRate: 61.2,
        profitPct: 24.8,
      },
      {
        id: 'strat-bollinger-breakout',
        name: 'Bollinger & Hacim Kırılımı',
        category: 'breakout',
        description: 'Volatilite sıkışması (squeeze) sonrası Bollinger üst bandının yüksek hacimle kırılımında momentum işlemi açar.',
        symbols: ['SOLUSDT', 'AVAXUSDT'],
        timeframe: '15m',
        enabled: false,
        params: {
          period: 20,
          stdDev: 2.0,
          volumeMultiplier: 1.5,
          stopLossPct: 2.5,
          takeProfitPct: 6.0,
        },
        totalSignals: 35,
        winRate: 57.1,
        profitPct: 31.4,
      },
      {
        id: 'strat-supertrend-macd',
        name: 'SuperTrend + MACD Sinerji',
        category: 'trend',
        description: 'SuperTrend boğa teyidi ve MACD histogramının sıfır üzerine çıkmasıyla yüksek olasılıklı trend yönlü pozisyon açar.',
        symbols: ['BTCUSDT', 'BNBUSDT'],
        timeframe: '1h',
        enabled: true,
        params: {
          stPeriod: 10,
          stMultiplier: 3.0,
          macdFast: 12,
          macdSlow: 26,
          macdSignal: 9,
          stopLossPct: 2.0,
          takeProfitPct: 4.5,
        },
        totalSignals: 29,
        winRate: 68.9,
        profitPct: 44.1,
      },
      {
        id: 'strat-grid-trading',
        name: 'Adaptif Grid Botu',
        category: 'grid',
        description: 'Yatay piyasalarda belirlenen fiyat aralığında kademeli alış ve satış limit emirleri ile sürekli kâr toplar.',
        symbols: ['ETHUSDT', 'BTCUSDT'],
        timeframe: '15m',
        enabled: false,
        params: {
          gridLevels: 8,
          gridStepPct: 0.8,
          upperLimitPct: 5.0,
          lowerLimitPct: 5.0,
        },
        totalSignals: 112,
        winRate: 82.1,
        profitPct: 19.5,
      },
      {
        id: 'strat-dca-smart',
        name: 'Akıllı Çarpanlı DCA',
        category: 'dca',
        description: 'Fiyat düşüşlerinde kademeli artan çarpanlarla (1x, 1.5x, 2x) maliyet düşürür ve ortalama fiyata %3 kâr koyar.',
        symbols: ['BTCUSDT'],
        timeframe: '1h',
        enabled: false,
        params: {
          stepDropPct: 2.5,
          maxOrders: 5,
          volumeScale: 1.5,
          targetProfitPct: 3.0,
        },
        totalSignals: 41,
        winRate: 85.3,
        profitPct: 22.0,
      },
      {
        id: 'strat-custom-python',
        name: 'Özel Kantitatif Python / JS Stratejisi',
        category: 'custom',
        description: 'Kullanıcının yazdığı özel BaseStrategy sınıfı ve teknik kural motoru.',
        symbols: ['BTCUSDT'],
        timeframe: '15m',
        enabled: false,
        params: {
          threshold: 1.5,
          stopLossPct: 2.0,
          takeProfitPct: 4.0,
        },
        customCode: `class CustomQuantitativeStrategy:
    """
    Kullanıcı Özel Trading Stratejisi
    on_new_candle metodu her yeni mumda çağrılır.
    """
    def __init__(self, rsi_period=14, ema_filter=200):
        self.rsi_period = rsi_period
        self.ema_filter = ema_filter

    def on_new_candle(self, df):
        # df: pandas DataFrame (open, high, low, close, volume)
        current_price = df['close'].iloc[-1]
        rsi = calculate_rsi(df, period=self.rsi_period)
        ema_200 = calculate_ema(df, period=self.ema_filter)

        # Strateji Mantığı
        if rsi.iloc[-1] < 32 and current_price > ema_200.iloc[-1]:
            return {
                "action": "BUY",
                "confidence": 85,
                "reason": "RSI aşırı satım + 200 EMA üzerinde boğa onayı",
                "suggested_position_size_pct": 10,
                "stop_loss_pct": 1.8,
                "take_profit_pct": 4.2
            }
        elif rsi.iloc[-1] > 68:
            return {
                "action": "SELL",
                "confidence": 75,
                "reason": "RSI aşırı alım bölgesi kâr realizasyonu",
                "suggested_position_size_pct": 10
            }
        
        return {"action": "HOLD", "confidence": 50, "reason": "Piyasa beklemede"}
`,
        totalSignals: 18,
        winRate: 66.7,
        profitPct: 28.3,
      },
    ];
  }

  /**
   * Evaluate a Strategy on given Candles and produce current Signal
   */
  static evaluateStrategy(strategy: Strategy, candles: Candle[] = []): Signal {
    const safeCandles = candles || [];
    if (safeCandles.length < 50) {
      return {
        id: `sig-${Date.now()}`,
        strategyId: strategy?.id || 'unknown',
        strategyName: strategy?.name || 'Strateji',
        symbol: strategy?.symbols?.[0] || 'BTCUSDT',
        timestamp: Date.now(),
        action: 'HOLD',
        price: safeCandles.length > 0 ? safeCandles[safeCandles.length - 1].close : 0,
        confidence: 50,
        reason: 'Yetersiz mum verisi',
        suggestedPositionSizePct: 5,
      };
    }

    const lastCandle = safeCandles[safeCandles.length - 1];
    const prevCandle = safeCandles[safeCandles.length - 2] || lastCandle;
    const currentPrice = lastCandle.close;

    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    let reason = 'Bekleme konumu - Belirgin sinyal yok';
    let sl = currentPrice * 0.98;
    let tp = currentPrice * 1.04;

    switch (strategy.id) {
      case 'strat-ema-cross': {
        const fastP = strategy.params.fastPeriod || 20;
        const slowP = strategy.params.slowPeriod || 50;
        const filterP = strategy.params.filterPeriod || 200;

        const fastEMA = IndicatorEngine.calculateEMA(candles, fastP);
        const slowEMA = IndicatorEngine.calculateEMA(candles, slowP);
        const filterEMA = IndicatorEngine.calculateEMA(candles, filterP);

        const currFast = fastEMA[fastEMA.length - 1];
        const prevFast = fastEMA[fastEMA.length - 2];
        const currSlow = slowEMA[slowEMA.length - 1];
        const prevSlow = slowEMA[slowEMA.length - 2];
        const currFilter = filterEMA[filterEMA.length - 1];

        if (currFast && prevFast && currSlow && prevSlow) {
          // Golden cross
          if (prevFast <= prevSlow && currFast > currSlow) {
            const aboveFilter = currFilter ? currentPrice > currFilter : true;
            action = 'BUY';
            confidence = aboveFilter ? 88 : 72;
            reason = aboveFilter
              ? `EMA(${fastP}) EMA(${slowP}) yukarı kesti ve EMA(${filterP}) üzerinde güçlü boğa trendi`
              : `EMA(${fastP}) EMA(${slowP}) yukarı kesti`;
            sl = currentPrice * (1 - (strategy.params.stopLossPct || 2) / 100);
            tp = currentPrice * (1 + (strategy.params.takeProfitPct || 5) / 100);
          } else if (prevFast >= prevSlow && currFast < currSlow) {
            action = 'SELL';
            confidence = 82;
            reason = `EMA(${fastP}) EMA(${slowP}) aşağı kesti (Death Cross)`;
          } else if (currFast > currSlow) {
            reason = `EMA(${fastP}) > EMA(${slowP}) Yükselen trend devam ediyor`;
            confidence = 65;
          }
        }
        break;
      }

      case 'strat-rsi-mean-reversion': {
        const rsiP = strategy.params.rsiPeriod || 14;
        const oversold = strategy.params.oversoldThreshold || 30;
        const overbought = strategy.params.overboughtThreshold || 70;

        const rsi = IndicatorEngine.calculateRSI(candles, rsiP);
        const currRsi = rsi[rsi.length - 1];
        const prevRsi = rsi[rsi.length - 2];

        if (currRsi !== null && prevRsi !== null) {
          if (prevRsi <= oversold && currRsi > oversold) {
            action = 'BUY';
            confidence = 84;
            reason = `RSI (${currRsi.toFixed(1)}) aşırı satım bölgesinden yukarı döndü`;
            sl = currentPrice * (1 - (strategy.params.stopLossPct || 1.8) / 100);
            tp = currentPrice * (1 + (strategy.params.takeProfitPct || 3.5) / 100);
          } else if (prevRsi >= overbought && currRsi < overbought) {
            action = 'SELL';
            confidence = 80;
            reason = `RSI (${currRsi.toFixed(1)}) aşırı alım bölgesinden aşağı döndü`;
          } else {
            reason = `RSI Seviyesi: ${currRsi.toFixed(1)} (Nötr bölge)`;
          }
        }
        break;
      }

      case 'strat-supertrend-macd': {
        const st = IndicatorEngine.calculateSuperTrend(
          candles,
          strategy.params.stPeriod || 10,
          strategy.params.stMultiplier || 3.0
        );
        const macd = IndicatorEngine.calculateMACD(
          candles,
          strategy.params.macdFast || 12,
          strategy.params.macdSlow || 26,
          strategy.params.macdSignal || 9
        );

        const currTrend = st.trend[st.trend.length - 1];
        const prevTrend = st.trend[st.trend.length - 2];
        const currHist = macd.histogram[macd.histogram.length - 1];
        const prevHist = macd.histogram[macd.histogram.length - 2];

        if (currTrend === 1 && (prevTrend === -1 || (prevHist !== null && currHist !== null && prevHist <= 0 && currHist > 0))) {
          action = 'BUY';
          confidence = 90;
          reason = 'SuperTrend yeşile döndü ve MACD Histogramı pozitif alana geçti';
          sl = currentPrice * (1 - (strategy.params.stopLossPct || 2) / 100);
          tp = currentPrice * (1 + (strategy.params.takeProfitPct || 4.5) / 100);
        } else if (currTrend === -1 && prevTrend === 1) {
          action = 'SELL';
          confidence = 85;
          reason = 'SuperTrend kırmızıya döndü (Trend sonlandı)';
        } else {
          reason = currTrend === 1 ? 'SuperTrend Boğa trendinde' : 'SuperTrend Ayı trendinde';
        }
        break;
      }

      case 'strat-bollinger-breakout': {
        const bb = IndicatorEngine.calculateBollingerBands(
          candles,
          strategy.params.period || 20,
          strategy.params.stdDev || 2.0
        );
        const upper = bb.upper[bb.upper.length - 1];
        const lower = bb.lower[bb.lower.length - 1];

        if (upper && lower) {
          if (currentPrice > upper && prevCandle.close <= upper) {
            action = 'BUY';
            confidence = 83;
            reason = `Bollinger üst bandı (${upper.toFixed(2)}) yukarı yönlü kırıldı`;
            sl = currentPrice * (1 - (strategy.params.stopLossPct || 2.5) / 100);
            tp = currentPrice * (1 + (strategy.params.takeProfitPct || 6.0) / 100);
          } else if (currentPrice < lower && prevCandle.close >= lower) {
            action = 'SELL';
            confidence = 78;
            reason = `Bollinger alt bandı (${lower.toFixed(2)}) aşağı yönlü kırıldı`;
          } else {
            reason = `Fiyat Bollinger bantları içinde (${lower.toFixed(2)} - ${upper.toFixed(2)})`;
          }
        }
        break;
      }

      default: {
        // Auto-Learned AI Strategies & Archetype Dynamic Evaluator
        const archetype = strategy.params?.archetype || '';
        const params = strategy.params || {};

        sl = currentPrice * (1 - (params.stopLossPct || 2.5) / 100);
        tp = currentPrice * (1 + (params.takeProfitPct || 6.5) / 100);

        if (archetype === 'ADAPTIVE_EMA_TREND_RIDER' || strategy.category === 'trend') {
          const fastEMA = IndicatorEngine.calculateEMA(candles, params.fastEMA || params.fastPeriod || 14);
          const slowEMA = IndicatorEngine.calculateEMA(candles, params.slowEMA || params.slowPeriod || 40);
          const filterEMA = IndicatorEngine.calculateEMA(candles, params.filterEMA || params.filterPeriod || 150);

          const f = fastEMA[fastEMA.length - 1];
          const prevF = fastEMA[fastEMA.length - 2];
          const s = slowEMA[slowEMA.length - 1];
          const prevS = slowEMA[slowEMA.length - 2];
          const flt = filterEMA[filterEMA.length - 1] || 0;

          if (f && prevF && s && prevS) {
            if (prevF <= prevS && f > s && currentPrice > flt) {
              action = 'BUY';
              confidence = 91;
              reason = `AI Trend: EMA(${params.fastEMA || 14}) EMA(${params.slowEMA || 40}) yukarı kesti ve EMA(${params.filterEMA || 150}) üzerinde güçlü yükseliş teyit edildi`;
            } else if (prevF >= prevS && f < s) {
              action = 'SELL';
              confidence = 85;
              reason = `AI Trend: EMA(${params.fastEMA || 14}) EMA(${params.slowEMA || 40}) aşağı kesti (Trend çıkış)`;
            } else if (f > s) {
              reason = `AI Trend: Boğa trendi devam ediyor (Fiyat: $${currentPrice.toFixed(2)})`;
              confidence = 68;
            }
          }
        } else if (archetype === 'DYNAMIC_RSI_VOLATILITY_SQUEEZE' || strategy.category === 'mean_reversion') {
          const rsiPeriod = params.rsiPeriod || 14;
          const oversold = params.oversoldThreshold || 30;
          const overbought = params.overboughtThreshold || 70;
          const rsi = IndicatorEngine.calculateRSI(candles, rsiPeriod);
          const currRsi = rsi[rsi.length - 1];
          const prevRsi = rsi[rsi.length - 2];

          if (currRsi !== null && prevRsi !== null) {
            if (prevRsi <= oversold && currRsi > oversold) {
              action = 'BUY';
              confidence = 88;
              reason = `AI RSI Squeeze: RSI(${rsiPeriod}) ${currRsi.toFixed(1)} seviyesinden aşırı satım bölgesinden yukarı döndü`;
            } else if (prevRsi >= overbought && currRsi < overbought) {
              action = 'SELL';
              confidence = 84;
              reason = `AI RSI Squeeze: RSI(${rsiPeriod}) ${currRsi.toFixed(1)} aşırı alımdan kâr realizasyonuna geçti`;
            } else {
              reason = `AI RSI Squeeze: Nötr osilasyon (RSI: ${currRsi.toFixed(1)})`;
            }
          }
        } else if (archetype === 'SUPERTREND_MACD_MOMENTUM_HARVESTER') {
          const st = IndicatorEngine.calculateSuperTrend(candles, params.stPeriod || 10, params.stMultiplier || 3.0);
          const macd = IndicatorEngine.calculateMACD(candles, params.macdFast || 12, params.macdSlow || 26, params.macdSignal || 9);
          const currTrend = st.trend[st.trend.length - 1];
          const prevTrend = st.trend[st.trend.length - 2];
          const currHist = macd.histogram[macd.histogram.length - 1];

          if (currTrend === 1 && prevTrend === -1) {
            action = 'BUY';
            confidence = 92;
            reason = 'AI SuperTrend: Boğa trendi başladı ve momentum teyit edildi';
          } else if (currTrend === -1 && prevTrend === 1) {
            action = 'SELL';
            confidence = 86;
            reason = 'AI SuperTrend: Ayı trendi başlangıcı (Kâr al / Çıkış)';
          } else {
            reason = currTrend === 1 ? 'SuperTrend Boğa Rejimi' : 'SuperTrend Ayı Rejimi';
          }
        } else if (archetype === 'DONCHIAN_VOLUME_BREAKOUT_RADAR' || strategy.category === 'breakout') {
          const lookback = params.channelPeriod || 20;
          let highest = 0;
          for (let k = candles.length - 1 - lookback; k < candles.length - 1; k++) {
            if (candles[k] && candles[k].high > highest) highest = candles[k].high;
          }
          if (currentPrice > highest && lastCandle.volume > prevCandle.volume * (params.volumeMultiplier || 1.4)) {
            action = 'BUY';
            confidence = 89;
            reason = `AI Breakout: Son ${lookback} periyodun zirvesi ($${highest.toFixed(2)}) yüksek hacimle kırıldı`;
          } else {
            reason = `AI Breakout: Zirve kırılımı bekleniyor (Direnç: $${highest.toFixed(2)})`;
          }
        } else if (archetype === 'PRICE_ACTION_CONFLUENCE_ALPHA') {
          // Implement Mangi Madang Price Action basic heuristic (Pin Bar / Engulfing near support)
          const body = Math.abs(lastCandle.open - lastCandle.close);
          const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
          const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;
          const isBullish = lastCandle.close > lastCandle.open;
          
          const prevBody = Math.abs(prevCandle.open - prevCandle.close);
          const isPrevBearish = prevCandle.close < prevCandle.open;

          // Bullish Pin Bar (Hammer)
          const isHammer = lowerWick > body * 2 && upperWick < body;
          
          // Bullish Engulfing
          const isBullishEngulfing = isPrevBearish && isBullish && lastCandle.close > prevCandle.open && lastCandle.open < prevCandle.close;

          const rsi = IndicatorEngine.calculateRSI(candles, params.rsiPeriod || 14);
          const currRsi = rsi[rsi.length - 1] || 50;

          if ((isHammer || isBullishEngulfing) && currRsi < 45) {
            action = 'BUY';
            confidence = 92;
            reason = `Mangi Madang Price Action: ${isHammer ? 'Bullish Pin Bar (Hammer)' : 'Bullish Engulfing'} formasyonu destek (RSI ${currRsi.toFixed(1)}) bölgesinde onaylandı (Confluence).`;
          } else if (currRsi > (params.overboughtThreshold || 75)) {
            action = 'SELL';
            confidence = 85;
            reason = `Price Action Direnç Kesişimi: Aşırı alım bölgesinde satış baskısı (RSI ${currRsi.toFixed(1)}).`;
          } else {
            reason = `Price Action: Net bir formasyon (Pin bar, Engulfing) bekleniyor. (RSI ${currRsi.toFixed(1)})`;
          }
        } else {
          // General AI Consensus
          const rsi = IndicatorEngine.calculateRSI(candles, params.rsiPeriod || 14);
          const currRsi = rsi[rsi.length - 1] || 50;
          if (currRsi < (params.oversoldThreshold || 32)) {
            action = 'BUY';
            confidence = 82;
            reason = `AI Optimizasyon: Aşırı satım dönüşü (RSI ${currRsi.toFixed(1)})`;
          } else if (currRsi > (params.overboughtThreshold || 70)) {
            action = 'SELL';
            confidence = 80;
            reason = `AI Optimizasyon: Aşırı alım direnci (RSI ${currRsi.toFixed(1)})`;
          } else {
            reason = `AI Optimizasyon Konsensüsü: Beklemede (RSI ${currRsi.toFixed(1)})`;
          }
        }
        break;
      }
    }

    return {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol: strategy.symbols[0] || 'BTCUSDT',
      timestamp: Date.now(),
      action,
      price: currentPrice,
      confidence,
      reason,
      suggestedPositionSizePct: 10,
      stopLossPrice: sl,
      takeProfitPrice: tp,
    };
  }
}
