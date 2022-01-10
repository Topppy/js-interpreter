import * as ESTree from "estree";
import Scope from "./scope";

export type EvaluateFunc = (node: ESTree.Node, scope: Scope) => any;
