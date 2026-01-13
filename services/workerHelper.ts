
import { calculateMetrics, calculatePortfolioMetrics, generateRandomWeights, generateDiscreteWeights, calculatePortfolioPerformance, mutateWeights, crossoverWeights, calculateCorrelationMatrix, calculateMonthlyReturns, repairWeights, calculateStabilityScore, linearRegression, calculateStandardDeviation, calculateAverage, calculateMA, calculateSuperAI_v2_adaptive, detectFrequency, calculateRSquared, calculateCVaRPenalty, calculateChannelScore, saturate } from './portfolioCalculator';

export const createWorkerCode = () => {
    return `
    // --- Injected Functions ---
    const calculateMA = ${calculateMA.toString()};
    const calculateMetrics = ${calculateMetrics.toString()};
    const calculatePortfolioMetrics = ${calculatePortfolioMetrics.toString()};
    const repairWeights = ${repairWeights.toString()};
    const generateRandomWeights = ${generateRandomWeights.toString()};
    const generateDiscreteWeights = ${generateDiscreteWeights.toString()};
    const calculatePortfolioPerformance = ${calculatePortfolioPerformance.toString()};
    const mutateWeights = ${mutateWeights.toString()};
    const crossoverWeights = ${crossoverWeights.toString()};
    const calculateCorrelationMatrix = ${calculateCorrelationMatrix.toString()};
    const calculateMonthlyReturns = ${calculateMonthlyReturns.toString()};
    const calculateStabilityScore = ${calculateStabilityScore.toString()};
    const linearRegression = ${linearRegression.toString()};
    const calculateStandardDeviation = ${calculateStandardDeviation.toString()};
    const calculateAverage = ${calculateAverage.toString()};
    
    // Super AI V2.0 Injections
    const calculateSuperAI_v2_adaptive = ${calculateSuperAI_v2_adaptive.toString()};
    const detectFrequency = ${detectFrequency.toString()};
    const calculateRSquared = ${calculateRSquared.toString()};
    const calculateCVaRPenalty = ${calculateCVaRPenalty.toString()};
    const calculateChannelScore = ${calculateChannelScore.toString()};
    const saturate = ${saturate.toString()};

    // --- Helpers for Worker ---
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

    // --- WASM Integration ---
    let wasmModule = null;
    let isAuthorized = 0;

    const initWasm = async (wasmBinary) => {
        if (wasmModule) return;
        const imports = {
            env: {
                abort: () => console.error("WASM Aborted")
            }
        };
        const { instance } = await WebAssembly.instantiate(wasmBinary, imports);
        wasmModule = instance.exports;
        
        // Domain Locking Check
        const domain = self.location.hostname;
        isAuthorized = wasmModule.checkDomain(domain);
    };

    // --- Worker Logic ---
    self.onmessage = async (e) => {
        const { stockData, settings, simulations, workerId, wasmBinary } = e.data;
        
        try {
            if (wasmBinary) {
                await initWasm(wasmBinary);
            }

            // PERFORMANCE FIX: Removed O(N^2) full correlation matrix calculation.
            // Calculating 1000x1000 matrix kills the worker. We only need it for the final portfolio if at all.
            let correlationMatrix = null;

            // 2. Pre-calculate stock metrics
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

            // Algorithm Selection
            const isGenetic = settings.optimizationAlgorithm === 'genetic';
            const isGrid = settings.optimizationAlgorithm === 'grid';

            // INCREASE POPULATION SIZE for better exploration (Expert Advice)
            const populationSize = Math.min(500, simulations / 5);
            let population = [];

            // Standardize evaluation logic
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
                    0 // Do not track weight history in worker to save memory
                );
                
                const pValues = performance.portfolioValues.filter(v => v !== null);
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
                        if (wasmModule) {
                            score = wasmModule.calculateUltraSmoothV1Score(
                                metrics.smoothness || 0,
                                metrics.maxDD || 0,
                                metrics.winRate || 0,
                                isAuthorized
                            );
                        } else {
                            score = Math.pow(metrics.smoothness || 0, 2) * 
                                    Math.pow(1 - (metrics.maxDD || 0), 2) * 
                                    (metrics.winRate || 0);
                        }
                        break;
                    case 'ultra_smooth':
                        const stability = calculateStabilityScore(pValues);
                        if (stability.disqualified) {
                            score = -9999;
                        } else {
                            if (wasmModule) {
                                score = wasmModule.calculateStabilityV2Score(
                                    stability.metrics.channelConsistency || 0,
                                    metrics.maxDD || 0,
                                    metrics.volatility || 0,
                                    isAuthorized
                                );
                            } else {
                                score = stability.score;
                            }
                            metrics.smoothness = stability.metrics.channelConsistency; 
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
                            if (wasmModule) {
                                score = wasmModule.calculateSuperAIScore(
                                    v2Result.metrics.sortino,
                                    v2Result.metrics.calmar,
                                    v2Result.metrics.smoothness,
                                    v2Result.metrics.channelComponent || 0.9,
                                    isAuthorized
                                );
                            } else {
                                score = v2Result.score;
                            }
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
                        if (wasmModule) {
                            score = wasmModule.calculateDefaultSuperAIScore(
                                metrics.sharpe || 0,
                                metrics.calmar || 0,
                                metrics.smoothness || 0,
                                isAuthorized
                            );
                        } else {
                            score = (metrics.sharpe * 0.6) + (metrics.calmar * 0.2) + (metrics.smoothness * 0.2);
                        }
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
                        settings.minWeight // Pass minWeight
                    );
                    const res = evaluatePortfolio(weights);
                    if (res) population.push(res);
                }
            }

            for (let i = 0; i < iterations; i++) {
                let result;

                if (isGenetic) {
                     const betterLower = settings.optimizeTarget.includes('min_dd') || settings.optimizeTarget.startsWith('target_return');
                     // Sort entire population first
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
                     // 1. ELITISM: Keep top 5% directly
                     const eliteCount = Math.floor(populationSize * 0.05);
                     for(let j=0; j<eliteCount; j++) nextGen.push(population[j]);

                     // 2. REPRODUCTION with TOURNAMENT SELECTION
                     while(nextGen.length < populationSize) {
                         // Tournament Selection (k=3)
                         const parentA = tournamentSelection(population, 3);
                         const parentB = tournamentSelection(population, 3);
                         
                         let childWeights = crossoverWeights(
                            parentA.weights, 
                            parentB.weights, 
                            settings.maxStocks, 
                            settings.maxWeight,
                            settings.minWeight
                        );
                         // Enhanced mutation with uniform reset support
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
                // We do NOT calculate correlationMatrix here for huge datasets. 
                // It should be calculated on demand in UI for top tickers only.
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
