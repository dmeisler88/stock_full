# Stock Trading App

This repository contains a simple trading application that uses [Supabase](https://supabase.com/) to fetch daily prices and store portfolio P&L information.
It includes both a Python script and a small JavaScript API that can run on Vercel.

## Requirements
- Python 3.12 (if using the Python script)
- Node.js 18+ (for the Vercel API)
- `supabase` Python client (`pip install supabase`)
- `fastapi` and `uvicorn` for the Python API
- `@supabase/supabase-js` for the JavaScript API

Environment variables `SUPABASE_URL` and `SUPABASE_KEY` must be set with your Supabase credentials.

## Usage
1. Install dependencies:
   ```bash
   # Python dependencies
   pip install -r requirements.txt
   
   # JavaScript dependencies
   npm install
   ```
2. Set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables.
3. Run the script locally:
   ```bash
   python trading_app.py
   ```
   Edit the example usage at the bottom of `trading_app.py` to place orders.



## Deploying to Vercel

The JavaScript API under `pages/api` is designed for Vercel. Push this repository and Vercel will deploy those routes automatically. Ensure the environment variables `SUPABASE_URL` and `SUPABASE_KEY` are configured in the Vercel dashboard.

The API expects a table named `holdings` in Supabase where it stores the latest quantity and average price for each symbol after every trade.
