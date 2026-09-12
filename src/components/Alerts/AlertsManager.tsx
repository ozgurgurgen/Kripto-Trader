import React, { useState } from 'react';
import { AlertItem } from '../../types/crypto';
import { Bell, Plus, Trash2, CheckCircle, Volume2, Send, Clock, AlertTriangle } from 'lucide-react';

interface AlertsManagerProps {
  alerts: AlertItem[];
  symbol: string;
  currentPrice: number;
  onAddAlert: (alert: AlertItem) => void;
  onDeleteAlert: (id: string) => void;
}

export const AlertsManager: React.FC<AlertsManagerProps> = ({
  alerts,
  symbol,
  currentPrice,
  onAddAlert,
  onDeleteAlert,
}) => {
  const [condition, setCondition] = useState<AlertItem['condition']>('PRICE_ABOVE');
  const [targetValue, setTargetValue] = useState<number>(currentPrice * 1.02);
  const [message, setMessage] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: AlertItem = {
      id: `alert-${Date.now()}`,
      symbol,
      condition,
      targetValue,
      message: message || `${symbol} ${condition} ${targetValue} uyarısı`,
      triggered: false,
      createdAt: Date.now(),
      notificationChannels: ['WEB', 'SOUND', 'TELEGRAM'],
    };
    onAddAlert(newAlert);
    setMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto">
      {/* 1. Create Alert Form */}
      <div className="bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Bell className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100">Yeni Fiyat & İndikatör Alarmı Kur</h3>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Sembol:</label>
            <input
              type="text"
              readOnly
              value={symbol}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Alarm Koşulu:</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertItem['condition'])}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="PRICE_ABOVE">Fiyat Yukarı Kırarsa (&gt;)</option>
              <option value="PRICE_BELOW">Fiyat Aşağı Kırarsa (&lt;)</option>
              <option value="SUPPORT_PROXIMITY">Destek Seviyesine Yaklaşırsa (%0.5)</option>
              <option value="RESISTANCE_PROXIMITY">Direnç Seviyesine Yaklaşırsa (%0.5)</option>
              <option value="RSI_OVERSOLD">RSI Aşırı Satım (&lt; 30)</option>
              <option value="RSI_OVERBOUGHT">RSI Aşırı Alım (&gt; 70)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Hedef Eşik Değeri ($ / Değer):</label>
            <input
              type="number"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Özel Bildirim Notu (Opsiyonel):</label>
            <input
              type="text"
              placeholder="Örn: Fibonacci 0.618 dönüş noktası"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1 text-xs">
            <div className="text-slate-400 font-medium mb-1">Bildirim Kanalları:</div>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="flex items-center gap-1 text-cyan-400">
                <Volume2 className="w-3.5 h-3.5" /> Sesli İkaz
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Send className="w-3.5 h-3.5" /> Telegram Bot
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Alarmı Oluştur & Başlat
          </button>
        </form>
      </div>

      {/* 2. Active Alerts List */}
      <div className="lg:col-span-2 bg-[#101522] border border-slate-800/80 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-100">Aktif & Geçmiş Bildirimler</h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {alerts.length} Toplam
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Henüz kurulmuş aktif bir fiyat veya teknik alarm bulunmuyor.
          </div>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {alerts.map((al) => (
              <div
                key={al.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  al.triggered
                    ? 'bg-amber-500/5 border-amber-500/30'
                    : 'bg-[#151c2c] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      al.triggered
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    {al.triggered ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs font-mono text-slate-200">{al.symbol}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {al.condition} : ${al.targetValue}
                      </span>
                      {al.triggered && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                          Tetiklendi
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">{al.message}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(al.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteAlert(al.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
