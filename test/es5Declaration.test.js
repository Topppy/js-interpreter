import { run } from "../src/vm";

describe("es5 Declaration", () => {
  // 变量声明
  test("VariableDeclaration & AssignmentExpression", () => {
    expect(
      run(
        `var age = 2; const age2 = 4; let age3=1; module.exports = age + age2 + age3`
      )
    ).toBe(7);
  });
  // object表达式
  test("VariableDeclaration & AssignmentExpression", () => {
    expect(
      run(`var age = 2; let bob = { age: 5 }; module.exports = age + bob.age`)
    ).toBe(7);
  });
  // 函数声明
  test("function Declaration", () => {
    expect(
      run(`var result = 0;
      function a() {
        for (var i = 0; i < 5; i++) {
          result += 2;
          return;
        }
      }
      a();
      module.exports = result;`)
    ).toBe(2);
  });
  // 函数表达式
  test("FunctionExpression", () => {
    expect(
      run(`var result = 0;
      const a = function() {
        for (var i = 0; i < 5; i++) {
          result += 2;
          return;
        }
      }
      a();
      module.exports = result;`)
    ).toBe(2);
  });
});
