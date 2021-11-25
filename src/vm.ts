// vm.ts 对外暴露run方法,并使用acorn code->ast后,交给Interpreter实例进行解释。

const acorn = require("acorn");
import Interpreter from "./interpreter";
import { Scope } from "./scope";


export function run(code: string) {
  const ast = acorn.parse(code, {
    ecmaVersion: 8,
    sourceType: "script",
  });
  const globalScope = new Scope('function')
  const jsInterpreter = new Interpreter(null, globalScope);
  return jsInterpreter.interpret(ast);
}