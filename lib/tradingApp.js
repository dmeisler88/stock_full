import { createClient } from '@supabase/supabase-js'

export class TradingApp {
  constructor(url, key, startingCash = 1_000_000) {
    this.supabase = createClient(url, key)
    this.cash = startingCash
    this.holdings = {} // symbol -> { quantity, avg_price }
    console.log(`🏁 TradingApp initialized with starting cash: $${startingCash}`)
  }

  async loadHoldings() {
    console.log('📥 Loading holdings from database...')
    
    // Load holdings from database
    const { data: holdingsData, error: holdingsError } = await this.supabase
      .from('holdings')
      .select('symbol, quantity, avg_price')

    if (holdingsError) {
      console.error('❌ Error loading holdings:', holdingsError)
      throw new Error(`Failed to load holdings: ${holdingsError.message}`)
    }

    this.holdings = {}
    for (const row of holdingsData) {
      this.holdings[row.symbol] = {
        quantity: row.quantity,
        avg_price: row.avg_price,
      }
    }
    console.log(`📊 Loaded ${Object.keys(this.holdings).length} holdings:`, this.holdings)

    // Load cash from the most recent P&L record
    console.log('💰 Loading cash from database...')
    const { data: pnlData, error: pnlError } = await this.supabase
      .from('pnl')
      .select('cash')
      .order('date', { ascending: false })
      .limit(1)

    if (pnlError) {
      console.warn('⚠️ Error loading P&L data:', pnlError.message)
      console.log(`💵 Using starting cash: $${this.cash}`)
    } else if (pnlData && pnlData.length > 0) {
      this.cash = pnlData[0].cash
      console.log(`💵 Loaded cash from database: $${this.cash}`)
    } else {
      console.log(`💵 No P&L data found, using starting cash: $${this.cash}`)
    }
  }

  async saveHolding(symbol) {
    console.log(`💾 Saving holding for ${symbol}...`)
    const pos = this.holdings[symbol]
    if (!pos) {
      const { error } = await this.supabase.from('holdings').delete().eq('symbol', symbol)
      if (error) console.error('❌ Error deleting holding:', error)
      return
    }
    
    const { error } = await this.supabase.from('holdings').upsert(
      { symbol, quantity: pos.quantity, avg_price: pos.avg_price },
      { onConflict: 'symbol' }
    )
    
    if (error) {
      console.error('❌ Error saving holding:', error)
      throw new Error(`Failed to save holding: ${error.message}`)
    }
    console.log(`✅ Saved holding: ${symbol}`)
  }

  async getLatestPrice(symbol) {
    console.log(`💰 Getting latest price for ${symbol}...`)
    const { data, error } = await this.supabase
      .from('daily_prices')
      .select('close_price')
      .eq('symbol', symbol)
      .order('date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error(`❌ Error getting price for ${symbol}:`, error)
      throw new Error(`No price data for ${symbol}: ${error.message}`)
    }
    if (!data) {
      console.error(`❌ No price data found for ${symbol}`)
      throw new Error(`No price data for ${symbol}`)
    }
    
    const price = parseFloat(data.close_price)
    console.log(`📈 Latest price for ${symbol}: $${price}`)
    return price
  }

  async buy(symbol, quantity) {
    console.log(`\n🛒 BUY ORDER: ${quantity} shares of ${symbol}`)
    console.log(`💰 Current cash: $${this.cash}`)
    console.log(`📊 Current holdings:`, this.holdings)

    if (!this.holdings[symbol] && Object.keys(this.holdings).length >= 10) {
      throw new Error("Maximum number of holdings reached")
    }
    
    const price = await this.getLatestPrice(symbol)
    const cost = price * quantity
    
    console.log(`💵 Cost: ${quantity} × $${price} = $${cost}`)
    
    if (cost > this.cash) {
      throw new Error(`Insufficient cash. Need $${cost}, have $${this.cash}`)
    }

    this.cash -= cost
    const prev = this.holdings[symbol] || { quantity: 0, avg_price: 0 }
    const newQty = prev.quantity + quantity
    const newAvg = (prev.quantity * prev.avg_price + cost) / newQty

    this.holdings[symbol] = { quantity: newQty, avg_price: newAvg }
    
    console.log(`💰 New cash: $${this.cash}`)
    console.log(`📊 New position:`, this.holdings[symbol])
    
    await this.saveHolding(symbol)
    const result = await this.updateDailyPnl()
    console.log(`✅ Buy complete!`)
    return result
  }

  async sell(symbol, quantity) {
    console.log(`\n💸 SELL ORDER: ${quantity} shares of ${symbol}`)
    
    const pos = this.holdings[symbol]
    if (!pos || pos.quantity < quantity) {
      throw new Error(`Not enough shares to sell. Have ${pos?.quantity || 0}, trying to sell ${quantity}`)
    }

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

    console.log('📈 Saving P&L summary:', summary)

    const { error } = await this.supabase.from('pnl').upsert(
      {
        date: today,
        cash: summary.cash,
        unrealized_pnl: summary.unrealized_pnl,
        total: summary.total,
      },
      { onConflict: 'date' }
    )

    if (error) {
      console.error('❌ Error saving P&L:', error)
      throw new Error(`Failed to save P&L: ${error.message}`)
    }

    return summary
  }
}
