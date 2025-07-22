# Stock Trading App

This repository contains a simple trading application that uses [Supabase](https://supabase.com/) to fetch daily prices and store portfolio P&L information.

## Requirements
- Python 3.12
- `supabase` Python client (`pip install supabase`)
- `fastapi` and `uvicorn` for the Vercel API

Environment variables `SUPABASE_URL` and `SUPABASE_KEY` must be set with your Supabase credentials.

## Usage
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables.
3. Run the script locally:
   ```bash
   python trading_app.py
   ```
   Edit the example usage at the bottom of `trading_app.py` to place orders.

The script updates a `p&l` table once a day with your cash balance, unrealized profit and loss, and total portfolio value.

### Creating the P&L table

Use the Supabase CLI to create a table for daily performance metrics:

```bash
supabase db query <<'SQL'
CREATE TABLE "p&l" (
  username text,
  date date PRIMARY KEY,
  unrealized_pnl numeric,
  cash numeric,
  total numeric
);
SQL
```

### Frontend

`index.html` provides a simple interface to buy or sell shares. The page uses the FastAPI endpoints under `/api` and displays your cash and holdings after each trade.

## Deploying to Vercel

Create a Vercel project and push this repository. Vercel detects the `api/index.py` function and deploys it as a serverless API. Ensure your Supabase credentials are set as environment variables in the Vercel dashboard.
