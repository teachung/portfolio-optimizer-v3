
import { StockData, StockMetrics, Metrics, PriorityStockConfig, HedgeConfig, MonthlyReturn } from '../types';

// Exporting calculateMA to allow safe injection into Worker
export function calculateMA(data: (number|null)[], period: number): (number|null)[] {
    if (period <= 1) return data;
    const result: (number|null)[] = Array(data.length).fill(null);
    for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = 0; j < period; j++) {
            const val = data[i - j];
            if (val !== null) {
                sum += val;
                count++;
            }
        }
        if (count > 0) {
            result[i] = sum / count;
        }
    }
    return result;
}

export function sliceStockData(stockData: StockData, startDate: string, endDate: string): StockData {
    // Find closest indices
    let startIndex = -1;
    let endIndex = -1;

    // Simple search assuming sorted dates (standard for stock data)
    for(let i=0; i<stockData.dates.length; i++) {
        if (stockData.dates[i] >= startDate) {
            startIndex = i;
            break;
        }
    }
    
    for(let i=stockData.dates.length - 1; i >= 0; i--) {
        if (stockData.dates[i] <= endDate) {
            endIndex = i;
            break;
        }
    }

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return stockData; // Fallback or handle error upstream
    }

    const newDates = stockData.dates.slice(startIndex, endIndex + 1);
    const newPriceData: Record<string, (number | null)[]> = {};
    
    stockData.tickers.forEach(t => {
        // Must slice the array to match newDates length
        if (stockData.priceData[t]) {
             newPriceData[t] = stockData.priceData[t].slice(startIndex, endIndex + 1);
        } else {
             newPriceData[t] = [];
        }
    });

    return {
        tickers: stockData.tickers,
        dates: newDates,
        priceData: newPriceData
    };
}

export function calculateCorrelationMatrix(stockData: StockData, tickers: string[]): number[][] {
    const n = tickers.length;
    // Safety Break: O(N^2) complexity with N > 500 will freeze most browsers
    if (n > 500) {
        return Array(n).fill(Array(n).fill(0));
    }

    const matrix: number[][] = [];
    const returnsData: number[][] = [];

    // Calculate daily returns for all tickers first
    tickers.forEach(ticker => {
        const prices = stockData.priceData[ticker];
        const returns: number[] = [];
        // Safety check: if ticker doesn't exist in data, push empty/zero returns to avoid crash
        if (!prices) {
            if (stockData.dates && stockData.dates.length > 1) {
                for (let i = 0; i < stockData.dates.length - 1; i++) returns.push(0);
            }
            returnsData.push(returns);
            return;
        }
        for (let i = 1; i < prices.length; i++) {
            const curr = prices[i];
            const prev = prices[i - 1];
            if (curr !== null && prev !== null && prev !== 0) {
                returns.push((curr - prev) / prev);
            } else {
                returns.push(0); // Treat missing/zero as 0 change
            }
        }
        returnsData.push(returns);
    });

    const len = returnsData[0]?.length || 0;

    if (len < 2) return Array(n).fill(Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        matrix[i] = [];
        for (let j = 0; j < n; j++) {
            if (i === j) {
                matrix[i][j] = 1;
                continue;
            }
            
            // Pearson correlation
            const x = returnsData[i];
            const y = returnsData[j];
            
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
            const nCommon = x.length; // Assuming aligned dates

            for (let k = 0; k < nCommon; k++) {
                sumX += x[k];
                sumY += y[k];
                sumXY += x[k] * y[k];
                sumX2 += x[k] * x[k];
                sumY2 += y[k] * y[k];
            }

            const numerator = (nCommon * sumXY) - (sumX * sumY);
            const denominator = Math.sqrt((nCommon * sumX2 - sumX * sumX) * (nCommon * sumY2 - sumY * sumY));
            
            matrix[i][j] = denominator === 0 ? 0 : numerator / denominator;
        }
    }
    return matrix;
}

export function calculateMonthlyReturns(portfolioValues: number[], dates: string[]): MonthlyReturn[] {
    if (portfolioValues.length !== dates.length || dates.length === 0) return [];
    
    // Map keys "YYYY-M" to the LAST index found for that month
    // This ensures that whether data is daily or monthly, we grab the month-end value
    const lastIndexByMonth: Record<string, number> = {};
    
    dates.forEach((d, index) => {
        const date = new Date(d);
        // Handle invalid dates gracefully
        if (isNaN(date.getTime())) return;

        const key = `${date.getFullYear()}-${date.getMonth() + 1}`; // YYYY-M
        lastIndexByMonth[key] = index;
    });

    // Sort month keys chronologically
    const sortedKeys = Object.keys(lastIndexByMonth).sort((a, b) => {
        const [y1, m1] = a.split('-').map(Number);
        const [y2, m2] = b.split('-').map(Number);
        return y1 !== y2 ? y1 - y2 : m1 - m2;
    });

    const results: MonthlyReturn[] = [];
    let previousValue = 100; // Portfolio simulation starts at base 100

    sortedKeys.forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const index = lastIndexByMonth[key];
        const currentValue = portfolioValues[index];
        
        // Calculate return: (Current Month End - Previous Month End) / Previous Month End
        // For the very first month, it compares against base 100.
        const ret = previousValue !== 0 ? (currentValue - previousValue) / previousValue : 0;
        
        results.push({ year, month, value: ret });
        
        // Update previousValue for the next iteration
        previousValue = currentValue;
    });

    return results;
}

export function calculateMetrics(prices: (number | null)[], dates: string[]): StockMetrics | null {
  if (!prices || !dates) return null; // Add safety check
  
  const validPrices: number[] = [];
  for (const p of prices) {
      if (p !== null && !isNaN(p)) validPrices.push(p);
  }
  if (validPrices.length < 2) return null;

  const returns: number[] = [];
  for (let i = 1; i < validPrices.length; i++) {
    const r = (validPrices[i] - validPrices[i - 1]) / validPrices[i - 1];
    returns.push(r);
  }

  if(returns.length === 0) return null;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // --- ROBUST TIME-BASED CALCULATION ---
  let years = 1;
  let periodsPerYear = 0;

  if (dates.length >= 2) {
    const firstDate = new Date(dates[0]);
    const lastDate = new Date(dates[dates.length - 1]);
    
    if (!isNaN(firstDate.getTime()) && !isNaN(lastDate.getTime())) {
        const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
        years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    }
  }

  if (years < 0.0027) { 
      years = returns.length / 252;
  }

  periodsPerYear = returns.length / years;

  const totalReturn = (validPrices[validPrices.length - 1] - validPrices[0]) / validPrices[0];
  const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;

  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(periodsPerYear);

  let maxDD = 0;
  let peak = -Infinity;
  for (const price of validPrices) {
    if (price > peak) peak = price;
    const dd = peak !== 0 ? (peak - price) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }

  const sharpe = volatility > 0 ? cagr / volatility : 0;
  
  const downReturns = returns.filter(r => r < 0);
  const downVariance = downReturns.length > 1 ? downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length : 0;
  
  const downVol = Math.sqrt(downVariance) * Math.sqrt(periodsPerYear);
  const sortino = downVol > 0 ? cagr / downVol : 0;

  return { cagr, volatility, maxDD, sharpe, sortino, calmar: maxDD > 0 ? cagr / maxDD : 0, returns, totalReturn, duration: years };
}

export function calculatePortfolioMetrics(weights: Record<string, number>, stockMetrics: Record<string, StockMetrics>): Metrics | null {
    let portfolioCagr = 0;
    let portfolioMaxDD = 0;
    
    Object.entries(weights).forEach(([ticker, weight]) => {
        if (stockMetrics[ticker]) {
            portfolioCagr += weight * stockMetrics[ticker].cagr;
            portfolioMaxDD += weight * stockMetrics[ticker].maxDD;
        }
    });
    
    return { cagr: portfolioCagr, volatility: 0, maxDD: portfolioMaxDD, sharpe: 0, sortino: 0, calmar: 0 };
}

/**
 * STRICTLY enforces that no weight exceeds maxWeight AND no weight is below minWeight (unless 0).
 */
export function repairWeights(weights: Record<string, number>, maxWeight: number, minWeight: number = 0): Record<string, number> {
    let newWeights = { ...weights };
    const tickers = Object.keys(newWeights);
    
    // 1. Initial Constraint Check: Remove tickers below minWeight (unless minWeight is 0)
    if (minWeight > 0) {
        for (const t of tickers) {
            if (newWeights[t] < minWeight) {
                newWeights[t] = 0; 
            }
        }
    }

    // 2. Normalize
    let total = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (total === 0) return newWeights; 
    for (const t of tickers) newWeights[t] /= total;

    // 3. Iterative Clamping (Max & Min)
    let iterations = 0;
    let solved = false;
    
    while (!solved && iterations < 20) {
        solved = true;
        let surplus = 0;
        let deficit = 0;
        let adjustableTickers: string[] = [];

        // Identify violators
        for (const t of tickers) {
            if (newWeights[t] === 0) continue; // Skip dead stocks

            if (newWeights[t] > maxWeight + 0.00001) {
                surplus += newWeights[t] - maxWeight;
                newWeights[t] = maxWeight;
                solved = false;
            } else if (newWeights[t] < minWeight - 0.00001) {
                 // Try to bump to minWeight
                 deficit += minWeight - newWeights[t];
                 newWeights[t] = minWeight;
                 solved = false;
            } else {
                adjustableTickers.push(t);
            }
        }

        // Re-distribute surplus/deficit
        const netChange = surplus - deficit; // If positive, we need to remove weight. If negative, add weight.
        
        if (Math.abs(netChange) > 0.00001) {
             const adjustableTotal = adjustableTickers.reduce((sum, t) => sum + newWeights[t], 0);
             
             if (adjustableTickers.length > 0 && adjustableTotal > 0) {
                 for (const t of adjustableTickers) {
                     // Distribute proportionally
                     const share = newWeights[t] / adjustableTotal;
                     newWeights[t] += netChange * share;
                 }
             } else {
                 // Impossible constraint (e.g. Min 20%, 6 stocks -> 120%).
                 // Just normalize and break
                 total = Object.values(newWeights).reduce((a, b) => a + b, 0);
                 for (const t of tickers) newWeights[t] /= total;
                 break;
             }
        }
        iterations++;
    }
    
    // Final check to kill tiny weights that might have been created by float math if minWeight > 0
    if (minWeight > 0) {
        for (const t of tickers) {
            if(newWeights[t] > 0 && newWeights[t] < minWeight * 0.99) newWeights[t] = 0;
        }
        // One last normalize
        total = Object.values(newWeights).reduce((a, b) => a + b, 0);
        if(total > 0) for (const t of tickers) newWeights[t] /= total;
    }
    
    return newWeights;
}

export function generateRandomWeights(
  maxStocks: number, 
  maxWeight: number, 
  strictMode: boolean, 
  availableTickers: string[],
  priorityStockConfig: PriorityStockConfig,
  minWeight: number = 0
): Record<string, number> {
  const weights: Record<string, number> = {};
  
  let remainingWeight = 1.0;
  const tickersToChooseFrom = [...availableTickers];

  // Handle priority stock first
  if (priorityStockConfig.ticker && tickersToChooseFrom.includes(priorityStockConfig.ticker)) {
    const { ticker, minWeight: pMin, maxWeight: pMax } = priorityStockConfig;
    const actualMax = Math.min(pMax, maxWeight);
    const actualMin = Math.max(pMin, minWeight); // Respect global min
    
    if(actualMax >= actualMin) {
        const pWeight = Math.random() * (actualMax - actualMin) + actualMin;
        weights[ticker] = pWeight;
        remainingWeight -= pWeight;
        
        const index = tickersToChooseFrom.indexOf(ticker);
        tickersToChooseFrom.splice(index, 1);
    }
  }
  
  if (remainingWeight <= 0) return repairWeights(weights, maxWeight, minWeight);

  const numStocksToSelect = strictMode
    ? maxStocks - Object.keys(weights).length
    : Math.floor(Math.random() * (maxStocks - Object.keys(weights).length)) + 1;
  
  const selectedCount = Math.min(numStocksToSelect, tickersToChooseFrom.length);
  if (selectedCount <= 0) return repairWeights(weights, maxWeight, minWeight);

  const selectedTickers: string[] = [];
  for (let i = 0; i < selectedCount; i++) {
    const randomIndex = Math.floor(Math.random() * tickersToChooseFrom.length);
    selectedTickers.push(tickersToChooseFrom.splice(randomIndex, 1)[0]);
  }
  
  if (selectedTickers.length > 0) {
      // Logic: Ensure everyone gets at least minWeight
      const totalMinNeeded = selectedTickers.length * minWeight;
      
      if (remainingWeight >= totalMinNeeded) {
          // Give base
          selectedTickers.forEach(t => weights[t] = minWeight);
          let weightToDistribute = remainingWeight - totalMinNeeded;
          
          // Distribute rest randomly
          const rawWeights = selectedTickers.map(() => Math.random());
          const sum = rawWeights.reduce((a, b) => a + b, 0);
          
          selectedTickers.forEach((t, i) => {
              weights[t] += (rawWeights[i] / sum) * weightToDistribute;
          });
      } else {
          // Impossible to satisfy minWeight with this many stocks. 
          // Reduce count or just fill what we can. 
          // Standard random fill
          const rawWeights = selectedTickers.map(() => Math.random());
          const sum = rawWeights.reduce((a, b) => a + b, 0);
          selectedTickers.forEach((t, i) => {
              weights[t] = (rawWeights[i] / sum) * remainingWeight;
          });
      }
  }

  return repairWeights(weights, maxWeight, minWeight);
}

export function generateDiscreteWeights(
  maxStocks: number,
  maxWeight: number,
  strictMode: boolean,
  availableTickers: string[],
  priorityStockConfig: PriorityStockConfig,
  minWeight: number = 0
): Record<string, number> {
  const weights: Record<string, number> = {};
  const step = 0.05;
  const totalSteps = 20; 

  let remainingSteps = totalSteps;
  let currentTickers = [...availableTickers];

  // 1. Handle Priority Stock
  if (priorityStockConfig.ticker && currentTickers.includes(priorityStockConfig.ticker)) {
     const minSteps = Math.ceil(Math.max(priorityStockConfig.minWeight, minWeight) / step);
     const maxSteps = Math.floor(priorityStockConfig.maxWeight / step);
     const actualMaxSteps = Math.min(maxSteps, Math.floor(maxWeight / step));
     
     if (actualMaxSteps >= minSteps) {
         const pSteps = Math.floor(Math.random() * (actualMaxSteps - minSteps + 1)) + minSteps;
         weights[priorityStockConfig.ticker] = pSteps * step;
         remainingSteps -= pSteps;
         currentTickers = currentTickers.filter(t => t !== priorityStockConfig.ticker);
     }
  }

  if (remainingSteps <= 0) return repairWeights(weights, maxWeight, minWeight);

  const existingCount = Object.keys(weights).length;
  const slotsAvailable = maxStocks - existingCount;
  
  if (slotsAvailable <= 0) return repairWeights(weights, maxWeight, minWeight);

  let targetStockCount = strictMode 
      ? slotsAvailable 
      : Math.floor(Math.random() * slotsAvailable) + 1;
  targetStockCount = Math.min(targetStockCount, currentTickers.length);
  if (targetStockCount === 0) return repairWeights(weights, maxWeight, minWeight);

  const selectedTickers: string[] = [];
  for (let i = 0; i < targetStockCount; i++) {
      const idx = Math.floor(Math.random() * currentTickers.length);
      selectedTickers.push(currentTickers[idx]);
      currentTickers.splice(idx, 1);
  }

  const minStepsPerStock = Math.ceil(minWeight / step);
  if (minStepsPerStock > 0 && remainingSteps >= selectedTickers.length * minStepsPerStock) {
      for (const t of selectedTickers) {
          weights[t] = minStepsPerStock * step;
          remainingSteps -= minStepsPerStock;
      }
  } else {
      for (const t of selectedTickers) {
          if(remainingSteps > 0) {
            weights[t] = step;
            remainingSteps--;
          }
      }
  }

  const validTickersForMore = [...selectedTickers];
  let safety = 0;
  while(remainingSteps > 0 && validTickersForMore.length > 0 && safety < 1000) {
      safety++;
      const idx = Math.floor(Math.random() * validTickersForMore.length);
      const t = validTickersForMore[idx];
      
      if (weights[t] + step <= maxWeight + 0.0001) {
        weights[t] += step;
        remainingSteps--;
      } else {
        validTickersForMore.splice(idx, 1);
      }
  }

  for(const k in weights) {
      weights[k] = Math.round(weights[k] * 100) / 100;
  }

  return repairWeights(weights, maxWeight, minWeight);
}

export function mutateWeights(
    weights: Record<string, number>, 
    maxWeight: number, 
    mutationRate: number = 0.1,
    minWeight: number = 0
): Record<string, number> {
    const newWeights = { ...weights };
    const tickers = Object.keys(newWeights);
    
    if (Math.random() < mutationRate && tickers.length > 0) {
        // ENHANCED MUTATION: 50% chance of Swap, 50% chance of Uniform Reset
        const type = Math.random();
        
        if (type < 0.5 && tickers.length > 1) {
            // Swap Mutation
            const idx1 = Math.floor(Math.random() * tickers.length);
            let idx2 = Math.floor(Math.random() * tickers.length);
            while(idx1 === idx2) idx2 = Math.floor(Math.random() * tickers.length);
            
            const ticker1 = tickers[idx1];
            const ticker2 = tickers[idx2];
            
            const amount = Math.random() * 0.05; 
            
            newWeights[ticker1] -= amount;
            newWeights[ticker2] += amount;
        } else {
            // Uniform / Reset Mutation
            const idx = Math.floor(Math.random() * tickers.length);
            const ticker = tickers[idx];
            const newW = Math.random() * (maxWeight - minWeight) + minWeight;
            newWeights[ticker] = newW;
        }
    }

    return repairWeights(newWeights, maxWeight, minWeight);
}

export function crossoverWeights(
    parentA: Record<string, number>, 
    parentB: Record<string, number>,
    maxStocks: number, 
    maxWeight: number = 1.0,
    minWeight: number = 0
): Record<string, number> {
    const child: Record<string, number> = {};
    const allTickers = Array.from(new Set([...Object.keys(parentA), ...Object.keys(parentB)]));
    
    allTickers.forEach(ticker => {
        const wa = parentA[ticker] || 0;
        const wb = parentB[ticker] || 0;
        let w = (wa + wb) / 2 * (0.9 + Math.random() * 0.2);
        if (w > 0.001) child[ticker] = w; 
    });
    
    const childTickers = Object.keys(child);
    if (childTickers.length > maxStocks) {
        childTickers.sort((a, b) => child[b] - child[a]);
        const keptTickers = childTickers.slice(0, maxStocks);
        const newChild: Record<string, number> = {};
        keptTickers.forEach(t => {
            newChild[t] = child[t];
        });
        return repairWeights(newChild, maxWeight, minWeight);
    }
    
    return repairWeights(child, maxWeight, minWeight);
}

export function calculatePortfolioPerformance(
  weights: Record<string, number>, 
  stockData: StockData, 
  rebalanceMode: 'none' | 'quarterly' | 'dynamic' = 'none',
  hedgeConfig: HedgeConfig = { enabled: false, shortMAPeriod: 20, longMAPeriod: 60, reentryStrategy: 'golden_cross', signalTicker: null },
  dynamicRebalanceThreshold: number = 0.2,
  historyStep: number = 0 // Changed from boolean includeWeightHistory. 0 = false/no history, >0 = record every Nth step
) {
  const tickers = Object.keys(weights);
  const numPeriods = stockData.dates.length;
  
  const portfolioValues: (number | null)[] = [];
  const initialValue = 100;
  let currentValue = initialValue;
  let holdings: Record<string, number> = {}; 
  
  const dailyWeights: Record<string, number>[] = []; // Sparse array if historyStep > 1

  let shortMA: (number|null)[] = [];
  let longMA: (number|null)[] = [];
  let shortMAShortMA: (number|null)[] = [];
  let inCash = false;
  const cashPeriods: { start: number, end: number }[] = [];
  
  if (hedgeConfig.enabled) {
      let signalPrices: (number | null)[] = [];

      // Determine signal source: Specific Stock OR Market Average
      if (hedgeConfig.signalTicker && stockData.priceData[hedgeConfig.signalTicker]) {
          signalPrices = stockData.priceData[hedgeConfig.signalTicker];
      } else {
          // Calculate Market Average (Equal Weight of all loaded tickers)
          for (let i = 0; i < numPeriods; i++) {
            let sum = 0;
            let count = 0;
            for (const ticker of stockData.tickers) {
                const prices = stockData.priceData[ticker];
                const price = prices ? prices[i] : null; // Safe check
                if (price !== null && price !== undefined && !isNaN(price)) {
                    sum += price;
                    count++;
                }
            }
            signalPrices.push(count > 0 ? sum / count : null);
          }
      }

      shortMA = calculateMA(signalPrices, hedgeConfig.shortMAPeriod);
      longMA = calculateMA(signalPrices, hedgeConfig.longMAPeriod);
      if (hedgeConfig.reentryStrategy === 'short_ma_rebound') {
          shortMAShortMA = calculateMA(shortMA, 5); 
      }
  }

  const invest = (value: number, period: number) => {
    tickers.forEach(ticker => {
        const prices = stockData.priceData[ticker];
        if (!prices) {
            holdings[ticker] = 0;
            return;
        }
        let price: number | null = prices[period];
        if (price) {
            holdings[ticker] = (value * weights[ticker]) / price;
        } else {
            holdings[ticker] = 0;
        }
    });
  };

  invest(initialValue, 0);

  for (let i = 0; i < numPeriods; i++) {
    if (hedgeConfig.enabled && i > 0 && shortMA[i] !== null && longMA[i] !== null && shortMA[i-1] !== null && longMA[i-1] !== null) {
      const wasInCash = inCash;
      
      if (shortMA[i] < longMA[i] && shortMA[i-1] >= longMA[i-1]) {
        inCash = true;
      } 
      
      if (inCash) {
          let reenter = false;
          if (hedgeConfig.reentryStrategy === 'golden_cross') {
              if (shortMA[i] > longMA[i] && shortMA[i-1] <= longMA[i-1]) {
                  reenter = true;
              }
          } else { 
              if (shortMA[i] > longMA[i] && shortMA[i-1] <= longMA[i-1]) {
                  reenter = true;
              }
              else if (shortMAShortMA[i] !== null && shortMAShortMA[i-1] !== null && shortMA[i] > shortMAShortMA[i] && shortMA[i-1] <= shortMAShortMA[i-1]) {
                  reenter = true;
              }
          }
          if (reenter) {
              inCash = false;
          }
      }

      if (inCash && !wasInCash) { 
        cashPeriods.push({ start: i, end: -1 });
      }
      if (!inCash && wasInCash) { 
        if (cashPeriods.length > 0 && cashPeriods[cashPeriods.length - 1].end === -1) {
            cashPeriods[cashPeriods.length - 1].end = i;
        }
        invest(portfolioValues[i-1] || currentValue, i); 
      }
    }
    
    let periodValue = 0;
    const currentSnapshot: Record<string, number> = {};
    
    const shouldRecordHistory = historyStep > 0 && (i % historyStep === 0 || i === numPeriods - 1);

    if (inCash) {
      periodValue = (i > 0) ? (portfolioValues[i-1] || currentValue) : initialValue;
      if (shouldRecordHistory) {
          tickers.forEach(t => currentSnapshot[t] = 0);
          currentSnapshot['CASH'] = 1.0; 
      }
    } else {
      let validStocks = 0;
      tickers.forEach(ticker => {
          const prices = stockData.priceData[ticker];
          if (!prices) return; // Skip if no prices for this ticker

          const price = prices[i];
          if (price !== null && !isNaN(price) && holdings[ticker]) {
              const stockVal = holdings[ticker] * price;
              periodValue += stockVal;
              if (shouldRecordHistory) currentSnapshot[ticker] = stockVal;
              validStocks++;
          }
      });
      if (validStocks === 0) periodValue = (i > 0) ? (portfolioValues[i-1] || currentValue) : initialValue; 
      
      if (shouldRecordHistory && periodValue > 0) {
          Object.keys(currentSnapshot).forEach(k => currentSnapshot[k] /= periodValue);
      }
    }
    
    currentValue = periodValue;
    portfolioValues.push(currentValue);
    
    if (shouldRecordHistory) {
        // Use sparse array assignment to align with dates index
        dailyWeights[i] = currentSnapshot;
    }
    
    const quarterlyRebalanceDay = 63; 
    if (!inCash && rebalanceMode === 'quarterly' && i > 0 && i % quarterlyRebalanceDay === 0) {
      invest(currentValue, i);
    }
    
    if (!inCash && rebalanceMode === 'dynamic' && i > 60) {
        const portfolioMA60 = calculateMA(portfolioValues, 60)[i];
        if (portfolioMA60 && Math.abs(currentValue - portfolioMA60) / portfolioMA60 > dynamicRebalanceThreshold) {
            invest(currentValue, i);
        }
    }
  }

  if (inCash && cashPeriods.length > 0 && cashPeriods[cashPeriods.length-1].end === -1) {
    cashPeriods[cashPeriods.length - 1].end = numPeriods - 1;
  }

  const validValues: number[] = [];
  for (const v of portfolioValues) {
      if (v !== null) validValues.push(v);
  }
  const returns = validValues.map(v => v / initialValue - 1);
  
  let peak = initialValue;
  const drawdowns: (number|null)[] = portfolioValues.map(v => {
      if(v === null) return null;
      if (v > peak) peak = v;
      return peak !== 0 ? (v - peak) / peak * 100 : 0;
  });

  const smoothness = calculateRSquared(validValues);
  
  let winCount = 0;
  let comparablePeriods = 0;
  for(let i=1; i<validValues.length; i++) {
      if (validValues[i] > validValues[i-1]) {
        winCount++;
      }
      comparablePeriods++;
  }
  const winRate = comparablePeriods > 0 ? winCount / comparablePeriods : 0;
  
  return { prices: returns, drawdowns, portfolioValues, smoothness, winRate, cashPeriods, dailyWeights };
}

export function calculateAssetRotation(
    weights: Record<string, number>, 
    stockData: StockData, 
    portfolioValues: (number|null)[],
    trailLength: number = 20,
    downsampleStep: number = 1
) {
    const tickers = Object.keys(weights).filter(t => weights[t] > 0.001);
    const validPortfolio = portfolioValues.map(v => v || 0);
    const n = validPortfolio.length;
    
    const longWindow = Math.min(Math.floor(n / 2), 60);
    const shortWindow = Math.max(Math.floor(longWindow / 4), 5);
    
    const results: Record<string, {x: number[], y: number[], dates: string[]}> = {};

    const startIndex = Math.max(longWindow, n - trailLength); 
    
    const portRetLong: number[] = [];
    const portRetShort: number[] = [];
    
    for(let i = startIndex; i < n; i++) {
        if ((i - startIndex) % downsampleStep !== 0 && i !== n - 1) continue;

        const pCurrent = validPortfolio[i];
        const pLong = validPortfolio[i - longWindow];
        const pShort = validPortfolio[i - shortWindow];
        
        portRetLong[i] = pLong > 0 ? (pCurrent - pLong) / pLong : 0;
        portRetShort[i] = pShort > 0 ? (pCurrent - pShort) / pShort : 0;
    }

    const crossSectionX: Record<number, number[]> = {};
    const crossSectionY: Record<number, number[]> = {};
    
    tickers.forEach(ticker => {
        const prices = stockData.priceData[ticker];
        
        for(let i = startIndex; i < n; i++) {
             if ((i - startIndex) % downsampleStep !== 0 && i !== n - 1) continue;

             const pCurrent = prices ? (prices[i] || 0) : 0;
             const pLong = prices ? (prices[i - longWindow] || 0) : 0;
             const pShort = prices ? (prices[i - shortWindow] || 0) : 0;
             
             let retLong = pLong > 0 ? (pCurrent - pLong) / pLong : 0;
             let retShort = pShort > 0 ? (pCurrent - pShort) / pShort : 0;
             
             const relX = retLong - portRetLong[i];
             const relY = retShort - portRetShort[i];
             
             if(!crossSectionX[i]) crossSectionX[i] = [];
             if(!crossSectionY[i]) crossSectionY[i] = [];
             
             crossSectionX[i].push(relX);
             crossSectionY[i].push(relY);
        }
    });

    const stats: Record<number, {meanX: number, stdX: number, meanY: number, stdY: number}> = {};
    for(let i = startIndex; i < n; i++) {
        if ((i - startIndex) % downsampleStep !== 0 && i !== n - 1) continue;

        const xs = crossSectionX[i];
        const ys = crossSectionY[i];
        
        if (!xs || !ys) continue;

        const meanX = xs.reduce((a,b)=>a+b,0)/xs.length;
        const meanY = ys.reduce((a,b)=>a+b,0)/ys.length;
        
        const stdX = Math.sqrt(xs.reduce((a,b)=>a+(b-meanX)**2,0)/xs.length) || 0.01;
        const stdY = Math.sqrt(ys.reduce((a,b)=>a+(b-meanY)**2,0)/ys.length) || 0.01;
        
        stats[i] = { meanX, stdX, meanY, stdY };
    }

    tickers.forEach(ticker => {
         const prices = stockData.priceData[ticker];
         const finalX: number[] = [];
         const finalY: number[] = [];
         const finalDates: string[] = [];
         
         for(let i = startIndex; i < n; i++) {
             if ((i - startIndex) % downsampleStep !== 0 && i !== n - 1) continue;

             const pCurrent = prices ? (prices[i] || 0) : 0;
             const pLong = prices ? (prices[i - longWindow] || 0) : 0;
             const pShort = prices ? (prices[i - shortWindow] || 0) : 0;
             
             let retLong = pLong > 0 ? (pCurrent - pLong) / pLong : 0;
             let retShort = pShort > 0 ? (pCurrent - pShort) / pShort : 0;
             
             const rawRelX = retLong - portRetLong[i];
             const rawRelY = retShort - portRetShort[i];
             
             const s = stats[i];
             if (!s) continue;
             
             const zX = ((rawRelX - s.meanX) / s.stdX) * 100 + 100;
             const zY = ((rawRelY - s.meanY) / s.stdY) * 100 + 100;

             finalX.push(zX);
             finalY.push(zY);
             finalDates.push(stockData.dates[i]);
         }
         results[ticker] = { x: finalX, y: finalY, dates: finalDates };
    });

    return results;
}

export function calculateCurrentCyclePositions(
    weights: Record<string, number>, 
    stockData: StockData, 
    portfolioValues: (number|null)[],
) {
    const rotation = calculateAssetRotation(weights, stockData, portfolioValues, 1);
    
    const results: {ticker: string, angle: number, radius: number, x: number, y: number}[] = [];
    
    Object.entries(rotation).forEach(([ticker, data]) => {
        if (data.x.length > 0) {
            const x = data.x[data.x.length - 1] - 100; // Center at 0
            const y = data.y[data.y.length - 1] - 100; // Center at 0
            
            let angleRad = Math.atan2(y, x);
            let angleDeg = angleRad * (180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;
            
            const radius = Math.sqrt(x*x + y*y);
            
            results.push({ ticker, angle: angleDeg, radius, x: x + 100, y: y + 100 });
        }
    });

    results.sort((a, b) => {
        const scoreA = a.angle <= 90 ? (90 - a.angle) : (450 - a.angle);
        const scoreB = b.angle <= 90 ? (90 - b.angle) : (450 - b.angle);
        return scoreA - scoreB;
    });

    return results;
}

// --- NEW STABILITY ANALYTICS ---

export function linearRegression(values: number[]) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
}

export function calculateStandardDeviation(values: number[]) {
    const n = values.length;
    if (n === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
    return Math.sqrt(variance);
}

export function calculateAverage(values: number[]) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

export function calculateStabilityScore(portfolioValues: number[]) {
    // Configuration from expert report
    const maxSpikeThreshold = 0.08; 
    const annualTradingDays = 252;
    const residualWeight = 0.6;
    const volatilityWeight = 0.4;

    // Filter nulls first to be safe, although input is usually valid
    const values = portfolioValues.filter(v => v !== null && !isNaN(v)) as number[];
    const n = values.length;
    if (n < 20) return { score: 0, metrics: null, disqualified: true, reason: '數據不足' };

    // 1. Basic Return
    const totalReturn = (values[n - 1] - values[0]) / values[0];
    const annualizedReturn = Math.pow(1 + totalReturn, annualTradingDays / n) - 1;

    // 2. Period Returns & Spike Detection
    const periodReturns: number[] = [];
    for (let i = 1; i < n; i++) {
        periodReturns.push((values[i] - values[i - 1]) / values[i - 1]);
    }

    const maxUp = Math.max(...periodReturns);
    const maxDown = Math.min(...periodReturns);

    if (maxUp > maxSpikeThreshold || maxDown < -maxSpikeThreshold) {
        return {
            score: 0,
            metrics: { maxUp, maxDown, annualizedReturn },
            disqualified: true,
            reason: `單期波動超標`
        };
    }

    // 3. Log Regression Trend
    // PROTECT AGAINST LOG(<=0)
    const logValues = values.map(v => v > 0 ? Math.log(v) : 0);
    const { slope, intercept } = linearRegression(logValues);
    const trendLine: number[] = [];
    for (let i = 0; i < n; i++) {
        trendLine.push(Math.exp(intercept + slope * i));
    }

    // 4. Residuals & Ulcer Index & Current Position (Z-Score)
    const percentageDeviations: number[] = [];
    const signedDeviations: number[] = []; // For Z-Score calculation

    for (let i = 0; i < n; i++) {
        const trendVal = trendLine[i];
        if (trendVal <= 0.0001) {
             percentageDeviations.push(1); // Edge case protection
             signedDeviations.push(0);
             continue;
        }
        const deviation = values[i] - trendVal;
        const percentDeviation = Math.abs(deviation / trendVal);
        
        // Signed percentage deviation for Z-Score
        signedDeviations.push(deviation / trendVal);
        percentageDeviations.push(percentDeviation);
    }

    // Calculate Z-Score of the CURRENT (last) price
    const meanDeviation = signedDeviations.reduce((a,b) => a + b, 0) / n;
    const devVariance = signedDeviations.reduce((a,b) => a + Math.pow(b - meanDeviation, 2), 0) / n;
    const devStdDev = Math.sqrt(devVariance);
    
    // Z-Score = (LastDeviation - MeanDeviation) / StdDev. 
    // Usually MeanDeviation is close to 0 in regression, but we include it for precision.
    const lastSignedDev = signedDeviations[n-1];
    const currentZScore = devStdDev > 0.000001 ? (lastSignedDev - meanDeviation) / devStdDev : 0;

    const maxResidual = Math.max(...percentageDeviations);
    const sumSquaredDeviations = percentageDeviations.reduce((sum, d) => sum + d * d, 0);
    const symmetricUlcerIndex = Math.sqrt(sumSquaredDeviations / n);

    // 5. Rolling Volatility
    const rollingWindow = Math.min(20, Math.floor(n / 5));
    const rollingStdDevs: number[] = [];
    for (let i = rollingWindow; i < periodReturns.length; i++) {
        const windowReturns = periodReturns.slice(i - rollingWindow, i);
        const std = calculateStandardDeviation(windowReturns);
        rollingStdDevs.push(std);
    }
    const maxRollingStdDev = rollingStdDevs.length > 0 ? Math.max(...rollingStdDevs) : 0;

    // 6. Channel Consistency (Reward)
    const channelWidth = 0.03; // 3%
    const withinChannel = percentageDeviations.filter(d => d <= channelWidth).length;
    const channelConsistency = withinChannel / n;

    // 7. Final Score
    const baseScore = symmetricUlcerIndex > 0 ? annualizedReturn / symmetricUlcerIndex : 0;
    
    const residualPenalty = maxResidual > 0.05 
        ? Math.max(0, 1 - (maxResidual - 0.05) * 5) 
        : 1;

    const volatilityPenalty = maxRollingStdDev > 0.02 
        ? Math.max(0, 1 - (maxRollingStdDev - 0.02) * 10) 
        : 1;

    // Bonus for staying in channel
    const finalScore = baseScore 
        * (residualPenalty * residualWeight + volatilityPenalty * volatilityWeight)
        * (0.5 + 0.5 * channelConsistency);

    return {
        score: Math.max(0, finalScore),
        metrics: {
            symmetricUlcerIndex,
            maxResidual,
            maxRollingStdDev,
            channelConsistency,
            currentZScore // Return this for V3 algorithm to use
        },
        disqualified: false
    };
}

// --- SUPER AI V2.0 HELPER FUNCTIONS ---

export function calculateRSquared(values: number[]): number {
  if (values.length < 2) return 0;
  const y = values.map(v => v > 0 ? Math.log(v) : 0);
  const n = y.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += y[i]; sumXY += i * y[i]; sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  let ssTot = 0, ssRes = 0;
  const meanY = sumY / n;
  for (let i = 0; i < n; i++) {
    ssTot += (y[i] - meanY) ** 2;
    ssRes += (y[i] - (intercept + slope * i)) ** 2;
  }
  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}

export function detectFrequency(values: number[], hintDays: number = 0): string {
    const n = values.length;
    if (hintDays && hintDays > 0) {
        const pointsPerDay = n / hintDays;
        if (pointsPerDay > 4)  return 'hourly';
        if (pointsPerDay > 0.8) return 'daily';
        if (pointsPerDay > 0.15) return 'weekly';
        return 'monthly';
    }

    const logReturns: number[] = [];
    for (let i = 1; i < n; i++) {
        if(values[i] > 0 && values[i-1] > 0)
            logReturns.push(Math.log(values[i] / values[i - 1]));
    }
    
    // Fallback if not enough data
    if(logReturns.length === 0) return 'daily';

    const mean = logReturns.reduce((s, x) => s + x, 0) / logReturns.length;
    const variance = logReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / logReturns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev < 0.008) return 'hourly';
    if (stdDev < 0.025) return 'daily';
    if (stdDev < 0.050) return 'weekly';
    return 'monthly';
}

export function calculateCVaRPenalty(logReturns: number[]): number {
  const sorted = [...logReturns].sort((a, b) => a - b);
  const tail = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)));
  if (tail.length === 0) return 1;
  const cvar = tail.reduce((s, x) => s + x, 0) / tail.length;
  // cvar is negative return, we penalize large negative values
  // e.g., cvar = -0.05 => exp(-0.5) ~ 0.6
  return Math.exp(cvar * 10);
}

export function calculateChannelScore(values: number[]): number {
  const y = values.map(v => v > 0 ? Math.log(v) : 0);
  const n = y.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += y[i]; sumXY += i * y[i]; sumXX += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  let maxDev = 0;
  for (let i = 0; i < n; i++) {
    maxDev = Math.max(maxDev, Math.abs(y[i] - (intercept + slope * i)));
  }
  const widthPct = (Math.exp(maxDev) - 1) * 2;
  return Math.exp(-widthPct / 0.10);  // Decays as channel widens
}

export function saturate(x: number, scale: number): number {
  return x > 0 ? x / (x + scale) : 0;
}

export function calculateSuperAI_v2_adaptive(input: {portfolioValues: number[], frequency?: string, totalDaysHint?: number}, cfg: any = {}) {
    const values = input.portfolioValues;
    const n = values.length;

    // CONSTANTS defined locally for Worker portability
    const FREQUENCY_MAP: Record<string, {periodsPerYear: number, typicalMaxMove: number}> = {
        hourly:  { periodsPerYear: 252 * 6.5, typicalMaxMove: 0.02 },
        daily:   { periodsPerYear: 252,       typicalMaxMove: 0.05 },
        weekly:  { periodsPerYear: 52,        typicalMaxMove: 0.08 },
        monthly: { periodsPerYear: 12,        typicalMaxMove: 0.15 },
    };

    // 1. Frequency Detection
    let freq = input.frequency;
    if (!freq || freq === 'auto') {
        freq = detectFrequency(values, input.totalDaysHint);
    }
    const freqConfig = FREQUENCY_MAP[freq] || FREQUENCY_MAP['daily'];
    const periodsPerYear = freqConfig.periodsPerYear;
    const sqrtPeriods = Math.sqrt(periodsPerYear);

    // 2. Returns & Metrics
    const logReturns: number[] = [];
    for (let i = 1; i < n; i++) {
        if (values[i] > 0 && values[i-1] > 0)
            logReturns.push(Math.log(values[i] / values[i - 1]));
        else 
            logReturns.push(0);
    }
    
    if (logReturns.length === 0) return { score: -9999, disqualified: true, reason: 'No Returns' };

    const meanReturn = logReturns.reduce((s, x) => s + x, 0) / logReturns.length;
    const variance = logReturns.reduce((s, x) => s + (x - meanReturn) ** 2, 0) / logReturns.length;
    const stdDev = Math.sqrt(variance);

    const annualReturn = meanReturn * periodsPerYear;
    const annualVolatility = stdDev * sqrtPeriods;

    // Sortino downside
    const negReturns = logReturns.filter(r => r < 0);
    const downDev = negReturns.length > 0
        ? Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / negReturns.length) * sqrtPeriods
        : 0.001;

    const sharpe = annualVolatility > 0.001 ? annualReturn / annualVolatility : 0;
    const sortino = downDev > 0.001 ? annualReturn / downDev : 3;

    // Max DD
    let peak = values[0];
    let maxDD = 0;
    for (const v of values) {
        if (v > peak) peak = v;
        const dd = (peak - v) / peak;
        if (dd > maxDD) maxDD = dd;
    }
    const calmar = maxDD > 0.001 ? annualReturn / maxDD : 0;

    // Max Single Period Move
    const maxUp = Math.max(...logReturns);
    const maxDown = Math.min(...logReturns);
    const maxMove = Math.max(Math.abs(maxUp), Math.abs(maxDown));
    const maxMovePct = Math.exp(maxMove) - 1;

    const smoothness = calculateRSquared(values);

    // 3. Gatekeeping
    const maxAllowedDrawdown = cfg.maxAllowedDrawdown || 0.25;
    const minRequiredAnnualReturn = cfg.minRequiredAnnualReturn || 0.05;
    const maxAllowedMove = cfg.maxSinglePeriodMove || (freqConfig.typicalMaxMove * 2);
    const minSmoothness = cfg.minSmoothness || 0.85;

    if (maxDD > maxAllowedDrawdown) return { score: -9000, disqualified: true, reason: 'MaxDD Exceeded' };
    if (annualReturn < minRequiredAnnualReturn) return { score: -9001, disqualified: true, reason: 'Low Return' };
    if (maxMovePct > maxAllowedMove) return { score: -9002, disqualified: true, reason: 'High Volatility Spike' };
    if (smoothness < minSmoothness) return { score: -9003, disqualified: true, reason: 'Low Smoothness' };

    // 4. Scoring (Geometric Product)
    const returnComponent = saturate(sortino, 4);
    const riskComponent = saturate(calmar, 4) * calculateCVaRPenalty(logReturns);
    const stabilityComponent = Math.pow(smoothness, 2);
    const channelComponent = calculateChannelScore(values);

    const score = Math.pow(returnComponent, 0.4)
                * Math.pow(riskComponent, 0.3)
                * Math.pow(stabilityComponent, 0.2)
                * Math.pow(channelComponent, 0.1)
                * 100;

    return {
        score,
        disqualified: false,
        components: { returnComponent, riskComponent, stabilityComponent, channelComponent },
        metrics: { sortino, calmar, smoothness, channelWidthPct: 0 } // simplified
    };
}
