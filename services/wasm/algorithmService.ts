// Algorithm Service - Pure WASM Version
// All algorithms run exclusively through WebAssembly - no TypeScript fallback
// This provides maximum code protection

import {
  loadWasm,
  isWasmLoaded,
  calculateSuperAI_v2_wasm,
  calculateSuperAI_v1_wasm,
  calculateUltraSmoothV2_wasm,
  calculateUltraSmoothV1_wasm,
  calculateUltraSmoothV3_wasm,
  type SuperAIv2Result,
  type SuperAIv1Result,
  type UltraSmoothV2Result,
  type UltraSmoothV1Result,
  type UltraSmoothV3Result,
} from './wasmLoader';

// ============================================
// CONFIGURATION
// ============================================

export type AlgorithmImplementation = 'typescript' | 'wasm';

interface AlgorithmConfig {
  superAI: AlgorithmImplementation;
  superAI_v2: AlgorithmImplementation;
  ultraSmooth_v1: AlgorithmImplementation;
  ultraSmooth_v2: AlgorithmImplementation;
  ultraSmooth_v3: AlgorithmImplementation;
}

// Pure WASM configuration - always use WASM
let config: AlgorithmConfig = {
  superAI: 'wasm',
  superAI_v2: 'wasm',
  ultraSmooth_v1: 'wasm',
  ultraSmooth_v2: 'wasm',
  ultraSmooth_v3: 'wasm',
};

let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

/**
 * Initialize WASM module
 */
export async function initializeWasm(wasmPath?: string): Promise<boolean> {
  if (wasmInitialized) return true;

  if (wasmInitPromise) {
    await wasmInitPromise;
    return wasmInitialized;
  }

  wasmInitPromise = (async () => {
    try {
      await loadWasm(wasmPath);
      wasmInitialized = true;
      console.log('🔒 WASM algorithms loaded - Pure WASM mode active');
    } catch (error) {
      console.error('❌ WASM loading failed:', error);
      wasmInitialized = false;
    }
  })();

  await wasmInitPromise;
  return wasmInitialized;
}

/**
 * Check if WASM is available
 */
export function isWasmAvailable(): boolean {
  return wasmInitialized && isWasmLoaded();
}

/**
 * Set algorithm implementation preference
 * In pure WASM version, this is kept for API compatibility but always uses WASM
 */
export function setAlgorithmImplementation(
  algorithm: 'superAI' | 'superAI_v2' | 'ultraSmooth_v1' | 'ultraSmooth_v2' | 'ultraSmooth_v3' | 'all',
  implementation: AlgorithmImplementation
): void {
  // In pure WASM version, we ignore the implementation parameter and always use WASM
  console.log('🔒 Pure WASM mode - algorithms always use WebAssembly');

  if (algorithm === 'all') {
    config.superAI = 'wasm';
    config.superAI_v2 = 'wasm';
    config.ultraSmooth_v1 = 'wasm';
    config.ultraSmooth_v2 = 'wasm';
    config.ultraSmooth_v3 = 'wasm';
  } else {
    config[algorithm] = 'wasm';
  }
}

/**
 * Get current algorithm configuration
 */
export function getAlgorithmConfig(): AlgorithmConfig {
  return { ...config };
}

// ============================================
// UNIFIED ALGORITHM INTERFACES
// ============================================

export interface SuperAIv2Input {
  portfolioValues: number[];
  frequency?: string;
  totalDaysHint?: number;
}

export interface SuperAIv2Config {
  maxAllowedDrawdown?: number;
  minRequiredAnnualReturn?: number;
  maxSinglePeriodMove?: number;
  minSmoothness?: number;
}

/**
 * Calculate Super AI v1 score (終極多維度)
 * PURE WASM - no TypeScript fallback
 */
export function calculateSuperAI(portfolioValues: number[]): SuperAIv1Result {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.');
  }
  return calculateSuperAI_v1_wasm(portfolioValues);
}

/**
 * Calculate Super AI v2.0 score (六邊形戰士)
 * PURE WASM - no TypeScript fallback
 */
export function calculateSuperAI_v2(
  input: SuperAIv2Input,
  cfg: SuperAIv2Config = {}
): SuperAIv2Result {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.');
  }
  return calculateSuperAI_v2_wasm(
    input.portfolioValues,
    input.totalDaysHint ?? 0,
    cfg
  );
}

/**
 * Calculate Ultra Smooth v1 score (類定存效果)
 * PURE WASM - no TypeScript fallback
 */
export function calculateUltraSmooth_v1(portfolioValues: number[]): UltraSmoothV1Result {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.');
  }
  return calculateUltraSmoothV1_wasm(portfolioValues);
}

/**
 * Calculate Ultra Smooth v2 score (雙向波動通道)
 * PURE WASM - no TypeScript fallback
 */
export function calculateUltraSmooth_v2(
  portfolioValues: number[],
  maxSpikeThreshold: number = 0.08
): UltraSmoothV2Result {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.');
  }
  return calculateUltraSmoothV2_wasm(portfolioValues, maxSpikeThreshold);
}

/**
 * Calculate Ultra Smooth v3 score (低位佈局)
 * PURE WASM - no TypeScript fallback
 */
export function calculateUltraSmooth_v3(
  portfolioValues: number[],
  maxSpikeThreshold: number = 0.08
): UltraSmoothV3Result {
  if (!wasmInitialized) {
    throw new Error('WASM not initialized. Call initializeWasm() first.');
  }
  return calculateUltraSmoothV3_wasm(portfolioValues, maxSpikeThreshold);
}

// ============================================
// WORKER INTEGRATION HELPERS
// ============================================

/**
 * Get WASM binary for Worker injection
 * Returns base64 encoded WASM or null if not available
 */
export async function getWasmBinaryForWorker(wasmPath: string = '/algorithms.wasm'): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(wasmPath);
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Generate code string for Worker to use WASM
 * This is injected into the Web Worker - PURE WASM VERSION
 */
export function generateWorkerWasmCode(): string {
  return `
    // WASM Integration for Worker - Pure WASM Mode
    let wasmInstance = null;

    function initWasmInWorker(wasmBuffer) {
      if (!wasmBuffer || wasmInstance) return;
      try {
        const wasmModule = new WebAssembly.Module(wasmBuffer);
        const instance = new WebAssembly.Instance(wasmModule, {
          env: {
            abort: () => console.error('WASM abort'),
            'Math.sqrt': Math.sqrt,
            'Math.exp': Math.exp,
            'Math.log': Math.log,
            'Math.pow': Math.pow,
            'Math.abs': Math.abs,
          },
        });
        wasmInstance = instance.exports;
        console.log('🔒 Worker: Pure WASM mode initialized');
      } catch (e) {
        console.error('Worker: WASM init failed', e);
        throw new Error('WASM initialization failed - cannot proceed without WASM');
      }
    }

    function requireWasm() {
      if (!wasmInstance) {
        throw new Error('WASM not initialized in worker');
      }
      return wasmInstance;
    }

    function calculateSuperAI_v1_wasm_worker(values) {
      const wasm = requireWasm();

      wasm.resetHeap();
      const n = values.length;
      const valuesPtr = wasm.allocateF64Array(n);
      for (let i = 0; i < n; i++) {
        wasm.setF64(valuesPtr, i, values[i]);
      }

      const resultPtr = wasm.allocateF64Array(4);
      wasm.calculateSuperAI_v1(valuesPtr, n, resultPtr);

      return {
        score: wasm.getF64(resultPtr, 0),
        metrics: {
          sharpe: wasm.getF64(resultPtr, 1),
          calmar: wasm.getF64(resultPtr, 2),
          smoothness: wasm.getF64(resultPtr, 3),
        }
      };
    }

    function calculateSuperAI_v2_wasm_worker(values) {
      const wasm = requireWasm();

      wasm.resetHeap();
      const n = values.length;
      const valuesPtr = wasm.allocateF64Array(n);
      for (let i = 0; i < n; i++) {
        wasm.setF64(valuesPtr, i, values[i]);
      }

      const resultPtr = wasm.allocateF64Array(9);
      wasm.calculateSuperAI_v2(valuesPtr, n, 0, 0.25, 0.05, 0, 0.85, resultPtr);

      const score = wasm.getF64(resultPtr, 0);
      const disqualified = wasm.getF64(resultPtr, 1) !== 0;

      if (disqualified) return { score, disqualified: true };

      return {
        score,
        disqualified: false,
        metrics: {
          sortino: wasm.getF64(resultPtr, 6),
          calmar: wasm.getF64(resultPtr, 7),
          smoothness: wasm.getF64(resultPtr, 8),
        }
      };
    }

    function calculateUltraSmoothV1_wasm_worker(values) {
      const wasm = requireWasm();

      wasm.resetHeap();
      const n = values.length;
      const valuesPtr = wasm.allocateF64Array(n);
      for (let i = 0; i < n; i++) {
        wasm.setF64(valuesPtr, i, values[i]);
      }

      const resultPtr = wasm.allocateF64Array(4);
      wasm.calculateUltraSmoothV1(valuesPtr, n, resultPtr);

      return {
        score: wasm.getF64(resultPtr, 0),
        metrics: {
          smoothness: wasm.getF64(resultPtr, 1),
          maxDD: wasm.getF64(resultPtr, 2),
          winRate: wasm.getF64(resultPtr, 3),
        }
      };
    }

    function calculateUltraSmoothV2_wasm_worker(values) {
      const wasm = requireWasm();

      wasm.resetHeap();
      const n = values.length;
      const valuesPtr = wasm.allocateF64Array(n);
      for (let i = 0; i < n; i++) {
        wasm.setF64(valuesPtr, i, values[i]);
      }

      const resultPtr = wasm.allocateF64Array(8);
      wasm.calculateUltraSmoothV2(valuesPtr, n, 0.08, resultPtr);

      const score = wasm.getF64(resultPtr, 0);
      const disqualified = wasm.getF64(resultPtr, 1) !== 0;

      if (disqualified) return { score: 0, disqualified: true };

      return {
        score,
        disqualified: false,
        metrics: {
          channelConsistency: wasm.getF64(resultPtr, 5),
          currentZScore: wasm.getF64(resultPtr, 6),
        }
      };
    }

    function calculateUltraSmoothV3_wasm_worker(values) {
      const wasm = requireWasm();

      wasm.resetHeap();
      const n = values.length;
      const valuesPtr = wasm.allocateF64Array(n);
      for (let i = 0; i < n; i++) {
        wasm.setF64(valuesPtr, i, values[i]);
      }

      const resultPtr = wasm.allocateF64Array(4);
      wasm.calculateUltraSmoothV3(valuesPtr, n, 0.08, resultPtr);

      const score = wasm.getF64(resultPtr, 0);

      return {
        score,
        disqualified: score === -9999,
        metrics: {
          baseScore: wasm.getF64(resultPtr, 1),
          currentZScore: wasm.getF64(resultPtr, 2),
          channelConsistency: wasm.getF64(resultPtr, 3),
        }
      };
    }
  `;
}
