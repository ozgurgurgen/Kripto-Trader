import React, { useState } from 'react';
import { 
  OrderBook, 
  Position, 
  TradingMode, 
  TradeLog,
  Candle 
} from '../../types/crypto';
import { PortfolioPnLChart } from './PortfolioPnLChart';
import { PerformanceDashboard } from './PerformanceDashboard';
import { PaperTradingPanel } from '../Trading/PaperTradingPanel';
import { TradeHeatmap } from './TradeHeatmap';
import { BarChart3, Briefcase, Flame, Activity } from 'lucide-react';

interface PortfolioViewProps {
  symbol: string;
  currentPrice: number;
  mode: TradingMode;
  onModeChange?: (mode: TradingMode) => void;
  orderBook?: OrderBook;
  positions?: Position[];
  tradeHistory?: TradeLog[];
  candles?: Candle[];
  timeframe?: string;
  onRefreshPortfolio: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  symbol,
  currentPrice,
  mode,
  onModeChange,
  orderBook = { bids: [], asks: [], lastUpdateId: 0 },
  positions = [],
  tradeHistory = [],
  candles = [],
  onRefreshPortfolio,
}) => {
  const [subTab, setSubTab] = useState<'pnl-chart' | 'performance' | 'heatmap' | 'trading'>('pnl-chart');

  const openPositionsCount = (positions || []).filter((p) => p.status === 'OPEN').length;

  return (
    <div className="flex flex-col h-full overflow-hidden gap-3">
      {/* Sub-tab switcher */}
      <div className="flex flex-wrap items-center justify-between bg-[#101522] border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            id="subtab-pnl-chart"
            onClick={() => setSubTab('pnl-chart')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap min-h-[34px] ${
              subTab === 'pnl-chart'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Kâr / Zarar Grafiği (PnL)</span>
            <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-mono border border-cyan-500/20">
              Recharts
            </span>
          </button>

          <button
            id="subtab-performance-dashboard"
            onClick={() => setSubTab('performance')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap min-h-[34px] ${
              subTab === 'performance'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Detaylı İstatistikler</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
              {tradeHistory.length}
            </span>
          </button>

          <button
            id="subtab-trade-heatmap"
            onClick={() => setSubTab('heatmap')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap min-h-[34px] ${
              subTab === 'heatmap'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>İşlem Isı Haritası (Heatmap)</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
              Radar
            </span>
          </button>

          <button
            id="subtab-active-positions-trading"
            onClick={() => setSubTab('trading')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all whitespace-nowrap min-h-[34px] ${
              subTab === 'trading'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span>Emir & Pozisyonlar</span>
            {openPositionsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                {openPositionsCount}
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Paper Trading Motoru Aktif</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {subTab === 'pnl-chart' ? (
          <div className="space-y-4">
            <PortfolioPnLChart
              tradeHistory={tradeHistory}
              initialBalance={10000}
              currentPrice={currentPrice}
              symbol={symbol}
              onRefresh={onRefreshPortfolio}
            />
          </div>
        ) : subTab === 'performance' ? (
          <PerformanceDashboard
            tradeHistory={tradeHistory}
            onRefresh={onRefreshPortfolio}
          />
        ) : subTab === 'heatmap' ? (
          <TradeHeatmap
            tradeHistory={tradeHistory}
            currentSymbol={symbol}
            candles={candles}
          />
        ) : (
          <PaperTradingPanel
            symbol={symbol}
            currentPrice={currentPrice}
            mode={mode}
            onModeChange={onModeChange}
            orderBook={orderBook}
            positions={positions}
            tradeHistory={tradeHistory}
            onRefreshPortfolio={onRefreshPortfolio}
          />
        )}
      </div>
    </div>
  );
};
