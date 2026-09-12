import React, { useState, useMemo } from 'react';
import { Ticker } from '../types/crypto';
import { TOP_500_COINS, COIN_CATEGORIES, CoinCategoryFilter, TopCoinInfo } from '../data/top500Coins';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  Flame, 
  Layers
} from 'lucide-react';

interface WatchlistProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  tickers: Record<string, Ticker>;
}

type TabType = 'all' | 'favorites' | 'gainers' | 'losers' | 'volume';

export const Watchlist: React.FC<WatchlistProps> = ({
  selectedSymbol,
  onSelectSymbol,
  tickers,
}) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<CoinCategoryFilter>('Tümü');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crypto_favorites_500');
      return saved ? JSON.parse(saved) : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'AVAXUSDT', 'NEARUSDT', 'PEPEUSDT'];
    } catch {
      return ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'AVAXUSDT'];
    }
  });

  const toggleFavorite = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(sym)
      ? favorites.filter((s) => s !== sym)
      : [...favorites, sym];
    setFavorites(updated);
    try {
      localStorage.setItem('crypto_favorites_500', JSON.stringify(updated));
    } catch {}
  };

  // Filter and sort coins
  const filteredAndSortedCoins = useMemo(() => {
    let list: TopCoinInfo[] = [...TOP_500_COINS];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.symbol.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.base.toLowerCase().includes(q)
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

    if (activeTab === 'favorites') {
      list = list.filter((c) => favorites.includes(c.symbol));
    } else if (activeTab === 'gainers') {
      list = list.sort((a, b) => (tickers[b.symbol]?.change24h || 0) - (tickers[a.symbol]?.change24h || 0));
    } else if (activeTab === 'losers') {
      list = list.sort((a, b) => (tickers[a.symbol]?.change24h || 0) - (tickers[b.symbol]?.change24h || 0));
    } else if (activeTab === 'volume') {
      list = list.sort((a, b) => (tickers[b.symbol]?.quoteVolume24h || 0) - (tickers[a.symbol]?.quoteVolume24h || 0));
    }

    return list;
  }, [search, activeTab, selectedCategory, favorites, tickers]);

  return (
    <div className="bg-[#1e2329] border border-[#2b313a] rounded-xs flex flex-col h-full overflow-hidden select-none">
      {/* Search Input in Binance style */}
      <div className="p-2 border-b border-[#2b313a] bg-[#181a20]">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#848e9c] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Ara (BTC, ETH...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1e2329] border border-[#2b313a] rounded-xs pl-8 pr-3 py-1 text-xs text-[#eaecef] placeholder-[#5e6673] focus:outline-hidden focus:border-[#fcd535] transition-colors font-mono"
          />
        </div>
      </div>

      {/* Tabs Row: Top 500, Favoriler, Kazananlar, vb. */}
      <div className="grid grid-cols-4 border-b border-[#2b313a] bg-[#181a20] text-[11px] font-semibold">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-1.5 text-center transition border-b-2 ${
            activeTab === 'all'
              ? 'border-[#fcd535] text-[#fcd535]'
              : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          USDT
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`py-1.5 flex items-center justify-center gap-1 transition border-b-2 ${
            activeTab === 'favorites'
              ? 'border-[#fcd535] text-[#fcd535]'
              : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          <Star className="w-3 h-3 fill-current" />
          <span>Favori</span>
        </button>
        <button
          onClick={() => setActiveTab('gainers')}
          className={`py-1.5 text-center transition border-b-2 ${
            activeTab === 'gainers'
              ? 'border-[#fcd535] text-[#0ecb81]'
              : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          Artan
        </button>
        <button
          onClick={() => setActiveTab('volume')}
          className={`py-1.5 text-center transition border-b-2 ${
            activeTab === 'volume'
              ? 'border-[#fcd535] text-[#eaecef]'
              : 'border-transparent text-[#848e9c] hover:text-[#eaecef]'
          }`}
        >
          Hacim
        </button>
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-[#848e9c] bg-[#181a20] border-b border-[#2b313a]">
        <span>Parite</span>
        <div className="flex items-center gap-4 text-right">
          <span>Son Fiyat</span>
          <span className="w-12">24s Değ.</span>
        </div>
      </div>

      {/* Scrollable Coins Table */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#2b313a]/40 bg-[#1e2329]">
        {filteredAndSortedCoins.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#848e9c] font-mono">
            {activeTab === 'favorites' ? 'Favori parite yok' : 'Sonuç bulunamadı'}
          </div>
        ) : (
          filteredAndSortedCoins.map((item, index) => {
            const isSelected = selectedSymbol === item.symbol;
            const ticker = tickers[item.symbol];
            const isPositive = (ticker?.change24h || 0) >= 0;
            const isFav = favorites.includes(item.symbol);

            return (
              <div
                key={`watchlist-coin-${item.symbol}-${item.rank}-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSymbol(item.symbol)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSymbol(item.symbol);
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors cursor-pointer text-left select-none ${
                  isSelected
                    ? 'bg-[#2b313a] border-l-2 border-[#fcd535]'
                    : 'hover:bg-[#252b34]'
                }`}
              >
                {/* Left: Star + Pair */}
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => toggleFavorite(item.symbol, e)}
                    className="p-0.5 text-[#5e6673] hover:text-[#fcd535] transition shrink-0"
                  >
                    <Star
                      className={`w-3 h-3 ${
                        isFav ? 'fill-[#fcd535] text-[#fcd535]' : 'text-[#5e6673]'
                      }`}
                    />
                  </button>

                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-[#eaecef]">{item.base}</span>
                      <span className="text-[10px] text-[#848e9c]">/USDT</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price + 24h Change */}
                <div className="flex items-center gap-2 font-mono text-right shrink-0">
                  <div className="text-xs font-medium text-[#eaecef]">
                    {ticker?.price !== undefined
                      ? ticker.price < 0.01
                        ? ticker.price.toFixed(6)
                        : ticker.price < 1
                        ? ticker.price.toFixed(4)
                        : ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : '---'}
                  </div>
                  
                  <div
                    className={`text-[11px] font-bold w-14 text-right ${
                      isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'
                    }`}
                  >
                    {ticker?.change24h !== undefined ? `${isPositive ? '+' : ''}${ticker.change24h.toFixed(2)}%` : '0.00%'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
