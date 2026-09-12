export interface Candle {
  time: number; // Unix timestamp in seconds for lightweight-charts
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  timestamp: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdateId: number;
}

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

export interface IndicatorSettings {
  // 1. Trend & Overlays
  sma: { enabled: boolean; period: number; color: string };
  ema20: { enabled: boolean; period: number; color: string };
  ema50: { enabled: boolean; period: number; color: string };
  ema200: { enabled: boolean; period: number; color: string };
  hma: { enabled: boolean; period: number; color: string }; // 5. Hull Moving Average
  supertrend: { enabled: boolean; period: number; multiplier: number }; // 6. SuperTrend
  parabolicSar: { enabled: boolean; step: number; maxStep: number; color: string }; // 7. Parabolic SAR
  ichimoku: { enabled: boolean; conversion: number; base: number; spanB: number }; // 8. Ichimoku Cloud
  vwap: { enabled: boolean; color: string }; // 9. VWAP
  
  // 2. Volatility & Bands
  bollingerBands: { enabled: boolean; period: number; stdDev: number; upperColor: string; lowerColor: string; midColor: string }; // 10. Bollinger Bands
  keltnerChannels: { enabled: boolean; emaPeriod: number; atrPeriod: number; multiplier: number; color: string }; // 11. Keltner Channels
  donchianChannels: { enabled: boolean; period: number; color: string }; // 12. Donchian Channels
  atr: { enabled: boolean; period: number }; // 13. Average True Range

  // 3. Momentum & Oscillators
  rsi: { enabled: boolean; period: number; overbought: number; oversold: number; color: string }; // 14. RSI
  macd: { enabled: boolean; fast: number; slow: number; signal: number }; // 15. MACD
  stochastic: { enabled: boolean; kPeriod: number; dPeriod: number; smooth: number }; // 16. Stochastic
  cci: { enabled: boolean; period: number; overbought: number; oversold: number; color: string }; // 17. CCI
  adx: { enabled: boolean; period: number; threshold: number; color: string }; // 18. ADX / DMI
  williamsR: { enabled: boolean; period: number; overbought: number; oversold: number; color: string }; // 19. Williams %R

  // 4. Volume & Flow
  volume: { enabled: boolean };
  obv: { enabled: boolean; color: string }; // 20. On-Balance Volume (OBV)
  mfi: { enabled: boolean; period: number; overbought: number; oversold: number; color: string }; // 21. Money Flow Index (MFI)

  // 5. Smart Levels & Geometry
  autoSupportResistance: {
    enabled: boolean;
    pivotWindow: number; // e.g. 5 candles
    clusterTolerancePct: number; // e.g. 0.8%
    maxLevels: number; // e.g. 5 support + 5 resistance
    minTouches: number;
    showZones: boolean;
    showPivotPoints: boolean; // Classic, Fibonacci
  };
}

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  sma: { enabled: false, period: 20, color: '#38bdf8' },
  ema20: { enabled: true, period: 20, color: '#38bdf8' },
  ema50: { enabled: true, period: 50, color: '#f59e0b' },
  ema200: { enabled: true, period: 200, color: '#a855f7' },
  hma: { enabled: false, period: 16, color: '#10b981' },
  supertrend: { enabled: true, period: 10, multiplier: 3 },
  parabolicSar: { enabled: false, step: 0.02, maxStep: 0.2, color: '#f59e0b' },
  ichimoku: { enabled: false, conversion: 9, base: 26, spanB: 52 },
  vwap: { enabled: false, color: '#ec4899' },
  
  bollingerBands: { enabled: false, period: 20, stdDev: 2, upperColor: '#60a5fa', lowerColor: '#60a5fa', midColor: '#93c5fd' },
  keltnerChannels: { enabled: false, emaPeriod: 20, atrPeriod: 10, multiplier: 2, color: '#06b6d4' },
  donchianChannels: { enabled: false, period: 20, color: '#8b5cf6' },
  atr: { enabled: false, period: 14 },

  rsi: { enabled: true, period: 14, overbought: 70, oversold: 30, color: '#38bdf8' },
  macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
  stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, smooth: 3 },
  cci: { enabled: false, period: 20, overbought: 100, oversold: -100, color: '#f97316' },
  adx: { enabled: false, period: 14, threshold: 25, color: '#eab308' },
  williamsR: { enabled: false, period: 14, overbought: -20, oversold: -80, color: '#14b8a6' },

  volume: { enabled: true },
  obv: { enabled: false, color: '#6366f1' },
  mfi: { enabled: false, period: 14, overbought: 80, oversold: 20, color: '#22c55e' },

  autoSupportResistance: {
    enabled: true,
    pivotWindow: 5,
    clusterTolerancePct: 0.8,
    maxLevels: 5,
    minTouches: 2,
    showZones: true,
    showPivotPoints: true,
  },
};

export interface SupportResistanceZone {
  id: string;
  price: number;
  type: 'SUPPORT' | 'RESISTANCE';
  touches: number;
  strengthScore: number; // 0 - 100
  volumeWeight: number;
  highRange: number;
  lowRange: number;
  distancePct: number; // % distance from current price
  isNear: boolean; // true if within 0.5%
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  type: 'CLASSIC' | 'FIBONACCI';
}

export type StrategyCategory = 'trend' | 'mean_reversion' | 'breakout' | 'grid' | 'dca' | 'custom';

export interface StrategyParam {
  key: string;
  name: string;
  type: 'number' | 'boolean' | 'select';
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface Strategy {
  id: string;
  name: string;
  category: StrategyCategory;
  archetype?: string;
  description: string;
  symbols: string[];
  timeframe: Timeframe;
  enabled: boolean;
  params: Record<string, any>;
  customCode?: string; // Python / TS code for custom strategies
  lastSignal?: Signal;
  totalSignals: number;
  winRate: number;
  profitPct: number;
}

export interface Signal {
  id: string;
  strategyId: string;
  strategyName: string;
  symbol: string;
  timestamp: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  confidence: number; // 0 - 100%
  reason: string;
  suggestedPositionSizePct: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
}

export type PositionSide = 'LONG' | 'SHORT';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStopPct?: number;
  trailingPeakPrice?: number;
  status: PositionStatus;
  openTime: number;
  closeTime?: number;
  closedPnl?: number;
  closedReason?: string;
  mode: 'PAPER' | 'TESTNET' | 'LIVE';
}

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LIMIT' | 'OCO' | 'TWAP' | 'VWAP' | 'ICEBERG' | 'TRAILING_STOP';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'NEW' | 'FILLED' | 'CANCELED' | 'REJECTED';

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  side: OrderSide;
  price: number;
  stopPrice?: number;
  amount: number;
  filledAmount: number;
  status: OrderStatus;
  timestamp: number;
  mode: 'PAPER' | 'TESTNET' | 'LIVE';
  errorMessage?: string;
  // Algorithmic order params
  algoParams?: {
    twapDurationMinutes?: number;
    twapIntervalSeconds?: number;
    vwapTargetVolumePct?: number;
    icebergDisplayAmount?: number;
    totalSlices?: number;
    completedSlices?: number;
  };
}

export interface TradeLog {
  id: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  exitPrice: number;
  amount: number;
  pnl: number;
  pnlPct: number;
  commission: number;
  entryTime: number;
  exitTime: number;
  durationMinutes: number;
  exitReason: string;
}

export interface BacktestConfig {
  symbol: string;
  timeframe: Timeframe;
  strategyId: string;
  initialBalance: number;
  commissionPct: number; // default 0.1% (0.075% with BNB)
  slippagePct: number; // default 0.05%
  startDate: string;
  endDate: string;
  useTrailingStop: boolean;
  trailingStopPct: number;
  riskPerTradePct: number;
}

export interface BacktestResult {
  initialBalance: number;
  finalBalance: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
  benchmarkReturnPct: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  maxDrawdownDurationDays: number;
  winRatePct: number;
  profitFactor: number;
  payoffRatio: number;
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  avgWinPct: number;
  avgLossPct: number;
  trades: TradeLog[];
  equityCurve: {
    time: string;
    timestamp: number;
    equity: number;
    drawdownPct: number;
    benchmarkEquity: number;
  }[];
}

export type SizingMethod = 'FIXED_AMOUNT' | 'PERCENT_BALANCE' | 'KELLY' | 'ATR_VOLATILITY';

export interface RiskSettings {
  sizingMethod: SizingMethod;
  fixedAmountUSDT: number;
  percentOfBalance: number; // e.g. 5%
  kellyFraction: number; // e.g. 0.5 (Half Kelly)
  defaultStopLossPct: number; // e.g. 2.0%
  defaultTakeProfitPct: number; // e.g. 4.0%
  trailingStopPct: number; // e.g. 1.5%
  maxDailyLossPct: number; // Circuit breaker threshold e.g. 5%
  maxWeeklyLossPct: number; // Circuit breaker e.g. 10%
  maxOpenPositions: number; // e.g. 4
  maxAssetExposurePct: number; // e.g. 25% max in a single asset
  emergencyKillActive: boolean;
  circuitBreakerTriggered: boolean;
  todayLossUsdt: number;
}

export type AlertCondition = 'PRICE_ABOVE' | 'PRICE_BELOW' | 'RSI_OVERBOUGHT' | 'RSI_OVERSOLD' | 'SUPPORT_PROXIMITY' | 'RESISTANCE_PROXIMITY' | 'STRATEGY_SIGNAL';

export interface AlertItem {
  id: string;
  symbol: string;
  condition: AlertCondition;
  targetValue: number;
  message: string;
  triggered: boolean;
  triggeredAt?: number;
  createdAt: number;
  notificationChannels: ('WEB' | 'SOUND' | 'TELEGRAM')[];
}

export interface RateLimitStatus {
  usedWeight1m: number;
  maxWeight1m: number; // 6000
  orders10s: number;
  maxOrders10s: number; // 50
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  wsLatencyMs: number;
  isWsConnected: boolean;
  lastSyncTime: number;
}

export type TradingMode = 'PAPER' | 'TESTNET' | 'LIVE';

export type AutoLearnObjective = 'MAX_PROFIT' | 'MAX_COMPOUND_GROWTH' | 'MAX_SHARPE' | 'HIGH_WIN_RATE' | 'BALANCED';
export type AutoLearnSearchDepth = 'FAST' | 'STANDARD' | 'DEEP_GENETIC' | 'GOOGLE_AI_AUTONOMOUS';

export interface AutoLearnConfig {
  symbol: string;
  timeframe: Timeframe;
  historicalYears: number; // 5
  objective: AutoLearnObjective;
  searchDepth: AutoLearnSearchDepth;
  initialBalance: number;
  commissionPct: number;
  slippagePct: number;
  useTrailingStop: boolean;
  maxRiskPerTradePct: number; // Compounding capital allocation per trade (e.g. 50% - 95%)
  compoundGrowthMode?: boolean; // Reinvest all capital + profits for exponential compounding
  allowUnconstrainedSignals?: boolean; // AI analyzes chart without template restrictions
}

export interface YearlyPnLStat {
  year: string;
  trades: number;
  winRatePct: number;
  pnlUsdt: number;
  returnPct: number;
  maxDrawdownPct: number;
  benchmarkReturnPct: number;
}

export interface AutoLearnCandidateResult {
  id: string;
  name: string;
  category: StrategyCategory;
  archetype: string;
  description: string;
  symbols: string[];
  timeframe: Timeframe;
  params: Record<string, any>;
  score: number; // 0 - 100 composite ranking
  
  // 5-Year Backtest Metrics
  initialBalance: number;
  finalBalance: number;
  fiveYearReturnPct: number;
  cagrPct: number;
  benchmarkFiveYearReturnPct: number;
  alphaOverBenchmarkPct: number;
  
  winRatePct: number;
  profitFactor: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  payoffRatio: number;
  expectancy: number;
  
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  avgDurationHours: number;
  
  // Yearly breakdown
  yearlyStats: YearlyPnLStat[];
  
  // 5-Year Equity Curve
  equityCurve: {
    time: string;
    timestamp: number;
    equity: number;
    drawdownPct: number;
    benchmarkEquity: number;
  }[];

  // Best trade and Worst trade
  bestTradePct: number;
  worstTradePct: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface AutoLearnProgress {
  status: 'IDLE' | 'FETCHING_5Y_DATA' | 'OPTIMIZING' | 'VALIDATING' | 'COMPLETED' | 'ERROR';
  percent: number; // 0 - 100
  currentGeneration: number;
  totalGenerations: number;
  testedModelsCount: number;
  bestReturnPct: number;
  bestWinRatePct: number;
  bestSharpe: number;
  activeEvaluatingModel: string;
  logs: { id: string; timestamp: number; text: string; type: 'info' | 'success' | 'highlight' | 'warn' }[];
}

// ============================================
// 12-PILLAR PROFESSIONAL TRADING BOT INTERFACES
// ============================================

// 1. Monte Carlo & Walk-Forward Optimization
export interface MonteCarloIteration {
  runIndex: number;
  finalBalance: number;
  maxDrawdownPct: number;
  cagrPct: number;
  equityPoints: number[];
}

export interface MonteCarloSimulationResult {
  iterationsCount: number;
  medianFinalBalance: number;
  confidenceInterval95: { minBalance: number; maxBalance: number; minDrawdownPct: number; maxDrawdownPct: number };
  confidenceInterval99: { minBalance: number; maxBalance: number; minDrawdownPct: number; maxDrawdownPct: number };
  ruinProbabilityPct: number; // Probability of losing >50%
  var95Pct: number; // Value at Risk 95%
  cvar95Pct: number; // Conditional VaR
  simulatedEquityCurves: { timeIndex: number; p5: number; p25: number; p50: number; p75: number; p95: number }[];
}

export interface WalkForwardWindow {
  windowIndex: number;
  inSampleStartDate: string;
  inSampleEndDate: string;
  inSampleReturnPct: number;
  inSampleSharpe: number;
  outOfSampleStartDate: string;
  outOfSampleEndDate: string;
  outOfSampleReturnPct: number;
  outOfSampleSharpe: number;
  robustnessRatioPct: number; // Out-of-sample / In-sample performance ratio
}

export interface WalkForwardOptimizationResult {
  totalWindows: number;
  averageRobustnessPct: number;
  overallOutSampleReturnPct: number;
  isOverfitted: boolean;
  windows: WalkForwardWindow[];
}

// 2. On-Chain Data & Whale Alert
export interface WhaleTransaction {
  id: string;
  timestamp: number;
  symbol: string;
  amount: number;
  amountUsd: number;
  fromAddress: string;
  fromType: 'EXCHANGE' | 'WHALE_WALLET' | 'MINER' | 'COLD_STORAGE' | 'UNKNOWN';
  toAddress: string;
  toType: 'EXCHANGE' | 'WHALE_WALLET' | 'COLD_STORAGE' | 'UNKNOWN';
  transactionType: 'TRANSFER' | 'INFLOW' | 'OUTFLOW';
  txHash: string;
  impactScore: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface OnChainMetrics {
  exchangeNetFlow24hUsd: number; // Negative is outflow (bullish)
  whaleAccumulationIndex: number; // 0 - 100
  activeAddresses24h: number;
  minerReserveChangePct: number;
  mvrvZScore: number; // Valuation metric
  fundingRatePct: number; // e.g. +0.01%
  openInterestUsd: number;
}

// 3. Market News & Social Sentiment
export interface CryptoNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: number;
  url: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number; // -1.0 to +1.0
  summary: string;
  relatedCoins: string[];
}

export interface SentimentMetrics {
  fearAndGreedIndex: number; // 0 - 100
  fearAndGreedClassification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  socialVolume24h: number;
  bullishSentimentPct: number;
  bearishSentimentPct: number;
  aiSentimentSummary: string;
  lastUpdated: number;
}

// 4. Multi-Exchange Arbitrage & Market Making
export interface ExchangePriceQuote {
  exchangeName: string; // 'Binance' | 'Coinbase' | 'Kraken' | 'Bybit' | 'OKX' | 'Bitfinex' | 'KuCoin'
  symbol: string;
  bidPrice: number;
  askPrice: number;
  lastPrice: number;
  spreadPct: number;
  volume24hUsd: number;
  depthBidUsd: number;
  depthAskUsd: number;
  latencyMs: number;
  isLive: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  grossSpreadPct: number;
  estimatedFeePct: number;
  netProfitPct: number;
  estimatedProfitUsd: number;
  maxExecSizeUsd: number;
  timestamp: number;
  type: 'SPATIAL' | 'TRIANGULAR' | 'MARKET_MAKING';
  path?: string[];
  confidenceScore: number;
}

export interface ArbitrageBotConfig {
  enabled: boolean;
  minProfitThresholdPct: number; // e.g. 0.15%
  orderSizeUsd: number; // e.g. 5000
  maxSlippageTolerancePct: number; // e.g. 0.05%
  executionIntervalSec: number; // e.g. 2s
  maxDailyExecutions: number;
  autoHedge: boolean;
  simulatedLatencyMs: number;
  targetExchanges: string[];
  marketMakingMode: 'CROSS_EXCHANGE_ARB' | 'DUAL_SIDED_MAKER' | 'TRIANGULAR_LOOP';
}

export interface ArbitrageExecutionTrade {
  id: string;
  timestamp: number;
  symbol: string;
  type: 'SPATIAL' | 'TRIANGULAR' | 'MARKET_MAKING';
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  volumeUsd: number;
  size: number;
  grossProfitUsd: number;
  feesPaidUsd: number;
  netProfitUsd: number;
  netProfitPct: number;
  executionLatencyMs: number;
  status: 'COMPLETED' | 'PARTIAL' | 'HEDGED' | 'FAILED';
  reason?: string;
}

export interface MarketMakingQuoteLevel {
  level: number;
  bidPrice: number;
  bidAmount: number;
  bidExchange: string;
  askPrice: number;
  askAmount: number;
  askExchange: string;
  spreadPct: number;
  targetProfitUsd: number;
}

// 5. Audit Log & Security
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: 'LOGIN' | 'API_KEY_UPDATE' | 'ORDER_EXECUTED' | 'KILL_SWITCH' | 'STRATEGY_TOGGLE' | 'SETTINGS_CHANGE' | 'FAILOVER_TRIGGERED';
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'DENIED';
  userUid: string;
}

// 6. Tax & Compliance Report
export interface TaxReportSummary {
  taxYear: number;
  totalRealizedGainUsd: number;
  totalRealizedLossUsd: number;
  netProfitLossUsd: number;
  totalTradesCount: number;
  totalVolumeUsd: number;
  totalCommissionsPaidUsd: number;
  accountingMethod: 'FIFO' | 'LIFO' | 'AVERAGE_COST';
  estimatedTaxLiabilityUsd: number;
}

