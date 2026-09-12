import React, { useState, useMemo } from 'react';
import { TradeLog } from '../../types/crypto';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Activity, 
  Calendar, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Maximize2,
  Filter,
  BarChart2,
  LineChart as LineChartIcon,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Brush
} from 'recharts';

export interface PortfolioPnLChartProps {
  tradeHistory?: TradeLog[];
  initialBalance?: number;
  currentPrice?: number;
  symbol?: string;
  onRefresh?: () => void;
  compact?: boolean;
}

type ChartMode = 'cumulative' | 'equity' | 'bars' | 'drawdown';
type TimeRange = 'ALL' | '24H' | '7D' | '30D' | '90D';

export const PortfolioPnLChart: React.FC<PortfolioPnLChartProps> = ({
  tradeHistory = [],
  initialBalance = 10000,
  compact = false,
}) => {
  const [chartMode, setChartMode] = useState<ChartMode>('cumulative');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  const [selectedSide, setSelectedSide] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [showBrush, setShowBrush] = useState<boolean>(false);

  // Extract unique symbols from trade history for filtering
  const availableSymbols = useMemo(() => {
    const syms = Array.from(new Set(tradeHistory.map((t) => t.symbol)));
    return syms.sort();
  }, [tradeHistory]);

  // 1. Filter trades
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    return [...tradeHistory]
      .filter((t) => {
        // Time range filter
        if (timeRange === '24H' && t.exitTime < now - 24 * 3600000) return false;
        if (timeRange === '7D' && t.exitTime < now - 7 * 86400000) return false;
        if (timeRange === '30D' && t.exitTime < now - 30 * 86400000) return false;
        if (timeRange === '90D' && t.exitTime < now - 90 * 86400000) return false;

        // Symbol filter
        if (selectedSymbol !== 'ALL' && t.symbol !== selectedSymbol) return false;

        // Side filter
        if (selectedSide !== 'ALL' && t.side !== selectedSide) return false;

        return true;
      })
      .sort((a, b) => a.exitTime - b.exitTime);
  }, [tradeHistory, timeRange, selectedSymbol, selectedSide]);

  // 2. Build time-series data for Recharts
  const chartData = useMemo(() => {
    if (filteredTrades.length === 0) return [];

    let runningPnL = 0;
    let peakEquity = initialBalance;

    return filteredTrades.map((trade, index) => {
      runningPnL += trade.pnl;
      const currentEquity = initialBalance + runningPnL;
      if (currentEquity > peakEquity) {
        peakEquity = currentEquity;
      }
      const drawdownPct = peakEquity > 0 ? ((currentEquity - peakEquity) / peakEquity) * 100 : 0;

      const dateObj = new Date(trade.exitTime);
      const timeLabel = dateObj.toLocaleDateString('tr-TR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const shortDate = dateObj.toLocaleDateString('tr-TR', {
        month: 'numeric',
        day: 'numeric',
      });

      return {
        id: trade.id,
        index: index + 1,
        time: timeLabel,
        shortDate,
        timestamp: trade.exitTime,
        symbol: trade.symbol,
        side: trade.side,
        tradePnl: Number(trade.pnl.toFixed(2)),
        tradePnlPct: Number(trade.pnlPct.toFixed(2)),
        cumulativePnl: Number(runningPnL.toFixed(2)),
        equity: Number(currentEquity.toFixed(2)),
        drawdown: Number(drawdownPct.toFixed(2)),
        exitReason: trade.exitReason || 'Normal Kapanış',
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        commission: trade.commission,
      };
    });
  }, [filteredTrades, initialBalance]);

  // 3. Summary Statistics for quick performance overview
  const stats = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        totalTrades: 0,
        netPnl: 0,
        netPnlPct: 0,
        winRate: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
        maxDrawdown: 0,
        totalWins: 0,
        totalLosses: 0,
      };
    }

    let totalPnl = 0;
    let grossProfit = 0;
    let grossLoss = 0;
    let wins = 0;
    let losses = 0;
    let best = -Infinity;
    let worst = Infinity;

    filteredTrades.forEach((t) => {
      totalPnl += t.pnl;
      if (t.pnl > 0) {
        wins++;
        grossProfit += t.pnl;
      } else if (t.pnl < 0) {
        losses++;
        grossLoss += Math.abs(t.pnl);
      }
      if (t.pnl > best) best = t.pnl;
      if (t.pnl < worst) worst = t.pnl;
    });

    const totalTrades = filteredTrades.length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
    const netPnlPct = initialBalance > 0 ? (totalPnl / initialBalance) * 100 : 0;

    // Max Drawdown calculation
    let maxDd = 0;
    let peak = initialBalance;
    let curBal = initialBalance;
    filteredTrades.forEach((t) => {
      curBal += t.pnl;
      if (curBal > peak) peak = curBal;
      const dd = peak > 0 ? ((peak - curBal) / peak) * 100 : 0;
      if (dd > maxDd) maxDd = dd;
    });

    return {
      totalTrades,
      netPnl: totalPnl,
      netPnlPct,
      winRate,
      profitFactor,
      bestTrade: best === -Infinity ? 0 : best,
      worstTrade: worst === Infinity ? 0 : worst,
      maxDrawdown: maxDd,
      totalWins: wins,
      totalLosses: losses,
    };
  }, [filteredTrades, initialBalance]);

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPositive = data.tradePnl >= 0;
      const isCumPositive = data.cumulativePnl >= 0;

      return (
        <div className="bg-[#0b0f17]/95 border border-slate-700/80 backdrop-blur-md rounded-xl p-3 shadow-2xl text-xs space-y-2 max-w-xs z-50">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200">{data.symbol}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                data.side === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {data.side}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">#{data.index} • {data.time}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">İşlem K/Z:</span>
              <span className={`font-mono font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}${data.tradePnl.toFixed(2)} ({isPositive ? '+' : ''}{data.tradePnlPct}%)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kümülatif K/Z:</span>
              <span className={`font-mono font-bold ${isCumPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isCumPositive ? '+' : ''}${data.cumulativePnl.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Portföy Bakiyesi:</span>
              <span className="font-mono font-bold text-cyan-300">
                ${data.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Drawdown:</span>
              <span className="font-mono font-bold text-amber-400">
                %{Math.abs(data.drawdown).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>Çıkış: <strong className="text-slate-300">{data.exitReason}</strong></span>
            <span>Komisyon: ${data.commission.toFixed(2)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const isNetPositive = stats.netPnl >= 0;

  return (
    <div className={`bg-[#101522] border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-4 ${compact ? 'py-3 px-4' : ''}`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        {/* Title & Quick summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Zaman İçinde Kâr / Zarar & Performans Grafiği
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Recharts Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Geçmiş işlem verilerinizin büyüme eğrisi, drawdown analizi ve kazanç dinamikleri
            </p>
          </div>
        </div>

        {/* Visualization Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0e17] p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <button
            id="pnl-mode-cumulative"
            onClick={() => setChartMode('cumulative')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              chartMode === 'cumulative'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Kümülatif Kâr/Zarar Gelişimi"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Kümülatif K/Z</span>
          </button>

          <button
            id="pnl-mode-equity"
            onClick={() => setChartMode('equity')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              chartMode === 'equity'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Portföy Bakiye Eğrisi"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Portföy Bakiye</span>
          </button>

          <button
            id="pnl-mode-bars"
            onClick={() => setChartMode('bars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              chartMode === 'bars'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="İşlem Başına Kâr/Zarar Çubukları"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>İşlem Çubukları</span>
          </button>

          <button
            id="pnl-mode-drawdown"
            onClick={() => setChartMode('drawdown')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
              chartMode === 'drawdown'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tepe Noktadan Düşüş Oranı"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Drawdown %</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar & Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Metric 1: Net PnL */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Net PnL</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg sm:text-xl font-black font-mono ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isNetPositive ? '+' : ''}${stats.netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className={`text-[10px] font-mono mt-0.5 ${isNetPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isNetPositive ? '+' : ''}{stats.netPnlPct.toFixed(2)}% getiri
          </span>
        </div>

        {/* Metric 2: Win Rate */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kazanma Oranı</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-black font-mono text-cyan-300">
              %{stats.winRate.toFixed(1)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            {stats.totalWins}K / {stats.totalLosses}Z ({stats.totalTrades} işlem)
          </span>
        </div>

        {/* Metric 3: Profit Factor */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kâr Faktörü</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg sm:text-xl font-black font-mono ${stats.profitFactor >= 1.5 ? 'text-emerald-400' : stats.profitFactor >= 1.0 ? 'text-cyan-300' : 'text-amber-400'}`}>
              {stats.profitFactor.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            Brüt Kâr / Kayıp Oranı
          </span>
        </div>

        {/* Metric 4: Max Drawdown */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Maksimum Drawdown</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-lg sm:text-xl font-black font-mono text-rose-400">
              -%{stats.maxDrawdown.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            Tepe değerden risk
          </span>
        </div>

        {/* Metric 5: Best Trade */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Kârlı İşlem</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
              +${stats.bestTrade.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            Zirve tekil işlem
          </span>
        </div>

        {/* Metric 6: Worst Trade */}
        <div className="bg-[#151c2c] border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Büyük Zarar</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-base sm:text-lg font-black font-mono text-rose-400">
              {stats.worstTrade < 0 ? `-$${Math.abs(stats.worstTrade).toFixed(2)}` : `$${stats.worstTrade.toFixed(2)}`}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-0.5">
            Maksimum tekil kayıp
          </span>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0d121c] p-2.5 rounded-xl border border-slate-800/80">
        {/* Timeframe Filter Buttons */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Zaman:
          </span>
          {(['ALL', '24H', '7D', '30D', '90D'] as TimeRange[]).map((tf) => (
            <button
              key={tf}
              id={`pnl-timerange-${tf}`}
              onClick={() => setTimeRange(tf)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                timeRange === tf
                  ? 'bg-cyan-500 text-[#0a0e17] shadow-sm font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tf === 'ALL' ? 'TÜMÜ' : tf}
            </button>
          ))}
        </div>

        {/* Secondary filters (Symbol, Side, Zoom/Brush toggle) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Symbol Filter */}
          {availableSymbols.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Coin:</span>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-[#151c2c] border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">Tüm Pariteler</option>
                {availableSymbols.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Side Filter */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedSide('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                selectedSide === 'ALL' ? 'bg-slate-700 text-slate-100 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tüm Yönler
            </button>
            <button
              onClick={() => setSelectedSide('LONG')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                selectedSide === 'LONG' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => setSelectedSide('SHORT')}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all ${
                selectedSide === 'SHORT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              SHORT
            </button>
          </div>

          {/* Zoom/Brush Toggle */}
          {chartData.length > 8 && (
            <button
              onClick={() => setShowBrush(!showBrush)}
              className={`px-2 py-1 rounded-lg text-xs font-mono transition-all border ${
                showBrush
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/40 text-slate-400 border-slate-700/60 hover:text-slate-200'
              }`}
              title="Alt zaman aralığı kaydırıcısını aç/kapat"
            >
              Kaydırıcı: {showBrush ? 'Açık' : 'Kapalı'}
            </button>
          )}
        </div>
      </div>

      {/* Main Recharts Chart Area */}
      <div className="w-full h-80 sm:h-96 relative">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#0a0e17] rounded-xl border border-dashed border-slate-800">
            <Activity className="w-12 h-12 text-slate-600 mb-3 opacity-30 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-300">Bu Filtre İçin İşlem Verisi Bulunamadı</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Seçili zaman aralığında veya filtrede henüz kapatılmış işlem kaydı bulunmuyor. Yeni bir simülasyon veya otomatik strateji çalıştırabilirsiniz.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'cumulative' ? (
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="pnlGreenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="pnlRedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `$${val}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4" label={{ value: '$0 Başlangıç', fill: '#64748b', fontSize: 10, position: 'insideBottomRight' }} />
                <Area 
                  type="monotone" 
                  dataKey="cumulativePnl" 
                  name="Kümülatif PnL"
                  stroke={isNetPositive ? "#10b981" : "#f43f5e"} 
                  strokeWidth={2.5} 
                  fill={isNetPositive ? "url(#pnlGreenGradient)" : "url(#pnlRedGradient)"}
                  dot={{ r: 3, fill: isNetPositive ? "#10b981" : "#f43f5e", stroke: "#0b0f17", strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }}
                />
                {showBrush && (
                  <Brush 
                    dataKey="shortDate" 
                    height={28} 
                    stroke="#06b6d4" 
                    fill="#0f172a" 
                    travellerWidth={10} 
                  />
                )}
              </AreaChart>
            ) : chartMode === 'equity' ? (
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={initialBalance} stroke="#eab308" strokeDasharray="3 3" label={{ value: `Başlangıç: $${initialBalance.toLocaleString()}`, fill: '#eab308', fontSize: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  name="Portföy Bakiye"
                  stroke="#06b6d4" 
                  strokeWidth={2.5} 
                  fill="url(#equityGradient)"
                  dot={{ r: 3, fill: '#06b6d4', stroke: '#0b0f17', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#fcd535', stroke: '#fff', strokeWidth: 2 }}
                />
                {showBrush && (
                  <Brush 
                    dataKey="shortDate" 
                    height={28} 
                    stroke="#06b6d4" 
                    fill="#0f172a" 
                    travellerWidth={10} 
                  />
                )}
              </AreaChart>
            ) : chartMode === 'bars' ? (
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#64748b" />
                <Bar dataKey="tradePnl" name="İşlem K/Z" radius={3}>
                  {chartData.map((entry, idx) => (
                    <Cell 
                      key={`bar-${idx}`} 
                      fill={entry.tradePnl >= 0 ? '#10b981' : '#f43f5e'} 
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
                {showBrush && (
                  <Brush 
                    dataKey="shortDate" 
                    height={28} 
                    stroke="#06b6d4" 
                    fill="#0f172a" 
                    travellerWidth={10} 
                  />
                )}
              </BarChart>
            ) : (
              <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="shortDate" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(val) => `%${val}`}
                  domain={[-100, 0]}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#64748b" />
                <Area 
                  type="monotone" 
                  dataKey="drawdown" 
                  name="Drawdown %"
                  stroke="#f43f5e" 
                  strokeWidth={2} 
                  fill="url(#drawdownGradient)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                />
                {showBrush && (
                  <Brush 
                    dataKey="shortDate" 
                    height={28} 
                    stroke="#f43f5e" 
                    fill="#0f172a" 
                    travellerWidth={10} 
                  />
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      {/* Chart Footer Legend & Quick Notes */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Kârlı İşlemler ({stats.totalWins})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Zararlı İşlemler ({stats.totalLosses})</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span>Kümülatif Trend</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Toplam Gösterilen: <strong className="text-slate-300">{chartData.length}</strong> / {tradeHistory.length} işlem
        </div>
      </div>
    </div>
  );
};
