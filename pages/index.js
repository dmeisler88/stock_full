import { useEffect, useState } from 'react'

export default function Home() {
  const [portfolio, setPortfolio] = useState({
    cash: 0,
    holdings: {},
    unrealized_pnl: 0,
    total: 0
  })

  const fetchPortfolio = async () => {
    try {
      const res = await fetch('/api/portfolio')
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error)
    }
  }

  const handleBuy = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const symbol = formData.get('symbol')
    const quantity = formData.get('quantity')
    
    try {
      const res = await fetch(`/api/buy?symbol=${encodeURIComponent(symbol)}&quantity=${quantity}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
        e.target.reset()
      } else {
        const error = await res.json()
        alert(`Buy failed: ${error.error}`)
      }
    } catch (error) {
      alert(`Buy error: ${error.message}`)
    }
  }

  const handleSell = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const symbol = formData.get('symbol')
    const quantity = formData.get('quantity')
    
    try {
      const res = await fetch(`/api/sell?symbol=${encodeURIComponent(symbol)}&quantity=${quantity}`, {
        method: 'POST'
      })
      if (res.ok) {
        const data = await res.json()
        setPortfolio(data)
        e.target.reset()
      } else {
        const error = await res.json()
        alert(`Sell failed: ${error.error}`)
      }
    } catch (error) {
      alert(`Sell error: ${error.message}`)
    }
  }

  useEffect(() => {
    fetchPortfolio()
  }, [])

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: 'auto', padding: '2rem' }}>
      <h1>Trading App</h1>
      
      <form onSubmit={handleBuy} style={{ marginBottom: '1rem' }}>
        <h2>Buy</h2>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Symbol 
          <input 
            type="text" 
            name="symbol" 
            required 
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Quantity 
          <input 
            type="number" 
            name="quantity" 
            required 
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
        </label>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Buy</button>
      </form>

      <form onSubmit={handleSell} style={{ marginBottom: '1rem' }}>
        <h2>Sell</h2>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Symbol 
          <input 
            type="text" 
            name="symbol" 
            required 
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: '0.25rem' }}>
          Quantity 
          <input 
            type="number" 
            name="quantity" 
            required 
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
          />
        </label>
        <button type="submit" style={{ padding: '0.5rem 1rem' }}>Sell</button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h2>Portfolio</h2>
        <p>Cash: ${portfolio.cash.toFixed(2)}</p>
        <p>Unrealized P&L: ${portfolio.unrealized_pnl.toFixed(2)}</p>
        <p>Total: ${portfolio.total.toFixed(2)}</p>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Symbol</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Quantity</th>
              <th style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'left' }}>Avg Price</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(portfolio.holdings).map(([symbol, info]) => (
              <tr key={symbol}>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{symbol}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>{info.quantity}</td>
                <td style={{ border: '1px solid #ccc', padding: '0.5rem' }}>${info.avg_price.toFixed(2)}</td>
              </tr>
            ))}
            {Object.keys(portfolio.holdings).length === 0 && (
              <tr>
                <td colSpan="3" style={{ border: '1px solid #ccc', padding: '0.5rem', textAlign: 'center' }}>
                  No holdings
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}