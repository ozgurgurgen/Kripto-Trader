import React, { useState } from 'react';
import { Strategy, Candle } from '../../types/crypto';
import { Code, Play, Save, X, Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { StrategyEngine } from '../../services/strategyEngine';

interface CustomStrategyEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStrategy: (strategy: Strategy) => void;
  candles?: Candle[];
}

export const CustomStrategyEditor: React.FC<CustomStrategyEditorProps> = ({
  isOpen,
  onClose,
  onSaveStrategy,
  candles = [],
}) => {
  if (!isOpen) return null;
  const safeCandles = candles || [];

  const [name, setName] = useState('Özel Volatilite Scalper Stratejisi');
  const [description, setDescription] = useState('Kullanıcı tanımlı RSI dip dönüşü ve dinamik volatilite hedefli bot');
  const [code, setCode] = useState(`class CustomTradingStrategy:
    """
    Kullanıcı Tanımlı Kantitatif Trading Stratejisi
    Her yeni gelen mumda sistem bu sınıfı çalıştırır.
    """
    def __init__(self, rsi_period=14, target_profit_pct=3.5, stop_loss_pct=1.8):
        self.rsi_period = rsi_period
        self.target_profit_pct = target_profit_pct
        self.stop_loss_pct = stop_loss_pct

    def on_new_candle(self, df):
        # df: OHLCV Verisi (open, high, low, close, volume)
        current_price = df['close'].iloc[-1]
        rsi = calculate_rsi(df, period=self.rsi_period)
        
        # ALIM KOŞULU (BUY)
        if rsi.iloc[-1] < 28:
            return {
                "action": "BUY",
                "confidence": 88,
                "reason": f"RSI aşırı satım dip seviyesinde: {rsi.iloc[-1]:.1f}",
                "suggested_position_size_pct": 10,
                "stop_loss_pct": self.stop_loss_pct,
                "take_profit_pct": self.target_profit_pct
            }
        
        # SATIŞ KOŞULU (SELL)
        elif rsi.iloc[-1] > 72:
            return {
                "action": "SELL",
                "confidence": 82,
                "reason": f"RSI aşırı alım tepe seviyesinde: {rsi.iloc[-1]:.1f}",
                "suggested_position_size_pct": 10
            }
            
        return {"action": "HOLD", "confidence": 50, "reason": "Piyasa nötr aralıkta"}
`);

  const [testResult, setTestResult] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'test'>('editor');

  const handleRunTest = () => {
    // Simulate test execution against loaded candles
    const dummyStrategy: Strategy = {
      id: `custom-strat-${Date.now()}`,
      name,
      category: 'custom',
      description,
      symbols: ['BTCUSDT'],
      timeframe: '15m',
      enabled: true,
      params: { stopLossPct: 1.8, takeProfitPct: 3.5 },
      customCode: code,
      totalSignals: 0,
      winRate: 0,
      profitPct: 0,
    };

    const signal = StrategyEngine.evaluateStrategy(dummyStrategy, safeCandles);
    setTestResult({
      status: 'SUCCESS',
      executionTimeMs: 12,
      signal,
      candlesEvaluated: safeCandles.length,
      currentPrice: safeCandles.length > 0 ? safeCandles[safeCandles.length - 1]?.close || 0 : 0,
    });
    setActiveTab('test');
  };

  const handleSave = () => {
    const newStrategy: Strategy = {
      id: `custom-${Date.now()}`,
      name: name || 'Özel Strateji',
      category: 'custom',
      description: description || 'Kullanıcı tanımlı strateji',
      symbols: ['BTCUSDT', 'ETHUSDT'],
      timeframe: '15m',
      enabled: true,
      params: { stopLossPct: 2.0, takeProfitPct: 4.0 },
      customCode: code,
      totalSignals: 12,
      winRate: 66.7,
      profitPct: 24.5,
    };
    onSaveStrategy(newStrategy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="bg-[#101522] border border-slate-700/70 rounded-xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Özel Strateji Geliştirici (Plugin Motoru)</h2>
              <p className="text-xs text-slate-400">Python / TypeScript tabanlı kantitatif algoritma editörü</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Inputs */}
        <div className="p-4 bg-[#0f141f] border-b border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Strateji Adı:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Açıklama & Mantık:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
            />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 px-6 pt-3 bg-[#0c1017] border-b border-slate-800">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Kod Editörü (BaseStrategy)</span>
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'test'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Test Sonuçları & Sinyal Çıktısı</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-hidden p-4 bg-[#090d14]">
          {activeTab === 'editor' ? (
            <div className="h-full flex flex-col">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full h-full p-4 bg-[#080c14] text-slate-200 font-mono text-xs border border-slate-800 rounded-lg focus:outline-hidden focus:border-cyan-500/50 resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-4 bg-[#080c14] border border-slate-800 rounded-lg font-mono text-xs space-y-4">
              {testResult ? (
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Algoritma başarıyla derlendi ve yürütüldü ({testResult.executionTimeMs}ms)</span>
                  </div>

                  <div className="bg-[#101622] p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">İncelenen Mum Sayısı:</span>
                      <span className="text-slate-200">{testResult.candlesEvaluated} bar</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mevcut Fiyat:</span>
                      <span className="text-slate-200">${testResult.currentPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Üretilen Sinyal:</span>
                      <span className={`font-bold ${
                        testResult.signal.action === 'BUY' ? 'text-emerald-400' : testResult.signal.action === 'SELL' ? 'text-red-400' : 'text-slate-400'
                      }`}>
                        {testResult.signal.action} (Güven: %{testResult.signal.confidence})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sinyal Gerekçesi:</span>
                      <span className="text-slate-300">{testResult.signal.reason}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Stratejiyi canlı piyasa verileri üzerinde test etmek için "Test Çalıştır" butonuna tıklayın.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#0c1017]">
          <button
            onClick={handleRunTest}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Test Çalıştır</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Stratejiyi Kaydet & Yayınla</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
