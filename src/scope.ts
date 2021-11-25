import { Var, ScopeVar, Kind } from "./variable";

// 作用域类型
export type ScopeType = "function" | "loop" | "switch" | "block";

export class Scope {
  /**
   *  作用域类型
   */
  private type: ScopeType;
  /**
   *  父作用域
   */
  private parent: Scope | null;
  /**
   *  当前作用域
   */
  private content: { [key: string]: Var };

  constructor(type: ScopeType, parent?: Scope) {
    this.type = type;
    this.parent = parent || null;
    this.content = {};
  }
  // let类型变量定义
  private $let(rawName: string, value: any) {
    this.content[rawName] = new ScopeVar("let", value);
  }
  // const类型变量定义
  private $const(rawName: string, value: any) {
    this.content[rawName] = new ScopeVar("const", value);
  }
  // var类型变量定义
  private $var(rawName: string, value: any) {
    // 如果不是全局作用域且不是函数作用域,找到全局作用域,存储变量
    // 这里就是我们常说的Hoisting (变量提升)
    let scope: Scope = this;

    while (scope.parent !== null && scope.type !== "function") {
      scope = scope.parent;
    }
    // 不管是否存在声明直接覆盖
    scope.content[rawName] = new ScopeVar("var", value);
  }
  // 是否在当前作用域已定义let、const
  private $hasDefinition(kind: Kind, rawName: string): boolean {
    return (
      ["let", "const"].includes(kind) && this.content.hasOwnProperty(rawName)
    );
  }
  // 作用域链实现,向上查找标识符
  $find(rawName: string): Var {
    // 根据js规则，先从当前作用域去查找，找不到则向父级作用域递归查找，直到全局作用域，如果都没有就报错
    if (this.content.hasOwnProperty(rawName)) {
      return this.content[rawName];
    } else if (this.parent) {
      return this.parent.$find(rawName);
    } else {
      throw Error(`Uncaught ReferenceError: ${rawName} is not defined`);
    }
  }
  // 变量声明方法,变量已定义则抛出语法错误异常
  $declare(kind: Kind, rawName: string, value: any) {
    if (this.$hasDefinition(kind, rawName)) {
      throw Error(
        `Uncaught SyntaxError: Identifier '${rawName}' has already been declared`
      );
    }

    return {
      var: () => this.$var(rawName, value),
      let: () => this.$let(rawName, value),
      const: () => this.$const(rawName, value),
    }[kind]();
  }
}
