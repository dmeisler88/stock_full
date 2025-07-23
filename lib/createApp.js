import { TradingApp } from './tradingApp'

export async function createApp() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY
  if (!url || !key) throw new Error('Missing Supabase credentials')

  const app = new TradingApp(url, key)
  await app.loadHoldings()
  return app
}
