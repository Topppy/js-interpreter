export function defineFunctionName(func:Function, name: string) {
  Object.defineProperty(func, "name", {
    value: name || "",
    writable: false,
    enumerable: false,
    configurable: true
  });
}

export function defineFunctionLength(func:Function, length: number) {
  Object.defineProperty(func, "length", {
    value: length || 0,
    writable: false,
    enumerable: false,
    configurable: true
  });
}