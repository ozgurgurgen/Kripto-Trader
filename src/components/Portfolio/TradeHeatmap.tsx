import React, { useState, useMemo, useEffect } from 'react';
import { TradeLog, Candle, Timeframe } from '../../types/crypto';
import { BinanceService } from '../../services/binanceService';
import { 
  Flame, 
  Clock, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Zap, 
  Layers, 
  BarChart2, 
  Info, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Activity, 
  RefreshCw,
  Eye,
  Crosshair,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Sun,
  Moon,
  Globe
} from 'lucide-react';

interface TradeHeatmapProps {
  tradeHistory?: TradeLog[];
  currentSymbol: string;
  candles?: Candle[];
}

type MetricMode = 'pnl' | 'winrate' | 'count';
type TimeRange = 'ALL' | '7D' | '30D' | '24H';

const DAYS_OF_WEEK = [
  { key: 1, name: 'Pazartesi', short: 'Pzt' },
  { key: 2, name: 'Salı', short: 'Sal' },
  { key: 3, name: 'Çarşamba', short: 'Çar' },
  { key: 4, name: 'Perşembe', short: 'Per' },
  { key: 5, name: 'Cuma', short: 'Cum' },
  { key: 6, name: 'Cumartesi', short: 'Cmt' },
  { key: 0, name: 'Pazar', short: 'Paz' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface MatrixCell {
  trades: TradeLog[];
  totalPnl: number;
  wins: number;
  losses: number;
}

interface SessionClusterInfo {
  name: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  trades: number;
  pnl: number;
  wins: number;
  losses: number;
}

export const TradeHeatmap: React.FC<TradeHeatmapProps> = ({
  tradeHistory = [],
  currentSymbol = 'BTCUSDT',
  candles: initialCandles = [],
}) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WINS' | 'LOSSES'>('ALL');
  const [sideFilter, setSideFilter] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const [metricMode, setMetricMode] = useState<MetricMode>('pnl');
  
  // Selected cell from 24x7 matrix for drilldown
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number } | null>(null);
  
  // Hovered Trade on Chart
  const [hoveredTrade, setHoveredTrade] = useState<TradeLog | null>(null);
  const [selectedTrade, setSelectedTrade] = useState<TradeLog | null>(null);

  // Price candles for condensed chart
  const [priceCandles, setPriceCandles] = useState<Candle[]>(initialCandles || []);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState<Timeframe>('1h');

  const activeSymbol = selectedSymbol === 'ALL' ? currentSymbol : selectedSymbol;

  // Fetch candles when symbol or timeframe changes
  useEffect(() => {
    let isMounted = true;
    const fetchCandles = async () => {
      setIsLoadingCandles(true);
      try {
        const klines = await BinanceService.fetchKlines(activeSymbol, chartTimeframe, 200);
        if (isMounted && klines && klines.length > 0) {
          setPriceCandles(klines);
        }
      } catch (err) {
        console.error('Error fetching candles for Trade Heatmap:', err);
      } finally {
        if (isMounted) setIsLoadingCandles(false);
      }
    };

    fetchCandles();
    return () => {
      isMounted = false;
    };
  }, [activeSymbol, chartTimeframe]);

  // 1. Filter Trades
  const filteredTrades = useMemo(() => {
    const now = Date.now();
    const safeTrades = tradeHistory || [];
    return safeTrades.filter((t) => {
      // Symbol
      if (selectedSymbol !== 'ALL' && t.symbol !== selectedSymbol) return false;

      // Time range
      if (timeRange === '24H' && t.exitTime < now - 86400000) return false;
      if (timeRange === '7D' && t.exitTime < now - 7 * 86400000) return false;
      if (timeRange === '30D' && t.exitTime < now - 30 * 86400000) return false;

      // Outcome
      if (outcomeFilter === 'WINS' && t.pnl <= 0) return false;
      if (outcomeFilter === 'LOSSES' && t.pnl >= 0) return false;

      // Side
      if (sideFilter !== 'ALL' && t.side !== sideFilter) return false;

      // Selected Matrix Cell Filter
      if (selectedCell !== null) {
        const date = new Date(t.entryTime);
        const day = date.getDay();
        const hour = date.getHours();
        if (day !== selectedCell.day || hour !== selectedCell.hour) return false;
      }

      return true;
    });
  }, [tradeHistory, selectedSymbol, timeRange, outcomeFilter, sideFilter, selectedCell]);

  // Unique symbols in history
  const availableSymbols = useMemo(() => {
    const syms = new Set<string>();
    (tradeHistory || []).forEach((t) => syms.add(t.symbol));
    return Array.from(syms);
  }, [tradeHistory]);

  // 2. 24x7 Matrix Computation
  const matrixData = useMemo<Record<string, MatrixCell>>(() => {
    // 7 days x 24 hours
    const grid: Record<string, MatrixCell> = {};

    DAYS_OF_WEEK.forEach((d) => {
      HOURS.forEach((h) => {
        grid[`${d.key}-${h}`] = { trades: [], totalPnl: 0, wins: 0, losses: 0 };
      });
    });

    const relevantTrades = (tradeHistory || []).filter((t) => {
      if (selectedSymbol !== 'ALL' && t.symbol !== selectedSymbol) return false;
      if (sideFilter !== 'ALL' && t.side !== sideFilter) return false;
      return true;
    });

    relevantTrades.forEach((t) => {
      const d = new Date(t.entryTime);
      const day = d.getDay();
      const hour = d.getHours();
      const key = `${day}-${hour}`;
      if (grid[key]) {
        grid[key].trades.push(t);
        grid[key].totalPnl += t.pnl;
        if (t.pnl > 0) grid[key].wins += 1;
        else grid[key].losses += 1;
      }
    });

    return grid;
  }, [tradeHistory, selectedSymbol, sideFilter]);

  // Calculate max/min for color scaling
  const matrixStats = useMemo(() => {
    let maxPnl = 0;
    let minPnl = 0;
    let maxCount = 0;

    Object.values(matrixData).forEach((cell: MatrixCell) => {
      if (cell.totalPnl > maxPnl) maxPnl = cell.totalPnl;
      if (cell.totalPnl < minPnl) minPnl = cell.totalPnl;
      if (cell.trades.length > maxCount) maxCount = cell.trades.length;
    });

    return { maxPnl: Math.max(maxPnl, 1), minPnl: Math.min(minPnl, -1), maxCount: Math.max(maxCount, 1) };
  }, [matrixData]);

  // 3. Trading Session Clusters Computation
  const sessionClusters = useMemo<Record<string, SessionClusterInfo>>(() => {
    const sessions: Record<string, SessionClusterInfo> = {
      asia: { name: 'Asya / Tokyo', time: '00:00 - 08:00 UTC', icon: Moon, trades: 0, pnl: 0, wins: 0, losses: 0 },
      london: { name: 'Londra / Avrupa', time: '08:00 - 16:00 UTC', icon: Sun, trades: 0, pnl: 0, wins: 0, losses: 0 },
      ny: { name: 'New York / ABD', time: '13:00 - 21:00 UTC', icon: Globe, trades: 0, pnl: 0, wins: 0, losses: 0 },
      overlap: { name: 'Londra-NY Çakışması', time: '13:00 - 16:00 UTC', icon: Zap, trades: 0, pnl: 0, wins: 0, losses: 0 },
    };

    filteredTrades.forEach((t) => {
      const utcH = new Date(t.entryTime).getUTCHours();
      const isWin = t.pnl > 0;

      // Asia
      if (utcH >= 0 && utcH < 8) {
        sessions.asia.trades += 1;
        sessions.asia.pnl += t.pnl;
        if (isWin) sessions.asia.wins += 1; else sessions.asia.losses += 1;
      }
      // London
      if (utcH >= 8 && utcH < 16) {
        sessions.london.trades += 1;
        sessions.london.pnl += t.pnl;
        if (isWin) sessions.london.wins += 1; else sessions.london.losses += 1;
      }
      // NY
      if (utcH >= 13 && utcH < 21) {
        sessions.ny.trades += 1;
        sessions.ny.pnl += t.pnl;
        if (isWin) sessions.ny.wins += 1; else sessions.ny.losses += 1;
      }
      // Overlap
      if (utcH >= 13 && utcH < 16) {
        sessions.overlap.trades += 1;
        sessions.overlap.pnl += t.pnl;
        if (isWin) sessions.overlap.wins += 1; else sessions.overlap.losses += 1;
      }
    });

    return sessions;
  }, [filteredTrades]);

  // 4. Holding Duration Clusters Computation
  const durationClusters = useMemo(() => {
    const buckets = [
      { label: 'Scalp (< 30 dk)', min: 0, max: 30, trades: 0, pnl: 0, wins: 0 },
      { label: 'Kısa Vade (30 dk - 4 sa)', min: 30, max: 240, trades: 0, pnl: 0, wins: 0 },
      { label: 'Gün İçi (4 - 24 sa)', min: 240, max: 1440, trades: 0, pnl: 0, wins: 0 },
      { label: 'Swing (> 24 sa)', min: 1440, max: Infinity, trades: 0, pnl: 0, wins: 0 },
    ];

    filteredTrades.forEach((t) => {
      const dur = t.durationMinutes || Math.max(1, (t.exitTime - t.entryTime) / 60000);
      const bucket = buckets.find((b) => dur >= b.min && dur < b.max);
      if (bucket) {
        bucket.trades += 1;
        bucket.pnl += t.pnl;
        if (t.pnl > 0) bucket.wins += 1;
      }
    });

    return buckets;
  }, [filteredTrades]);

  // 5. Pattern Discovery Insights
  const insights = useMemo(() => {
    let bestHour = -1;
    let bestHourPnl = -Infinity;
    let worstHour = -1;
    let worstHourPnl = Infinity;

    HOURS.forEach((h) => {
      let hourPnl = 0;
      let count = 0;
      DAYS_OF_WEEK.forEach((d) => {
        const cell = matrixData[`${d.key}-${h}`];
        if (cell) {
          hourPnl += cell.totalPnl;
          count += cell.trades.length;
        }
      });
      if (count > 0) {
        if (hourPnl > bestHourPnl) {
          bestHourPnl = hourPnl;
          bestHour = h;
        }
        if (hourPnl < worstHourPnl) {
          worstHourPnl = hourPnl;
          worstHour = h;
        }
      }
    });

    let bestDay = '';
    let bestDayPnl = -Infinity;
    DAYS_OF_WEEK.forEach((d) => {
      let dayPnl = 0;
      let count = 0;
      HOURS.forEach((h) => {
        const cell = matrixData[`${d.key}-${h}`];
        if (cell) {
          dayPnl += cell.totalPnl;
          count += cell.trades.length;
        }
      });
      if (count > 0 && dayPnl > bestDayPnl) {
        bestDayPnl = dayPnl;
        bestDay = d.name;
      }
    });

    const totalWinTrades = filteredTrades.filter((t) => t.pnl > 0);
    const totalLossTrades = filteredTrades.filter((t) => t.pnl < 0);
    const avgWinDuration = totalWinTrades.length > 0 
      ? Math.round(totalWinTrades.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) / totalWinTrades.length) 
      : 0;
    const avgLossDuration = totalLossTrades.length > 0 
      ? Math.round(totalLossTrades.reduce((acc, t) => acc + (t.durationMinutes || 0), 0) / totalLossTrades.length) 
      : 0;

    return {
      bestHour,
      bestHourPnl,
      worstHour,
      worstHourPnl,
      bestDay,
      bestDayPnl,
      avgWinDuration,
      avgLossDuration,
    };
  }, [matrixData, filteredTrades]);

  // 6. Condensed Chart SVG Geometry Calculation
  const chartData = useMemo(() => {
    if (priceCandles.length === 0) return null;

    const minPrice = Math.min(...priceCandles.map((c) => c.low)) * 0.998;
    const maxPrice = Math.max(...priceCandles.map((c) => c.high)) * 1.002;
    const priceRange = maxPrice - minPrice || 1;

    const minTime = priceCandles[0].time;
    const maxTime = priceCandles[priceCandles.length - 1].time;
    const timeRangeMs = maxTime - minTime || 1;

    const width = 1000;
    const height = 280;
    const padding = { top: 20, right: 60, bottom: 30, left: 15 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const getX = (timestamp: number) => {
      const clamped = Math.max(minTime, Math.min(maxTime, timestamp));
      return padding.left + ((clamped - minTime) / timeRangeMs) * chartW;
    };

    const getY = (price: number) => {
      const clamped = Math.max(minPrice, Math.min(maxPrice, price));
      return padding.top + chartH - ((clamped - minPrice) / priceRange) * chartH;
    };

    // Build price area/line SVG path
    let linePath = '';
    let areaPath = '';

    priceCandles.forEach((c, idx) => {
      const x = getX(c.time);
      const y = getY(c.close);
      if (idx === 0) {
        linePath += `M ${x} ${y}`;
        areaPath += `M ${x} ${padding.top + chartH} L ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
        areaPath += ` L ${x} ${y}`;
      }
    });

    if (priceCandles.length > 0) {
      const lastX = getX(priceCandles[priceCandles.length - 1].time);
      areaPath += ` L ${lastX} ${padding.top + chartH} Z`;
    }

    // Trade markers overlaid
    const tradeOverlays = filteredTrades.map((trade) => {
      const entryX = getX(trade.entryTime);
      const entryY = getY(trade.entryPrice);
      const exitX = getX(trade.exitTime);
      const exitY = getY(trade.exitPrice);
      const isWin = trade.pnl >= 0;
      const isVisibleOnChart = trade.entryTime >= minTime || trade.exitTime <= maxTime;

      return {
        trade,
        entryX,
        entryY,
        exitX,
        exitY,
        isWin,
        isVisibleOnChart,
      };
    });

    // Generate Y-axis grid ticks
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const price = minPrice + ratio * priceRange;
      const y = padding.top + chartH - ratio * chartH;
      return { price, y };
    });

    // Generate X-axis time ticks
    const xTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
      const time = minTime + ratio * timeRangeMs;
      const x = padding.left + ratio * chartW;
      const dateStr = new Date(time).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return { time, x, dateStr };
    });

    return {
      width,
      height,
      padding,
      chartW,
      chartH,
      minPrice,
      maxPrice,
      minTime,
      maxTime,
      linePath,
      areaPath,
      tradeOverlays,
      yTicks,
      xTicks,
      getX,
      getY,
    };
  }, [priceCandles, filteredTrades]);

  // Color generator for matrix cells
  const getCellBg = (cell: { trades: TradeLog[]; totalPnl: number; wins: number; losses: number }) => {
    if (cell.trades.length === 0) return 'bg-[#0a0f1d]/40 border-slate-900/60 hover:border-slate-700';

    if (metricMode === 'pnl') {
      if (cell.totalPnl > 0) {
        const intensity = Math.min(1, cell.totalPnl / matrixStats.maxPnl);
        if (intensity > 0.65) return 'bg-emerald-500/80 text-slate-950 border-emerald-400 font-bold shadow-xs shadow-emerald-500/30';
        if (intensity > 0.35) return 'bg-emerald-600/50 text-emerald-100 border-emerald-500/60 font-semibold';
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-800/60';
      } else if (cell.totalPnl < 0) {
        const intensity = Math.min(1, Math.abs(cell.totalPnl) / Math.abs(matrixStats.minPnl));
        if (intensity > 0.65) return 'bg-rose-500/80 text-white border-rose-400 font-bold shadow-xs shadow-rose-500/30';
        if (intensity > 0.35) return 'bg-rose-600/50 text-rose-100 border-rose-500/60 font-semibold';
        return 'bg-rose-900/40 text-rose-300 border-rose-800/60';
      }
      return 'bg-slate-800 text-slate-300 border-slate-700';
    }

    if (metricMode === 'winrate') {
      const winRate = cell.trades.length > 0 ? (cell.wins / cell.trades.length) * 100 : 0;
      if (winRate >= 70) return 'bg-emerald-500/70 text-slate-950 border-emerald-400 font-bold';
      if (winRate >= 50) return 'bg-emerald-700/40 text-emerald-200 border-emerald-600/50';
      if (winRate >= 30) return 'bg-amber-600/40 text-amber-200 border-amber-500/50';
      return 'bg-rose-600/50 text-rose-200 border-rose-500/60';
    }

    // count mode
    const countRatio = cell.trades.length / matrixStats.maxCount;
    if (countRatio > 0.65) return 'bg-cyan-500/80 text-slate-950 border-cyan-400 font-bold shadow-xs shadow-cyan-500/30';
    if (countRatio > 0.35) return 'bg-cyan-600/45 text-cyan-100 border-cyan-500/60 font-semibold';
    return 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
  };

  return (
    <div className="w-full space-y-4 animate-fade-in text-slate-100 select-none pb-8">
      
      {/* 1. Header & Controls Bar */}
      <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-600 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                İşlem Isı Haritası (Trade Heatmap & Cluster Radar)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Giriş/Çıkış Katmanı • 24x7 Zaman Matrisi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Geçmiş pozisyon giriş ve çıkış noktalarını fiyat eğrisi üzerinde inceleyin; en karlı saat, gün ve tutma süresi kümelerini tespit edin.
            </p>
          </div>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Görüntülenen İşlem:</span>
            <strong className="text-cyan-300">{filteredTrades.length} / {tradeHistory.length}</strong>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 font-mono">
            <span className="text-slate-400">Toplam Kâr:</span>
            <strong className={filteredTrades.reduce((a, b) => a + b.pnl, 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              ${filteredTrades.reduce((a, b) => a + b.pnl, 0).toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter & Metric Bar */}
      <div className="bg-[#101728] border border-slate-800 rounded-xl p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left Filter Group */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Symbol Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Sembol:</span>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-hidden focus:border-cyan-500"
            >
              <option value="ALL">Tüm Semboller</option>
              {availableSymbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {!availableSymbols.includes(currentSymbol) && (
                <option value={currentSymbol}>{currentSymbol}</option>
              )}
            </select>
          </div>

          {/* Time Range */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            {(['ALL', '30D', '7D', '24H'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition font-mono ${
                  timeRange === r
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'ALL' ? 'Tümü' : r === '30D' ? '30 Gün' : r === '7D' ? '7 Gün' : '24 Saat'}
              </button>
            ))}
          </div>

          {/* Outcome Filter */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setOutcomeFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                outcomeFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tüm Sonuçlar
            </button>
            <button
              onClick={() => setOutcomeFilter('WINS')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                outcomeFilter === 'WINS'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              Kazançlar
            </button>
            <button
              onClick={() => setOutcomeFilter('LOSSES')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                outcomeFilter === 'LOSSES'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              Kayıplar
            </button>
          </div>

          {/* Side Filter */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 font-mono text-[11px]">
            <button
              onClick={() => setSideFilter('ALL')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                sideFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              L+S
            </button>
            <button
              onClick={() => setSideFilter('LONG')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                sideFilter === 'LONG' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400'
              }`}
            >
              LONG
            </button>
            <button
              onClick={() => setSideFilter('SHORT')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                sideFilter === 'SHORT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'text-slate-400'
              }`}
            >
              SHORT
            </button>
          </div>
        </div>

        {/* Right Group: Matrix Metric Mode Selector & Reset Matrix Drilldown */}
        <div className="flex items-center gap-2">
          {selectedCell !== null && (
            <button
              onClick={() => setSelectedCell(null)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1 hover:bg-rose-500/20 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Matris Filtresini Kaldır ({DAYS_OF_WEEK.find(d => d.key === selectedCell.day)?.short} {selectedCell.hour}:00)</span>
            </button>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px]">Isı Metriği:</span>
            <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setMetricMode('pnl')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  metricMode === 'pnl' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
                }`}
              >
                Net Kâr/Zarar ($)
              </button>
              <button
                onClick={() => setMetricMode('winrate')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  metricMode === 'winrate' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400'
                }`}
              >
                Win Rate (%)
              </button>
              <button
                onClick={() => setMetricMode('count')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                  metricMode === 'count' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
                }`}
              >
                İşlem Adedi
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Condensed Price Chart with Historical Entry / Exit Overlay */}
      <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-xl relative overflow-hidden">
        
        {/* Chart Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono">
              Fiyat Eğrisi Üzerinde Geçmiş Pozisyon Giriş & Çıkış Katmanı ({activeSymbol})
            </h3>
            <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
              (Yeşil/Kırmızı Daireler: Girişler • Bayraklar: Kapanışlar • Alanlar: Pozisyon Süresi)
            </span>
          </div>

          {/* Timeframe selector for background candles */}
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            {(['15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setChartTimeframe(tf)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  chartTimeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive SVG Condensed Chart */}
        <div className="relative w-full h-72 sm:h-80 bg-[#070b14] rounded-xl border border-slate-800/80 p-2 overflow-hidden">
          {isLoadingCandles && (
            <div className="absolute inset-0 bg-[#070b14]/80 backdrop-blur-2xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Geçmiş Fiyat Katmanı Yükleniyor...</span>
              </div>
            </div>
          )}

          {chartData ? (
            <svg
              viewBox={`0 0 ${chartData.width} ${chartData.height}`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="winTradeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
                </linearGradient>

                <linearGradient id="lossTradeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Y Grid lines and labels */}
              {chartData.yTicks.map((tick, i) => (
                <g key={`ytick-${i}`}>
                  <line
                    x1={chartData.padding.left}
                    y1={tick.y}
                    x2={chartData.width - chartData.padding.right}
                    y2={tick.y}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={chartData.width - chartData.padding.right + 6}
                    y={tick.y + 4}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    ${tick.price.toFixed(tick.price > 100 ? 1 : 3)}
                  </text>
                </g>
              ))}

              {/* X Grid lines and labels */}
              {chartData.xTicks.map((tick, i) => (
                <g key={`xtick-${i}`}>
                  <line
                    x1={tick.x}
                    y1={chartData.padding.top}
                    x2={tick.x}
                    y2={chartData.padding.top + chartData.chartH}
                    stroke="#1e293b"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={tick.x}
                    y={chartData.padding.top + chartData.chartH + 18}
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {tick.dateStr}
                  </text>
                </g>
              ))}

              {/* Price Area & Line */}
              <path d={chartData.areaPath} fill="url(#priceAreaGradient)" />
              <path d={chartData.linePath} fill="none" stroke="#38bdf8" strokeWidth="2" />

              {/* Overlaid Trades: Connection Shaded Span + Entry/Exit Dots */}
              {chartData.tradeOverlays.map((item, idx) => {
                const isHovered = hoveredTrade?.id === item.trade.id;
                const isSelected = selectedTrade?.id === item.trade.id;

                const minX = Math.min(item.entryX, item.exitX);
                const maxX = Math.max(item.entryX, item.exitX);
                const spanW = Math.max(8, maxX - minX);

                return (
                  <g
                    key={`trade-overlay-${item.trade.id}-${idx}`}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredTrade(item.trade)}
                    onMouseLeave={() => setHoveredTrade(null)}
                    onClick={() => setSelectedTrade(item.trade)}
                  >
                    {/* Connecting Region / Span */}
                    <rect
                      x={minX}
                      y={Math.min(item.entryY, item.exitY) - 10}
                      width={spanW}
                      height={Math.abs(item.exitY - item.entryY) + 20}
                      fill={item.isWin ? 'url(#winTradeGradient)' : 'url(#lossTradeGradient)'}
                      stroke={item.isWin ? '#10b981' : '#f43f5e'}
                      strokeWidth={isHovered || isSelected ? '2' : '1'}
                      strokeDasharray={isHovered ? 'none' : '3 3'}
                      rx="4"
                      className="opacity-80 hover:opacity-100 transition-opacity"
                    />

                    {/* Vector line connecting entry and exit */}
                    <line
                      x1={item.entryX}
                      y1={item.entryY}
                      x2={item.exitX}
                      y2={item.exitY}
                      stroke={item.isWin ? '#10b981' : '#f43f5e'}
                      strokeWidth={isHovered || isSelected ? '3' : '1.5'}
                    />

                    {/* ENTRY MARKER */}
                    <g transform={`translate(${item.entryX}, ${item.entryY})`}>
                      <circle
                        r={isHovered || isSelected ? 7 : 5}
                        fill={item.trade.side === 'LONG' ? '#10b981' : '#f43f5e'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      {(isHovered || isSelected) && (
                        <text
                          y="-10"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {item.trade.side} ${item.trade.entryPrice.toFixed(1)}
                        </text>
                      )}
                    </g>

                    {/* EXIT MARKER */}
                    <g transform={`translate(${item.exitX}, ${item.exitY})`}>
                      <circle
                        r={isHovered || isSelected ? 7 : 5}
                        fill={item.isWin ? '#34d399' : '#fb7185'}
                        stroke="#0f172a"
                        strokeWidth="2"
                      />
                      {(isHovered || isSelected) && (
                        <text
                          y="18"
                          textAnchor="middle"
                          fill={item.isWin ? '#34d399' : '#fb7185'}
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          KAPANIŞ ({item.isWin ? '+' : ''}${item.trade.pnl.toFixed(1)})
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs">
              Grafik verisi yükleniyor...
            </div>
          )}

          {/* Hover / Selected Trade Detail Overlay Card */}
          {(hoveredTrade || selectedTrade) && (
            <div className="absolute top-3 left-3 bg-[#0f172a]/95 border border-cyan-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-30 animate-fade-in font-mono pointer-events-none">
              {(() => {
                const t = hoveredTrade || selectedTrade!;
                const isWin = t.pnl >= 0;
                return (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1 text-[11px]">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${t.side === 'LONG' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {t.symbol} • {t.side}
                      </span>
                      <span className={`font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isWin ? '+' : ''}${t.pnl.toFixed(2)} ({isWin ? '+' : ''}{t.pnlPct.toFixed(2)}%)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-300">
                      <div>Giriş Fiyatı: <strong className="text-slate-100">${t.entryPrice.toLocaleString()}</strong></div>
                      <div>Çıkış Fiyatı: <strong className="text-slate-100">${t.exitPrice.toLocaleString()}</strong></div>
                      <div>Miktar: <strong className="text-slate-100">{t.amount}</strong></div>
                      <div>Süre: <strong className="text-slate-100">{t.durationMinutes} dk</strong></div>
                      <div className="col-span-2 text-slate-400 text-[9px] truncate">
                        Çıkış Nedeni: {t.exitReason || 'Normal Kapanış'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend for Chart */}
        <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
              <span>Long Giriş / Kazanan Kapanış</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900" />
              <span>Short Giriş / Kaybeden Kapanış</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-2 bg-emerald-500/30 border border-emerald-500 rounded-xs" />
              <span>Kârlı Pozisyon Süresi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-2 bg-rose-500/30 border border-rose-500 rounded-xs" />
              <span>Zararlı Pozisyon Süresi</span>
            </div>
          </div>

          <span className="text-[10px] text-cyan-400">
            💡 İpucu: İşlemlerin üzerine gelerek detayları görebilir veya tıklayarak sabitleyebilirsiniz.
          </span>
        </div>
      </div>

      {/* 4. Time-Based Pattern Heatmap (24x7 Matrix) */}
      <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white font-mono">
              24 Saat x 7 Gün Zaman & Kârlılık Isı Matrisi
            </h3>
            <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">
              (Hangi saat ve günlerde en yüksek kâr sağlandığını keşfedin. Hücreye tıklayarak grafiği filtreleyin.)
            </span>
          </div>

          {/* Scale Legend */}
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Kayıp</span>
            <div className="flex items-center gap-0.5">
              <span className="w-3 h-3 rounded-xs bg-rose-600/80" />
              <span className="w-3 h-3 rounded-xs bg-rose-900/40" />
              <span className="w-3 h-3 rounded-xs bg-slate-900" />
              <span className="w-3 h-3 rounded-xs bg-emerald-900/40" />
              <span className="w-3 h-3 rounded-xs bg-emerald-500/80" />
            </div>
            <span>Kâr</span>
          </div>
        </div>

        {/* 24x7 Matrix Grid Container */}
        <div className="overflow-x-auto pb-2 no-scrollbar">
          <div className="min-w-[760px] space-y-1 font-mono text-xs">
            
            {/* Header: 24 Hours (00 to 23) */}
            <div 
              className="grid gap-1 text-[10px] text-slate-400 text-center items-center pb-1"
              style={{ gridTemplateColumns: '48px repeat(24, minmax(0, 1fr))' }}
            >
              <div className="text-left font-bold text-slate-400 pl-1">Gün</div>
              {HOURS.map((h) => (
                <div key={`hour-head-${h}`} className="text-slate-400">
                  {h < 10 ? `0${h}` : h}
                </div>
              ))}
            </div>

            {/* 7 Rows for Days of Week */}
            {DAYS_OF_WEEK.map((day) => (
              <div 
                key={`day-row-${day.key}`} 
                className="grid gap-1 items-center"
                style={{ gridTemplateColumns: '48px repeat(24, minmax(0, 1fr))' }}
              >
                <div className="text-left text-[11px] font-bold text-slate-300 pr-1 truncate">
                  {day.short}
                </div>

                {HOURS.map((hour) => {
                  const cell = matrixData[`${day.key}-${hour}`] || { trades: [], totalPnl: 0, wins: 0, losses: 0 };
                  const isCellSelected = selectedCell?.day === day.key && selectedCell?.hour === hour;
                  const bgClass = getCellBg(cell);

                  return (
                    <div
                      key={`cell-${day.key}-${hour}`}
                      onClick={() => {
                        if (cell.trades.length > 0) {
                          if (isCellSelected) setSelectedCell(null);
                          else setSelectedCell({ day: day.key, hour });
                        }
                      }}
                      className={`h-8 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-all ${bgClass} ${
                        isCellSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''
                      }`}
                      title={`${day.name} ${hour}:00 - ${hour + 1}:00\nİşlem Sayısı: ${cell.trades.length}\nToplam Kâr: $${cell.totalPnl.toFixed(2)}\nWin Rate: ${cell.trades.length > 0 ? ((cell.wins / cell.trades.length) * 100).toFixed(0) : 0}%`}
                    >
                      {cell.trades.length > 0 ? (
                        <>
                          <span className="text-[10px] leading-tight">
                            {metricMode === 'pnl' 
                              ? `${cell.totalPnl >= 0 ? '+' : ''}${Math.round(cell.totalPnl)}`
                              : metricMode === 'winrate'
                              ? `${Math.round((cell.wins / cell.trades.length) * 100)}%`
                              : `${cell.trades.length}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-800 text-[9px]">•</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Pattern Clusters & Deep Analytics Grid (Market Sessions + Holding Durations + Pattern Insights) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* A. Market Session Clusters */}
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Küresel Piyasa Seansı Kümeleri</span>
            </h4>
            <span className="text-[10px] text-slate-400">UTC</span>
          </div>

          <div className="space-y-2 text-xs">
            {(Object.values(sessionClusters) as SessionClusterInfo[]).map((s, idx) => {
              const Icon = s.icon;
              const winRate = s.trades > 0 ? (s.wins / s.trades) * 100 : 0;
              const isProfit = s.pnl >= 0;

              return (
                <div key={`session-${idx}`} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-white font-semibold">
                      <Icon className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{s.name}</span>
                    </div>
                    <span className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${s.pnl.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{s.time}</span>
                    <span>{s.trades} İşlem • Win: <strong>{winRate.toFixed(0)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* B. Holding Duration Clusters */}
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Pozisyon Tutma Süresi Kümeleri</span>
            </h4>
            <span className="text-[10px] text-slate-400">Performans</span>
          </div>

          <div className="space-y-2 text-xs">
            {durationClusters.map((b, idx) => {
              const winRate = b.trades > 0 ? (b.wins / b.trades) * 100 : 0;
              const isProfit = b.pnl >= 0;

              return (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">{b.label}</span>
                    <span className={`font-mono font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isProfit ? '+' : ''}${b.pnl.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{b.trades} İşlem</span>
                    <span>Win Rate: <strong className={winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'}>{winRate.toFixed(0)}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* C. Algorithmic Pattern Insights & Recommendations */}
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-xl p-4 space-y-3 shadow-lg md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Algoritmik Örüntü Keşifleri</span>
            </h4>
            <span className="text-[10px] text-purple-400 bg-purple-950/40 px-1.5 py-0.2 rounded border border-purple-800/50">
              AI Cluster Radar
            </span>
          </div>

          <div className="space-y-2 text-xs">
            
            {/* Best Hour Insight */}
            <div className="bg-slate-900/80 border border-emerald-500/30 rounded-lg p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>En Kârlı İşlem Saati Kümesi</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Saat <strong>{insights.bestHour !== -1 ? `${insights.bestHour}:00 - ${insights.bestHour + 1}:00` : 'Veri Bekleniyor'}</strong> aralığında toplam 
                <strong className="text-emerald-300"> +${Math.max(0, insights.bestHourPnl).toFixed(2)}</strong> kâr üretildi.
              </p>
            </div>

            {/* Best Day Insight */}
            <div className="bg-slate-900/80 border border-cyan-500/30 rounded-lg p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px]">
                <Calendar className="w-3.5 h-3.5" />
                <span>En Güçlü Gün Kümesi</span>
              </div>
              <p className="text-[11px] text-slate-300">
                En yüksek kümülatif kazanç <strong>{insights.bestDay || 'Pazartesi'}</strong> günlerinde gerçekleşti.
              </p>
            </div>

            {/* Duration comparison */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Ortalama Tutma Süreleri</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Kazanan pozisyonlar ortalama <strong className="text-emerald-300">{insights.avgWinDuration} dk</strong>, kaybedenler ise <strong className="text-rose-300">{insights.avgLossDuration} dk</strong> tutuldu.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
