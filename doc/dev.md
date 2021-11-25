## 开发记录文档
### 初始化 ts 项目

```
yarn add -D typescript

npx tsc --init

```

### module循环引用undefined

在写节点遍历器的时候，节点处理器内会递归调用节点遍历方法evluate，形成循环引用，报错该方法undifined