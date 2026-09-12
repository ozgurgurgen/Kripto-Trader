import React, { useState, useEffect } from 'react';
import { 
  OrderBook, 
  Position, 
  TradingMode, 
  TradeLog, 
  OrderType, 
  OrderSide 
} from '../../types/crypto';
import { PaperTradingEngine } from '../../services/paperTradingEngine';
import { BinanceTestnetClient, TestnetBalance } from '../../services/binanceTestnetClient';
import { 
  TrendingUp, 
  TrendingDown, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Globe, 
  Trash2, 
  Key,
  Plus,
  Minus,
  ChevronDown,
  Info
} from 'lucide-react';

interface PaperTradingPanelProps {
  symbol: string;
  currentPrice: number;
  mode: TradingMode;
  onModeChange?: (mode: TradingMode) => void;
  orderBook?: OrderBook;
  positions?: Position[];
  tradeHistory?: TradeLog[];
  onRefreshPortfolio: () => void;
  onOpenSettings?: (tab?: 'general' | 'postgres' | 'local_ai') => void;
}

export const PaperTradingPanel: React.FC<PaperTradingPanelProps> = ({
  symbol,
  currentPrice,
  mode,
  onModeChange,
  orderBook = { bids: [], asks: [], lastUpdateId: 0 },
  positions = [],
  tradeHistory = [],
  onRefreshPortfolio,
  onOpenSettings,
}) => {
  const account = PaperTradingEngine.getAccountSummary();
  const baseAsset = symbol.replace('USDT', '');

  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET' | 'STOP_LIMIT'>('LIMIT');
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [limitPrice, setLimitPrice] = useState<number>(currentPrice || 0);
  const [amountUSDT, setAmountUSDT] = useState<number>(1000);
  const [quantityCrypto, setQuantityCrypto] = useState<number>(0);
  const [stopPrice, setStopPrice] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLossPct, setStopLossPct] = useState<number>(2.0);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(4.0);
  const [showAdvancedTPSL, setShowAdvancedTPSL] = useState<boolean>(false);
  const [bookViewType, setBookViewType] = useState<'both' | 'bids' | 'asks'>('both');
  const [activeTab, setActiveTab] = useState<'trade' | 'book' | 'positions'>('trade');

  // Binance Testnet state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTestnetKeyModal, setShowTestnetKeyModal] = useState(false);
  const [testnetApiKeyInput, setTestnetApiKeyInput] = useState('');
  const [testnetApiSecretInput, setTestnetApiSecretInput] = useState('');
  const [testnetBalances, setTestnetBalances] = useState<TestnetBalance[]>([]);
  const [testnetPingMs, setTestnetPingMs] = useState<number | null>(null);
  const [testnetConnected, setTestnetConnected] = useState<boolean>(false);
  const [testnetOpenOrdersList, setTestnetOpenOrdersList] = useState<any[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string; details?: string } | null>(null);

  // Sync limit price when current price initializes or changes
  useEffect(() => {
    if ((limitPrice === 0 || isNaN(limitPrice)) && currentPrice > 0) {
      setLimitPrice(currentPrice);
    }
  }, [currentPrice]);

  // Sync quantity and amount
  useEffect(() => {
    const effectivePrice = orderType === 'MARKET' ? currentPrice : limitPrice;
    if (effectivePrice > 0 && amountUSDT > 0) {
      setQuantityCrypto(Number((amountUSDT / effectivePrice).toFixed(5)));
    }
  }, [amountUSDT, limitPrice, currentPrice, orderType]);

  // Load testnet keys & check testnet ping
  useEffect(() => {
    const keys = BinanceTestnetClient.getKeys();
    setTestnetApiKeyInput(keys.apiKey || '');
    setTestnetApiSecretInput(keys.apiSecret || '');

    async function checkTestnet() {
      const status = await BinanceTestnetClient.checkStatus();
      if (status.success) {
        setTestnetConnected(true);
        setTestnetPingMs(status.latencyMs);
      } else {
        setTestnetConnected(false);
      }
    }
    checkTestnet();
  }, []);

  // Fetch testnet account & open orders if mode is TESTNET
  const refreshTestnetData = async () => {
    if (mode !== 'TESTNET') return;
    const acc = await BinanceTestnetClient.getAccount();
    if (acc.success && acc.balances) {
      setTestnetBalances(acc.balances);
    }
    const openOrders = await BinanceTestnetClient.getOpenOrders(symbol);
    if (openOrders.success && Array.isArray(openOrders.orders)) {
      setTestnetOpenOrdersList(openOrders.orders);
    }
  };

  useEffect(() => {
    if (mode === 'TESTNET') {
      refreshTestnetData();
    }
  }, [mode, symbol]);

  const openPositions = (positions || []).filter((p) => p.status === 'OPEN');
  const isBuy = orderSide === 'BUY';

  // Usdt testnet balance
  const testnetUsdt = testnetBalances.find((b) => b.asset === 'USDT')?.free || 0;
  const testnetBaseAssetBalance = testnetBalances.find((b) => b.asset === baseAsset)?.free || 0;

  const handleQuickPercent = (pct: number) => {
    if (isBuy) {
      const available = mode === 'TESTNET' && testnetUsdt > 0 ? testnetUsdt : account.freeMargin * leverage;
      const alloc = Math.floor(available * (pct / 100));
      setAmountUSDT(Math.max(10, alloc));
    } else {
      const availableCrypto = mode === 'TESTNET' ? testnetBaseAssetBalance : (account.freeMargin / currentPrice);
      const cryptoAmount = availableCrypto * (pct / 100);
      const usdtVal = Math.floor(cryptoAmount * currentPrice);
      setAmountUSDT(Math.max(10, usdtVal));
    }
  };

  const handlePriceStep = (delta: number) => {
    const p = limitPrice || currentPrice;
    const step = p > 1000 ? 10 : p > 100 ? 1 : p > 1 ? 0.1 : 0.001;
    setLimitPrice(Number((p + (delta * step)).toFixed(4)));
  };

  // Save Testnet Keys
  const handleSaveTestnetKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    BinanceTestnetClient.saveKeys({
      apiKey: testnetApiKeyInput,
      apiSecret: testnetApiSecretInput,
    });
    setShowTestnetKeyModal(false);
    setMessage({
      type: 'success',
      text: 'Spot Testnet API anahtarları kaydedildi!',
      details: 'Hesap bakiyeniz sorgulanıyor...',
    });
    await refreshTestnetData();
    setTimeout(() => setMessage(null), 4000);
  };

  // Place Order Handler (Paper vs Binance Testnet)
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPrice = orderType === 'MARKET' ? currentPrice : limitPrice;

    if (!targetPrice || targetPrice <= 0) {
      setMessage({ type: 'error', text: 'Geçersiz fiyat bilgisi.' });
      return;
    }

    if (!amountUSDT || amountUSDT <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir işlem tutarı ($) girin.' });
      return;
    }

    // 1. SPOT TESTNET EXECUTION
    if (mode === 'TESTNET') {
      const hasKeys = BinanceTestnetClient.hasKeys();
      if (!hasKeys) {
        setShowTestnetKeyModal(true);
        setMessage({
          type: 'info',
          text: 'Spot Testnet Anahtarları Gerekli',
          details: 'İşlem yapabilmek için lütfen testnet API anahtarınızı girin.',
        });
        return;
      }

      setIsSubmitting(true);
      setMessage({
        type: 'info',
        text: `Spot Testnet'e ${orderSide} emri iletiliyor...`,
        details: `${symbol} | ${orderType} | $${amountUSDT}`,
      });

      try {
        const approxQuantity = Number((amountUSDT / targetPrice).toFixed(5));
        
        const testnetRes = await BinanceTestnetClient.placeOrder({
          symbol,
          side: orderSide,
          type: orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
          quantity: orderType === 'LIMIT' ? approxQuantity : undefined,
          quoteOrderQty: orderType === 'MARKET' ? amountUSDT : undefined,
          price: orderType === 'LIMIT' ? targetPrice : undefined,
          timeInForce: 'GTC',
        });

        if (testnetRes.success) {
          setMessage({
            type: 'success',
            text: `Spot Testnet Emri Başarılı! (#${testnetRes.orderId || 'OK'})`,
            details: `Durum: ${testnetRes.status || 'FILLED'} | ${testnetRes.side} ${testnetRes.symbol} @ $${testnetRes.price || targetPrice}`,
          });

          // Also track locally in paper engine
          PaperTradingEngine.placeOrder({
            symbol,
            type: orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
            side: orderSide,
            price: testnetRes.price || targetPrice,
            amountUSDT,
            leverage: 1,
            stopLossPct: showAdvancedTPSL ? stopLossPct : undefined,
            takeProfitPct: showAdvancedTPSL ? takeProfitPct : undefined,
            mode: 'TESTNET',
          });

          onRefreshPortfolio();
          await refreshTestnetData();
        } else {
          setMessage({
            type: 'error',
            text: 'Spot Testnet Emri Reddedildi',
            details: testnetRes.error || 'Bilinmeyen testnet hatası.',
          });
        }
      } catch (err: any) {
        setMessage({
          type: 'error',
          text: 'Testnet Bağlantı Hatası',
          details: err.message,
        });
      } finally {
        setIsSubmitting(false);
        setTimeout(() => setMessage(null), 6000);
      }
      return;
    }

    // 2. PAPER TRADING EXECUTION (Sanal)
    const res = PaperTradingEngine.placeOrder({
      symbol,
      type: orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
      side: orderSide,
      price: targetPrice,
      amountUSDT,
      leverage,
      stopLossPct: showAdvancedTPSL ? stopLossPct : undefined,
      takeProfitPct: showAdvancedTPSL ? takeProfitPct : undefined,
      mode: 'PAPER',
    });

    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      onRefreshPortfolio();
    } else {
      setMessage({ type: 'error', text: res.message });
    }

    setTimeout(() => setMessage(null), 4000);
  };

  const handleClosePosition = (posId: string) => {
    PaperTradingEngine.closePosition(posId, 'Kullanıcı Kapatması');
    onRefreshPortfolio();
    if (mode === 'TESTNET') {
      refreshTestnetData();
    }
  };

  const handleCancelTestnetOrder = async (orderId: number | string) => {
    const res = await BinanceTestnetClient.cancelOrder(symbol, orderId);
    if (res.success) {
      setMessage({ type: 'success', text: `Testnet Emri #${orderId} iptal edildi.` });
      refreshTestnetData();
    } else {
      setMessage({ type: 'error', text: `Emir iptal edilemedi: ${res.error}` });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  // Safe Order Book values
  const safeAsks = (orderBook?.asks || []).slice(0, 8);
  const safeBids = (orderBook?.bids || []).slice(0, 8);
  const maxAskQty = Math.max(...safeAsks.map((a) => a.quantity), 1);
  const maxBidQty = Math.max(...safeBids.map((b) => b.quantity), 1);

  return (
    <div className="bg-[#1e2329] border border-[#2b313a] rounded-xs flex flex-col h-full overflow-hidden select-none">
      
      {/* 1. Trading Header: Mode & Tabs */}
      <div className="bg-[#181a20] border-b border-[#2b313a] px-3 py-2 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-[#eaecef] uppercase tracking-wider">Spot İşlem</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-xs ${
            mode === 'TESTNET' ? 'bg-[#fcd535] text-[#181a20]' : 'bg-[#2b313a] text-[#848e9c]'
          }`}>
            {mode === 'TESTNET' ? 'SPOT TESTNET' : 'PAPER SANAL'}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => onModeChange && onModeChange('PAPER')}
            className={`px-2 py-0.5 rounded-xs transition ${
              mode === 'PAPER' ? 'bg-[#2b313a] text-[#eaecef] font-bold' : 'text-[#848e9c] hover:text-[#eaecef]'
            }`}
          >
            Paper
          </button>
          <button
            type="button"
            onClick={() => onModeChange && onModeChange('TESTNET')}
            className={`px-2 py-0.5 rounded-xs transition flex items-center gap-1 ${
              mode === 'TESTNET' ? 'bg-[#fcd535] text-[#181a20] font-bold' : 'text-[#848e9c] hover:text-[#eaecef]'
            }`}
          >
            <Globe className="w-2.5 h-2.5" />
            <span>Testnet</span>
          </button>
        </div>
      </div>

      {/* Main Container: Split into Order Form & Order Book */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-[#2b313a]">
        
        {/* LEFT / TOP: Binance Order Execution Form (7 cols on lg) */}
        <div className="lg:col-span-7 p-3 flex flex-col gap-3 overflow-y-auto">
          
          {/* Order Side Tabs: AL (Green) / SAT (Red) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setOrderSide('BUY')}
              className={`py-2 rounded-xs font-bold text-xs uppercase tracking-wider transition ${
                isBuy
                  ? 'bg-[#0ecb81] text-white shadow-xs'
                  : 'bg-[#181a20] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a]'
              }`}
            >
              AL {baseAsset}
            </button>
            <button
              type="button"
              onClick={() => setOrderSide('SELL')}
              className={`py-2 rounded-xs font-bold text-xs uppercase tracking-wider transition ${
                !isBuy
                  ? 'bg-[#f6465d] text-white shadow-xs'
                  : 'bg-[#181a20] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a]'
              }`}
            >
              SAT {baseAsset}
            </button>
          </div>

          {/* Order Types: Limit / Piyasa / Stop-Limit */}
          <div className="flex items-center gap-4 text-xs font-medium border-b border-[#2b313a] pb-2">
            <button
              type="button"
              onClick={() => setOrderType('LIMIT')}
              className={`transition relative ${
                orderType === 'LIMIT'
                  ? 'text-[#fcd535] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Limit
            </button>
            <button
              type="button"
              onClick={() => setOrderType('MARKET')}
              className={`transition relative ${
                orderType === 'MARKET'
                  ? 'text-[#fcd535] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Piyasa (Market)
            </button>
            <button
              type="button"
              onClick={() => setOrderType('STOP_LIMIT')}
              className={`transition relative ${
                orderType === 'STOP_LIMIT'
                  ? 'text-[#fcd535] font-bold'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
            >
              Stop-Limit
            </button>
          </div>

          {/* Available Balance Row */}
          <div className="flex items-center justify-between text-[11px] text-[#848e9c] font-mono">
            <span>Kullanılabilir:</span>
            <span className="text-[#eaecef] font-bold">
              {isBuy ? (
                mode === 'TESTNET'
                  ? `${testnetUsdt.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT`
                  : `${account.freeMargin.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT`
              ) : (
                mode === 'TESTNET'
                  ? `${testnetBaseAssetBalance.toFixed(4)} ${baseAsset}`
                  : `${(account.freeMargin / (currentPrice || 1)).toFixed(4)} ${baseAsset}`
              )}
            </span>
          </div>

          {/* Form Fields */}
          <form onSubmit={handlePlaceOrder} className="space-y-2.5">
            
            {/* Limit Price Input */}
            {orderType !== 'MARKET' && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#848e9c] mb-1">
                  <span>Fiyat</span>
                  <span className="font-mono">USDT</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    step="any"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-3 py-1.5 text-xs text-[#eaecef] font-mono focus:outline-hidden focus:border-[#fcd535]"
                  />
                  <div className="absolute right-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handlePriceStep(-1)}
                      className="p-1 hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] rounded-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceStep(1)}
                      className="p-1 hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] rounded-xs"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Miktar / Amount Input */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#848e9c] mb-1">
                <span>Miktar</span>
                <span className="font-mono">{baseAsset}</span>
              </div>
              <input
                type="number"
                step="any"
                value={quantityCrypto}
                onChange={(e) => {
                  const qty = parseFloat(e.target.value) || 0;
                  setQuantityCrypto(qty);
                  setAmountUSDT(Number((qty * (limitPrice || currentPrice)).toFixed(2)));
                }}
                className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-3 py-1.5 text-xs text-[#eaecef] font-mono focus:outline-hidden focus:border-[#fcd535]"
              />
            </div>

            {/* Total USDT Input */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-[#848e9c] mb-1">
                <span>Toplam</span>
                <span className="font-mono">USDT</span>
              </div>
              <input
                type="number"
                step="any"
                value={amountUSDT}
                onChange={(e) => setAmountUSDT(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-3 py-1.5 text-xs text-[#eaecef] font-mono focus:outline-hidden focus:border-[#fcd535]"
              />
            </div>

            {/* Quick Percentage Slider Chips (Binance 25%, 50%, 75%, 100%) */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="py-1 bg-[#181a20] hover:bg-[#2b313a] text-[10px] font-mono text-[#848e9c] hover:text-[#eaecef] rounded-xs border border-[#2b313a] transition-colors"
                >
                  %{pct}
                </button>
              ))}
            </div>

            {/* TP/SL Toggle */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowAdvancedTPSL(!showAdvancedTPSL)}
                className="flex items-center justify-between w-full text-[11px] text-[#848e9c] hover:text-[#eaecef] py-1 border-t border-[#2b313a]"
              >
                <span>TP / SL (Kar Al / Zarar Durdur)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedTPSL ? 'rotate-180' : ''}`} />
              </button>

              {showAdvancedTPSL && (
                <div className="grid grid-cols-2 gap-2 pt-1 pb-1">
                  <div>
                    <label className="text-[10px] text-[#848e9c] block font-mono">Zarar Durdur (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={stopLossPct}
                      onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 2)}
                      className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-2 py-1 text-xs text-[#eaecef] font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#848e9c] block font-mono">Kar Al (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={takeProfitPct}
                      onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 4)}
                      className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-2 py-1 text-xs text-[#eaecef] font-mono text-center"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Message Banner */}
            {message && (
              <div
                className={`p-2 rounded-xs text-xs font-semibold ${
                  message.type === 'success'
                    ? 'bg-[#0ecb81]/15 text-[#0ecb81] border border-[#0ecb81]/30'
                    : message.type === 'info'
                    ? 'bg-[#3b82f6]/15 text-[#3b82f6] border border-[#3b82f6]/30'
                    : 'bg-[#f6465d]/15 text-[#f6465d] border border-[#f6465d]/30'
                }`}
              >
                <div>{message.text}</div>
                {message.details && <div className="text-[10px] font-normal opacity-90 mt-0.5">{message.details}</div>}
              </div>
            )}

            {/* Big Action Button (Binance AL / SAT) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-xs font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                isSubmitting
                  ? 'opacity-60 bg-[#2b313a] text-[#848e9c]'
                  : isBuy
                  ? 'bg-[#0ecb81] hover:bg-[#2ebd85] text-white'
                  : 'bg-[#f6465d] hover:bg-[#e03b50] text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>İşlem Gönderiliyor...</span>
                </>
              ) : (
                <span>
                  {mode === 'TESTNET' ? 'TESTNET ' : ''}
                  {isBuy ? `AL ${baseAsset}` : `SAT ${baseAsset}`}
                </span>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT / BOTTOM: Binance Live Order Book (Emir Defteri) (5 cols on lg) */}
        <div className="lg:col-span-5 p-2.5 flex flex-col bg-[#14151a] overflow-hidden">
          
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2b313a] text-[11px] text-[#848e9c]">
            <span className="font-bold text-[#eaecef]">Emir Defteri</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBookViewType('both')}
                className={`px-1.5 py-0.5 rounded-xs text-[10px] ${bookViewType === 'both' ? 'bg-[#2b313a] text-[#eaecef]' : 'text-[#848e9c]'}`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setBookViewType('bids')}
                className={`px-1.5 py-0.5 rounded-xs text-[10px] text-[#0ecb81] ${bookViewType === 'bids' ? 'bg-[#2b313a]' : ''}`}
              >
                Alış
              </button>
              <button
                type="button"
                onClick={() => setBookViewType('asks')}
                className={`px-1.5 py-0.5 rounded-xs text-[10px] text-[#f6465d] ${bookViewType === 'asks' ? 'bg-[#2b313a]' : ''}`}
              >
                Satış
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 text-[10px] text-[#848e9c] font-mono">
            <span>Fiyat (USDT)</span>
            <span>Miktar ({baseAsset})</span>
            <span>Toplam</span>
          </div>

          {/* Asks List (Red) */}
          {(bookViewType === 'both' || bookViewType === 'asks') && (
            <div className="flex flex-col-reverse space-y-reverse space-y-0.5 font-mono text-[11px]">
              {safeAsks.map((ask, idx) => {
                const depthPct = Math.min(100, (ask.quantity / maxAskQty) * 100);
                return (
                  <div
                    key={`ask-${idx}`}
                    onClick={() => setLimitPrice(ask.price)}
                    className="relative flex items-center justify-between px-1 py-0.5 cursor-pointer hover:bg-[#2b313a] transition-colors"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#f6465d]/15 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-[#f6465d] font-semibold relative z-10">
                      {ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[#eaecef] relative z-10">{ask.quantity.toFixed(4)}</span>
                    <span className="text-[#848e9c] text-[10px] relative z-10">
                      {(ask.price * ask.quantity).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mid-Market Current Price Banner */}
          <div className="my-1.5 py-1 px-1.5 bg-[#1e2329] rounded-xs border border-[#2b313a] flex items-center justify-between font-mono">
            <span className={`text-xs sm:text-sm font-bold ${isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              ${currentPrice ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
            </span>
            <span className="text-[10px] text-[#848e9c]">Piyasa Fiyatı</span>
          </div>

          {/* Bids List (Green) */}
          {(bookViewType === 'both' || bookViewType === 'bids') && (
            <div className="flex flex-col space-y-0.5 font-mono text-[11px]">
              {safeBids.map((bid, idx) => {
                const depthPct = Math.min(100, (bid.quantity / maxBidQty) * 100);
                return (
                  <div
                    key={`bid-${idx}`}
                    onClick={() => setLimitPrice(bid.price)}
                    className="relative flex items-center justify-between px-1 py-0.5 cursor-pointer hover:bg-[#2b313a] transition-colors"
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-[#0ecb81]/15 pointer-events-none"
                      style={{ width: `${depthPct}%` }}
                    />
                    <span className="text-[#0ecb81] font-semibold relative z-10">
                      {bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[#eaecef] relative z-10">{bid.quantity.toFixed(4)}</span>
                    <span className="text-[#848e9c] text-[10px] relative z-10">
                      {(bid.price * bid.quantity).toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Testnet API Key */}
      {showTestnetKeyModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3">
          <div className="bg-[#1e2329] border border-[#fcd535]/40 rounded-xs w-full max-w-lg p-4 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2b313a]">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#fcd535]" />
                <h3 className="text-sm font-bold text-[#eaecef]">Spot Testnet API Kurulumu</h3>
              </div>
              <button
                onClick={() => setShowTestnetKeyModal(false)}
                className="p-1 text-[#848e9c] hover:text-[#eaecef]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#848e9c]">
              Ücretsiz Testnet API anahtarınızı borsa testnet sağlayıcınızdan alıp yapıştırabilirsiniz.
            </p>

            <form onSubmit={handleSaveTestnetKeys} className="space-y-3">
              <div>
                <label className="text-[11px] text-[#848e9c] block mb-1">API Key:</label>
                <input
                  type="text"
                  required
                  value={testnetApiKeyInput}
                  onChange={(e) => setTestnetApiKeyInput(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-3 py-1.5 text-xs text-[#eaecef] font-mono focus:border-[#fcd535] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#848e9c] block mb-1">Secret Key:</label>
                <input
                  type="password"
                  required
                  value={testnetApiSecretInput}
                  onChange={(e) => setTestnetApiSecretInput(e.target.value)}
                  className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs px-3 py-1.5 text-xs text-[#eaecef] font-mono focus:border-[#fcd535] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#2b313a]">
                <button
                  type="button"
                  onClick={() => setShowTestnetKeyModal(false)}
                  className="px-3 py-1.5 rounded-xs bg-[#2b313a] text-xs font-semibold text-[#eaecef]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xs bg-[#fcd535] text-[#181a20] font-bold text-xs"
                >
                  Kaydet ve Bağlan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
