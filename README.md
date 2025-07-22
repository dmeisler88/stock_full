# Stock Trading App

This repository contains a simple trading application that uses [Supabase](https://supabase.com/) to fetch daily prices and store portfolio P&L information.

## Requirements
- Python 3.12
- `supabase` Python client (`pip install supabase`)

Environment variables `SUPABASE_URL` and `SUPABASE_KEY` must be set with your Supabase credentials.

## Usage
1. Install dependencies:
   ```bash
   pip install supabase
   ```
2. Set the `SUPABASE_URL` and `SUPABASE_KEY` environment variables.
3. Run the script:
   ```bash
   python trading_app.py
   ```
   Edit the example usage at the bottom of `trading_app.py` to place orders.

The script updates a `p&l` table once a day with your cash balance, unrealized profit and loss, and total portfolio value.
