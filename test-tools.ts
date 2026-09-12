import { Type, Schema } from "@google/genai";

export const runBacktestSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
    entry_rules: { type: Type.STRING },
    exit_rules: { type: Type.STRING },
    params: {
      type: Type.OBJECT,
      properties: {
        rsiPeriod: { type: Type.INTEGER },
        oversoldThreshold: { type: Type.INTEGER },
        overboughtThreshold: { type: Type.INTEGER },
        stopLossPct: { type: Type.NUMBER },
        takeProfitPct: { type: Type.NUMBER },
        trailingStopPct: { type: Type.NUMBER }
      }
    }
  }
};
