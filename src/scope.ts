import { Var, ScopeVar, Kind } from "./variable";
import defaultContext from "./context";

// 作用域类型
export enum ScopeType {
  function = "function",
  block = "block",
}
/**
 *
 * 每次对节点的处理，都要考虑其作用域的问题。Scope实例会定义该作用域为函数作用域（function）或者块级作用域（block）。
 * 每次新建Scope实例，都会为当前节点创建一个全新的“作用域变量空间”（declaration），任何在此作用域内定义的变量都会存放在这个空间当中
 * 此外，新建Scope实例也会保存其父级作用域。
 */
export default class Scope {
  /**
   *  作用域类型
   */
  type: ScopeType;
  /**
   *  父作用域
   */
  parent: Scope | null;
  /**
   *  当前作用域
   */
  private content: { [key: string]: Var };
  /**
   * 作用域环境声明变量/方法: 包括内置对象/方法
   */
  private context: { [key: string]: Var };

  constructor(type: ScopeType, parent?: Scope) {
    this.type = type;
    this.parent = parent || null;
    this.content = {};
    this.context = defaultContext;
  }

  addContext(context: { [x: string]: any } | null) {
    if (!context) return;
    Object.keys(context).forEach((k) => {
      this.addDeclaration(k, context[k]);
    });
  }
  addDeclaration(name: string, value: any) {
    this.context[name] = new ScopeVar("var", value);
  }
  // let类型变量定义
  $let(rawName: string, value: any) {
    this.content[rawName] = new ScopeVar("let", value);
    return this.content[rawName]
  }
  // const类型变量定义
  $const(rawName: string, value: any) {
    this.content[rawName] = new ScopeVar("const", value);
    return this.content[rawName]
  }
  // var类型变量定义
  $var(rawName: string, value: any) {
    // 如果不是全局作用域且不是函数作用域,找到全局作用域,存储变量
    // 这里就是我们常说的Hoisting (变量提升)
    let scope: Scope = this;

    while (scope.parent !== null && scope.type !== "function") {
      scope = scope.parent;
    }
    // 不管是否存在声明直接覆盖
    scope.content[rawName] = new ScopeVar("var", value);
    return scope.content[rawName]
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
    } else if (this.context[rawName]) {
      console.log(rawName,'===this.context[rawName]====')
      return this.context[rawName];
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
