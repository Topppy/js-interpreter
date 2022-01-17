import {ScopeVar} from "./variable";
// js es5标准库，提供es5所支持的内置对象/方法
export default {
  console: new ScopeVar("var", console),
};
