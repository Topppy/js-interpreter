# js 解释器 demo

> 背景: 业务上陆续搞了几个在线编程游戏，涉及 python、C++、blockly，核心都是的 web 在线将其他语言转 AST 再 js 解释，运行 game，所以自己练练手 js 解释器

## 使用

[demo](https://topppy.github.io/js-interpreter/demo/index.html)

demo用例：
```
<script src="./dist/ji.js"></script>
<script>
  var re = ji.run("var re = 3+4;console.log(re); module.exports=re");
</script>
```

函数签名：
```
/**
 * 
 * @param code string 代码
 * @param context 预置运行环境
 * @returns 
 */
function run(code:string, context?: Context){}


interface Context {
  [key: string]: function
}
```

例如：
```
const code = "var result = a(4); module.exports = result;"
const injectContext = {
  a: (res) => {
    return res + 10;
  },
}
ji.run(code, injectContext)
```

## 开发流程

```
// 首次
yarn install

// test/index.test.js 撰写本次开发feature测试用例,
// 写代码，并执行本次开发特性的测试用例
yarn test:dev

// 开发完特性之后，归档test/index.test.js测试用例到对应的xxfeature.test.js

```

## 测试

```
yarn test
```

## todo

- [x] Program
- [x] VariableDeclaration
- [x] ExpressionStatement
- [x] BinaryExpression
- [x] Literal
- [x] MemberExpression
- [x] CallExpression
- [x] Identifier
- [x] AssignmentExpressionOperatortraverseMap
- [x] AssignmentExpression
- [x] FunctionDeclaration
- [x] FunctionExpression
- [x] BlockStatement
- [ ] CatchClause
- [ ] ArrowFunctionExpression
- [ ] VariableDeclarator
- [ ] EmptyStatement
- [ ] DebuggerStatement
- [ ] WithStatement
- [ ] LabeledStatement
- [x] ReturnStatement
- [x] BreakStatement
- [x] ContinueStatement
- [x] IfStatement
- [x] SwitchCase
- [x] SwitchStatement
- [ ] ThrowStatement
- [ ] TryStatement
- [ ] WhileStatement
- [ ] DoWhileStatement
- [x] ForStatement
- [x] ForInStatement
- [ ] ForOfStatement
- [ ] Declaration
- [ ] ClassDeclaration
- [ ] ThisExpression
- [x] ArrayExpression
- [x] ObjectExpression
- [ ] YieldExpression
- [ ] UnaryExpression
- [x] UpdateExpression
- [ ] LogicalExpression
- [ ] ConditionalExpression
- [ ] NewExpression
- [ ] SequenceExpression
- [ ] TemplateLiteral
- [ ] TaggedTemplateExpression
- [ ] ClassExpression
- [ ] MetaProperty
- [ ] AwaitExpression
- [ ] ImportExpression
- [ ] ChainExpression
- [ ] PrivateIdentifier
- [ ] Property
- [ ] PropertyDefinition
- [ ] AssignmentProperty
- [ ] Super
- [ ] TemplateElement
- [ ] SpreadElement
- [ ] ObjectPattern
- [ ] ArrayPattern
- [ ] RestElement
- [ ] AssignmentPattern
- [ ] ClassBody
- [ ] Class
- [ ] MethodDefinition
- [ ] ImportDeclaration
- [ ] ExportNamedDeclaration
- [ ] ExportDefaultDeclaration
- [ ] ExportAllDeclaration
- [ ] ImportSpecifier
- [ ] ImportDefaultSpecifier
- [ ] ImportNamespaceSpecifier
- [ ] ExportSpecifier

## 参考：

- https://www.digitalocean.com/community/tutorials/typescript-new-project
- 用 js 写一个 js 解释器：https://juejin.cn/post/6898093501376905230
- 前端与编译原理——用 JS 写一个 JS 解释器：https://segmentfault.com/a/1190000017241258
- AST explorer：https://astexplorer.net/
- AST 类型表：https://juejin.cn/post/6844903798347939853
- https://www.lhsz.xyz/read/llvm-guide-zh/Chapter02-README.md
- https://segmentfault.com/a/1190000015618701
- [jest 过滤 console](https://stackoverflow.com/questions/44467657/jest-better-way-to-disable-console-inside-unit-tests)
- [Scope](https://developer.mozilla.org/zh-CN/docs/Glossary/Scope)
