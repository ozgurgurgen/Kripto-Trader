import { Candle, SupportResistanceZone, PivotPoints } from '../types/crypto';

export class IndicatorEngine {
  /**
   * Simple Moving Average (SMA)
   */
  static calculateSMA(candles: Candle[] = [], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    if (!candles || candles.length === 0) return result;
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }
      result.push(sum / period);
    }
    return result;
  }

  /**
   * Exponential Moving Average (EMA)
   */
  static calculateEMA(candles: Candle[] = [], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    if (!candles || candles.length === 0) return result;
    const multiplier = 2 / (period + 1);

    // Initial SMA
    let initialSMA = 0;
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += candles[j].close;
        }
        initialSMA = sum / period;
        result.push(initialSMA);
        continue;
      }

      const prevEMA = result[i - 1]!;
      const currentEMA = (candles[i].close - prevEMA) * multiplier + prevEMA;
      result.push(currentEMA);
    }
    return result;
  }

  /**
   * Relative Strength Index (RSI) with Wilder smoothing
   */
  static calculateRSI(candles: Candle[] = [], period = 14): (number | null)[] {
    const result: (number | null)[] = [];
    if (!candles || candles.length <= period) {
      return candles ? candles.map(() => null) : [];
    }

    let gains = 0;
    let losses = 0;

    // First period
    for (let i = 1; i <= period; i++) {
      const change = candles[i].close - candles[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = 0; i < candles.length; i++) {
      if (i < period) {
        result.push(null);
        continue;
      }

      if (i > period) {
        const change = candles[i].close - candles[i - 1].close;
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? Math.abs(change) : 0;

        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
      }

      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
    return result;
  }

  /**
   * Bollinger Bands
   */
  static calculateBollingerBands(candles: Candle[] = [], period = 20, stdDevMultiplier = 2) {
    const upper: (number | null)[] = [];
    const middle: (number | null)[] = [];
    const lower: (number | null)[] = [];
    if (!candles || candles.length === 0) return { upper, middle, lower };

    const sma = this.calculateSMA(candles, period);

    for (let i = 0; i < candles.length; i++) {
      if (sma[i] === null) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
        continue;
      }

      const mean = sma[i]!;
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(candles[i - j].close - mean, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);

      middle.push(mean);
      upper.push(mean + stdDevMultiplier * stdDev);
      lower.push(mean - stdDevMultiplier * stdDev);
    }

    return { upper, middle, lower };
  }

  /**
   * MACD (Moving Average Convergence Divergence)
   */
  static calculateMACD(candles: Candle[] = [], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    if (!candles || candles.length === 0) {
      return { macdLine: [], signalLine: [], histogram: [] };
    }
    const fastEMA = this.calculateEMA(candles, fastPeriod);
    const slowEMA = this.calculateEMA(candles, slowPeriod);
    const macdLine: (number | null)[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (fastEMA[i] === null || slowEMA[i] === null) {
        macdLine.push(null);
      } else {
        macdLine.push(fastEMA[i]! - slowEMA[i]!);
      }
    }

    // Signal Line is EMA of MACD Line
    // Extract non-null slice for EMA calculation
    const validStartIndex = macdLine.findIndex((val) => val !== null);
    const signalLine: (number | null)[] = candles.map(() => null);
    const histogram: (number | null)[] = candles.map(() => null);

    if (validStartIndex !== -1) {
      const validMacd = macdLine.slice(validStartIndex) as number[];
      const multiplier = 2 / (signalPeriod + 1);

      let initialSum = 0;
      if (validMacd.length >= signalPeriod) {
        for (let j = 0; j < signalPeriod; j++) {
          initialSum += validMacd[j];
        }
        let currentSignal = initialSum / signalPeriod;
        signalLine[validStartIndex + signalPeriod - 1] = currentSignal;
        histogram[validStartIndex + signalPeriod - 1] = validMacd[signalPeriod - 1] - currentSignal;

        for (let k = signalPeriod; k < validMacd.length; k++) {
          currentSignal = (validMacd[k] - currentSignal) * multiplier + currentSignal;
          const fullIndex = validStartIndex + k;
          signalLine[fullIndex] = currentSignal;
          histogram[fullIndex] = validMacd[k] - currentSignal;
        }
      }
    }

    return { macdLine, signalLine, histogram };
  }

  /**
   * Average True Range (ATR)
   */
  static calculateATR(candles: Candle[] = [], period = 14): (number | null)[] {
    const atr: (number | null)[] = [];
    if (!candles || candles.length === 0) return atr;

    const trueRanges: number[] = [candles[0].high - candles[0].low];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }

    let initialATR = 0;
    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        atr.push(null);
        continue;
      }
      if (i === period - 1) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += trueRanges[j];
        initialATR = sum / period;
        atr.push(initialATR);
        continue;
      }
      const prevATR = atr[i - 1]!;
      const currentATR = (prevATR * (period - 1) + trueRanges[i]) / period;
      atr.push(currentATR);
    }

    return atr;
  }

  /**
   * SuperTrend Indicator
   */
  static calculateSuperTrend(candles: Candle[] = [], period = 10, multiplier = 3) {
    if (!candles || candles.length === 0) {
      return { supertrend: [], trend: [] };
    }
    const atr = this.calculateATR(candles, period);
    const supertrend: (number | null)[] = [];
    const trend: (1 | -1 | null)[] = []; // 1 = Bullish (Green), -1 = Bearish (Red)

    let prevUpperBand = 0;
    let prevLowerBand = 0;
    let prevTrend = 1;

    for (let i = 0; i < candles.length; i++) {
      if (atr[i] === null) {
        supertrend.push(null);
        trend.push(null);
        continue;
      }

      const hl2 = (candles[i].high + candles[i].low) / 2;
      const basicUpperBand = hl2 + multiplier * atr[i]!;
      const basicLowerBand = hl2 - multiplier * atr[i]!;

      let finalUpperBand = basicUpperBand;
      let finalLowerBand = basicLowerBand;

      if (i > 0 && supertrend[i - 1] !== null) {
        if (basicUpperBand < prevUpperBand || candles[i - 1].close > prevUpperBand) {
          finalUpperBand = basicUpperBand;
        } else {
          finalUpperBand = prevUpperBand;
        }

        if (basicLowerBand > prevLowerBand || candles[i - 1].close < prevLowerBand) {
          finalLowerBand = basicLowerBand;
        } else {
          finalLowerBand = prevLowerBand;
        }
      }

      let currentTrend = prevTrend;
      if (currentTrend === 1 && candles[i].close < finalLowerBand) {
        currentTrend = -1;
      } else if (currentTrend === -1 && candles[i].close > finalUpperBand) {
        currentTrend = 1;
      }

      prevUpperBand = finalUpperBand;
      prevLowerBand = finalLowerBand;
      prevTrend = currentTrend;

      supertrend.push(currentTrend === 1 ? finalLowerBand : finalUpperBand);
      trend.push(currentTrend as 1 | -1);
    }

    return { supertrend, trend };
  }

  /**
   * Volume Weighted Average Price (VWAP)
   */
  static calculateVWAP(candles: Candle[] = []): (number | null)[] {
    const vwap: (number | null)[] = [];
    if (!candles || candles.length === 0) return vwap;
    let cumulativeTypicalVolume = 0;
    let cumulativeVolume = 0;

    for (let i = 0; i < candles.length; i++) {
      const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
      cumulativeTypicalVolume += typicalPrice * candles[i].volume;
      cumulativeVolume += candles[i].volume;

      if (cumulativeVolume === 0) {
        vwap.push(candles[i].close);
      } else {
        vwap.push(cumulativeTypicalVolume / cumulativeVolume);
      }
    }
    return vwap;
  }

  /**
   * Stochastic Oscillator (%K, %D)
   */
  static calculateStochastic(candles: Candle[] = [], kPeriod = 14, dPeriod = 3, smooth = 3) {
    if (!candles || candles.length === 0) {
      return { k: [], d: [] };
    }
    const rawK: (number | null)[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (i < kPeriod - 1) {
        rawK.push(null);
        continue;
      }
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      for (let j = 0; j < kPeriod; j++) {
        const c = candles[i - j];
        if (c.high > highestHigh) highestHigh = c.high;
        if (c.low < lowestLow) lowestLow = c.low;
      }
      const range = highestHigh - lowestLow;
      if (range === 0) {
        rawK.push(50);
      } else {
        rawK.push(((candles[i].close - lowestLow) / range) * 100);
      }
    }

    // Smooth %K
    const smoothedK: (number | null)[] = [];
    for (let i = 0; i < rawK.length; i++) {
      if (i < kPeriod - 1 + smooth - 1) {
        smoothedK.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < smooth; j++) {
        sum += rawK[i - j]!;
      }
      smoothedK.push(sum / smooth);
    }

    // Calculate %D (SMA of smoothed %K)
    const dLine: (number | null)[] = [];
    for (let i = 0; i < smoothedK.length; i++) {
      if (i < kPeriod - 1 + smooth - 1 + dPeriod - 1) {
        dLine.push(null);
        continue;
      }
      let sum = 0;
      for (let j = 0; j < dPeriod; j++) {
        sum += smoothedK[i - j]!;
      }
      dLine.push(sum / dPeriod);
    }

    return { k: smoothedK, d: dLine };
  }

  /**
   * AUTOMATIC SUPPORT & RESISTANCE ZONE DETECTION ALGORITHM
   * 1. Detect swing highs & lows using fractal pivot window (e.g. 5 bars)
   * 2. Group pivots within cluster tolerance percentage (e.g. 0.8%)
   * 3. Score zones based on touch counts + local volume weight
   * 4. Return top ranked support and resistance levels with proximity calculation
   */
  static findSupportResistanceZones(
    candles: Candle[] = [],
    pivotWindow = 5,
    clusterTolerancePct = 0.8,
    maxLevels = 5
  ): SupportResistanceZone[] {
    if (!candles || candles.length < pivotWindow * 2 + 1) return [];

    const currentPrice = candles[candles.length - 1].close;
    interface PivotPointInternal {
      price: number;
      type: 'HIGH' | 'LOW';
      index: number;
      volume: number;
    }

    const pivots: PivotPointInternal[] = [];

    for (let i = pivotWindow; i < candles.length - pivotWindow; i++) {
      const candidate = candles[i];
      let isHigh = true;
      let isLow = true;

      for (let j = i - pivotWindow; j <= i + pivotWindow; j++) {
        if (j === i) continue;
        if (candles[j].high >= candidate.high) isHigh = false;
        if (candles[j].low <= candidate.low) isLow = false;
      }

      if (isHigh) {
        pivots.push({
          price: candidate.high,
          type: 'HIGH',
          index: i,
          volume: candidate.volume,
        });
      }
      if (isLow) {
        pivots.push({
          price: candidate.low,
          type: 'LOW',
          index: i,
          volume: candidate.volume,
        });
      }
    }

    // Cluster pivot points into zones
    interface Cluster {
      prices: number[];
      volumes: number[];
      types: ('HIGH' | 'LOW')[];
      count: number;
    }

    const clusters: Cluster[] = [];

    for (const pivot of pivots) {
      let matchedCluster: Cluster | null = null;
      for (const cluster of clusters) {
        const clusterAvg = cluster.prices.reduce((a, b) => a + b, 0) / cluster.prices.length;
        const diffPct = Math.abs(pivot.price - clusterAvg) / clusterAvg * 100;
        if (diffPct <= clusterTolerancePct) {
          matchedCluster = cluster;
          break;
        }
      }

      if (matchedCluster) {
        matchedCluster.prices.push(pivot.price);
        matchedCluster.volumes.push(pivot.volume);
        matchedCluster.types.push(pivot.type);
        matchedCluster.count++;
      } else {
        clusters.push({
          prices: [pivot.price],
          volumes: [pivot.volume],
          types: [pivot.type],
          count: 1,
        });
      }
    }

    // Filter clusters with at least 2 touches or high volume significance
    const rawZones = clusters
      .filter((c) => c.count >= 2)
      .map((c, idx) => {
        const avgPrice = c.prices.reduce((a, b) => a + b, 0) / c.prices.length;
        const minPrice = Math.min(...c.prices);
        const maxPrice = Math.max(...c.prices);
        const totalVolume = c.volumes.reduce((a, b) => a + b, 0);

        const type: 'SUPPORT' | 'RESISTANCE' = avgPrice < currentPrice ? 'SUPPORT' : 'RESISTANCE';
        const distancePct = Math.abs(avgPrice - currentPrice) / currentPrice * 100;

        // Strength score calculation: touches (max 50) + volume weight (max 50)
        const touchScore = Math.min(50, c.count * 12);
        const volumeScore = Math.min(50, (totalVolume / (candles.reduce((a, c) => a + c.volume, 0) / candles.length)) * 10);
        const strengthScore = Math.round(Math.min(100, Math.max(25, touchScore + volumeScore)));

        return {
          id: `zone-${idx}-${Math.round(avgPrice)}`,
          price: avgPrice,
          type,
          touches: c.count,
          strengthScore,
          volumeWeight: totalVolume,
          highRange: maxPrice,
          lowRange: minPrice,
          distancePct,
          isNear: distancePct <= 0.5,
        } as SupportResistanceZone;
      });

    // Separate supports and resistances and take top N by strength and proximity
    const supports = rawZones
      .filter((z) => z.type === 'SUPPORT')
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, maxLevels)
      .sort((a, b) => b.price - a.price);

    const resistances = rawZones
      .filter((z) => z.type === 'RESISTANCE')
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, maxLevels)
      .sort((a, b) => a.price - b.price);

    return [...resistances, ...supports];
  }

  /**
   * Weighted Moving Average (WMA) helper
   */
  static calculateWMA(values: (number | null)[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    if (!values || values.length === 0) return result;
    const denominator = (period * (period + 1)) / 2;

    for (let i = 0; i < values.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let sum = 0;
      let valid = true;
      for (let j = 0; j < period; j++) {
        const val = values[i - j];
        if (val === null || val === undefined) {
          valid = false;
          break;
        }
        sum += val * (period - j);
      }
      result.push(valid ? sum / denominator : null);
    }
    return result;
  }

  /**
   * Hull Moving Average (HMA)
   * Formula: WMA(2*WMA(n/2) - WMA(n)), sqrt(n)
   */
  static calculateHMA(candles: Candle[] = [], period = 16): (number | null)[] {
    if (!candles || candles.length === 0) return [];
    const closePrices = candles.map((c) => c.close);
    const halfPeriod = Math.floor(period / 2);
    const sqrtPeriod = Math.round(Math.sqrt(period));

    const halfWMA = this.calculateWMA(closePrices, halfPeriod);
    const fullWMA = this.calculateWMA(closePrices, period);

    const diff: (number | null)[] = [];
    for (let i = 0; i < candles.length; i++) {
      if (halfWMA[i] === null || fullWMA[i] === null) {
        diff.push(null);
      } else {
        diff.push(2 * halfWMA[i]! - fullWMA[i]!);
      }
    }

    return this.calculateWMA(diff, sqrtPeriod);
  }

  /**
   * Ichimoku Cloud (Tenkan, Kijun, Senkou Span A, Senkou Span B, Chikou Span)
   */
  static calculateIchimoku(candles: Candle[] = [], conversionPeriod = 9, basePeriod = 26, spanBPeriod = 52) {
    if (!candles || candles.length === 0) {
      return {
        tenkanSen: [],
        kijunSen: [],
        senkouSpanA: [],
        senkouSpanB: [],
        chikouSpan: [],
      };
    }

    const hl2Range = (startIdx: number, p: number) => {
      let h = -Infinity;
      let l = Infinity;
      for (let j = 0; j < p; j++) {
        const c = candles[startIdx - j];
        if (c.high > h) h = c.high;
        if (c.low < l) l = c.low;
      }
      return (h + l) / 2;
    };

    const tenkanSen: (number | null)[] = [];
    const kijunSen: (number | null)[] = [];
    const senkouSpanA: (number | null)[] = [];
    const senkouSpanB: (number | null)[] = [];
    const chikouSpan: (number | null)[] = candles.map((c) => c.close);

    for (let i = 0; i < candles.length; i++) {
      // Tenkan-sen
      if (i >= conversionPeriod - 1) {
        tenkanSen.push(hl2Range(i, conversionPeriod));
      } else {
        tenkanSen.push(null);
      }

      // Kijun-sen
      if (i >= basePeriod - 1) {
        kijunSen.push(hl2Range(i, basePeriod));
      } else {
        kijunSen.push(null);
      }

      // Senkou Span A (midpoint of Tenkan & Kijun)
      const tenkan = tenkanSen[i];
      const kijun = kijunSen[i];
      if (tenkan !== null && kijun !== null) {
        senkouSpanA.push((tenkan + kijun) / 2);
      } else {
        senkouSpanA.push(null);
      }

      // Senkou Span B
      if (i >= spanBPeriod - 1) {
        senkouSpanB.push(hl2Range(i, spanBPeriod));
      } else {
        senkouSpanB.push(null);
      }
    }

    return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
  }

  /**
   * Parabolic SAR (Stop and Reverse)
   */
  static calculateParabolicSAR(candles: Candle[] = [], step = 0.02, maxStep = 0.2): (number | null)[] {
    const sar: (number | null)[] = [];
    if (!candles || candles.length < 2) return candles ? candles.map(() => null) : [];

    let isBull = candles[1].close >= candles[0].close;
    let af = step;
    let ep = isBull ? candles[0].high : candles[0].low;
    let currSar = isBull ? candles[0].low : candles[0].high;

    sar.push(null);
    sar.push(currSar);

    for (let i = 2; i < candles.length; i++) {
      const prevCandle = candles[i - 1];
      const prev2Candle = candles[i - 2];
      let nextSar = currSar + af * (ep - currSar);

      if (isBull) {
        // In bull trend, SAR cannot be higher than low of last 2 periods
        nextSar = Math.min(nextSar, prevCandle.low, prev2Candle.low);
        if (candles[i].low < nextSar) {
          // Reversal to bear
          isBull = false;
          currSar = ep;
          ep = candles[i].low;
          af = step;
        } else {
          currSar = nextSar;
          if (candles[i].high > ep) {
            ep = candles[i].high;
            af = Math.min(af + step, maxStep);
          }
        }
      } else {
        // In bear trend, SAR cannot be lower than high of last 2 periods
        nextSar = Math.max(nextSar, prevCandle.high, prev2Candle.high);
        if (candles[i].high > nextSar) {
          // Reversal to bull
          isBull = true;
          currSar = ep;
          ep = candles[i].high;
          af = step;
        } else {
          currSar = nextSar;
          if (candles[i].low < ep) {
            ep = candles[i].low;
            af = Math.min(af + step, maxStep);
          }
        }
      }

      sar.push(currSar);
    }

    return sar;
  }

  /**
   * Commodity Channel Index (CCI)
   */
  static calculateCCI(candles: Candle[] = [], period = 20): (number | null)[] {
    const cci: (number | null)[] = [];
    if (!candles || candles.length === 0) return cci;

    const tpList = candles.map((c) => (c.high + c.low + c.close) / 3);

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        cci.push(null);
        continue;
      }

      let sumTP = 0;
      for (let j = 0; j < period; j++) sumTP += tpList[i - j];
      const smaTP = sumTP / period;

      let sumDev = 0;
      for (let j = 0; j < period; j++) {
        sumDev += Math.abs(tpList[i - j] - smaTP);
      }
      const meanDev = sumDev / period;

      if (meanDev === 0) {
        cci.push(0);
      } else {
        const val = (tpList[i] - smaTP) / (0.015 * meanDev);
        cci.push(val);
      }
    }

    return cci;
  }

  /**
   * Average Directional Index (ADX) & Directional Movement (+DI, -DI)
   */
  static calculateADX(candles: Candle[] = [], period = 14) {
    if (!candles || candles.length < period * 2) {
      return { adx: candles ? candles.map(() => null) : [], plusDI: [], minusDI: [] };
    }

    const tr: number[] = [];
    const plusDM: number[] = [];
    const minusDM: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevHigh = candles[i - 1].high;
      const prevLow = candles[i - 1].low;
      const prevClose = candles[i - 1].close;

      const trueRange = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      tr.push(trueRange);

      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      if (upMove > downMove && upMove > 0) {
        plusDM.push(upMove);
      } else {
        plusDM.push(0);
      }

      if (downMove > upMove && downMove > 0) {
        minusDM.push(downMove);
      } else {
        minusDM.push(0);
      }
    }

    // Wilder Smoothing for TR, +DM, -DM
    let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
    let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

    const plusDI: (number | null)[] = [null];
    const minusDI: (number | null)[] = [null];
    const dxList: number[] = [];

    for (let i = 0; i < period - 1; i++) {
      plusDI.push(null);
      minusDI.push(null);
    }

    for (let i = period; i <= tr.length; i++) {
      if (i > period) {
        smoothTR = smoothTR - (smoothTR / period) + tr[i - 1];
        smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDM[i - 1];
        smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDM[i - 1];
      }

      const pDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
      const mDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
      plusDI.push(pDI);
      minusDI.push(mDI);

      const diSum = pDI + mDI;
      const dx = diSum > 0 ? (Math.abs(pDI - mDI) / diSum) * 100 : 0;
      dxList.push(dx);
    }

    // ADX is SMA / Wilder of DX
    const adx: (number | null)[] = candles.map(() => null);
    if (dxList.length >= period) {
      let adxVal = dxList.slice(0, period).reduce((a, b) => a + b, 0) / period;
      adx[period * 2 - 1] = adxVal;

      for (let k = period; k < dxList.length; k++) {
        adxVal = (adxVal * (period - 1) + dxList[k]) / period;
        const targetIdx = period + k;
        if (targetIdx < adx.length) {
          adx[targetIdx] = adxVal;
        }
      }
    }

    return { adx, plusDI, minusDI };
  }

  /**
   * Williams %R
   */
  static calculateWilliamsR(candles: Candle[] = [], period = 14): (number | null)[] {
    const result: (number | null)[] = [];
    if (!candles || candles.length === 0) return result;

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.push(null);
        continue;
      }
      let highestHigh = -Infinity;
      let lowestLow = Infinity;
      for (let j = 0; j < period; j++) {
        const c = candles[i - j];
        if (c.high > highestHigh) highestHigh = c.high;
        if (c.low < lowestLow) lowestLow = c.low;
      }
      const range = highestHigh - lowestLow;
      if (range === 0) {
        result.push(-50);
      } else {
        const wr = ((highestHigh - candles[i].close) / range) * -100;
        result.push(wr);
      }
    }
    return result;
  }

  /**
   * Keltner Channels (EMA Middle + ATR multiplier Bands)
   */
  static calculateKeltnerChannels(candles: Candle[] = [], emaPeriod = 20, atrPeriod = 10, multiplier = 2) {
    const upper: (number | null)[] = [];
    const middle: (number | null)[] = [];
    const lower: (number | null)[] = [];
    if (!candles || candles.length === 0) return { upper, middle, lower };

    const ema = this.calculateEMA(candles, emaPeriod);
    const atr = this.calculateATR(candles, atrPeriod);

    for (let i = 0; i < candles.length; i++) {
      if (ema[i] === null || atr[i] === null) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
      } else {
        const mid = ema[i]!;
        const offset = atr[i]! * multiplier;
        middle.push(mid);
        upper.push(mid + offset);
        lower.push(mid - offset);
      }
    }

    return { upper, middle, lower };
  }

  /**
   * Donchian Channels (20-period Highest High & Lowest Low)
   */
  static calculateDonchianChannels(candles: Candle[] = [], period = 20) {
    const upper: (number | null)[] = [];
    const middle: (number | null)[] = [];
    const lower: (number | null)[] = [];
    if (!candles || candles.length === 0) return { upper, middle, lower };

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        middle.push(null);
        lower.push(null);
        continue;
      }

      let maxH = -Infinity;
      let minL = Infinity;
      for (let j = 0; j < period; j++) {
        const c = candles[i - j];
        if (c.high > maxH) maxH = c.high;
        if (c.low < minL) minL = c.low;
      }

      upper.push(maxH);
      lower.push(minL);
      middle.push((maxH + minL) / 2);
    }

    return { upper, middle, lower };
  }

  /**
   * On-Balance Volume (OBV)
   */
  static calculateOBV(candles: Candle[] = []): (number | null)[] {
    const obv: (number | null)[] = [];
    if (!candles || candles.length === 0) return obv;

    let currentOBV = 0;
    obv.push(0);

    for (let i = 1; i < candles.length; i++) {
      if (candles[i].close > candles[i - 1].close) {
        currentOBV += candles[i].volume;
      } else if (candles[i].close < candles[i - 1].close) {
        currentOBV -= candles[i].volume;
      }
      obv.push(currentOBV);
    }

    return obv;
  }

  /**
   * Money Flow Index (MFI)
   */
  static calculateMFI(candles: Candle[] = [], period = 14): (number | null)[] {
    const mfi: (number | null)[] = [];
    if (!candles || candles.length === 0) return mfi;

    const typicalPrices = candles.map((c) => (c.high + c.low + c.close) / 3);
    const rawMoneyFlow = candles.map((c, i) => typicalPrices[i] * c.volume);

    for (let i = 0; i < candles.length; i++) {
      if (i < period) {
        mfi.push(null);
        continue;
      }

      let positiveMF = 0;
      let negativeMF = 0;

      for (let j = 0; j < period; j++) {
        const idx = i - j;
        if (idx <= 0) continue;
        if (typicalPrices[idx] > typicalPrices[idx - 1]) {
          positiveMF += rawMoneyFlow[idx];
        } else if (typicalPrices[idx] < typicalPrices[idx - 1]) {
          negativeMF += rawMoneyFlow[idx];
        }
      }

      if (negativeMF === 0) {
        mfi.push(100);
      } else {
        const moneyRatio = positiveMF / negativeMF;
        const val = 100 - (100 / (1 + moneyRatio));
        mfi.push(val);
      }
    }

    return mfi;
  }

  /**
   * Calculate Classic and Fibonacci Daily Pivot Points
   */
  static calculatePivotPoints(candles: Candle[] = []): PivotPoints {
    if (!candles || candles.length === 0) {
      return { pivot: 0, r1: 0, r2: 0, r3: 0, s1: 0, s2: 0, s3: 0, type: 'CLASSIC' };
    }
    // Aggregate past day/recent window
    const recent = candles.slice(-24);
    let high = -Infinity;
    let low = Infinity;
    for (const c of recent) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
    }
    const close = recent[recent.length - 1].close;

    const pivot = (high + low + close) / 3;
    const diff = high - low;

    // Fibonacci Pivots
    return {
      pivot,
      r1: pivot + 0.382 * diff,
      r2: pivot + 0.618 * diff,
      r3: pivot + 1.0 * diff,
      s1: pivot - 0.382 * diff,
      s2: pivot - 0.618 * diff,
      s3: pivot - 1.0 * diff,
      type: 'FIBONACCI',
    };
  }
}
