// AssemblyScript Portfolio Optimizer Core v3.4
// This module contains the sensitive calculation logic and domain locking.

/**
 * Validates if the application is running on the authorized domain.
 * @param domain The current hostname
 * @returns 1 if authorized, 0 otherwise
 */
export function checkDomain(domain: string): i32 {
  if (domain == "portfolio-optimizer-v3.netlify.app") {
    return 1;
  }
  if (domain == "localhost" || domain == "127.0.0.1") {
    return 1;
  }
  return 0;
}

/**
 * Helper: Calculate R-Squared (Smoothness) in Log Space
 */
function calculateRSquared(values: f64[]): f64 {
  let n = values.length;
  if (n < 2) return 0;

  let sumX: f64 = 0;
  let sumY: f64 = 0;
  let sumXY: f64 = 0;
  let sumXX: f64 = 0;

  for (let i = 0; i < n; i++) {
    let y = values[i] > 0 ? Math.log(values[i]) : 0;
    let x = f64(i);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  let slope = (f64(n) * sumXY - sumX * sumY) / (f64(n) * sumXX - sumX * sumX);
  let intercept = (sumY - slope * sumX) / f64(n);

  let ssTot: f64 = 0;
  let ssRes: f64 = 0;
  let meanY = sumY / f64(n);

  for (let i = 0; i < n; i++) {
    let y = values[i] > 0 ? Math.log(values[i]) : 0;
    let fit = intercept + slope * f64(i);
    ssTot += Math.pow(y - meanY, 2);
    ssRes += Math.pow(y - fit, 2);
  }

  return ssTot > 0 ? 1.0 - (ssRes / ssTot) : 0;
}

/**
 * Helper: Calculate CVaR Penalty (Tail Risk)
 */
function calculateCVaRPenalty(returns: f64[]): f64 {
  let n = returns.length;
  if (n < 5) return 1.0;

  let sorted = returns.slice();
  sorted.sort();

  let tailCount = i32(Math.floor(f64(n) * 0.05));
  if (tailCount < 1) tailCount = 1;

  let sum: f64 = 0;
  for (let i = 0; i < tailCount; i++) {
    sum += sorted[i];
  }
  let cvar = sum / f64(tailCount);
  
  // Convert negative return to 0~1 decay factor
  return Math.exp(cvar * 10.0);
}

/**
 * Helper: Calculate Channel Score (Consistency)
 */
function calculateChannelScore(values: f64[]): f64 {
  let n = values.length;
  if (n < 2) return 0;

  let sumX: f64 = 0;
  let sumY: f64 = 0;
  let sumXY: f64 = 0;
  let sumXX: f64 = 0;

  for (let i = 0; i < n; i++) {
    let y = values[i] > 0 ? Math.log(values[i]) : 0;
    let x = f64(i);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  let slope = (f64(n) * sumXY - sumX * sumY) / (f64(n) * sumXX - sumX * sumX);
  let intercept = (sumY - slope * sumX) / f64(n);

  let maxDev: f64 = 0;
  for (let i = 0; i < n; i++) {
    let y = values[i] > 0 ? Math.log(values[i]) : 0;
    let fit = intercept + slope * f64(i);
    let dev = Math.abs(y - fit);
    if (dev > maxDev) maxDev = dev;
  }

  let widthPct = (Math.exp(maxDev) - 1.0) * 2.0;
  return Math.exp(-widthPct / 0.10); // Decays as channel widens
}

/**
 * 🤖 Super AI Optimization v2.0 (Hexagon Warrior)
 */
export function calculateSuperAI_v2(
  portfolioValues: f64[],
  returns: f64[],
  sortino: f64,
  calmar: f64,
  maxDD: f64,
  annualReturn: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) return -99999.0;

  // 1. Gatekeeping (v3.4 Manual)
  let smoothness = calculateRSquared(portfolioValues);
  if (maxDD > 0.25) return -9000.0;
  if (annualReturn < 0.05) return -9001.0;
  if (smoothness < 0.85) return -9003.0;

  // 2. Components
  let returnComponent = saturate(sortino, 4.0);
  let riskComponent = saturate(calmar, 4.0) * calculateCVaRPenalty(returns);
  let stabilityComponent = Math.pow(smoothness, 2);
  let channelComponent = calculateChannelScore(portfolioValues);

  // 3. Geometric Product Scoring
  let score = Math.pow(returnComponent, 0.4) *
              Math.pow(riskComponent, 0.3) *
              Math.pow(stabilityComponent, 0.2) *
              Math.pow(channelComponent, 0.1) *
              100.0;

  return score;
}

/**
 * 💎 Stability Algorithm V2 (Ultra Smooth V2)
 * Based on Log Regression Residuals & Symmetric Ulcer Index
 */
export function calculateStabilityV2Score(
  portfolioValues: f64[],
  annualizedReturn: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) return -99999.0;
  
  let n = portfolioValues.length;
  if (n < 5) return 0;

  // 1. Spike Detection (8% Threshold)
  for (let i = 1; i < n; i++) {
    let r = (portfolioValues[i] - portfolioValues[i-1]) / portfolioValues[i-1];
    if (Math.abs(r) > 0.08) return 0;
  }

  // 2. Log Linear Regression
  let sumX: f64 = 0;
  let sumY: f64 = 0;
  let sumXY: f64 = 0;
  let sumXX: f64 = 0;

  for (let i = 0; i < n; i++) {
    let y = portfolioValues[i] > 0 ? Math.log(portfolioValues[i]) : 0;
    let x = f64(i);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  let slope = (f64(n) * sumXY - sumX * sumY) / (f64(n) * sumXX - sumX * sumX);
  let intercept = (sumY - slope * sumX) / f64(n);

  // 3. Residuals & Symmetric Ulcer Index
  let sumSqDev: f64 = 0;
  let withinChannelCount: f64 = 0;

  for (let i = 0; i < n; i++) {
    let trendVal = Math.exp(intercept + slope * f64(i));
    let dev = Math.abs((portfolioValues[i] - trendVal) / trendVal);
    sumSqDev += dev * dev;
    if (dev <= 0.03) withinChannelCount += 1.0;
  }

  let symmetricUlcerIndex = Math.sqrt(sumSqDev / f64(n));
  let channelConsistency = withinChannelCount / f64(n);

  // 4. Final Score
  if (symmetricUlcerIndex < 0.0001) symmetricUlcerIndex = 0.0001;
  let finalScore = (annualizedReturn / symmetricUlcerIndex) * (0.5 + 0.5 * channelConsistency);

  return finalScore;
}

/**
 * 💎 Ultra Smooth V1 scoring logic
 */
export function calculateUltraSmoothV1Score(
  smoothness: f64,
  maxDD: f64,
  winRate: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) return -99999.0;
  // v1: (Smoothness^2) * ((1 - MaxDD)^2) * WinRate
  return Math.pow(smoothness, 2) * Math.pow(1.0 - maxDD, 2) * winRate;
}

/**
 * Default Super AI scoring logic (v1)
 */
export function calculateDefaultSuperAIScore(
  sharpe: f64,
  calmar: f64,
  smoothness: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) return -99999.0;
  return (sharpe * 0.6) + (calmar * 0.2) + (smoothness * 0.2);
}

/**
 * Helper function to saturate values
 */
function saturate(x: f64, scale: f64): f64 {
  return x > 0 ? x / (x + scale) : 0;
}
