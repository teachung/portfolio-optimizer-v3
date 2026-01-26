// Vercel Serverless Function - 股票報價代理
// 解決 CORS 問題，直接從服務器端獲取報價
// 使用更可靠的數據源和更好的錯誤處理

import { VercelRequest, VercelResponse } from '@vercel/node';

interface QuoteResult {
  price: number;
  change: number;
  changePercent: number;
  time: string;
  currency: string;
  source: string;
  error?: boolean;
  debug?: string;
}

// 數據源 1: Yahoo Finance (使用不同的 endpoint)
async function fetchFromYahoo(symbol: string): Promise<QuoteResult | null> {
  try {
    // 使用 v7 endpoint，更穩定
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Yahoo v7 returned ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json() as any;
    const quote = data.quoteResponse?.result?.[0];

    if (quote && quote.regularMarketPrice) {
      return {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
        time: new Date(quote.regularMarketTime * 1000).toISOString(),
        currency: quote.currency || 'USD',
        source: 'Yahoo'
      };
    }
    return null;
  } catch (e: any) {
    console.error(`Yahoo error for ${symbol}:`, e.message);
    return null;
  }
}

// 數據源 2: Yahoo Finance Chart API (備用)
async function fetchFromYahooChart(symbol: string): Promise<QuoteResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Yahoo Chart returned ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json() as any;
    const meta = data.chart?.result?.[0]?.meta;

    if (meta && meta.regularMarketPrice) {
      return {
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - (meta.chartPreviousClose || meta.previousClose || meta.regularMarketPrice),
        changePercent: meta.chartPreviousClose ?
          ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100 : 0,
        time: new Date(meta.regularMarketTime * 1000).toISOString(),
        currency: meta.currency || 'USD',
        source: 'YahooChart'
      };
    }
    return null;
  } catch (e: any) {
    console.error(`Yahoo Chart error for ${symbol}:`, e.message);
    return null;
  }
}

// 數據源 3: Finnhub
async function fetchFromFinnhub(symbol: string): Promise<QuoteResult | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY || 'demo';
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`Finnhub returned ${res.status} for ${symbol}`);
      return null;
    }

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
  } catch (e: any) {
    console.error(`Finnhub error for ${symbol}:`, e.message);
    return null;
  }
}

// 數據源 4: Financial Modeling Prep (免費 API)
async function fetchFromFMP(symbol: string): Promise<QuoteResult | null> {
  try {
    // FMP 免費 tier
    const url = `https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=demo`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`FMP returned ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json() as any;

    if (Array.isArray(data) && data[0] && data[0].price) {
      return {
        price: data[0].price,
        change: 0,
        changePercent: 0,
        time: new Date().toISOString(),
        currency: 'USD',
        source: 'FMP'
      };
    }
    return null;
  } catch (e: any) {
    console.error(`FMP error for ${symbol}:`, e.message);
    return null;
  }
}

// 數據源 5: Twelve Data (免費版)
async function fetchFromTwelveData(symbol: string): Promise<QuoteResult | null> {
  try {
    const apiKey = process.env.TWELVEDATA_API_KEY || 'demo';
    const url = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`TwelveData returned ${res.status} for ${symbol}`);
      return null;
    }

    const data = await res.json() as any;

    if (data && data.price) {
      return {
        price: parseFloat(data.price),
        change: 0,
        changePercent: 0,
        time: new Date().toISOString(),
        currency: 'USD',
        source: 'TwelveData'
      };
    }
    return null;
  } catch (e: any) {
    console.error(`TwelveData error for ${symbol}:`, e.message);
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

  const rawSymbol = req.query.symbol as string || '';
  const symbol = rawSymbol.toUpperCase().replace(/\./g, '-');

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  console.log(`[get-quote] Fetching quote for: ${symbol}`);

  // 嘗試多個數據源（按可靠性排序）
  const sources = [
    { name: 'Yahoo', fn: fetchFromYahoo },
    { name: 'YahooChart', fn: fetchFromYahooChart },
    { name: 'Finnhub', fn: fetchFromFinnhub },
    { name: 'FMP', fn: fetchFromFMP },
    { name: 'TwelveData', fn: fetchFromTwelveData },
  ];

  const errors: string[] = [];

  for (const { name, fn } of sources) {
    try {
      console.log(`[get-quote] Trying ${name} for ${symbol}...`);
      const result = await fn(symbol);
      if (result && result.price > 0) {
        console.log(`[get-quote] Success from ${name}: $${result.price}`);
        return res.status(200).json(result);
      }
      errors.push(`${name}: no data`);
    } catch (e: any) {
      const errMsg = `${name}: ${e.message || 'unknown error'}`;
      errors.push(errMsg);
      console.error(`[get-quote] ${errMsg}`);
    }
  }

  // 所有數據源都失敗 - 返回詳細錯誤信息
  console.log(`[get-quote] All sources failed for ${symbol}:`, errors.join(', '));

  return res.status(200).json({
    price: 0,
    change: 0,
    changePercent: 0,
    time: new Date().toISOString(),
    currency: 'USD',
    source: 'None',
    error: true,
    debug: `All sources failed: ${errors.join('; ')}`
  });
}
