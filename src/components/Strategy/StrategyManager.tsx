import React, { useState } from 'react';
import { Strategy, Signal, Candle } from '../../types/crypto';
import { 
  Zap, 
  Play, 
  Pause, 
  Sliders, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Code,
  Activity,
  Layers,
  Sparkles,
  Cpu
} from 'lucide-react';
import { StrategyEngine } from '../../services/strategyEngine';
import { CustomStrategyEditor } from './CustomStrategyEditor';
import { AutoLearningModal } from './AutoLearningModal';

interface StrategyManagerProps {
  strategies: Strategy[];
  onToggleStrategy: (id: string) => void;
  onUpdateStrategyParams: (id: string, params: Record<string, any>) => void;
  onAddStrategy: (strat: Strategy) => void;
  candles: Candle[];
  onSignalTriggered?: (signal: Signal) => void;
  currentSymbol?: string;
}

export const StrategyManager: React.FC<StrategyManagerProps> = ({
  strategies,
  onToggleStrategy,
  onUpdateStrategyParams,
  onAddStrategy,
  candles,
  currentSymbol = 'BTCUSDT',
}) => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(strategies[0]?.id || '');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAutoLearnOpen, setIsAutoLearnOpen] = useState(false);

  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0];

  const handleParamChange = (paramKey: string, val: any) => {
    if (!selectedStrategy) return;
    onUpdateStrategyParams(selectedStrategy.id, {
      ...selectedStrategy.params,
      [paramKey]: val,
    });
  };

  const evaluateActiveSignal = (strat: Strategy) => {
    return StrategyEngine.evaluateStrategy(strat, candles);
  };

  const handleAddAutoStrategy = (newStrat: Strategy) => {
    onAddStrategy(newStrat);
    setSelectedStrategyId(newStrat.id);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Left List of Strategies */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100">Algoritmik Stratejiler</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsAutoLearnOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition shadow-sm"
              title="5 Yıllık Veri ile Kendi Kendine Öğrenen AI Optimizasyonu"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Öğren</span>
            </button>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Özel</span>
            </button>
          </div>
        </div>

        {/* AI Auto-Optimizer Banner */}
        <div 
          onClick={() => setIsAutoLearnOpen(true)}
          className="cursor-pointer bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 hover:border-cyan-400/60 rounded-xl p-3 flex items-center justify-between gap-3 group transition shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">
                AI 5 Yıllık Strateji Keşfi
              </div>
              <div className="text-[10px] text-slate-400">
                Grafiğe göre en kârlı stratejiyi bulur
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded bg-cyan-500 text-slate-950 shadow-sm">
            Çalıştır
          </span>
        </div>

        {/* Strategy Card List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {strategies.map((strat) => {
            const isSelected = selectedStrategy?.id === strat.id;
            const signal = evaluateActiveSignal(strat);

            return (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategyId(strat.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#151c2c] border-cyan-500/50 shadow-md'
                    : 'bg-[#101522] border-slate-800/80 hover:bg-[#131926]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        strat.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    />
                    <h3 className="text-xs font-bold text-slate-200">{strat.name}</h3>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStrategy(strat.id);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      strat.enabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {strat.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{strat.description}</p>

                {/* Signal Badge */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono text-slate-400">
                    {strat.symbols.join(', ')} • {strat.timeframe}
                  </span>
                  <span
                    className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                      signal.action === 'BUY'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : signal.action === 'SELL'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {signal.action} (%{signal.confidence})
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Strategy Details & Parameter Sliders */}
      {selectedStrategy && (
        <div className="flex-1 bg-[#101522] border border-slate-800/80 rounded-xl p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-slate-100">{selectedStrategy.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono capitalize">
                  {selectedStrategy.category}
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedStrategy.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right text-xs">
                <div className="text-slate-400">Kazanma Oranı</div>
                <div className="font-mono font-bold text-emerald-400">%{selectedStrategy.winRate}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-slate-400">Tarihsel Kâr</div>
                <div className="font-mono font-bold text-cyan-400">+{selectedStrategy.profitPct}%</div>
              </div>
              <button
                onClick={() => onToggleStrategy(selectedStrategy.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-xs transition-colors ${
                  selectedStrategy.enabled
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                }`}
              >
                {selectedStrategy.enabled ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Botu Durdur
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Botu Başlat
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Live Signal Evaluation Box */}
          {(() => {
            const liveSig = evaluateActiveSignal(selectedStrategy);
            return (
              <div className="p-4 rounded-xl bg-[#141a29] border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">Anlık Sinyal Teşhisi</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Son Kontrol: {new Date(liveSig.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-xl font-bold font-mono px-3 py-1 rounded-lg ${
                        liveSig.action === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : liveSig.action === 'SELL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {liveSig.action === 'BUY' ? 'AL (BUY)' : liveSig.action === 'SELL' ? 'SAT (SELL)' : 'BEKLE (HOLD)'}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{liveSig.reason}</div>
                      <div className="text-[11px] text-slate-400">
                        Önerilen Pozisyon Büyüklüğü: %{liveSig.suggestedPositionSizePct}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-xs">
                    <div className="text-slate-400">Güven Skoru</div>
                    <div className="text-cyan-400 font-bold text-sm">%{liveSig.confidence}</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Parameters Sliders */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Strateji Parametreleri & Eşik Değerleri
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selectedStrategy.params).map(([key, value]) => {
                const isNumber = typeof value === 'number';
                return (
                  <div key={key} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{value}</span>
                    </div>

                    {isNumber && (
                      <input
                        type="range"
                        min={key.toLowerCase().includes('pct') ? 0.5 : 2}
                        max={key.toLowerCase().includes('pct') ? 15 : 250}
                        step={key.toLowerCase().includes('pct') ? 0.1 : 1}
                        value={value}
                        onChange={(e) => handleParamChange(key, parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Auto Learning AI Modal */}
      <AutoLearningModal
        isOpen={isAutoLearnOpen}
        onClose={() => setIsAutoLearnOpen(false)}
        currentSymbol={currentSymbol}
        currentTimeframe="1d"
        onStrategyAdded={handleAddAutoStrategy}
      />

      {/* Custom Strategy Editor Modal */}
      <CustomStrategyEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveStrategy={onAddStrategy}
        candles={candles}
      />
    </div>
  );
};
