
// 声明类型
export type Kind = "const" | "var" | "let";

// 变量类型
export interface Var {
  $get(): any;
  $set(value: any): boolean;
}

// 变量类，实现读写
export class ScopeVar implements Var {
  private value: any;
  private kind: Kind;

  constructor(kind: Kind, val: any) {
    this.value = val;
    this.kind = kind;
  }
  $get() {
    return this.value;
  }
  $set(val: any) {
    // const 声明的变量无法二次赋值
    if (this.kind === "const") {
      return false;
    }
    this.value = val;
    return true;
  }
}
