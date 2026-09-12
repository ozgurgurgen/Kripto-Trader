import React, { useState, useEffect, useRef } from 'react';
import { 
  ArbitrageOpportunity, 
  ExchangePriceQuote, 
  ArbitrageBotConfig, 
  ArbitrageExecutionTrade, 
  MarketMakingQuoteLevel,
  TradingMode 
} from '../../types/crypto';
import { ArbitrageService } from '../../services/arbitrageService';
import { 
  Scale, 
  Zap, 
  Layers, 
  Activity, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  DollarSign, 
  Play, 
  Pause, 
  TrendingUp, 
  Server, 
  Clock, 
  Percent, 
  BarChart2, 
  FileSpreadsheet, 
  Trash2, 
  Lock, 
  Flame,
  ArrowUpDown,
  Cpu,
  Check,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell 
} from 'recharts';

interface ArbitrageModuleProps {
  symbol: string;
  currentPrice: number;
  mode?: TradingMode;
}

export const ArbitrageModule: React.FC<ArbitrageModuleProps> = ({
  symbol,
  currentPrice,
  mode = 'PAPER',
}) => {
  // Config & State
  const [botConfig, setBotConfig] = useState<ArbitrageBotConfig>(() => ArbitrageService.getBotConfig());
  const [quotes, setQuotes] = useState<ExchangePriceQuote[]>(() => ArbitrageService.getExchangeQuotes(symbol, currentPrice));
  const [spatialOpps, setSpatialOpps] = useState<ArbitrageOpportunity[]>(() => 
    ArbitrageService.scanSpatialArbitrage(symbol, currentPrice, botConfig.targetExchanges, botConfig.orderSizeUsd)
  );
  const [triangularOpps, setTriangularOpps] = useState<ArbitrageOpportunity[]>(() => 
    ArbitrageService.scanTriangularArbitrage(currentPrice, botConfig.orderSizeUsd)
  );
  const [mmLadder, setMmLadder] = useState<MarketMakingQuoteLevel[]>(() => 
    ArbitrageService.getMarketMakingLadder(symbol, currentPrice)
  );
  const [history, setHistory] = useState<ArbitrageExecutionTrade[]>(() => ArbitrageService.getExecutionHistory());
  const [stats, setStats] = useState(() => ArbitrageService.getStats());

  // UI state
  const [activeSubTab, setActiveSubTab] = useState<'spatial' | 'triangular' | 'matrix' | 'market_making' | 'history'>('spatial');
  const [isScanning, setIsScanning] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [lastAutoTriggerTime, setLastAutoTriggerTime] = useState<number | null>(null);

  const autoPilotTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to service changes
  useEffect(() => {
    const unsubscribe = ArbitrageService.subscribe(() => {
      setHistory(ArbitrageService.getExecutionHistory());
      setStats(ArbitrageService.getStats());
      setBotConfig(ArbitrageService.getBotConfig());
    });
    return unsubscribe;
  }, []);

  // Refresh scan on price or symbol change
  const refreshScan = () => {
    const newQuotes = ArbitrageService.getExchangeQuotes(symbol, currentPrice);
    const newSpatial = ArbitrageService.scanSpatialArbitrage(symbol, currentPrice, botConfig.targetExchanges, botConfig.orderSizeUsd);
    const newTri = ArbitrageService.scanTriangularArbitrage(currentPrice, botConfig.orderSizeUsd);
    const newLadder = ArbitrageService.getMarketMakingLadder(symbol, currentPrice);

    setQuotes(newQuotes);
    setSpatialOpps(newSpatial);
    setTriangularOpps(newTri);
    setMmLadder(newLadder);
  };

  useEffect(() => {
    refreshScan();
  }, [symbol, currentPrice, botConfig.targetExchanges, botConfig.orderSizeUsd]);

  // Automated Market Making Auto-Pilot Interval
  useEffect(() => {
    if (autoPilotTimerRef.current) {
      clearInterval(autoPilotTimerRef.current);
      autoPilotTimerRef.current = null;
    }

    if (botConfig.enabled) {
      autoPilotTimerRef.current = setInterval(() => {
        refreshScan();
        const result = ArbitrageService.runAutoMarketMakingCycle(symbol, currentPrice);
        if (result.executed && result.trade) {
          setLastAutoTriggerTime(Date.now());
          setToastMessage({
            type: 'success',
            text: `[OTOMATİK ARB TETİKLENDİ] ${result.trade.buyExchange} ➔ ${result.trade.sellExchange} | Net Kâr: +$${result.trade.netProfitUsd.toFixed(2)} (+${result.trade.netProfitPct.toFixed(2)}%)`,
          });
          setTimeout(() => setToastMessage(null), 4000);
        }
      }, botConfig.executionIntervalSec * 1000);
    }

    return () => {
      if (autoPilotTimerRef.current) {
        clearInterval(autoPilotTimerRef.current);
      }
    };
  }, [botConfig.enabled, botConfig.executionIntervalSec, symbol, currentPrice, botConfig.minProfitThresholdPct, botConfig.orderSizeUsd, botConfig.targetExchanges]);

  // Toggle Bot
  const handleToggleBot = () => {
    const nextState = !botConfig.enabled;
    const updated = ArbitrageService.updateBotConfig({ enabled: nextState });
    setBotConfig(updated);
    setToastMessage({
      type: nextState ? 'success' : 'info',
      text: nextState 
        ? `Otomatik Arbitraj & Piyasa Yapıcı Botu BAŞLATILDI (Eşik: %${updated.minProfitThresholdPct.toFixed(2)})`
        : 'Otomatik Arbitraj Botu DURDURULDU',
    });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Manual Trigger
  const handleManualExecute = (opp: ArbitrageOpportunity) => {
    const trade = ArbitrageService.executeArbitrageOrder(opp, botConfig.orderSizeUsd);
    setToastMessage({
      type: 'success',
      text: `Başarılı İcra: ${trade.buyExchange} ➔ ${trade.sellExchange} | Net Kâr: +$${trade.netProfitUsd.toFixed(2)} (${trade.executionLatencyMs}ms)`,
    });
    setTimeout(() => setToastMessage(null), 4000);
    refreshScan();
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Tarih', 'Sembol', 'Tip', 'Alış Borsası', 'Alış Fiyatı', 'Satış Borsası', 'Satış Fiyatı', 'Hacim ($)', 'Net Kâr ($)', 'Net Kâr (%)', 'Gecikme (ms)', 'Durum'];
    const rows = history.map((t) => [
      t.id,
      new Date(t.timestamp).toISOString(),
      t.symbol,
      t.type,
      t.buyExchange,
      t.buyPrice,
      t.sellExchange,
      t.sellPrice,
      t.volumeUsd,
      t.netProfitUsd,
      t.netProfitPct,
      t.executionLatencyMs,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Arbitrage_Execution_Log_${symbol}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Find Best Bid & Ask across CEXs
  const bestBid = quotes.reduce((max, q) => q.bidPrice > max.bidPrice ? q : max, quotes[0] || { bidPrice: 0, exchangeName: '' });
  const bestAsk = quotes.reduce((min, q) => q.askPrice < min.askPrice ? q : min, quotes[0] || { askPrice: 999999, exchangeName: '' });
  const bestSpreadUsd = bestBid && bestAsk ? (bestBid.bidPrice - bestAsk.askPrice) : 0;
  const bestSpreadPct = bestAsk && bestAsk.askPrice > 0 ? (bestSpreadUsd / bestAsk.askPrice) * 100 : 0;

  return (
    <div className="space-y-4 max-w-[3840px] mx-auto pb-12">
      {/* 1. Main Header & Automated Bot Controller Bar */}
      <div className="bg-[#0e131f] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
              botConfig.enabled 
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-lg shadow-amber-500/20 animate-pulse' 
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <Scale className="w-6 h-6" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                  Çoklu Borsa Arbitraj & Otomatik Piyasa Yapıcı (AMM)
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
                  botConfig.enabled
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${botConfig.enabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                  {botConfig.enabled ? 'OTOPİLOT AKTİF' : 'BOT BEKLEMEDE'}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  7 Borsa Canlı
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Binance, Coinbase, Bybit, OKX, Kraken, Bitfinex ve KuCoin arasındaki anlık fiyat spreadlerini tarar; kâr eşiği (%{botConfig.minProfitThresholdPct.toFixed(2)}) aşıldığında otomatik çift-bacaklı piyasa yapıcı emirleri tetikler.
              </p>
            </div>
          </div>

          {/* Bot Control Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition ${
                isConfigOpen
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Parametreler</span>
            </button>

            <button
              onClick={refreshScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono font-bold hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
              <span>Yenile</span>
            </button>

            <button
              onClick={handleToggleBot}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition shadow-lg ${
                botConfig.enabled
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 shadow-red-500/10'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20'
              }`}
            >
              {botConfig.enabled ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Botu Durdur</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Otomatik Botu Başlat</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. Top Summary Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Toplam Net Arbitraj Kârı:
            </span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              +${stats.totalProfitUsd.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500">Komisyonlar ve Slipaj Sonrası</span>
          </div>

          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              İcra Edilen Emirler:
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {stats.totalTrades} <span className="text-xs text-slate-400 font-normal">İşlem</span>
            </div>
            <span className="text-[10px] text-slate-500">Dual-Leg Anlık Eşleşme</span>
          </div>

          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <BarChart2 className="w-3 h-3 text-cyan-400" />
              Toplam Arbitraj Hacmi:
            </span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              ${stats.totalVolumeUsd.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Dönen Likidite</span>
          </div>

          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Başarı Oranı (Win Rate):
            </span>
            <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
              %{stats.winRatePct.toFixed(0)}
            </div>
            <span className="text-[10px] text-slate-500">Risksiz Spread Koruması</span>
          </div>

          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              Ortalama İcra Hızı:
            </span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              {stats.avgLatencyMs} <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
            <span className="text-[10px] text-slate-500">Ultra Düşük Gecikme</span>
          </div>

          <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Percent className="w-3 h-3 text-amber-400" />
              Mevcut Maks. Spread:
            </span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${bestSpreadPct > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {bestSpreadPct > 0 ? `+${bestSpreadPct.toFixed(3)}%` : '0.00%'}
            </div>
            <span className="text-[10px] text-slate-500 truncate block">
              {bestAsk.exchangeName} ➔ {bestBid.exchangeName}
            </span>
          </div>
        </div>

        {/* 3. Collapsible Bot Config Drawer */}
        {isConfigOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800 bg-[#090d16] p-4 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white font-mono uppercase">
                  Otomatik Arbitraj & Piyasa Yapıcı (AMM) Bot Parametreleri
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Mod: <strong className="text-cyan-400">{mode === 'LIVE' ? 'GERÇEK BORSA API (ARMED)' : 'PAPER SİMÜLASYON'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Min Profit Threshold */}
              <div className="bg-[#101625] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Minimum Net Kâr Eşiği (%):</span>
                  <strong className="text-emerald-400">%{botConfig.minProfitThresholdPct.toFixed(2)}</strong>
                </label>
                <input
                  type="range"
                  min="0.05"
                  max="1.50"
                  step="0.05"
                  value={botConfig.minProfitThresholdPct}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setBotConfig(ArbitrageService.updateBotConfig({ minProfitThresholdPct: val }));
                  }}
                  className="w-full accent-amber-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Komisyon ve slipaj sonrası net kâr bu değerin üzerindeyse emir verilir.
                </span>
              </div>

              {/* Order Size */}
              <div className="bg-[#101625] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>İşlem Büyüklüğü ($ USD):</span>
                  <strong className="text-cyan-400">${botConfig.orderSizeUsd.toLocaleString()}</strong>
                </label>
                <input
                  type="number"
                  min="500"
                  max="50000"
                  step="500"
                  value={botConfig.orderSizeUsd}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1000;
                    setBotConfig(ArbitrageService.updateBotConfig({ orderSizeUsd: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block">
                  Her iki borsada eşzamanlı açılacak pozisyon tutarı.
                </span>
              </div>

              {/* Scan Interval */}
              <div className="bg-[#101625] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono flex justify-between">
                  <span>Tarama & İcra Aralığı:</span>
                  <strong className="text-amber-400">{botConfig.executionIntervalSec} Saniye</strong>
                </label>
                <select
                  value={botConfig.executionIntervalSec}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 3;
                    setBotConfig(ArbitrageService.updateBotConfig({ executionIntervalSec: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                >
                  <option value={1}>1 Saniye (Yüksek Hızlı HFT)</option>
                  <option value={2}>2 Saniye (Önerilen Hızlı)</option>
                  <option value={3}>3 Saniye (Dengeli)</option>
                  <option value={5}>5 Saniye (Düşük API Yükü)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  Fiyat değişimlerini dinleme ve otomatik tetikleme sıklığı.
                </span>
              </div>

              {/* Auto Hedge & Slippage */}
              <div className="bg-[#101625] border border-slate-800 p-3 rounded-xl space-y-1.5">
                <label className="text-[11px] text-slate-400 font-mono block">
                  Otomatik Koruma & Slipaj:
                </label>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-300 font-mono">Delta-Neutral Hedging</span>
                  <button
                    onClick={() => {
                      setBotConfig(ArbitrageService.updateBotConfig({ autoHedge: !botConfig.autoHedge }));
                    }}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition ${
                      botConfig.autoHedge
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {botConfig.autoHedge ? 'AKTİF' : 'PASİF'}
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Kısmi dolum durumunda ters bacak anında piyasa emriyle korunur.
                </span>
              </div>
            </div>

            {/* Target Exchanges Checkboxes */}
            <div className="bg-[#101625] border border-slate-800 p-3 rounded-xl">
              <label className="text-[11px] text-slate-400 font-mono block mb-2">
                Taranacak ve İşlem Yapılacak Merkezi Borsalar (CEX):
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {['Binance', 'Coinbase', 'Bybit', 'OKX', 'Kraken', 'Bitfinex', 'KuCoin'].map((exName) => {
                  const isChecked = botConfig.targetExchanges.includes(exName);
                  return (
                    <button
                      key={exName}
                      type="button"
                      onClick={() => {
                        const newExchanges = isChecked
                          ? botConfig.targetExchanges.filter((e) => e !== exName)
                          : [...botConfig.targetExchanges, exName];
                        if (newExchanges.length >= 2) {
                          setBotConfig(ArbitrageService.updateBotConfig({ targetExchanges: newExchanges }));
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition ${
                        isChecked
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isChecked ? 'bg-cyan-400' : 'bg-slate-600'}`} />
                      <span>{exName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast / Notification Bar */}
      {toastMessage && (
        <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center justify-between transition-all animate-fade-in ${
          toastMessage.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : toastMessage.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 bg-[#101522] border border-slate-800/80 p-2 rounded-xl overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('spatial')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
            activeSubTab === 'spatial'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Borsalar Arası Arbitraj & Otomasyon ({spatialOpps.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triangular')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
            activeSubTab === 'triangular'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Üçgen Arbitraj Döngüleri ({triangularOpps.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Canlı Fiyat & Likidite Matrisi (7 CEX)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('market_making')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
            activeSubTab === 'market_making'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Piyasa Yapıcı (MM) Derinlik Merdiveni</span>
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition whitespace-nowrap ${
            activeSubTab === 'history'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>İcra & İşlem Günlüğü ({history.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: Spatial Arbitrage Opportunities */}
      {activeSubTab === 'spatial' && (
        <div className="space-y-3">
          {spatialOpps.length === 0 ? (
            <div className="p-12 text-center bg-[#0e131f] border border-slate-800 rounded-2xl space-y-3">
              <Scale className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold font-mono text-slate-300">Şu an net kâr eşiğini aşan mekânsal arbitraj bulunamadı</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Borsalar arasındaki fiyat makası komisyon oranlarının (%0.15) altında. Fiyat dalgalanmaları oluştukça otomatik bot devreye girecektir.
              </p>
            </div>
          ) : (
            spatialOpps.map((opp) => {
              const meetsThreshold = opp.netProfitPct >= botConfig.minProfitThresholdPct;
              return (
                <div
                  key={opp.id}
                  className={`bg-[#0e131f] border rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition shadow-lg ${
                    meetsThreshold
                      ? 'border-amber-500/50 hover:border-amber-400 bg-gradient-to-r from-[#0e131f] to-[#121929]'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Direction & Route */}
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        meetsThreshold
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}>
                        {meetsThreshold ? 'OTOMATİK TETİKLEME UYGUN' : 'SPATIAL SPREAD'}
                      </span>
                      <span className="text-xs font-mono font-bold text-white">{opp.symbol}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Güvenilirlik Puanı: <strong className="text-cyan-400">%{opp.confidenceScore}</strong>
                      </span>
                    </div>

                    {/* Visual Route */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                      {/* BUY LEG */}
                      <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-xl border border-emerald-500/30">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">1. AL:</span>
                        <span className="text-white font-bold">{opp.buyExchange}</span>
                        <span className="text-emerald-400 font-bold">${opp.buyPrice.toFixed(2)}</span>
                      </div>

                      <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />

                      {/* SELL LEG */}
                      <div className="flex items-center gap-2 bg-slate-950/90 px-3 py-2 rounded-xl border border-red-500/30">
                        <span className="text-slate-500 text-[10px] uppercase font-bold">2. SAT:</span>
                        <span className="text-white font-bold">{opp.sellExchange}</span>
                        <span className="text-red-400 font-bold">${opp.sellPrice.toFixed(2)}</span>
                      </div>

                      <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-2 rounded-xl border border-slate-800">
                        <span>Brüt Fark:</span>
                        <strong className="text-slate-200">+{opp.grossSpreadPct.toFixed(3)}%</strong>
                        <span className="text-slate-500 ml-1">(Komisyon: -{opp.estimatedFeePct.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Profit Calculation & Instant Execution Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-[11px] text-slate-400">Tahmini Net Getiri ({botConfig.orderSizeUsd}$ Hacim):</div>
                      <div className="text-lg font-bold text-emerald-400">
                        +${opp.estimatedProfitUsd.toFixed(2)}{' '}
                        <span className="text-xs text-emerald-300 font-semibold">(+{opp.netProfitPct.toFixed(2)}%)</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Maks Kapasite: ${opp.maxExecSizeUsd.toLocaleString()}</div>
                    </div>

                    <button
                      onClick={() => handleManualExecute(opp)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-98"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Tek Tıkla İcra Et</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-TAB 2: Triangular Arbitrage Loops */}
      {activeSubTab === 'triangular' && (
        <div className="space-y-3">
          {triangularOpps.map((opp) => (
            <div
              key={opp.id}
              className="bg-[#0e131f] border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 space-y-3.5 transition shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    3-LEG TRIANGULAR LOOP
                  </span>
                  <span className="text-xs font-mono font-bold text-white">{opp.symbol}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Yürütme Borsa Motoru: <strong className="text-slate-200">{opp.buyExchange}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400">Döngü Net Kârı: </span>
                    <span className="text-emerald-400 font-bold">
                      +${opp.estimatedProfitUsd.toFixed(2)} (+{opp.netProfitPct.toFixed(3)}%)
                    </span>
                  </div>

                  <button
                    onClick={() => handleManualExecute(opp)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Döngüyü İcra Et</span>
                  </button>
                </div>
              </div>

              {/* 3 Steps Visual Flow */}
              {opp.path && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                  {opp.path.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs font-mono text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[11px] font-bold text-cyan-300 shrink-0">
                        {idx + 1}
                      </div>
                      <span className="font-semibold">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SUB-TAB 3: Unified 7-CEX Matrix */}
      {activeSubTab === 'matrix' && (
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#101522]">
            <div>
              <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Birleşik Borsa Fiyat & Derinlik Matrisi ({symbol})</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Top 7 Merkezi Borsadan eşzamanlı WebSocket/REST fiyat akışı ve likidite derinlikleri
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-slate-500">En İyi Fırsat:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
                {bestAsk.exchangeName} (${bestAsk.askPrice.toFixed(1)}) ➔ {bestBid.exchangeName} (${bestBid.bidPrice.toFixed(1)})
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-left">
                  <th className="p-3">Borsa Adı</th>
                  <th className="p-3">Alış (Bid Fiyatı)</th>
                  <th className="p-3">Satış (Ask Fiyatı)</th>
                  <th className="p-3">İç Spread</th>
                  <th className="p-3">24s Hacim</th>
                  <th className="p-3">Emir Defteri Derinliği</th>
                  <th className="p-3">API Ping</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {quotes.map((q) => {
                  const isBestBid = q.exchangeName === bestBid.exchangeName;
                  const isBestAsk = q.exchangeName === bestAsk.exchangeName;

                  return (
                    <tr key={q.exchangeName} className="hover:bg-slate-800/20 transition">
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{q.exchangeName}</span>
                        {isBestBid && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30">
                            EN YÜKSEK BİD
                          </span>
                        )}
                        {isBestAsk && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            EN UCUZ ASK
                          </span>
                        )}
                      </td>
                      <td className={`p-3 font-bold ${isBestBid ? 'text-emerald-300 bg-emerald-500/5' : 'text-emerald-400'}`}>
                        ${q.bidPrice.toFixed(2)}
                      </td>
                      <td className={`p-3 font-bold ${isBestAsk ? 'text-red-300 bg-red-500/5' : 'text-red-400'}`}>
                        ${q.askPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-slate-300">%{q.spreadPct.toFixed(3)}</td>
                      <td className="p-3 text-slate-400">${(q.volume24hUsd / 1000000).toFixed(1)}M</td>
                      <td className="p-3 text-slate-400">
                        <span className="text-emerald-400">${(q.depthBidUsd / 1000000).toFixed(1)}M Bid</span> /{' '}
                        <span className="text-red-400">${(q.depthAskUsd / 1000000).toFixed(1)}M Ask</span>
                      </td>
                      <td className="p-3 text-slate-400 font-mono">
                        <span className={q.latencyMs < 25 ? 'text-emerald-400' : 'text-amber-400'}>
                          {q.latencyMs} ms
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          CANLI / AKTİF
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Market Making Ladder */}
      {activeSubTab === 'market_making' && (
        <div className="space-y-4">
          <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  <span>Çapraz Borsa Piyasa Yapıcı (Market Making) Kotasyon Merdiveni</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Farklı borsalarda karşılıklı Limit Alış (Bid) ve Limit Satış (Ask) emirleri yerleştirerek spread kârı ve Maker komisyon iadelerini (Rebate) toplayan çift taraflı kotasyon yapısı.
                </p>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-slate-500 block">Strateji Modu:</span>
                <span className="text-amber-400 font-bold">Delta-Neutral Spread Harvester</span>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-left">
                    <th className="p-3">Kademe</th>
                    <th className="p-3">Alış Borsası</th>
                    <th className="p-3">Alış Kotasyonu ($)</th>
                    <th className="p-3">Satış Borsası</th>
                    <th className="p-3">Satış Kotasyonu ($)</th>
                    <th className="p-3">Brüt Spread (%)</th>
                    <th className="p-3 text-right">Hedef MM Kârı ($5K)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {mmLadder.map((lvl) => (
                    <tr key={lvl.level} className="hover:bg-slate-800/20">
                      <td className="p-3 font-bold text-amber-400">Level #{lvl.level}</td>
                      <td className="p-3 text-white font-bold">{lvl.bidExchange}</td>
                      <td className="p-3 text-emerald-400 font-bold">${lvl.bidPrice.toFixed(2)}</td>
                      <td className="p-3 text-white font-bold">{lvl.askExchange}</td>
                      <td className="p-3 text-red-400 font-bold">${lvl.askPrice.toFixed(2)}</td>
                      <td className="p-3 text-cyan-400 font-bold">%{lvl.spreadPct.toFixed(3)}</td>
                      <td className="p-3 text-right font-bold text-emerald-400">
                        +${lvl.targetProfitUsd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: Execution Log & Audit Trail */}
      {activeSubTab === 'history' && (
        <div className="bg-[#0e131f] border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#101522]">
            <div>
              <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Arbitraj & Piyasa Yapıcı İcra Geçmişi (Execution Audit)</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Otomatik bot ve manuel icraların çift-bacaklı gerçekleşme kayıtları, ödenen komisyonlar ve net kârlar
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV Olarak İndir</span>
              </button>

              <button
                onClick={() => ArbitrageService.clearHistory()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-300 text-xs font-mono font-bold border border-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Temizle</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-left">
                  <th className="p-3">Zaman</th>
                  <th className="p-3">İşlem Tipi</th>
                  <th className="p-3">Borsa Rotası</th>
                  <th className="p-3">Alış / Satış Fiyatları</th>
                  <th className="p-3">Hacim ($)</th>
                  <th className="p-3">Ödenen Komisyon</th>
                  <th className="p-3">Net Realize Kâr</th>
                  <th className="p-3">Gecikme</th>
                  <th className="p-3 text-right">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500 font-mono">
                      Henüz icra edilmiş arbitraj işlemi bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  history.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/20">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                        <span>{t.buyExchange}</span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span>{t.sellExchange}</span>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">
                        <span className="text-emerald-400">${t.buyPrice.toFixed(2)}</span> /{' '}
                        <span className="text-red-400">${t.sellPrice.toFixed(2)}</span>
                      </td>
                      <td className="p-3 text-slate-300">${t.volumeUsd.toLocaleString()}</td>
                      <td className="p-3 text-red-400">-${t.feesPaidUsd.toFixed(2)}</td>
                      <td className="p-3 font-bold text-emerald-400">
                        +${t.netProfitUsd.toFixed(2)} <span className="text-[10px] text-slate-400">(+{t.netProfitPct.toFixed(2)}%)</span>
                      </td>
                      <td className="p-3 text-slate-400">{t.executionLatencyMs} ms</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
