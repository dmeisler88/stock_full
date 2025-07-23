import { createApp } from '../../lib/createApp.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  
  try {
    console.log('🔍 DEBUG: Starting debug check...')
    
    const app = await createApp()
    
    // Check current state
    const summary = await app.portfolioSummary()
    
    // Check database tables
    const holdingsCheck = await app.supabase
      .from('holdings')
      .select('*')
      .execute()
    
    const pricesCheck = await app.supabase
      .from('daily_prices')
      .select('symbol, close_price')
      .order('date', { ascending: false })
      .limit(10)
      .execute()
    
    const pnlCheck = await app.supabase
      .from('pnl')
      .select('*')
      .order('date', { ascending: false })
      .limit(5)
      .execute()

    const debugInfo = {
      app_state: {
        cash: app.cash,
        holdings: app.holdings,
        portfolio_summary: summary
      },
      database_state: {
        holdings_table: holdingsCheck.data,
        recent_prices: pricesCheck.data,
        recent_pnl: pnlCheck.data
      },
      environment: {
        has_supabase_url: !!process.env.SUPABASE_URL,
        has_supabase_key: !!process.env.SUPABASE_KEY,
        supabase_url_prefix: process.env.SUPABASE_URL?.substring(0, 30) + '...'
      }
    }

    console.log('🔍 DEBUG INFO:', JSON.stringify(debugInfo, null, 2))
    
    res.status(200).json({
      success: true,
      debug: debugInfo,
      message: 'Check Vercel function logs for detailed output'
    })
    
  } catch (error) {
    console.error('❌ DEBUG ERROR:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
