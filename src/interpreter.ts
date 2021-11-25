// AST遍历器
import * as ESTree from "estree";
import { Scope } from "./scope";
import es5 from "./standard/es5";

const VISITOR = {
  ...es5,
};

class Interpreter <T extends ESTree.Node|null> {
  node: T ;
  scope: Scope;
  nodeHandler: typeof VISITOR;

  constructor(node: T , scope: Scope) {
    this.node = node;
    this.scope = scope;
    this.nodeHandler = VISITOR;
  }
  interpret(node: ESTree.Node, scope?: Scope):any {
    const curScope = scope || this.scope
    const nodeIterator = new Interpreter(node, curScope)
    const _eval = nodeIterator.nodeHandler[node.type]
    if (!_eval) {
      throw new Error(`canjs: Unknown node type "${node.type}".`)
    }
    // @ts-ignore
    return _eval(nodeIterator)
  }
}

export default Interpreter;
