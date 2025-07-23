import { createClient } from '@supabase/supabase-js'

export class TradingApp {
  constructor(url, key, startingCash = 1_000_000) {
    this.supabase = createClient(url, key)
    this.cash = startingCash
    this.holdings = {} // symbol -> { quantity, avg_price }
  }

  async loadHoldings() {
    const { data, error } = await this.supabase
      .from('holdings')
      .select('symbol, quantity, avg_price')

    if (error) throw new Error(`Failed to load holdings: ${error.message}`)

    this.holdings = {}
    for (const row of data) {
      this.holdings[row.symbol] = {
        quantity: row.quantity,
        avg_price: row.avg_price,
      }
    }
  }

  async saveHolding(symbol) {
    const pos = this.holdings[symbol]
    if (!pos) {
      await this.supabase.from('holdings').delete().eq('symbol', symbol)
      return
    }
    await this.supabase.from('holdings').upsert(
      { symbol, quantity: pos.quantity, avg_price: pos.avg_price },
      { onConflict: ['symbol'] }
    )
  }

  async getLatestPrice(symbol) {
    const { data, error } = await this.supabase
      .from('daily_prices')
      .select('close_price')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) throw new Error(`No price data for ${symbol}`)
    return parseFloat(data.close_price)
  }

  async buy(symbol, quantity) {
    if (!this.holdings[symbol] && Object.keys(this.holdings).length >= 10) {
      throw new Error("Maximum number of holdings reached")
    }
    const price = await this.getLatestPrice(symbol)
    const cost = price * quantity
    if (cost > this.cash) throw new Error("Insufficient cash")

    this.cash -= cost
    const prev = this.holdings[symbol] || { quantity: 0, avg_price: 0 }
    const newQty = prev.quantity + quantity
    const newAvg = (prev.quantity * prev.avg_price + cost) / newQty

    this.holdings[symbol] = { quantity: newQty, avg_price: newAvg }
    await this.saveHolding(symbol)
    return this.updateDailyPnl()
  }

  async sell(symbol, quantity) {
    const pos = this.holdings[symbol]
    if (!pos || pos.quantity < quantity) throw new Error("Not enough shares to sell")

    const price = await this.getLatestPrice(symbol)
    const proceeds = price * quantity
    this.cash += proceeds

    const remaining = pos.quantity - quantity
    if (remaining === 0) {
      delete this.holdings[symbol]
    } else {
      this.holdings[symbol] = { quantity: remaining, avg_price: pos.avg_price }
    }

    await this.saveHolding(symbol)
    return this.updateDailyPnl()
  }

  async computeUnrealizedPnl() {
    let pnl = 0
    for (const [symbol, pos] of Object.entries(this.holdings)) {
      const price = await this.getLatestPrice(symbol)
      pnl += (price - pos.avg_price) * pos.quantity
    }
    return pnl
  }

  async portfolioSummary() {
    const pnl = await this.computeUnrealizedPnl()
    return {
      cash: this.cash,
      holdings: this.holdings,
      unrealized_pnl: pnl,
      total: this.cash + pnl,
    }
  }

  async updateDailyPnl() {
    const summary = await this.portfolioSummary()
    const today = new Date().toISOString().split("T")[0]

    await this.supabase.from('pnl').upsert(
      {
        date: today,
        cash: summary.cash,
        unrealized_pnl: summary.unrealized_pnl,
        total: summary.total,
      },
      { onConflict: ['date'] }
    )

    return summary
  }
}
