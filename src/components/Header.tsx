import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ticker, 
  TradingMode, 
  RateLimitStatus 
} from '../types/crypto';
import { BinanceService } from '../services/binanceService';
import { ContinuousTradingBot } from '../services/continuousTradingBot';
import { TOP_500_COINS, COIN_CATEGORIES, CoinCategoryFilter, TopCoinInfo } from '../data/top500Coins';
import { 
  BarChart2, 
  Zap, 
  TestTube, 
  Briefcase, 
  ShieldAlert, 
  Bell, 
  Settings, 
  AlertOctagon, 
  TrendingUp, 
  TrendingDown,
  ChevronDown,
  Search,
  X,
  Database,
  BrainCircuit,
  Scale,
  Menu,
  Activity,
  Flame,
  Globe,
  Radio
} from 'lucide-react';

interface HeaderProps {
  currentTicker?: Ticker;
  symbol: string;
  onSelectSymbol?: (symbol: string) => void;
  tickers?: Record<string, Ticker>;
  activeTab: 'chart' | 'strategies' | 'screener' | 'backtest' | 'arbitrage' | 'portfolio' | 'risk' | 'alerts';
  onTabChange: (tab: 'chart' | 'strategies' | 'screener' | 'backtest' | 'arbitrage' | 'portfolio' | 'risk' | 'alerts') => void;
  mode: TradingMode;
  onOpenSettings: (tab?: 'general' | 'postgres' | 'local_ai') => void;
  rateLimitStatus: RateLimitStatus;
  onTriggerKillSwitch: () => void;
  activeStrategiesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTicker,
  symbol,
  onSelectSymbol,
  tickers = {},
  activeTab,
  onTabChange,
  mode,
  onOpenSettings,
  rateLimitStatus,
  onTriggerKillSwitch,
  activeStrategiesCount,
}) => {
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CoinCategoryFilter>('Tümü');
  const [sortOption, setSortOption] = useState<'rank' | 'gainers' | 'losers' | 'volume'>('rank');

  const [isBotRunning, setIsBotRunning] = useState(ContinuousTradingBot.getStatus().isRunning);

  useEffect(() => {
    const unsub = ContinuousTradingBot.subscribe(() => {
      setIsBotRunning(ContinuousTradingBot.getStatus().isRunning);
    });
    return () => unsub();
  }, []);

  const isPositive = (currentTicker?.change24h || 0) >= 0;
  const weightPct = Math.min(100, (rateLimitStatus.usedWeight1m / rateLimitStatus.maxWeight1m) * 100);

  const tabs = [
    { id: 'chart', label: 'Spot Al-Sat', mobileLabel: 'Spot', icon: BarChart2 },
    { 
      id: 'screener', 
      label: 'Piyasa Tarayıcı', 
      mobileLabel: 'Tarayıcı', 
      icon: Search,
      badge: isBotRunning ? '7/24' : undefined,
      badgeColor: isBotRunning ? 'bg-emerald-500 text-slate-950 font-black animate-pulse' : undefined
    },
    { id: 'strategies', label: 'Bot & Stratejiler', mobileLabel: 'Strateji', icon: Zap, badge: activeStrategiesCount },
    { id: 'arbitrage', label: 'Arbitraj & AMM', mobileLabel: 'Arbitraj', icon: Scale },
    { id: 'backtest', label: 'Backtest', mobileLabel: 'Backtest', icon: TestTube },
    { id: 'portfolio', label: 'Varlıklar & Portföy', mobileLabel: 'Portföy', icon: Briefcase },
    { id: 'risk', label: 'Risk & Güvenlik', mobileLabel: 'Risk', icon: ShieldAlert },
    { id: 'alerts', label: 'Alarmlar', mobileLabel: 'Alarmlar', icon: Bell },
  ];

  const handleConfirmKill = () => {
    onTriggerKillSwitch();
    setShowKillConfirm(false);
  };

  const filteredSymbols = useMemo(() => {
    let list: TopCoinInfo[] = [...TOP_500_COINS];

    if (symbolSearch.trim()) {
      const q = symbolSearch.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.base.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'Tümü') {
      if (selectedCategory === 'En Yüksek Hacim') {
        list.sort((a, b) => (tickers[b.symbol]?.quoteVolume24h || 0) - (tickers[a.symbol]?.quoteVolume24h || 0));
      } else if (selectedCategory === 'En Çok Yükselenler') {
        list.sort((a, b) => (tickers[b.symbol]?.change24h || 0) - (tickers[a.symbol]?.change24h || 0));
      } else if (selectedCategory === 'En Çok Düşenler') {
        list.sort((a, b) => (tickers[a.symbol]?.change24h || 0) - (tickers[b.symbol]?.change24h || 0));
      } else {
        list = list.filter((c) => c.category === selectedCategory);
      }
    }

    if (sortOption === 'gainers') {
      list.sort((a, b) => (tickers[b.symbol]?.change24h || 0) - (tickers[a.symbol]?.change24h || 0));
    } else if (sortOption === 'losers') {
      list.sort((a, b) => (tickers[a.symbol]?.change24h || 0) - (tickers[b.symbol]?.change24h || 0));
    } else if (sortOption === 'volume') {
      list.sort((a, b) => (tickers[b.symbol]?.quoteVolume24h || 0) - (tickers[a.symbol]?.quoteVolume24h || 0));
    } else if (sortOption === 'rank') {
      list.sort((a, b) => a.rank - b.rank);
    }

    return list;
  }, [symbolSearch, selectedCategory, sortOption, tickers]);

  const currentCoinInfo = BinanceService.getCoinInfo(symbol) || {
    rank: 1,
    base: symbol.replace('USDT', ''),
    name: symbol,
    category: 'Layer 1' as const,
  };

  const formattedPrice = currentTicker?.price !== undefined
    ? currentTicker.price < 0.01
      ? currentTicker.price.toFixed(6)
      : currentTicker.price < 1
      ? currentTicker.price.toFixed(4)
      : currentTicker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '---';

  return (
    <header className="bg-[#181a20] border-b border-[#2b313a] text-[#eaecef] select-none shrink-0 sticky top-0 z-40">
      {/* 1. KriptoBot Pro Main Navigation Bar */}
      <div className="px-3 lg:px-4 py-2 border-b border-[#2b313a]/80 max-w-[3840px] mx-auto flex items-center justify-between gap-3">
        
        {/* LEFT: Custom Program Logo & Navigation Links */}
        <div className="flex items-center gap-4 lg:gap-6 min-w-0">
          {/* Custom KriptoBot Pro Logo */}
          <div className="flex items-center gap-2 shrink-0 cursor-pointer" onClick={() => onTabChange('chart')}>
            {/* High-Tech Terminal Shield / Algorithm Pulse Logo */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xs bg-gradient-to-br from-[#fcd535] via-[#f0b90b] to-[#0ecb81] p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-[#181a20] rounded-[2px] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5 fill-none stroke-[#fcd535]" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                  <polyline points="9 11 12 8 15 11" stroke="#0ecb81" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-wider text-[#eaecef] font-sans">
                KRIPTO<span className="text-[#fcd535]">BOT</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-xs bg-[#2b313a] text-[#fcd535] border border-[#fcd535]/30">
                PRO
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Desktop Web) */}
          <nav className="hidden lg:flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors relative flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#fcd535] bg-[#2b313a]'
                      : 'text-[#848e9c] hover:text-[#eaecef] hover:bg-[#1e2329]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge !== 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                      (tab as any).badgeColor || 'bg-[#fcd535] text-[#181a20]'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* RIGHT: Status Controls, Mode Selector & Settings */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Trading Mode Switcher (Paper vs Testnet Live) */}
          <div className="flex items-center rounded-xs bg-[#1e2329] border border-[#2b313a] p-0.5">
            <button
              onClick={() => onOpenSettings('general')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xs transition ${
                mode === 'TESTNET'
                  ? 'bg-[#fcd535] text-[#181a20] shadow-xs'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
              title="Spot Testnet Canlı API Modu"
            >
              <Radio className="w-3 h-3" />
              <span className="text-[11px]">Testnet</span>
            </button>
            <button
              onClick={() => onOpenSettings('general')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-xs transition ${
                mode === 'PAPER'
                  ? 'bg-[#2b313a] text-[#eaecef] shadow-xs'
                  : 'text-[#848e9c] hover:text-[#eaecef]'
              }`}
              title="Paper Sanal Trading Modu"
            >
              <span className="text-[11px]">Paper</span>
            </button>
          </div>

          {/* Rate Limit Weight (Desktop) */}
          <div 
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xs bg-[#1e2329] border border-[#2b313a] text-[11px] font-mono text-[#848e9c]"
            title={`Borsa API 1m Ağırlığı: ${rateLimitStatus.usedWeight1m} / ${rateLimitStatus.maxWeight1m}`}
          >
            <span>API:</span>
            <div className="w-12 bg-[#2b313a] rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  weightPct > 80 ? 'bg-[#f6465d]' : weightPct > 50 ? 'bg-[#fcd535]' : 'bg-[#0ecb81]'
                }`}
                style={{ width: `${Math.max(4, weightPct)}%` }}
              />
            </div>
            <span className={`font-semibold ${weightPct > 80 ? 'text-[#f6465d]' : 'text-[#eaecef]'}`}>
              {rateLimitStatus.usedWeight1m}
            </span>
          </div>

          {/* Database Indicator */}
          <button
            onClick={() => onOpenSettings('postgres')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] text-xs font-mono transition"
            title="Cloud SQL PostgreSQL Veritabanı"
          >
            <Database className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="hidden xl:inline text-[11px]">PostgreSQL</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
          </button>

          {/* Emergency Kill Switch */}
          <button
            onClick={() => setShowKillConfirm(true)}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xs bg-[#f6465d]/20 hover:bg-[#f6465d] text-[#f6465d] hover:text-white border border-[#f6465d]/40 font-bold text-xs transition shrink-0"
            title="Tüm emir ve pozisyonları anında durdur (Kill Switch)"
          >
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-[11px] font-mono">KILL</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onOpenSettings('general')}
            className="p-1.5 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] transition"
            title="Terminal Ayarları & API Anahtarları"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-1.5 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] text-[#848e9c] hover:text-[#eaecef] border border-[#2b313a] transition"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Official Binance Spot Symbol Ticker Sub-Header */}
      <div className="px-3 lg:px-4 py-2 bg-[#14151a] border-b border-[#2b313a] flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Symbol Selector Pill & Current Price */}
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar">
          
          {/* Pair Dropdown Button */}
          <button
            onClick={() => setShowSymbolPicker(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-[#1e2329] hover:bg-[#2b313a] border border-[#2b313a] transition group shrink-0"
          >
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-base text-[#eaecef]">
                {currentCoinInfo.base}
              </span>
              <span className="text-[11px] text-[#848e9c] font-semibold">/USDT</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#848e9c] group-hover:text-[#fcd535] group-hover:translate-y-0.5 transition-all" />
          </button>

          {/* Spot Last Price */}
          <div className="flex items-baseline gap-2 shrink-0">
            <span className={`text-base sm:text-lg font-bold font-mono ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {formattedPrice}
            </span>
            <span className="text-[11px] text-[#848e9c] hidden sm:inline font-mono">
              ${formattedPrice}
            </span>
          </div>

          <div className="h-4 w-px bg-[#2b313a] hidden sm:block shrink-0" />

          {/* 24h Change */}
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] text-[#848e9c]">24s Değişim</span>
            <span className={`font-mono font-bold flex items-center text-[11px] sm:text-xs ${isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
              {currentTicker ? `${isPositive ? '+' : ''}${currentTicker.change24h.toFixed(2)}%` : '0.00%'}
            </span>
          </div>

          {/* 24h High */}
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] text-[#848e9c]">24s En Yüksek</span>
            <span className="font-mono text-[#eaecef] font-medium text-[11px]">
              {currentTicker?.high24h ? currentTicker.high24h.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
            </span>
          </div>

          {/* 24h Low */}
          <div className="flex flex-col shrink-0">
            <span className="text-[10px] text-[#848e9c]">24s En Düşük</span>
            <span className="font-mono text-[#eaecef] font-medium text-[11px]">
              {currentTicker?.low24h ? currentTicker.low24h.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '---'}
            </span>
          </div>

          {/* 24h Volume (Coin) */}
          <div className="hidden md:flex flex-col shrink-0">
            <span className="text-[10px] text-[#848e9c]">24s Hacim ({currentCoinInfo.base})</span>
            <span className="font-mono text-[#eaecef] font-medium text-[11px]">
              {currentTicker?.volume24h ? currentTicker.volume24h.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '---'}
            </span>
          </div>

          {/* 24h Turnover (USDT) */}
          <div className="hidden lg:flex flex-col shrink-0">
            <span className="text-[10px] text-[#848e9c]">24s Hacim (USDT)</span>
            <span className="font-mono text-[#eaecef] font-medium text-[11px]">
              {currentTicker?.quoteVolume24h ? currentTicker.quoteVolume24h.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '---'}
            </span>
          </div>
        </div>

        {/* Quick Testnet API Status Badge */}
        <div className="hidden xl:flex items-center gap-2 text-[11px] text-[#848e9c]">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-[#1e2329] border border-[#2b313a]">
            <Globe className="w-3 h-3 text-[#fcd535]" />
            <span className="text-[#eaecef] font-mono">Spot Testnet API</span>
          </span>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {showMobileMenu && (
        <div className="lg:hidden p-3 bg-[#1e2329] border-b border-[#2b313a] flex flex-col gap-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id as any);
                  setShowMobileMenu(false);
                }}
                className={`px-2.5 py-2 rounded-xs text-xs font-semibold flex items-center justify-between ${
                  activeTab === tab.id ? 'bg-[#fcd535] text-[#181a20]' : 'bg-[#181a20] text-[#eaecef]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge !== 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold flex items-center justify-center ${
                    (tab as any).badgeColor || 'bg-[#f6465d] text-white'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#2b313a]">
            <button
              onClick={() => {
                onOpenSettings('postgres');
                setShowMobileMenu(false);
              }}
              className="flex items-center gap-1.5 text-xs text-[#3b82f6]"
            >
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL Bulut Veritabanı</span>
            </button>
            <button
              onClick={() => {
                onOpenSettings('local_ai');
                setShowMobileMenu(false);
              }}
              className="flex items-center gap-1.5 text-xs text-[#a855f7]"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Yerel AI Ajanı</span>
            </button>
          </div>
        </div>
      )}

      {/* Symbol Picker Modal - 500 Coin Scanner */}
      {showSymbolPicker && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4">
          <div className="bg-[#1e2329] border border-[#2b313a] rounded-sm max-w-xl w-full p-3.5 sm:p-4 space-y-3 shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#2b313a]">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-[#fcd535] rounded-xs flex items-center justify-center text-[#181a20] font-black text-xs">
                  K
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#eaecef]">Spot Kripto Piyasaları</h3>
                  <p className="text-[10px] text-[#848e9c]">500+ Kripto Para Paritesi</p>
                </div>
              </div>
              <button
                onClick={() => setShowSymbolPicker(false)}
                className="p-1 rounded-xs text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#848e9c] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Coin veya sembol ara (BTC, ETH, SOL, PEPE, AVAX...)"
                value={symbolSearch}
                onChange={(e) => setSymbolSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#181a20] border border-[#2b313a] rounded-xs pl-8 pr-3 py-2 text-xs text-[#eaecef] placeholder-[#5e6673] focus:outline-hidden focus:border-[#fcd535] font-mono"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {COIN_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-2.5 py-1 rounded-xs text-[11px] font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-[#fcd535] text-[#181a20] font-bold'
                      : 'bg-[#181a20] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b313a]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Filter Buttons */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#181a20] rounded-xs border border-[#2b313a] text-[10px] font-mono">
              <button
                onClick={() => setSortOption('rank')}
                className={`py-1 rounded-xs text-center transition ${sortOption === 'rank' ? 'bg-[#2b313a] text-[#fcd535] font-bold' : 'text-[#848e9c]'}`}
              >
                Sıralama
              </button>
              <button
                onClick={() => setSortOption('gainers')}
                className={`py-1 rounded-xs text-center transition ${sortOption === 'gainers' ? 'bg-[#2b313a] text-[#0ecb81] font-bold' : 'text-[#848e9c]'}`}
              >
                En Çok Artan
              </button>
              <button
                onClick={() => setSortOption('losers')}
                className={`py-1 rounded-xs text-center transition ${sortOption === 'losers' ? 'bg-[#2b313a] text-[#f6465d] font-bold' : 'text-[#848e9c]'}`}
              >
                En Çok Düşen
              </button>
              <button
                onClick={() => setSortOption('volume')}
                className={`py-1 rounded-xs text-center transition ${sortOption === 'volume' ? 'bg-[#2b313a] text-[#eaecef] font-bold' : 'text-[#848e9c]'}`}
              >
                24s Hacim
              </button>
            </div>

            {/* Symbols List */}
            <div className="overflow-y-auto space-y-1 pr-1 max-h-[50vh] sm:max-h-[55vh]">
              {filteredSymbols.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#848e9c] font-mono">
                  Sonuç bulunamadı.
                </div>
              ) : (
                filteredSymbols.map((item) => {
                  const t = tickers[item.symbol];
                  const itemPositive = (t?.change24h || 0) >= 0;
                  const isCurrent = item.symbol === symbol;

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => {
                        onSelectSymbol?.(item.symbol);
                        setShowSymbolPicker(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xs transition-colors text-left cursor-pointer ${
                        isCurrent
                          ? 'bg-[#2b313a] border-l-2 border-[#fcd535]'
                          : 'hover:bg-[#181a20]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#848e9c] w-6">#{item.rank}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#eaecef]">{item.base}</span>
                            <span className="text-[10px] text-[#848e9c]">/USDT</span>
                          </div>
                          <span className="text-[10px] text-[#848e9c] block truncate max-w-[120px]">{item.name}</span>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs font-bold text-[#eaecef]">
                          ${t?.price !== undefined
                            ? t.price < 0.01
                              ? t.price.toFixed(6)
                              : t.price < 1
                              ? t.price.toFixed(4)
                              : t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })
                            : '---'}
                        </div>
                        <div className={`text-[10px] font-bold ${itemPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                          {t ? `${itemPositive ? '+' : ''}${t.change24h.toFixed(2)}%` : '0.00%'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Kill Switch Modal */}
      {showKillConfirm && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#1e2329] border border-[#f6465d]/50 rounded-sm max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#f6465d]">
              <AlertOctagon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="font-bold text-base text-[#eaecef]">Acil Durdurma (Emergency Kill Switch)</h3>
                <p className="text-xs text-[#848e9c]">Tüm pozisyonlar ve algoritmik stratejiler durdurulacak.</p>
              </div>
            </div>

            <div className="p-3 bg-[#181a20] rounded-xs border border-[#2b313a] text-xs text-[#eaecef] space-y-1.5">
              <p className="text-[#f6465d] font-semibold">Bu işlem şunları gerçekleştirir:</p>
              <ul className="list-disc list-inside text-[#848e9c] space-y-1">
                <li>Tüm aktif alım-satım stratejilerini ve botları devre dışı bırakır.</li>
                <li>Tüm açık pozisyonları anlık piyasa fiyatından kapatır.</li>
                <li>Bekleyen limit ve stop emirlerini iptal eder.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowKillConfirm(false)}
                className="px-4 py-2 rounded-xs bg-[#2b313a] text-[#eaecef] text-xs font-semibold hover:bg-[#323a46] transition"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmKill}
                className="px-4 py-2 rounded-xs bg-[#f6465d] hover:bg-[#e03b50] text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <AlertOctagon className="w-4 h-4" />
                Evet, Hepsini Durdur
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
