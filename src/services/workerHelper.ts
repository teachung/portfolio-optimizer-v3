
// Worker Helper - Production-Safe Version
// Uses inline function definitions instead of .toString() to ensure compatibility with bundlers

export const createWorkerCode = () => {
    return `
    // ============================================
    // INJECTED HELPER FUNCTIONS (Inline for Production)
    // ============================================

    function calculateMA(data, period) {
        if (period <= 1) return data;
        const result = Array(data.length).fill(null);
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

    function calculateMetrics(prices, dates) {
        if (!prices || !dates) return null;

        const validPrices = [];
        for (const p of prices) {
            if (p !== null && !isNaN(p)) validPrices.push(p);
        }
        if (validPrices.length < 2) return null;

        const returns = [];
        for (let i = 1; i < validPrices.length; i++) {
            const r = (validPrices[i] - validPrices[i - 1]) / validPrices[i - 1];
            returns.push(r);
        }

        if (returns.length === 0) return null;
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

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

    function calculatePortfolioMetrics(weights, stockMetrics) {
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

    function repairWeights(weights, maxWeight, minWeight = 0) {
        let newWeights = { ...weights };
        const tickers = Object.keys(newWeights);

        if (minWeight > 0) {
            for (const t of tickers) {
                if (newWeights[t] < minWeight) {
                    newWeights[t] = 0;
                }
            }
        }

        let total = Object.values(newWeights).reduce((a, b) => a + b, 0);
        if (total === 0) return newWeights;
        for (const t of tickers) newWeights[t] /= total;

        let iterations = 0;
        let solved = false;

        while (!solved && iterations < 20) {
            solved = true;
            let surplus = 0;
            let deficit = 0;
            let adjustableTickers = [];

            for (const t of tickers) {
                if (newWeights[t] === 0) continue;

                if (newWeights[t] > maxWeight + 0.00001) {
                    surplus += newWeights[t] - maxWeight;
                    newWeights[t] = maxWeight;
                    solved = false;
                } else if (newWeights[t] < minWeight - 0.00001) {
                    deficit += minWeight - newWeights[t];
                    newWeights[t] = minWeight;
                    solved = false;
                } else {
                    adjustableTickers.push(t);
                }
            }

            const netChange = surplus - deficit;

            if (Math.abs(netChange) > 0.00001) {
                const adjustableTotal = adjustableTickers.reduce((sum, t) => sum + newWeights[t], 0);

                if (adjustableTickers.length > 0 && adjustableTotal > 0) {
                    for (const t of adjustableTickers) {
                        const share = newWeights[t] / adjustableTotal;
                        newWeights[t] += netChange * share;
                    }
                } else {
                    total = Object.values(newWeights).reduce((a, b) => a + b, 0);
                    for (const t of tickers) newWeights[t] /= total;
                    break;
                }
            }
            iterations++;
        }

        if (minWeight > 0) {
            for (const t of tickers) {
                if(newWeights[t] > 0 && newWeights[t] < minWeight * 0.99) newWeights[t] = 0;
            }
            total = Object.values(newWeights).reduce((a, b) => a + b, 0);
            if(total > 0) for (const t of tickers) newWeights[t] /= total;
        }

        return newWeights;
    }

    function generateRandomWeights(maxStocks, maxWeight, strictMode, availableTickers, priorityStockConfig, minWeight = 0) {
        const weights = {};

        let remainingWeight = 1.0;
        const tickersToChooseFrom = [...availableTickers];

        if (priorityStockConfig.ticker && tickersToChooseFrom.includes(priorityStockConfig.ticker)) {
            const { ticker, minWeight: pMin, maxWeight: pMax } = priorityStockConfig;
            const actualMax = Math.min(pMax, maxWeight);
            const actualMin = Math.max(pMin, minWeight);

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

        const selectedTickers = [];
        for (let i = 0; i < selectedCount; i++) {
            const randomIndex = Math.floor(Math.random() * tickersToChooseFrom.length);
            selectedTickers.push(tickersToChooseFrom.splice(randomIndex, 1)[0]);
        }

        if (selectedTickers.length > 0) {
            const totalMinNeeded = selectedTickers.length * minWeight;

            if (remainingWeight >= totalMinNeeded) {
                selectedTickers.forEach(t => weights[t] = minWeight);
                let weightToDistribute = remainingWeight - totalMinNeeded;

                const rawWeights = selectedTickers.map(() => Math.random());
                const sum = rawWeights.reduce((a, b) => a + b, 0);

                selectedTickers.forEach((t, i) => {
                    weights[t] += (rawWeights[i] / sum) * weightToDistribute;
                });
            } else {
                const rawWeights = selectedTickers.map(() => Math.random());
                const sum = rawWeights.reduce((a, b) => a + b, 0);
                selectedTickers.forEach((t, i) => {
                    weights[t] = (rawWeights[i] / sum) * remainingWeight;
                });
            }
        }

        return repairWeights(weights, maxWeight, minWeight);
    }

    function generateDiscreteWeights(maxStocks, maxWeight, strictMode, availableTickers, priorityStockConfig, minWeight = 0) {
        const weights = {};
        const step = 0.05;
        const totalSteps = 20;

        let remainingSteps = totalSteps;
        let currentTickers = [...availableTickers];

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

        const selectedTickers = [];
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

    function mutateWeights(weights, maxWeight, mutationRate = 0.1, minWeight = 0) {
        const newWeights = { ...weights };
        const tickers = Object.keys(newWeights);

        if (Math.random() < mutationRate && tickers.length > 0) {
            const type = Math.random();

            if (type < 0.5 && tickers.length > 1) {
                const idx1 = Math.floor(Math.random() * tickers.length);
                let idx2 = Math.floor(Math.random() * tickers.length);
                while(idx1 === idx2) idx2 = Math.floor(Math.random() * tickers.length);

                const ticker1 = tickers[idx1];
                const ticker2 = tickers[idx2];

                const amount = Math.random() * 0.05;

                newWeights[ticker1] -= amount;
                newWeights[ticker2] += amount;
            } else {
                const idx = Math.floor(Math.random() * tickers.length);
                const ticker = tickers[idx];
                const newW = Math.random() * (maxWeight - minWeight) + minWeight;
                newWeights[ticker] = newW;
            }
        }

        return repairWeights(newWeights, maxWeight, minWeight);
    }

    function crossoverWeights(parentA, parentB, maxStocks, maxWeight = 1.0, minWeight = 0) {
        const child = {};
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
            const newChild = {};
            keptTickers.forEach(t => {
                newChild[t] = child[t];
            });
            return repairWeights(newChild, maxWeight, minWeight);
        }

        return repairWeights(child, maxWeight, minWeight);
    }

    function calculateRSquared(values) {
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

    function calculatePortfolioPerformance(weights, stockData, rebalanceMode = 'none', hedgeConfig = { enabled: false, shortMAPeriod: 20, longMAPeriod: 60, reentryStrategy: 'golden_cross', signalTicker: null }, dynamicRebalanceThreshold = 0.2, historyStep = 0) {
        const tickers = Object.keys(weights);
        const numPeriods = stockData.dates.length;

        const portfolioValues = [];
        const initialValue = 100;
        let currentValue = initialValue;
        let holdings = {};

        const dailyWeights = [];

        let shortMA = [];
        let longMA = [];
        let shortMAShortMA = [];
        let inCash = false;
        const cashPeriods = [];

        if (hedgeConfig.enabled) {
            let signalPrices = [];

            if (hedgeConfig.signalTicker && stockData.priceData[hedgeConfig.signalTicker]) {
                signalPrices = stockData.priceData[hedgeConfig.signalTicker];
            } else {
                for (let i = 0; i < numPeriods; i++) {
                    let sum = 0;
                    let count = 0;
                    for (const ticker of stockData.tickers) {
                        const prices = stockData.priceData[ticker];
                        const price = prices ? prices[i] : null;
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

        const invest = (value, period) => {
            tickers.forEach(ticker => {
                const prices = stockData.priceData[ticker];
                if (!prices) {
                    holdings[ticker] = 0;
                    return;
                }
                let price = prices[period];
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
            const currentSnapshot = {};

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
                    if (!prices) return;

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

        const validValues = [];
        for (const v of portfolioValues) {
            if (v !== null) validValues.push(v);
        }
        const returns = validValues.map(v => v / initialValue - 1);

        let peak = initialValue;
        const drawdowns = portfolioValues.map(v => {
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

    function calculateMonthlyReturns(portfolioValues, dates) {
        if (portfolioValues.length !== dates.length || dates.length === 0) return [];

        const lastIndexByMonth = {};

        dates.forEach((d, index) => {
            const date = new Date(d);
            if (isNaN(date.getTime())) return;

            const key = date.getFullYear() + '-' + (date.getMonth() + 1);
            lastIndexByMonth[key] = index;
        });

        const sortedKeys = Object.keys(lastIndexByMonth).sort((a, b) => {
            const [y1, m1] = a.split('-').map(Number);
            const [y2, m2] = b.split('-').map(Number);
            return y1 !== y2 ? y1 - y2 : m1 - m2;
        });

        const results = [];
        let previousValue = 100;

        sortedKeys.forEach(key => {
            const [year, month] = key.split('-').map(Number);
            const index = lastIndexByMonth[key];
            const currentValue = portfolioValues[index];

            const ret = previousValue !== 0 ? (currentValue - previousValue) / previousValue : 0;

            results.push({ year, month, value: ret });

            previousValue = currentValue;
        });

        return results;
    }

    function calculateCorrelationMatrix(stockData, tickers) {
        const n = tickers.length;
        if (n > 500) {
            return Array(n).fill(Array(n).fill(0));
        }

        const matrix = [];
        const returnsData = [];

        tickers.forEach(ticker => {
            const prices = stockData.priceData[ticker];
            const returns = [];
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
                    returns.push(0);
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

                const x = returnsData[i];
                const y = returnsData[j];

                let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
                const nCommon = x.length;

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

    function linearRegression(values) {
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

    function calculateStandardDeviation(values) {
        const n = values.length;
        if (n === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const squaredDiffs = values.map(v => (v - mean) ** 2);
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
        return Math.sqrt(variance);
    }

    function calculateAverage(values) {
        if (values.length === 0) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    function calculateStabilityScore(portfolioValues) {
        const maxSpikeThreshold = 0.08;
        const annualTradingDays = 252;
        const residualWeight = 0.6;
        const volatilityWeight = 0.4;

        const values = portfolioValues.filter(v => v !== null && !isNaN(v));
        const n = values.length;
        if (n < 20) return { score: 0, metrics: null, disqualified: true, reason: '數據不足' };

        const totalReturn = (values[n - 1] - values[0]) / values[0];
        const annualizedReturn = Math.pow(1 + totalReturn, annualTradingDays / n) - 1;

        const periodReturns = [];
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
                reason: '單期波動超標'
            };
        }

        const logValues = values.map(v => v > 0 ? Math.log(v) : 0);
        const { slope, intercept } = linearRegression(logValues);
        const trendLine = [];
        for (let i = 0; i < n; i++) {
            trendLine.push(Math.exp(intercept + slope * i));
        }

        const percentageDeviations = [];
        const signedDeviations = [];

        for (let i = 0; i < n; i++) {
            const trendVal = trendLine[i];
            if (trendVal <= 0.0001) {
                percentageDeviations.push(1);
                signedDeviations.push(0);
                continue;
            }
            const deviation = values[i] - trendVal;
            const percentDeviation = Math.abs(deviation / trendVal);

            signedDeviations.push(deviation / trendVal);
            percentageDeviations.push(percentDeviation);
        }

        const meanDeviation = signedDeviations.reduce((a,b) => a + b, 0) / n;
        const devVariance = signedDeviations.reduce((a,b) => a + Math.pow(b - meanDeviation, 2), 0) / n;
        const devStdDev = Math.sqrt(devVariance);

        const lastSignedDev = signedDeviations[n-1];
        const currentZScore = devStdDev > 0.000001 ? (lastSignedDev - meanDeviation) / devStdDev : 0;

        const maxResidual = Math.max(...percentageDeviations);
        const sumSquaredDeviations = percentageDeviations.reduce((sum, d) => sum + d * d, 0);
        const symmetricUlcerIndex = Math.sqrt(sumSquaredDeviations / n);

        const rollingWindow = Math.min(20, Math.floor(n / 5));
        const rollingStdDevs = [];
        for (let i = rollingWindow; i < periodReturns.length; i++) {
            const windowReturns = periodReturns.slice(i - rollingWindow, i);
            const std = calculateStandardDeviation(windowReturns);
            rollingStdDevs.push(std);
        }
        const maxRollingStdDev = rollingStdDevs.length > 0 ? Math.max(...rollingStdDevs) : 0;

        const channelWidth = 0.03;
        const withinChannel = percentageDeviations.filter(d => d <= channelWidth).length;
        const channelConsistency = withinChannel / n;

        const baseScore = symmetricUlcerIndex > 0 ? annualizedReturn / symmetricUlcerIndex : 0;

        const residualPenalty = maxResidual > 0.05
            ? Math.max(0, 1 - (maxResidual - 0.05) * 5)
            : 1;

        const volatilityPenalty = maxRollingStdDev > 0.02
            ? Math.max(0, 1 - (maxRollingStdDev - 0.02) * 10)
            : 1;

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
                currentZScore
            },
            disqualified: false
        };
    }

    function detectFrequency(values, hintDays = 0) {
        const n = values.length;
        if (hintDays && hintDays > 0) {
            const pointsPerDay = n / hintDays;
            if (pointsPerDay > 4)  return 'hourly';
            if (pointsPerDay > 0.8) return 'daily';
            if (pointsPerDay > 0.15) return 'weekly';
            return 'monthly';
        }

        const logReturns = [];
        for (let i = 1; i < n; i++) {
            if(values[i] > 0 && values[i-1] > 0)
                logReturns.push(Math.log(values[i] / values[i - 1]));
        }

        if(logReturns.length === 0) return 'daily';

        const mean = logReturns.reduce((s, x) => s + x, 0) / logReturns.length;
        const variance = logReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / logReturns.length;
        const stdDev = Math.sqrt(variance);

        if (stdDev < 0.008) return 'hourly';
        if (stdDev < 0.025) return 'daily';
        if (stdDev < 0.050) return 'weekly';
        return 'monthly';
    }

    function calculateCVaRPenalty(logReturns) {
        const sorted = [...logReturns].sort((a, b) => a - b);
        const tail = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.05)));
        if (tail.length === 0) return 1;
        const cvar = tail.reduce((s, x) => s + x, 0) / tail.length;
        return Math.exp(cvar * 10);
    }

    function calculateChannelScore(values) {
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
        return Math.exp(-widthPct / 0.10);
    }

    function saturate(x, scale) {
        return x > 0 ? x / (x + scale) : 0;
    }

    function calculateSuperAI_v2_adaptive(input, cfg = {}) {
        const values = input.portfolioValues;
        const n = values.length;

        const FREQUENCY_MAP = {
            hourly:  { periodsPerYear: 252 * 6.5, typicalMaxMove: 0.02 },
            daily:   { periodsPerYear: 252,       typicalMaxMove: 0.05 },
            weekly:  { periodsPerYear: 52,        typicalMaxMove: 0.08 },
            monthly: { periodsPerYear: 12,        typicalMaxMove: 0.15 },
        };

        let freq = input.frequency;
        if (!freq || freq === 'auto') {
            freq = detectFrequency(values, input.totalDaysHint);
        }
        const freqConfig = FREQUENCY_MAP[freq] || FREQUENCY_MAP['daily'];
        const periodsPerYear = freqConfig.periodsPerYear;
        const sqrtPeriods = Math.sqrt(periodsPerYear);

        const logReturns = [];
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

        const negReturns = logReturns.filter(r => r < 0);
        const downDev = negReturns.length > 0
            ? Math.sqrt(negReturns.reduce((s, r) => s + r * r, 0) / negReturns.length) * sqrtPeriods
            : 0.001;

        const sharpe = annualVolatility > 0.001 ? annualReturn / annualVolatility : 0;
        const sortino = downDev > 0.001 ? annualReturn / downDev : 3;

        let peak = values[0];
        let maxDD = 0;
        for (const v of values) {
            if (v > peak) peak = v;
            const dd = (peak - v) / peak;
            if (dd > maxDD) maxDD = dd;
        }
        const calmar = maxDD > 0.001 ? annualReturn / maxDD : 0;

        const maxUp = Math.max(...logReturns);
        const maxDown = Math.min(...logReturns);
        const maxMove = Math.max(Math.abs(maxUp), Math.abs(maxDown));
        const maxMovePct = Math.exp(maxMove) - 1;

        const smoothness = calculateRSquared(values);

        const maxAllowedDrawdown = cfg.maxAllowedDrawdown || 0.25;
        const minRequiredAnnualReturn = cfg.minRequiredAnnualReturn || 0.05;
        const maxAllowedMove = cfg.maxSinglePeriodMove || (freqConfig.typicalMaxMove * 2);
        const minSmoothness = cfg.minSmoothness || 0.85;

        if (maxDD > maxAllowedDrawdown) return { score: -9000, disqualified: true, reason: 'MaxDD Exceeded' };
        if (annualReturn < minRequiredAnnualReturn) return { score: -9001, disqualified: true, reason: 'Low Return' };
        if (maxMovePct > maxAllowedMove) return { score: -9002, disqualified: true, reason: 'High Volatility Spike' };
        if (smoothness < minSmoothness) return { score: -9003, disqualified: true, reason: 'Low Smoothness' };

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
            metrics: { sortino, calmar, smoothness, channelWidthPct: 0 }
        };
    }

    // ============================================
    // WORKER MAIN LOGIC
    // ============================================

    const tournamentSelection = (pop, k) => {
        let best = null;
        for (let i = 0; i < k; i++) {
            const ind = pop[Math.floor(Math.random() * pop.length)];
            if (best === null || ind.score > best.score) {
                best = ind;
            }
        }
        return best;
    };

    self.onmessage = (e) => {
        const { stockData, settings, simulations, workerId } = e.data;

        try {
            let correlationMatrix = null;

            const stockMetrics = {};
            stockData.tickers.forEach(ticker => {
                const metrics = calculateMetrics(stockData.priceData[ticker], stockData.dates);
                if (metrics) {
                    stockMetrics[ticker] = metrics;
                }
            });
            const availableTickers = Object.keys(stockMetrics);

            let bestScore = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget === 'target_return_mindd' || settings.optimizeTarget.includes('winrate') ? Infinity : -Infinity;
            let bestPortfolio = null;
            let localValidCount = 0;
            let scatterPointsBuffer = [];
            let userPortfolioResult = null;

            const isGenetic = settings.optimizationAlgorithm === 'genetic';
            const isGrid = settings.optimizationAlgorithm === 'grid';

            const populationSize = Math.min(500, simulations / 5);
            let population = [];

            const evaluatePortfolio = (weights, explicitSettings = null) => {
                const rebalanceMode = explicitSettings ? explicitSettings.rebalanceMode : settings.rebalanceMode;
                const hedgeConfig = explicitSettings ? explicitSettings.hedgeConfig : settings.hedgeConfig;
                const dynamicThreshold = explicitSettings ? explicitSettings.dynamicRebalanceThreshold : settings.dynamicRebalanceThreshold;

                let performance = calculatePortfolioPerformance(
                    weights,
                    stockData,
                    rebalanceMode,
                    hedgeConfig,
                    dynamicThreshold,
                    0
                );

                const pValues = performance.portfolioValues.filter(v => v !== null);
                if (pValues.length < 2) return null;

                const startDate = new Date(stockData.dates[0]);
                const endDate = new Date(stockData.dates[stockData.dates.length - 1]);
                let years = 1;

                if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                    years = diffTime / (1000 * 60 * 60 * 24 * 365.25);
                }

                if (years < 0.0027) {
                    years = pValues.length / 252;
                }

                const periodsPerYear = pValues.length / years;

                const totalReturn = (pValues[pValues.length - 1] - pValues[0]) / pValues[0];
                const cagr = Math.pow(1 + totalReturn, 1 / years) - 1;

                const dailyReturns = [];
                for(let j=1; j<pValues.length; j++) {
                    dailyReturns.push((pValues[j] - pValues[j-1]) / pValues[j-1]);
                }
                const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
                const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;

                const volatility = Math.sqrt(variance) * Math.sqrt(periodsPerYear);

                const ddValues = performance.drawdowns.filter(d => d !== null);
                const maxDD = ddValues.length > 0 ? Math.abs(Math.min(...ddValues)) / 100 : 0;

                const sharpe = volatility > 0 ? cagr / volatility : 0;

                const downReturns = dailyReturns.filter(r => r < 0);
                const downVariance = downReturns.length > 1 ? downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length : 0;

                const downVol = Math.sqrt(downVariance) * Math.sqrt(periodsPerYear);
                const sortino = downVol > 0 ? cagr / downVol : 0;

                const metrics = {
                    cagr: isNaN(cagr) ? 0 : cagr,
                    maxDD: isNaN(maxDD) ? 0 : maxDD,
                    volatility: isNaN(volatility) ? 0 : volatility,
                    sharpe: isNaN(sharpe) ? 0 : sharpe,
                    sortino: isNaN(sortino) ? 0 : sortino,
                    calmar: maxDD > 0 ? cagr / maxDD : 0,
                    smoothness: performance.smoothness,
                    winRate: performance.winRate,
                    totalReturn: totalReturn,
                    duration: years
                };

                let score;
                switch(settings.optimizeTarget) {
                    case 'sharpe': score = metrics.sharpe; break;
                    case 'cagr': score = metrics.cagr; break;
                    case 'calmar': score = metrics.calmar; break;
                    case 'sortino': score = metrics.sortino; break;
                    case 'min_dd': score = metrics.maxDD; break;
                    case 'smoothness': score = metrics.smoothness || 0; break;
                    case 'winrate': score = -(metrics.winRate || 0); break;
                    case 'ultra_smooth_v1':
                        score = Math.pow(metrics.smoothness || 0, 2) *
                                Math.pow(1 - (metrics.maxDD || 0), 2) *
                                (metrics.winRate || 0);
                        break;
                    case 'ultra_smooth':
                        const stability = calculateStabilityScore(pValues);
                        if (stability.disqualified) {
                            score = -9999;
                        } else {
                            score = stability.score;
                            metrics.smoothness = stability.metrics.channelConsistency;
                        }
                        break;
                    case 'ultra_smooth_v3':
                        const s3 = calculateStabilityScore(pValues);
                        if (s3.disqualified) {
                            score = -9999;
                        } else {
                            let baseScore = s3.score;
                            const z = s3.metrics.currentZScore;

                            if (z > 0.1) {
                                score = baseScore * 0.1;
                            } else {
                                score = baseScore * (1 + Math.abs(z));
                            }
                            metrics.smoothness = s3.metrics.channelConsistency;
                        }
                        break;
                    case 'super_ai_v2':
                        const totalDaysHint = years * 365;
                        const v2Result = calculateSuperAI_v2_adaptive({
                            portfolioValues: pValues,
                            frequency: 'auto',
                            totalDaysHint: totalDaysHint
                        }, {
                            maxAllowedDrawdown: 0.25,
                            minRequiredAnnualReturn: 0.05,
                            minSmoothness: 0.85
                        });

                        if (v2Result.disqualified) {
                            score = v2Result.score;
                        } else {
                            score = v2Result.score;
                            metrics.smoothness = v2Result.metrics.smoothness;
                            metrics.sortino = v2Result.metrics.sortino;
                        }
                        break;
                    case 'target_return_mindd':
                        score = (metrics.cagr >= settings.targetCAGR) ? metrics.maxDD : 1 + (settings.targetCAGR - metrics.cagr);
                        break;
                    case 'target_return_smooth':
                        score = (metrics.cagr >= settings.targetCAGR) ? -(metrics.smoothness || 0) : 1 + (settings.targetCAGR - metrics.cagr);
                        break;
                    case 'target_return_winrate':
                        score = (metrics.cagr >= settings.targetCAGR) ? -(metrics.winRate || 0) : 1 + (settings.targetCAGR - metrics.cagr);
                        break;
                    default:
                        score = (metrics.sharpe * 0.6) + (metrics.calmar * 0.2) + (metrics.smoothness * 0.2);
                        break;
                }

                return { weights, metrics, score, performance };
            };

            if (settings.userPortfolio && Object.keys(settings.userPortfolio).length > 0) {
                const benchmarkSettings = {
                    rebalanceMode: 'quarterly',
                    hedgeConfig: { enabled: false, shortMAPeriod: 0, longMAPeriod: 0, reentryStrategy: 'golden_cross' },
                    dynamicRebalanceThreshold: 0
                };

                const uRes = evaluatePortfolio(settings.userPortfolio, benchmarkSettings);
                if (uRes) {
                    userPortfolioResult = {
                        x: uRes.metrics.maxDD,
                        y: uRes.metrics.cagr,
                        weights: uRes.weights,
                        metrics: uRes.metrics,
                        label: 'Original'
                    };
                }
            }

            let iterations = isGenetic ? Math.ceil(simulations / populationSize) : simulations;

            if (isGenetic) {
                if (settings.userPortfolio && Object.keys(settings.userPortfolio).length > 0) {
                     const seed = evaluatePortfolio(settings.userPortfolio);
                     if(seed) population.push(seed);
                }

                while(population.length < populationSize) {
                    const weights = generateRandomWeights(
                        settings.maxStocks,
                        settings.maxWeight,
                        settings.strictMode,
                        availableTickers,
                        settings.priorityStockConfig,
                        settings.minWeight
                    );
                    const res = evaluatePortfolio(weights);
                    if (res) population.push(res);
                }
            }

            for (let i = 0; i < iterations; i++) {
                let result;

                if (isGenetic) {
                     const betterLower = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget.startsWith('target_return');
                     population.sort((a, b) => betterLower ? a.score - b.score : b.score - a.score);

                     const currentBest = population[0];
                     const isImprovement = betterLower ? (currentBest.score < bestScore) : (currentBest.score > bestScore);
                     if (bestPortfolio === null || isImprovement) {
                        bestScore = currentBest.score;
                        bestPortfolio = { ...currentBest, stockMetrics, cashPeriods: currentBest.performance.cashPeriods };
                     }

                     for(let k=0; k<5 && k<population.length; k++) {
                         scatterPointsBuffer.push({
                             x: population[k].metrics.maxDD,
                             y: population[k].metrics.cagr,
                             weights: population[k].weights,
                             metrics: population[k].metrics
                         });
                     }

                     const nextGen = [];
                     const eliteCount = Math.floor(populationSize * 0.05);
                     for(let j=0; j<eliteCount; j++) nextGen.push(population[j]);

                     while(nextGen.length < populationSize) {
                         const parentA = tournamentSelection(population, 3);
                         const parentB = tournamentSelection(population, 3);

                         let childWeights = crossoverWeights(
                            parentA.weights,
                            parentB.weights,
                            settings.maxStocks,
                            settings.maxWeight,
                            settings.minWeight
                        );
                         childWeights = mutateWeights(childWeights, settings.maxWeight, 0.2, settings.minWeight);

                         const res = evaluatePortfolio(childWeights);
                         if(res) nextGen.push(res);
                     }
                     population = nextGen;
                     localValidCount += populationSize;

                } else {
                    let weights;
                    if (isGrid) {
                        weights = generateDiscreteWeights(
                            settings.maxStocks,
                            settings.maxWeight,
                            settings.strictMode,
                            availableTickers,
                            settings.priorityStockConfig,
                            settings.minWeight
                        );
                    } else {
                        weights = generateRandomWeights(
                            settings.maxStocks,
                            settings.maxWeight,
                            settings.strictMode,
                            availableTickers,
                            settings.priorityStockConfig,
                            settings.minWeight
                        );
                    }

                    if (Object.keys(weights).length === 0) continue;

                    result = evaluatePortfolio(weights);
                    if (!result) continue;

                    if (result.metrics.cagr >= settings.cagrThreshold && result.metrics.maxDD <= settings.maxDDThreshold && result.metrics.sharpe >= settings.sharpeThreshold) {
                        localValidCount++;
                    }

                    if (i % 20 === 0) {
                        scatterPointsBuffer.push({
                            x: result.metrics.maxDD,
                            y: result.metrics.cagr,
                            weights: result.weights,
                            metrics: result.metrics
                        });
                    }

                    const isImprovement = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget.startsWith('target_return')
                        ? (result.score < bestScore)
                        : (result.score > bestScore);

                    if (bestPortfolio === null || isImprovement) {
                        bestScore = result.score;
                        bestPortfolio = { ...result, stockMetrics, cashPeriods: result.performance.cashPeriods };
                    }
                }

                if (i % (isGenetic ? 10 : 1000) === 0 && i > 0) {
                     const simIncrement = isGenetic ? populationSize * 10 : 1000;
                     self.postMessage({
                         type: 'progress',
                         workerId,
                         simCount: simIncrement,
                         validCount: localValidCount,
                         bestScore,
                         bestPortfolio: bestPortfolio ? { ...bestPortfolio, correlationMatrix: null, userPortfolioResult } : null,
                         scatterChunk: scatterPointsBuffer
                     });
                     localValidCount = 0;
                     scatterPointsBuffer = [];
                }
            }

            if (bestPortfolio) {
                bestPortfolio.monthlyReturns = calculateMonthlyReturns(bestPortfolio.performance.portfolioValues, stockData.dates);
                bestPortfolio.correlationMatrix = null;
                if(userPortfolioResult) bestPortfolio.userPortfolioResult = userPortfolioResult;
            }

            self.postMessage({
                type: 'progress',
                workerId,
                simCount: 0,
                validCount: localValidCount,
                bestScore,
                bestPortfolio: bestPortfolio ? { ...bestPortfolio, correlationMatrix: null, userPortfolioResult } : null,
                scatterChunk: scatterPointsBuffer
            });

            self.postMessage({ type: 'complete', workerId });

        } catch(error) {
            self.postMessage({ type: 'error', message: error.message || 'An unknown error occurred in the worker' });
        }
    };
    `;
};

// Worker management
let activeWorkers: Worker[] = [];
let isOptimizing = false;

export const runOptimizationWorkers = (
  stockData: any,
  settings: any,
  onProgress: (update: any) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const numWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
    const simulationsPerWorker = Math.floor(settings.simulations / numWorkers);

    let completedWorkers = 0;
    let totalSimCount = 0;
    let totalValidCount = 0;
    let globalBestScore = (settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget.startsWith('target_return')) ? Infinity : -Infinity;
    let globalBestPortfolio: any = null;

    isOptimizing = true;
    activeWorkers = [];

    const workerCode = createWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < numWorkers; i++) {
      const worker = new Worker(workerUrl);
      activeWorkers.push(worker);

      worker.onmessage = (e) => {
        const { type, simCount, validCount, bestScore, bestPortfolio, scatterChunk, message } = e.data;

        if (type === 'progress') {
          totalSimCount += simCount || 0;
          totalValidCount += validCount || 0;

          const betterLower = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget.startsWith('target_return');
          const isImprovement = betterLower ? (bestScore < globalBestScore) : (bestScore > globalBestScore);

          if (bestPortfolio && isImprovement) {
            globalBestScore = bestScore;
            globalBestPortfolio = bestPortfolio;
          }

          const progress = (totalSimCount / settings.simulations) * 100;

          onProgress({
            type: 'progress',
            progress: Math.min(progress, 99),
            simCount: totalSimCount,
            totalValidCount,
            bestScore: globalBestScore,
            scatterChunk
          });
        } else if (type === 'complete') {
          completedWorkers++;

          if (completedWorkers === numWorkers) {
            activeWorkers = [];
            isOptimizing = false;
            URL.revokeObjectURL(workerUrl);

            onProgress({
              type: 'complete',
              bestPortfolio: globalBestPortfolio
            });
            resolve();
          }
        } else if (type === 'error') {
          onProgress({ type: 'error', message });
        }
      };

      worker.onerror = (error) => {
        console.error('Worker error:', error);
        onProgress({ type: 'error', message: error.message });
        reject(error);
      };

      worker.postMessage({
        stockData,
        settings: { ...settings, simulations: simulationsPerWorker },
        simulations: simulationsPerWorker,
        workerId: i
      });
    }
  });
};

export const stopOptimization = (): void => {
  if (isOptimizing) {
    activeWorkers.forEach(worker => worker.terminate());
    activeWorkers = [];
    isOptimizing = false;
  }
};
