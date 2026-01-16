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
 * Geometric Product Scoring with Strict Gatekeeping
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

  // 1. Strict Gatekeeping (按文档定义的门槛淘汰)
  if (maxDD > 0.25) return -9000.0;        // MaxDD > 25% 淘汰
  if (annualReturn < 0.05) return -9001.0; // 年化收益 < 5% 淘汰
  
  // 2. Calculate Smoothness
  let smoothness = calculateRSquared(portfolioValues);
  if (smoothness < 0.85) return -9003.0;   // R² < 0.85 淘汰

  // 3. Components (Saturated to 0~1 range)
  let returnComponent = saturate(sortino, 4.0);
  let riskComponent = saturate(calmar, 2.0) * calculateCVaRPenalty(returns);
  let stabilityComponent = smoothness;
  let channelComponent = calculateChannelScore(portfolioValues);

  // 4. Geometric Product Scoring (按文档定义的权重)
  // Score = (Return^0.4) * (Risk^0.3) * (Stability^0.2) * (Channel^0.1) * 100
  let score = Math.pow(returnComponent + 0.01, 0.4) *
              Math.pow(riskComponent + 0.01, 0.3) *
              Math.pow(stabilityComponent + 0.01, 0.2) *
              Math.pow(channelComponent + 0.01, 0.1) *
              100.0;

  return score;
}

/**
 * 💎 Stability Algorithm V2 (Ultra Smooth V2)
 * Based on Log Regression Residuals & Symmetric Ulcer Index
 * Enhanced version matching TypeScript implementation
 */
export function calculateStabilityV2Score(
  portfolioValues: f64[],
  annualizedReturn: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) return -99999.0;
  
  let n = portfolioValues.length;
  if (n < 20) return 0;

  // 1. Spike Detection (8%熔断机制)
  let periodReturns: f64[] = new Array<f64>(n - 1);
  let maxUp: f64 = 0;
  let maxDown: f64 = 0;
  
  for (let i = 1; i < n; i++) {
    let r = (portfolioValues[i] - portfolioValues[i-1]) / portfolioValues[i-1];
    periodReturns[i-1] = r;
    if (r > maxUp) maxUp = r;
    if (r < maxDown) maxDown = r;
  }
  
  if (maxUp > 0.08 || maxDown < -0.08) return 0;

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

  // 3. Log Residuals & Symmetric Ulcer Index
  // 专家建议：使用对数残差而非百分比偏离，因为对数空间下的距离
  // 才是数学上最纯粹的"直线平滑度"衡量标准
  let logResiduals: f64[] = new Array<f64>(n);
  let sumSqDev: f64 = 0;
  let withinChannelCount: f64 = 0;
  let maxResidual: f64 = 0;

  for (let i = 0; i < n; i++) {
    let actualLog = portfolioValues[i] > 0 ? Math.log(portfolioValues[i]) : 0;
    let trendLog = intercept + slope * f64(i);
    
    // 对数残差：Math.abs(Math.log(actual) - Math.log(trend))
    let residual = Math.abs(actualLog - trendLog);
    logResiduals[i] = residual;
    sumSqDev += residual * residual;
    
    // 通道宽度在对数空间：0.03 对应约 3% 的百分比偏离
    if (residual <= 0.03) withinChannelCount += 1.0;
    if (residual > maxResidual) maxResidual = residual;
  }

  let symmetricUlcerIndex = Math.sqrt(sumSqDev / f64(n));
  let channelConsistency = withinChannelCount / f64(n);

  // 4. Rolling Volatility Detection (20-period window)
  let rollingWindow = i32(Math.min(20.0, Math.floor(f64(n) / 5.0)));
  let maxRollingStdDev: f64 = 0;
  
  if (rollingWindow > 1 && periodReturns.length >= rollingWindow) {
    for (let i = rollingWindow; i < periodReturns.length; i++) {
      let sum: f64 = 0;
      let sumSq: f64 = 0;
      
      for (let j = 0; j < rollingWindow; j++) {
        let val = periodReturns[i - rollingWindow + j];
        sum += val;
        sumSq += val * val;
      }
      
      let mean = sum / f64(rollingWindow);
      let variance = (sumSq / f64(rollingWindow)) - (mean * mean);
      let stdDev = Math.sqrt(variance);
      
      if (stdDev > maxRollingStdDev) maxRollingStdDev = stdDev;
    }
  }

  // 5. Strict Gatekeeping (Hard Thresholds)
  // 专家建议：在评分前先淘汰不合格组合
  if (maxDown < -0.10) return -1000.0; // 单日跌幅 > 10% 直接淘汰

  // 6. Exponential Decay Penalties (指数衰减惩罚)
  // 专家建议：使用指数函数而非线性，实现更严格的惩罚
  let rPenalty: f64 = maxResidual > 0.05 
    ? Math.exp(-(maxResidual - 0.05) * 20.0) 
    : 1.0;
  
  let vPenalty: f64 = maxRollingStdDev > 0.02 
    ? Math.exp(-(maxRollingStdDev - 0.02) * 50.0) 
    : 1.0;

  // 7. Geometric Product Scoring (几何乘积评分)
  // 专家建议：改用幾何權重合成，實現「一票否決」機制
  if (symmetricUlcerIndex < 0.0001) symmetricUlcerIndex = 0.0001;
  
  let finalScore = Math.pow(annualizedReturn, 0.4) * 
                   Math.pow(1.0 / (symmetricUlcerIndex + 0.01), 0.4) * 
                   Math.pow(rPenalty, 0.1) * 
                   Math.pow(channelConsistency, 0.1) * 
                   100.0;

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
