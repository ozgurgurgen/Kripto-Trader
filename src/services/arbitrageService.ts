import { 
  ArbitrageOpportunity, 
  ExchangePriceQuote, 
  ArbitrageBotConfig, 
  ArbitrageExecutionTrade, 
  MarketMakingQuoteLevel 
} from '../types/crypto';

export class ArbitrageService {
  private static defaultBotConfig: ArbitrageBotConfig = {
    enabled: false,
    minProfitThresholdPct: 0.15,
    orderSizeUsd: 5000,
    maxSlippageTolerancePct: 0.05,
    executionIntervalSec: 3,
    maxDailyExecutions: 50,
    autoHedge: true,
    simulatedLatencyMs: 24,
    targetExchanges: ['Binance', 'Coinbase', 'Bybit', 'OKX', 'Kraken', 'Bitfinex', 'KuCoin'],
    marketMakingMode: 'CROSS_EXCHANGE_ARB',
  };

  private static currentBotConfig: ArbitrageBotConfig = { ...ArbitrageService.defaultBotConfig };
  private static executionHistory: ArbitrageExecutionTrade[] = [];
  private static listeners: Array<() => void> = [];

  // Exchange Specific Fee Profile (Taker Fee %)
  private static EXCHANGE_FEES: Record<string, { maker: number; taker: number; latency: number }> = {
    Binance: { maker: 0.02, taker: 0.075, latency: 16 },
    Coinbase: { maker: 0.15, taker: 0.25, latency: 32 },
    Bybit: { maker: 0.01, taker: 0.06, latency: 22 },
    OKX: { maker: 0.02, taker: 0.08, latency: 25 },
    Kraken: { maker: 0.10, taker: 0.16, latency: 38 },
    Bitfinex: { maker: 0.05, taker: 0.15, latency: 45 },
    KuCoin: { maker: 0.02, taker: 0.08, latency: 28 },
  };

  /**
   * Get Current Bot Config
   */
  static getBotConfig(): ArbitrageBotConfig {
    return { ...this.currentBotConfig };
  }

  /**
   * Update Bot Config
   */
  static updateBotConfig(partial: Partial<ArbitrageBotConfig>): ArbitrageBotConfig {
    this.currentBotConfig = { ...this.currentBotConfig, ...partial };
    this.notifyListeners();
    return { ...this.currentBotConfig };
  }

  /**
   * Subscribe to state updates
   */
  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach((l) => l());
  }

  /**
   * Get Execution Trade History
   */
  static getExecutionHistory(): ArbitrageExecutionTrade[] {
    if (this.executionHistory.length === 0) {
      // Seed realistic historical arbitrage executions
      const now = Date.now();
      this.executionHistory = [
        {
          id: `arb-exec-101`,
          timestamp: now - 180000,
          symbol: 'BTCUSDT',
          type: 'SPATIAL',
          buyExchange: 'Bybit',
          buyPrice: 89450.20,
          sellExchange: 'Coinbase',
          sellPrice: 89745.50,
          volumeUsd: 5000,
          size: 0.0558,
          grossProfitUsd: 16.48,
          feesPaidUsd: 7.75,
          netProfitUsd: 8.73,
          netProfitPct: 0.174,
          executionLatencyMs: 28,
          status: 'COMPLETED',
        },
        {
          id: `arb-exec-102`,
          timestamp: now - 520000,
          symbol: 'BTCUSDT',
          type: 'SPATIAL',
          buyExchange: 'OKX',
          buyPrice: 89380.00,
          sellExchange: 'Kraken',
          sellPrice: 89680.10,
          volumeUsd: 5000,
          size: 0.0559,
          grossProfitUsd: 16.78,
          feesPaidUsd: 8.00,
          netProfitUsd: 8.78,
          netProfitPct: 0.175,
          executionLatencyMs: 34,
          status: 'COMPLETED',
        },
        {
          id: `arb-exec-103`,
          timestamp: now - 980000,
          symbol: 'BTC / ETH / USDT',
          type: 'TRIANGULAR',
          buyExchange: 'Binance Unified',
          buyPrice: 89200.00,
          sellExchange: 'Binance Unified',
          sellPrice: 89510.00,
          volumeUsd: 5000,
          size: 0.0560,
          grossProfitUsd: 17.35,
          feesPaidUsd: 6.25,
          netProfitUsd: 11.10,
          netProfitPct: 0.222,
          executionLatencyMs: 19,
          status: 'COMPLETED',
        },
      ];
    }
    return [...this.executionHistory];
  }

  /**
   * Multi-Exchange Live Price Aggregator
   */
  static getExchangeQuotes(symbol: string, basePrice: number): ExchangePriceQuote[] {
    if (!basePrice || basePrice <= 0) basePrice = 90000;

    // Add slight deterministic pseudo-random variance for live simulation
    const seed = (Date.now() / 3000) % 100;
    const wave = Math.sin(seed);

    const exchanges = [
      {
        name: 'Binance',
        priceOffsetPct: 0.0000 + wave * 0.0003,
        spreadBp: 0.015,
        volume: 1850000000,
        bidDepth: 4500000,
        askDepth: 5200000,
      },
      {
        name: 'Coinbase',
        priceOffsetPct: 0.0022 + wave * 0.0005,
        spreadBp: 0.035,
        volume: 890000000,
        bidDepth: 2800000,
        askDepth: 2950000,
      },
      {
        name: 'Bybit',
        priceOffsetPct: -0.0012 + wave * 0.0004,
        spreadBp: 0.018,
        volume: 1120000000,
        bidDepth: 3900000,
        askDepth: 4100000,
      },
      {
        name: 'OKX',
        priceOffsetPct: -0.0006 + wave * 0.0003,
        spreadBp: 0.020,
        volume: 980000000,
        bidDepth: 3400000,
        askDepth: 3600000,
      },
      {
        name: 'Kraken',
        priceOffsetPct: 0.0016 + wave * 0.0006,
        spreadBp: 0.030,
        volume: 480000000,
        bidDepth: 1900000,
        askDepth: 2100000,
      },
      {
        name: 'Bitfinex',
        priceOffsetPct: 0.0019 + wave * 0.0004,
        spreadBp: 0.028,
        volume: 320000000,
        bidDepth: 1400000,
        askDepth: 1650000,
      },
      {
        name: 'KuCoin',
        priceOffsetPct: -0.0009 + wave * 0.0005,
        spreadBp: 0.022,
        volume: 410000000,
        bidDepth: 1800000,
        askDepth: 1950000,
      },
    ];

    return exchanges.map((ex) => {
      const mid = basePrice * (1 + ex.priceOffsetPct);
      const halfSpread = mid * (ex.spreadBp / 100);
      const bid = mid - halfSpread;
      const ask = mid + halfSpread;
      const spreadPct = ((ask - bid) / mid) * 100;
      const feeInfo = this.EXCHANGE_FEES[ex.name] || { maker: 0.02, taker: 0.08, latency: 25 };

      return {
        exchangeName: ex.name,
        symbol,
        bidPrice: bid,
        askPrice: ask,
        lastPrice: mid,
        spreadPct,
        volume24hUsd: ex.volume,
        depthBidUsd: ex.bidDepth,
        depthAskUsd: ex.askDepth,
        latencyMs: Math.round(feeInfo.latency + (Math.sin(seed * 2) * 4)),
        isLive: true,
      };
    });
  }

  /**
   * Scan Spatial Arbitrage Opportunities across Exchanges
   */
  static scanSpatialArbitrage(
    symbol: string, 
    currentPrice: number, 
    filterExchanges?: string[],
    customSizeUsd: number = 5000
  ): ArbitrageOpportunity[] {
    const allQuotes = this.getExchangeQuotes(symbol, currentPrice);
    const quotes = filterExchanges && filterExchanges.length > 0
      ? allQuotes.filter((q) => filterExchanges.includes(q.exchangeName))
      : allQuotes;

    const opportunities: ArbitrageOpportunity[] = [];

    // Compare all directional pairs: Buy on A, Sell on B
    for (let i = 0; i < quotes.length; i++) {
      for (let j = 0; j < quotes.length; j++) {
        if (i === j) continue;
        const buyQuote = quotes[i];
        const sellQuote = quotes[j];

        const buyPrice = buyQuote.askPrice; // What we pay to buy on exchange A
        const sellPrice = sellQuote.bidPrice; // What we receive to sell on exchange B

        if (sellPrice > buyPrice) {
          const grossSpreadPct = ((sellPrice - buyPrice) / buyPrice) * 100;
          
          const buyFeeRate = (this.EXCHANGE_FEES[buyQuote.exchangeName]?.taker || 0.075) / 100;
          const sellFeeRate = (this.EXCHANGE_FEES[sellQuote.exchangeName]?.taker || 0.075) / 100;
          const slippageBufferRate = 0.0003; // 0.03% estimated slippage buffer

          const totalFeePct = (buyFeeRate + sellFeeRate + slippageBufferRate) * 100;
          const netProfitPct = grossSpreadPct - totalFeePct;

          if (netProfitPct > 0.02) {
            const maxExecSizeUsd = Math.min(buyQuote.depthAskUsd, sellQuote.depthBidUsd, 25000);
            const execSize = Math.min(customSizeUsd, maxExecSizeUsd);
            const estimatedProfitUsd = execSize * (netProfitPct / 100);

            // Confidence score based on depth and latency
            const avgLatency = (buyQuote.latencyMs + sellQuote.latencyMs) / 2;
            const latencyScore = Math.max(0, 100 - avgLatency);
            const depthScore = Math.min(100, (maxExecSizeUsd / 10000) * 80);
            const confidenceScore = Math.round((latencyScore * 0.4) + (depthScore * 0.6));

            opportunities.push({
              id: `spatial-${buyQuote.exchangeName}-${sellQuote.exchangeName}`,
              symbol,
              buyExchange: buyQuote.exchangeName,
              buyPrice,
              sellExchange: sellQuote.exchangeName,
              sellPrice,
              grossSpreadPct,
              estimatedFeePct: totalFeePct,
              netProfitPct,
              estimatedProfitUsd,
              maxExecSizeUsd,
              timestamp: Date.now(),
              type: 'SPATIAL',
              confidenceScore,
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.netProfitPct - a.netProfitPct);
  }

  /**
   * Scan Triangular Arbitrage Loops (3-Leg Matrix)
   */
  static scanTriangularArbitrage(btcPrice: number, customSizeUsd: number = 5000): ArbitrageOpportunity[] {
    const now = Date.now();
    const wave = Math.sin(now / 4000);
    const gross1 = 0.44 + wave * 0.08;
    const gross2 = 0.38 + Math.cos(now / 3500) * 0.06;
    const gross3 = 0.34 + Math.sin(now / 2800) * 0.05;

    const feeRate = 0.225; // 3 legs of 0.075% taker fee

    const opps: ArbitrageOpportunity[] = [
      {
        id: `tri-btc-eth-usdt`,
        symbol: 'BTC / ETH / USDT',
        buyExchange: 'Binance Matrix',
        buyPrice: btcPrice,
        sellExchange: 'Binance Matrix',
        sellPrice: btcPrice * (1 + gross1 / 100),
        grossSpreadPct: gross1,
        estimatedFeePct: feeRate,
        netProfitPct: Math.max(0.01, gross1 - feeRate),
        estimatedProfitUsd: customSizeUsd * (Math.max(0.01, gross1 - feeRate) / 100),
        maxExecSizeUsd: 15000,
        timestamp: now,
        type: 'TRIANGULAR',
        path: ['1. USDT ➔ BTC (Alış)', '2. BTC ➔ ETH (Çapraz Takas)', '3. ETH ➔ USDT (Satış)'],
        confidenceScore: 92,
      },
      {
        id: `tri-sol-btc-usdt`,
        symbol: 'SOL / BTC / USDT',
        buyExchange: 'Bybit Matrix',
        buyPrice: btcPrice,
        sellExchange: 'Bybit Matrix',
        sellPrice: btcPrice * (1 + gross2 / 100),
        grossSpreadPct: gross2,
        estimatedFeePct: feeRate,
        netProfitPct: Math.max(0.01, gross2 - feeRate),
        estimatedProfitUsd: customSizeUsd * (Math.max(0.01, gross2 - feeRate) / 100),
        maxExecSizeUsd: 12000,
        timestamp: now,
        type: 'TRIANGULAR',
        path: ['1. USDT ➔ SOL (Alış)', '2. SOL ➔ BTC (Çapraz Takas)', '3. BTC ➔ USDT (Satış)'],
        confidenceScore: 88,
      },
      {
        id: `tri-xrp-btc-usdt`,
        symbol: 'XRP / BTC / USDT',
        buyExchange: 'OKX Matrix',
        buyPrice: btcPrice,
        sellExchange: 'OKX Matrix',
        sellPrice: btcPrice * (1 + gross3 / 100),
        grossSpreadPct: gross3,
        estimatedFeePct: feeRate,
        netProfitPct: Math.max(0.01, gross3 - feeRate),
        estimatedProfitUsd: customSizeUsd * (Math.max(0.01, gross3 - feeRate) / 100),
        maxExecSizeUsd: 10000,
        timestamp: now,
        type: 'TRIANGULAR',
        path: ['1. USDT ➔ XRP (Alış)', '2. XRP ➔ BTC (Çapraz Takas)', '3. BTC ➔ USDT (Satış)'],
        confidenceScore: 85,
      },
    ];

    return opps.sort((a, b) => b.netProfitPct - a.netProfitPct);
  }

  /**
   * Market Making Cross-Exchange Bid/Ask Quote Ladder
   */
  static getMarketMakingLadder(symbol: string, currentPrice: number): MarketMakingQuoteLevel[] {
    const quotes = this.getExchangeQuotes(symbol, currentPrice);
    if (quotes.length === 0) return [];

    const sortedBids = [...quotes].sort((a, b) => b.bidPrice - a.bidPrice);
    const sortedAsks = [...quotes].sort((a, b) => a.askPrice - b.askPrice);

    const levels: MarketMakingQuoteLevel[] = [];
    const count = Math.min(sortedBids.length, sortedAsks.length, 5);

    for (let i = 0; i < count; i++) {
      const bid = sortedBids[i];
      const ask = sortedAsks[i];
      const spreadPct = ((ask.askPrice - bid.bidPrice) / bid.bidPrice) * 100;
      const targetProfitUsd = 5000 * (Math.abs(spreadPct) / 100);

      levels.push({
        level: i + 1,
        bidPrice: bid.bidPrice,
        bidAmount: Number((5000 / bid.bidPrice).toFixed(4)),
        bidExchange: bid.exchangeName,
        askPrice: ask.askPrice,
        askAmount: Number((5000 / ask.askPrice).toFixed(4)),
        askExchange: ask.exchangeName,
        spreadPct,
        targetProfitUsd,
      });
    }

    return levels;
  }

  /**
   * Execute Arbitrage Order (Manual or Automated Bot Trigger)
   */
  static executeArbitrageOrder(
    opportunity: ArbitrageOpportunity, 
    orderSizeUsd?: number
  ): ArbitrageExecutionTrade {
    const sizeUsd = orderSizeUsd || this.currentBotConfig.orderSizeUsd;
    const qty = sizeUsd / opportunity.buyPrice;

    const buyFeePct = this.EXCHANGE_FEES[opportunity.buyExchange]?.taker || 0.075;
    const sellFeePct = this.EXCHANGE_FEES[opportunity.sellExchange]?.taker || 0.075;
    const totalFeesUsd = sizeUsd * ((buyFeePct + sellFeePct) / 100);

    const grossProfitUsd = (opportunity.sellPrice - opportunity.buyPrice) * qty;
    const netProfitUsd = grossProfitUsd - totalFeesUsd;
    const netProfitPct = (netProfitUsd / sizeUsd) * 100;

    const latency = (this.EXCHANGE_FEES[opportunity.buyExchange]?.latency || 20) +
                    (this.EXCHANGE_FEES[opportunity.sellExchange]?.latency || 20);

    const execution: ArbitrageExecutionTrade = {
      id: `arb-exec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      symbol: opportunity.symbol,
      type: opportunity.type,
      buyExchange: opportunity.buyExchange,
      buyPrice: opportunity.buyPrice,
      sellExchange: opportunity.sellExchange,
      sellPrice: opportunity.sellPrice,
      volumeUsd: sizeUsd,
      size: Number(qty.toFixed(5)),
      grossProfitUsd: Number(grossProfitUsd.toFixed(2)),
      feesPaidUsd: Number(totalFeesUsd.toFixed(2)),
      netProfitUsd: Number(netProfitUsd.toFixed(2)),
      netProfitPct: Number(netProfitPct.toFixed(3)),
      executionLatencyMs: latency,
      status: 'COMPLETED',
      reason: opportunity.path ? `Triangular Loop: ${opportunity.path.join(' -> ')}` : `Spatial Spread (${opportunity.buyExchange} -> ${opportunity.sellExchange})`,
    };

    // Prepend to history
    this.executionHistory.unshift(execution);
    if (this.executionHistory.length > 100) {
      this.executionHistory.pop();
    }

    this.notifyListeners();
    return execution;
  }

  /**
   * Run Single Auto-Pilot Check and Trigger Orders if Threshold is met
   */
  static runAutoMarketMakingCycle(
    symbol: string, 
    currentPrice: number
  ): { executed: boolean; trade?: ArbitrageExecutionTrade; reason?: string } {
    if (!this.currentBotConfig.enabled) {
      return { executed: false, reason: 'Bot Devre Dışı' };
    }

    const opps = this.scanSpatialArbitrage(
      symbol, 
      currentPrice, 
      this.currentBotConfig.targetExchanges, 
      this.currentBotConfig.orderSizeUsd
    );

    if (opps.length === 0) {
      return { executed: false, reason: 'Pozitif Arbitraj Fırsatı Yok' };
    }

    const bestOpp = opps[0];

    // Check against user-configured threshold
    if (bestOpp.netProfitPct >= this.currentBotConfig.minProfitThresholdPct) {
      const trade = this.executeArbitrageOrder(bestOpp, this.currentBotConfig.orderSizeUsd);
      return { executed: true, trade, reason: `Eşik aşıldı: %${bestOpp.netProfitPct.toFixed(2)} >= %${this.currentBotConfig.minProfitThresholdPct.toFixed(2)}` };
    }

    return { 
      executed: false, 
      reason: `Kâr eşiğin altında: %${bestOpp.netProfitPct.toFixed(2)} < %${this.currentBotConfig.minProfitThresholdPct.toFixed(2)}` 
    };
  }

  /**
   * Clear Execution History
   */
  static clearHistory() {
    this.executionHistory = [];
    this.notifyListeners();
  }

  /**
   * Get Aggregate Statistics
   */
  static getStats() {
    const history = this.getExecutionHistory();
    const totalTrades = history.length;
    const completedTrades = history.filter((t) => t.status === 'COMPLETED').length;
    const totalProfitUsd = history.reduce((acc, t) => acc + t.netProfitUsd, 0);
    const totalVolumeUsd = history.reduce((acc, t) => acc + t.volumeUsd, 0);
    const totalFeesPaidUsd = history.reduce((acc, t) => acc + t.feesPaidUsd, 0);
    const winRatePct = totalTrades > 0 ? (history.filter((t) => t.netProfitUsd > 0).length / totalTrades) * 100 : 100;
    const avgLatencyMs = totalTrades > 0 ? Math.round(history.reduce((acc, t) => acc + t.executionLatencyMs, 0) / totalTrades) : 24;

    return {
      totalTrades,
      completedTrades,
      totalProfitUsd,
      totalVolumeUsd,
      totalFeesPaidUsd,
      winRatePct,
      avgLatencyMs,
    };
  }
}

