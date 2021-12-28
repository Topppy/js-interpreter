import { run } from "../src/vm";

describe("ji es5 VariableDeclaration", () => {
  // 变量声明
  // test("VariableDeclaration & AssignmentExpression", () => {
  //   expect(
  //     run(
  //       `var age = 2; const age2 = 4; let age3=1; module.exports = age + age2 + age3`
  //     )
  //   ).toBe(7);
  // });
  // object表达式
  // test("VariableDeclaration & AssignmentExpression", () => {
  //   expect(
  //     run(`var age = 2; let bob = { age: 5 }; module.exports = age + bob.age`)
  //   ).toBe(7);
  // });
  // 条件表达式
  test("for loop", () => {
    expect(
      run(`var result = 0;
      for (var i = 0; i < 5; i++) {
        if (result > 5) {
          continue;
        }
        result += 2;
      }
      module.exports = result;`)
    ).toBe(6);
  });
  // 函数声明
});
