import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Candle, 
  IndicatorSettings, 
  Strategy, 
  Signal, 
  Timeframe, 
  Ticker, 
  OrderBook, 
  TradingMode, 
  RateLimitStatus, 
  AlertItem,
  DEFAULT_INDICATOR_SETTINGS
} from './types/crypto';
import { BinanceService } from './services/binanceService';
import { IndicatorEngine } from './services/indicatorEngine';
import { StrategyEngine } from './services/strategyEngine';
import { PaperTradingEngine } from './services/paperTradingEngine';
import { ContinuousTradingBot } from './services/continuousTradingBot';

import { Header } from './components/Header';
import { TradingViewChart } from './components/Chart/TradingViewChart';
import { IndicatorModal } from './components/Chart/IndicatorModal';
import { AutoSrZoneCard } from './components/AutoSrZoneCard';
import { AIAnalysisCard } from './components/MarketIntelligence/AIAnalysisCard';
import { Watchlist } from './components/Watchlist';
import { StrategyManager } from './components/Strategy/StrategyManager';
import { Screener } from './components/Screener/Screener';
import { BacktestPanel } from './components/Backtest/BacktestPanel';
import { PaperTradingPanel } from './components/Trading/PaperTradingPanel';
import { PortfolioView } from './components/Portfolio/PortfolioView';
import { RiskManagementPanel } from './components/Risk/RiskManagementPanel';
import { AlertsManager } from './components/Alerts/AlertsManager';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ArbitrageModule } from './components/Arbitrage/ArbitrageModule';

export default function App() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [timeframe, setTimeframe] = useState<Timeframe>('15m');
  const [activeTab, setActiveTab] = useState<'chart' | 'strategies' | 'backtest' | 'screener' | 'arbitrage' | 'portfolio' | 'risk' | 'alerts'>('chart');
  const [mode, setMode] = useState<TradingMode>('PAPER');

  // Modals
  const [isIndicatorModalOpen, setIsIndicatorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'postgres' | 'local_ai'>('general');

  // Market State
  const [candles, setCandles] = useState<Candle[]>([]);
  const [liveCandle, setLiveCandle] = useState<Candle | null>(null);
  const [tickers, setTickers] = useState<Record<string, Ticker>>({});
  const [orderBook, setOrderBook] = useState<OrderBook>({ bids: [], asks: [], lastUpdateId: 0 });
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>(BinanceService.getRateLimitStatus());

  // Indicator Settings (20 Top Technical Indicators)
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>(DEFAULT_INDICATOR_SETTINGS);

  // Strategies & Positions State
  const [strategies, setStrategies] = useState<Strategy[]>(() => StrategyEngine.getInitialStrategies());
  const [strategySignals, setStrategySignals] = useState<Signal[]>([]);
  const [positions, setPositions] = useState(PaperTradingEngine.getPositions());
  const [tradeHistory, setTradeHistory] = useState(PaperTradingEngine.getTradeHistory());

  // Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'alt-1',
      symbol: 'BTCUSDT',
      condition: 'SUPPORT_PROXIMITY',
      targetValue: 88500,
      message: 'BTC ana destek bölgesine yaklaştı!',
      triggered: false,
      createdAt: Date.now() - 100000,
      notificationChannels: ['WEB', 'SOUND', 'TELEGRAM'],
    },
  ]);

  // Support & Resistance Zones
  const srZones = useMemo(() => {
    if (!indicatorSettings?.autoSupportResistance?.enabled || !candles || candles.length === 0) return [];
    return IndicatorEngine.findSupportResistanceZones(
      candles,
      indicatorSettings.autoSupportResistance.pivotWindow,
      indicatorSettings.autoSupportResistance.clusterTolerancePct,
      indicatorSettings.autoSupportResistance.maxLevels
    );
  }, [candles, indicatorSettings]);

  // Current Price
  const currentTicker = tickers[selectedSymbol];
  const currentPrice = liveCandle?.close || currentTicker?.price || (candles && candles.length > 0 ? candles[candles.length - 1].close : 0);

  // Sync background continuous trading bot state with App positions & trades
  useEffect(() => {
    ContinuousTradingBot.init(strategies);
    ContinuousTradingBot.updateStrategies(strategies);

    const unsub = ContinuousTradingBot.subscribe(() => {
      setPositions([...PaperTradingEngine.getPositions()]);
      setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
    });
    return () => unsub();
  }, [strategies]);

  // Load Historical Klines when Symbol or Timeframe changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Varsayılan olarak grafikteki mum sayısını 150'den 1000'e (maksimum) çıkarıyoruz
      // Böylece kullanıcı varsayılan olarak daha geniş bir geçmiş veri görecek.
      const data = await BinanceService.fetchKlines(selectedSymbol, timeframe, 1000);
      if (isMounted) {
        setCandles(data || []);
        if (data && data.length > 0) {
          setLiveCandle(data[data.length - 1]);
        }
      }

      const ticker = await BinanceService.fetchTicker(selectedSymbol);
      if (isMounted) {
        setTickers((prev) => ({ ...prev, [selectedSymbol]: ticker }));
      }

      const depth = await BinanceService.fetchDepth(selectedSymbol, 10);
      if (isMounted) {
        setOrderBook(depth);
      }
    }

    loadData();
    BinanceService.connectWebSocket(selectedSymbol, timeframe);

    const unsubCandle = BinanceService.subscribeCandle((c, sym) => {
      if (sym === selectedSymbol) {
        setLiveCandle(c);
        PaperTradingEngine.onPriceTick(selectedSymbol, c.close);
        setPositions([...PaperTradingEngine.getPositions()]);
        setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
      }
    });

    const unsubTicker = BinanceService.subscribeTicker((t) => {
      setTickers((prev) => ({ ...prev, [t.symbol]: t }));
      if (t.symbol === selectedSymbol) {
        PaperTradingEngine.onPriceTick(selectedSymbol, t.price);
      }
    });

    const unsubDepth = BinanceService.subscribeDepth((book) => {
      setOrderBook(book);
    });

    return () => {
      isMounted = false;
      unsubCandle();
      unsubTicker();
      unsubDepth();
    };
  }, [selectedSymbol, timeframe]);

  // Strategy Execution Engine Tick
  useEffect(() => {
    if (!candles || candles.length < 30) return;

    const signals: Signal[] = (strategies || [])
      .filter((s) => s && s.enabled)
      .map((s) => StrategyEngine.evaluateStrategy(s, candles));
    setStrategySignals(signals);

    // Auto-execute signals for paper trading
    signals.forEach((sig) => {
      const activeStrat = strategies.find((s) => s.id === sig.strategyId);
      if (!activeStrat || !activeStrat.enabled) return;

      if (sig.action === 'BUY') {
        const hasOpen = PaperTradingEngine.getPositions().some((p) => p.symbol === sig.symbol && p.status === 'OPEN');
        if (!hasOpen) {
          PaperTradingEngine.placeOrder({
            symbol: sig.symbol,
            type: 'MARKET',
            side: 'BUY',
            price: sig.price,
            amountUSDT: 1000,
            leverage: 1,
            stopLossPct: 2.5,
            takeProfitPct: 5.0,
            mode,
          });
          setPositions([...PaperTradingEngine.getPositions()]);
          setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
        }
      } else if (sig.action === 'SELL') {
        const openPos = PaperTradingEngine.getPositions().find((p) => p.symbol === sig.symbol && p.side === 'LONG' && p.status === 'OPEN');
        if (openPos) {
          PaperTradingEngine.closePosition(openPos.id, 'STRATEGY_SIGNAL');
          setPositions([...PaperTradingEngine.getPositions()]);
          setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
        }
      }
    });
  }, [candles, strategies, indicatorSettings, mode]);

  // Fetch All 24h Tickers for Top 500 coins overview
  useEffect(() => {
    let isMounted = true;

    async function loadAllTickers() {
      try {
        const allTickers = await BinanceService.fetchAll24hTickers();
        if (isMounted && allTickers && Object.keys(allTickers).length > 0) {
          setTickers((prev) => ({ ...prev, ...allTickers }));
        }
      } catch (err) {
        console.error('Error fetching all 24h tickers:', err);
      }
    }

    loadAllTickers();
    const interval = setInterval(loadAllTickers, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Periodic Rate Limit & Status Check
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStatus(BinanceService.getRateLimitStatus());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStrategy = (id: string) => {
    setStrategies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleAddStrategy = (newStrategy: Strategy) => {
    setStrategies((prev) => [newStrategy, ...prev]);
  };

  const handleUpdateStrategy = (updated: Strategy) => {
    setStrategies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteStrategy = (id: string) => {
    setStrategies((prev) => prev.filter((s) => s.id !== id));
  };

  const handleTriggerKillSwitch = () => {
    // 1. Disable all strategies
    setStrategies((prev) => prev.map((s) => ({ ...s, enabled: false })));
    // 2. Liquidate all open positions in paper engine
    PaperTradingEngine.triggerEmergencyKillSwitch();
    setPositions([...PaperTradingEngine.getPositions()]);
    setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
  };

  const handleRefreshPortfolio = useCallback(() => {
    setPositions([...PaperTradingEngine.getPositions()]);
    setTradeHistory([...PaperTradingEngine.getTradeHistory()]);
  }, []);

  const handleAddAlert = (newAlert: AlertItem) => {
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleApply5YearData = (candles5y: Candle[], tf: Timeframe) => {
    setCandles(candles5y);
    setTimeframe(tf);
  };

  const handleOpenSettings = (tab: 'general' | 'postgres' | 'local_ai' = 'general') => {
    setSettingsInitialTab(tab);
    setIsSettingsModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen lg:h-screen w-full bg-[#181a20] text-[#eaecef] overflow-x-hidden font-sans">
      {/* 1. Header Bar */}
      <Header
        currentTicker={currentTicker}
        symbol={selectedSymbol}
        onSelectSymbol={setSelectedSymbol}
        tickers={tickers}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        mode={mode}
        onOpenSettings={handleOpenSettings}
        rateLimitStatus={rateLimitStatus}
        onTriggerKillSwitch={handleTriggerKillSwitch}
        activeStrategiesCount={strategies.filter((s) => s.enabled).length}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden p-2 sm:p-2.5 lg:p-3 bg-[#181a20] max-w-[3840px] w-full mx-auto pb-16 lg:pb-3">
        {activeTab === 'chart' && (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-2 lg:gap-2.5 h-full overflow-y-auto lg:overflow-hidden">
            {/* Left Watchlist Sidebar (2 cols on lg, 2 cols on xl/2xl) */}
            <div className="hidden lg:block lg:col-span-3 xl:col-span-2 h-full overflow-hidden">
              <Watchlist
                selectedSymbol={selectedSymbol}
                onSelectSymbol={setSelectedSymbol}
                tickers={tickers}
              />
            </div>

            {/* Middle Main TradingView Chart (7 cols) */}
            <div className="w-full lg:col-span-6 xl:col-span-6 2xl:col-span-7 h-full flex flex-col gap-2 min-h-[420px] sm:min-h-[480px] lg:min-h-0 overflow-hidden">
              <div className="flex-1 h-full overflow-hidden">
                <TradingViewChart
                  candles={candles}
                  symbol={selectedSymbol}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  indicatorSettings={indicatorSettings}
                  onOpenIndicatorModal={() => setIsIndicatorModalOpen(true)}
                  srZones={srZones}
                  strategySignals={strategySignals}
                  liveCandle={liveCandle}
                  alerts={alerts}
                  onAddAlert={handleAddAlert}
                  onDeleteAlert={handleDeleteAlert}
                  onApply5YearData={handleApply5YearData}
                />
              </div>
            </div>

            {/* Right Auto S/R Radar & Mini Order Execution (3 cols) */}
            <div className="w-full lg:col-span-3 xl:col-span-4 2xl:col-span-3 h-full flex flex-col gap-2 overflow-y-auto">
              <AutoSrZoneCard zones={srZones} currentPrice={currentPrice} />
              
              <AIAnalysisCard 
                symbol={selectedSymbol}
                timeframe={timeframe}
                currentPrice={currentPrice}
                candles={candles}
                srZones={srZones}
              />

              <div className="flex-1 min-h-[360px]">
                <PaperTradingPanel
                  symbol={selectedSymbol}
                  currentPrice={currentPrice}
                  mode={mode}
                  onModeChange={setMode}
                  orderBook={orderBook}
                  positions={positions}
                  tradeHistory={tradeHistory}
                  onRefreshPortfolio={handleRefreshPortfolio}
                  onOpenSettings={handleOpenSettings}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="h-full overflow-y-auto">
            <StrategyManager
              strategies={strategies}
              onToggleStrategy={handleToggleStrategy}
              onUpdateStrategyParams={(id, params) => handleUpdateStrategy({ ...strategies.find(s => s.id === id)!, params })}
              onAddStrategy={handleAddStrategy}
              candles={candles}
              currentSymbol={selectedSymbol}
            />
          </div>
        )}

        {activeTab === 'screener' && (
          <div className="h-full overflow-y-auto">
            <Screener 
              strategies={strategies} 
              onSelectSymbol={setSelectedSymbol}
              onNavigateToTab={setActiveTab}
              mode={mode}
            />
          </div>
        )}

        {activeTab === 'arbitrage' && (
          <div className="h-full overflow-y-auto">
            <ArbitrageModule
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              mode={mode}
            />
          </div>
        )}

        {activeTab === 'backtest' && (
          <div className="h-full overflow-y-auto">
            <BacktestPanel
              strategies={strategies}
              candles={candles}
              symbol={selectedSymbol}
              timeframe={timeframe}
              onAddStrategy={handleAddStrategy}
              onApplyStrategyToLive={handleAddStrategy}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="h-full overflow-y-auto">
            <PortfolioView
              positions={positions}
              tradeHistory={tradeHistory}
              currentPrice={currentPrice}
              symbol={selectedSymbol}
              mode={mode}
              onModeChange={setMode}
              orderBook={orderBook}
              candles={candles}
              timeframe={timeframe}
              onRefreshPortfolio={handleRefreshPortfolio}
            />
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="h-full overflow-y-auto">
            <RiskManagementPanel
              positions={positions}
              currentPrice={currentPrice}
              onSettingsUpdated={handleRefreshPortfolio}
              onTriggerKillSwitch={handleTriggerKillSwitch}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="h-full overflow-y-auto">
            <AlertsManager
              alerts={alerts}
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              onAddAlert={(al) => setAlerts((prev) => [al, ...prev])}
              onDeleteAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
            />
          </div>
        )}
      </main>

      {/* 3. Binance Mobile App Style Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#181a20] border-t border-[#2b313a] flex items-center justify-around py-1.5 px-2 select-none">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xs transition ${
            activeTab === 'chart' ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M3 3v18h18v-2H5V3H3zm4 14h2v-4H7v4zm4 0h2V7h-2v10zm4 0h2v-7h-2v7z"/>
          </svg>
          <span className="text-[10px] font-medium">Al-Sat</span>
        </button>

        <button
          onClick={() => setActiveTab('strategies')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xs transition ${
            activeTab === 'strategies' ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span className="text-[10px] font-medium">Botlar</span>
        </button>

        <button
          onClick={() => setActiveTab('arbitrage')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xs transition ${
            activeTab === 'arbitrage' ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/>
          </svg>
          <span className="text-[10px] font-medium">Arbitraj</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xs transition ${
            activeTab === 'portfolio' ? 'text-[#fcd535]' : 'text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
          <span className="text-[10px] font-medium">Cüzdan</span>
        </button>

        <button
          onClick={() => handleOpenSettings('general')}
          className="flex flex-col items-center gap-0.5 py-1 px-2 rounded-xs text-[#848e9c] hover:text-[#eaecef] transition"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
          </svg>
          <span className="text-[10px] font-medium">Ayarlar</span>
        </button>
      </nav>

      {/* 4. Global Modals */}
      <IndicatorModal
        isOpen={isIndicatorModalOpen}
        onClose={() => setIsIndicatorModalOpen(false)}
        settings={indicatorSettings}
        onUpdateSettings={setIndicatorSettings}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        mode={mode}
        onModeChange={setMode}
        rateLimitStatus={rateLimitStatus}
        currentTrades={tradeHistory}
        onTradesRestored={(restored) => {
          // Update in-memory history if restored from DB
          setTradeHistory(restored);
        }}
        currentSymbol={selectedSymbol}
        onStrategyGenerated={(stratParams) => {
          if (stratParams) {
            const newStrat: Strategy = {
              id: `local-ai-strat-${Date.now()}`,
              name: stratParams.name || `Local AI Stratejisi (${selectedSymbol})`,
              category: 'custom',
              description: stratParams.description || 'Yerel AI Ajanı tarafından üretilen strateji',
              symbols: [selectedSymbol],
              timeframe: '1d',
              enabled: true,
              params: stratParams.params || {},
              totalSignals: 0,
              winRate: 0,
              profitPct: 0,
            };
            handleAddStrategy(newStrat);
          }
        }}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
