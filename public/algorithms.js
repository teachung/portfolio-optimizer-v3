export async function instantiate(module, imports = {}) {
  const { exports } = await WebAssembly.instantiate(module, imports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    allocateF64Array(length) {
      // assembly/index/allocateF64Array(i32) => usize
      return exports.allocateF64Array(length) >>> 0;
    },
  }, exports);
  return adaptedExports;
}
