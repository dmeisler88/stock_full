import os
from datetime import date
from typing import Dict

from supabase import create_client, Client


class TradingApp:
    def __init__(self, url: str, key: str, starting_cash: float = 1_000_000):
        self.supabase: Client = create_client(url, key)
        self.cash: float = starting_cash
        self.holdings: Dict[str, Dict[str, float]] = {}

    def _get_latest_price(self, symbol: str) -> float:
        response = (
            self.supabase.table("daily_prices")

            .select("close_price")

            .eq("symbol", symbol)
            .order("date", desc=True)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise ValueError(f"No price data for symbol {symbol}")

        return float(response.data[0]["close_price"])


    def buy(self, symbol: str, quantity: int) -> None:
        if symbol not in self.holdings and len(self.holdings) >= 10:
            raise ValueError("Maximum number of holdings reached")
        price = self._get_latest_price(symbol)
        cost = price * quantity
        if cost > self.cash:
            raise ValueError("Insufficient cash")
        self.cash -= cost
        position = self.holdings.get(symbol, {"quantity": 0, "avg_price": 0.0})
        new_quantity = position["quantity"] + quantity
        new_avg_price = (
            position["quantity"] * position["avg_price"] + cost
        ) / new_quantity
        self.holdings[symbol] = {"quantity": new_quantity, "avg_price": new_avg_price}

    def sell(self, symbol: str, quantity: int) -> None:
        if symbol not in self.holdings or self.holdings[symbol]["quantity"] < quantity:
            raise ValueError("Not enough shares to sell")
        price = self._get_latest_price(symbol)
        proceeds = price * quantity
        self.cash += proceeds
        position = self.holdings[symbol]
        position["quantity"] -= quantity
        if position["quantity"] == 0:
            del self.holdings[symbol]
        else:
            self.holdings[symbol] = position

    def _compute_unrealized_pnl(self) -> float:
        pnl = 0.0
        for symbol, position in self.holdings.items():
            price = self._get_latest_price(symbol)
            pnl += (price - position["avg_price"]) * position["quantity"]
        return pnl

    def update_daily_pnl(self) -> None:
        pnl = self._compute_unrealized_pnl()
        total = self.cash + pnl
        self.supabase.table("p&l").upsert(
            {
                "date": date.today().isoformat(),
                "cash": self.cash,
                "unrealized_pnl": pnl,
                "total": total,
            },
            on_conflict="date",
        ).execute()


def create_app() -> TradingApp:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not url or not key:
        raise EnvironmentError("SUPABASE_URL and SUPABASE_KEY must be set")
    return TradingApp(url, key)


if __name__ == "__main__":
    app = create_app()
    # Example usage
    # app.buy("AAPL", 10)
    # app.sell("AAPL", 5)
    app.update_daily_pnl()
