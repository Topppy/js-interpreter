# js 解释器 demo

> 背景: 业务上陆续搞了几个在线编程游戏，涉及 python、C++、blockly，核心都是的 web 在线将其他语言转 AST 再 js 解释，运行 game，所以自己练练手 js 解释器

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