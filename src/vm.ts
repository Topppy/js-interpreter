// vm.ts 对外暴露run方法,并使用acorn code->ast后,交给Interpreter实例进行解释。

const acorn = require("acorn");
import Interpreter from "./interpreter";
import Scope, { ScopeType } from "./scope";

/**
 * 
 * @param code string 代码
 * @param context 预置运行环境
 * @returns 
 */
export function run(code: string, context = null) {
  if (!code) return
  const ast = acorn.parse(code, {
    ecmaVersion: 8,
    sourceType: "script",
  });
  // 创建全局作用域
  const globalScope = new Scope(ScopeType.block);
  // 注册全局变量/方法
  globalScope.addContext(context)
  // 定义module.exports
  const $exports = {};
  const $module = { exports: $exports };
  // const $module = new PropVar({}, 'exports')
  globalScope.$const("module", $module);
  const jsInterpreter = new Interpreter(null, globalScope);
  jsInterpreter.interpret(ast);
  // exports
  const moduleVar = globalScope.$find("module");
  console.log("moduleVar:", moduleVar);
  const exportVal = moduleVar ? moduleVar.$get().exports : null;
  console.log("module exports:", exportVal);
  return exportVal;
}
