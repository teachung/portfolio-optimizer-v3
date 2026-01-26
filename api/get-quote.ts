// Vercel Serverless Function - 股票報價代理
// 解決 CORS 問題，直接從服務器端獲取報價

import { VercelRequest, VercelResponse } from '@vercel/node';

interface QuoteResult {
  price: number;
  change: number;
  changePercent: number;
  time: string;
  currency: string;
  source: string;
  error?: boolean;
}

// 數據源 1: Yahoo Finance
async function fetchFromYahoo(symbol: string): Promise<QuoteResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) return null;

    const data = await res.json() as any;
    const meta = data.chart?.result?.[0]?.meta;

    if (meta && meta.regularMarketPrice) {
      return {
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.chartPreviousClose,
        changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
        time: new Date(meta.regularMarketTime * 1000).toISOString(),
        currency: meta.currency || 'USD',
        source: 'Yahoo'
      };
    }
    return null;
  } catch (e) {
    console.error(`Yahoo error for ${symbol}:`, e);
    return null;
  }
}

// 數據源 2: Finnhub (使用環境變量中的 API key，或 demo)
async function fetchFromFinnhub(symbol: string): Promise<QuoteResult | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || 'demo';
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json() as any;

    if (data && data.c && data.c > 0) {
      return {
        price: data.c,
        change: data.d || 0,
        changePercent: data.dp || 0,
        time: new Date().toISOString(),
        currency: 'USD',
        source: 'Finnhub'
      };
    }
    return null;
  } catch (e) {
    console.error(`Finnhub error for ${symbol}:`, e);
    return null;
  }
}

// 數據源 3: Alpha Vantage
async function fetchFromAlphaVantage(symbol: string): Promise<QuoteResult | null> {
  try {
    const apiKey = process.env.ALPHAVANTAGE_API_KEY || 'demo';
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json() as any;
    const quote = data['Global Quote'];

    if (quote && quote['05. price']) {
      const price = parseFloat(quote['05. price']);
      const change = parseFloat(quote['09. change'] || 0);
      const changePercent = parseFloat((quote['10. change percent'] || '0').replace('%', ''));

      return {
        price,
        change,
        changePercent,
        time: new Date().toISOString(),
        currency: 'USD',
        source: 'AlphaVantage'
      };
    }
    return null;
  } catch (e) {
    console.error(`AlphaVantage error for ${symbol}:`, e);
    return null;
  }
}

// 數據源 4: IEX Cloud (免費版)
async function fetchFromIEX(symbol: string): Promise<QuoteResult | null> {
  try {
    // IEX Cloud sandbox/test endpoint
    const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=pk_test`;
    const res = await fetch(url);

    if (!res.ok) return null;

    const data = await res.json() as any;

    if (data && data.latestPrice) {
      return {
        price: data.latestPrice,
        change: data.change || 0,
        changePercent: data.changePercent ? data.changePercent * 100 : 0,
        time: new Date().toISOString(),
        currency: 'USD',
        source: 'IEX'
      };
    }
    return null;
  } catch (e) {
    console.error(`IEX error for ${symbol}:`, e);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = (req.query.symbol as string || '').toUpperCase().replace(/\./g, '-');

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  // 嘗試多個數據源
  const sources = [
    fetchFromYahoo,
    fetchFromFinnhub,
    fetchFromAlphaVantage,
    fetchFromIEX
  ];

  for (const fetchFn of sources) {
    try {
      const result = await fetchFn(symbol);
      if (result && result.price > 0) {
        return res.status(200).json(result);
      }
    } catch (e) {
      console.error(`Source failed for ${symbol}:`, e);
    }
  }

  // 所有數據源都失敗
  return res.status(200).json({
    price: 0,
    change: 0,
    changePercent: 0,
    time: new Date().toISOString(),
    currency: 'USD',
    source: 'None',
    error: true
  });
}
