// AssemblyScript module for portfolio optimization algorithms
// Compiled to WebAssembly for code protection

// ============================================
// MEMORY MANAGEMENT HELPERS
// ============================================

// Memory layout for passing arrays
let heapOffset: usize = 1024;

export function allocateF64Array(length: i32): usize {
  const ptr = heapOffset;
  heapOffset += (length as usize) * 8; // f64 = 8 bytes
  return ptr;
}

export function setF64(ptr: usize, index: i32, value: f64): void {
  store<f64>(ptr + (index as usize) * 8, value);
}

export function getF64(ptr: usize, index: i32): f64 {
  return load<f64>(ptr + (index as usize) * 8);
}

export function resetHeap(): void {
  heapOffset = 1024;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function sqrt(x: f64): f64 {
  return Math.sqrt(x);
}

function exp(x: f64): f64 {
  return Math.exp(x);
}

function log(x: f64): f64 {
  return Math.log(x);
}

function pow(base: f64, exponent: f64): f64 {
  return Math.pow(base, exponent);
}

function abs(x: f64): f64 {
  return Math.abs(x);
}

function max(a: f64, b: f64): f64 {
  return a > b ? a : b;
}

function min(a: f64, b: f64): f64 {
  return a < b ? a : b;
}

// ============================================
// LINEAR REGRESSION
// ============================================

export function linearRegression(valuesPtr: usize, n: i32, slopePtr: usize, interceptPtr: usize): void {
  let sumX: f64 = 0.0;
  let sumY: f64 = 0.0;
  let sumXY: f64 = 0.0;
  let sumX2: f64 = 0.0;

  for (let i: i32 = 0; i < n; i++) {
    const y = getF64(valuesPtr, i);
    const x = i as f64;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const nf = n as f64;
  const slope = (nf * sumXY - sumX * sumY) / (nf * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / nf;

  store<f64>(slopePtr, slope);
  store<f64>(interceptPtr, intercept);
}

// ============================================
// STANDARD DEVIATION
// ============================================

export function calculateStandardDeviation(valuesPtr: usize, n: i32): f64 {
  if (n == 0) return 0.0;

  let sum: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    sum += getF64(valuesPtr, i);
  }
  const mean = sum / (n as f64);

  let squaredDiffSum: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const diff = getF64(valuesPtr, i) - mean;
    squaredDiffSum += diff * diff;
  }

  return sqrt(squaredDiffSum / (n as f64));
}

// ============================================
// R-SQUARED CALCULATION
// ============================================

export function calculateRSquared(valuesPtr: usize, n: i32): f64 {
  if (n < 2) return 0.0;

  // Calculate log values
  let sumX: f64 = 0.0;
  let sumY: f64 = 0.0;
  let sumXY: f64 = 0.0;
  let sumXX: f64 = 0.0;

  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    const y = v > 0.0 ? log(v) : 0.0;
    const x = i as f64;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const nf = n as f64;
  const slope = (nf * sumXY - sumX * sumY) / (nf * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / nf;

  let ssTot: f64 = 0.0;
  let ssRes: f64 = 0.0;
  const meanY = sumY / nf;

  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    const y = v > 0.0 ? log(v) : 0.0;
    const predicted = intercept + slope * (i as f64);
    ssTot += (y - meanY) * (y - meanY);
    ssRes += (y - predicted) * (y - predicted);
  }

  return ssTot > 0.0 ? 1.0 - ssRes / ssTot : 0.0;
}

// ============================================
// CHANNEL SCORE
// ============================================

export function calculateChannelScore(valuesPtr: usize, n: i32): f64 {
  // Calculate log regression
  let sumX: f64 = 0.0;
  let sumY: f64 = 0.0;
  let sumXY: f64 = 0.0;
  let sumXX: f64 = 0.0;

  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    const y = v > 0.0 ? log(v) : 0.0;
    const x = i as f64;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const nf = n as f64;
  const slope = (nf * sumXY - sumX * sumY) / (nf * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / nf;

  let maxDev: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    const y = v > 0.0 ? log(v) : 0.0;
    const predicted = intercept + slope * (i as f64);
    const dev = abs(y - predicted);
    if (dev > maxDev) maxDev = dev;
  }

  const widthPct = (exp(maxDev) - 1.0) * 2.0;
  return exp(-widthPct / 0.10);
}

// ============================================
// CVaR PENALTY
// ============================================

export function calculateCVaRPenalty(logReturnsPtr: usize, n: i32): f64 {
  if (n == 0) return 1.0;

  // Simple bubble sort for small arrays (typical size ~250)
  // Copy to temp array for sorting
  const tempPtr = allocateF64Array(n);
  for (let i: i32 = 0; i < n; i++) {
    setF64(tempPtr, i, getF64(logReturnsPtr, i));
  }

  // Sort ascending
  for (let i: i32 = 0; i < n - 1; i++) {
    for (let j: i32 = 0; j < n - i - 1; j++) {
      if (getF64(tempPtr, j) > getF64(tempPtr, j + 1)) {
        const temp = getF64(tempPtr, j);
        setF64(tempPtr, j, getF64(tempPtr, j + 1));
        setF64(tempPtr, j + 1, temp);
      }
    }
  }

  // Take bottom 5%
  let tailCount = (n as f64) * 0.05;
  if (tailCount < 1.0) tailCount = 1.0;
  const tailN = tailCount as i32;

  let tailSum: f64 = 0.0;
  for (let i: i32 = 0; i < tailN; i++) {
    tailSum += getF64(tempPtr, i);
  }

  const cvar = tailSum / (tailN as f64);
  return exp(cvar * 10.0);
}

// ============================================
// SATURATE FUNCTION
// ============================================

export function saturate(x: f64, scale: f64): f64 {
  return x > 0.0 ? x / (x + scale) : 0.0;
}

// ============================================
// DETECT FREQUENCY
// ============================================

export function detectFrequency(valuesPtr: usize, n: i32, hintDays: f64): i32 {
  // Returns: 0=hourly, 1=daily, 2=weekly, 3=monthly

  if (hintDays > 0.0) {
    const pointsPerDay = (n as f64) / hintDays;
    if (pointsPerDay > 4.0) return 0;  // hourly
    if (pointsPerDay > 0.8) return 1;  // daily
    if (pointsPerDay > 0.15) return 2; // weekly
    return 3; // monthly
  }

  // Calculate log returns std dev
  let logReturnsSum: f64 = 0.0;
  let count: i32 = 0;

  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    if (curr > 0.0 && prev > 0.0) {
      logReturnsSum += log(curr / prev);
      count++;
    }
  }

  if (count == 0) return 1; // default daily

  const mean = logReturnsSum / (count as f64);

  let variance: f64 = 0.0;
  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    if (curr > 0.0 && prev > 0.0) {
      const lr = log(curr / prev);
      variance += (lr - mean) * (lr - mean);
    }
  }
  variance /= count as f64;
  const stdDev = sqrt(variance);

  if (stdDev < 0.008) return 0;  // hourly
  if (stdDev < 0.025) return 1;  // daily
  if (stdDev < 0.050) return 2;  // weekly
  return 3; // monthly
}

// ============================================
// SUPER AI V2.0 ALGORITHM (六邊形戰士)
// ============================================

// Result structure stored at fixed memory location
// [0]: score, [1]: disqualified (0/1), [2]: returnComponent, [3]: riskComponent,
// [4]: stabilityComponent, [5]: channelComponent, [6]: sortino, [7]: calmar, [8]: smoothness

export function calculateSuperAI_v2(
  valuesPtr: usize,
  n: i32,
  totalDaysHint: f64,
  maxAllowedDrawdown: f64,
  minRequiredAnnualReturn: f64,
  maxSinglePeriodMove: f64,
  minSmoothness: f64,
  resultPtr: usize
): void {
  // Initialize result
  for (let i: i32 = 0; i < 9; i++) {
    setF64(resultPtr, i, 0.0);
  }

  if (n < 2) {
    setF64(resultPtr, 0, -9999.0); // score
    setF64(resultPtr, 1, 1.0); // disqualified
    return;
  }

  // Frequency detection
  const freqType = detectFrequency(valuesPtr, n, totalDaysHint);

  // Frequency config
  let periodsPerYear: f64;
  let typicalMaxMove: f64;

  if (freqType == 0) { // hourly
    periodsPerYear = 252.0 * 6.5;
    typicalMaxMove = 0.02;
  } else if (freqType == 1) { // daily
    periodsPerYear = 252.0;
    typicalMaxMove = 0.05;
  } else if (freqType == 2) { // weekly
    periodsPerYear = 52.0;
    typicalMaxMove = 0.08;
  } else { // monthly
    periodsPerYear = 12.0;
    typicalMaxMove = 0.15;
  }

  const sqrtPeriods = sqrt(periodsPerYear);

  // Calculate log returns
  const logReturnsPtr = allocateF64Array(n - 1);
  let logReturnsCount: i32 = 0;

  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    if (curr > 0.0 && prev > 0.0) {
      setF64(logReturnsPtr, logReturnsCount, log(curr / prev));
      logReturnsCount++;
    } else {
      setF64(logReturnsPtr, logReturnsCount, 0.0);
      logReturnsCount++;
    }
  }

  if (logReturnsCount == 0) {
    setF64(resultPtr, 0, -9999.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }

  // Mean and variance
  let meanReturn: f64 = 0.0;
  for (let i: i32 = 0; i < logReturnsCount; i++) {
    meanReturn += getF64(logReturnsPtr, i);
  }
  meanReturn /= logReturnsCount as f64;

  let variance: f64 = 0.0;
  for (let i: i32 = 0; i < logReturnsCount; i++) {
    const diff = getF64(logReturnsPtr, i) - meanReturn;
    variance += diff * diff;
  }
  variance /= logReturnsCount as f64;
  const stdDev = sqrt(variance);

  const annualReturn = meanReturn * periodsPerYear;
  const annualVolatility = stdDev * sqrtPeriods;

  // Downside deviation for Sortino
  let downSum: f64 = 0.0;
  let downCount: i32 = 0;
  for (let i: i32 = 0; i < logReturnsCount; i++) {
    const r = getF64(logReturnsPtr, i);
    if (r < 0.0) {
      downSum += r * r;
      downCount++;
    }
  }

  let downDev: f64 = 0.001;
  if (downCount > 0) {
    downDev = sqrt(downSum / (downCount as f64)) * sqrtPeriods;
  }

  const sharpe = annualVolatility > 0.001 ? annualReturn / annualVolatility : 0.0;
  const sortino = downDev > 0.001 ? annualReturn / downDev : 3.0;

  // Max Drawdown
  let peak = getF64(valuesPtr, 0);
  let maxDD: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  const calmar = maxDD > 0.001 ? annualReturn / maxDD : 0.0;

  // Max single period move
  let maxUp: f64 = -999999.0;
  let maxDown: f64 = 999999.0;
  for (let i: i32 = 0; i < logReturnsCount; i++) {
    const r = getF64(logReturnsPtr, i);
    if (r > maxUp) maxUp = r;
    if (r < maxDown) maxDown = r;
  }

  const maxMove = max(abs(maxUp), abs(maxDown));
  const maxMovePct = exp(maxMove) - 1.0;

  // Smoothness (R-squared)
  const smoothness = calculateRSquared(valuesPtr, n);

  // Gatekeeping
  const maxAllowedMove = maxSinglePeriodMove > 0.0 ? maxSinglePeriodMove : typicalMaxMove * 2.0;

  if (maxDD > maxAllowedDrawdown) {
    setF64(resultPtr, 0, -9000.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }
  if (annualReturn < minRequiredAnnualReturn) {
    setF64(resultPtr, 0, -9001.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }
  if (maxMovePct > maxAllowedMove) {
    setF64(resultPtr, 0, -9002.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }
  if (smoothness < minSmoothness) {
    setF64(resultPtr, 0, -9003.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }

  // Scoring (Geometric Product)
  const returnComponent = saturate(sortino, 4.0);
  const cvarPenalty = calculateCVaRPenalty(logReturnsPtr, logReturnsCount);
  const riskComponent = saturate(calmar, 4.0) * cvarPenalty;
  const stabilityComponent = pow(smoothness, 2.0);
  const channelComponent = calculateChannelScore(valuesPtr, n);

  const score = pow(returnComponent, 0.4)
              * pow(riskComponent, 0.3)
              * pow(stabilityComponent, 0.2)
              * pow(channelComponent, 0.1)
              * 100.0;

  // Store results
  setF64(resultPtr, 0, score);
  setF64(resultPtr, 1, 0.0); // not disqualified
  setF64(resultPtr, 2, returnComponent);
  setF64(resultPtr, 3, riskComponent);
  setF64(resultPtr, 4, stabilityComponent);
  setF64(resultPtr, 5, channelComponent);
  setF64(resultPtr, 6, sortino);
  setF64(resultPtr, 7, calmar);
  setF64(resultPtr, 8, smoothness);
}

// ============================================
// ULTRA SMOOTH V2 ALGORITHM (雙向波動通道)
// ============================================

// Result structure stored at fixed memory location
// [0]: score, [1]: disqualified (0/1), [2]: symmetricUlcerIndex, [3]: maxResidual,
// [4]: maxRollingStdDev, [5]: channelConsistency, [6]: currentZScore, [7]: annualizedReturn

export function calculateUltraSmoothV2(
  valuesPtr: usize,
  n: i32,
  maxSpikeThreshold: f64,
  resultPtr: usize
): void {
  const annualTradingDays: f64 = 252.0;
  const residualWeight: f64 = 0.6;
  const volatilityWeight: f64 = 0.4;

  // Initialize result
  for (let i: i32 = 0; i < 8; i++) {
    setF64(resultPtr, i, 0.0);
  }

  if (n < 20) {
    setF64(resultPtr, 0, 0.0);
    setF64(resultPtr, 1, 1.0);
    return;
  }

  // Basic return
  const firstVal = getF64(valuesPtr, 0);
  const lastVal = getF64(valuesPtr, n - 1);
  const totalReturn = (lastVal - firstVal) / firstVal;
  const nf = n as f64;
  const annualizedReturn = pow(1.0 + totalReturn, annualTradingDays / nf) - 1.0;

  // Period returns & spike detection
  const periodReturnsPtr = allocateF64Array(n - 1);
  let maxUp: f64 = -999999.0;
  let maxDown: f64 = 999999.0;

  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    const ret = (curr - prev) / prev;
    setF64(periodReturnsPtr, i - 1, ret);
    if (ret > maxUp) maxUp = ret;
    if (ret < maxDown) maxDown = ret;
  }

  // Spike check
  if (maxUp > maxSpikeThreshold || maxDown < -maxSpikeThreshold) {
    setF64(resultPtr, 0, 0.0);
    setF64(resultPtr, 1, 1.0);
    setF64(resultPtr, 7, annualizedReturn);
    return;
  }

  // Log regression
  const logValuesPtr = allocateF64Array(n);
  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    setF64(logValuesPtr, i, v > 0.0 ? log(v) : 0.0);
  }

  const slopePtr = allocateF64Array(1);
  const interceptPtr = allocateF64Array(1);
  linearRegression(logValuesPtr, n, slopePtr, interceptPtr);

  const slope = getF64(slopePtr, 0);
  const intercept = getF64(interceptPtr, 0);

  // Calculate residuals and deviations
  const percentageDeviationsPtr = allocateF64Array(n);
  const signedDeviationsPtr = allocateF64Array(n);

  for (let i: i32 = 0; i < n; i++) {
    const trendVal = exp(intercept + slope * (i as f64));
    const actualVal = getF64(valuesPtr, i);

    if (trendVal <= 0.0001) {
      setF64(percentageDeviationsPtr, i, 1.0);
      setF64(signedDeviationsPtr, i, 0.0);
      continue;
    }

    const deviation = actualVal - trendVal;
    const percentDeviation = abs(deviation / trendVal);
    const signedDeviation = deviation / trendVal;

    setF64(percentageDeviationsPtr, i, percentDeviation);
    setF64(signedDeviationsPtr, i, signedDeviation);
  }

  // Z-Score calculation
  let meanDev: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    meanDev += getF64(signedDeviationsPtr, i);
  }
  meanDev /= nf;

  let devVariance: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const diff = getF64(signedDeviationsPtr, i) - meanDev;
    devVariance += diff * diff;
  }
  devVariance /= nf;
  const devStdDev = sqrt(devVariance);

  const lastSignedDev = getF64(signedDeviationsPtr, n - 1);
  const currentZScore = devStdDev > 0.000001 ? (lastSignedDev - meanDev) / devStdDev : 0.0;

  // Max residual
  let maxResidual: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const d = getF64(percentageDeviationsPtr, i);
    if (d > maxResidual) maxResidual = d;
  }

  // Symmetric Ulcer Index
  let sumSquaredDev: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const d = getF64(percentageDeviationsPtr, i);
    sumSquaredDev += d * d;
  }
  const symmetricUlcerIndex = sqrt(sumSquaredDev / nf);

  // Rolling volatility
  let rollingWindow: i32 = 20;
  if (rollingWindow > n / 5) {
    rollingWindow = n / 5;
  }

  let maxRollingStdDev: f64 = 0.0;
  const windowReturnsPtr = allocateF64Array(rollingWindow);

  for (let i: i32 = rollingWindow; i < n - 1; i++) {
    // Fill window
    for (let j: i32 = 0; j < rollingWindow; j++) {
      setF64(windowReturnsPtr, j, getF64(periodReturnsPtr, i - rollingWindow + j));
    }
    const std = calculateStandardDeviation(windowReturnsPtr, rollingWindow);
    if (std > maxRollingStdDev) maxRollingStdDev = std;
  }

  // Channel consistency
  const channelWidth: f64 = 0.03;
  let withinChannel: i32 = 0;
  for (let i: i32 = 0; i < n; i++) {
    if (getF64(percentageDeviationsPtr, i) <= channelWidth) {
      withinChannel++;
    }
  }
  const channelConsistency = (withinChannel as f64) / nf;

  // Final score
  const baseScore = symmetricUlcerIndex > 0.0 ? annualizedReturn / symmetricUlcerIndex : 0.0;

  let residualPenalty: f64 = 1.0;
  if (maxResidual > 0.05) {
    residualPenalty = max(0.0, 1.0 - (maxResidual - 0.05) * 5.0);
  }

  let volatilityPenalty: f64 = 1.0;
  if (maxRollingStdDev > 0.02) {
    volatilityPenalty = max(0.0, 1.0 - (maxRollingStdDev - 0.02) * 10.0);
  }

  const finalScore = baseScore
    * (residualPenalty * residualWeight + volatilityPenalty * volatilityWeight)
    * (0.5 + 0.5 * channelConsistency);

  // Store results
  setF64(resultPtr, 0, max(0.0, finalScore));
  setF64(resultPtr, 1, 0.0); // not disqualified
  setF64(resultPtr, 2, symmetricUlcerIndex);
  setF64(resultPtr, 3, maxResidual);
  setF64(resultPtr, 4, maxRollingStdDev);
  setF64(resultPtr, 5, channelConsistency);
  setF64(resultPtr, 6, currentZScore);
  setF64(resultPtr, 7, annualizedReturn);
}

// ============================================
// SUPER AI V1 ALGORITHM (終極多維度)
// ============================================

// Result: [0]: score, [1]: sharpe, [2]: calmar, [3]: smoothness

export function calculateSuperAI_v1(
  valuesPtr: usize,
  n: i32,
  resultPtr: usize
): void {
  // Initialize result
  for (let i: i32 = 0; i < 4; i++) {
    setF64(resultPtr, i, 0.0);
  }

  if (n < 2) {
    return;
  }

  const periodsPerYear: f64 = 252.0;
  const sqrtPeriods = sqrt(periodsPerYear);

  // Calculate daily returns
  let sumReturns: f64 = 0.0;
  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    if (prev > 0.0) {
      sumReturns += (curr - prev) / prev;
    }
  }
  const avgReturn = sumReturns / ((n - 1) as f64);

  // Variance
  let variance: f64 = 0.0;
  for (let i: i32 = 1; i < n; i++) {
    const curr = getF64(valuesPtr, i);
    const prev = getF64(valuesPtr, i - 1);
    if (prev > 0.0) {
      const ret = (curr - prev) / prev;
      variance += (ret - avgReturn) * (ret - avgReturn);
    }
  }
  variance /= (n - 1) as f64;
  const volatility = sqrt(variance) * sqrtPeriods;

  // CAGR
  const firstVal = getF64(valuesPtr, 0);
  const lastVal = getF64(valuesPtr, n - 1);
  const totalReturn = (lastVal - firstVal) / firstVal;
  const years = (n as f64) / periodsPerYear;
  const cagr = pow(1.0 + totalReturn, 1.0 / years) - 1.0;

  // Max Drawdown
  let peak = firstVal;
  let maxDD: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // Metrics
  const sharpe = volatility > 0.001 ? cagr / volatility : 0.0;
  const calmar = maxDD > 0.001 ? cagr / maxDD : 0.0;
  const smoothness = calculateRSquared(valuesPtr, n);

  // Super AI v1 Score: (sharpe * 0.6) + (calmar * 0.2) + (smoothness * 0.2)
  const score = (sharpe * 0.6) + (calmar * 0.2) + (smoothness * 0.2);

  setF64(resultPtr, 0, score);
  setF64(resultPtr, 1, sharpe);
  setF64(resultPtr, 2, calmar);
  setF64(resultPtr, 3, smoothness);
}

// ============================================
// ULTRA SMOOTH V1 ALGORITHM (類定存效果)
// ============================================

// Result: [0]: score, [1]: smoothness, [2]: maxDD, [3]: winRate

export function calculateUltraSmoothV1(
  valuesPtr: usize,
  n: i32,
  resultPtr: usize
): void {
  // Initialize result
  for (let i: i32 = 0; i < 4; i++) {
    setF64(resultPtr, i, 0.0);
  }

  if (n < 2) {
    return;
  }

  // Smoothness (R-squared)
  const smoothness = calculateRSquared(valuesPtr, n);

  // Max Drawdown
  const firstVal = getF64(valuesPtr, 0);
  let peak = firstVal;
  let maxDD: f64 = 0.0;
  for (let i: i32 = 0; i < n; i++) {
    const v = getF64(valuesPtr, i);
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }

  // Win Rate
  let winCount: i32 = 0;
  for (let i: i32 = 1; i < n; i++) {
    if (getF64(valuesPtr, i) > getF64(valuesPtr, i - 1)) {
      winCount++;
    }
  }
  const winRate = (winCount as f64) / ((n - 1) as f64);

  // Ultra Smooth V1 Score: (smoothness^2) * ((1 - maxDD)^2) * winRate
  const score = pow(smoothness, 2.0) * pow(1.0 - maxDD, 2.0) * winRate;

  setF64(resultPtr, 0, score);
  setF64(resultPtr, 1, smoothness);
  setF64(resultPtr, 2, maxDD);
  setF64(resultPtr, 3, winRate);
}

// ============================================
// ULTRA SMOOTH V3 ALGORITHM (低位佈局)
// ============================================

// Result: [0]: score, [1]: baseScore, [2]: currentZScore, [3]: channelConsistency

export function calculateUltraSmoothV3(
  valuesPtr: usize,
  n: i32,
  maxSpikeThreshold: f64,
  resultPtr: usize
): void {
  // Initialize result
  for (let i: i32 = 0; i < 4; i++) {
    setF64(resultPtr, i, 0.0);
  }

  // First calculate V2 result
  const v2ResultPtr = allocateF64Array(8);
  calculateUltraSmoothV2(valuesPtr, n, maxSpikeThreshold, v2ResultPtr);

  const v2Score = getF64(v2ResultPtr, 0);
  const disqualified = getF64(v2ResultPtr, 1);
  const channelConsistency = getF64(v2ResultPtr, 5);
  const currentZScore = getF64(v2ResultPtr, 6);

  if (disqualified != 0.0) {
    setF64(resultPtr, 0, -9999.0);
    setF64(resultPtr, 1, v2Score);
    setF64(resultPtr, 2, currentZScore);
    setF64(resultPtr, 3, channelConsistency);
    return;
  }

  // V3 Logic: Penalize Top, Reward Bottom
  let finalScore: f64;
  if (currentZScore > 0.1) {
    // Above Trend Line (with tolerance) -> Severe Penalty
    finalScore = v2Score * 0.1;
  } else {
    // Below Trend Line -> Bonus
    // The lower the z, the bigger the bonus
    // e.g. z = -1 -> score * 2, z = -2 -> score * 3
    finalScore = v2Score * (1.0 + abs(currentZScore));
  }

  setF64(resultPtr, 0, finalScore);
  setF64(resultPtr, 1, v2Score);
  setF64(resultPtr, 2, currentZScore);
  setF64(resultPtr, 3, channelConsistency);
}
