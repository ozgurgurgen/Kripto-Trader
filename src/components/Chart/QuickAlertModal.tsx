import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Volume2, Send, X, ArrowUpRight, ArrowDownRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AlertCondition, AlertItem } from '../../types/crypto';

interface QuickAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  initialPrice: number;
  currentPrice: number;
  onSaveAlert: (alert: AlertItem) => void;
}

export const QuickAlertModal: React.FC<QuickAlertModalProps> = ({
  isOpen,
  onClose,
  symbol,
  initialPrice,
  currentPrice,
  onSaveAlert,
}) => {
  const [targetPrice, setTargetPrice] = useState<number>(initialPrice || currentPrice);
  const [condition, setCondition] = useState<AlertCondition>(() => {
    return initialPrice >= currentPrice ? 'PRICE_ABOVE' : 'PRICE_BELOW';
  });
  const [message, setMessage] = useState<string>('');
  const [channels, setChannels] = useState<('WEB' | 'SOUND' | 'TELEGRAM')[]>(['WEB', 'SOUND']);
  const [customMessageEdited, setCustomMessageEdited] = useState(false);

  // Sync initial price when opened
  useEffect(() => {
    if (isOpen) {
      const price = initialPrice > 0 ? initialPrice : currentPrice;
      setTargetPrice(price);
      const cond: AlertCondition = price >= currentPrice ? 'PRICE_ABOVE' : 'PRICE_BELOW';
      setCondition(cond);
      setCustomMessageEdited(false);
      setMessage(`${symbol} hedef fiyat seviyesine (${price.toLocaleString()}) ulaştı!`);
    }
  }, [isOpen, initialPrice, currentPrice, symbol]);

  // Update auto message if not edited manually
  useEffect(() => {
    if (!customMessageEdited && targetPrice > 0) {
      let condText = 'hedef seviyeye';
      if (condition === 'PRICE_ABOVE') condText = 'direnç / yukarı hedefe';
      else if (condition === 'PRICE_BELOW') condText = 'destek / aşağı hedefe';
      else if (condition === 'SUPPORT_PROXIMITY') condText = 'destek bölgesine';
      else if (condition === 'RESISTANCE_PROXIMITY') condText = 'direnç bölgesine';

      setMessage(`${symbol} ${condText} ($${targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}) ulaştı!`);
    }
  }, [targetPrice, condition, symbol, customMessageEdited]);

  if (!isOpen) return null;

  const deltaPct = currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
  const isAbove = targetPrice >= currentPrice;

  const handlePercentageShift = (pct: number) => {
    const newPrice = currentPrice * (1 + pct / 100);
    const rounded = Number(newPrice.toFixed(4));
    setTargetPrice(rounded);
    setCondition(pct >= 0 ? 'PRICE_ABOVE' : 'PRICE_BELOW');
  };

  const toggleChannel = (ch: 'WEB' | 'SOUND' | 'TELEGRAM') => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    const newAlert: AlertItem = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      symbol,
      condition,
      targetValue: Number(targetPrice),
      message: message || `${symbol} $${targetPrice} fiyat alarmı`,
      triggered: false,
      createdAt: Date.now(),
      notificationChannels: channels.length > 0 ? channels : ['WEB'],
    };

    onSaveAlert(newAlert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-md bg-[#1e2329] border border-[#2b313a] rounded-lg shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#181a20] border-b border-[#2b313a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#fcd535]/20 text-[#fcd535]">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#eaecef] flex items-center gap-2">
                Fiyat Alarmı Kur
                <span className="text-xs font-mono font-bold px-1.5 py-0.2 rounded bg-[#2b313a] text-[#fcd535]">
                  {symbol}
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-4 space-y-3.5">
          {/* Live Price Reference Bar */}
          <div className="flex items-center justify-between p-2.5 rounded-md bg-[#181a20] border border-[#2b313a] text-xs">
            <div>
              <span className="text-[#848e9c]">Mevcut Fiyat: </span>
              <span className="font-mono font-bold text-[#eaecef] ml-1">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
            </div>
            <div className={`font-mono font-bold flex items-center gap-1 ${isAbove ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {isAbove ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{deltaPct >= 0 ? `+${deltaPct.toFixed(2)}%` : `${deltaPct.toFixed(2)}%`}</span>
            </div>
          </div>

          {/* Quick Percentage Presets */}
          <div>
            <div className="text-[11px] font-medium text-[#848e9c] mb-1.5">Hızlı Hedef Seviyeleri</div>
            <div className="grid grid-cols-6 gap-1">
              {[-5, -2, -1, 1, 2, 5].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentageShift(pct)}
                  className={`py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                    pct > 0 
                      ? 'bg-[#0ecb81]/10 border-[#0ecb81]/30 text-[#0ecb81] hover:bg-[#0ecb81]/25' 
                      : 'bg-[#f6465d]/10 border-[#f6465d]/30 text-[#f6465d] hover:bg-[#f6465d]/25'
                  }`}
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Target Price Input */}
          <div>
            <label className="block text-xs font-semibold text-[#eaecef] mb-1">
              Hedef Fiyat ($ USDT)
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                required
                value={targetPrice || ''}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setTargetPrice(val);
                  setCondition(val >= currentPrice ? 'PRICE_ABOVE' : 'PRICE_BELOW');
                }}
                className="w-full px-3 py-2 bg-[#181a20] border border-[#2b313a] focus:border-[#fcd535] rounded text-sm text-[#eaecef] font-mono font-bold outline-none transition-colors"
                placeholder="Örn: 92450.50"
              />
              <span className="absolute right-3 top-2.5 text-xs text-[#848e9c] font-mono">
                USDT
              </span>
            </div>
          </div>

          {/* Trigger Condition Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#eaecef] mb-1">
              Alarm Tetikleme Koşulu
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              className="w-full px-3 py-2 bg-[#181a20] border border-[#2b313a] focus:border-[#fcd535] rounded text-xs text-[#eaecef] font-medium outline-none transition-colors"
            >
              <option value="PRICE_ABOVE">Fiyat Yukarı Kırarsa (&gt; Hedef Fiyat)</option>
              <option value="PRICE_BELOW">Fiyat Aşağı Kırarsa (&lt; Hedef Fiyat)</option>
              <option value="SUPPORT_PROXIMITY">Destek Bölgesine Yaklaşırsa (%0.5)</option>
              <option value="RESISTANCE_PROXIMITY">Direnç Bölgesine Yaklaşırsa (%0.5)</option>
              <option value="RSI_OVERSOLD">RSI Aşırı Satım Bölgesine Girerse (&lt; 30)</option>
              <option value="RSI_OVERBOUGHT">RSI Aşırı Alım Bölgesine Girerse (&gt; 70)</option>
            </select>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-xs font-semibold text-[#eaecef] mb-1">
              Bildirim Mesajı
            </label>
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setCustomMessageEdited(true);
              }}
              className="w-full px-3 py-1.5 bg-[#181a20] border border-[#2b313a] focus:border-[#fcd535] rounded text-xs text-[#eaecef] outline-none transition-colors"
              placeholder="Alarm tetiklendiğinde görünecek not"
            />
          </div>

          {/* Notification Channels */}
          <div>
            <label className="block text-xs font-semibold text-[#eaecef] mb-1.5">
              Bildirim Kanalları
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => toggleChannel('WEB')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                  channels.includes('WEB')
                    ? 'bg-[#fcd535]/15 border-[#fcd535]/60 text-[#fcd535]'
                    : 'bg-[#181a20] border-[#2b313a] text-[#848e9c]'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Web / Popup</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChannel('SOUND')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                  channels.includes('SOUND')
                    ? 'bg-[#fcd535]/15 border-[#fcd535]/60 text-[#fcd535]'
                    : 'bg-[#181a20] border-[#2b313a] text-[#848e9c]'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Sesli Uyarı</span>
              </button>

              <button
                type="button"
                onClick={() => toggleChannel('TELEGRAM')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium border transition-colors ${
                  channels.includes('TELEGRAM')
                    ? 'bg-[#fcd535]/15 border-[#fcd535]/60 text-[#fcd535]'
                    : 'bg-[#181a20] border-[#2b313a] text-[#848e9c]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2b313a]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded text-xs font-semibold text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#fcd535] hover:bg-[#e6c229] text-[#181a20] font-bold text-xs shadow-md transition-all transform active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Alarmı Başlat</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
