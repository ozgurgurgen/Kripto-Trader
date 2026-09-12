import React, { useState, useMemo } from 'react';
import { TradeLog } from '../../types/crypto';
import { PaperTradingEngine } from '../../services/paperTradingEngine';
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Scale, 
  Award, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Trash2, 
  Filter, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  XCircle,
  Activity,
  BarChart3,
  Calendar,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';

interface PerformanceDashboardProps {
  tradeHistory?: TradeLog[];
  onRefresh?: () => void;
}

const PIE_COLORS = {
  WIN: '#10b981', // emerald-500
  LOSS: '#f43f5e', // rose-500
  BREAKEVEN: '#64748b', // slate-500
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  tradeHistory = [],
  onRefresh,
}) => {
  const [timeFilter, setTimeFilter] = useState<'ALL' | '7D' | '30D'>('ALL');
  const [symbolFilter, setSymbolFilter] = useState<string>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [sortField, setSortField] = useState<'date' | 'pnl' | 'pnlPct'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  const account = PaperTradingEngine.getAccountSummary();

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Filter trades based on controls
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const safeTrades = tradeHistory || [];
    return safeTrades.filter((t) => {
      // Time filter
      if (timeFilter === '7D' && t.exitTime < now - 7 * 86400000) return false;
      if (timeFilter === '30D' && t.exitTime < now - 30 * 86400000) return false;

      // Symbol filter
      if (symbolFilter !== 'ALL' && t.symbol !== symbolFilter) return false;

      // Outcome filter
      if (outcomeFilter === 'WINS' && t.pnl <= 0) return false;
      if (outcomeFilter === 'LOSSES' && t.pnl >= 0) return false;

      // Side filter
      if (sideFilter !== 'ALL' && t.side !== sideFilter) return false;

      return true;
    });
  }, [tradeHistory, timeFilter, symbolFilter, outcomeFilter, sideFilter]);

  // 2. Performance metrics based on filtered or all trades
  const metrics = useMemo(() => {
    return PaperTradingEngine.calculatePerformanceMetrics(filteredTrades, account.initialBalance);
  }, [filteredTrades, account.initialBalance]);

  // 3. Unique symbols for dropdown
  const uniqueSymbols = useMemo(() => {
    const syms = Array.from(new Set(tradeHistory.map((t) => t.symbol)));
    return syms.sort();
  }, [tradeHistory]);

  // 4. Sorted trade list for display
  const displayTrades = useMemo(() => {
    const list = [...filteredTrades];
    list.sort((a, b) => {
      if (sortField === 'date') {
        return sortAsc ? a.exitTime - b.exitTime : b.exitTime - a.exitTime;
      }
      if (sortField === 'pnl') {
        return sortAsc ? a.pnl - b.pnl : b.pnl - a.pnl;
      }
      if (sortField === 'pnlPct') {
        return sortAsc ? a.pnlPct - b.pnlPct : b.pnlPct - a.pnlPct;
      }
      return 0;
    });
    return list;
  }, [filteredTrades, sortField, sortAsc]);

  // 5. Pie data for Win vs Loss
  const pieData = useMemo(() => {
    return [
      { name: 'Kazançlı (Wins)', value: metrics.winTrades, color: PIE_COLORS.WIN },
      { name: 'Kayıplı (Losses)', value: metrics.lossTrades, color: PIE_COLORS.LOSS },
      ...(metrics.breakevenTrades > 0
        ? [{ name: 'Başa Baş (Breakeven)', value: metrics.breakevenTrades, color: PIE_COLORS.BREAKEVEN }]
        : []),
    ].filter((d) => d.value > 0);
  }, [metrics]);

  // 6. Individual trade bar chart data
  const tradeBarData = useMemo(() => {
    return [...filteredTrades]
      .sort((a, b) => a.exitTime - b.exitTime)
      .map((t, idx) => ({
        index: idx + 1,
        id: t.id,
        symbol: t.symbol,
        side: t.side,
        pnl: Number(t.pnl.toFixed(2)),
        pnlPct: Number(t.pnlPct.toFixed(2)),
        time: new Date(t.exitTime).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        isWin: t.pnl > 0,
      }));
  }, [filteredTrades]);

  // 7. Symbol Breakdown list
  const symbolStatsList = useMemo(() => {
    return Object.entries(metrics.symbolBreakdown).map(([sym, stats]: [string, any]) => {
      const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
      const profitFactor = stats.grossLoss > 0 ? stats.grossProfit / stats.grossLoss : stats.grossProfit > 0 ? 99.9 : 0;
      return {
        symbol: sym,
        trades: stats.trades,
        wins: stats.wins,
        losses: stats.trades - stats.wins,
        winRate,
        profitFactor,
        pnl: stats.pnl,
      };
    }).sort((a, b) => b.pnl - a.pnl);
  }, [metrics.symbolBreakdown]);

  // Action handlers
  const handleExportCSV = () => {
    const csv = PaperTradingEngine.exportTradesCSV(filteredTrades);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kriptobot_performans_raporu_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('İşlem geçmişi başarıyla CSV formatında dışa aktarıldı.');
  };

  const handleSeedDemo = () => {
    PaperTradingEngine.seedSampleTrades();
    onRefresh();
    showNotification('Örnek işlem geçmişi ve performans verileri yüklendi.');
  };

  const handleResetHistory = () => {
    if (window.confirm('Tüm işlem geçmişini sıfırlamak ve kasayı $10,000 başlangıç bakiyesine çekmek istediğinize emin misiniz?')) {
      PaperTradingEngine.clearTradeHistory();
      onRefresh();
      showNotification('İşlem geçmişi sıfırlandı.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-1 h-full overflow-y-auto font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-14 right-6 z-50 px-4 py-2.5 bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs font-semibold rounded-lg shadow-xl backdrop-blur flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* 1. Header Toolbar & Action Controls */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 font-mono">Performans & Kâr/Zarar Gösterge Paneli</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {metrics.totalTrades} İşlem Kaydı
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Kazanma oranları (Win Rate), kâr faktörü (Profit Factor), getiri beklentisi ve kümülatif PnL zaman eğrisi analizi
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-seed-demo-trades"
            onClick={handleSeedDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-colors"
            title="Örnek veriler yükle"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Örnek Veri Yükle</span>
          </button>

          <button
            id="btn-export-trades-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            title="CSV Dışa Aktar"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV İndir</span>
          </button>

          <button
            id="btn-clear-trade-history"
            onClick={handleResetHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
            title="Geçmişi Sıfırla"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Sıfırla</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Filter Bar */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-semibold">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>Filtreler:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Time Filter */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 font-mono text-[11px]">
            {(['ALL', '30D', '7D'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-2.5 py-1 rounded font-semibold transition-all ${
                  timeFilter === t
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t === 'ALL' ? 'Tüm Zamanlar' : t === '30D' ? 'Son 30 Gün' : 'Son 7 Gün'}
              </button>
            ))}
          </div>

          {/* Symbol Filter */}
          <select
            value={symbolFilter}
            onChange={(e) => setSymbolFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Tüm Çiftler ({uniqueSymbols.length})</option>
            {uniqueSymbols.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>

          {/* Outcome Filter */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`px-2 py-1 rounded transition-all ${
                outcomeFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setOutcomeFilter('WINS')}
              className={`px-2 py-1 rounded transition-all ${
                outcomeFilter === 'WINS' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yalnız Kazançlar
            </button>
            <button
              onClick={() => setOutcomeFilter('LOSSES')}
              className={`px-2 py-1 rounded transition-all ${
                outcomeFilter === 'LOSSES' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yalnız Kayıplar
            </button>
          </div>

          {/* Side Filter */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => setSideFilter('ALL')}
              className={`px-2 py-1 rounded transition-all ${
                sideFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yön: Tümü
            </button>
            <button
              onClick={() => setSideFilter('LONG')}
              className={`px-2 py-1 rounded transition-all ${
                sideFilter === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => setSideFilter('SHORT')}
              className={`px-2 py-1 rounded transition-all ${
                sideFilter === 'SHORT' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SHORT
            </button>
          </div>
        </div>
      </div>

      {/* 3. Primary KPI Metric Cards (5 key metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Win Rate */}
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Kazanma Oranı (Win Rate)</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-emerald-400">
              %{metrics.winRatePct.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span className="text-emerald-400">{metrics.winTrades} Kazanç</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400">{metrics.lossTrades} Kayıp</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden flex mt-2 border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, metrics.winRatePct)}%` }}
            />
            <div
              className="bg-rose-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(100, 100 - metrics.winRatePct)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex justify-between font-mono">
            <span>LONG: %{metrics.longWinRate.toFixed(0)}</span>
            <span>SHORT: %{metrics.shortWinRate.toFixed(0)}</span>
          </div>
        </div>

        {/* KPI 2: Profit Factor */}
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Kâr Faktörü (Profit Factor)</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className={`text-2xl font-black font-mono ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : metrics.profitFactor >= 1 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {metrics.profitFactor >= 99 ? '∞ (Kayıpsız)' : metrics.profitFactor.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span className="text-emerald-400 font-semibold">+${metrics.grossProfit.toFixed(0)}</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 font-semibold">-${metrics.grossLoss.toFixed(0)}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex justify-between font-mono">
            <span>Brüt Kâr: +${metrics.grossProfit.toFixed(1)}</span>
            <span>Brüt Zarar: -${metrics.grossLoss.toFixed(1)}</span>
          </div>
        </div>

        {/* KPI 3: Cumulative Net PnL */}
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Kümülatif Net K/Z (PnL)</span>
            <div className={`p-1.5 rounded-md ${metrics.netPnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {metrics.netPnl >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="my-1">
            <div className={`text-2xl font-black font-mono ${metrics.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.netPnl >= 0 ? '+' : ''}${metrics.netPnl.toFixed(2)}
            </div>
            <div className={`text-[11px] font-mono mt-1 ${metrics.netReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.netReturnPct >= 0 ? '+' : ''}{metrics.netReturnPct.toFixed(2)}% ROI
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex justify-between font-mono">
            <span>En İyi: +${metrics.maxWin.toFixed(0)}</span>
            <span>En Kötü: -${metrics.maxLoss.toFixed(0)}</span>
          </div>
        </div>

        {/* KPI 4: Payoff Ratio */}
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Ortalama Kâr / Zarar (Payoff)</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className="text-2xl font-black font-mono text-slate-100">
              {metrics.payoffRatio >= 99 ? '∞' : `${metrics.payoffRatio.toFixed(2)} R`}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span className="text-emerald-400">Ort. Kazanç: +${metrics.avgWinPnl.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex justify-between font-mono">
            <span>Ort. Zarar: -${metrics.avgLossPnl.toFixed(1)}</span>
            <span>Ort. İşlem: ${metrics.avgTradePnl.toFixed(1)}</span>
          </div>
        </div>

        {/* KPI 5: Expectancy & Streaks */}
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">İşlem Başına Beklenti</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="my-1">
            <div className={`text-2xl font-black font-mono ${metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-mono">
              <span>Maks Drawdown:</span>
              <span className="text-rose-400 font-semibold">-%{metrics.maxDrawdownPct.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60 flex justify-between font-mono">
            <span className="text-emerald-400 font-semibold">{metrics.maxConsecutiveWins}x Seri Kazanç</span>
            <span className="text-rose-400 font-semibold">{metrics.maxConsecutiveLosses}x Seri Kayıp</span>
          </div>
        </div>
      </div>

      {/* 4. MAIN CHART: Cumulative PnL Over Time (Recharts AreaChart) */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Zaman İçinde Kümülatif Kâr / Zarar Eğrisi (Cumulative PnL Curve)
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Kümülatif PnL ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Kasa Bakiyesi (${account.balanceUSDT.toFixed(0)})</span>
            </div>
          </div>
        </div>

        {metrics.cumulativeCurve.length <= 1 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Görüntülenecek işlem geçmişi bulunmuyor. Üst kısımdan "Örnek Veri Yükle" butonuna tıklayarak veya yeni emir vererek eğriyi oluşturabilirsiniz.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.cumulativeCurve} margin={{ top: 10, right: 15, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGradPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1017',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(val: any, name: string) => {
                    if (name === 'cumulativePnl') {
                      return [`${val >= 0 ? '+' : ''}$${val.toFixed(2)}`, 'Kümülatif PnL'];
                    }
                    if (name === 'equity') {
                      return [`$${val.toFixed(2)}`, 'Toplam Bakiye'];
                    }
                    return [val, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const item = payload && payload[0] ? payload[0].payload : null;
                    if (item && item.symbol !== 'START') {
                      return `${label} | ${item.symbol} (${item.side}) | İşlem: ${item.tradePnl >= 0 ? '+' : ''}$${item.tradePnl.toFixed(2)}`;
                    }
                    return label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#pnlGradPositive)"
                  name="cumulativePnl"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. TWO SUPPORTING CHARTS (Win/Loss Donut & Individual Trade PnL Bars) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Chart A: Win Rate Breakdown Donut (4 cols) */}
        <div className="lg:col-span-4 bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 font-mono">Kazanma Dağılımı</h3>
            <span className="text-xs font-mono text-emerald-400 font-bold">%{metrics.winRatePct.toFixed(1)} Win</span>
          </div>

          <div className="h-56 relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-500 text-xs">Veri yok</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b0f17" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0c1017',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                      formatter={(value: any, name: string) => [`${value} işlem`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric label */}
                <div className="absolute text-center pointer-events-none">
                  <div className="text-lg font-black font-mono text-slate-100">
                    %{metrics.winRatePct.toFixed(0)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Win Rate</div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-800/80">
            <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Kazançlar
              </span>
              <span className="text-emerald-400 font-bold text-sm mt-0.5">
                {metrics.winTrades} ({((metrics.winTrades / Math.max(1, metrics.totalTrades)) * 100).toFixed(0)}%)
              </span>
            </div>

            <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 flex flex-col">
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-400" /> Kayıplar
              </span>
              <span className="text-rose-400 font-bold text-sm mt-0.5">
                {metrics.lossTrades} ({((metrics.lossTrades / Math.max(1, metrics.totalTrades)) * 100).toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Chart B: Individual Trade PnL Bar Distribution (8 cols) */}
        <div className="lg:col-span-8 bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                İşlem Bazında Kâr / Zarar Dağılımı (Trade-by-Trade PnL)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400 font-semibold">Ort. Kâr: +${metrics.avgWinPnl.toFixed(0)}</span>
              <span className="text-rose-400 font-semibold">Ort. Zarar: -${metrics.avgLossPnl.toFixed(0)}</span>
            </div>
          </div>

          {tradeBarData.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">İşlem verisi yok</div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tradeBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="index" 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `#${val}`}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                  {metrics.avgWinPnl > 0 && (
                    <ReferenceLine y={metrics.avgWinPnl} stroke="#10b981" strokeDasharray="2 2" />
                  )}
                  {metrics.avgLossPnl > 0 && (
                    <ReferenceLine y={-metrics.avgLossPnl} stroke="#f43f5e" strokeDasharray="2 2" />
                  )}
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1017',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                    formatter={(value: any, name: string, item: any) => {
                      const payload = item?.payload;
                      return [
                        `${value >= 0 ? '+' : ''}$${value} (${payload?.pnlPct >= 0 ? '+' : ''}${payload?.pnlPct}%)`,
                        `${payload?.symbol} (${payload?.side})`,
                      ];
                    }}
                    labelFormatter={(val) => `İşlem #${val}`}
                  />
                  <Bar dataKey="pnl">
                    {tradeBarData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
                        fillOpacity={0.85}
                        radius={3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick stats footer */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
            <span>Toplam Komisyon: ${metrics.totalCommissions.toFixed(2)}</span>
            <span>Net K/Z: <span className={metrics.netPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{metrics.netPnl >= 0 ? '+' : ''}${metrics.netPnl.toFixed(2)}</span></span>
          </div>
        </div>
      </div>

      {/* 6. SYMBOL / PAIR BREAKDOWN SECTION */}
      {symbolStatsList.length > 0 && (
        <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 font-mono">Varlık & Çift Bazında Performans Dağılımı</h3>
            <span className="text-xs font-mono text-slate-400">{symbolStatsList.length} Aktif Çift</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {symbolStatsList.map((stat) => (
              <div key={stat.symbol} className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-3 font-mono text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-100">{stat.symbol}</span>
                  <span className={`font-bold ${stat.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {stat.pnl >= 0 ? '+' : ''}${stat.pnl.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>İşlem Sayısı:</span>
                    <span className="text-slate-200">{stat.trades} ({stat.wins}K / {stat.losses}Z)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Win Rate:</span>
                    <span className="text-emerald-400 font-semibold">%{stat.winRate.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kâr Faktörü:</span>
                    <span className="text-cyan-400">{stat.profitFactor >= 99 ? '∞' : stat.profitFactor.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. DETAILED CLOSED TRADE HISTORY TABLE */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              Kapanmış İşlem Günlüğü ({displayTrades.length} / {tradeHistory.length})
            </h3>
          </div>

          {/* Sort controls */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400 text-[11px]">Sırala:</span>
            <button
              onClick={() => {
                if (sortField === 'date') setSortAsc(!sortAsc);
                else { setSortField('date'); setSortAsc(false); }
              }}
              className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                sortField === 'date'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Tarih {sortField === 'date' ? (sortAsc ? '↑' : '↓') : ''}
            </button>
            <button
              onClick={() => {
                if (sortField === 'pnl') setSortAsc(!sortAsc);
                else { setSortField('pnl'); setSortAsc(false); }
              }}
              className={`px-2 py-1 rounded border text-[11px] transition-colors ${
                sortField === 'pnl'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              Kâr/Zarar {sortField === 'pnl' ? (sortAsc ? '↑' : '↓') : ''}
            </button>
          </div>
        </div>

        {displayTrades.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            Filtrelere uygun işlem bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Kapanış Zamanı</th>
                  <th className="p-2.5">Sembol / Yön</th>
                  <th className="p-2.5">Giriş / Çıkış Fiyatı</th>
                  <th className="p-2.5">Miktar</th>
                  <th className="p-2.5">Net PnL ($)</th>
                  <th className="p-2.5">Getiri (%)</th>
                  <th className="p-2.5">Süre</th>
                  <th className="p-2.5 text-right">Kapanış Nedeni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {displayTrades.map((t) => {
                  const isWin = t.pnl > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-2.5 text-slate-400 text-[11px]">
                        {new Date(t.exitTime).toLocaleDateString('tr-TR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-2.5 font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] mr-1.5 ${
                            t.side === 'LONG'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {t.side}
                        </span>
                        <span className="text-slate-200">{t.symbol}</span>
                      </td>
                      <td className="p-2.5">
                        <div className="text-slate-200">${t.entryPrice.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-400">→ ${t.exitPrice.toFixed(2)}</div>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {t.amount.toFixed(4)}
                      </td>
                      <td className="p-2.5 font-bold">
                        <div className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                        </div>
                      </td>
                      <td className="p-2.5 font-bold">
                        <div className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                          {isWin ? '+' : ''}{t.pnlPct.toFixed(2)}%
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-400 text-[11px]">
                        {t.durationMinutes} dk
                      </td>
                      <td className="p-2.5 text-right text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                          {t.exitReason}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
