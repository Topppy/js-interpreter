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
    return res[0];
  },
  // 变量声明
  VariableDeclaration(nodeIterator: Interpreter<ESTree.VariableDeclaration>) {
    const { node, scope } = nodeIterator;
    console.log("es5:VariableDeclaration", node, scope);
    const { declarations, kind } = node;
    // 上面提到,生声明可能存在多个描述(let a = 1, b = 2;),所以我们这里对它进行遍历:
    // 这里遍历出来的每个item是VariableDeclarator节点
    declarations.forEach((declar) => {
      const { id, init } = <ESTree.VariableDeclarator>declar;
      // 变量名称节点,这里拿到的是age
      const key = (<ESTree.Identifier>id).name;
      // 判断变量是否进行了初始化 ? 查找init节点值(Literal类型直接返回值:18) : 置为undefined;
      const value = init ? nodeIterator.interpret(init) : undefined;
      // 根据不同的kind(var/const/let)声明进行定义,即var age = 18
      // 在作用域当中定义变量
      // 如果当前是块级作用域且变量用var定义，则定义到父级作用域
      if (scope.type === "block" && kind === "var") {
        scope.parent?.$declare(kind, key, value);
      } else {
        scope.$declare(kind, key, value);
      }
    });
  },
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
  // 成员节点表达式
  MemberExpression(nodeIterator: Interpreter<ESTree.MemberExpression>) {
    const { node, scope } = nodeIterator
    // object: 引用对象的表达式节点
    // property: 属性名称
    // computed: 
    //   true: 使用 [] 引用，要求property: Expression
    //   false: 使用 . 来引用，要求property：Identifier
    const { object, property, computed } = node
    const prop = computed ? nodeIterator.interpret(property, scope): (<ESTree.Identifier>property).name
    // 解析出来对象
    const obj = nodeIterator.interpret(object)
    return obj[prop]
  },
  CallExpression() {},
  Identifier(nodeIterator: Interpreter<ESTree.Identifier>) {
    // 标识符节点,我们只要通过访问作用域,访问该值即可。
    const { node, scope } = nodeIterator;
    console.log("es5:Identifier", nodeIterator);
    const name = node.name;
    // walk identifier
    // 这个例子中查找的是age变量
    const variable = scope.$find(name);
    // 返回的是定义的变量对象(age)的值,即18
    return variable;
  },
  // 赋值表达式
  AssignmentExpression(nodeIterator: Interpreter<ESTree.AssignmentExpression>) {
    const { node, scope } = nodeIterator
    // AssignmentExpression 有两种可能： Pattern | MemberExpression;
    // “讲得更准确一点，RHS查询与简单地查找某个变量的值别无二致，而LHS查询则是试图找到变量的容器本身，从而可以对其赋值。”https://segmentfault.com/a/1190000015618701
  },
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
