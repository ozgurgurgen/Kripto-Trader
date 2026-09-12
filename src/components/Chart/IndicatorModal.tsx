import React, { useState, useMemo } from 'react';
import { IndicatorSettings, DEFAULT_INDICATOR_SETTINGS } from '../../types/crypto';
import { X, Sliders, Check, Search, Sparkles, RotateCcw, TrendingUp, Activity, BarChart2, Layers, Compass, Zap } from 'lucide-react';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: IndicatorSettings;
  onUpdateSettings: (newSettings: IndicatorSettings) => void;
}

type CategoryType = 'all' | 'trend' | 'volatility' | 'momentum' | 'volume' | 'levels';

export const IndicatorModal: React.FC<IndicatorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggle = (key: keyof IndicatorSettings, field = 'enabled') => {
    onUpdateSettings({
      ...settings,
      [key]: {
        ...(settings[key] as any),
        [field]: !(settings[key] as any)[field],
      },
    });
  };

  const updateParam = (key: keyof IndicatorSettings, param: string, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: {
        ...(settings[key] as any),
        [param]: value,
      },
    });
  };

  // Preset Handlers
  const applyPreset = (presetName: 'default' | 'scalper' | 'trendFollower' | 'breakout' | 'clearAll') => {
    if (presetName === 'default') {
      onUpdateSettings(DEFAULT_INDICATOR_SETTINGS);
    } else if (presetName === 'scalper') {
      onUpdateSettings({
        ...DEFAULT_INDICATOR_SETTINGS,
        sma: { ...DEFAULT_INDICATOR_SETTINGS.sma, enabled: false },
        ema20: { ...DEFAULT_INDICATOR_SETTINGS.ema20, enabled: true },
        ema50: { ...DEFAULT_INDICATOR_SETTINGS.ema50, enabled: false },
        ema200: { ...DEFAULT_INDICATOR_SETTINGS.ema200, enabled: false },
        hma: { ...DEFAULT_INDICATOR_SETTINGS.hma, enabled: true },
        supertrend: { ...DEFAULT_INDICATOR_SETTINGS.supertrend, enabled: false },
        bollingerBands: { ...DEFAULT_INDICATOR_SETTINGS.bollingerBands, enabled: true },
        stochastic: { ...DEFAULT_INDICATOR_SETTINGS.stochastic, enabled: true },
        rsi: { ...DEFAULT_INDICATOR_SETTINGS.rsi, enabled: true },
        volume: { enabled: true },
      });
    } else if (presetName === 'trendFollower') {
      onUpdateSettings({
        ...DEFAULT_INDICATOR_SETTINGS,
        ema20: { ...DEFAULT_INDICATOR_SETTINGS.ema20, enabled: true },
        ema50: { ...DEFAULT_INDICATOR_SETTINGS.ema50, enabled: true },
        ema200: { ...DEFAULT_INDICATOR_SETTINGS.ema200, enabled: true },
        supertrend: { ...DEFAULT_INDICATOR_SETTINGS.supertrend, enabled: true },
        parabolicSar: { ...DEFAULT_INDICATOR_SETTINGS.parabolicSar, enabled: true },
        adx: { ...DEFAULT_INDICATOR_SETTINGS.adx, enabled: true },
        macd: { ...DEFAULT_INDICATOR_SETTINGS.macd, enabled: true },
      });
    } else if (presetName === 'breakout') {
      onUpdateSettings({
        ...DEFAULT_INDICATOR_SETTINGS,
        keltnerChannels: { ...DEFAULT_INDICATOR_SETTINGS.keltnerChannels, enabled: true },
        donchianChannels: { ...DEFAULT_INDICATOR_SETTINGS.donchianChannels, enabled: true },
        bollingerBands: { ...DEFAULT_INDICATOR_SETTINGS.bollingerBands, enabled: true },
        atr: { ...DEFAULT_INDICATOR_SETTINGS.atr, enabled: true },
        obv: { ...DEFAULT_INDICATOR_SETTINGS.obv, enabled: true },
      });
    } else if (presetName === 'clearAll') {
      const cleared: IndicatorSettings = { ...DEFAULT_INDICATOR_SETTINGS };
      (Object.keys(cleared) as (keyof IndicatorSettings)[]).forEach((k) => {
        if (cleared[k] && typeof cleared[k] === 'object' && 'enabled' in cleared[k]) {
          (cleared[k] as any).enabled = false;
        }
      });
      onUpdateSettings(cleared);
    }
  };

  // Count active indicators
  const activeCount = useMemo(() => {
    let count = 0;
    (Object.keys(settings) as (keyof IndicatorSettings)[]).forEach((k) => {
      if (settings[k] && (settings[k] as any).enabled) count++;
    });
    return count;
  }, [settings]);

  // Categories config
  const categories = [
    { id: 'all' as CategoryType, label: 'Tümü', icon: Layers, count: 20 },
    { id: 'trend' as CategoryType, label: 'Trend & Ortalamalar', icon: TrendingUp, count: 6 },
    { id: 'volatility' as CategoryType, label: 'Volatilite & Bantlar', icon: Activity, count: 4 },
    { id: 'momentum' as CategoryType, label: 'Momentum & Osilatör', icon: Zap, count: 6 },
    { id: 'volume' as CategoryType, label: 'Hacim & Para Akışı', icon: BarChart2, count: 3 },
    { id: 'levels' as CategoryType, label: 'Akıllı Seviyeler', icon: Compass, count: 1 },
  ];

  // Helper filter
  const matchesSearch = (text: string, tags: string[] = []) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return text.toLowerCase().includes(q) || tags.some((t) => t.toLowerCase().includes(q));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-[#101522] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#0c101a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">Teknik İndikatör Kütüphanesi</h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-mono font-semibold border border-cyan-500/30">
                  {activeCount} / 20 Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Piyasanın en çok tercih edilen 20 teknik analiz indikatörü ve osilatörleri</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Presets */}
        <div className="p-3 sm:px-6 sm:py-3 bg-[#0e1320] border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="İndikatör ara (RSI, Ichimoku, Bollinger, Keltner, SAR...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-900 border border-slate-700/80 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => applyPreset('default')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Varsayılan
            </button>
            <button
              onClick={() => applyPreset('scalper')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Scalper
            </button>
            <button
              onClick={() => applyPreset('trendFollower')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Trend
            </button>
            <button
              onClick={() => applyPreset('breakout')}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              Kırılım
            </button>
            <button
              onClick={() => applyPreset('clearAll')}
              className="p-1.5 text-xs font-semibold rounded-lg bg-slate-800/60 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-800 transition-colors"
              title="Tümünü Temizle"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-1 px-3 sm:px-6 py-2 bg-[#0a0e17] border-b border-slate-800 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Indicator Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* 1. TREND & MOVING AVERAGES */}
          {(activeCategory === 'all' || activeCategory === 'trend') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  1. Trend & Hareketli Ortalamalar (Overlay)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. EMA 20 */}
                {matchesSearch('EMA 20 Üstel Hareketli Ortalama Kısa Vade', ['ema', 'trend', 'ortalama']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.ema20.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('ema20')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.ema20.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.ema20.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">1. EMA (Kısa Vade)</span>
                          <p className="text-[11px] text-slate-400">Üstel hızlı fiyat ortalaması</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.ema20.period}
                          onChange={(e) => updateParam('ema20', 'period', parseInt(e.target.value) || 20)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-center text-slate-200"
                        />
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.ema20.color }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EMA 50 */}
                {matchesSearch('EMA 50 Üstel Hareketli Ortalama Orta Vade', ['ema', 'trend', 'ortalama']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.ema50.enabled ? 'bg-[#151c2d] border-amber-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('ema50')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.ema50.enabled ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.ema50.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">2. EMA 50 (Orta Vade)</span>
                          <p className="text-[11px] text-slate-400">Dinamik destek/direnç eşiği</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.ema50.period}
                          onChange={(e) => updateParam('ema50', 'period', parseInt(e.target.value) || 50)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-center text-slate-200"
                        />
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.ema50.color }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EMA 200 */}
                {matchesSearch('EMA 200 Uzun Vade Ana Trend Boğa Ayı', ['ema', 'trend', 'ortalama']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.ema200.enabled ? 'bg-[#151c2d] border-purple-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('ema200')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.ema200.enabled ? 'bg-purple-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.ema200.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">3. EMA 200 (Ana Trend)</span>
                          <p className="text-[11px] text-slate-400">Makro trend ve Golden/Death Cross</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.ema200.period}
                          onChange={(e) => updateParam('ema200', 'period', parseInt(e.target.value) || 200)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-center text-slate-200"
                        />
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.ema200.color }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SMA */}
                {matchesSearch('SMA Basit Hareketli Ortalama', ['sma', 'trend', 'ortalama']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.sma.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('sma')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.sma.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.sma.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">4. SMA (Basit Ortalama)</span>
                          <p className="text-[11px] text-slate-400">Standart aritmetik ortalama</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.sma.period}
                          onChange={(e) => updateParam('sma', 'period', parseInt(e.target.value) || 20)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-center text-slate-200"
                        />
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.sma.color }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. HMA (Hull Moving Average) */}
                {matchesSearch('HMA Hull Moving Average Gecikmesiz Hızlı Ortalama', ['hma', 'hull', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.hma.enabled ? 'bg-[#151c2d] border-emerald-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('hma')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.hma.enabled ? 'bg-emerald-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.hma.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">5. HMA (Hull Moving Average)</span>
                          <p className="text-[11px] text-slate-400">Sıfır gecikmeli yumuşatılmış hızlı trend</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.hma.period}
                          onChange={(e) => updateParam('hma', 'period', parseInt(e.target.value) || 16)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-center text-slate-200"
                        />
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.hma.color }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. SuperTrend */}
                {matchesSearch('SuperTrend ATR Stop Trend Takip', ['supertrend', 'atr', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.supertrend.enabled ? 'bg-[#151c2d] border-emerald-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('supertrend')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.supertrend.enabled ? 'bg-emerald-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.supertrend.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">6. SuperTrend</span>
                          <p className="text-[11px] text-slate-400">Volatiliteye duyarlı trend ve trailing stop</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.supertrend.period}
                          onChange={(e) => updateParam('supertrend', 'period', parseInt(e.target.value) || 10)}
                          className="w-10 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                        <span className="text-xs text-slate-400">M:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.supertrend.multiplier}
                          onChange={(e) => updateParam('supertrend', 'multiplier', parseFloat(e.target.value) || 3)}
                          className="w-10 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Parabolic SAR */}
                {matchesSearch('Parabolic SAR Stop and Reverse Dönüş Noktaları', ['sar', 'parabolic', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.parabolicSar.enabled ? 'bg-[#151c2d] border-amber-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('parabolicSar')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.parabolicSar.enabled ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.parabolicSar.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">7. Parabolic SAR</span>
                          <p className="text-[11px] text-slate-400">Noktasal trend dönüş ve stop seviyeleri</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">Step:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={settings.parabolicSar.step}
                          onChange={(e) => updateParam('parabolicSar', 'step', parseFloat(e.target.value) || 0.02)}
                          className="w-12 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Ichimoku Cloud */}
                {matchesSearch('Ichimoku Kinko Hyo Bulut Tenkan Kijun Senkou', ['ichimoku', 'cloud', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.ichimoku.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('ichimoku')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.ichimoku.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.ichimoku.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">8. Ichimoku Bulutu</span>
                          <p className="text-[11px] text-slate-400">Tenkan (9), Kijun (26), Senkou Span A/B</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        9 / 26 / 52
                      </span>
                    </div>
                  </div>
                )}

                {/* 9. VWAP */}
                {matchesSearch('VWAP Hacim Ağırlıklı Ortalama Fiyat', ['vwap', 'hacim', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all md:col-span-2 ${
                    settings.vwap.enabled ? 'bg-[#151c2d] border-pink-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('vwap')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.vwap.enabled ? 'bg-pink-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.vwap.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">9. VWAP (Volume Weighted Average Price)</span>
                          <p className="text-[11px] text-slate-400">Kurumsal yatırımcıların takip ettiği hacim ağırlıklı referans fiyat</p>
                        </div>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: settings.vwap.color }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. VOLATILITY & BANDS */}
          {(activeCategory === 'all' || activeCategory === 'volatility') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  2. Volatilite & Fiyat Bantları (Bands & Channels)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 10. Bollinger Bands */}
                {matchesSearch('Bollinger Bands Bollinger Bantları Standart Sapma', ['bollinger', 'bb', 'volatility', 'bant']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.bollingerBands.enabled ? 'bg-[#151c2d] border-blue-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('bollingerBands')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.bollingerBands.enabled ? 'bg-blue-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.bollingerBands.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">10. Bollinger Bantları</span>
                          <p className="text-[11px] text-slate-400">20 periyot SMA ve 2 Standart Sapma</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">Sapma:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.bollingerBands.stdDev}
                          onChange={(e) => updateParam('bollingerBands', 'stdDev', parseFloat(e.target.value) || 2)}
                          className="w-12 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. Keltner Channels */}
                {matchesSearch('Keltner Channels Keltner Kanalları EMA ATR', ['keltner', 'volatility', 'kanal']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.keltnerChannels.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('keltnerChannels')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.keltnerChannels.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.keltnerChannels.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">11. Keltner Kanalları</span>
                          <p className="text-[11px] text-slate-400">EMA tabanlı ATR volatilite kanalı</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">M:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={settings.keltnerChannels.multiplier}
                          onChange={(e) => updateParam('keltnerChannels', 'multiplier', parseFloat(e.target.value) || 2)}
                          className="w-12 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 12. Donchian Channels */}
                {matchesSearch('Donchian Channels Fiyat Kanalı En Yüksek En Düşük Breakout', ['donchian', 'breakout', 'kanal']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.donchianChannels.enabled ? 'bg-[#151c2d] border-purple-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('donchianChannels')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.donchianChannels.enabled ? 'bg-purple-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.donchianChannels.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">12. Donchian Kanalları</span>
                          <p className="text-[11px] text-slate-400">20 periyot tepe/dip breakout kanalı</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.donchianChannels.period}
                          onChange={(e) => updateParam('donchianChannels', 'period', parseInt(e.target.value) || 20)}
                          className="w-12 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. ATR */}
                {matchesSearch('ATR Average True Range Ortalama Gerçek Aralık Volatilite', ['atr', 'volatility']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.atr.enabled ? 'bg-[#151c2d] border-amber-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('atr')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.atr.enabled ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.atr.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">13. ATR (Average True Range)</span>
                          <p className="text-[11px] text-slate-400">Mumların mutlak volatilite aralığı</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.atr.period}
                          onChange={(e) => updateParam('atr', 'period', parseInt(e.target.value) || 14)}
                          className="w-12 px-1 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MOMENTUM & OSCILLATORS */}
          {(activeCategory === 'all' || activeCategory === 'momentum') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  3. Momentum & Osilatörler (Sub-Panel)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 14. RSI */}
                {matchesSearch('RSI Relative Strength Index Göreceli Güç Aşırı Alım Satım', ['rsi', 'momentum', 'osilator']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.rsi.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('rsi')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.rsi.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.rsi.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">14. RSI (Göreceli Güç İndeksi)</span>
                          <p className="text-[11px] text-slate-400">Aşırı Alım (70) / Aşırı Satım (30)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.rsi.period}
                          onChange={(e) => updateParam('rsi', 'period', parseInt(e.target.value) || 14)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 15. MACD */}
                {matchesSearch('MACD Moving Average Convergence Divergence Sinyal Kesişim', ['macd', 'momentum']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.macd.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('macd')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.macd.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.macd.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">15. MACD (Trend & Sinyal)</span>
                          <p className="text-[11px] text-slate-400">Hızlı (12) / Yavaş (26) / Sinyal (9)</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        12 / 26 / 9
                      </span>
                    </div>
                  </div>
                )}

                {/* 16. Stochastic */}
                {matchesSearch('Stochastic Oscillator Stokastik Osilatör', ['stochastic', 'stoch', 'momentum']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.stochastic.enabled ? 'bg-[#151c2d] border-cyan-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('stochastic')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.stochastic.enabled ? 'bg-cyan-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.stochastic.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">16. Stochastic Osilatör</span>
                          <p className="text-[11px] text-slate-400">%K (14), %D (3) Kesişimleri</p>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        14, 3, 3
                      </span>
                    </div>
                  </div>
                )}

                {/* 17. CCI */}
                {matchesSearch('CCI Commodity Channel Index Emtia Kanal İndeksi', ['cci', 'momentum', 'osilator']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.cci.enabled ? 'bg-[#151c2d] border-orange-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('cci')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.cci.enabled ? 'bg-orange-500 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.cci.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">17. CCI (Emtia Kanal İndeksi)</span>
                          <p className="text-[11px] text-slate-400">İstatistiksel döngü sapması (±100)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.cci.period}
                          onChange={(e) => updateParam('cci', 'period', parseInt(e.target.value) || 20)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 18. ADX & DMI */}
                {matchesSearch('ADX Average Directional Index Trend Gücü DMI', ['adx', 'dmi', 'trend']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.adx.enabled ? 'bg-[#151c2d] border-yellow-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('adx')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.adx.enabled ? 'bg-yellow-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.adx.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">18. ADX (Trend Gücü İndeksi)</span>
                          <p className="text-[11px] text-slate-400">Trend şiddeti ve +DI / -DI yönü</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">Eşik:</span>
                        <input
                          type="number"
                          value={settings.adx.threshold}
                          onChange={(e) => updateParam('adx', 'threshold', parseInt(e.target.value) || 25)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 19. Williams %R */}
                {matchesSearch('Williams %R Williams Percent Range Aşırı Satış', ['williams', 'wr', 'momentum']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.williamsR.enabled ? 'bg-[#151c2d] border-teal-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('williamsR')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.williamsR.enabled ? 'bg-teal-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.williamsR.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">19. Williams %R</span>
                          <p className="text-[11px] text-slate-400">Tepeden uzaklık momentumu (-20 / -80)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.williamsR.period}
                          onChange={(e) => updateParam('williamsR', 'period', parseInt(e.target.value) || 14)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. VOLUME & MONEY FLOW */}
          {(activeCategory === 'all' || activeCategory === 'volume') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase">
                  4. Hacim & Para Akışı (Volume & Flow)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Volume Histogram */}
                {matchesSearch('Hacim Histogramı Volume', ['volume', 'hacim']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.volume.enabled ? 'bg-[#151c2d] border-emerald-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('volume')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.volume.enabled ? 'bg-emerald-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.volume.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">Hacim Histogramı</span>
                          <p className="text-[11px] text-slate-400">Her mumdaki toplam işlem hacmi</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono font-semibold">24h Vol</span>
                    </div>
                  </div>
                )}

                {/* 20. OBV (On-Balance Volume) */}
                {matchesSearch('OBV On-Balance Volume Denge Hacmi', ['obv', 'volume', 'hacim']) && (
                  <div className={`p-3 rounded-xl border transition-all ${
                    settings.obv.enabled ? 'bg-[#151c2d] border-indigo-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('obv')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.obv.enabled ? 'bg-indigo-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.obv.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">20. OBV (Denge Hacmi)</span>
                          <p className="text-[11px] text-slate-400">Kümülatif alım/satım hacim baskısı</p>
                        </div>
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: settings.obv.color }} />
                    </div>
                  </div>
                )}

                {/* 21. MFI (Money Flow Index) */}
                {matchesSearch('MFI Money Flow Index Para Akışı İndeksi Hacimli RSI', ['mfi', 'flow', 'hacim']) && (
                  <div className={`p-3 rounded-xl border transition-all md:col-span-2 ${
                    settings.mfi.enabled ? 'bg-[#151c2d] border-green-500/40 shadow-xs' : 'bg-[#121724] border-slate-800/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggle('mfi')}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            settings.mfi.enabled ? 'bg-green-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {settings.mfi.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <span className="text-sm font-semibold text-slate-100">21. MFI (Para Akışı Endeksi)</span>
                          <p className="text-[11px] text-slate-400">Hacim ağırlıklı RSI formülasyonu ile akıllı para giriş/çıkış analizi</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">P:</span>
                        <input
                          type="number"
                          value={settings.mfi.period}
                          onChange={(e) => updateParam('mfi', 'period', parseInt(e.target.value) || 14)}
                          className="w-12 px-1.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-center text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. SMART LEVELS & AUTO SUPPORT / RESISTANCE */}
          {(activeCategory === 'all' || activeCategory === 'levels') && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggle('autoSupportResistance')}
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                      settings.autoSupportResistance.enabled ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600 bg-slate-800'
                    }`}
                  >
                    {settings.autoSupportResistance.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">Otomatik Destek, Direnç & Fibonacci Pivot Motoru</h4>
                    <p className="text-xs text-slate-400">Fraktal swing pivotları, kümeleme algoritması ve hacim yoğunluklu akıllı seviyeler</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono font-bold">
                  Akıllı Algoritma
                </span>
              </div>

              {settings.autoSupportResistance.enabled && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1">Pivot Penceresi:</label>
                    <input
                      type="number"
                      value={settings.autoSupportResistance.pivotWindow}
                      onChange={(e) => updateParam('autoSupportResistance', 'pivotWindow', parseInt(e.target.value) || 5)}
                      className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-center"
                    />
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1">Kümeleme Toleransı (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.autoSupportResistance.clusterTolerancePct}
                      onChange={(e) => updateParam('autoSupportResistance', 'clusterTolerancePct', parseFloat(e.target.value) || 0.8)}
                      className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-center"
                    />
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] text-slate-400 block mb-1">Max Seviye Sayısı:</label>
                    <input
                      type="number"
                      value={settings.autoSupportResistance.maxLevels}
                      onChange={(e) => updateParam('autoSupportResistance', 'maxLevels', parseInt(e.target.value) || 5)}
                      className="w-full px-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-center"
                    />
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={settings.autoSupportResistance.showPivotPoints}
                        onChange={(e) => updateParam('autoSupportResistance', 'showPivotPoints', e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Fibonacci Pivotları</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-slate-800 bg-[#0c101a]">
          <div className="text-xs text-slate-400">
            Toplam <span className="text-cyan-400 font-bold">{activeCount}</span> indikatör aktif
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-md active:scale-95"
          >
            Tamam & Uygula
          </button>
        </div>
      </div>
    </div>
  );
};
