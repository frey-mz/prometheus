# Yahoo Finance Chart API

Returns a symbol’s price history as OHLCV bars: open, high, low, close, and volume.

```http
GET https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
```

## Calling the API

Request one day of TSLA history in 15-minute bars:

```bash
curl --get \
  'https://query1.finance.yahoo.com/v8/finance/chart/TSLA' \
  --data-urlencode 'interval=15m' \
  --data-urlencode 'range=1d' \
  -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
```

Keep the URL and header values on single lines within their quotes.

| Parameter | Location | Description |
|---|---|---|
| `symbol` | Path | Yahoo ticker, such as `TSLA` or `AAPL`. URL-encode special characters. |
| `interval` | Query | Bar duration. Common values: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1h`, `1d`, `5d`, `1wk`, `1mo`, `3mo`. |
| `range` | Query | History window. Common values: `1d`, `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y`, `10y`, `ytd`, `max`. |
| `period1`, `period2` | Query | Start and end as Unix timestamps **in seconds**, used instead of `range`. The end is exclusive. |
| `includePrePost` | Query | Set to `true` to include available premarket and after-hours bars. |
| `events` | Query | Optional corporate actions, for example `div,splits`. |

Intraday history has tighter limits than daily history; some interval/range combinations are rejected. These parameters are used by the [yfinance chart client](https://github.com/ranaroussi/yfinance/blob/main/yfinance/scrapers/history.py).

## Successful response

Values below are illustrative, and metadata is abbreviated:

```json
{
  "chart": {
    "result": [
      {
        "meta": {
          "symbol": "TSLA",
          "currency": "USD",
          "exchangeName": "NMS",
          "instrumentType": "EQUITY",
          "exchangeTimezoneName": "America/New_York",
          "regularMarketPrice": 250.5,
          "regularMarketTime": 1732113900,
          "dataGranularity": "15m",
          "range": "1d"
        },
        "timestamp": [1732113000, 1732113900],
        "indicators": {
          "quote": [
            {
              "open": [249.5, 250.0],
              "high": [250.25, 251.0],
              "low": [249.0, 249.75],
              "close": [250.0, 250.5],
              "volume": [1200000, 950000]
            }
          ]
        }
      }
    ],
    "error": null
  }
}
```

The arrays are **positionally aligned**: `timestamp[i]` and each price/volume array’s element `i` describe the same bar. Timestamps are Unix seconds. Price or volume entries can be `null`; preserve their positions when parsing.

Depending on the request, the result may also include `indicators.adjclose` and an `events` object containing dividends or splits. See the [yfinance response parser](https://github.com/ranaroussi/yfinance/blob/main/yfinance/utils.py).

| JSON path | Meaning |
|---|---|
| `chart.result[0].meta` | Symbol, currency, exchange, timezone, and market metadata |
| `chart.result[0].timestamp` | Bar timestamps |
| `chart.result[0].indicators.quote[0]` | Parallel OHLCV arrays |
| `chart.error` | `null` on success; error details on failure |

## Errors

An API error commonly uses this envelope:

```json
{
  "chart": {
    "result": null,
    "error": {
      "code": "Not Found",
      "description": "No data found, symbol may be delisted"
    }
  }
}
```

Check both the HTTP status and `chart.error` before accessing `result[0]`. Yahoo can also return non-JSON responses when blocking or rate-limiting requests.

## Verification

A live response could not be retrieved from the documentation environment. The examples are illustrative; the structure was checked against the client sources linked above.
