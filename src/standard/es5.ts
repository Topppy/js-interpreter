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
  node: ESTree.Pattern | ESTree.Expression | ESTree.PrivateIdentifier,
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

function getFuncName(nodeIterator: Interpreter<ESTree.CallExpression>) {
  const { node } = nodeIterator;
  if (node.callee.type === "MemberExpression") {
    // @ts-ignore
    return node.callee.object.name + "." + node.callee.property.name;
  } else {
    // @ts-ignore
    node.callee.name;
  }
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
    console.log("es5:MemberExpression res:", prop, obj[prop]);
    return obj[prop];
  },
  // 函数/方法调用
  CallExpression(nodeIterator: Interpreter<ESTree.CallExpression>) {
    const { node } = nodeIterator;
    console.log("es5:CallExpression", node);
    // 函数解析，callee指向一个Identifier
    const func = nodeIterator.interpret(node.callee);
    const funcName = getFuncName(nodeIterator);
    if (!func) {
      throw Error(`${funcName} is undefined`);
    }
    // 参数解析
    const args = node.arguments.map((arg) => nodeIterator.interpret(arg));

    // 如果是成员方法调用, callee.object为调用对象Indentifier
    let value;
    if (node.callee.type === "MemberExpression") {
      value = nodeIterator.interpret(node.callee.object);
    }
    // 调用函数的this指向成员， https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
    return func.apply(value, args);
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
    console.log("es5:Identifier", name);
    return variable.$get();
  },
  // 赋值运算符， https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Expressions_and_Operators#%E8%B5%8B%E5%80%BC%E8%BF%90%E7%AE%97%E7%AC%A6
  AssignmentExpressionOperatortraverseMap: {
    "=": ($var, v) => ($var.$set(v), v),
    "+=": ($var, v) => ($var.$set($var.$get() + v), $var.$get()),
    "-=": ($var, v) => ($var.$set($var.$get() - v), $var.$get()),
    "*=": ($var, v) => ($var.$set($var.$get() * v), $var.$get()),
    "/=": ($var, v) => ($var.$set($var.$get() / v), $var.$get()),
    "%=": ($var, v) => ($var.$set($var.$get() % v), $var.$get()),
    "**=": ($var, v) => ($var.$set($var.$get() ** v), $var.$get()),
    "<<=": ($var, v) => ($var.$set($var.$get() << v), $var.$get()),
    ">>=": ($var, v) => ($var.$set($var.$get() >> v), $var.$get()),
    ">>>=": ($var, v) => ($var.$set($var.$get() >>> v), $var.$get()),
    "|=": ($var, v) => ($var.$set($var.$get() | v), $var.$get()),
    "^=": ($var, v) => ($var.$set($var.$get() ^ v), $var.$get()),
    "&=": ($var, v) => ($var.$set($var.$get() & v), $var.$get()),
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
    nodeIterator.scope.$var(node.id?.name || "", func);
    // todo 是否需要
    return func;
  },
  // 函数表达式
  FunctionExpression(
    nodeIterator: Interpreter<
      ESTree.FunctionDeclaration | ESTree.FunctionExpression
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
    defineFunctionName(func, node?.id?.name || "");
    defineFunctionLength(func, node.params.length);

    return func;
  },
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
  CatchClause() {},
  // 箭头函数表达式,this的指向问题, es2015
  ArrowFunctionExpression() {},
  // 变量声明
  VariableDeclarator() {},

  EmptyStatement() {},

  DebuggerStatement() {},
  WithStatement() {},
  LabeledStatement() {},
  // 返回
  ReturnStatement(nodeIterator: Interpreter<ESTree.ReturnStatement>) {
    const { node } = nodeIterator;
    console.log("es5:ReturnStatement", node);
    // 返回值在arguments字段中，没有返回值的话，argument为null
    const val = node.argument
      ? nodeIterator.interpret(node.argument)
      : undefined;
    return new Signal(SignalType.return, val);
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
  // switch-case的每个case节点
  SwitchCase(nodeIterator: Interpreter<ESTree.SwitchCase>) {
    const { node } = nodeIterator;
    console.log("es5: SwitchCase", node);
    // consequent 是要执行的语句， test是满足条件， defaultCase的时候test为空
    const { consequent } = node;
    // 遍历执行每一条语句
    for (let consq of consequent) {
      const re = nodeIterator.interpret(consq);
      // 如果语句执行结果是一个signal的话，提前中断
      if (Signal.isSignal(re)) {
        return re;
      }
    }
  },
  // switch 语句
  SwitchStatement(nodeIterator: Interpreter<ESTree.SwitchStatement>) {
    const { node } = nodeIterator;
    console.log("es5: SwitchStatement", node);
    const { discriminant, cases } = node;
    // switch有自己的作用域
    // const scope = new Scope(ScopeType.block, nodeIterator.scope);
    // 用来判断的表达式的值
    const exp = nodeIterator.interpret(discriminant);
    for (const theCase of cases) {
      // 判断是否满足条件
      let matched = false;
      // test是判断条件， defaultCase的时候test为空
      if (theCase.test === undefined || theCase.test === null) {
        matched = true;
      } else if (
        nodeIterator.interpret(<ESTree.Expression>theCase.test) === exp
      ) {
        matched = true;
      }
      // 如果满足则执行语句
      let res;
      if (matched) {
        res = nodeIterator.interpret(theCase);
        console.log("es5: SwitchStatement matched res", res);
      }
      // 判断执行结果是否为中断信号： break、return
      if (Signal.isBreak(res)) {
        break;
      } else if (Signal.isContinue(res)) {
        continue;
      } else if (Signal.isReturn(res)) {
        return res;
      }
    }
  },

  ThrowStatement() {},
  TryStatement() {},
  WhileStatement(nodeIterator: Interpreter<ESTree.WhileStatement>) {
    const { node } = nodeIterator;
    console.log("es5:WhileStatement", node);
    const { test, body } = node;
    if (!test) throw Error("Uncaught SyntaxError: Unexpected token ')'");
    while (nodeIterator.interpret(test, nodeIterator.scope)) {
      // 作用域
      const whileScope = new Scope(ScopeType.block, nodeIterator.scope);
      // BlockStatement, 处理BlockStatement可能返回的3种中断
      const signal = nodeIterator.interpret(body, whileScope);
      if (Signal.isBreak(signal)) break;
      if (Signal.isContinue(signal)) continue;
      if (Signal.isReturn(signal))
        throw Error("Uncaught SyntaxError: Illegal return statement");
    }
  },
  DoWhileStatement(nodeIterator: Interpreter<ESTree.WhileStatement>) {
    const { node } = nodeIterator;
    console.log("es5:WhileStatement", node);
    const { test, body } = node;
    if (!test) throw Error("Uncaught SyntaxError: Unexpected token ')'");
    do {
      // 作用域
      const whileScope = new Scope(ScopeType.block, nodeIterator.scope);
      // BlockStatement, 处理BlockStatement可能返回的3种中断
      const signal = nodeIterator.interpret(body, whileScope);
      if (Signal.isBreak(signal)) break;
      if (Signal.isContinue(signal)) continue;
      if (Signal.isReturn(signal))
        throw Error("Uncaught SyntaxError: Illegal return statement");
    } while (nodeIterator.interpret(test, nodeIterator.scope));
  },
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
  // forin 遍历，是用来便利KV类型的（不要用在数组上）
  // 会遍历自身 + 原型链上的属性
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...in#array_iteration_and_for...in
  // https://stackoverflow.com/questions/500504/why-is-using-for-in-for-array-iteration-a-bad-idea
  ForInStatement(nodeIterator: Interpreter<ESTree.ForInStatement>) {
    const { node } = nodeIterator;
    console.log("es5:ForInStatement", node);
    const { left, right, body } = node;
    // 临时的块级作用域，left变量在该作用域中声明
    const forScope = new Scope(ScopeType.block, nodeIterator.scope);

    for (const k in nodeIterator.interpret(right)) {
      // 临时的块级作用域，left变量在该作用域中声明
      const forScope = new Scope(ScopeType.block, nodeIterator.scope);
      // left 可以是 Identifier/VariableDeclaration
      let $left;
      if (left.type === "VariableDeclaration") {
        const id = <ESTree.Identifier>left.declarations[0].id;
        // const 需要创建就赋值
        $left = forScope.$declare(left.kind, id.name, k);
      } else if (left.type === "Identifier") {
        // 将k的值更新到left中
        $left = forScope.$find(left.name);
        $left.$set(k);
      } else {
        throw new Error(
          `[ForInStatement] Unsupported left type "${left.type}"`
        );
      }
      // 中断逻辑同ForStatement，执行body的时候需要能访问到left，所以使用forScope
      const signal = nodeIterator.interpret(body, forScope);
      if (Signal.isBreak(signal)) break;
      if (Signal.isContinue(signal)) continue;
      if (Signal.isReturn(signal)) return signal;
    }
  },
  ForOfStatement() {},
  Declaration() {},
  ClassDeclaration() {},
  ThisExpression() {},
  // 数组表达式
  ArrayExpression(nodeIterator: Interpreter<ESTree.ArrayExpression>) {
    const { node } = nodeIterator;
    console.log("es5:ArrayExpression", node);
    let arr = node.elements.map((el) => (el ? nodeIterator.interpret(el) : el));
    return arr;
  },
  // 对象表达式，es5的对象表达式只支持2种：Identifier 和 Literal，Expression是在es2015后支持的
  ObjectExpression(nodeIterator: Interpreter<ESTree.ObjectExpression>) {
    const { node } = nodeIterator;
    console.log("es5:ObjectExpression", node);
    let obj = {};
    node.properties.forEach((prop) => {
      const { key, value } = <ESTree.Property>prop;
      // 属性名, 可以是Identifier 或 Literal
      let keyName;
      // 标识符
      if (key.type === "Identifier") {
        keyName = key.name;
        // 字面量
      } else if (key.type === "Literal") {
        keyName = nodeIterator.interpret(key).$get();
      } else {
        throw new Error(
          `canjs: [ObjectExpression] Unsupported property key type "${key.type}"`
        );
      }
      // 属性值
      const res = nodeIterator.interpret(value);
      // todo
      // @ts-ignore
      obj[keyName] = res;
    });
    return obj;
  },
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
  // 如何解析source呢？文件/包从哪里导入？
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
