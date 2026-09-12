import crypto from "crypto";

const BINANCE_TESTNET_BASE_URL = "https://testnet.binance.vision";

export interface BinanceTestnetCredentials {
  apiKey?: string;
  apiSecret?: string;
}

export function getEffectiveCredentials(clientCreds?: BinanceTestnetCredentials): { apiKey: string; apiSecret: string } {
  const apiKey = (clientCreds?.apiKey && clientCreds.apiKey.trim()) || process.env.BINANCE_TESTNET_API_KEY || "";
  const apiSecret = (clientCreds?.apiSecret && clientCreds.apiSecret.trim()) || process.env.BINANCE_TESTNET_API_SECRET || "";
  return { apiKey, apiSecret };
}

/**
 * Generates HMAC SHA256 signature for Binance API queries
 */
export function signQuery(queryString: string, apiSecret: string): string {
  return crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
}

/**
 * Ping testnet & get server time
 */
export async function pingTestnet(): Promise<{ success: boolean; latencyMs: number; serverTime?: number; error?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${BINANCE_TESTNET_BASE_URL}/api/v3/time`);
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      throw new Error(`Testnet HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      success: true,
      latencyMs,
      serverTime: data.serverTime,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err.message || "Binance Testnet sunucusuna ulaşılamadı.",
    };
  }
}

/**
 * Fetch Account Information & Balances from Binance Testnet
 */
export async function getTestnetAccount(credentials?: BinanceTestnetCredentials) {
  const { apiKey, apiSecret } = getEffectiveCredentials(credentials);

  if (!apiKey || !apiSecret) {
    return {
      success: false,
      configured: false,
      error: "Binance Testnet API Key ve Secret Key girilmedi. Lütfen Ayarlar veya Testnet Panelinden anahtarınızı girin.",
    };
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 60000;
    const query = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = signQuery(query, apiSecret);

    const url = `${BINANCE_TESTNET_BASE_URL}/api/v3/account?${query}&signature=${signature}`;
    const res = await fetch(url, {
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        configured: true,
        code: data.code,
        error: data.msg || `Binance API Error: ${res.statusText}`,
      };
    }

    // Filter positive or major balances
    const relevantBalances = (data.balances || [])
      .map((b: any) => ({
        asset: b.asset,
        free: parseFloat(b.free) || 0,
        locked: parseFloat(b.locked) || 0,
        total: (parseFloat(b.free) || 0) + (parseFloat(b.locked) || 0),
      }))
      .filter((b: any) => b.total > 0 || ['USDT', 'BTC', 'ETH', 'BNB', 'SOL'].includes(b.asset));

    return {
      success: true,
      configured: true,
      canTrade: data.canTrade,
      accountType: data.accountType,
      balances: relevantBalances,
      updateTime: data.updateTime,
    };
  } catch (err: any) {
    return {
      success: false,
      configured: true,
      error: err.message || "Binance Testnet hesabı alınırken hata oluştu",
    };
  }
}

/**
 * Place Order on Binance Testnet (Market, Limit, etc.)
 */
export async function placeTestnetOrder(params: {
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP_LOSS" | "STOP_LOSS_LIMIT" | "TAKE_PROFIT_LIMIT";
  quantity?: number;
  quoteOrderQty?: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: "GTC" | "IOC" | "FOK";
  credentials?: BinanceTestnetCredentials;
}) {
  const { apiKey, apiSecret } = getEffectiveCredentials(params.credentials);

  if (!apiKey || !apiSecret) {
    return {
      success: false,
      configured: false,
      error: "Binance Testnet API Key ve Secret Key tanımlı değil. Lütfen Testnet anahtarlarınızı girin.",
    };
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 60000;
    const queryParams: Record<string, string> = {
      symbol: params.symbol.toUpperCase(),
      side: params.side,
      type: params.type,
      timestamp: timestamp.toString(),
      recvWindow: recvWindow.toString(),
    };

    if (params.type === "LIMIT") {
      queryParams.timeInForce = params.timeInForce || "GTC";
      if (params.price) queryParams.price = params.price.toString();
      if (params.quantity) queryParams.quantity = params.quantity.toString();
    } else if (params.type === "MARKET") {
      if (params.quantity && params.quantity > 0) {
        queryParams.quantity = params.quantity.toString();
      } else if (params.quoteOrderQty && params.quoteOrderQty > 0) {
        queryParams.quoteOrderQty = params.quoteOrderQty.toString();
      }
    }

    if (params.stopPrice) {
      queryParams.stopPrice = params.stopPrice.toString();
    }

    const queryString = new URLSearchParams(queryParams).toString();
    const signature = signQuery(queryString, apiSecret);
    const finalUrl = `${BINANCE_TESTNET_BASE_URL}/api/v3/order?${queryString}&signature=${signature}`;

    const res = await fetch(finalUrl, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      let friendlyError = data.msg || `Emir iletilemedi (HTTP ${res.status})`;
      if (data.code === -2010) friendlyError = `Yetersiz bakiye veya emir gereksinimi karşılanamadı: ${data.msg}`;
      if (data.code === -1013) friendlyError = `Geçersiz miktar/fiyat boyutu (LOT_SIZE/MIN_NOTIONAL): ${data.msg}`;
      if (data.code === -2015) friendlyError = `Geçersiz API Anahtarı veya IP İzni: ${data.msg}`;

      return {
        success: false,
        code: data.code,
        error: friendlyError,
        raw: data,
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      clientOrderId: data.clientOrderId,
      symbol: data.symbol,
      side: data.side,
      type: data.type,
      status: data.status,
      executedQty: parseFloat(data.executedQty) || 0,
      cummulativeQuoteQty: parseFloat(data.cummulativeQuoteQty) || 0,
      price: parseFloat(data.price) || 0,
      fills: data.fills || [],
      transactTime: data.transactTime,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Binance Testnet emir iletimi sırasında ağ hatası",
    };
  }
}

/**
 * Fetch Open Orders from Binance Testnet
 */
export async function getTestnetOpenOrders(symbol?: string, credentials?: BinanceTestnetCredentials) {
  const { apiKey, apiSecret } = getEffectiveCredentials(credentials);
  if (!apiKey || !apiSecret) {
    return { success: false, configured: false, error: "API anahtarları eksik" };
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 60000;
    let query = `recvWindow=${recvWindow}&timestamp=${timestamp}`;
    if (symbol) {
      query = `symbol=${symbol.toUpperCase()}&` + query;
    }
    const signature = signQuery(query, apiSecret);
    const url = `${BINANCE_TESTNET_BASE_URL}/api/v3/openOrders?${query}&signature=${signature}`;

    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.msg || "Açık emirler alınamadı" };
    }

    return {
      success: true,
      orders: data,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Cancel Order on Binance Testnet
 */
export async function cancelTestnetOrder(symbol: string, orderId: number | string, credentials?: BinanceTestnetCredentials) {
  const { apiKey, apiSecret } = getEffectiveCredentials(credentials);
  if (!apiKey || !apiSecret) {
    return { success: false, configured: false, error: "API anahtarları eksik" };
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 60000;
    const query = `symbol=${symbol.toUpperCase()}&orderId=${orderId}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = signQuery(query, apiSecret);
    const url = `${BINANCE_TESTNET_BASE_URL}/api/v3/order?${query}&signature=${signature}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: { "X-MBX-APIKEY": apiKey },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.msg || "Emir iptal edilemedi" };
    }

    return {
      success: true,
      cancelledOrder: data,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Fetch My Trades from Binance Testnet
 */
export async function getTestnetMyTrades(symbol: string, credentials?: BinanceTestnetCredentials) {
  const { apiKey, apiSecret } = getEffectiveCredentials(credentials);
  if (!apiKey || !apiSecret) {
    return { success: false, configured: false, error: "API anahtarları eksik" };
  }

  try {
    const timestamp = Date.now();
    const recvWindow = 60000;
    const query = `symbol=${symbol.toUpperCase()}&limit=50&recvWindow=${recvWindow}&timestamp=${timestamp}`;
    const signature = signQuery(query, apiSecret);
    const url = `${BINANCE_TESTNET_BASE_URL}/api/v3/myTrades?${query}&signature=${signature}`;

    const res = await fetch(url, {
      headers: { "X-MBX-APIKEY": apiKey },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.msg || "İşlem geçmişi alınamadı" };
    }

    return {
      success: true,
      trades: data,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
