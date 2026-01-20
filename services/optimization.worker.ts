import { 
    calculateMetrics, 
    calculatePortfolioMetrics, 
    generateRandomWeights, 
    generateDiscreteWeights, 
    calculatePortfolioPerformance, 
    mutateWeights, 
    crossoverWeights, 
    calculateCorrelationMatrix, 
    calculateMonthlyReturns, 
    repairWeights, 
    calculateStabilityScore, 
    linearRegression, 
    calculateStandardDeviation, 
    calculateAverage, 
    calculateMA, 
    calculateSuperAI_v2_adaptive, 
    detectFrequency, 
    calculateRSquared, 
    calculateCVaRPenalty, 
    calculateChannelScore, 
    saturate 
} from './portfolioCalculator';

// --- Helpers for Worker ---
const tournamentSelection = (pop: any[], k: number) => {
    let best = null;
    for (let i = 0; i < k; i++) {
        const ind = pop[Math.floor(Math.random() * pop.length)];
        if (best === null || ind.score > best.score) {
            best = ind;
        }
    }
    return best;
};

// --- Worker Logic ---
self.onmessage = (e) => {
    const { stockData, settings, simulations, workerId } = e.data;
    
    try {
        // 2. Pre-calculate stock metrics
        const stockMetrics: Record<string, any> = {};
        stockData.tickers.forEach((ticker: string) => {
            const metrics = calculateMetrics(stockData.priceData[ticker], stockData.dates);
            if (metrics) {
                stockMetrics[ticker] = metrics;
            }
        });
        const availableTickers = Object.keys(stockMetrics);

        let bestScore = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget === 'target_return_mindd' || settings.optimizeTarget.includes('winrate') ? Infinity : -Infinity;
        let bestPortfolio: any = null;
        let localValidCount = 0;
        let scatterPointsBuffer: any[] = [];
        let userPortfolioResult = null;

        // Algorithm Selection
        const isGenetic = settings.optimizationAlgorithm === 'genetic';
        const isGrid = settings.optimizationAlgorithm === 'grid';

        // INCREASE POPULATION SIZE for better exploration (Expert Advice)
        const populationSize = Math.min(500, simulations / 5);
        let population: any[] = [];

        // Standardize evaluation logic
        const evaluatePortfolio = (weights: any, explicitSettings: any = null) => {
            const rebalanceMode = explicitSettings ? explicitSettings.rebalanceMode : settings.rebalanceMode;
            const hedgeConfig = explicitSettings ? explicitSettings.hedgeConfig : settings.hedgeConfig;
            const dynamicThreshold = explicitSettings ? explicitSettings.dynamicRebalanceThreshold : settings.dynamicRebalanceThreshold;

            let performance = calculatePortfolioPerformance(
                weights, 
                stockData, 
                rebalanceMode, 
                hedgeConfig, 
                dynamicThreshold,
                0 // Do not track weight history in worker to save memory
            );
            
            const pValues = performance.portfolioValues.filter(v => v !== null) as number[];
            if (pValues.length < 2) return null;

            // --- ROBUST TIME-BASED CALCULATION ---
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
            
            const dailyReturns: number[] = [];
            for(let j=1; j<pValues.length; j++) {
                dailyReturns.push((pValues[j] - pValues[j-1]) / pValues[j-1]);
            }
            const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
            const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
            
            const volatility = Math.sqrt(variance) * Math.sqrt(periodsPerYear);

            const ddValues = performance.drawdowns.filter(d => d !== null) as number[];
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
                        metrics.smoothness = stability.metrics?.channelConsistency || 0; 
                    }
                    break;
                case 'ultra_smooth_v3':
                    const s3 = calculateStabilityScore(pValues);
                    if (s3.disqualified) {
                        score = -9999;
                    } else {
                        let baseScore = s3.score;
                        const z = s3.metrics?.currentZScore || 0;
                        if (z > 0.1) {
                            score = baseScore * 0.1;
                        } else {
                            score = baseScore * (1 + Math.abs(z));
                        }
                        metrics.smoothness = s3.metrics?.channelConsistency || 0;
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
                        metrics.smoothness = v2Result.metrics?.smoothness || 0;
                        metrics.sortino = v2Result.metrics?.sortino || 0;
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

        // --- User Portfolio Logic ---
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

        // Main Loop
        let iterations = isGenetic ? Math.ceil(simulations / populationSize) : simulations;
        
        // Init Population for Genetic
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

    } catch(error: any) {
        self.postMessage({ type: 'error', message: error.message || 'An unknown error occurred in the worker' });
    }
};
