// WASM Module Exports
// Central export point for all WASM-related functionality

export {
  loadWasm,
  loadWasmSync,
  isWasmLoaded,
  getWasmInstance,
  calculateSuperAI_v2_wasm,
  calculateSuperAI_v1_wasm,
  calculateUltraSmoothV2_wasm,
  calculateUltraSmoothV1_wasm,
  calculateUltraSmoothV3_wasm,
  calculateRSquared_wasm,
  type WasmExports,
  type SuperAIv2Result,
  type SuperAIv1Result,
  type UltraSmoothV2Result,
  type UltraSmoothV1Result,
  type UltraSmoothV3Result,
} from './wasmLoader';

export {
  initializeWasm,
  isWasmAvailable,
  setAlgorithmImplementation,
  getAlgorithmConfig,
  calculateSuperAI,
  calculateSuperAI_v2,
  calculateUltraSmooth_v1,
  calculateUltraSmooth_v2,
  calculateUltraSmooth_v3,
  getWasmBinaryForWorker,
  generateWorkerWasmCode,
  type AlgorithmImplementation,
  type SuperAIv2Input,
  type SuperAIv2Config,
} from './algorithmService';
