// AssemblyScript Portfolio Optimizer Core
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
 * Calculates a score based on the "Super AI V2.0" logic.
 * This is a simplified version for WASM implementation to protect the formula.
 */
export function calculateSuperAIScore(
  sortino: f64,
  calmar: f64,
  smoothness: f64,
  channelComponent: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) {
    return -99999.0;
  }

  // The sensitive formula
  let returnComponent = saturate(sortino, 4.0);
  let riskComponent = saturate(calmar, 4.0);
  let stabilityComponent = smoothness * smoothness;

  let score = Math.pow(returnComponent, 0.4) *
              Math.pow(riskComponent, 0.3) *
              Math.pow(stabilityComponent, 0.2) *
              Math.pow(channelComponent, 0.1) *
              100.0;

  return score;
}

/**
 * Ultra Smooth V1 scoring logic
 */
export function calculateUltraSmoothV1Score(
  smoothness: f64,
  maxDD: f64,
  winRate: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) {
    return -99999.0;
  }

  return smoothness * smoothness * (1.0 - maxDD) * (1.0 - maxDD) * winRate;
}

/**
 * Default Super AI scoring logic
 */
export function calculateDefaultSuperAIScore(
  sharpe: f64,
  calmar: f64,
  smoothness: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) {
    return -99999.0;
  }
  return (sharpe * 0.6) + (calmar * 0.2) + (smoothness * 0.2);
}

/**
 * Stability Algorithm V2 (Ultra Smooth V2)
 */
export function calculateStabilityV2Score(
  smoothness: f64,
  maxDD: f64,
  volatility: f64,
  isAuthorized: i32
): f64 {
  if (isAuthorized != 1) {
    return -99999.0;
  }
  // Formula: (Smoothness^3) / (MaxDD * Volatility + 0.01)
  return (smoothness * smoothness * smoothness) / (maxDD * volatility + 0.01);
}

/**
 * Helper function to saturate values
 */
function saturate(x: f64, scale: f64): f64 {
  return x > 0 ? x / (x + scale) : 0;
}
