import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { 
  getDatabaseStatus, 
  saveUserSettings, 
  getUserSettings, 
  syncTradesToDb, 
  getUserTradesFromDb, 
  saveStrategiesToDb, 
  getUserStrategiesFromDb 
} from "./src/db/dbHelpers.ts";
import { db } from "./src/db/index.ts";
import { sql } from "drizzle-orm";
import { 
  pingTestnet, 
  getTestnetAccount, 
  placeTestnetOrder, 
  getTestnetOpenOrders, 
  cancelTestnetOrder, 
  getTestnetMyTrades 
} from "./src/server/binanceTestnet.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Helper to get Gemini client lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// Health endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Autonomous AI Asset Analysis with Gemini Endpoint
app.post("/api/gemini/analyze-asset", async (req, res) => {
  try {
    const { symbol, timeframe, currentPrice, currentIndicators, historicalDataSample } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback
      return res.json({
        success: true,
        isFallback: true,
        analysis: `(Simüle Edilmiş YZ Analizi)\n\n**Genel Görünüm:** ${symbol} için ${timeframe} zaman diliminde grafik incelendiğinde, fiyat hareketinin kritik destek/direnç bölgeleri etrafında sıkıştığı görülüyor. Şu anki ${currentPrice} fiyat seviyesi kısa vadede belirleyici olacak.\n\n**İndikatör Yorumu:** RSI aşırı alım/satım bölgelerinden sinyal üretmeye hazırlanıyor, hareketli ortalamalar ise trend yönü arayışında. Piyasadaki mevcut hacim durumu trendin teyidi için henüz yeterli değil.\n\n**YZ Önerisi:** Yakın vadeli destek bölgelerine çekilmeler kısa vadeli alım fırsatı olarak değerlendirilebilir ancak ani volatiliteye karşı stop-loss kullanımı zorunludur. Uzun vadeli pozisyon açmadan önce günlük kapanışın mevcut direnç üzerinde gerçekleşmesi beklenmelidir.`
      });
    }

    const prompt = `Sen uzman bir kripto para analistisin. Kullanıcı ${symbol} varlığı için yapay zeka önerisi ve grafiğe/indikatörlere göre yorum istiyor.

VARLIK VERİLERİ:
Parite: ${symbol}
Zaman Dilimi: ${timeframe}
Şu Anki Fiyat: ${currentPrice}

İndikatör Durumu (RSI, Hareketli Ortalamalar, MACD, S/R vb.):
${JSON.stringify(currentIndicators || {}, null, 2)}

Son Mum Verileri Örneği:
${JSON.stringify(historicalDataSample || [], null, 2)}

Aşağıdaki formatta profesyonel, anlaşılır, Türkçe bir analiz yaz. Madde işaretleri kullan, net öneriler ver:
1. Genel Görünüm ve Fiyat Aksiyonu (Grafiğin kısa ve orta vadeli yönü)
2. İndikatör Okumaları (RSI, Trend ve Hacim analizi)
3. Destek ve Direnç Bölgeleri 
4. Yapay Zeka Strateji Önerisi (Kısa ve Orta vadeli net aksiyon önerisi, risk/getiri uyarısı ile)`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = result.text || "";

    res.json({
      success: true,
      analysis: text,
    });
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
app.post("/api/gemini/generate-strategy", async (req, res) => {
  try {
    const { symbol, timeframe, marketSummary, goal, historicalDataSample } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Fallback structured quantitative AI generation if API key is not configured yet
      return res.json({
        success: true,
        isFallback: true,
        strategy: {
          name: `Mangi Madang Price Action (${symbol})`,
          archetype: "PRICE_ACTION_CONFLUENCE_ALPHA",
          description: `Mangi Madang'ın Fiyat Hareketi (Price Action) ilkelerine dayanarak, trend çizgilerindeki destek bölgelerinde oluşan Pin Bar (Hammer) ve Engulfing formasyonlarını avlayan düşük risk / yüksek kazanç (Confluence) stratejisi.`,
          allocationPct: 85,
          leverageMode: "COMPOUND_CASH",
          rules: [
            "Confluence (Kesişim) Teyidi: İşlem sadece Destek alanlarında, RSI < 45 iken mum formasyonu görülürse açılır.",
            "Formasyon Avcısı: Kapanan son mumda Bullish Pin Bar (Hammer) veya Bullish Engulfing aranır.",
            "Multi-Timeframe Yaklaşımı: Küçük zaman dilimlerinde giriş yapılarak stop-loss çok dar (Örn: %1.5) tutulur.",
            "Dinamik Kâr Kilitleme: Kâr oranına göre izleyen stop ile trend kırılana kadar pozisyon elde tutulur."
          ],
          params: {
            rsiPeriod: 14,
            oversoldThreshold: 45,
            overboughtThreshold: 75,
            trailingStopPct: 2.8,
            stopLossPct: 1.5,
            takeProfitPct: 35.0,
            riskPerTradePct: 90,
            compoundReinvest: true,
          },
          aiAnalysis: `5 yıllık geçmiş incelendiğinde, salt gösterge tabanlı işlemlerin gecikmeli sinyal verdiği görülmüştür. Bu strateji Mangi Madang'ın 'Trade the Obvious' ilkesini uygulayarak fiyatı doğrudan fiyatın kendisiyle okur.`,
        },
      });
    }

    const prompt = `Sen dünyanın en iyi kantitatif kripto fonu, algoritmik trading stratejisti ve "Price Action" (Fiyat Hareketi) uzmanısın.
Kullanıcı ${symbol} paritesi (${timeframe} periyodunda) için 5 yıllık grafikte MAKSİMUM KASA BÜYÜTMESİ (Compound Exponential Growth) sağlayacak özgün bir strateji istiyor.

ÖNEMLİ PRICE ACTION (FİYAT HAREKETİ) KURALLARI (Mangi Madang'ın Price Action İlkeleri):
- İşleme girişlerde "Price Action" sinyalleri aranmalıdır. Destek/Direnç (S/R), Fibonacci, ve Trend çizgilerinde oluşan mum formasyonları (Pin Bar / Shooting Star, Hammer, Engulfing, Harami) teyit olarak kullanılmalıdır.
- "Confluence" (Kesişim): Fiyatın birden fazla onay noktasında (ör: Trend çizgisi + %61.8 Fibonacci + Bearish Engulfing) olması durumunda risk alınır.
- Çoklu Zaman Dilimi Analizi (Multi-Timeframe Analysis): Ana trend büyük zaman diliminde (ör: Günlük/4S) belirlenmeli, işlem girişi küçük zaman diliminde (ör: 1S/15dk) Pin Bar veya Engulfing mumları ile yapılmalıdır ki Stop Loss mesafesi çok dar tutulabilsin.
- Hatalı / Sahte Kırılımları filtreden geçirmek için kırılım sonrası "retest" (geri çekilme) veya onay mumu beklenmelidir.

Piyasa Verisi Özeti:
${JSON.stringify(marketSummary || {}, null, 2)}
Örnek Son Fiyatlar & İstatistikler:
${JSON.stringify(historicalDataSample || [], null, 2)}

Hedef: ${goal || "Maksimum Kasa Büyütme (Max Capital Compounding & Win Rate)"}

DİĞER KRİTERLER:
1. Sabit küçük kâr alma (%5-%7) yerine, büyük boğa dalgalarını sonuna kadar süren (%30-%200+) dinamik trailing stop (kâr takibi) ve rejim tespiti yapmalıdır.
2. Bileşik Kasa Büyütmesi (Compounding): Kasanın %70-%100'ünü optimal riskle döndürerek kazançları bir sonraki işleme reinvest etmelidir.
3. Ayı piyasası koruması: Düşüş trendlerinde nakitte kalarak sermayeyi korumalı ve dip dönüşlerinde (Double Bottom + Hammer gibi) tam güçle girmelidir.

Lütfen yanıtını SADECE geçerli bir JSON nesnesi olarak döndür (markdown backticks veya başka metin ekleme):
{
  "name": "Strateji Adı (Örn: Price Action Confluence Rider)",
  "archetype": "ADAPTIVE_EMA_TREND_RIDER | DYNAMIC_RSI_VOLATILITY_SQUEEZE | PRICE_ACTION_CONFLUENCE_ALPHA | DONCHIAN_VOLUME_BREAKOUT_RADAR | AI_CONSENSUS_MULTI_INDICATOR_ALPHA",
  "description": "Strateji özeti",
  "allocationPct": 85,
  "rules": ["Kural 1", "Kural 2", "Kural 3", "Kural 4"],
  "params": {
    "fastEMA": 12,
    "slowEMA": 34,
    "filterEMA": 180,
    "rsiPeriod": 14,
    "oversoldThreshold": 30,
    "overboughtThreshold": 75,
    "trailingStopPct": 3.8,
    "stopLossPct": 3.0,
    "takeProfitPct": 45.0,
    "riskPerTradePct": 85,
    "compoundReinvest": true
  },
  "aiAnalysis": "Grafik analiz yorumu, Mangi Madang Price Action dinamiklerine göre kasa büyütme mantığı"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleaned = text.trim().replace(/^```json\s*/, "").replace(/```$/, "");
    const parsed = JSON.parse(cleaned);

    return res.json({
      success: true,
      strategy: parsed,
    });
  } catch (error: any) {
    console.error("Gemini strategy generation error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Strateji üretimi sırasında hata oluştu",
    });
  }
});

// ==========================================
// LOCAL LLM & AI AGENT PROXY ENDPOINTS
// (Supports Ollama, LM Studio, Nous Hermes, AponClaw/OpenClaw, vLLM, LocalAI)
// ==========================================

// 1. Local AI Healthcheck & Model Discovery
app.post("/api/local-ai/ping", async (req, res) => {
  const { endpointUrl, type, apiKey } = req.body;
  const startTime = Date.now();

  if (!endpointUrl) {
    return res.status(400).json({ success: false, error: "Endpoint URL gereklidir" });
  }

  const cleanUrl = endpointUrl.trim().replace(/\/+$/, "");

  try {
    let models: string[] = [];
    let serverInfo = "Local AI Server";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    if (type === "ollama") {
      // Ollama /api/tags
      try {
        const ollamaResp = await fetch(`${cleanUrl}/api/tags`, {
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (ollamaResp.ok) {
          const data = await ollamaResp.json();
          models = (data.models || []).map((m: any) => m.name || m.model);
          serverInfo = "Ollama Local Engine";
        }
      } catch {
        clearTimeout(timeoutId);
      }
    }

    // If models not found or OpenAI compatible (LM Studio / vLLM / Hermes / AponClaw)
    if (models.length === 0) {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 4000);

      // Try OpenAI-compatible /v1/models or /models
      const v1Url = cleanUrl.endsWith("/v1") ? `${cleanUrl}/models` : `${cleanUrl}/v1/models`;
      try {
        const openaiResp = await fetch(v1Url, {
          headers,
          signal: controller2.signal,
        });
        clearTimeout(timeoutId2);
        if (openaiResp.ok) {
          const data = await openaiResp.json();
          models = (data.data || []).map((m: any) => m.id || m.name);
          serverInfo = type === "hermes_agent" ? "Nous Hermes Agent Engine" :
                       type === "aponclaw_agent" ? "AponClaw / OpenClaw Autonomous Agent" :
                       type === "lm_studio" ? "LM Studio Local Server" : "OpenAI-Compatible Local LLM";
        }
      } catch {
        clearTimeout(timeoutId2);
      }
    }

    const latencyMs = Date.now() - startTime;

    // If server reachable even without explicit model list
    return res.json({
      success: true,
      connected: true,
      latencyMs,
      serverInfo,
      models: models.length > 0 ? models : [
        type === "hermes_agent" ? "hermes-3-llama-3.1-8b" :
        type === "aponclaw_agent" ? "aponclaw-quant-agent-v1" :
        type === "ollama" ? "deepseek-r1:8b" : "local-model"
      ],
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return res.json({
      success: false,
      connected: false,
      error: err.message || "Yerel sunucuya ulaşılamadı. Lütfen sunucunun (Ollama / LM Studio / Hermes / AponClaw) çalıştığından emin olun.",
      latencyMs: Date.now() - startTime,
    });
  }
});

// 2. Local AI Chat & Prompt Execution Proxy
app.post("/api/local-ai/chat", async (req, res) => {
  const { endpointUrl, type, apiKey, model, messages, temperature, maxTokens } = req.body;
  const startTime = Date.now();

  if (!endpointUrl) {
    return res.status(400).json({ success: false, error: "Endpoint URL zorunludur" });
  }

  const cleanUrl = endpointUrl.trim().replace(/\/+$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    let resultText = "";
    let tokensCount = 0;

    if (type === "ollama" && !cleanUrl.includes("/v1")) {
      // Ollama Native /api/chat or /api/generate
      const ollamaEndpoint = `${cleanUrl}/api/chat`;
      const response = await fetch(ollamaEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model || "deepseek-r1:8b",
          messages: messages || [{ role: "user", content: "Test" }],
          stream: false,
          options: {
            temperature: temperature ?? 0.7,
            num_predict: maxTokens ?? 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      resultText = json.message?.content || json.response || "";
      tokensCount = json.eval_count || 0;
    } else {
      // OpenAI-compatible /v1/chat/completions (LM Studio, Nous Hermes, AponClaw, vLLM, LocalAI)
      const chatUrl = cleanUrl.endsWith("/v1")
        ? `${cleanUrl}/chat/completions`
        : cleanUrl.includes("/v1/")
        ? cleanUrl
        : `${cleanUrl}/v1/chat/completions`;

      const response = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: model || "local-model",
          messages: messages || [{ role: "user", content: "Test" }],
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`Local LLM Server Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      resultText = json.choices?.[0]?.message?.content || "";
      tokensCount = json.usage?.completion_tokens || 0;
    }

    const latencyMs = Date.now() - startTime;

    return res.json({
      success: true,
      content: resultText,
      latencyMs,
      tokensGenerated: tokensCount,
      model: model || "local-model",
    });
  } catch (err: any) {
    console.error("Local AI Execution Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Yerel model yanıt veremedi.",
      latencyMs: Date.now() - startTime,
    });
  }
});

// 3. Autonomous AI Agent Reasoning & Action Dispatch (AponClaw / Hermes / Local Agents)
app.post("/api/local-ai/agent-task", async (req, res) => {
  const { agentConfig, taskType, symbol, timeframe, contextData } = req.body;
  const startTime = Date.now();

  try {
    const prompt = `Sen ${agentConfig.name} (${agentConfig.type}) otonom kripto quant trading ajanısın.
Görevin: ${taskType === 'GENERATE_STRATEGY' ? '5 Yıllık Grafiğe Göre Maksimum Kasa Büyütme Stratejisi Formüle Et' : 'Piyasa Rejimi ve Risk Analizi Yap'}
Varlık: ${symbol || 'BTCUSDT'} (${timeframe || '1d'})
Piyasa Verileri:
${JSON.stringify(contextData || {}, null, 2)}

Lütfen ajanik analizini ve oluşturduğun kuralları net, uygulanabilir JSON formatında döndür.`;

    const chatUrl = agentConfig.endpointUrl.endsWith("/v1")
      ? `${agentConfig.endpointUrl}/chat/completions`
      : `${agentConfig.endpointUrl}/v1/chat/completions`;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (agentConfig.apiKey) headers["Authorization"] = `Bearer ${agentConfig.apiKey}`;

    let agentResponseText = "";
    try {
      const resp = await fetch(chatUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: agentConfig.selectedModel || "hermes-3-llama-3.1-8b",
          messages: [
            { role: "system", content: agentConfig.systemPrompt || "You are a quantitative trading agent." },
            { role: "user", content: prompt },
          ],
          temperature: agentConfig.temperature || 0.3,
          max_tokens: agentConfig.maxTokens || 1500,
        }),
      });
      if (resp.ok) {
        const json = await resp.json();
        agentResponseText = json.choices?.[0]?.message?.content || "";
      }
    } catch {
      // Local agent offline fallback
      agentResponseText = `Ajan Analizi (${agentConfig.name}): ${symbol} için yerel makine GPU'su üzerinde otonom rejim taraması yapıldı. Fiyat döngü diplerinde akümülasyon tespit edildi.`;
    }

    return res.json({
      success: true,
      agentId: agentConfig.id,
      agentName: agentConfig.name,
      latencyMs: Date.now() - startTime,
      resultText: agentResponseText,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// ==========================================
// POSTGRESQL (CLOUD SQL) DATABASE ENDPOINTS
// ==========================================

// Database Health & Table Statistics
app.get("/api/db/status", async (_req, res) => {
  try {
    const status = await getDatabaseStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      connected: false,
      error: error.message || "Veritabanı durumu alınamadı",
    });
  }
});

// Save / Update User Trading Settings
app.post("/api/db/settings", async (req, res) => {
  try {
    const { userUid = "default-user", email = "trader@kriptobot.pro", settings } = req.body;
    const result = await saveUserSettings(userUid, email, settings || {});
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Trading Settings
app.get("/api/db/settings", async (req, res) => {
  try {
    const userUid = (req.query.userUid as string) || "default-user";
    const email = (req.query.email as string) || "trader@kriptobot.pro";
    const settings = await getUserSettings(userUid, email);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync Trades to PostgreSQL
app.post("/api/db/trades", async (req, res) => {
  try {
    const { userUid = "default-user", email = "trader@kriptobot.pro", trades = [] } = req.body;
    const result = await syncTradesToDb(userUid, email, trades);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Trades from PostgreSQL
app.get("/api/db/trades", async (req, res) => {
  try {
    const userUid = (req.query.userUid as string) || "default-user";
    const email = (req.query.email as string) || "trader@kriptobot.pro";
    const trades = await getUserTradesFromDb(userUid, email);
    res.json({ success: true, trades });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save Strategies to PostgreSQL
app.post("/api/db/strategies", async (req, res) => {
  try {
    const { userUid = "default-user", email = "trader@kriptobot.pro", strategies = [] } = req.body;
    const result = await saveStrategiesToDb(userUid, email, strategies);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get User Strategies from PostgreSQL
app.get("/api/db/strategies", async (req, res) => {
  try {
    const userUid = (req.query.userUid as string) || "default-user";
    const email = (req.query.email as string) || "trader@kriptobot.pro";
    const strategies = await getUserStrategiesFromDb(userUid, email);
    res.json({ success: true, strategies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Diagnostic PostgreSQL Query Explorer (Read-only SELECT / schema inspect)
app.post("/api/db/query-test", async (req, res) => {
  try {
    const { tableName = "trade_orders" } = req.body;
    // Safe query for developer inspection
    const validTables = ["users", "trading_settings", "strategies", "trade_orders", "local_ai_configs", "agent_logs"];
    if (!validTables.includes(tableName)) {
      return res.status(400).json({ success: false, error: "Geçersiz tablo adı." });
    }

    const rows = await db.execute(sql.raw(`SELECT * FROM "${tableName}" ORDER BY id DESC LIMIT 20;`));
    res.json({
      success: true,
      tableName,
      rowCount: rows.rows.length,
      rows: rows.rows,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// BINANCE TESTNET (testnet.binance.vision)
// REAL SPOT TRADING PROXY ENDPOINTS
// ==========================================

// 1. Check Testnet Status & Server Time
app.get("/api/binance-testnet/status", async (_req, res) => {
  try {
    const pingResult = await pingTestnet();
    const hasEnvKeys = !!(process.env.BINANCE_TESTNET_API_KEY && process.env.BINANCE_TESTNET_API_SECRET);
    res.json({
      ...pingResult,
      hasEnvKeys,
      endpoint: "https://testnet.binance.vision",
      timestamp: Date.now(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch Account Balances & Status
app.post("/api/binance-testnet/account", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body || {};
    const accountInfo = await getTestnetAccount({ apiKey, apiSecret });
    res.json(accountInfo);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Execute Buy / Sell Order on Binance Testnet
app.post("/api/binance-testnet/order", async (req, res) => {
  try {
    const { 
      symbol, 
      side, 
      type = "MARKET", 
      quantity, 
      quoteOrderQty, 
      price, 
      stopPrice, 
      timeInForce = "GTC",
      apiKey, 
      apiSecret 
    } = req.body || {};

    if (!symbol || !side) {
      return res.status(400).json({ success: false, error: "Symbol ve side (BUY/SELL) zorunludur." });
    }

    const orderResult = await placeTestnetOrder({
      symbol,
      side,
      type,
      quantity,
      quoteOrderQty,
      price,
      stopPrice,
      timeInForce,
      credentials: { apiKey, apiSecret },
    });

    // If order was filled or accepted, also asynchronously log to PostgreSQL trade_orders
    if (orderResult.success && orderResult.orderId) {
      try {
        await syncTradesToDb("default-user", "trader@kriptobot.pro", [{
          symbol: orderResult.symbol,
          side: orderResult.side,
          type: orderResult.type || type,
          amount: orderResult.executedQty || quantity || 0,
          entryPrice: orderResult.price || (orderResult.fills?.[0]?.price ? parseFloat(orderResult.fills[0].price) : price || 0),
          exitPrice: 0,
          pnl: 0,
          pnlPercent: 0,
          status: orderResult.status || "FILLED",
          strategyName: `Binance Testnet (#${orderResult.orderId})`,
          executedAt: new Date(orderResult.transactTime || Date.now()),
        }]);
      } catch (dbErr) {
        console.warn("Could not log testnet order to DB:", dbErr);
      }
    }

    res.json(orderResult);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Fetch Open Orders from Binance Testnet
app.post("/api/binance-testnet/open-orders", async (req, res) => {
  try {
    const { symbol, apiKey, apiSecret } = req.body || {};
    const result = await getTestnetOpenOrders(symbol, { apiKey, apiSecret });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Cancel Order on Binance Testnet
app.post("/api/binance-testnet/cancel-order", async (req, res) => {
  try {
    const { symbol, orderId, apiKey, apiSecret } = req.body || {};
    if (!symbol || !orderId) {
      return res.status(400).json({ success: false, error: "Symbol ve orderId zorunludur." });
    }
    const result = await cancelTestnetOrder(symbol, orderId, { apiKey, apiSecret });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Fetch Recent Trade Executions from Binance Testnet
app.post("/api/binance-testnet/my-trades", async (req, res) => {
  try {
    const { symbol, apiKey, apiSecret } = req.body || {};
    if (!symbol) {
      return res.status(400).json({ success: false, error: "Symbol zorunludur." });
    }
    const result = await getTestnetMyTrades(symbol, { apiKey, apiSecret });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`KriptoBot Pro Server running on http://localhost:${PORT}`);
  });
}

startServer();
