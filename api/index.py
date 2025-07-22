from fastapi import FastAPI, HTTPException
from trading_app import create_app

app = FastAPI()
trader = create_app()

@app.post("/buy")
def buy(symbol: str, quantity: int):
    try:
        trader.buy(symbol, quantity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"cash": trader.cash, "holdings": trader.holdings}

@app.post("/sell")
def sell(symbol: str, quantity: int):
    try:
        trader.sell(symbol, quantity)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"cash": trader.cash, "holdings": trader.holdings}

@app.post("/update")
def update():
    trader.update_daily_pnl()
    return {"status": "updated"}



@app.get("/portfolio")
def portfolio():
    """Return current cash and holdings."""
    return {"cash": trader.cash, "holdings": trader.holdings}
