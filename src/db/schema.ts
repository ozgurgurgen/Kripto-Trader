import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users Table (Integrated with Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Trading Settings & Exchange Keys Table
export const tradingSettings = pgTable('trading_settings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  mode: text('mode').notNull().default('PAPER'),
  apiKey: text('api_key'),
  apiSecret: text('api_secret'),
  testnetKey: text('testnet_key'),
  telegramToken: text('telegram_token'),
  telegramChatId: text('telegram_chat_id'),
  maxDrawdownPct: text('max_drawdown_pct').default('10'),
  trailingStopDefault: text('trailing_stop_default').default('3.5'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Quantitative Strategies Table
export const strategies = pgTable('strategies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  strategyId: text('strategy_id').notNull(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  timeframe: text('timeframe').notNull().default('15m'),
  type: text('type').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  allocationPct: integer('allocation_pct').notNull().default(20),
  configJson: text('config_json').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 4. Trade Execution Logs & Positions Table
export const tradeOrders = pgTable('trade_orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  symbol: text('symbol').notNull(),
  side: text('side').notNull(), // BUY / SELL / LONG / SHORT
  type: text('type').notNull(), // MARKET / LIMIT / STOP_LOSS / TAKE_PROFIT
  amount: text('amount').notNull(),
  entryPrice: text('entry_price').notNull(),
  exitPrice: text('exit_price'),
  pnl: text('pnl'),
  pnlPercent: text('pnl_percent'),
  status: text('status').notNull(), // OPEN / CLOSED / CANCELLED
  strategyName: text('strategy_name'),
  executedAt: timestamp('executed_at').defaultNow(),
  closedAt: timestamp('closed_at'),
});

// 5. Local AI Providers & Agent Settings Table
export const localAiConfigs = pgTable('local_ai_configs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  providerId: text('provider_id').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // ollama / hermes_agent / aponclaw_agent / lm_studio
  endpointUrl: text('endpoint_url').notNull(),
  selectedModel: text('selected_model'),
  temperature: text('temperature').default('0.7'),
  enabled: boolean('enabled').notNull().default(true),
  systemPrompt: text('system_prompt'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 6. Autonomous Agent Execution Logs Table
export const agentLogs = pgTable('agent_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  agentName: text('agent_name').notNull(),
  action: text('action').notNull(),
  symbol: text('symbol'),
  details: text('details'),
  status: text('status').default('SUCCESS'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  settings: one(tradingSettings, {
    fields: [users.id],
    references: [tradingSettings.userId],
  }),
  strategies: many(strategies),
  tradeOrders: many(tradeOrders),
  localAiConfigs: many(localAiConfigs),
  agentLogs: many(agentLogs),
}));

export const tradingSettingsRelations = relations(tradingSettings, ({ one }) => ({
  user: one(users, {
    fields: [tradingSettings.userId],
    references: [users.id],
  }),
}));

export const strategiesRelations = relations(strategies, ({ one }) => ({
  user: one(users, {
    fields: [strategies.userId],
    references: [users.id],
  }),
}));

export const tradeOrdersRelations = relations(tradeOrders, ({ one }) => ({
  user: one(users, {
    fields: [tradeOrders.userId],
    references: [users.id],
  }),
}));

export const localAiConfigsRelations = relations(localAiConfigs, ({ one }) => ({
  user: one(users, {
    fields: [localAiConfigs.userId],
    references: [users.id],
  }),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  user: one(users, {
    fields: [agentLogs.userId],
    references: [users.id],
  }),
}));
