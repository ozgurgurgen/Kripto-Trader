import React, { useState } from 'react';
import { TradingMode, RateLimitStatus, TradeLog } from '../../types/crypto';
import { 
  X, 
  Key, 
  Shield, 
  Send, 
  CheckCircle2, 
  Server, 
  Activity, 
  AlertTriangle,
  Database,
  BrainCircuit,
  Settings,
  Sparkles
} from 'lucide-react';
import { PostgresDatabasePanel } from './PostgresDatabasePanel';
import { LocalAIIntegrationPanel } from '../LocalAI/LocalAIIntegrationPanel';
import { BinanceTestnetClient } from '../../services/binanceTestnetClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TradingMode;
  onModeChange: (mode: TradingMode) => void;
  rateLimitStatus: RateLimitStatus;
  currentTrades?: TradeLog[];
  onTradesRestored?: (trades: any[]) => void;
  currentSymbol?: string;
  onStrategyGenerated?: (strategyParams: any) => void;
  initialTab?: 'general' | 'postgres' | 'local_ai';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  rateLimitStatus,
  currentTrades = [],
  onTradesRestored,
  currentSymbol = 'BTCUSDT',
  onStrategyGenerated,
  initialTab = 'general',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'general' | 'postgres' | 'local_ai'>(initialTab);
  const [apiKey, setApiKey] = useState('********************************');
  const [apiSecret, setApiSecret] = useState('********************************');
  const [testnetApiKey, setTestnetApiKey] = useState(() => BinanceTestnetClient.getKeys().apiKey || '');
  const [testnetApiSecret, setTestnetApiSecret] = useState(() => BinanceTestnetClient.getKeys().apiSecret || '');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [confirmLiveModal, setConfirmLiveModal] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);

    // Save testnet keys to localStorage
    BinanceTestnetClient.saveKeys({
      apiKey: testnetApiKey,
      apiSecret: testnetApiSecret,
    });

    // Save to PostgreSQL if connected
    try {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userUid: 'default-user',
          email: 'trader@kriptobot.pro',
          settings: {
            mode,
            apiKey: apiKey.includes('*') ? undefined : apiKey,
            apiSecret: apiSecret.includes('*') ? undefined : apiSecret,
            testnetKey: testnetApiKey,
            telegramToken,
            telegramChatId,
          },
        }),
      });
    } catch (err) {
      console.error('Failed to sync settings with DB:', err);
    }

    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1200);
  };

  const handleSelectMode = (newMode: TradingMode) => {
    if (newMode === 'LIVE') {
      setConfirmLiveModal(true);
    } else {
      onModeChange(newMode);
    }
  };

  const confirmLiveTrading = () => {
    onModeChange('LIVE');
    setConfirmLiveModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-[#0e131f] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-800 bg-[#0a0e17]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
                Sistem & Altyapı Kontrol Merkezi
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Cloud SQL PostgreSQL & Local AI
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Borsa API anahtarları, Cloud SQL ilişkisel veritabanı senkronizasyonu ve yerel LLM otonom ajan yönetimi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 bg-[#070a10] border-b border-slate-800/90 overflow-x-auto no-scrollbar">
          {[
            { id: 'general', label: 'Genel & Borsa API', icon: Key, badgeText: mode },
            { id: 'postgres', label: 'PostgreSQL Veritabanı', icon: Database, badgeText: 'Cloud SQL' },
            { id: 'local_ai', label: 'Local AI & Otonom Ajanlar', icon: BrainCircuit, badgeText: 'Ollama/Hermes' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap min-h-[44px] ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badgeText && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                    tab.id === 'postgres' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    tab.id === 'local_ai' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    mode === 'LIVE' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {tab.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: General Settings & Borsa API */}
          {activeTab === 'general' && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Trading Mode Switcher */}
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-2 font-mono">ÇALIŞMA MODU (EXECUTION MODE):</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'PAPER', name: 'Paper Trading (Sanal)', desc: 'Gerçek zamanlı veriyle sıfır riskli sanal portföy' },
                    { id: 'TESTNET', name: 'Spot Testnet', desc: 'Canlı testnet borsa simülasyonu' },
                    { id: 'LIVE', name: 'Canlı Borsa (Live)', desc: 'Gerçek spot & vadeli emir iletimi' },
                  ].map((m) => {
                    const isSelected = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectMode(m.id as TradingMode)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? m.id === 'LIVE'
                              ? 'bg-red-500/10 border-red-500 text-red-400 shadow-md ring-1 ring-red-500/30'
                              : 'bg-cyan-500/10 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="text-xs font-bold mb-1 font-mono">{m.name}</div>
                        <div className="text-[10px] opacity-75">{m.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Borsa API Keys */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Borsa API Anahtarları (Güvenli Saklama)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">API Key (Read-Only / Trade):</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Borsa API Anahtarı"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Secret Key:</label>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      placeholder="Gizli Anahtar (Secret Key)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  * Not: Paper trading modunda API anahtarı gerekmez. Anahtarlar PostgreSQL 'trading_settings' tablosunda güvenle senkronize edilir.
                </p>
              </div>

              {/* Spot Testnet Keys */}
              <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Spot Testnet API Anahtarları</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-mono">Testnet API Key:</label>
                    <input
                      type="text"
                      value={testnetApiKey}
                      onChange={(e) => setTestnetApiKey(e.target.value)}
                      placeholder="Testnet API Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-mono">Testnet Secret Key:</label>
                    <input
                      type="password"
                      value={testnetApiSecret}
                      onChange={(e) => setTestnetApiSecret(e.target.value)}
                      placeholder="Testnet Secret Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-300/80 font-mono">
                  * Testnet modunda girdiğiniz bu anahtarlar ile emirler doğrudan testnet ortamında borsa altyapısında yürütülür.
                </p>
              </div>

              {/* Telegram Alerts Integration */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 font-mono">
                  <Send className="w-4 h-4 text-cyan-400" />
                  <span>Telegram Bot Anlık Sinyal & Alarm Entegrasyonu</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Telegram Bot Token:</label>
                    <input
                      type="text"
                      value={telegramToken}
                      onChange={(e) => setTelegramToken(e.target.value)}
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Chat ID:</label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="@kanal veya 987654321"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* System Rate Limits & Health Status */}
              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-2 font-mono">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Borsa API & WebSocket Durumu</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                    {rateLimitStatus.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono pt-2 text-slate-300">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block">1D Ağırlık Bütçesi:</span>
                    <span className="text-cyan-400 font-bold">{rateLimitStatus.usedWeight1m} / {rateLimitStatus.maxWeight1m}</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block">WebSocket Gecikmesi:</span>
                    <span className="text-emerald-400 font-bold">{rateLimitStatus.wsLatencyMs}ms</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block">WebSocket Akışı:</span>
                    <span className={rateLimitStatus.isWsConnected ? 'text-emerald-400 font-bold' : 'text-slate-400 font-bold'}>
                      {rateLimitStatus.isWsConnected ? '● Canlı Bağlı' : '○ Bağlantı Kuruluyor'}
                    </span>
                  </div>
                </div>
              </div>

              {isSaved && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Ayarlar ve API bağlantı parametreleri başarıyla güncellendi.</span>
                </div>
              )}

              {/* Footer Save */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PostgreSQL Database (Cloud SQL) */}
          {activeTab === 'postgres' && (
            <PostgresDatabasePanel 
              currentTrades={currentTrades} 
              onTradesRestored={onTradesRestored} 
            />
          )}

          {/* TAB 3: Local AI & Autonomous Agents */}
          {activeTab === 'local_ai' && (
            <LocalAIIntegrationPanel
              currentSymbol={currentSymbol}
              onStrategyGenerated={onStrategyGenerated}
            />
          )}

        </div>
      </div>

      {/* Confirmation Modal for Live Trading */}
      {confirmLiveModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-[#121722] border border-red-500/50 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white font-mono">CANLI BORSA MODU UYARISI</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Canlı moda geçtiğinizde strateji botları borsa hesabınızdaki gerçek bakiye ile işlem açacaktır.
              Lütfen risk yönetimi kurallarınızı (Stop-Loss, Max Drawdown) gözden geçirdiğinizden emin olun.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmLiveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Vazgeç (Sanalda Kal)
              </button>
              <button
                type="button"
                onClick={confirmLiveTrading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg"
              >
                Canlı Modu Onayla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
