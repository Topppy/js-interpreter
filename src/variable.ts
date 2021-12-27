// 声明类型
export type Kind = "const" | "var" | "let";

// 变量类型
export interface Var {
  $get(): any;
  $set(value: any): boolean;
}

// 变量类，实现读写, 简单变量类
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

/**
 * 创建一个类变量
 *
 * @class
 * @param any obj 类
 * @param prop any 属性
 * @method set 设置类的属性的值
 * @method get 获取类的属性的值
 */
export class PropVar {
  private obj: any;
  private prop: string;

  constructor(obj: any, prop: string) {
    this.obj = obj;
    this.prop = prop;
  }

  $set(value: any) {
    this.obj[this.prop] = value;
  }

  $get() {
    return this.obj[this.prop];
  }
  $delete() {
    delete this.obj[this.prop];
  }
}
