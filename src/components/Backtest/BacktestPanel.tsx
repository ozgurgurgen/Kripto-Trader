import React, { useState } from 'react';
import { BacktestConfig, BacktestResult, Candle, Strategy, Timeframe, MonteCarloSimulationResult, WalkForwardOptimizationResult } from '../../types/crypto';
import { BacktestEngine } from '../../services/backtestEngine';
import { MonteCarloEngine } from '../../services/monteCarloEngine';
import { StrategyEngine } from '../../services/strategyEngine';
import { HistoricalDataService } from '../../services/historicalDataService';
import { 
  Play, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  ShieldAlert, 
  Scale, 
  Activity, 
  Layers, 
  FileSpreadsheet,
  Sparkles,
  Cpu,
  Dice5,
  RefreshCw,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { AutoLearningModal } from '../Strategy/AutoLearningModal';

interface BacktestPanelProps {
  strategies?: Strategy[];
  candles?: Candle[];
  symbol: string;
  timeframe?: Timeframe;
  onAddStrategy?: (strat: Strategy) => void;
  onApplyStrategyToLive?: (strat: Strategy) => void;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({
  strategies = StrategyEngine.getInitialStrategies(),
  candles = [],
  symbol,
  timeframe = '15m',
  onAddStrategy,
  onApplyStrategyToLive,
}) => {
  const safeStrategies = strategies && strategies.length > 0 ? strategies : StrategyEngine.getInitialStrategies();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(safeStrategies[0]?.id || '');
  const [initialBalance, setInitialBalance] = useState<number>(10000);
  const [commissionPct, setCommissionPct] = useState<number>(0.1);
  const [slippagePct, setSlippagePct] = useState<number>(0.05);
  const [useTrailingStop, setUseTrailingStop] = useState<boolean>(true);
  const [trailingStopPct, setTrailingStopPct] = useState<number>(1.5);
  const [riskPerTradePct, setRiskPerTradePct] = useState<number>(10);
  const [isAutoLearnOpen, setIsAutoLearnOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'standard' | 'montecarlo' | 'walkforward'>('standard');

  const [result, setResult] = useState<BacktestResult | null>(() => {
    // Run initial backtest on load
    if (safeStrategies.length > 0 && candles && candles.length > 30) {
      return BacktestEngine.runBacktest(safeStrategies[0], candles, {
        symbol,
        timeframe: (timeframe || '15m') as Timeframe,
        strategyId: safeStrategies[0].id,
        initialBalance: 10000,
        commissionPct: 0.1,
        slippagePct: 0.05,
        startDate: '',
        endDate: '',
        useTrailingStop: true,
        trailingStopPct: 1.5,
        riskPerTradePct: 10,
      });
    }
    return null;
  });

  const [monteCarloResult, setMonteCarloResult] = useState<MonteCarloSimulationResult | null>(() => {
    return MonteCarloEngine.runMonteCarloSimulation(result?.trades || [], 10000, 1000);
  });

  const [wfoResult, setWfoResult] = useState<WalkForwardOptimizationResult | null>(() => {
    const strat = safeStrategies[0] || StrategyEngine.getInitialStrategies()[0];
    return strat && candles && candles.length > 0 ? MonteCarloEngine.runWalkForwardOptimization(strat, candles, symbol) : null;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [loading5Year, setLoading5Year] = useState(false);

  const handleRun5YearBacktest = async () => {
    const strat = safeStrategies.find((s) => s.id === selectedStrategyId) || safeStrategies[0];
    if (!strat) return;

    setLoading5Year(true);
    setIsRunning(true);
    try {
      const candles5y = await HistoricalDataService.load5YearHistoricalKlines(symbol, '1d');
      const res = BacktestEngine.runBacktest(strat, candles5y, {
        symbol,
        timeframe: '1d',
        strategyId: strat.id,
        initialBalance,
        commissionPct,
        slippagePct,
        startDate: '2021-01-01',
        endDate: '2026-12-31',
        useTrailingStop,
        trailingStopPct,
        riskPerTradePct,
      });
      setResult(res);
      setMonteCarloResult(MonteCarloEngine.runMonteCarloSimulation(res.trades, initialBalance, 1000));
      setWfoResult(MonteCarloEngine.runWalkForwardOptimization(strat, candles5y, symbol));
    } catch {
      // fallback
    } finally {
      setLoading5Year(false);
      setIsRunning(false);
    }
  };

  const handleRunBacktest = () => {
    const strat = safeStrategies.find((s) => s.id === selectedStrategyId) || safeStrategies[0];
    if (!strat || !candles || candles.length === 0) return;

    setIsRunning(true);
    setTimeout(() => {
      const res = BacktestEngine.runBacktest(strat, candles, {
        symbol,
        timeframe: (timeframe || '15m') as Timeframe,
        strategyId: strat.id,
        initialBalance,
        commissionPct,
        slippagePct,
        startDate: '',
        endDate: '',
        useTrailingStop,
        trailingStopPct,
        riskPerTradePct,
      });
      setResult(res);
      setMonteCarloResult(MonteCarloEngine.runMonteCarloSimulation(res.trades, initialBalance, 1000));
      setWfoResult(MonteCarloEngine.runWalkForwardOptimization(strat, candles, symbol));
      setIsRunning(false);
    }, 200);
  };

  const handleDownloadCSV = () => {
    if (!result || result.trades.length === 0) return;
    const csvContent = BacktestEngine.exportTradesCSV(result.trades);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `backtest_${symbol}_${selectedStrategyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      {/* Top Configuration Bar */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Strategy selector */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Strateji Seçimi:</label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Balance */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Başlangıç Bakiyesi ($):</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 1000)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              />
            </div>

            {/* Commission & Slippage */}
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Komisyon (%):</label>
              <select
                value={commissionPct}
                onChange={(e) => setCommissionPct(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
              >
                <option value={0.1}>Standart Komisyon (%0.10)</option>
                <option value={0.075}>İndirimli Komisyon (%0.075)</option>
                <option value={0.04}>VIP / Maker (%0.04)</option>
              </select>
            </div>

            {/* Trailing Stop */}
            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="useTrailing"
                checked={useTrailingStop}
                onChange={(e) => setUseTrailingStop(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500"
              />
              <label htmlFor="useTrailing" className="text-xs text-slate-300">
                Takip Eden Stop (%{trailingStopPct})
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRun5YearBacktest}
              disabled={isRunning || loading5Year}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition shadow-sm disabled:opacity-50"
              title="2021-2026 arasındaki 5 Yıllık Gerçek Piyasa Döngüsü Mumlarıyla Test Et"
            >
              <Calendar className={`w-3.5 h-3.5 text-amber-400 ${loading5Year ? 'animate-spin' : ''}`} />
              <span>{loading5Year ? '5Y Veri Çekiliyor...' : '5Y Veri ile Test Et'}</span>
            </button>

            <button
              onClick={() => setIsAutoLearnOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-linear-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs transition shadow-sm"
              title="5 Yıllık Veri ile En İyi Stratejiyi Otomatik Öğren"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI 5Y Strateji Bul</span>
            </button>

            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? 'Hesaplanıyor...' : 'Backtest Çalıştır'}</span>
            </button>

            {result && result.trades.length > 0 && (
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
                title="CSV Olarak İndir"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV İndir</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Mode Switcher */}
      <div className="flex items-center gap-2 bg-[#101522] border border-slate-800/80 p-2 rounded-xl">
        <button
          onClick={() => setActiveTab('standard')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'standard'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Standart Backtest & Equity Eğrisi</span>
        </button>

        <button
          onClick={() => setActiveTab('montecarlo')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'montecarlo'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Dice5 className="w-3.5 h-3.5" />
          <span>Monte Carlo Risk Simülasyonu (1,000 İterasyon)</span>
        </button>

        <button
          onClick={() => setActiveTab('walkforward')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
            activeTab === 'walkforward'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <GitCommit className="w-3.5 h-3.5" />
          <span>Walk-Forward Doğrulama (WFO - Overfitting Testi)</span>
        </button>
      </div>

      {activeTab === 'standard' && result && (
        <>
          {/* Key Quantitative Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Return */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Toplam Getiri</div>
              <div className="my-1">
                <span
                  className={`text-xl font-bold font-mono ${
                    result.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {result.totalReturnPct >= 0 ? '+' : ''}
                  {result.totalReturnPct}%
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Son: ${result.finalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Sharpe Oranı (Risk/Getiri)</div>
              <div className="my-1">
                <span className="text-xl font-bold font-mono text-cyan-400">
                  {result.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Sortino: {result.sortinoRatio.toFixed(2)}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Maksimum Drawdown</div>
              <div className="my-1">
                <span className="text-xl font-bold font-mono text-red-400">
                  -%{result.maxDrawdownPct}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Kurtarma: ~{result.maxDrawdownDurationDays} gün
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Kazanma Oranı (Win Rate)</div>
              <div className="my-1">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  %{result.winRatePct}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {result.winTrades}K / {result.lossTrades}Z ({result.totalTrades} İşlem)
              </div>
            </div>

            {/* Profit Factor */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Profit Factor</div>
              <div className="my-1">
                <span className="text-xl font-bold font-mono text-amber-400">
                  {result.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Payoff: {result.payoffRatio.toFixed(2)}
              </div>
            </div>

            {/* Benchmark vs Hold */}
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between">
              <div className="text-[11px] text-slate-400 font-medium">Al & Tut (Benchmark)</div>
              <div className="my-1">
                <span className="text-xl font-bold font-mono text-slate-200">
                  {result.benchmarkReturnPct >= 0 ? '+' : ''}
                  {result.benchmarkReturnPct}%
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                Alfa: {(result.totalReturnPct - result.benchmarkReturnPct).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Equity Curve Visualizer */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Kümülatif Bakiye Değişimi (Equity Curve)</h3>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Bot Portföyü
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  Al & Tut (Benchmark)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.equityCurve}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#equityGrad)"
                    name="Portföy Bakiyesi"
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmarkEquity"
                    stroke="#64748b"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="Buy & Hold"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trade Execution History Table */}
          <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100">
                Backtest İşlem Günlüğü ({result.trades.length} İşlem)
              </h3>
            </div>

            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Tarih</th>
                    <th className="p-2.5">Sembol / Yön</th>
                    <th className="p-2.5">Giriş</th>
                    <th className="p-2.5">Çıkış</th>
                    <th className="p-2.5">Kâr / Zarar ($)</th>
                    <th className="p-2.5">Kâr %</th>
                    <th className="p-2.5">Süre</th>
                    <th className="p-2.5">Çıkış Sebebi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.trades.map((trade) => {
                    const isProfit = trade.pnl >= 0;
                    return (
                      <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2.5 text-slate-400">
                          {new Date(trade.entryTime).toLocaleDateString()}
                        </td>
                        <td className="p-2.5 font-semibold text-slate-200">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] mr-1.5 ${
                              trade.side === 'LONG'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {trade.side}
                          </span>
                          {trade.symbol}
                        </td>
                        <td className="p-2.5 text-slate-300">${trade.entryPrice.toFixed(2)}</td>
                        <td className="p-2.5 text-slate-300">${trade.exitPrice.toFixed(2)}</td>
                        <td className={`p-2.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                        </td>
                        <td className={`p-2.5 font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}{trade.pnlPct.toFixed(2)}%
                        </td>
                        <td className="p-2.5 text-slate-400">{trade.durationMinutes} dk</td>
                        <td className="p-2.5 text-slate-400">{trade.exitReason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODE 2: Monte Carlo Simulation */}
      {activeTab === 'montecarlo' && monteCarloResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-mono">Medyan Beklenen Bakiye:</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                ${monteCarloResult.medianFinalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">1,000 Rastgele İterasyon</div>
            </div>

            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-mono">%95 Güven Aralığı Bakiye:</span>
              <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                ${monteCarloResult.confidenceInterval95.minBalance.toFixed(0)} - ${monteCarloResult.confidenceInterval95.maxBalance.toFixed(0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">En Kötü vs En İyi %5 Senaryo</div>
            </div>

            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-mono">%95 Olası Maks. Drawdown:</span>
              <div className="text-xl font-bold font-mono text-red-400 mt-1">
                -%{monteCarloResult.confidenceInterval95.maxDrawdownPct.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Risk Toleransı Limiti</div>
            </div>

            <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 font-mono">İflas / Sermaye Kaybı Riski:</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                %{monteCarloResult.ruinProbabilityPct.toFixed(1)} (Çok Düşük)
              </div>
              <div className="text-[10px] text-slate-500 mt-1">%50+ Bakiye Kaybı Olasılığı</div>
            </div>
          </div>

          <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Dice5 className="w-4 h-4 text-purple-400" />
              <span>Monte Carlo Güven Dilimleri Dağılım Grafiği (p5, p25, p50, p75, p95)</span>
            </h4>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monteCarloResult.simulatedEquityCurves}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="timeIndex" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="p95" stroke="#10b981" strokeWidth={1.5} dot={false} name="%95 İyimser (p95)" />
                  <Line type="monotone" dataKey="p50" stroke="#a855f7" strokeWidth={2.5} dot={false} name="Medyan Senaryo (p50)" />
                  <Line type="monotone" dataKey="p5" stroke="#ef4444" strokeWidth={1.5} dot={false} name="%5 Kötümser (p5)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: Walk-Forward Optimization */}
      {activeTab === 'walkforward' && wfoResult && (
        <div className="space-y-4">
          <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase">Walk-Forward Doğrulama (WFO) Sonucu</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Stratejinin geçmiş verilere ezberleme (overfitting) yapıp yapmadığını In-sample (Eğitim) ve Out-of-sample (Görülmemiş Test) blokları ile doğrular.
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[11px] text-slate-400 block">Ortalama Sağlamlık (Robustness):</span>
              <span className={`text-xl font-bold ${wfoResult.averageRobustnessPct >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                %{wfoResult.averageRobustnessPct.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {wfoResult.windows.map((win) => (
              <div key={win.windowIndex} className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold font-mono text-cyan-400">Pencere #{win.windowIndex}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400">
                    %{win.robustnessRatioPct.toFixed(0)} Doğruluk
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">In-Sample (Eğitim):</span>
                    <span className="font-bold text-emerald-400">+{win.inSampleReturnPct.toFixed(1)}% (Sharpe {win.inSampleSharpe.toFixed(2)})</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Out-of-Sample (Test):</span>
                    <span className="font-bold text-cyan-400">+{win.outOfSampleReturnPct.toFixed(1)}% (Sharpe {win.outOfSampleSharpe.toFixed(2)})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Auto Learning AI Modal */}
      <AutoLearningModal
        isOpen={isAutoLearnOpen}
        onClose={() => setIsAutoLearnOpen(false)}
        currentSymbol={symbol}
        currentTimeframe={timeframe}
        onStrategyAdded={(newStrat) => {
          if (onApplyStrategyToLive) onApplyStrategyToLive(newStrat);
          else if (onAddStrategy) onAddStrategy(newStrat);
          setSelectedStrategyId(newStrat.id);
        }}
      />
    </div>
  );
};
