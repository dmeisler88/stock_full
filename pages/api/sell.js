import { createApp } from '../../lib/createApp.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { symbol, quantity } = req.query
  const app = await createApp()
  try {
    const summary = await app.sell(symbol, parseInt(quantity))
    res.status(200).json(summary)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
