// vm.ts 对外暴露run方法,并使用acorn code->ast后,交给Interpreter实例进行解释。

const acorn = require("acorn");
import Interpreter from "./interpreter";
import { Scope } from "./scope";

export function run(code: string) {
  const ast = acorn.parse(code, {
    ecmaVersion: 8,
    sourceType: "script",
  });
  // 创建全局作用域
  const globalScope = new Scope("block");
  // 定义module.exports
  const $exports = {};
  const $module = { exports: $exports };
  globalScope.$const("module", $module);
  globalScope.$var("exports", $exports);
  const jsInterpreter = new Interpreter(null, globalScope);
  jsInterpreter.interpret(ast);
  // exports
  const moduleVar = globalScope.$find('module')
  console.log('moduleVar:', moduleVar)
  return moduleVar ? moduleVar.$get().exports : null
}
