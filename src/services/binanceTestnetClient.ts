export interface TestnetKeys {
  apiKey: string;
  apiSecret: string;
}

export interface TestnetBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface TestnetOrderResult {
  success: boolean;
  orderId?: number | string;
  clientOrderId?: string;
  symbol?: string;
  side?: 'BUY' | 'SELL';
  type?: string;
  status?: string;
  executedQty?: number;
  cummulativeQuoteQty?: number;
  price?: number;
  fills?: Array<{ price: string; qty: string; commission: string; commissionAsset: string }>;
  error?: string;
  raw?: any;
}

const STORAGE_KEY = 'binance_testnet_credentials_v1';

export class BinanceTestnetClient {
  private static cachedKeys: TestnetKeys | null = null;

  static getKeys(): TestnetKeys {
    if (this.cachedKeys) return this.cachedKeys;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cachedKeys = JSON.parse(stored);
        return this.cachedKeys!;
      }
    } catch {}
    return { apiKey: '', apiSecret: '' };
  }

  static saveKeys(keys: TestnetKeys) {
    this.cachedKeys = {
      apiKey: keys.apiKey.trim(),
      apiSecret: keys.apiSecret.trim(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cachedKeys));
    } catch {}
  }

  static clearKeys() {
    this.cachedKeys = { apiKey: '', apiSecret: '' };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  static hasKeys(): boolean {
    const keys = this.getKeys();
    return Boolean(keys.apiKey && keys.apiSecret);
  }

  /**
   * Check connection with Binance Testnet
   */
  static async checkStatus(): Promise<{ success: boolean; latencyMs: number; hasEnvKeys: boolean; serverTime?: number; error?: string }> {
    try {
      const res = await fetch('/api/binance-testnet/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, latencyMs: 0, hasEnvKeys: false, error: err.message || 'Sunucu hatası' };
    }
  }

  /**
   * Fetch Binance Testnet Account Balances
   */
  static async getAccount(): Promise<{
    success: boolean;
    configured: boolean;
    balances?: TestnetBalance[];
    error?: string;
    canTrade?: boolean;
  }> {
    const keys = this.getKeys();
    try {
      const res = await fetch('/api/binance-testnet/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: keys.apiKey,
          apiSecret: keys.apiSecret,
        }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        configured: false,
        error: err.message || 'Binance Testnet hesabı sorgulanamadı',
      };
    }
  }

  /**
   * Place Order directly on Binance Testnet (testnet.binance.vision)
   */
  static async placeOrder(params: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity?: number;
    quoteOrderQty?: number;
    price?: number;
    stopPrice?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
  }): Promise<TestnetOrderResult> {
    const keys = this.getKeys();
    try {
      const res = await fetch('/api/binance-testnet/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          apiKey: keys.apiKey,
          apiSecret: keys.apiSecret,
        }),
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Binance Testnet emir iletimi başarısız',
      };
    }
  }

  /**
   * Fetch Open Orders on Testnet
   */
  static async getOpenOrders(symbol?: string) {
    const keys = this.getKeys();
    try {
      const res = await fetch('/api/binance-testnet/open-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          apiKey: keys.apiKey,
          apiSecret: keys.apiSecret,
        }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Cancel Order on Testnet
   */
  static async cancelOrder(symbol: string, orderId: number | string) {
    const keys = this.getKeys();
    try {
      const res = await fetch('/api/binance-testnet/cancel-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          orderId,
          apiKey: keys.apiKey,
          apiSecret: keys.apiSecret,
        }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
