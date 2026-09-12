import React, { useState } from 'react';
import { 
  AutoLearnConfig, 
  AutoLearnCandidateResult, 
  AutoLearnProgress, 
  Strategy, 
  Timeframe 
} from '../../types/crypto';
import { AutoLearningEngine } from '../../services/autoLearningEngine';
import { 
  Sparkles, 
  Play, 
  Cpu, 
  X, 
  BarChart3, 
  Flame, 
  Award, 
  PlusCircle, 
  Check, 
  RotateCcw, 
  Zap, 
  Calendar, 
  TrendingUp,
  ShieldAlert,
  BrainCircuit,
  Coins
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';

interface AutoLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  currentTimeframe: Timeframe;
  onStrategyAdded: (newStrategy: Strategy) => void;
}

export const AutoLearningModal: React.FC<AutoLearningModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  currentTimeframe: _currentTimeframe,
  onStrategyAdded,
}) => {
  const [config, setConfig] = useState<AutoLearnConfig>({
    symbol: currentSymbol || 'BTCUSDT',
    timeframe: '1d',
    historicalYears: 5,
    objective: 'MAX_COMPOUND_GROWTH',
    searchDepth: 'GOOGLE_AI_AUTONOMOUS',
    initialBalance: 10000,
    commissionPct: 0.1,
    slippagePct: 0.05,
    useTrailingStop: true,
    maxRiskPerTradePct: 85, // 85% Compounding Allocation for Max Exponential Growth
    compoundGrowthMode: true,
    allowUnconstrainedSignals: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<AutoLearnProgress | null>(null);
  const [candidates, setCandidates] = useState<AutoLearnCandidateResult[]>([]);
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(0);
  const [addedStrategyIds, setAddedStrategyIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'equity' | 'ai_rules' | 'yearly' | 'params'>('overview');

  if (!isOpen) return null;

  const handleStartLearning = async () => {
    setIsRunning(true);
    setCandidates([]);
    setSelectedCandidateIndex(0);

    try {
      const results = await AutoLearningEngine.runSelfLearningOptimizer(
        config,
        (p) => setProgress({ ...p })
      );
      setCandidates(results);
    } catch (err) {
      console.error('AutoLearn optimization failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddCandidateToStrategies = (candidate: AutoLearnCandidateResult) => {
    const newStrategy = AutoLearningEngine.convertToPlatformStrategy(candidate);
    onStrategyAdded(newStrategy);
    setAddedStrategyIds((prev) => [...prev, candidate.id]);
  };

  const selectedCandidate = candidates[selectedCandidateIndex] || candidates[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b0f19] border border-cyan-500/30 rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0e1422]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Google AI Otonom Grafik Analiz & Kasa Büyütme Motoru
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-emerald-400" />
                  Maksimum Kasa Büyütme (Compounding)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                5 Yıllık (2021-2026) veriyi serbestçe inceler; boğa dalgalarını sonuna kadar süren (%50-%250+), düşüşlerde nakde geçip kasayı katlayan otonom AI stratejileri üretir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
          
          {/* Top Configuration Card */}
          <div className="bg-[#101726] border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              
              {/* Symbol */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Grafik / Varlık:
                </label>
                <select
                  value={config.symbol}
                  onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                  disabled={isRunning}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="BTCUSDT">BTC/USDT (Bitcoin)</option>
                  <option value="ETHUSDT">ETH/USDT (Ethereum)</option>
                  <option value="SOLUSDT">SOL/USDT (Solana)</option>
                  <option value="BNBUSDT">BNB/USDT (BNB)</option>
                  <option value="AVAXUSDT">AVAX/USDT (Avalanche)</option>
                  <option value="DOGEUSDT">DOGE/USDT (Dogecoin)</option>
                  <option value="XRPUSDT">XRP/USDT (Ripple)</option>
                </select>
              </div>

              {/* Optimization Mode */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  AI Analiz Modu:
                </label>
                <select
                  value={config.searchDepth}
                  onChange={(e) => setConfig({ ...config, searchDepth: e.target.value as any })}
                  disabled={isRunning}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="GOOGLE_AI_AUTONOMOUS">✨ Google Gemini 3.8 Flash Otonom</option>
                  <option value="DEEP_GENETIC">🧬 Derin Genetik Optimizasyon (AutoML)</option>
                  <option value="STANDARD">⚡ Standart Hızlı Tarama</option>
                </select>
              </div>

              {/* Optimization Objective */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Hedef Strateji Prensibi:
                </label>
                <select
                  value={config.objective}
                  onChange={(e) => setConfig({ ...config, objective: e.target.value as any })}
                  disabled={isRunning}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
                >
                  <option value="MAX_COMPOUND_GROWTH">🔥 Maksimum Kasa Katlama (Bileşik Kâr)</option>
                  <option value="MAX_PROFIT">🚀 Yüksek Toplam Getiri & Trend Sürücü</option>
                  <option value="MAX_SHARPE">🛡️ Yüksek Sharpe / Düşük Drawdown</option>
                  <option value="HIGH_WIN_RATE">🎯 Yüksek Kazanma Oranı (%70+ Win)</option>
                </select>
              </div>

              {/* Capital Allocation Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Bileşik Kasa Tahsisi:
                  </label>
                  <span className="text-[11px] font-mono font-bold text-cyan-400">
                    %{config.maxRiskPerTradePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="5"
                  value={config.maxRiskPerTradePct}
                  onChange={(e) => setConfig({ ...config, maxRiskPerTradePct: Number(e.target.value) })}
                  disabled={isRunning}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>

              {/* Start Button */}
              <div className="flex items-end">
                <button
                  onClick={handleStartLearning}
                  disabled={isRunning}
                  className={`w-full py-2 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                    isRunning
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-cyan-500/20 hover:scale-[1.02]'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Grafik Analiz Ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Otonom AI Analizi Başlat</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                <Check className="w-3 h-3 text-cyan-400" /> 5 Yıl (2021-2026) Kripto Döngüleri
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                <TrendingUp className="w-3 h-3 text-emerald-400" /> Dinamik Trailing Profit & Boğa Dalgası Sürücü
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
                <Coins className="w-3 h-3 text-purple-400" /> Kazançları Reinvest Eden Bileşik Kasa Büyütmesi
              </span>
            </div>
          </div>

          {/* Real-time Progress Bar & Logs when Running */}
          {isRunning && progress && (
            <div className="bg-[#101726] border border-cyan-500/40 rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold text-white">
                    {progress.activeEvaluatingModel}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <span>Modeller: <strong className="text-cyan-400">{progress.testedModelsCount}</strong></span>
                  <span>En Yüksek 5Y Kasa Büyümesi: <strong className="text-emerald-400 font-bold">+{progress.bestReturnPct.toLocaleString()}%</strong></span>
                  <span>%{progress.percent}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Streaming Logs */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 font-mono text-[11px] space-y-1.5 max-h-36 overflow-y-auto">
                {progress.logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-2">
                    <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span
                      className={
                        log.type === 'success'
                          ? 'text-emerald-400 font-semibold'
                          : log.type === 'highlight'
                          ? 'text-cyan-300 font-semibold'
                          : log.type === 'warn'
                          ? 'text-amber-400'
                          : 'text-slate-400'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Display */}
          {candidates.length > 0 && selectedCandidate && (
            <div className="space-y-6">
              
              {/* Podium: Discovered Strategies */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">
                      5 Yıllık Veride Maksimum Kasa Büyütme Başarısı Gösteren Stratejiler
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400">
                    Toplam {candidates.length} aday arasından seçildi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {candidates.slice(0, 3).map((cand, idx) => {
                    const isSelected = selectedCandidateIndex === idx;
                    const isAdded = addedStrategyIds.includes(cand.id);

                    return (
                      <div
                        key={cand.id}
                        onClick={() => setSelectedCandidateIndex(idx)}
                        className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                          isSelected
                            ? 'bg-cyan-950/30 border-cyan-500 shadow-lg shadow-cyan-500/10'
                            : 'bg-[#101726] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {idx === 0 && (
                          <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md">
                            🏆 #1 MAKS KASA BÜYÜTME
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {cand.name}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold uppercase">
                            Skor: {cand.score}/100
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                          <div className="bg-slate-900/60 p-2 rounded-lg border border-emerald-500/20">
                            <span className="text-[10px] text-slate-400 block">5Y Kasa Büyümesi:</span>
                            <span className="text-sm font-black text-emerald-400">
                              +{Math.round(cand.fiveYearReturnPct).toLocaleString()}%
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              ${cand.initialBalance.toLocaleString()} → ${cand.finalBalance.toLocaleString()}
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Kazanma Oranı:</span>
                            <span className="text-sm font-bold text-cyan-400">
                              %{cand.winRatePct.toFixed(1)}
                            </span>
                            <span className="text-[9px] text-slate-500 block">
                              {cand.winTrades} Kâr / {cand.lossTrades} Zarar
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Kâr Faktörü:</span>
                            <span className="text-sm font-bold text-indigo-300">
                              {cand.profitFactor.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg">
                            <span className="text-[10px] text-slate-400 block">Maks Drawdown:</span>
                            <span className="text-sm font-bold text-rose-400">
                              -%{cand.maxDrawdownPct.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {cand.totalTrades} İşlem • CAGR: %{cand.cagrPct.toFixed(0)}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddCandidateToStrategies(cand);
                            }}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                              isAdded
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Eklendi</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Stratejiye Ekle</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Strategy Deep Analysis Tabs */}
              <div className="bg-[#101726] border border-slate-800 rounded-xl overflow-hidden">
                
                {/* Tabs Header */}
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-900/50">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                        activeTab === 'overview'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Kasa Metrikleri & ROI
                    </button>
                    <button
                      onClick={() => setActiveTab('equity')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                        activeTab === 'equity'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      5 Yıllık Bakiye Eğrisi vs Buy & Hold
                    </button>
                    {selectedCandidate.params?.rules && (
                      <button
                        onClick={() => setActiveTab('ai_rules')}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                          activeTab === 'ai_rules'
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Google AI Mantığı & Kurallar</span>
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('yearly')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                        activeTab === 'yearly'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Yıllık Performans Matrisi (2021-2026)
                    </button>
                    <button
                      onClick={() => setActiveTab('params')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
                        activeTab === 'params'
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Optimize Edilen Parametreler
                    </button>
                  </div>

                  {/* Add to strategies button */}
                  <button
                    onClick={() => handleAddCandidateToStrategies(selectedCandidate)}
                    disabled={addedStrategyIds.includes(selectedCandidate.id)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                      addedStrategyIds.includes(selectedCandidate.id)
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    {addedStrategyIds.includes(selectedCandidate.id) ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Stratejilere Eklendi</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Bu Stratejiyi Kaydet & Canlıya Al</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tab 1: Overview */}
                {activeTab === 'overview' && (
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-slate-900/80 border border-emerald-500/30 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">5Y Toplam Büyüme (ROI):</span>
                        <span className="text-xl font-black text-emerald-400">
                          +{Math.round(selectedCandidate.fiveYearReturnPct).toLocaleString()}%
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          ${selectedCandidate.initialBalance.toLocaleString()} → ${selectedCandidate.finalBalance.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">Yıllık Bileşik Getiri (CAGR):</span>
                        <span className="text-lg font-bold text-cyan-400">
                          %{selectedCandidate.cagrPct.toFixed(0)} / yıl
                        </span>
                        <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                          HODL Üstü Alfa: +%{Math.round(selectedCandidate.alphaOverBenchmarkPct).toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">Kazanma Oranı (Win Rate):</span>
                        <span className="text-lg font-bold text-blue-400">
                          %{selectedCandidate.winRatePct.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {selectedCandidate.winTrades} Kârlı / {selectedCandidate.lossTrades} Zararlı
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">Kâr Faktörü (Profit Factor):</span>
                        <span className="text-lg font-bold text-indigo-300">
                          {selectedCandidate.profitFactor.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Payoff Oranı: {selectedCandidate.payoffRatio.toFixed(2)}
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">Sharpe & Sortino:</span>
                        <span className="text-lg font-bold text-amber-400">
                          {selectedCandidate.sharpeRatio.toFixed(2)} / {selectedCandidate.sortinoRatio.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Yüksek Risk-Ayarlı Getiri
                        </span>
                      </div>

                      <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                        <span className="text-[10px] text-slate-400 block mb-1">Maksimum Drawdown:</span>
                        <span className="text-lg font-bold text-rose-400">
                          -%{selectedCandidate.maxDrawdownPct.toFixed(1)}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          En Yüksek Geri Çekilme
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-start gap-3">
                      <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-white mb-1">
                          AI Kasa Büyütme Mantığı & Strateji Açıklaması:
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {selectedCandidate.params?.aiAnalysis || selectedCandidate.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: 5-Year Equity Curve */}
                {activeTab === 'equity' && (
                  <div className="p-5">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={selectedCandidate.equityCurve}>
                          <defs>
                            <linearGradient id="aiStrategyGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis 
                            dataKey="time" 
                            stroke="#64748b" 
                            fontSize={11}
                            tickLine={false}
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={11} 
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            tickLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#0f172a', 
                              borderColor: '#334155',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }} 
                            formatter={(value: any, name: any) => [
                              `$${Number(value).toLocaleString()}`, 
                              name === 'equity' ? 'AI Bileşik Bakiye ($)' : 'Buy & Hold (HODL)'
                            ]}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                            formatter={(value) => value === 'equity' ? 'AI Otonom Kasa Büyüme Eğrisi' : 'Benchmark (Buy & Hold HODL)'}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="equity" 
                            stroke="#10b981" 
                            strokeWidth={2.5}
                            fillOpacity={1} 
                            fill="url(#aiStrategyGrad)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="benchmarkEquity" 
                            stroke="#64748b" 
                            strokeWidth={1.5}
                            strokeDasharray="4 4"
                            fillOpacity={1} 
                            fill="url(#benchmarkGrad)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tab: Google AI Rules & Logic */}
                {activeTab === 'ai_rules' && selectedCandidate.params?.rules && (
                  <div className="p-5 space-y-4">
                    <div className="bg-slate-900/70 border border-cyan-500/20 p-4 rounded-xl">
                      <h4 className="text-xs font-bold text-cyan-300 mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-4 h-4 text-cyan-400" />
                        <span>Google Gemini AI Tarafından Belirlenen Giriş, Çıkış ve Kasa Büyütme Kuralları</span>
                      </h4>

                      <ul className="space-y-2 text-xs text-slate-200">
                        {selectedCandidate.params.rules.map((rule: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tab 3: Yearly Performance Matrix */}
                {activeTab === 'yearly' && (
                  <div className="p-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                            <th className="pb-3">Yıl</th>
                            <th className="pb-3">Toplam İşlem</th>
                            <th className="pb-3">Kazanma Oranı (%)</th>
                            <th className="pb-3">Strateji Getirisi (%)</th>
                            <th className="pb-3">Benchmark HODL (%)</th>
                            <th className="pb-3">Maks Drawdown (%)</th>
                            <th className="pb-3 text-right">Net Kâr ($)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {selectedCandidate.yearlyStats.map((stat) => (
                            <tr key={stat.year} className="hover:bg-slate-900/40">
                              <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{stat.year}</span>
                              </td>
                              <td className="py-2.5 text-slate-300">{stat.trades}</td>
                              <td className="py-2.5 text-cyan-300">%{stat.winRatePct.toFixed(1)}</td>
                              <td className="py-2.5 font-bold text-emerald-400">
                                {stat.returnPct >= 0 ? `+${stat.returnPct.toFixed(1)}%` : `${stat.returnPct.toFixed(1)}%`}
                              </td>
                              <td className="py-2.5 text-slate-400">
                                {stat.benchmarkReturnPct >= 0 ? `+${stat.benchmarkReturnPct.toFixed(1)}%` : `${stat.benchmarkReturnPct.toFixed(1)}%`}
                              </td>
                              <td className="py-2.5 text-rose-400">-%{stat.maxDrawdownPct.toFixed(1)}</td>
                              <td className={`py-2.5 text-right font-bold ${stat.pnlUsdt >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {stat.pnlUsdt >= 0 ? `+$${Math.round(stat.pnlUsdt).toLocaleString()}` : `-$${Math.round(Math.abs(stat.pnlUsdt)).toLocaleString()}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab 4: Parameters Breakdown */}
                {activeTab === 'params' && (
                  <div className="p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(selectedCandidate.params).filter(([k]) => k !== 'rules' && k !== 'aiAnalysis').map(([key, val]) => (
                        <div key={key} className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg">
                          <span className="text-[10px] text-slate-400 font-mono block mb-1">
                            {key}:
                          </span>
                          <span className="text-sm font-bold text-cyan-300">
                            {typeof val === 'number' ? val.toString() : JSON.stringify(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Initial State / Explanatory Banner */}
          {!isRunning && candidates.length === 0 && (
            <div className="bg-gradient-to-r from-slate-900 via-[#0e172a] to-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
                <BrainCircuit className="w-8 h-8 animate-pulse" />
              </div>
              
              <div className="max-w-xl mx-auto space-y-2">
                <h3 className="text-base font-bold text-white">
                  5 Yıllık Veride Serbest Grafik Analizi ve Maksimum Kasa Katlama
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sabit küçük kâr alma bariyerlerine bağlı kalmaksızın, Google Gemini AI ve adaptif kantitatif motor 5 yıllık tüm boğa koşularını, ayı diplerini ve volatilite kırılımlarını analiz ederek kasayı katlayan (Compound ROI) en yüksek getirili stratejiyi üretir.
                </p>
              </div>

              <button
                onClick={handleStartLearning}
                className="py-2.5 px-6 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white shadow-lg shadow-cyan-500/20 transition hover:scale-105 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>Otonom AI Analizini ve Kasa Büyütmeyi Başlat</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
