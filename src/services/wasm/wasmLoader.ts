// WASM Loader for Portfolio Optimization Algorithms
// Provides TypeScript wrappers around WASM functions

export interface WasmExports {
  memory: WebAssembly.Memory;
  allocateF64Array(length: number): number;
  setF64(ptr: number, index: number, value: number): void;
  getF64(ptr: number, index: number): number;
  resetHeap(): void;
  calculateSuperAI_v2(
    valuesPtr: number,
    n: number,
    totalDaysHint: number,
    maxAllowedDrawdown: number,
    minRequiredAnnualReturn: number,
    maxSinglePeriodMove: number,
    minSmoothness: number,
    resultPtr: number
  ): void;
  calculateSuperAI_v1(
    valuesPtr: number,
    n: number,
    resultPtr: number
  ): void;
  calculateUltraSmoothV2(
    valuesPtr: number,
    n: number,
    maxSpikeThreshold: number,
    resultPtr: number
  ): void;
  calculateUltraSmoothV1(
    valuesPtr: number,
    n: number,
    resultPtr: number
  ): void;
  calculateUltraSmoothV3(
    valuesPtr: number,
    n: number,
    maxSpikeThreshold: number,
    resultPtr: number
  ): void;
  calculateRSquared(valuesPtr: number, n: number): number;
}

// Singleton WASM instance
let wasmInstance: WasmExports | null = null;
let wasmLoadPromise: Promise<WasmExports> | null = null;

/**
 * Load the WASM module
 */
export async function loadWasm(wasmPath: string = '/algorithms.wasm'): Promise<WasmExports> {
  if (wasmInstance) {
    return wasmInstance;
  }

  if (wasmLoadPromise) {
    return wasmLoadPromise;
  }

  wasmLoadPromise = (async () => {
    try {
      const response = await fetch(wasmPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status}`);
      }
      const wasmBuffer = await response.arrayBuffer();

      const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
        env: {
          abort: (msg: number, file: number, line: number, col: number) => {
            console.error(`WASM abort at ${file}:${line}:${col} - ${msg}`);
          },
          'Math.sqrt': Math.sqrt,
          'Math.exp': Math.exp,
          'Math.log': Math.log,
          'Math.pow': Math.pow,
          'Math.abs': Math.abs,
        },
      });

      wasmInstance = wasmModule.instance.exports as unknown as WasmExports;
      return wasmInstance;
    } catch (error) {
      wasmLoadPromise = null;
      throw error;
    }
  })();

  return wasmLoadPromise;
}

/**
 * Load WASM synchronously from buffer (for Web Workers)
 */
export function loadWasmSync(wasmBuffer: ArrayBuffer): WasmExports {
  if (wasmInstance) {
    return wasmInstance;
  }

  const wasmModule = new WebAssembly.Module(wasmBuffer);
  const instance = new WebAssembly.Instance(wasmModule, {
    env: {
      abort: () => console.error('WASM abort called'),
      'Math.sqrt': Math.sqrt,
      'Math.exp': Math.exp,
      'Math.log': Math.log,
      'Math.pow': Math.pow,
      'Math.abs': Math.abs,
    },
  });

  wasmInstance = instance.exports as unknown as WasmExports;
  return wasmInstance;
}

/**
 * Check if WASM is loaded
 */
export function isWasmLoaded(): boolean {
  return wasmInstance !== null;
}

/**
 * Get WASM instance (throws if not loaded)
 */
export function getWasmInstance(): WasmExports {
  if (!wasmInstance) {
    throw new Error('WASM not loaded. Call loadWasm() first.');
  }
  return wasmInstance;
}

// ============================================
// HIGH-LEVEL WRAPPERS
// ============================================

export interface SuperAIv2Result {
  score: number;
  disqualified: boolean;
  components?: {
    returnComponent: number;
    riskComponent: number;
    stabilityComponent: number;
    channelComponent: number;
  };
  metrics?: {
    sortino: number;
    calmar: number;
    smoothness: number;
  };
  reason?: string;
}

export interface UltraSmoothV2Result {
  score: number;
  disqualified: boolean;
  reason?: string;
  metrics?: {
    symmetricUlcerIndex: number;
    maxResidual: number;
    maxRollingStdDev: number;
    channelConsistency: number;
    currentZScore: number;
    annualizedReturn?: number;
  };
}

/**
 * WASM version of Super AI v2.0 algorithm (六邊形戰士)
 */
export function calculateSuperAI_v2_wasm(
  portfolioValues: number[],
  totalDaysHint: number = 0,
  config: {
    maxAllowedDrawdown?: number;
    minRequiredAnnualReturn?: number;
    maxSinglePeriodMove?: number;
    minSmoothness?: number;
  } = {}
): SuperAIv2Result {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = portfolioValues.length;

  // Allocate and fill values array
  const valuesPtr = wasm.allocateF64Array(n);
  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, portfolioValues[i]);
  }

  // Allocate result array (9 elements)
  const resultPtr = wasm.allocateF64Array(9);

  // Call WASM function
  wasm.calculateSuperAI_v2(
    valuesPtr,
    n,
    totalDaysHint,
    config.maxAllowedDrawdown ?? 0.25,
    config.minRequiredAnnualReturn ?? 0.05,
    config.maxSinglePeriodMove ?? 0,
    config.minSmoothness ?? 0.85,
    resultPtr
  );

  // Read results
  const score = wasm.getF64(resultPtr, 0);
  const disqualified = wasm.getF64(resultPtr, 1) !== 0;

  if (disqualified) {
    let reason = 'Unknown';
    if (score === -9000) reason = 'MaxDD Exceeded';
    else if (score === -9001) reason = 'Low Return';
    else if (score === -9002) reason = 'High Volatility Spike';
    else if (score === -9003) reason = 'Low Smoothness';
    else if (score === -9999) reason = 'No Returns';

    return { score, disqualified: true, reason };
  }

  return {
    score,
    disqualified: false,
    components: {
      returnComponent: wasm.getF64(resultPtr, 2),
      riskComponent: wasm.getF64(resultPtr, 3),
      stabilityComponent: wasm.getF64(resultPtr, 4),
      channelComponent: wasm.getF64(resultPtr, 5),
    },
    metrics: {
      sortino: wasm.getF64(resultPtr, 6),
      calmar: wasm.getF64(resultPtr, 7),
      smoothness: wasm.getF64(resultPtr, 8),
    },
  };
}

/**
 * WASM version of Ultra Smooth v2 algorithm (雙向波動通道)
 */
export function calculateUltraSmoothV2_wasm(
  portfolioValues: number[],
  maxSpikeThreshold: number = 0.08
): UltraSmoothV2Result {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = portfolioValues.length;

  // Allocate and fill values array
  const valuesPtr = wasm.allocateF64Array(n);
  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, portfolioValues[i]);
  }

  // Allocate result array (8 elements)
  const resultPtr = wasm.allocateF64Array(8);

  // Call WASM function
  wasm.calculateUltraSmoothV2(valuesPtr, n, maxSpikeThreshold, resultPtr);

  // Read results
  const score = wasm.getF64(resultPtr, 0);
  const disqualified = wasm.getF64(resultPtr, 1) !== 0;

  if (disqualified) {
    return {
      score: 0,
      disqualified: true,
      reason: n < 20 ? '數據不足' : '單期波動超標'
    };
  }

  return {
    score,
    disqualified: false,
    metrics: {
      symmetricUlcerIndex: wasm.getF64(resultPtr, 2),
      maxResidual: wasm.getF64(resultPtr, 3),
      maxRollingStdDev: wasm.getF64(resultPtr, 4),
      channelConsistency: wasm.getF64(resultPtr, 5),
      currentZScore: wasm.getF64(resultPtr, 6),
      annualizedReturn: wasm.getF64(resultPtr, 7),
    },
  };
}

/**
 * WASM version of R-Squared calculation
 */
export function calculateRSquared_wasm(values: number[]): number {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = values.length;
  const valuesPtr = wasm.allocateF64Array(n);

  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, values[i]);
  }

  return wasm.calculateRSquared(valuesPtr, n);
}

// ============================================
// NEW ALGORITHM WRAPPERS
// ============================================

export interface SuperAIv1Result {
  score: number;
  metrics: {
    sharpe: number;
    calmar: number;
    smoothness: number;
  };
}

export interface UltraSmoothV1Result {
  score: number;
  metrics: {
    smoothness: number;
    maxDD: number;
    winRate: number;
  };
}

export interface UltraSmoothV3Result {
  score: number;
  disqualified: boolean;
  metrics: {
    baseScore: number;
    currentZScore: number;
    channelConsistency: number;
  };
}

/**
 * WASM version of Super AI v1 algorithm (終極多維度)
 */
export function calculateSuperAI_v1_wasm(portfolioValues: number[]): SuperAIv1Result {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = portfolioValues.length;
  const valuesPtr = wasm.allocateF64Array(n);
  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, portfolioValues[i]);
  }

  const resultPtr = wasm.allocateF64Array(4);
  wasm.calculateSuperAI_v1(valuesPtr, n, resultPtr);

  return {
    score: wasm.getF64(resultPtr, 0),
    metrics: {
      sharpe: wasm.getF64(resultPtr, 1),
      calmar: wasm.getF64(resultPtr, 2),
      smoothness: wasm.getF64(resultPtr, 3),
    },
  };
}

/**
 * WASM version of Ultra Smooth v1 algorithm (類定存效果)
 */
export function calculateUltraSmoothV1_wasm(portfolioValues: number[]): UltraSmoothV1Result {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = portfolioValues.length;
  const valuesPtr = wasm.allocateF64Array(n);
  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, portfolioValues[i]);
  }

  const resultPtr = wasm.allocateF64Array(4);
  wasm.calculateUltraSmoothV1(valuesPtr, n, resultPtr);

  return {
    score: wasm.getF64(resultPtr, 0),
    metrics: {
      smoothness: wasm.getF64(resultPtr, 1),
      maxDD: wasm.getF64(resultPtr, 2),
      winRate: wasm.getF64(resultPtr, 3),
    },
  };
}

/**
 * WASM version of Ultra Smooth v3 algorithm (低位佈局)
 */
export function calculateUltraSmoothV3_wasm(
  portfolioValues: number[],
  maxSpikeThreshold: number = 0.08
): UltraSmoothV3Result {
  const wasm = getWasmInstance();
  wasm.resetHeap();

  const n = portfolioValues.length;
  const valuesPtr = wasm.allocateF64Array(n);
  for (let i = 0; i < n; i++) {
    wasm.setF64(valuesPtr, i, portfolioValues[i]);
  }

  const resultPtr = wasm.allocateF64Array(4);
  wasm.calculateUltraSmoothV3(valuesPtr, n, maxSpikeThreshold, resultPtr);

  const score = wasm.getF64(resultPtr, 0);

  return {
    score,
    disqualified: score === -9999,
    metrics: {
      baseScore: wasm.getF64(resultPtr, 1),
      currentZScore: wasm.getF64(resultPtr, 2),
      channelConsistency: wasm.getF64(resultPtr, 3),
    },
  };
}
