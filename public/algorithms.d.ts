declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  /**
   * assembly/index/allocateF64Array
   * @param length `i32`
   * @returns `usize`
   */
  export function allocateF64Array(length: number): number;
  /**
   * assembly/index/setF64
   * @param ptr `usize`
   * @param index `i32`
   * @param value `f64`
   */
  export function setF64(ptr: number, index: number, value: number): void;
  /**
   * assembly/index/getF64
   * @param ptr `usize`
   * @param index `i32`
   * @returns `f64`
   */
  export function getF64(ptr: number, index: number): number;
  /**
   * assembly/index/resetHeap
   */
  export function resetHeap(): void;
  /**
   * assembly/index/linearRegression
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param slopePtr `usize`
   * @param interceptPtr `usize`
   */
  export function linearRegression(valuesPtr: number, n: number, slopePtr: number, interceptPtr: number): void;
  /**
   * assembly/index/calculateStandardDeviation
   * @param valuesPtr `usize`
   * @param n `i32`
   * @returns `f64`
   */
  export function calculateStandardDeviation(valuesPtr: number, n: number): number;
  /**
   * assembly/index/calculateRSquared
   * @param valuesPtr `usize`
   * @param n `i32`
   * @returns `f64`
   */
  export function calculateRSquared(valuesPtr: number, n: number): number;
  /**
   * assembly/index/calculateChannelScore
   * @param valuesPtr `usize`
   * @param n `i32`
   * @returns `f64`
   */
  export function calculateChannelScore(valuesPtr: number, n: number): number;
  /**
   * assembly/index/calculateCVaRPenalty
   * @param logReturnsPtr `usize`
   * @param n `i32`
   * @returns `f64`
   */
  export function calculateCVaRPenalty(logReturnsPtr: number, n: number): number;
  /**
   * assembly/index/saturate
   * @param x `f64`
   * @param scale `f64`
   * @returns `f64`
   */
  export function saturate(x: number, scale: number): number;
  /**
   * assembly/index/detectFrequency
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param hintDays `f64`
   * @returns `i32`
   */
  export function detectFrequency(valuesPtr: number, n: number, hintDays: number): number;
  /**
   * assembly/index/calculateSuperAI_v2
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param totalDaysHint `f64`
   * @param maxAllowedDrawdown `f64`
   * @param minRequiredAnnualReturn `f64`
   * @param maxSinglePeriodMove `f64`
   * @param minSmoothness `f64`
   * @param resultPtr `usize`
   */
  export function calculateSuperAI_v2(valuesPtr: number, n: number, totalDaysHint: number, maxAllowedDrawdown: number, minRequiredAnnualReturn: number, maxSinglePeriodMove: number, minSmoothness: number, resultPtr: number): void;
  /**
   * assembly/index/calculateUltraSmoothV2
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param maxSpikeThreshold `f64`
   * @param resultPtr `usize`
   */
  export function calculateUltraSmoothV2(valuesPtr: number, n: number, maxSpikeThreshold: number, resultPtr: number): void;
  /**
   * assembly/index/calculateSuperAI_v1
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param resultPtr `usize`
   */
  export function calculateSuperAI_v1(valuesPtr: number, n: number, resultPtr: number): void;
  /**
   * assembly/index/calculateUltraSmoothV1
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param resultPtr `usize`
   */
  export function calculateUltraSmoothV1(valuesPtr: number, n: number, resultPtr: number): void;
  /**
   * assembly/index/calculateUltraSmoothV3
   * @param valuesPtr `usize`
   * @param n `i32`
   * @param maxSpikeThreshold `f64`
   * @param resultPtr `usize`
   */
  export function calculateUltraSmoothV3(valuesPtr: number, n: number, maxSpikeThreshold: number, resultPtr: number): void;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
}): Promise<typeof __AdaptedExports>;
