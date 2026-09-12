import React, { useState } from 'react';
import { RiskSettings, SizingMethod } from '../../types/crypto';
import { PaperTradingEngine } from '../../services/paperTradingEngine';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertOctagon, 
  Sliders, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  Zap 
} from 'lucide-react';

interface RiskManagementPanelProps {
  positions?: any[];
  currentPrice?: number;
  onSettingsUpdated?: () => void;
  onTriggerKillSwitch?: () => void;
}

export const RiskManagementPanel: React.FC<RiskManagementPanelProps> = ({ 
  onSettingsUpdated,
  onTriggerKillSwitch 
}) => {
  const [settings, setSettings] = useState<RiskSettings>(PaperTradingEngine.getRiskSettings());
  const [savedMsg, setSavedMsg] = useState(false);

  const handleChange = (key: keyof RiskSettings, val: any) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    PaperTradingEngine.updateRiskSettings(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
    onSettingsUpdated?.();
  };

  const handleResetKillSwitch = () => {
    PaperTradingEngine.resetKillSwitch();
    setSettings(PaperTradingEngine.getRiskSettings());
    onSettingsUpdated?.();
  };

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      {/* Circuit Breaker & Kill Switch Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Circuit Breaker */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          settings.circuitBreakerTriggered
            ? 'bg-red-500/10 border-red-500/40 text-red-400'
            : 'bg-[#101522] border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.circuitBreakerTriggered ? 'bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Günlük Devre Kesici (Circuit Breaker)</h3>
              <p className="text-xs text-slate-400">
                {settings.circuitBreakerTriggered
                  ? `KİLİTLİ: Günlük kayıp limiti (%${settings.maxDailyLossPct}) aşıldı.`
                  : `Aktif Koruma: Günlük max kayıp %${settings.maxDailyLossPct}`}
              </p>
            </div>
          </div>
          {settings.circuitBreakerTriggered && (
            <button
              onClick={handleResetKillSwitch}
              className="px-3 py-1.5 rounded-lg bg-red-500 text-slate-950 font-bold text-xs hover:bg-red-400 transition-colors"
            >
              Kilidi Kaldır
            </button>
          )}
        </div>

        {/* Emergency Kill Switch Status */}
        <div className={`p-4 rounded-xl border flex items-center justify-between ${
          settings.emergencyKillActive
            ? 'bg-red-500/20 border-red-500 text-red-400'
            : 'bg-[#101522] border-slate-800 text-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${settings.emergencyKillActive ? 'bg-red-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Acil Durdurma (Kill Switch) Durumu</h3>
              <p className="text-xs text-slate-400">
                {settings.emergencyKillActive ? 'DURDURULDU: Tüm pozisyonlar kapatıldı ve botlar kilitlendi.' : 'Sistem normal çalışıyor.'}
              </p>
            </div>
          </div>
          {settings.emergencyKillActive && (
            <button
              onClick={handleResetKillSwitch}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Sistemi Sıfırla
            </button>
          )}
        </div>
      </div>

      {/* 1. Quantitative Position Sizing Configuration */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">Kantitatif Pozisyon Boyutlandırma Modeli</h3>
          </div>
          {savedMsg && <span className="text-xs font-mono text-emerald-400 font-semibold">✓ Kaydedildi</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { id: 'PERCENT_BALANCE', name: 'Bakiye Yüzdesi', desc: 'Portföyün sabit %X oranı' },
            { id: 'KELLY', name: 'Kelly Criterion', desc: 'Matematiksel optimal getiri/kayıp katsayısı' },
            { id: 'ATR_VOLATILITY', name: 'ATR Volatilite Boyutu', desc: 'Oynaklığa göre dinamik risk ağırlığı' },
            { id: 'FIXED_AMOUNT', name: 'Sabit USDT Tutarı', desc: 'Her işlemde sabit dolar miktarı' },
          ].map((method) => {
            const isSelected = settings.sizingMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => handleChange('sizingMethod', method.id as SizingMethod)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 mb-1">{method.name}</div>
                <div className="text-[11px] text-slate-400">{method.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sizing Param Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {settings.sizingMethod === 'PERCENT_BALANCE' && (
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                İşlem Başına Bakiye Yüzdesi (%):
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.percentOfBalance}
                onChange={(e) => handleChange('percentOfBalance', parseFloat(e.target.value) || 5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          )}

          {settings.sizingMethod === 'KELLY' && (
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Kelly Kesri (Fraction):
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="1.0"
                value={settings.kellyFraction}
                onChange={(e) => handleChange('kellyFraction', parseFloat(e.target.value) || 0.5)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
              <span className="text-[10px] text-slate-500">Önerilen: 0.5 (Yarım Kelly)</span>
            </div>
          )}

          {settings.sizingMethod === 'FIXED_AMOUNT' && (
            <div>
              <label className="text-xs text-slate-300 font-medium block mb-1">
                Sabit İşlem Tutarı ($):
              </label>
              <input
                type="number"
                value={settings.fixedAmountUSDT}
                onChange={(e) => handleChange('fixedAmountUSDT', parseFloat(e.target.value) || 500)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Portfolio Exposure & Hard Limit Guardrails */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100">Portföy Koruma ve Risk Limitleri</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Max Open Positions */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-semibold block">Maksimum Eşzamanlı Açık Pozisyon:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxOpenPositions}
              onChange={(e) => handleChange('maxOpenPositions', parseInt(e.target.value) || 4)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>

          {/* Max Single Asset Exposure */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-semibold block">Tek Varlık Maksimum Dağılım (%):</label>
            <input
              type="number"
              min="5"
              max="100"
              value={settings.maxAssetExposurePct}
              onChange={(e) => handleChange('maxAssetExposurePct', parseFloat(e.target.value) || 25)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>

          {/* Max Daily Drawdown Threshold */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <label className="text-slate-300 font-semibold block">Günlük Devre Kesici Kayıp Eşiği (%):</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxDailyLossPct}
              onChange={(e) => handleChange('maxDailyLossPct', parseFloat(e.target.value) || 5)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
