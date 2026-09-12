import React, { useState, useEffect } from 'react';
import { Strategy, Timeframe, TradingMode, Position, TradeLog } from '../../types/crypto';
import { ContinuousTradingBot, ContinuousBotConfig, BotStatus, BotSignalRecord } from '../../services/continuousTradingBot';
import { PaperTradingEngine } from '../../services/paperTradingEngine';
import { 
  Search, 
  Play, 
  Square, 
  Activity, 
  Zap, 
  Sliders, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  DollarSign,
  Radio,
  ExternalLink,
  Briefcase,
  XCircle,
  Percent,
  Flame,
  Target
} from 'lucide-react';

interface ScreenerProps {
  strategies: Strategy[];
  onSelectSymbol?: (symbol: string) => void;
  onNavigateToTab?: (tab: any) => void;
  mode?: TradingMode;
}

export const Screener: React.FC<ScreenerProps> = ({ 
  strategies, 
  onSelectSymbol, 
  onNavigateToTab,
  mode = 'PAPER'
}) => {
  const [config, setConfig] = useState<ContinuousBotConfig>(ContinuousTradingBot.getConfig());
  const [status, setStatus] = useState<BotStatus>(ContinuousTradingBot.getStatus());
  const [signals, setSignals] = useState<BotSignalRecord[]>(ContinuousTradingBot.getRecentSignals());
  const [logs, setLogs] = useState<string[]>(ContinuousTradingBot.getLogs());
  const [openPositions, setOpenPositions] = useState<Position[]>(
    PaperTradingEngine.getPositions().filter((p) => p.status === 'OPEN')
  );
  const [tradeHistory, setTradeHistory] = useState<TradeLog[]>(PaperTradingEngine.getTradeHistory());

  // Sync with background bot service and paper trading engine
  useEffect(() => {
    ContinuousTradingBot.init(strategies);
    ContinuousTradingBot.updateStrategies(strategies);

    const updateState = () => {
      setConfig(ContinuousTradingBot.getConfig());
      setStatus(ContinuousTradingBot.getStatus());
      setSignals(ContinuousTradingBot.getRecentSignals());
      setLogs(ContinuousTradingBot.getLogs());
      setOpenPositions(PaperTradingEngine.getPositions().filter((p) => p.status === 'OPEN'));
      setTradeHistory(PaperTradingEngine.getTradeHistory());
    };

    const unsubscribe = ContinuousTradingBot.subscribe(updateState);
    updateState();

    // Periodic UI poll every 1s for ultra-smooth PnL updates
    const interval = setInterval(updateState, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [strategies]);

  const handleToggleBot = () => {
    if (status.isRunning) {
      ContinuousTradingBot.stop();
    } else {
      ContinuousTradingBot.start(strategies);
    }
  };

  const handleConfigChange = (changes: Partial<ContinuousBotConfig>) => {
    ContinuousTradingBot.updateConfig(changes);
    setConfig(ContinuousTradingBot.getConfig());
  };

  const handleGoToCoin = (symbol: string) => {
    if (onSelectSymbol) onSelectSymbol(symbol);
    if (onNavigateToTab) onNavigateToTab('chart');
  };

  const handleClosePosition = (positionId: string, symbol: string) => {
    const success = PaperTradingEngine.closePosition(positionId, 'Kullanıcı Manuel Kapatma');
    if (success) {
      ContinuousTradingBot.addLog(`🛑 Pozisyon manuel olarak kapatıldı: ${symbol}`);
      setOpenPositions(PaperTradingEngine.getPositions().filter((p) => p.status === 'OPEN'));
      setTradeHistory(PaperTradingEngine.getTradeHistory());
    }
  };

  const handleCloseAllPositions = () => {
    if (openPositions.length === 0) return;
    if (window.confirm(`Açık olan ${openPositions.length} adet pozisyonun tümünü kapatmak istediğinize emin misiniz?`)) {
      const count = openPositions.length;
      PaperTradingEngine.triggerEmergencyKillSwitch();
      PaperTradingEngine.resetKillSwitch();
      ContinuousTradingBot.addLog(`🛑 TÜM POZİSYONLAR KAPATILDI (${count} adet işlem).`);
      setOpenPositions(PaperTradingEngine.getPositions().filter((p) => p.status === 'OPEN'));
      setTradeHistory(PaperTradingEngine.getTradeHistory());
    }
  };

  const progressPct = status.totalInCycle > 0 
    ? Math.min(100, Math.floor((status.scannedCountInCycle / status.totalInCycle) * 100))
    : 0;

  const totalOpenPnL = openPositions.reduce((acc, p) => acc + (p.unrealizedPnl || 0), 0);
  const totalOpenMargin = openPositions.reduce((acc, p) => acc + (p.margin || 0), 0);
  const totalOpenPnLPct = totalOpenMargin > 0 ? (totalOpenPnL / totalOpenMargin) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden gap-3 p-1 sm:p-2">
      {/* Top Banner: Bot Status & Master Trigger */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
            status.isRunning 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
          }`}>
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                7/24 Kesintisiz Piyasa Tarama & Otomatik Trading Botu
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                status.isRunning
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {status.isRunning ? 'AKTİF ÇALIŞIYOR' : 'DURDURULDU'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Piyasadaki fırsatları hiç durmadan döngüsel olarak tarar ve koşul sağlandığında otomatik alım-satım emirleri iletir.
            </p>
          </div>
        </div>

        {/* Master Start / Stop Action & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Auto-Trade toggle pill */}
          <button
            onClick={() => handleConfigChange({ autoTrade: !config.autoTrade })}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
              config.autoTrade
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-xs'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Otomatik Al-Sat: Sinyal tespit edildiğinde gerçek/simüle işlem aç"
          >
            <Zap className={`w-4 h-4 ${config.autoTrade ? 'text-cyan-400 fill-cyan-400' : 'text-slate-500'}`} />
            <span>Otomatik Al-Sat: <strong>{config.autoTrade ? 'AÇIK' : 'KAPALI (İzleme)'}</strong></span>
          </button>

          {/* Master Start / Stop Button */}
          <button
            id="btn-toggle-continuous-bot"
            onClick={handleToggleBot}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg text-sm font-mono min-h-[42px] ${
              status.isRunning
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
            }`}
          >
            {status.isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Otonom Botu Durdur</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Kesintisiz Başlat (7/24)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Config & Telemetry + Right Positions, Signals & Logs */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Column (4 cols): Configuration & Live Telemetry Metrics */}
        <div className="lg:col-span-4 flex flex-col gap-3 overflow-y-auto pr-1">
          {/* Live Telemetry Card */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                Canlı Bot Telemetrisi
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Döngü #{status.currentCycle}
              </span>
            </div>

            {/* Metric counters */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Taranan Toplam Mum</span>
                <span className="text-lg font-black font-mono text-slate-100">{status.totalScannedAllTime}</span>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Bulunan Sinyal</span>
                <span className="text-lg font-black font-mono text-cyan-400">{status.totalSignalsFound}</span>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Açılan Otomatik İşlem</span>
                <span className="text-lg font-black font-mono text-emerald-400">{status.totalTradesExecuted}</span>
              </div>
              <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-2.5">
                <span className="text-[10px] font-semibold text-slate-400 block">Şu An Taranan</span>
                <span className="text-sm font-bold font-mono text-amber-400 truncate block">
                  {status.currentSymbol || (status.isRunning ? 'Hazırlanıyor...' : 'Beklemede')}
                </span>
              </div>
            </div>

            {/* Cycle Progress Bar */}
            <div className="bg-[#0a0e17] rounded-xl p-3 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-400">Döngü İlerlemesi</span>
                <span className="text-cyan-400 font-bold">
                  {status.scannedCountInCycle} / {status.totalInCycle} (%{progressPct})
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bot Parameters & Risk Settings */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Otonom Tarama Parametreleri
              </span>
              <span className="text-[10px] font-mono text-slate-500">Otomatik Kaydedilir</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Strategy Selector */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Kullanılan Strateji Algoritması</label>
                <select
                  value={config.selectedStrategyId}
                  onChange={(e) => handleConfigChange({ selectedStrategyId: e.target.value })}
                  className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                >
                  {strategies.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pool & Timeframe */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Tarama Havuzu</label>
                  <select
                    value={config.scanPool}
                    onChange={(e) => handleConfigChange({ scanPool: e.target.value as any })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="top50">En Yüksek 50 Coin</option>
                    <option value="top100">En Yüksek 100 Coin</option>
                    <option value="favorites">Sadece Favorilerim</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Mum Zaman Dilimi</label>
                  <select
                    value={config.timeframe}
                    onChange={(e) => handleConfigChange({ timeframe: e.target.value as Timeframe })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-2.5 py-2 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="5m">5 Dakika (5m)</option>
                    <option value="15m">15 Dakika (15m)</option>
                    <option value="1h">1 Saat (1h)</option>
                    <option value="4h">4 Saat (4h)</option>
                    <option value="1d">1 Gün (1d)</option>
                  </select>
                </div>
              </div>

              {/* Trade Size & Max Open Positions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">İşlem Başına Tutar ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.orderSizeUSDT}
                      onChange={(e) => handleConfigChange({ orderSizeUSDT: Math.max(10, Number(e.target.value)) })}
                      className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 font-mono text-xs"
                      min={10}
                      step={50}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-500 font-mono">USDT</span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Maks. Açık Pozisyon</label>
                  <input
                    type="number"
                    value={config.maxOpenPositions}
                    onChange={(e) => handleConfigChange({ maxOpenPositions: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none focus:border-cyan-500 font-mono text-xs"
                    min={1}
                    max={20}
                  />
                </div>
              </div>

              {/* Take Profit & Stop Loss */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Kâr Al (TP %)</label>
                  <input
                    type="number"
                    value={config.takeProfitPct}
                    onChange={(e) => handleConfigChange({ takeProfitPct: Number(e.target.value) })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-2 py-2 text-emerald-400 outline-none focus:border-emerald-500 font-mono text-xs font-bold"
                    step={0.5}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Zarar Durdur (SL %)</label>
                  <input
                    type="number"
                    value={config.stopLossPct}
                    onChange={(e) => handleConfigChange({ stopLossPct: Number(e.target.value) })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-2 py-2 text-rose-400 outline-none focus:border-rose-500 font-mono text-xs font-bold"
                    step={0.5}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Takip Stop (%)</label>
                  <input
                    type="number"
                    value={config.trailingStopPct}
                    onChange={(e) => handleConfigChange({ trailingStopPct: Number(e.target.value) })}
                    className="w-full bg-[#0d111a] border border-slate-700 rounded-xl px-2 py-2 text-cyan-400 outline-none focus:border-cyan-500 font-mono text-xs font-bold"
                    step={0.5}
                  />
                </div>
              </div>

              {/* Cycle Cooldown */}
              <div>
                <label className="block font-semibold text-slate-400 mb-1">
                  Döngüler Arası Bekleme (Saniye): <span className="text-cyan-400 font-bold">{config.cycleCooldownSeconds}s</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={config.cycleCooldownSeconds}
                  onChange={(e) => handleConfigChange({ cycleCooldownSeconds: Number(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols): Active Opened Positions (ON TOP) + Discovered Signals (BELOW) + Live Logs */}
        <div className="lg:col-span-8 flex flex-col gap-3 overflow-y-auto">
          
          {/* SECTION 1: AÇILAN OTONOM İŞLEMLER & AKTİF POZİSYONLAR (PLACED ON TOP OF SIGNALS) */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">
                      Açılan Otonom İşlemler & Aktif Pozisyonlar
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                      {openPositions.length} Açık
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Otomatik tarayıcının sinyal yakalayıp açtığı canlı pozisyonlar
                  </p>
                </div>
              </div>

              {/* Summary Stats & Close All Button */}
              <div className="flex items-center gap-3">
                <div className="bg-[#151c2c] border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">Net PnL:</span>
                  <span className={`text-xs font-mono font-bold flex items-center gap-1 ${
                    totalOpenPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {totalOpenPnL >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{totalOpenPnL >= 0 ? '+' : ''}${totalOpenPnL.toFixed(2)} ({totalOpenPnLPct >= 0 ? '+' : ''}{totalOpenPnLPct.toFixed(2)}%)</span>
                  </span>
                </div>

                {openPositions.length > 0 && (
                  <button
                    onClick={handleCloseAllPositions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold transition-all shadow-xs"
                    title="Açık tüm otomatik işlemleri anında kapat"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tümünü Kapat</span>
                  </button>
                )}
              </div>
            </div>

            {/* Position Cards List */}
            <div className="space-y-2.5">
              {openPositions.length === 0 ? (
                <div className="bg-[#0a0e17] rounded-xl border border-slate-800/80 p-5 text-center flex flex-col items-center justify-center">
                  <Briefcase className="w-9 h-9 text-slate-600 mb-2 opacity-40" />
                  <p className="text-xs font-bold text-slate-300">Şu anda açık otonom pozisyon bulunmuyor</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 max-w-md">
                    Bot piyasayı tararken sinyal tespit ettiğinde açılan tüm emirler, canlı kâr/zarar ve TP/SL durumlarıyla burada listelenecektir.
                  </p>
                </div>
              ) : (
                openPositions.map((pos) => {
                  const isProfit = (pos.unrealizedPnl || 0) >= 0;
                  const pnl = pos.unrealizedPnl || 0;
                  const pnlPct = pos.unrealizedPnlPct || 0;
                  const priceChangePct = pos.entryPrice > 0 
                    ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100 
                    : 0;

                  return (
                    <div
                      key={pos.id}
                      className="bg-[#151c2c] border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 transition-all shadow-md"
                    >
                      {/* Left info */}
                      <div className="flex items-start md:items-center gap-3 w-full md:w-auto">
                        <div className={`px-2.5 py-1.5 rounded-xl font-bold font-mono text-xs border flex items-center gap-1 shrink-0 ${
                          pos.side === 'LONG' 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          <span>{pos.side}</span>
                          <span className="text-[10px] opacity-75">1x</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-sm">{pos.symbol}</span>
                            <span className="text-[11px] font-mono text-slate-400">
                              Teminat: <strong>${pos.margin.toFixed(2)} USDT</strong>
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              ({pos.amount.toFixed(4)} Coin)
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-slate-300 mt-1">
                            <span>Giriş: <strong className="text-slate-200">${pos.entryPrice < 1 ? pos.entryPrice.toFixed(5) : pos.entryPrice.toFixed(2)}</strong></span>
                            <span className="text-slate-600">•</span>
                            <span>Güncel: <strong className="text-slate-100">${pos.currentPrice < 1 ? pos.currentPrice.toFixed(5) : pos.currentPrice.toFixed(2)}</strong></span>
                            <span className="text-slate-600">•</span>
                            {pos.takeProfit && (
                              <span className="text-emerald-400 text-[11px]">
                                TP: ${pos.takeProfit < 1 ? pos.takeProfit.toFixed(5) : pos.takeProfit.toFixed(2)}
                              </span>
                            )}
                            {pos.stopLoss && (
                              <span className="text-rose-400 text-[11px]">
                                SL: ${pos.stopLoss < 1 ? pos.stopLoss.toFixed(5) : pos.stopLoss.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right PnL & Action Buttons */}
                      <div className="flex items-center justify-between md:justify-end gap-3.5 w-full md:w-auto border-t md:border-t-0 border-slate-800/80 pt-2.5 md:pt-0">
                        {/* Live PnL Box */}
                        <div className="text-right">
                          <div className={`text-base font-black font-mono flex items-center justify-end gap-1 ${
                            isProfit ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isProfit ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span>{isProfit ? '+' : ''}${pnl.toFixed(2)}</span>
                          </div>
                          <span className={`text-[11px] font-mono font-bold block ${
                            isProfit ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                          </span>
                        </div>

                        {/* Direct Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleGoToCoin(pos.symbol)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all border border-slate-700"
                            title="Grafikte İncele"
                          >
                            <span>Grafik</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleClosePosition(pos.id, pos.symbol)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-mono font-bold transition-all border border-rose-500/30"
                            title="Pozisyonu Şimdi Kapat"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Kapat</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 2: KEŞFEDİLEN SİNYALLER & FIRSATLAR (BELOW OPEN POSITIONS) */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-4 shadow-xl flex flex-col shrink-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-slate-100">
                  Keşfedilen Sinyaller & Fırsat Geçmişi ({signals.length})
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {status.isRunning ? 'Canlı Dinleniyor' : 'Bot Durduruldu'}
              </span>
            </div>

            {/* Signal Feed Cards */}
            <div className="bg-[#0a0e17] rounded-xl border border-slate-800/80 p-3 space-y-2.5 max-h-80 overflow-y-auto">
              {signals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <Search className="w-10 h-10 mb-2 opacity-20" />
                  <p className="font-bold text-slate-300 text-xs">Henüz sinyal yakalanmadı</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md font-mono">
                    Otonom botu başlattığınızda piyasa döngüsel olarak taranacak ve strateji kurallarınıza uyan tüm fırsatlar burada görünecektir.
                  </p>
                </div>
              ) : (
                signals.map((sig) => {
                  const isBuy = sig.action === 'BUY';
                  return (
                    <div
                      key={sig.id}
                      className="bg-[#151c2c] border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-start sm:items-center gap-3 w-full sm:w-auto">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold font-mono text-xs border ${
                          isBuy 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          {sig.action}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-100 text-xs sm:text-sm">{sig.symbol}</span>
                            <span className="text-xs font-mono font-bold text-slate-300">
                              ${sig.price < 1 ? sig.price.toFixed(5) : sig.price.toFixed(2)}
                            </span>
                            {sig.tradeExecuted && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                                OTOMATİK İŞLEM AÇILDI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                            <strong className="text-cyan-400 font-normal">[{sig.strategyName}]</strong> {sig.reason}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Timestamp and direct trade button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(sig.timestamp).toLocaleTimeString('tr-TR')}
                        </span>

                        <button
                          onClick={() => handleGoToCoin(sig.symbol)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all border border-slate-700"
                          title="Grafikte İncele"
                        >
                          <span>Grafik</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* SECTION 3: CANLI LOG KONSOLU */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-2xl p-3 shadow-xl flex flex-col shrink-0 h-40">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Otonom İşlem Konsolu (Canlı Loglar)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {logs.length} kayıt
              </span>
            </div>

            <div className="flex-1 bg-[#06090e] rounded-xl p-2.5 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-1 mt-2">
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-6">Konsol beklemede...</div>
              ) : (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`leading-relaxed ${
                      log.includes('OTOMATİK ALIM') || log.includes('SİNYAL BULUNDU') ? 'text-emerald-400 font-bold' :
                      log.includes('OTOMATİK POZİSYON KAPATILDI') ? 'text-cyan-300 font-bold' :
                      log.includes('DURDURULDU') ? 'text-rose-400' :
                      log.includes('BAŞLATILDI') ? 'text-amber-300 font-bold' : ''
                    }`}
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
