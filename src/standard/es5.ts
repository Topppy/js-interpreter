import * as ESTree from "estree";
import Interpreter from "../interpreter";
import Scope, { ScopeType } from "../scope";
import Signal, { SignalType } from "../signal";
import { PropVar, Var } from "../variable";
import { defineFunctionName, defineFunctionLength } from "../utils";

type OpMap = {
  [op in ESTree.BinaryOperator]: (a: any, b: any) => void;
};

type AssignmentExpressionOperatortraverseMapType = {
  [op in ESTree.AssignmentOperator]: ($var: Var | PropVar, v: any) => any;
};

/**
 * LHS查询
 * @param node 节点
 * @param nodeIterator 节点的上级表达式的遍历器
 * @returns
 */
function getIdentifierOrMemberExpressionValue(
  node: ESTree.Pattern | ESTree.Expression,
  nodeIterator: Interpreter<ESTree.Expression>
) {
  let $var;
  if (node.type === "Identifier") {
    // 标识符类型 直接查找
    $var = nodeIterator.scope.$find(node.name);
  } else if (node.type === "MemberExpression") {
    // 成员表达式类型,处理方式跟上面差不多,不同的是这边需要自定义一个变量对象的实现
    const { object, property, computed } = node;
    const obj = nodeIterator.interpret(object, nodeIterator.scope);
    const prop = computed
      ? nodeIterator.interpret(property, nodeIterator.scope)
      : (<ESTree.Identifier>property).name;
    $var = new PropVar(obj, prop);
    console.log("es5:AssignmentExpression MemberExpression", $var, obj, prop);
  } else {
    throw new Error(
      `canjs: Not support to get value of node type "${(<any>node).type}"`
    );
  }
  return $var;
}
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
    // console.log("es5:Program:res", res);
    // return res[0];
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
      // 如果当前是块级作用域且变量用var定义且父作用域存在(不是最顶层作用域)，则定义到父级作用域
      if (scope.type === "block" && kind === "var" && scope.parent) {
        scope.parent.$declare(kind, key, value);
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
  // 二元运算表达式节点处理， https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Expressions_and_Operators
  // 对left/node两个节点(Literal)进行求值,然后实现operator类型运算,返回结果。
  BinaryExpression(nodeIterator: Interpreter<ESTree.BinaryExpression>) {
    const { node } = nodeIterator;
    console.log("es5:BinaryExpression", node);
    const leftNode = nodeIterator.interpret(node.left);
    const rightNode = nodeIterator.interpret(node.right);
    const opMap: OpMap = {
      "==": (a: any, b: any) => a == b,
      "!=": (a: any, b: any) => a != b,
      "===": (a: any, b: any) => a === b,
      "!==": (a: any, b: any) => a !== b,
      "<": (a: any, b: any) => a < b,
      "<=": (a: any, b: any) => a <= b,
      ">": (a: any, b: any) => a > b,
      ">=": (a: any, b: any) => a >= b,
      "<<": (a: any, b: any) => a << b,
      ">>": (a: any, b: any) => a >> b,
      ">>>": (a: any, b: any) => a >>> b, // https://juejin.cn/post/6844903969915944973
      "+": (a: any, b: any) => a + b,
      "-": (a: any, b: any) => a - b,
      "*": (a: any, b: any) => a * b,
      "/": (a: any, b: any) => a / b,
      "%": (a: any, b: any) => a % b,
      "**": (a: any, b: any) => a ** b,
      "|": (a: any, b: any) => a | b,
      "^": (a: any, b: any) => a ^ b,
      "&": (a: any, b: any) => a & b,
      in: (a: any, b: any) => a in b,
      instanceof: (a: any, b: any) => a instanceof b,
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
    const { node, scope } = nodeIterator;
    console.log("es5:MemberExpression", node);
    // object: 引用对象的表达式节点
    // property: 属性名称
    // computed:
    //   true: 使用 [] 引用，要求property: Expression
    //   false: 使用 . 来引用，要求property：Identifier
    const { object, property, computed } = node;
    const prop = computed
      ? nodeIterator.interpret(property, scope)
      : (<ESTree.Identifier>property).name;
    // 解析出来对象
    const obj = nodeIterator.interpret(object);
    return obj[prop];
  },
  // 函数/方法调用
  CallExpression(nodeIterator: Interpreter<ESTree.CallExpression>) {
    const { node } = nodeIterator;
    console.log("es5:CallExpression", node);
    // 函数解析
    const func = nodeIterator.interpret(node.callee)
    // 参数
    const args = node.arguments.map(arg => nodeIterator.interpret(arg))

    // 如果是成员方法调用
    let value
    if (node.callee.type === 'MemberExpression') {
      value = nodeIterator.interpret(node.callee.object)
    }
    // 指定调用对象this， https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
    return func.apply(value, args)

  },
  // 标识符节点
  Identifier(nodeIterator: Interpreter<ESTree.Identifier>) {
    // 标识符节点,我们只要通过访问作用域,访问该值即可。
    const { node, scope } = nodeIterator;
    const name = node.name;
    // walk identifier
    // 这个例子中查找的是age变量
    const variable = scope.$find(name);
    // 返回的是定义的变量对象(age)的值value,即18
    console.log("es5:Identifier", node, variable, variable.$get());
    return variable.$get();
  },
  // 赋值运算符， https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Expressions_and_Operators#%E8%B5%8B%E5%80%BC%E8%BF%90%E7%AE%97%E7%AC%A6
  AssignmentExpressionOperatortraverseMap: {
    "=": ($var, v) => ($var.$set(v), v),
    "+=": ($var, v) => ($var.$set(v + $var.$get()), $var.$get()),
    "-=": ($var, v) => ($var.$set(v - $var.$get()), $var.$get()),
    "*=": ($var, v) => ($var.$set(v * $var.$get()), $var.$get()),
    "/=": ($var, v) => ($var.$set(v / $var.$get()), $var.$get()),
    "%=": ($var, v) => ($var.$set(v % $var.$get()), $var.$get()),
    "**=": ($var, v) => ($var.$set(v ** $var.$get()), $var.$get()),
    "<<=": ($var, v) => ($var.$set(v << $var.$get()), $var.$get()),
    ">>=": ($var, v) => ($var.$set(v >> $var.$get()), $var.$get()),
    ">>>=": ($var, v) => ($var.$set(v >>> $var.$get()), $var.$get()),
    "|=": ($var, v) => ($var.$set(v | $var.$get()), $var.$get()),
    "^=": ($var, v) => ($var.$set(v ^ $var.$get()), $var.$get()),
    "&=": ($var, v) => ($var.$set(v & $var.$get()), $var.$get()),
  } as AssignmentExpressionOperatortraverseMapType,
  // 赋值表达式
  AssignmentExpression(nodeIterator: Interpreter<ESTree.AssignmentExpression>) {
    const { node, scope } = nodeIterator;
    console.log("es5:AssignmentExpression", node);
    const { left, operator, right } = node;
    // AssignmentExpression 有两种可能： Identifier /  MemberExpression
    // “讲得更准确一点，RHS查询与简单地查找某个变量的值别无二致，而LHS查询则是试图找到变量的容器本身，从而可以对其赋值。
    // “赋值操作的目标是谁（LHS）”以及“谁是赋值操作的源头（RHS），https://segmentfault.com/a/1190000015618701
    // LHS
    let $var = getIdentifierOrMemberExpressionValue(left, nodeIterator);
    // RHS
    // 不同操作符处理,查询到right节点值,对left节点进行赋值。
    const res =
      nodeIterator.nodeHandler.AssignmentExpressionOperatortraverseMap[
        operator
      ]($var, nodeIterator.interpret(right, scope));
    console.log("AssignmentExpression res: ", res);
    return res;
  },
  // 函数声明
  FunctionDeclaration(nodeIterator: Interpreter<ESTree.FunctionDeclaration>) {
    const { node } = nodeIterator;
    console.log("es5:FunctionDeclaration", node);
    const func = nodeIterator.nodeHandler.FunctionExpression(nodeIterator);
    nodeIterator.scope.$var(node.id?.name  || '', func);
    // todo 是否需要
    return func
  },
  // 函数表达式
  FunctionExpression(
    nodeIterator: Interpreter<
      ESTree.FunctionExpression | ESTree.FunctionDeclaration
    >
  ) {
    const { node } = nodeIterator;
    console.log("es5:FunctionExpression", node);
    /**
     * 1、定义函数需要先为其定义一个函数作用域，且允许继承父级作用域
     * 2、注册`this`, `arguments`和形参到作用域的变量空间
     * 3、检查return关键字
     * 4、定义函数名和长度
     */
    const func = function (this: any, ...args: any[]) {
      const scope = new Scope(ScopeType.function, nodeIterator.scope);
      scope.$const("this", this);
      scope.$const("arguments", args);
      node.params.forEach((param, idx) => {
        const { name } = <ESTree.Identifier>param;
        scope.$const(name, args[idx]);
      });
      // 执行函数body
      const signal = nodeIterator.interpret(node.body, scope);
      // 如果有函数返回中断，返回中断的值
      if (Signal.isReturn(signal)) {
        return signal.val;
      }
    };
    // 定义函数名和长度
    defineFunctionName(func,  node.id?.name || '')
    defineFunctionLength(func, node.params.length )

    return func
  },
  ArrowFunctionExpression() {},
  SwitchCase() {},
  CatchClause() {},
  VariableDeclarator() {},
  // 块级作用域，场景：for循环
  BlockStatement(nodeIterator: Interpreter<ESTree.BlockStatement>) {
    const { node } = nodeIterator;
    console.log("es5:BlockStatement:body", node);
    // 创建块级作用域， 带上父级作用域
    const blockScope = new Scope(ScopeType.block, nodeIterator.scope);
    // 提取关键字（return, break, continue），有任何一种中断，直接return
    for (let i = 0; i < node.body.length; i++) {
      const signal = nodeIterator.interpret(node.body[i], blockScope);
      if (Signal.isSignal(signal)) {
        return signal;
      }
    }
  },
  EmptyStatement() {},

  DebuggerStatement() {},
  WithStatement() {},
  LabeledStatement() {},
  ReturnStatement(nodeIterator: Interpreter<ESTree.BreakStatement>) {
    console.log("es5:ReturnStatement");
    return new Signal(SignalType.return);
  },
  // 循环中断
  BreakStatement(nodeIterator: Interpreter<ESTree.BreakStatement>) {
    console.log("es5:BreakStatement");
    return new Signal(SignalType.break);
  },
  ContinueStatement(nodeIterator: Interpreter<ESTree.ContinueStatement>) {
    console.log("es5:ContinueStatement");
    return new Signal(SignalType.continue);
  },
  // 条件判断语句
  IfStatement(nodeIterator: Interpreter<ESTree.IfStatement>) {
    const { node } = nodeIterator;
    console.log("es5:IfStatement", node);
    // test 为条件表达式， 返回true执行consequent， false执行alternate
    const { test, consequent, alternate } = node;
    if (nodeIterator.interpret(test)) {
      return nodeIterator.interpret(consequent);
    } else if (alternate) {
      // alternate可以不存在，即无else从句
      // alternate可以是 IfStatement，即 else if从句
      return nodeIterator.interpret(alternate);
    }
  },
  // switch 语句
  SwitchStatement() {},

  ThrowStatement() {},
  TryStatement() {},
  WhileStatement() {},
  DoWhileStatement() {},
  // for 循环语句节点
  ForStatement(nodeIterator: Interpreter<ESTree.ForStatement>) {
    const { node } = nodeIterator;
    console.log("es5:ForStatement", node);
    const { init, test, update, body } = node;
    // 这里需要注意的是需要模拟创建一个块级作用域
    // 前面Scope类实现,var声明在块作用域中会被提升,const/let不会
    const forScope = new Scope(ScopeType.block, nodeIterator.scope);
    for (
      // 初始化值
      // VariableDeclaration
      init ? nodeIterator.interpret(init, forScope) : null;
      // 循环判断条件(BinaryExpression)
      // 二元运算表达式
      test ? nodeIterator.interpret(test, forScope) : true;
      // 变量更新语句(UpdateExpression)
      update ? nodeIterator.interpret(update, forScope) : null
    ) {
      // BlockStatement, 处理BlockStatement可能返回的3种中断
      const signal = nodeIterator.interpret(body, forScope);
      if (Signal.isBreak(signal)) break;
      if (Signal.isContinue(signal)) continue;
      if (Signal.isReturn(signal)) return signal;
    }
  },
  ForInStatement() {},
  ForOfStatement() {},
  Declaration() {},
  ClassDeclaration() {},
  ThisExpression() {},
  ArrayExpression() {},
  // todo
  ObjectExpression() {},
  YieldExpression() {},
  UnaryExpression() {},

  // update 运算表达式节点（for循环），即 ++/--，和一元运算符类似，只是 operator 指向的节点对象类型不同，这里是 update 运算符。
  UpdateExpression(nodeIterator: Interpreter<ESTree.UpdateExpression>) {
    const { node } = nodeIterator;
    console.log("es5:UpdateExpression", node);
    // update 运算符，值为 ++ 或 --，配合 update 表达式节点的 prefix 属性来表示前后。
    const { operator, argument, prefix } = node;
    let $var = getIdentifierOrMemberExpressionValue(argument, nodeIterator);
    let val = $var.$get();
    // 更新节点的值
    operator === "++" ? $var.$set(val + 1) : $var.$set(val - 1);
    // todo 这里可能抽复用 一元运算符
    if (operator === "++" && prefix) {
      return ++val;
    } else if (operator === "++" && !prefix) {
      return val++;
    } else if (operator === "--" && prefix) {
      return --val;
    } else {
      return val--;
    }
  },

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
