import * as ESTree from "estree";
import Interpreter from "../interpreter";

type OpMap = {
  [op in ESTree.BinaryOperator]: (a: any, b: any) => void;
};
// 节点处理器, 节点属性参考 https://astexplorer.net/
const es5 = {
  // 根节点的处理很简单,我们只要对它的body属性进行遍历,然后访问该节点即可。
  Program(nodeIterator: Interpreter<ESTree.Program>) {
    const { node } = nodeIterator;
    console.log("es5:Program", node);
    const res = node.body.map((bodyNode) => {
      console.log("es5:Program:body", bodyNode);
      return nodeIterator.interpret(bodyNode);
    });
    // todo 如何返回多个值
    console.log("es5:Program:res", res);
    return res[0]
  },
  VariableDeclaration() {},
  // 表达式语句节点的处理,同样访问expression 属性即可。
  ExpressionStatement(nodeIterator: Interpreter<ESTree.ExpressionStatement>) {
    const { node } = nodeIterator;
    console.log("es5:ExpressionStatement", node);
    return nodeIterator.interpret(node.expression);
  },
  // 二元运算表达式节点处理
  // 对left/node两个节点(Literal)进行求值,然后实现operator类型运算,返回结果。
  BinaryExpression(nodeIterator: Interpreter<ESTree.BinaryExpression>) {
    const { node } = nodeIterator;
    console.log("es5:BinaryExpression", node);
    const leftNode = nodeIterator.interpret(node.left);
    const rightNode = nodeIterator.interpret(node.right);
    const opMap: OpMap = {
      // todo
      "==": (a: any, b: any) => a + b,
      "!=": (a: any, b: any) => a + b,
      "===": (a: any, b: any) => a + b,
      "!==": (a: any, b: any) => a + b,
      "<": (a: any, b: any) => a + b,
      "<=": (a: any, b: any) => a + b,
      ">": (a: any, b: any) => a + b,
      ">=": (a: any, b: any) => a + b,
      "<<": (a: any, b: any) => a + b,
      ">>": (a: any, b: any) => a + b,
      ">>>": (a: any, b: any) => a + b,
      // done
      "+": (a: any, b: any) => a + b,
      "-": (a: any, b: any) => a + b,
      "*": (a: any, b: any) => a + b,
      "/": (a: any, b: any) => a + b,
      "%": (a: any, b: any) => a + b,
      "**": (a: any, b: any) => a + b,
      "|": (a: any, b: any) => a + b,
      "^": (a: any, b: any) => a + b,
      "&": (a: any, b: any) => a + b,
      in: (a: any, b: any) => a + b,
      instanceof: (a: any, b: any) => a + b,
    };
    return opMap[node.operator](leftNode, rightNode);
  },
  // 字面量节点处理直接求值,这里对正则表达式类型进行了特殊处理,其他类型直接返回value值即可。
  Literal(nodeIterator: Interpreter<ESTree.Literal>) {
    const { node } = nodeIterator;
    console.log("es5:Literal", node);
    // 正则
    if ((<ESTree.RegExpLiteral>node).regex) {
      const { pattern, flags } = (<ESTree.RegExpLiteral>node).regex;
      return new RegExp(pattern, flags);
      // 其他
    } else return node.value;
  },
  MemberExpression() {},
  CallExpression() {},
  Identifier() {},
  FunctionDeclaration() {},
  FunctionExpression() {},
  ArrowFunctionExpression() {},
  SwitchCase() {},
  CatchClause() {},
  VariableDeclarator() {},
  BlockStatement() {},
  EmptyStatement() {},

  DebuggerStatement() {},
  WithStatement() {},
  ReturnStatement() {},
  LabeledStatement() {},

  BreakStatement() {},
  ContinueStatement() {},
  IfStatement() {},
  SwitchStatement() {},

  ThrowStatement() {},
  TryStatement() {},
  WhileStatement() {},
  DoWhileStatement() {},

  ForStatement() {},
  ForInStatement() {},
  ForOfStatement() {},
  Declaration() {},
  ClassDeclaration() {},
  ThisExpression() {},
  ArrayExpression() {},
  ObjectExpression() {},
  YieldExpression() {},
  UnaryExpression() {},

  UpdateExpression() {},
  AssignmentExpression() {},

  LogicalExpression() {},
  ConditionalExpression() {},

  NewExpression() {},
  SequenceExpression() {},
  TemplateLiteral() {},

  TaggedTemplateExpression() {},
  ClassExpression() {},
  MetaProperty() {},

  AwaitExpression() {},
  ImportExpression() {},
  ChainExpression() {},
  PrivateIdentifier() {},
  Property() {},
  PropertyDefinition() {},
  AssignmentProperty() {},
  Super() {},
  TemplateElement() {},
  SpreadElement() {},
  ObjectPattern() {},
  ArrayPattern() {},
  RestElement() {},

  AssignmentPattern() {},
  ClassBody() {},
  Class() {},
  MethodDefinition() {},
  ImportDeclaration() {},
  ExportNamedDeclaration() {},
  ExportDefaultDeclaration() {},
  ExportAllDeclaration() {},
  ImportSpecifier() {},
  ImportDefaultSpecifier() {},
  ImportNamespaceSpecifier() {},

  ExportSpecifier() {},
};

export default es5;
