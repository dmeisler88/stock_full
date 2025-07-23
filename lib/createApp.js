import { TradingApp } from './tradingApp'

export function createApp() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return new TradingApp(url, key)
}
