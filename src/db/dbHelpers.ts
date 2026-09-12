import { db } from './index.ts';
import { 
  users, 
  tradingSettings, 
  strategies, 
  tradeOrders, 
  localAiConfigs, 
  agentLogs 
} from './schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { getOrCreateUser } from './users.ts';

export async function getDatabaseStatus() {
  try {
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const tradeCount = await db.select({ count: sql<number>`count(*)` }).from(tradeOrders);
    const strategyCount = await db.select({ count: sql<number>`count(*)` }).from(strategies);
    const settingsCount = await db.select({ count: sql<number>`count(*)` }).from(tradingSettings);
    const aiConfigCount = await db.select({ count: sql<number>`count(*)` }).from(localAiConfigs);
    const logCount = await db.select({ count: sql<number>`count(*)` }).from(agentLogs);

    return {
      connected: true,
      engine: 'PostgreSQL 16 (Cloud SQL)',
      database: process.env.SQL_DB_NAME || 'postgres',
      tables: {
        users: Number(userCount[0]?.count || 0),
        trade_orders: Number(tradeCount[0]?.count || 0),
        strategies: Number(strategyCount[0]?.count || 0),
        trading_settings: Number(settingsCount[0]?.count || 0),
        local_ai_configs: Number(aiConfigCount[0]?.count || 0),
        agent_logs: Number(logCount[0]?.count || 0),
      },
      lastCheck: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Database health check failed:', error);
    return {
      connected: false,
      error: error.message || 'Veritabanına bağlanılamadı',
      engine: 'PostgreSQL (Cloud SQL)',
      database: process.env.SQL_DB_NAME || 'postgres',
      tables: {
        users: 0,
        trade_orders: 0,
        strategies: 0,
        trading_settings: 0,
        local_ai_configs: 0,
        agent_logs: 0,
      },
      lastCheck: new Date().toISOString(),
    };
  }
}

export async function saveUserSettings(
  userUid: string, 
  email: string, 
  data: {
    mode: string;
    apiKey?: string;
    apiSecret?: string;
    testnetKey?: string;
    telegramToken?: string;
    telegramChatId?: string;
    maxDrawdownPct?: string;
    trailingStopDefault?: string;
  }
) {
  try {
    const user = await getOrCreateUser(userUid, email);
    
    // Check if settings exist for user
    const existing = await db.select().from(tradingSettings).where(eq(tradingSettings.userId, user.id));
    
    if (existing.length > 0) {
      await db.update(tradingSettings)
        .set({
          mode: data.mode,
          apiKey: data.apiKey ?? existing[0].apiKey,
          apiSecret: data.apiSecret ?? existing[0].apiSecret,
          testnetKey: data.testnetKey ?? existing[0].testnetKey,
          telegramToken: data.telegramToken ?? existing[0].telegramToken,
          telegramChatId: data.telegramChatId ?? existing[0].telegramChatId,
          maxDrawdownPct: data.maxDrawdownPct ?? existing[0].maxDrawdownPct,
          trailingStopDefault: data.trailingStopDefault ?? existing[0].trailingStopDefault,
          updatedAt: new Date(),
        })
        .where(eq(tradingSettings.id, existing[0].id));
    } else {
      await db.insert(tradingSettings).values({
        userId: user.id,
        mode: data.mode || 'PAPER',
        apiKey: data.apiKey || '',
        apiSecret: data.apiSecret || '',
        testnetKey: data.testnetKey || '',
        telegramToken: data.telegramToken || '',
        telegramChatId: data.telegramChatId || '',
        maxDrawdownPct: data.maxDrawdownPct || '10',
        trailingStopDefault: data.trailingStopDefault || '3.5',
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error('Failed to save settings to DB:', error);
    throw new Error('Ayarlar veritabanına kaydedilemedi.', { cause: error });
  }
}

export async function getUserSettings(userUid: string, email: string) {
  try {
    const user = await getOrCreateUser(userUid, email);
    const settings = await db.select().from(tradingSettings).where(eq(tradingSettings.userId, user.id));
    return settings[0] || null;
  } catch (error: any) {
    console.error('Failed to get settings from DB:', error);
    throw new Error('Ayarlar veritabanından alınamadı.', { cause: error });
  }
}

export async function syncTradesToDb(
  userUid: string, 
  email: string, 
  trades: Array<{
    symbol: string;
    side: string;
    type: string;
    amount: string | number;
    entryPrice: string | number;
    exitPrice?: string | number;
    pnl?: string | number;
    pnlPercent?: string | number;
    status: string;
    strategyName?: string;
    executedAt?: Date | string;
    closedAt?: Date | string;
  }>
) {
  try {
    const user = await getOrCreateUser(userUid, email);
    
    // Clear old trades or insert new ones
    if (trades.length > 0) {
      for (const t of trades) {
        await db.insert(tradeOrders).values({
          userId: user.id,
          symbol: t.symbol,
          side: t.side,
          type: t.type,
          amount: String(t.amount),
          entryPrice: String(t.entryPrice),
          exitPrice: t.exitPrice ? String(t.exitPrice) : null,
          pnl: t.pnl !== undefined ? String(t.pnl) : null,
          pnlPercent: t.pnlPercent !== undefined ? String(t.pnlPercent) : null,
          status: t.status,
          strategyName: t.strategyName || null,
          executedAt: t.executedAt ? new Date(t.executedAt) : new Date(),
          closedAt: t.closedAt ? new Date(t.closedAt) : null,
        });
      }
    }

    return { success: true, count: trades.length };
  } catch (error: any) {
    console.error('Failed to sync trades to DB:', error);
    throw new Error('İşlemler veritabanına aktarılamadı.', { cause: error });
  }
}

export async function getUserTradesFromDb(userUid: string, email: string) {
  try {
    const user = await getOrCreateUser(userUid, email);
    return await db.select()
      .from(tradeOrders)
      .where(eq(tradeOrders.userId, user.id))
      .orderBy(desc(tradeOrders.executedAt))
      .limit(100);
  } catch (error: any) {
    console.error('Failed to get trades from DB:', error);
    throw new Error('İşlemler veritabanından yüklenemedi.', { cause: error });
  }
}

export async function saveStrategiesToDb(
  userUid: string, 
  email: string, 
  strategiesList: Array<{
    id: string;
    name: string;
    symbol: string;
    timeframe: string;
    type: string;
    enabled: boolean;
    allocationPct: number;
    config: any;
  }>
) {
  try {
    const user = await getOrCreateUser(userUid, email);
    
    for (const s of strategiesList) {
      const existing = await db.select().from(strategies).where(eq(strategies.strategyId, s.id));
      if (existing.length > 0) {
        await db.update(strategies)
          .set({
            name: s.name,
            symbol: s.symbol,
            timeframe: s.timeframe,
            type: s.type,
            enabled: s.enabled,
            allocationPct: s.allocationPct,
            configJson: JSON.stringify(s.config),
            updatedAt: new Date(),
          })
          .where(eq(strategies.id, existing[0].id));
      } else {
        await db.insert(strategies).values({
          userId: user.id,
          strategyId: s.id,
          name: s.name,
          symbol: s.symbol,
          timeframe: s.timeframe,
          type: s.type,
          enabled: s.enabled,
          allocationPct: s.allocationPct,
          configJson: JSON.stringify(s.config),
        });
      }
    }

    return { success: true, count: strategiesList.length };
  } catch (error: any) {
    console.error('Failed to save strategies to DB:', error);
    throw new Error('Stratejiler veritabanına kaydedilemedi.', { cause: error });
  }
}

export async function getUserStrategiesFromDb(userUid: string, email: string) {
  try {
    const user = await getOrCreateUser(userUid, email);
    return await db.select()
      .from(strategies)
      .where(eq(strategies.userId, user.id))
      .orderBy(desc(strategies.updatedAt));
  } catch (error: any) {
    console.error('Failed to get strategies from DB:', error);
    throw new Error('Stratejiler veritabanından yüklenemedi.', { cause: error });
  }
}
